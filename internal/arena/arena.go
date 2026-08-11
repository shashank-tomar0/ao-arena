// Package arena orchestrates agent-fleet matches: fleet construction,
// spec-driven challenges, referee scoring, ELO, and the league table.
package arena

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/shashank-tomar0/ao-arena/internal/ao"
	"github.com/shashank-tomar0/ao-arena/internal/referee"
	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

// Fleet is one competitor: a named collection of agent sessions working an
// isolated AO daemon.
type Fleet struct {
	Name     string     `json:"name"`
	Daemon   *ao.Client `json:"-"`
	Sessions []string   `json:"sessions"`
}

// Spec is a challenge: a repo path with SPEC.md + acceptance tests.
type Spec struct {
	ID        string        `json:"id"`
	Name      string        `json:"name"`
	RepoDir   string        `json:"repo_dir"`
	AcceptCmd string        `json:"accept_cmd"`
	Timeout   time.Duration `json:"timeout"`
}

// MatchResult is the outcome of one head-to-head.
type MatchResult struct {
	MatchID   string               `json:"match_id"`
	SpecID    string               `json:"spec_id"`
	StartedAt time.Time            `json:"started_at"`
	EndedAt   time.Time            `json:"ended_at"`
	Fleets    map[string]*FleetRun `json:"fleets"`
	Winner    string               `json:"winner"`
	Delta     map[string]int       `json:"delta"`
	Log       []string             `json:"log"`
}

// FleetRun is one fleet's performance in a match.
type FleetRun struct {
	Fleet     string           `json:"fleet"`
	PRRef     string           `json:"pr_ref"`
	Verdict   *verdict.Verdict `json:"verdict"`
	Passed    bool             `json:"passed"`
	TimeTaken time.Duration    `json:"time_taken"`
	Mergeable bool             `json:"mergeable"`
	Score     float64          `json:"score"`
}

// fleetRunResult is an internal type for collecting results from goroutines.
type fleetRunResult struct {
	name string
	fr   *FleetRun
	err  error
}

// MatchRunner executes matches. It is the "referee's desk".
type MatchRunner struct {
	mu      sync.Mutex
	engine  *referee.Engine
	timeout time.Duration
	log     *Logger
}

// Logger buffers match narration for the broadcast layer + CLI.
type Logger struct {
	mu sync.Mutex
	ls []string
}

func (l *Logger) Add(s string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.ls = append(l.ls, s)
}

func (l *Logger) Snapshot() []string {
	l.mu.Lock()
	defer l.mu.Unlock()
	out := make([]string, len(l.ls))
	copy(out, l.ls)
	return out
}

// NewRunner builds a match runner.
func NewRunner(engine *referee.Engine, timeout time.Duration) *MatchRunner {
	return &MatchRunner{
		engine:  engine,
		timeout: timeout,
		log:     &Logger{},
	}
}

// Run executes one match between fleets on a spec.
func (r *MatchRunner) Run(ctx context.Context, spec *Spec, fleets map[string]*Fleet) (*MatchResult, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	m := &MatchResult{
		MatchID:   fmt.Sprintf("m-%d", time.Now().UnixNano()),
		SpecID:    spec.ID,
		StartedAt: time.Now(),
		Fleets:    map[string]*FleetRun{},
		Delta:     map[string]int{},
	}

	r.log.Add(fmt.Sprintf("match %s started on spec %q with %d fleets", m.MatchID, spec.Name, len(fleets)))

	// Each fleet's PR is built by the first session; the referee audits it.
	results := make(chan fleetRunResult, len(fleets))
	for name, f := range fleets {
		go func(name string, f *Fleet) {
			fr := &FleetRun{Fleet: name}
			if len(f.Sessions) == 0 {
				fr.Verdict = &verdict.Verdict{Summary: "no sessions spawned; forfeit", TrustScore: 0}
				results <- fleetRunResult{name, fr, nil}
				return
			}
			// Lead session owns the PR; the referee audits that PR.
			ctx2, cancel := context.WithTimeout(ctx, r.timeout)
			defer cancel()
			pr := &referee.PRContext{
				Repo:    "arena/" + spec.ID,
				PRRef:   fmt.Sprintf("%s-%s", name, m.MatchID),
				HeadRef: f.Sessions[0],
				// In production these come from the VCS client; for the
				// arena v1 the referee runs against live diffs fetched from AO.
			}
			out, err := r.engine.Run(ctx2, pr)
			if err != nil {
				fr.Verdict = &verdict.Verdict{TrustScore: 0, Summary: "referee error: " + err.Error()}
				results <- fleetRunResult{name, fr, err}
				return
			}
			fr.Verdict = out.Verdict
			fr.Mergeable = out.Verdict.Mergeable
			fr.Passed = fr.Mergeable
			fr.Score = out.Verdict.TrustScore
			fr.TimeTaken = time.Duration(out.Verdict.DurationMS) * time.Millisecond
			results <- fleetRunResult{name, fr, nil}
		}(name, f)
	}

	var runs []fleetRunResult
	for i := 0; i < len(fleets); i++ {
		rr := <-results
		runs = append(runs, rr)
		m.Fleets[rr.name] = rr.fr
		s := rr.fr.Score
		if rr.fr.Verdict != nil {
			s = rr.fr.Verdict.TrustScore
		}
		r.log.Add(fmt.Sprintf("fleet %s verdict: trust=%0.1f mergeable=%v", rr.name, s, rr.fr.Mergeable))
	}

	m.EndedAt = time.Now()
	m.Winner = pickWinner(runs)

	// ELO-style delta: +16 win, -16 loss, draw 0 (v1 flat constant).
	const eloStep = 16
	for _, rr := range runs {
		if rr.name == m.Winner {
			m.Delta[rr.name] = eloStep
		} else {
			m.Delta[rr.name] = -eloStep
		}
	}
	r.log.Add(fmt.Sprintf("match %s complete: winner %s", m.MatchID, m.Winner))
	return m, nil
}

func pickWinner(runs []fleetRunResult) string {
	if len(runs) == 0 {
		return ""
	}
	sort.SliceStable(runs, func(i, j int) bool { return runs[i].fr.Score > runs[j].fr.Score })
	top := runs[0]
	for _, rr := range runs {
		if rr.fr.Score == top.fr.Score && rr.name != top.name {
			return "draw"
		}
	}
	return top.name
}

// TotalDelta aggregates ELO deltas across a season for a team name.
func TotalDelta(deltas map[string]int) int {
	total := 0
	for _, d := range deltas {
		total += d
	}
	return total
}

// LeagueTable renders the standings from accumulated match results.
func LeagueTable(results []*MatchResult) string {
	table := map[string]int{}
	for _, m := range results {
		for name, delta := range m.Delta {
			table[name] += delta
		}
	}
	type row struct {
		name string
		pts  int
	}
	var rows []row
	for name, pts := range table {
		rows = append(rows, row{name, pts})
	}
	sort.SliceStable(rows, func(i, j int) bool { return rows[i].pts > rows[j].pts })
	out := "\nSEASON STANDINGS\n================\n"
	for i, r := range rows {
		out += fmt.Sprintf("%2d. %-16s %4d\n", i+1, r.name, r.pts)
	}
	return out
}
