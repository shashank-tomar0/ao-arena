// Package match implements the real match engine: spins git worktrees,
// runs the spec's acceptance tests against each fleet's delivered code,
// and computes a real trust score via the referee.
package match

import (
	"context"
	"crypto/sha256"
	"fmt"
	"io/fs"
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
	FleetName      string
	Worktree       string
	TestsPass      bool
	Coverage       float64
	Verdict        *verdict.Verdict
	TrustScore     float64
	MutationResult string // "MUTANT SURVIVED (…)" / "FAIL — every mutant was killed" / ""
	Error          error
	Duration       time.Duration
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
// and runs the spec's acceptance tests from the spec directory within that
// worktree, on whatever toolchain the spec declares (go test / node --test).
type Engine struct {
	RepoPath string // path to the git repo root
	Spec     Spec
	Ref      *referee.Engine
	Workdir  string // temp root for worktrees

	// PhaseFn, if set, receives honest pipeline progress for each fleet
	// (worktree → testing → mutation → referee → verdict). The broadcast
	// layer maps these to live session cards on the arena boards.
	PhaseFn func(fleet, phase, detail string)
}

// NewEngine builds a match engine for the named spec. repoPath is the git
// repo root containing specs/.
func NewEngine(repoPath, specID string) (*Engine, error) {
	spec, err := SpecFor(specID)
	if err != nil {
		return nil, err
	}
	return &Engine{
		RepoPath: repoPath,
		Spec:     spec,
		Ref:      referee.NewEngine(nil),
		Workdir:  filepath.Join(os.TempDir(), "ao-arena-matches"),
	}, nil
}

// SpecRel returns the spec directory relative to the repo root.
func (e *Engine) SpecRel() string { return filepath.Join("specs", e.Spec.ID) }

// Run executes a real head-to-head match between two fleet states.
// fleetA and fleetB are optional unified diffs; bodyA/bodyB are the PR
// summaries the referee audits for ghost claims. The engine:
//  1. Creates two worktrees from the repo at HEAD.
//  2. Runs the spec's acceptance tests in each worktree.
//  3. Computes a real trust score via the referee.
//
// Returns a real MatchResult.
func (e *Engine) Run(ctx context.Context, fleetA, fleetB, bodyA, bodyB string) (*MatchResult, error) {
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

	// spec dir inside each worktree. The source repo may not have the spec
	// committed yet (hackathon specs land as untracked files), and git
	// worktrees only check out tracked content — so a missing spec dir is
	// copied from the source repo as a real baseline.
	specA := filepath.Join(wtA, filepath.FromSlash(e.SpecRel()))
	specB := filepath.Join(wtB, filepath.FromSlash(e.SpecRel()))
	if err := e.ensureSpecDir(wtA); err != nil {
		return nil, fmt.Errorf("fleet A spec dir: %w", err)
	}
	if err := e.ensureSpecDir(wtB); err != nil {
		return nil, fmt.Errorf("fleet B spec dir: %w", err)
	}

	e.phase("a", "pending", "worktree spawned")
	e.phase("b", "pending", "worktree spawned")

	// Apply diffs (agent delivery) if provided. git apply resolves paths
	// against the repository root, so we run it from the worktree root with
	// the spec-relative directory prefix.
	if fleetA != "" {
		e.phase("a", "working", "applying delivery")
		if err := e.applyDiff(wtA, e.SpecRel(), fleetA); err != nil {
			return nil, fmt.Errorf("fleet A diff: %w", err)
		}
	}
	if fleetB != "" {
		e.phase("b", "working", "applying delivery")
		if err := e.applyDiff(wtB, e.SpecRel(), fleetB); err != nil {
			return nil, fmt.Errorf("fleet B diff: %w", err)
		}
	}

	ra := e.runFleet(ctx, "a", specA, fleetA, bodyA)
	rb := e.runFleet(ctx, "b", specB, fleetB, bodyB)

	m := &MatchResult{
		SpecID:   e.Spec.ID,
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

// ensureSpecDir syncs the spec baseline from the source repo into a
// worktree. Git worktrees only check out committed content, so a spec that
// lives partly or wholly in the working tree (untracked files — common for
// freshly authored challenges) would otherwise be missing or incomplete in
// the worktree, and the fleet's diff could not apply. The spec as it exists
// on disk is the baseline fleets race against; the fleet diff still applies
// on top of it with git apply, and the engine refuses to run if the patch
// produces no changes.
func (e *Engine) ensureSpecDir(wtPath string) error {
	src := filepath.Join(e.RepoPath, filepath.FromSlash(e.SpecRel()))
	dest := filepath.Join(wtPath, filepath.FromSlash(e.SpecRel()))
	if _, err := os.Stat(src); err != nil {
		return fmt.Errorf("spec source missing: %w", err)
	}
	return copyDir(src, dest)
}

// copyDir recursively copies a directory tree (spec baselines are small).
func copyDir(src, dest string) error {
	info, err := os.Stat(src)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		return fmt.Errorf("not a directory: %s", src)
	}
	if err := os.MkdirAll(dest, 0o755); err != nil {
		return err
	}
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), ".") {
			continue
		}
		s := filepath.Join(src, e.Name())
		d := filepath.Join(dest, e.Name())
		if e.IsDir() {
			if err := copyDir(s, d); err != nil {
				return err
			}
			continue
		}
		data, err := os.ReadFile(s)
		if err != nil {
			return err
		}
		if err := os.WriteFile(d, data, 0o644); err != nil {
			return err
		}
	}
	return nil
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

