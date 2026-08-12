// Live fleet runner: drives real AO daemons and sessions for a match.
// Each competing fleet gets an isolated AO instance (own data dir + port);
// the orchestrator spawns sessions on a task repo, watches them to PR,
// feeds the referee the resulting diff, and broadcasts progress live.
package arena

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/shashank-tomar0/ao-arena/internal/ao"
	"github.com/shashank-tomar0/ao-arena/internal/broadcast"
	"github.com/shashank-tomar0/ao-arena/internal/referee"
	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

// LiveRunner is the live-match driver. It owns the AO daemon manager and the
// broadcast hub, and drives real agent sessions to a verdict.
type LiveRunner struct {
	Manager *ao.Manager
	Hub     *broadcast.Hub
	Engine  *referee.Engine
	aoBin   string
}

// NewLiveRunner builds a live match runner.
func NewLiveRunner(aoBin string, hub *broadcast.Hub) *LiveRunner {
	return &LiveRunner{
		Manager: ao.NewManager(filepath.Join(os.TempDir(), "ao-arena")),
		Hub:     hub,
		Engine:  referee.NewEngine(nil),
		aoBin:   aoBin,
	}
}

// SpawnFleet starts an isolated AO daemon + one session for a fleet.
// It returns the session ID (or an error). The task is the first message
// injected into the session; the daemon watches it to PR.
func (r *LiveRunner) SpawnFleet(ctx context.Context, fleet, task, workdir string) (string, error) {
	// Isolated daemon per fleet — the "stadium".
	dp, err := r.Manager.StartDaemon(ctx, fleet, r.aoBin)
	if err != nil {
		return "", fmt.Errorf("start daemon for %s: %w", fleet, err)
	}
	c := dp.Client

	// Register the task repo as a project AO can work in.
	projectRes, err := c.CreateProject(ctx, workdir)
	if err != nil {
		return "", fmt.Errorf("create project for %s: %w", fleet, err)
	}

	// Spawn the orchestrator session for this fleet.
	id, err := c.Spawn(ctx, ao.SpawnParams{
		ProjectID: projectRes.ID,
		Agent:     "claude-code", // default worker; overridable per fleet later
		Task:      task,
	})
	if err != nil {
		return "", fmt.Errorf("spawn session for %s: %w", fleet, err)
	}

	// Broadcast the new session card immediately (live board).
	r.Hub.BroadcastSession(broadcast.SessionCard{
		ID:     id,
		Fleet:  fleet,
		Label:  "claude-code",
		Branch: "main",
		Status: "working",
		TS:     time.Now().UnixMilli(),
	})

	// Watch the session until it opens a PR or times out.
	go r.watchPR(ctx, fleet, id)
	return id, nil
}

// watchPR polls a session until it leaves "working", or the match timeout.
// A PR ref on the session means work landed; we broadcast the status change
// for the live board and stop.
func (r *LiveRunner) watchPR(ctx context.Context, fleet, id string) {
	c := r.Manager.Client(fleet)
	if c == nil {
		return
	}
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s, err := c.SessionStatus(ctx, id)
			if err != nil {
				continue
			}
			// Broadcast every status change as a card motion.
			r.Hub.BroadcastSession(broadcast.SessionCard{
				ID:     id,
				Fleet:  fleet,
				Label:  "claude-code",
				Branch: shortBranch(s),
				Status: s.Status,
				TS:     time.Now().UnixMilli(),
			})
			// If work landed (PR ref set), feed the referee the diff.
			if s.PRRef != "" {
				diff := r.fetchDiff(ctx, fleet, s.PRRef)
				if diff != "" {
					pr := &referee.PRContext{
						Repo:  "arena/" + fleet,
						PRRef: s.PRRef,
						Diff:  diff,
					}
					out, err := r.Engine.Run(ctx, pr)
					if err == nil && out.Verdict != nil {
						r.Hub.BroadcastReferee(broadcast.RefereeEvent{
							Fleet:    fleet,
							Severity: string(topSeverity(out.Verdict.Findings)),
							Category: "referee-verdict",
							Message:  out.Verdict.Summary,
							TS:       time.Now().UnixMilli(),
						})
					}
				}
				return
			}
		}
	}
}

// fetchDiff retrieves the PR diff from the fleet's daemon (VCS-backed).
func (r *LiveRunner) fetchDiff(ctx context.Context, fleet, prRef string) string {
	c := r.Manager.Client(fleet)
	if c == nil {
		return ""
	}
	// AO's daemon doesn't expose a raw diff route in v1; read from the
	// worktree if present. For the demo we fall back to the accepted
	// "live" path: the CLI fetches the PR diff from GitHub.
	// TODO(live): AO daemon diff route or worktree path resolution.
	return ""
}

// severities returns the severities of findings, defaulting to info.
func severities(fs []verdict.Finding) []verdict.Severity {
	if len(fs) == 0 {
		return []verdict.Severity{verdict.SeverityInfo}
	}
	out := make([]verdict.Severity, len(fs))
	for i, f := range fs {
		out[i] = f.Severity
	}
	return out
}

func shortBranch(s *ao.Session) string {
	if s == nil {
		return "main"
	}
	if s.PRRef != "" {
		return s.PRRef
	}
	if s.Status != "" {
		return s.Status
	}
	return "main"
}

// topSeverity returns the highest severity among findings.
func topSeverity(fs []verdict.Finding) verdict.Severity {
	max := verdict.SeverityInfo
	for _, f := range fs {
		switch f.Severity {
		case verdict.SeverityCritical:
			return verdict.SeverityCritical
		case verdict.SeverityWarning:
			if max != verdict.SeverityCritical {
				max = verdict.SeverityWarning
			}
		}
	}
	return max
}
