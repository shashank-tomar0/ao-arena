// Package league provides persistent match history and ELO standings for the
// arena. Records are stored as JSON on disk (default arena_data/league.json),
// so a season survives server restarts — a real league table, not a session
// scratchpad.
//
// Every record is sealed into a tamper-evident trust ledger: each record
// carries the hash of everything before it, chained. Editing any historical
// record breaks every chain hash after it — and the season's genesis hash is
// the published anchor. The league is a blockchain that doesn't need a
// blockchain.
package league

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

// Kind of a record.
const (
	KindMatch = "match"
	KindAudit = "audit"
)

// MatchRecord is one completed head-to-head (or standalone audit). The
// PrevHash/ChainHash pair seals it into the trust ledger.
type MatchRecord struct {
	ID         string    `json:"id"`
	Kind       string    `json:"kind"`
	SpecID     string    `json:"spec_id,omitempty"`
	FleetA     string    `json:"fleet_a"`
	FleetB     string    `json:"fleet_b"`
	ScoreA     float64   `json:"score_a"`
	ScoreB     float64   `json:"score_b"`
	Winner     string    `json:"winner"`
	Summary    string    `json:"summary"`
	DurationMS int64     `json:"duration_ms"`
	CreatedAt  time.Time `json:"created_at"`

	// Receipt is the tamper-evident receipt hash of the referee verdict
	// (audits: the verdict's own receipt; matches: the winner's receipt).
	Receipt string `json:"receipt,omitempty"`

	// Verdict / VerdictA / VerdictB persist the full referee verdict JSON
	// so any verdict can be re-rendered and re-verified later (shareable
	// receipt pages, replay).
	Verdict   json.RawMessage `json:"verdict,omitempty"`
	VerdictA  json.RawMessage `json:"verdict_a,omitempty"`
	VerdictB  json.RawMessage `json:"verdict_b,omitempty"`

	// Events is the ordered broadcast timeline of the match (session cards,
	// referee findings, scores) — the raw material for replay.
	Events []json.RawMessage `json:"events,omitempty"`

	// Trust-ledger seal.
	ChainIndex int    `json:"chain_index,omitempty"`
	PrevHash   string `json:"prev_hash,omitempty"`
	ChainHash  string `json:"chain_hash,omitempty"`
}

// Standing is one fleet's season record.
type Standing struct {
	Name    string  `json:"name"`
	ELO     float64 `json:"elo"`
	Wins    int     `json:"wins"`
	Losses  int     `json:"losses"`
	Draws   int     `json:"draws"`
	Matches int     `json:"matches"`
}

// ChainStatus describes the health of the trust ledger.
type ChainStatus struct {
	Verified bool   `json:"verified"`
	Length   int    `json:"length"`
	Genesis  string `json:"genesis"`
	BrokenAt int    `json:"broken_at,omitempty"`
}

// Store persists matches and computes standings.
type Store struct {
	mu      sync.Mutex
	path    string
	records []MatchRecord
}

// eloK is the rating-change constant (FIDE-style K=32).
const eloK = 32.0

// NewStore opens (or creates) the on-disk store. An empty path selects the
// default arena_data/league.json relative to the working directory.
func NewStore(path string) (*Store, error) {
	if path == "" {
		path = filepath.Join("arena_data", "league.json")
	}
	s := &Store{path: path}
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return s, nil // fresh season
		}
		return nil, err
	}
	if len(data) > 0 {
		if err := json.Unmarshal(data, &s.records); err != nil {
			return nil, err
		}
		// Migration: records written before the ledger existed have no
		// chain hashes. Seal them now so the whole season is verifiable.
		if len(s.records) > 0 && s.records[0].ChainHash == "" {
			if err := s.rebuildChain(); err != nil {
				return nil, err
			}
		}
	}
	return s, nil
}

// Record appends a match, seals it into the trust ledger, and persists.
func (s *Store) Record(m MatchRecord) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if m.CreatedAt.IsZero() {
		m.CreatedAt = time.Now().UTC()
	}
	prev := ""
	if len(s.records) > 0 {
		prev = s.records[len(s.records)-1].ChainHash
	}
	m.ChainIndex = len(s.records)
	m.PrevHash = prev
	m.ChainHash = seal(prev, m)
	s.records = append(s.records, m)
	return s.persist()
}

// seal computes the chain hash of one record given the previous chain hash.
func seal(prev string, m MatchRecord) string {
	var sb strings.Builder
	sb.WriteString(prev)
	sb.WriteString("|")
	sb.WriteString(m.Kind)
	sb.WriteString("|")
	sb.WriteString(m.ID)
	sb.WriteString("|")
	sb.WriteString(m.Winner)
	sb.WriteString("|")
	fmt.Fprintf(&sb, "%0.3f|%0.3f|%s|%s", m.ScoreA, m.ScoreB, m.Receipt, m.Summary)
	// The verdicts are the core evidence — their bytes are part of the seal.
	// They are compacted first so the seal is stable across JSON
	// re-indentation on persist/reload.
	for _, v := range [][]byte{m.Verdict, m.VerdictA, m.VerdictB} {
		if len(v) > 0 {
			var b bytes.Buffer
			if err := json.Compact(&b, v); err == nil {
				sb.Write(b.Bytes())
			}
		}
	}
	sum := sha256.Sum256([]byte(sb.String()))
	return hex.EncodeToString(sum[:])
}