// applyDiff applies a unified diff whose paths are relative to the spec
// directory (e.g. "auth/auth_test.go"), from the worktree root with the
// spec-relative directory prefix. It fails loudly if the patch produced no
// changes — a silent skip would otherwise let dishonest agent diffs pass
// through unapplied.
func (e *Engine) applyDiff(worktree, specRel, diff string) error {
	if diff == "" {
		return nil
	}
	diffFile := filepath.Join(os.TempDir(), "fleet-diff.patch")
	if err := os.WriteFile(diffFile, []byte(diff), 0o644); err != nil {
		return err
	}
	// Snapshot the spec dir's real content before applying. `git diff`
	// cannot verify an untracked spec's files (they are invisible to the
	// index), so the proof is content-based: the patch must change bytes.
	before, err := specDirHash(worktree, specRel)
	if err != nil {
		return fmt.Errorf("hash spec before apply: %w", err)
	}
	cmd := exec.Command("git", "apply", "--directory="+filepath.ToSlash(specRel), diffFile)
	cmd.Dir = worktree
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("git apply: %v (%s)", err, string(out))
	}

	after, err := specDirHash(worktree, specRel)
	if err != nil {
		return fmt.Errorf("hash spec after apply: %w", err)
	}
	if before == after {
		return fmt.Errorf("git apply produced no changes — patch was skipped")
	}
	return nil
}

// specDirHash returns a content hash of the spec directory in a worktree —
// the ground truth that a fleet's diff actually changed the baseline, whether
// the spec's files are tracked by git or not.
func specDirHash(worktree, specRel string) (string, error) {
	h := sha256.New()
	root := filepath.Join(worktree, filepath.FromSlash(specRel))
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		rel, rerr := filepath.Rel(root, path)
		if rerr != nil {
			return rerr
		}
		data, rerr := os.ReadFile(path)
		if rerr != nil {
			return rerr
		}
		h.Write([]byte(filepath.ToSlash(rel)))
		h.Write(data)
		return nil
	})
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", h.Sum(nil)), nil
}

