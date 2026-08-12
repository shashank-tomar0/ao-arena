// Package league provides persistent match history and ELO standings for the
// arena. Records are stored as JSON on disk (default arena_data/league.json),
// so a season survives server restarts — a real league table, not a session
// scratchpad.
package league

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

// Kind of a record.
const (
	KindMatch = "match"
	KindAudit = "audit"
)

// MatchRecord is one completed head-to-head (or standalone audit).
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

// Store persists matches and computes standings.
type Store struct {
	mu      sync.Mutex
	path    string
	records []MatchRecord
}

// eloK is the rating-change constant (FIDE-style K=32 for new players).
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
	}
	return s, nil
}

// Record appends a match and persists to disk.
func (s *Store) Record(m MatchRecord) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if m.CreatedAt.IsZero() {
		m.CreatedAt = time.Now().UTC()
	}
	s.records = append(s.records, m)
	return s.persist()
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

// Standings computes ELO standings from all records. Fleet names are the two
// competitors of a match; audits don't affect ratings.
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

	apply := func(name string, delta float64, result string) {
		a := table[name]
		if a == nil {
			a = &acc{elo: 1000}
			table[name] = a
		}
		a.elo += delta
		a.matches++
		switch result {
		case "win":
			a.wins++
		case "loss":
			a.losses++
		default:
			a.draws++
		}
	}

	for _, m := range s.records {
		if m.Kind == KindAudit {
			continue
		}
		switch m.Winner {
		case "draw":
			apply(m.FleetA, 0, "draw")
			apply(m.FleetB, 0, "draw")
		case m.FleetA:
			apply(m.FleetA, eloK, "win")
			apply(m.FleetB, -eloK, "loss")
		case m.FleetB:
			apply(m.FleetA, -eloK, "loss")
			apply(m.FleetB, eloK, "win")
		}
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
