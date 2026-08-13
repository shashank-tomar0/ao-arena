package referee

import (
	"context"
	"strings"
	"testing"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

// This benchmark suite is the referee's real, auditable guarantee. It crafts
// one honest PR and three dishonest PRs covering the three documented agent
// failure modes — theater tests, hallucinated APIs, ghost claims — and
// asserts the referee catches 3/3 while clearing the honest one. These are
// the numbers the landing page quotes, and they are computed, not invented.

// The crafted diffs and symbol index live in benchmark.go so the runtime
// BenchmarkSummary() and the test suite exercise the exact same inputs.

func runCrafted(t *testing.T, diff, body string, claims []string) *verdict.Verdict {
	t.Helper()
	e := NewEngine(nil)
	pr := &PRContext{
		Repo:            "arena/rest-api-auth",
		PRRef:           "bench-" + strings.ReplaceAll(t.Name(), "/", "-"),
		HeadRef:         "HEAD",
		Diff:            diff,
		Body:            body,
		ClaimStatements: claims,
		SymbolIndex:     benchmarkSymbols,
	}
	out, err := e.Run(context.Background(), pr)
	if err != nil {
		t.Fatalf("referee run: %v", err)
	}
	return out.Verdict
}

// TestBenchmarkCatchesCraftedFailureModes is the benchmark headline: honest
// work clears; all three crafted failure modes are caught with the right
// evidence category.
func TestBenchmarkCatchesCraftedFailureModes(t *testing.T) {
	// The honest body makes no claim the diff doesn't substantiate — the
	// referee must clear it completely.
	honest := runCrafted(t, benchHonestDiff, "verify store reuse before returning the token", nil)
	if !honest.Mergeable {
		t.Errorf("honest PR must be mergeable, got %q (score %.1f)", honest.Summary, honest.TrustScore)
	}

	theater := runCrafted(t, benchTheaterDiff, "added tests", nil)
	if theater.Mergeable || !hasCategory(theater, "test-reality") {
		t.Errorf("theater PR must be blocked with a test-reality finding")
	}

	hallucinated := runCrafted(t, benchHallucinatedDiff, "added security hardening", []string{"added security hardening"})
	if hallucinated.Mergeable || !hasCategory(hallucinated, string(verdict.CategorySymbolReality)) {
		t.Errorf("hallucinated PR must be blocked with a symbol-reality finding")
	}

	ghost := runCrafted(t, benchHonestDiff, "added pagination to the listing endpoint", nil)
	if ghost.Mergeable || !hasCategory(ghost, string(verdict.CategoryClaimDiff)) {
		t.Errorf("ghost-claim PR must be blocked with a claim-vs-diff finding")
	}

	t.Logf("benchmark: caught 3/3 crafted failure modes; honest PR cleared (score %.1f)", honest.TrustScore)
}

// TestBenchmarkDeterminism proves the core claim: same diff, same verdict,
// same receipt hash, forever. No LLM, no randomness — the referee is a pure
// function of its input.
func TestBenchmarkDeterminism(t *testing.T) {
	v1 := runCrafted(t, benchHallucinatedDiff, "added security hardening", []string{"added security hardening"})
	v2 := runCrafted(t, benchHallucinatedDiff, "added security hardening", []string{"added security hardening"})

	if v1.ReceiptHash != v2.ReceiptHash {
		t.Errorf("receipt hash must be deterministic: %s != %s", v1.ReceiptHash, v2.ReceiptHash)
	}
	if v1.TrustScore != v2.TrustScore || v1.Mergeable != v2.Mergeable {
		t.Errorf("verdict must be deterministic: %v vs %v", v1, v2)
	}
	if len(v1.Findings) != len(v2.Findings) {
		t.Errorf("finding counts must match: %d vs %d", len(v1.Findings), len(v2.Findings))
	}
}

func hasCategory(v *verdict.Verdict, cat string) bool {
	for _, f := range v.Findings {
		if string(f.Category) == cat {
			return true
		}
	}
	return false
}

// TestParseCompilerErrors verifies the toolchain-output parser turns real
// `go test` errors into structured evidence.
func TestParseCompilerErrors(t *testing.T) {
	output := `
# example.com/rest-api-auth/auth
./auth/auth_test.go:16:13: undefined: macenhance
./auth/auth.go:4:2: cannot find package "example.com/ghost" in any of:
	/usr/local/go/src/example.com/ghost (from $GOROOT)
	/home/user/go/src/example.com/ghost (from $GOPATH)
no required module provides package example.com/ghost; to add it:
	go get example.com/ghost
`
	errs := ParseCompilerErrors(output)
	if len(errs) != 3 {
		t.Fatalf("expected 3 compiler errors, got %d: %+v", len(errs), errs)
	}
	if errs[0].Symbol != "macenhance" || errs[0].File != "./auth/auth_test.go" || errs[0].Line != 16 {
		t.Errorf("undefined symbol parse wrong: %+v", errs[0])
	}
	if errs[1].Symbol != "example.com/ghost" || errs[1].Line != 4 {
		t.Errorf("cannot-find-package parse wrong: %+v", errs[1])
	}
	if errs[2].Symbol != "example.com/ghost" {
		t.Errorf("module-provides parse wrong: %+v", errs[2])
	}

	// No compiler errors → no findings from the check.
	e := NewEngine(nil)
	pr := &PRContext{PRRef: "clean", Diff: "", CompilerErrors: errs}
	out, err := e.Run(context.Background(), pr)
	if err != nil {
		t.Fatal(err)
	}
	compilerFindings := 0
	for _, f := range out.Verdict.Findings {
		if f.Category == verdict.CategoryCompilerReality {
			compilerFindings++
		}
	}
	if compilerFindings != 3 {
		t.Errorf("expected 3 compiler-reality findings, got %d", compilerFindings)
	}
	for _, f := range out.Verdict.Findings {
		if f.Category == verdict.CategoryCompilerReality {
			if f.Severity != verdict.SeverityCritical {
				t.Errorf("compiler findings must be critical, got %s", f.Severity)
			}
			if f.EvidencePath == "" {
				t.Errorf("compiler findings must carry evidence")
			}
		}
	}
}
