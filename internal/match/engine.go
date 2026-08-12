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

// Engine runs a real match. It works against a git worktree of the repo,
// and runs the spec's Go tests from the spec directory within that worktree.
type Engine struct {
	RepoPath    string // path to the git repo root
	SpecRelPath string // e.g. "specs/rest-api-auth" (relative to repo root)
	SpecPackage string // e.g. "example.com/rest-api-auth/auth"
	Ref         *referee.Engine
	Workdir     string // temp root for worktrees
}

// NewEngine builds a match engine. repoPath is the git repo root;
// specRel is the spec directory relative to it; specPkg is the Go package
// under test.
func NewEngine(repoPath, specRel, specPkg string) *Engine {
	return &Engine{
		RepoPath:    repoPath,
		SpecRelPath: specRel,
		SpecPackage: specPkg,
		Ref:         referee.NewEngine(nil),
		Workdir:     filepath.Join(os.TempDir(), "ao-arena-matches"),
	}
}

// Run executes a real head-to-head match between two fleet states.
// fleetA and fleetB are optional unified diffs. The engine:
//  1. Creates two worktrees from the repo at HEAD.
//  2. Runs `go test -cover` on the spec package in each worktree.
//  3. Computes a real trust score via the referee.
//
// Returns a real MatchResult.
func (e *Engine) Run(ctx context.Context, fleetA, fleetB string) (*MatchResult, error) {
	start := time.Now()

	// Normalize the workdir to an absolute path and force-clean leftovers.
	abs, err := filepath.Abs(e.Workdir)
	if err != nil {
		return nil, fmt.Errorf("resolve workdir: %w", err)
	}
	e.Workdir = abs
	for _, name := range []string{"fleet-a", "fleet-b"} {
		if err := e.removeWorktree(name); err != nil {
			return nil, fmt.Errorf("cleanup %s worktree: %w", name, err)
		}
	}
	if err := os.MkdirAll(e.Workdir, 0o755); err != nil {
		return nil, err
	}

	wtA, err := e.createWorktree(ctx, "fleet-a")
	if err != nil {
		return nil, fmt.Errorf("fleet A worktree: %w", err)
	}
	wtB, err := e.createWorktree(ctx, "fleet-b")
	if err != nil {
		return nil, fmt.Errorf("fleet B worktree: %w", err)
	}

	// spec dir inside each worktree
	specA := filepath.Join(wtA, filepath.FromSlash(e.SpecRelPath))
	specB := filepath.Join(wtB, filepath.FromSlash(e.SpecRelPath))

	// Apply diffs (agent delivery) if provided.
	if fleetA != "" {
		if err := e.applyDiff(specA, fleetA); err != nil {
			return nil, fmt.Errorf("fleet A diff: %w", err)
		}
	}
	if fleetB != "" {
		if err := e.applyDiff(specB, fleetB); err != nil {
			return nil, fmt.Errorf("fleet B diff: %w", err)
		}
	}

	ra := e.runFleet(ctx, "a", specA, fleetA)
	rb := e.runFleet(ctx, "b", specB, fleetB)

	m := &MatchResult{
		SpecID:   filepath.Base(e.SpecRelPath),
		FleetA:   ra,
		FleetB:   rb,
		Duration: time.Since(start),
	}

	switch {
	case m.FleetA.TrustScore > m.FleetB.TrustScore:
		m.Winner = "a"
	case m.FleetB.TrustScore > m.FleetA.TrustScore:
		m.Winner = "b"
	default:
		m.Winner = "draw"
	}
	return m, nil
}

// createWorktree adds a git worktree at HEAD for a fleet.
func (e *Engine) createWorktree(ctx context.Context, name string) (string, error) {
	wtPath := filepath.Join(e.Workdir, name)
	cmd := exec.CommandContext(ctx, "git", "worktree", "add", "--detach", wtPath, "HEAD")
	cmd.Dir = e.RepoPath
	if out, err := cmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("git worktree add %s: %v (%s)", name, err, string(out))
	}
	return wtPath, nil
}

// applyDiff applies a unified diff rooted at the spec directory.
func (e *Engine) applyDiff(specDir, diff string) error {
	if diff == "" {
		return nil
	}
	diffFile := filepath.Join(os.TempDir(), "fleet-diff.patch")
	if err := os.WriteFile(diffFile, []byte(diff), 0o644); err != nil {
		return err
	}
	cmd := exec.Command("git", "apply", "--directory="+filepath.Base(specDir), diffFile)
	cmd.Dir = filepath.Dir(specDir)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("git apply: %v (%s)", err, string(out))
	}
	return nil
}

// runFleet runs `go test -cover` for the spec package and the referee.
func (e *Engine) runFleet(ctx context.Context, name, specDir, diff string) FleetResult {
	start := time.Now()
	fr := FleetResult{FleetName: name, Worktree: specDir}

	cmd := exec.CommandContext(ctx, "go", "test", "-cover", "-coverprofile="+os.DevNull, e.SpecPackage)
	cmd.Dir = specDir
	out, _ := cmd.CombinedOutput()
	fr.Duration = time.Since(start)
	testOutput := string(out)

	fr.TestsPass = testPassed(testOutput)
	fr.Coverage = extractCoverage(testOutput)

	pr := &referee.PRContext{
		Repo:            "arena/" + e.SpecRelPath,
		PRRef:           name + "-" + time.Now().Format("150405"),
		HeadRef:         "HEAD",
		Diff:            diff,
		Body:            "Agent delivery for " + name,
		TestOutput:      testOutput,
		ClaimStatements: []string{},
	}

	refStart := time.Now()
	refOut, refErr := e.Ref.Run(ctx, pr)
	if refErr != nil {
		fr.Error = refErr
	} else if refOut != nil && refOut.Verdict != nil {
		fr.Verdict = refOut.Verdict
		fr.TrustScore = refOut.Verdict.TrustScore
	}
	fr.Duration += time.Since(refStart)
	return fr
}

// removeWorktree removes a fleet worktree directory and deregisters it from
// the parent repo's worktree bookkeeping (git worktree prune). Tolerates a
// missing dir; returns the first error otherwise.
func (e *Engine) removeWorktree(name string) error {
	wt := filepath.Join(e.Workdir, name)
	if _, err := os.Stat(wt); err == nil {
		if err := os.RemoveAll(wt); err != nil {
			return err
		}
	}
	cmd := exec.Command("git", "worktree", "prune")
	cmd.Dir = e.RepoPath
	return cmd.Run()
}

// Cleanup removes the worktrees created for this run.
func (e *Engine) Cleanup() {
	for _, name := range []string{"fleet-a", "fleet-b"} {
		_ = e.removeWorktree(name)
	}
}

// testPassed reports whether go test output indicates a green run.
func testPassed(output string) bool {
	return strings.Contains(output, "ok") && !strings.Contains(output, "FAIL")
}

// extractCoverage parses "coverage: X.Y% of statements" from go test output.
func extractCoverage(output string) float64 {
	for _, line := range strings.Split(output, "\n") {
		if strings.Contains(line, "coverage:") && strings.Contains(line, "%") {
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