// runFleet runs the spec's acceptance tests for one fleet and the referee,
// including the compiler-reality pass and the mutation differential.
func (e *Engine) runFleet(ctx context.Context, name, specDir, diff, body string) FleetResult {
	start := time.Now()
	fr := FleetResult{FleetName: name, Worktree: specDir}

	e.phase(name, "working", "running real "+e.Spec.Lang+" acceptance tests")
	cmdArgs := e.Spec.CoverCmd
	if e.Spec.Lang == "go" && e.Spec.Module != "" {
		cmdArgs = append(append([]string{}, e.Spec.CoverCmd...), e.Spec.Module)
	}
	cmd := exec.CommandContext(ctx, cmdArgs[0], cmdArgs[1:]...)
	cmd.Dir = specDir
	out, cmdErr := cmd.CombinedOutput()
	fr.Duration = time.Since(start)
	testOutput := string(out)

	fr.TestsPass = e.testPassed(testOutput, cmdErr)
	fr.Coverage = extractCoverage(e.Spec.CoverageParse, testOutput)

	// The toolchain is the symbol-reality judge: real undefined-symbol and
	// missing-package errors, with the compiler's own file:line evidence.
	compilerErrors := referee.ParseCompilerErrors(testOutput)

	// Mutation differential: only meaningful when the baseline suite is green.
	mutatedOutput := ""
	if fr.TestsPass {
		e.phase(name, "review_pending", "mutation differential: breaking production code")
		mutatedOutput = runMutation(ctx, specDir, e.Spec)
		fr.MutationResult = mutatedOutput
		e.phase(name, "review_pending", "mutation differential: "+SummaryLine(mutatedOutput))
	}

	pr := &referee.PRContext{
		Repo:              "arena/" + e.SpecRel(),
		PRRef:             name + "-" + time.Now().Format("150405"),
		HeadRef:           "HEAD",
		Diff:              diff,
		Body:              body,
		TestOutput:        testOutput,
		MutatedTestOutput: mutatedOutput,
		CompilerErrors:    compilerErrors,
		ClaimStatements:   []string{},
	}

	refStart := time.Now()
	e.phase(name, "review_pending", "referee auditing against reality")
	refOut, refErr := e.Ref.Run(ctx, pr)
	if refErr != nil {
		fr.Error = refErr
	} else if refOut != nil && refOut.Verdict != nil {
		fr.Verdict = refOut.Verdict
		fr.TrustScore = refOut.Verdict.TrustScore
	}
	fr.Duration += time.Since(refStart)

	// Final board state: the fleet's card lands in its honest terminal lane.
	switch {
	case !fr.TestsPass:
		e.phase(name, "ci_failed", "build or tests failed")
	case fr.Verdict != nil && fr.Verdict.Mergeable:
		e.phase(name, "mergeable", "verdict CLEAN — mergeable")
	case fr.Verdict != nil && hasCriticalFindings(fr.Verdict):
		e.phase(name, "changes_requested", "verdict BLOCKED — critical findings")
	default:
		e.phase(name, "review_pending", "verdict issued")
	}
	return fr
}

// testPassed reports whether the toolchain's own run was green. Go: the
// output contains "ok" and no "FAIL". Node: the process exited 0 (the
// reporter prints pass/fail lines but the exit code is authoritative).
func (e *Engine) testPassed(output string, cmdErr error) bool {
	if e.Spec.Lang == "node" {
		return cmdErr == nil
	}
	return strings.Contains(output, "ok") && !strings.Contains(output, "FAIL")
}

// phase invokes the PhaseFn callback when configured (nil-safe).
func (e *Engine) phase(fleet, phase, detail string) {
	if e.PhaseFn != nil {
		e.PhaseFn(fleet, phase, detail)
	}
}

func hasCriticalFindings(v *verdict.Verdict) bool {
	for _, f := range v.Findings {
		if f.Severity == verdict.SeverityCritical {
			return true
		}
	}
	return false
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

// extractCoverage parses coverage from toolchain output. go-cover: the
// "coverage: X.Y% of statements" line. node-cover: the "all files | NN.NN |
//" row of the --experimental-test-coverage report.
func extractCoverage(kind, output string) float64 {
	switch kind {
	case "go-cover":
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
	case "node-cover":
		for _, line := range strings.Split(output, "\n") {
			if strings.Contains(line, "all files") && strings.Contains(line, "|") {
				fields := strings.Split(line, "|")
				if len(fields) >= 2 {
					var f float64
					fmt.Sscanf(strings.TrimSpace(fields[1]), "%f", &f)
					return f
				}
			}
		}
	}
	return 0
}
