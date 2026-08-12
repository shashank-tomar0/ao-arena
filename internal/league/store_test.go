package league

import (
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

	// A: +32 -32 = 1000, 2 matches (1W 1L). C: 1000 + 32 = 1032 (1W).
	a := byName["A"]
	if a.ELO != 1000 || a.Wins != 1 || a.Losses != 1 || a.Matches != 2 {
		t.Errorf("A standings wrong: %+v", a)
	}
	c := byName["C"]
	if c.ELO != 1032 || c.Wins != 1 {
		t.Errorf("C standings wrong: %+v", c)
	}
	b := byName["B"]
	if b.ELO != 968 || b.Losses != 1 {
		t.Errorf("B standings wrong: %+v", b)
	}

	// Sorted by ELO desc: C first.
	if st[0].Name != "C" {
		t.Errorf("expected C on top, got %+v", st[0])
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
