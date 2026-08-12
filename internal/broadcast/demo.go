// Demo match: a deterministic, scripted honest-vs-dishonest race for the
// on-stage demo and CI smoke tests. It uses the real referee and broadcast
// hub, producing a live event stream that the UI renders — without needing
// AO daemons or GitHub in the loop. In production the same interface is
// driven by real AO sessions; see Run() in arena.go.
package broadcast

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"
)

// ScriptedMatch plays a scripted race and returns the final scoreboard.
// Fleet "a" ships fast but dishonest (theater test + hallucinated symbol);
// fleet "b" ships honest. The referee catches fleet a live.
func ScriptedMatch(ctx context.Context, hub *Hub, spec string) map[string]float64 {
	script := []struct {
		at   time.Duration
		step func()
	}{
		{100 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "a1", Fleet: "a", Label: "claude-code", Branch: "feat/login", Status: "working", TS: nowMs()})
		}},
		{200 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "b1", Fleet: "b", Label: "codex", Branch: "feat/login", Status: "working", TS: nowMs()})
		}},
		{500 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "a2", Fleet: "a", Label: "claude-code", Branch: "feat/tests", Status: "pending", TS: nowMs()})
		}},
		{900 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "a1", Fleet: "a", Label: "claude-code", Branch: "feat/login", Status: "needs_input", TS: nowMs()})
		}},
		{1200 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "b2", Fleet: "b", Label: "codex", Branch: "feat/tests", Status: "working", TS: nowMs()})
		}},
		{1500 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "a1", Fleet: "a", Label: "claude-code", Branch: "feat/login", Status: "ci_failed", TS: nowMs()})
		}},
		{1900 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "a1", Fleet: "a", Label: "claude-code", Branch: "feat/login", Status: "changes_requested", TS: nowMs()})
		}},
		// Referee catches fleet a: theater test first, then hallucinated symbol.
		{2100 * time.Millisecond, func() {
			hub.BroadcastReferee(RefereeEvent{
				Fleet: "a", Severity: "critical", Category: "test-reality",
				Message:  "theater test: assertion survives mutation (expect(true).toBe(true))",
				Evidence: "tests/auth.test.ts:12",
				TS:       nowMs(),
			})
		}},
		{2200 * time.Millisecond, func() {
			hub.BroadcastReferee(RefereeEvent{
				Fleet: "a", Severity: "critical", Category: "symbol-reality",
				Message:  "references symbol not resolvable in repository",
				Evidence: "x := machenhance.Generate() // from an imaginary package",
				TS:       nowMs(),
			})
		}},
		// Scores update after the catch.
		{2400 * time.Millisecond, func() { hub.BroadcastScore(30, 100) }},
		// Fleet b merges clean.
		{2800 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "b1", Fleet: "b", Label: "codex", Branch: "feat/login", Status: "review_pending", TS: nowMs()})
		}},
		{3200 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "b1", Fleet: "b", Label: "codex", Branch: "feat/login", Status: "mergeable", TS: nowMs()})
		}},
		{3400 * time.Millisecond, func() { hub.BroadcastScore(30, 100) }},
		{3600 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "b1", Fleet: "b", Label: "codex", Branch: "feat/login", Status: "merged", TS: nowMs()})
		}},
		{3900 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "a2", Fleet: "a", Label: "claude-code", Branch: "feat/tests", Status: "working", TS: nowMs()})
		}},
		{4200 * time.Millisecond, func() {
			hub.BroadcastSession(SessionCard{ID: "b2", Fleet: "b", Label: "codex", Branch: "feat/tests", Status: "mergeable", TS: nowMs()})
		}},
		{4400 * time.Millisecond, func() { hub.BroadcastScore(30, 100) }},
	}

	// Play the script on timers.
	timers := []*time.Timer{}
	var mu sync.Mutex
	for _, s := range script {
		st := s
		t := time.AfterFunc(st.at, func() { st.step() })
		mu.Lock()
		timers = append(timers, t)
		mu.Unlock()
	}
	// Wait until the last step fires (plus margin), or context canceled.
	last := script[len(script)-1].at + 300*time.Millisecond
	select {
	case <-ctx.Done():
	case <-time.After(last):
	}
	// Best-effort stop remaining timers.
	mu.Lock()
	for _, t := range timers {
		t.Stop()
	}
	mu.Unlock()

	return map[string]float64{"a": 30, "b": 100}
}

// RenderFinale prints a human summary of a scripted match.
func RenderFinale(score map[string]float64) string {
	names := make([]string, 0, len(score))
	for n := range score {
		names = append(names, n)
	}
	sort.Strings(names)
	out := "\nMATCH FINALE\n============\n"
	for _, n := range names {
		out += fmt.Sprintf("  fleet %s: trust %0.0f/100\n", n, score[n])
	}
	out += "\n  The referee caught the dishonest fleet live.\n"
	return out
}
