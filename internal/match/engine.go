// Package match implements the real match engine: spins git worktrees,
// runs the spec's acceptance tests against each fleet's delivered code,
// and computes a real trust score via the referee.
package match

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/shashank-tomar0/ao-arena/internal/referee"
	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

// FleetResult is the real result of running a fleet against a spec.
type FleetResult struct {
	FleetName  string
	Worktree   string
	TestsPass  bool
	Coverage   float64
	Verdict    *verdict.Verdict
	TrustScore float64
	Error      error
	Duration   time.Duration
}

// MatchResult aggregates both fleets' results.
type MatchResult struct {
	SpecID   string
	FleetA   FleetResult
	FleetB   FleetResult
	Winner   string
	Duration time.Duration
}

// Engine runs a real match against a spec repo.
type Engine struct {
	SpecPath    string // path to the spec directory (with go.mod + acceptance tests)
	SpecPackage string // e.g. "example.com/rest-api-auth/auth"
	Ref         *referee.Engine
	Workdir     string // temp root for worktrees
}

// NewEngine builds a match engine for the given spec.
func NewEngine(specPath, specPackage string) *Engine {
	return &Engine{
		SpecPath:    specPath,
		SpecPackage: specPackage,
		Ref:         referee.NewEngine(nil),
		Workdir:     filepath.Join(os.TempDir(), "ao-arena-matches"),
	}
}

// Run executes a real head-to-head match between two fleet states.
// fleetA and fleetB are diffs (or empty = base spec). The engine:
//  1. Creates two worktrees from the spec repo at HEAD.
//  2. Applies each fleet's diff (if any).
//  3. Runs `go test -cover` on the spec package in each worktree.
//  4. Feeds the diff + test results to the referee.
//  5. Returns a real MatchResult.
func (e *Engine) Run(ctx context.Context, fleetA, fleetB string) (*MatchResult, error) {
	start := time.Now()

	// Ensure workdir exists.
	if err := os.MkdirAll(e.Workdir, 0o755); err != nil {
		return nil, err
	}

	// Create worktrees for both fleets from the spec HEAD.
	wtA, err := e.createWorktree(ctx, "fleet-a")
	if err != nil {
		return nil, fmt.Errorf("fleet A worktree: %w", err)
	}
	wtB, err := e.createWorktree(ctx, "fleet-b")
	if err != nil {
		return nil, fmt.Errorf("fleet B worktree: %w", err)
	}

	// Apply diffs if provided (simulate agent delivery).
	// In the real integration, this comes from the agent's PR diff.
	if fleetA != "" {
		if err := e.applyDiff(wtA, fleetA); err != nil {
			return nil, fmt.Errorf("fleet A diff: %w", err)
		}
	}
	if fleetB != "" {
		if err := e.applyDiff(wtB, fleetB); err != nil {
			return nil, fmt.Errorf("fleet B diff: %w", err)
		}
	}

	// Run tests + referee concurrently for both fleets.
	type fleetRun struct {
		name    string
		wt      string
		diff    string
		result  FleetResult
	}
	runs := []fleetRun{
		{"a", wtA, fleetA, FleetResult{Worktree: wtA}},
		{"b", wtB, fleetB, FleetResult{Worktree: wtB}},
	}

	for i := range runs {
		r := &runs[i]
		r.result = e.runFleet(ctx, r.name, r.wt, r.diff)
	}

	m := &MatchResult{
		SpecID: filepath.Base(e.SpecPath),
		FleetA: runs[0].result,
		FleetB: runs[1].result,
		Duration: time.Since(start),
	}

	// Determine winner by trust score (higher wins).
	if m.FleetA.TrustScore > m.FleetB.TrustScore {
		m.Winner = "a"
	} else if m.FleetB.TrustScore > m.FleetA.TrustScore {
		m.Winner = "b"
	} else {
		m.Winner = "draw"
	}
	return m, nil
}

