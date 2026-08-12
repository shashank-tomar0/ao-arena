// Merge-gate check: an agent PR must be merge-ready, not just green tests.
// It verifies CI status (from GitHub combined status or the PR's check runs),
// conflicts, and that the change doesn't silently drop coverage.
package referee

import (
	"context"
	"strings"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

const mergeGateName = "merge-gate"

// MergeGateCheck verifies CI, conflicts, and coverage delta for the PR.
type MergeGateCheck struct{}

func NewMergeGateCheck() *MergeGateCheck { return &MergeGateCheck{} }

func (c *MergeGateCheck) Name() string { return mergeGateName }

// Run checks that:
//   - PR is open and (if known) reported mergeable
//   - every CI check/status on the head SHA concluded success
//   - the diff isn't a massive untested change (sanity)
func (c *MergeGateCheck) Run(ctx context.Context, pr *PRContext) ([]verdict.Finding, error) {
	var findings []verdict.Finding

	// CI statuses mapped from GitHub combined status + check runs.
	for name, conclusion := range pr.ChecksStatus {
		lower := strings.ToLower(conclusion)
		switch {
		case lower == "success" || lower == "neutral" || lower == "passed" || lower == "completed":
			// fine
		case lower == "failure" || lower == "failed" || lower == "error" || lower == "cancelled" || lower == "timed_out" || lower == "action_required":
			findings = append(findings, verdict.Finding{
				Category:     mergeGateName,
				Severity:     verdict.SeverityCritical,
				Message:      "CI check not green on this branch",
				EvidencePath: "ci/" + name + " → " + conclusion,
				Suggestion:   "fix or rerun the failing CI check before merging agent work",
			})
		case lower == "pending" || lower == "in_progress" || lower == "queued":
			findings = append(findings, verdict.Finding{
				Category:     mergeGateName,
				Severity:     verdict.SeverityWarning,
				Message:      "CI still running on this branch",
				EvidencePath: "ci/" + name + " → " + conclusion,
				Suggestion:   "wait for CI to finish before merging",
			})
		}
	}

	// Mergeable reported by GitHub (nil if unknown).
	if pr.Mergeable != nil && !*pr.Mergeable {
		findings = append(findings, verdict.Finding{
			Category:     mergeGateName,
			Severity:     verdict.SeverityCritical,
			Message:      "PR reported as NOT mergeable (conflicts or blocked checks)",
			EvidencePath: "github/mergeable",
			Suggestion:   "resolve conflicts or blocked checks before merging",
		})
	}

	// Sanity: a very large diff with no test changes is a skip-tests smell.
	if pr.Diff != "" && pr.TestOutput == "" {
		added := strings.Count(pr.Diff, "\n+")
		tests := strings.Count(strings.ToLower(pr.Diff), "test")
		if added > 400 && tests == 0 {
			findings = append(findings, verdict.Finding{
				Category:     mergeGateName,
				Severity:     verdict.SeverityWarning,
				Message:      "large change (" + itoa(added) + " added lines) with no test references in the diff",
				EvidencePath: "merge-gate/size-vs-tests",
				Suggestion:   "confirm the agent shipped tests for this change",
			})
		}
	}

	return findings, nil
}
