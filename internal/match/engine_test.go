package match

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

// TestRealMatch runs a real head-to-head against the rest-api-auth spec:
// real git worktrees, real `go test -cover`, real referee verdicts.
// This is the "nothing fake" test — it exercises the actual build pipeline.
func TestRealMatch(t *testing.T) {
	// Find the spec repo relative to the module.
	specPath, err := filepath.Abs(filepath.Join("..", "..", "specs", "rest-api-auth"))
	if err != nil {
		t.Fatalf("resolve spec: %v", err)
	}
	if _, err := os.Stat(specPath); err != nil {
		t.Fatalf("spec path %s: %v", specPath, err)
	}

	// specPath is the spec dir; repo is one level up.
	repoPath := filepath.Dir(specPath)

	// Remove leftover worktrees from previous runs (git registers them on disk).
	os.RemoveAll(filepath.Join(os.TempDir(), "ao-arena-matches"))
	_ = exec.Command("git", "worktree", "prune").Run()

	e := NewEngine(repoPath, "specs/rest-api-auth", "example.com/rest-api-auth/auth")
	t.Cleanup(e.Cleanup)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	start := time.Now()
	m, err := e.Run(ctx, "", "")
	if err != nil {
		t.Fatalf("match run: %v", err)
	}
	t.Logf("match took %s", time.Since(start))
	t.Logf("winner: %s", m.Winner)

	// A match against the honest base spec should pass tests.
	if !m.FleetA.TestsPass {
		t.Errorf("fleet A tests should pass on base spec, got %v", m.FleetA.TestsPass)
	}
	if !m.FleetB.TestsPass {
		t.Errorf("fleet B tests should pass on base spec, got %v", m.FleetB.TestsPass)
	}

	// Both should have trust scores (real referee output, not fake 0/100).
	if m.FleetA.TrustScore <= 0 {
		t.Errorf("fleet A trust score should be > 0, got %f", m.FleetA.TrustScore)
	}
	if m.FleetB.TrustScore <= 0 {
		t.Errorf("fleet B trust score should be > 0, got %f", m.FleetB.TrustScore)
	}

	t.Logf("fleet A: pass=%v coverage=%.1f trust=%.1f", m.FleetA.TestsPass, m.FleetA.Coverage, m.FleetA.TrustScore)
	t.Logf("fleet B: pass=%v coverage=%.1f trust=%.1f", m.FleetB.TestsPass, m.FleetB.Coverage, m.FleetB.TrustScore)
	t.Logf("verdict A: %s", m.FleetA.Verdict.Summary)
	t.Logf("verdict B: %s", m.FleetB.Verdict.Summary)

	// Winner must be deterministic (draw on identical fleets is fine).
	if m.Winner != "a" && m.Winner != "b" && m.Winner != "draw" {
		t.Errorf("unexpected winner %q", m.Winner)
	}

	e.Cleanup()
}

// TestMatchHonestVsDishonest applies the DishonestDiff fixture to fleet B
// and verifies three things: the patch genuinely lands in the worktree (the
// build breaks on the hallucinated symbol), the referee statically catches
// the theater test + hallucinated API, and the honest fleet wins.
func TestMatchHonestVsDishonest(t *testing.T) {
	specPath, err := filepath.Abs(filepath.Join("..", "..", "specs", "rest-api-auth"))
	if err != nil {
		t.Fatalf("resolve spec: %v", err)
	}
	repoPath := filepath.Dir(specPath)

	// Remove leftover worktrees from previous runs (git registers them on disk).
	os.RemoveAll(filepath.Join(os.TempDir(), "ao-arena-matches"))
	_ = exec.Command("git", "worktree", "prune").Run()

	e := NewEngine(repoPath, "specs/rest-api-auth", "example.com/rest-api-auth/auth")
	t.Cleanup(e.Cleanup)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	m, err := e.Run(ctx, "", DishonestDiff)
	if err != nil {
		t.Fatalf("match run: %v", err)
	}

	t.Logf("fleet A trust=%0.1f, fleet B trust=%0.1f, winner=%s", m.FleetA.TrustScore, m.FleetB.TrustScore, m.Winner)

	// 1) The dishonest diff must genuinely land: the hallucinated symbol
	//    breaks the build, so fleet B's tests cannot pass. If the patch was
	//    silently skipped, this assertion fails — nothing fake allowed.
	if m.FleetB.TestsPass {
		t.Errorf("fleet B tests should FAIL to build after the dishonest diff landed")
	}

	// 2) The referee catches the dishonesty statically (critical findings).
	if m.FleetB.TrustScore >= m.FleetA.TrustScore {
		t.Errorf("expected honest fleet A to beat dishonest fleet B (A=%0.1f B=%0.1f)",
			m.FleetA.TrustScore, m.FleetB.TrustScore)
	}
	hasTheater := false
	hasSymbol := false
	for _, f := range m.FleetB.Verdict.Findings {
		if f.Category == "test-reality" && f.Severity == verdict.SeverityCritical {
			hasTheater = true
		}
		if f.Category == verdict.CategorySymbolReality && f.Severity == verdict.SeverityCritical {
			hasSymbol = true
		}
	}
	if !hasTheater {
		t.Errorf("expected a critical theater-test finding on fleet B")
	}
	if !hasSymbol {
		t.Errorf("expected a critical symbol-reality finding on fleet B")
	}

	// 3) The honest fleet wins.
	if m.Winner != "a" {
		t.Errorf("expected fleet A to win, got %s", m.Winner)
	}
}