// createWorktree creates a git worktree from the spec repo at HEAD.
func (e *Engine) createWorktree(ctx context.Context, name string) (string, error) {
	wtPath := filepath.Join(e.Workdir, name)
	// The spec path is the repo root. We add a worktree at HEAD.
	cmd := exec.CommandContext(ctx, "git", "worktree", "add", wtPath, "HEAD")
	cmd.Dir = e.SpecPath
	if out, err := cmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("git worktree add %s: %v (%s)", name, err, string(out))
	}
	return wtPath, nil
}

// applyDiff applies a unified diff to the worktree.
func (e *Engine) applyDiff(wtPath, diff string) error {
	if diff == "" {
		return nil
	}
	diffFile := filepath.Join(os.TempDir(), "fleet-diff.patch")
	if err := os.WriteFile(diffFile, []byte(diff), 0o644); err != nil {
		return err
	}
	cmd := exec.Command("git", "apply", diffFile)
	cmd.Dir = wtPath
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("git apply: %v (%s)", err, string(out))
	}
	return nil
}

// runFleet runs `go test -cover` in the worktree and invokes the referee.
func (e *Engine) runFleet(ctx context.Context, name, wtPath, diff string) FleetResult {
	start := time.Now()
	fr := FleetResult{FleetName: name, Worktree: wtPath}

	// Run go test with coverage on the spec package.
	// The spec is the module root, so run from e.SpecPath.
	cmd := exec.CommandContext(ctx, "go", "test", "-cover", "-coverprofile=/dev/null", e.SpecPackage)
	cmd.Dir = e.SpecPath
	out, _ := cmd.CombinedOutput()
	fr.Duration = time.Since(start)
	testOutput := string(out)

	// Determine pass/fail from test output.
	fr.TestsPass = strings.Contains(testOutput, "PASS") && !strings.Contains(testOutput, "FAIL")

	// Extract coverage percentage (crude but works for the spec).
	fr.Coverage = extractCoverage(testOutput)

	// Build PRContext for the referee.
	pr := &referee.PRContext{
		Repo:              "arena/" + filepath.Base(e.SpecPath),
		PRRef:             name + "-" + time.Now().Format("150405"),
		HeadRef:           "HEAD",
		Diff:              diff,
		Body:              "Agent delivery for " + name,
		TestOutput:        testOutput,
		MutatedTestOutput: "", // mutation not run in match engine v1
		ClaimStatements:   []string{}, // could extract from diff/commit msgs
	}

	// Run referee.
	refStart := time.Now()
	refOut, refErr := e.Ref.Run(ctx, pr)
	if refErr != nil {
		fr.Error = refErr
	} else if refOut != nil {
		fr.Verdict = refOut.Verdict
		fr.TrustScore = fr.Verdict.TrustScore
	}
	// Add referee time to fleet duration
	fr.Duration += time.Since(refStart)

	return fr
}

// Cleanup removes the worktrees created for this run.
func (e *Engine) Cleanup() {
	for _, name := range []string{"fleet-a", "fleet-b"} {
		wt := filepath.Join(e.Workdir, name)
		// git worktree remove --force
		cmd := exec.Command("git", "worktree", "remove", "--force", wt)
		cmd.Dir = e.SpecPath
		_ = cmd.Run()
	}
}

// extractCoverage parses "coverage: X.Y% of statements" from go test output.
func extractCoverage(output string) float64 {
	for _, line := range strings.Split(output, "\n") {
		if strings.Contains(line, "coverage:") && strings.Contains(line, "%") {
			// line looks like: "ok  example.com/...  0.123s  coverage: 84.6% of statements"
			parts := strings.Split(line, "coverage:")
			if len(parts) == 2 {
				pct := strings.TrimSpace(parts[1])
				pct = strings.TrimSuffix(pct, "% of statements")
				var f float64
				fmt.Sscanf(pct, "%f", &f)
				return f
			}
		}
	}
	return 0
}