// rebuildChain seals every record in storage order (migration + repair).
func (s *Store) rebuildChain() error {
	prev := ""
	for i := range s.records {
		s.records[i].ChainIndex = i
		s.records[i].PrevHash = prev
		s.records[i].ChainHash = seal(prev, s.records[i])
		prev = s.records[i].ChainHash
	}
	return s.persist()
}

// VerifyChain re-derives the trust ledger from record contents and reports
// whether every seal holds. A tampered record (edited score, summary,
// verdict, receipt, or chain field) breaks its own seal and everything after.
func (s *Store) VerifyChain() ChainStatus {
	s.mu.Lock()
	defer s.mu.Unlock()
	st := ChainStatus{Length: len(s.records)}
	if len(s.records) == 0 {
		st.Verified = true
		return st
	}
	st.Genesis = s.records[0].ChainHash
	prev := ""
	for i := range s.records {
		if s.records[i].ChainHash != seal(prev, s.records[i]) {
			st.BrokenAt = i
			return st
		}
		prev = s.records[i].ChainHash
	}
	st.Verified = true
	return st
}

// Genesis returns the first record's chain hash — the season's published
// anchor. The empty string means the season has no records yet.
func (s *Store) Genesis() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.records) == 0 {
		return ""
	}
	return s.records[0].ChainHash
}

// FindByReceipt returns the first record whose receipt matches the given
// hash — either the record-level receipt or the receipt embedded in a
// persisted verdict (used by shareable /r/<receipt> verdict pages).
func (s *Store) FindByReceipt(receipt string) *MatchRecord {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.records {
		r := s.records[i]
		if r.Receipt == receipt || verdictReceipt(r.Verdict) == receipt ||
			verdictReceipt(r.VerdictA) == receipt || verdictReceipt(r.VerdictB) == receipt {
			cp := r
			return &cp
		}
	}
	return nil
}

// verdictReceipt extracts the receipt_hash field from a persisted verdict
// JSON blob without a full unmarshal.
func verdictReceipt(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}
	var v struct {
		ReceiptHash string `json:"receipt_hash"`
	}
	if err := json.Unmarshal(raw, &v); err != nil {
		return ""
	}
	return v.ReceiptHash
}

// History returns records newest-first, capped at limit (0 = all).
func (s *Store) History(limit int) []MatchRecord {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]MatchRecord, len(s.records))
	copy(out, s.records)
	// newest first
	sort.SliceStable(out, func(i, j int) bool { return out[i].CreatedAt.After(out[j].CreatedAt) })
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out
}

// Count returns the number of stored records.
func (s *Store) Count() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.records)
}

// eloExpected is the standard ELO expected-score function.
func eloExpected(ra, rb float64) float64 {
	return 1 / (1 + math.Pow(10, (rb-ra)/400))
}

// eloDelta applies K-factor scaling to a result (1 win, 0 loss, 0.5 draw).
func eloDelta(ra, rb, result float64) float64 {
	return eloK * (result - eloExpected(ra, rb))
}

// Standings computes ELO standings from all records using real expected-score
// math: beating a strong fleet moves you more than beating a weak one, and a
// loss to a much stronger fleet costs less. Audits don't affect ratings.
func (s *Store) Standings() []Standing {
	s.mu.Lock()
	defer s.mu.Unlock()

	type acc struct {
		elo     float64
		wins    int
		losses  int
		draws   int
		matches int
	}
	table := map[string]*acc{}

	applyMatch := func(nameA, nameB string, scoreA, scoreB float64, winner string) {
		a := table[nameA]
		if a == nil {
			a = &acc{elo: 1000}
			table[nameA] = a
		}
		b := table[nameB]
		if b == nil {
			b = &acc{elo: 1000}
			table[nameB] = b
		}
		var resA, resB float64
		switch winner {
		case "draw":
			resA, resB = 0.5, 0.5
		case nameA:
			resA = 1
		case nameB:
			resB = 1
		}
		da := eloDelta(a.elo, b.elo, resA)
		db := eloDelta(b.elo, a.elo, resB)
		a.elo += da
		b.elo += db
		a.matches++
		b.matches++
		switch {
		case resA == 1:
			a.wins++
			b.losses++
		case resB == 1:
			a.losses++
			b.wins++
		default:
			a.draws++
			b.draws++
		}
	}

	for _, m := range s.records {
		if m.Kind == KindAudit {
			continue
		}
		applyMatch(m.FleetA, m.FleetB, m.ScoreA, m.ScoreB, m.Winner)
	}

	standings := make([]Standing, 0, len(table))
	for name, a := range table {
		standings = append(standings, Standing{
			Name:    name,
			ELO:     a.elo,
			Wins:    a.wins,
			Losses:  a.losses,
			Draws:   a.draws,
			Matches: a.matches,
		})
	}
	sort.SliceStable(standings, func(i, j int) bool {
		if standings[i].ELO != standings[j].ELO {
			return standings[i].ELO > standings[j].ELO
		}
		return standings[i].Name < standings[j].Name
	})
	return standings
}

// Reset wipes the store (used by tests and the reset endpoint).
func (s *Store) Reset() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.records = nil
	return s.persist()
}

func (s *Store) persist() error {
	if s.path == "" {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(s.path), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(s.records, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, data, 0o644)
}
