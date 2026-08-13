package league

import (
	"encoding/json"
	"math"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestStorePersistenceRoundTrip(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "league.json")

	s, err := NewStore(path)
	if err != nil {
		t.Fatalf("NewStore: %v", err)
	}
	if s.Count() != 0 {
		t.Fatalf("fresh store should be empty, got %d", s.Count())
	}

	now := time.Now().UTC()
	if err := s.Record(MatchRecord{
		ID: "m-1", Kind: KindMatch, SpecID: "rest-api-auth",
		FleetA: "Fleet A", FleetB: "Fleet B",
		ScoreA: 100, ScoreB: 40, Winner: "a",
		CreatedAt: now,
	}); err != nil {
		t.Fatalf("Record: %v", err)
	}

	// Reopen from disk — the record must survive.
	s2, err := NewStore(path)
	if err != nil {
		t.Fatalf("reopen: %v", err)
	}
	if s2.Count() != 1 {
		t.Fatalf("expected 1 record after reopen, got %d", s2.Count())
	}
	h := s2.History(10)
	if len(h) != 1 || h[0].ID != "m-1" {
		t.Fatalf("history mismatch: %+v", h)
	}
}

func TestStandingsELO(t *testing.T) {
	dir := t.TempDir()
	s, err := NewStore(filepath.Join(dir, "league.json"))
	if err != nil {
		t.Fatalf("NewStore: %v", err)
	}

	// Fleet A wins round 1, loses round 2 to fleet C.
	base := time.Now().UTC()
	_ = s.Record(MatchRecord{ID: "m1", Kind: KindMatch, FleetA: "A", FleetB: "B", Winner: "A", CreatedAt: base})
	_ = s.Record(MatchRecord{ID: "m2", Kind: KindMatch, FleetA: "A", FleetB: "C", Winner: "C", CreatedAt: base.Add(time.Minute)})
	// Audits don't touch ratings.
	_ = s.Record(MatchRecord{ID: "a1", Kind: KindAudit, FleetA: "Audit", FleetB: "pr-1", Winner: "blocked", CreatedAt: base.Add(2 * time.Minute)})

	st := s.Standings()
	if len(st) != 3 {
		t.Fatalf("expected 3 standings entries, got %d: %+v", len(st), st)
	}
	byName := map[string]Standing{}
	for _, x := range st {
		byName[x.Name] = x
	}

	// Real ELO with expected score:
	//  m1 A(1000) beats B(1000): expected 0.5 → A +16 = 1016, B -16 = 984.
	//  m2 A(1016) loses to C(1000): expected_A = 1/(1+10^-0.04) ≈ 0.52301
	//     → A -16.736 ≈ 999.26, C +16.736 ≈ 1016.74.
	a := byName["A"]
	if math.Abs(a.ELO-999.26) > 0.01 || a.Wins != 1 || a.Losses != 1 || a.Matches != 2 {
		t.Errorf("A standings wrong: %+v", a)
	}
	c := byName["C"]
	if math.Abs(c.ELO-1016.74) > 0.01 || c.Wins != 1 {
		t.Errorf("C standings wrong: %+v", c)
	}
	b := byName["B"]
	if math.Abs(b.ELO-984) > 0.01 || b.Losses != 1 {
		t.Errorf("B standings wrong: %+v", b)
	}

	// Sorted by ELO desc: C first.
	if st[0].Name != "C" {
		t.Errorf("expected C on top, got %+v", st[0])
	}
}

func TestTrustLedgerChain(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "league.json")
	s, err := NewStore(path)
	if err != nil {
		t.Fatalf("NewStore: %v", err)
	}

	// An empty season verifies trivially.
	if st := s.VerifyChain(); !st.Verified || st.Length != 0 {
		t.Fatalf("empty chain should verify, got %+v", st)
	}

	base := time.Now().UTC()
	_ = s.Record(MatchRecord{ID: "m1", Kind: KindMatch, FleetA: "A", FleetB: "B", Winner: "A", Receipt: "r1", Summary: "a wins", CreatedAt: base})
	_ = s.Record(MatchRecord{ID: "m2", Kind: KindMatch, FleetA: "A", FleetB: "C", Winner: "C", Receipt: "r2", Summary: "c wins", CreatedAt: base.Add(time.Minute)})
	_ = s.Record(MatchRecord{ID: "a1", Kind: KindAudit, FleetA: "Audit", FleetB: "pr-1", Winner: "blocked", Receipt: "r3", CreatedAt: base.Add(2 * time.Minute)})

	st := s.VerifyChain()
	if !st.Verified || st.Length != 3 || st.Genesis == "" {
		t.Fatalf("chain should verify after 3 records, got %+v", st)
	}

	// Tamper with the middle record's summary: every seal from there on
	// must break.
	s.mu.Lock()
	s.records[1].Summary = "rewritten history"
	s.mu.Unlock()
	st = s.VerifyChain()
	if st.Verified {
		t.Fatalf("tampered chain must not verify, got %+v", st)
	}
	if st.BrokenAt != 1 {
		t.Fatalf("expected break at index 1, got %+v", st)
	}

	// Receipt lookup powers shareable /r/<receipt> pages.
	if r := s.FindByReceipt("r2"); r == nil || r.ID != "m2" {
		t.Fatalf("FindByReceipt(r2) = %+v", r)
	}
	if r := s.FindByReceipt("nope"); r != nil {
		t.Fatalf("FindByReceipt(nope) should be nil")
	}

	// Full verdict persistence round-trips.
	s2, _ := NewStore(path)
	_ = s2.Record(MatchRecord{ID: "m3", Kind: KindAudit, FleetA: "Audit", FleetB: "pr-2", Winner: "blocked", Receipt: "r4", Verdict: json.RawMessage(`{"trust_score": 40}`), CreatedAt: base.Add(3 * time.Minute)})
	s3, _ := NewStore(path)
	found := s3.FindByReceipt("r4")
	if found == nil || len(found.Verdict) == 0 {
		t.Fatalf("verdict persistence failed: %+v", found)
	}
	var stored struct {
		TrustScore float64 `json:"trust_score"`
	}
	if err := json.Unmarshal(found.Verdict, &stored); err != nil || stored.TrustScore != 40 {
		t.Fatalf("verdict content wrong: %+v (err %v)", found.Verdict, err)
	}
	if st := s3.VerifyChain(); !st.Verified {
		t.Fatalf("chain should verify after reopen, got %+v", st)
	}
}

func TestReset(t *testing.T) {
	dir := t.TempDir()
	s, _ := NewStore(filepath.Join(dir, "league.json"))
	_ = s.Record(MatchRecord{ID: "m1", Kind: KindMatch, FleetA: "A", FleetB: "B", Winner: "A"})
	if s.Count() != 1 {
		t.Fatalf("expected 1")
	}
	if err := s.Reset(); err != nil {
		t.Fatalf("reset: %v", err)
	}
	if s.Count() != 0 {
		t.Fatalf("expected 0 after reset, got %d", s.Count())
	}
	_ = os.RemoveAll(dir)
}
