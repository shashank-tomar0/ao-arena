package referee

import (
	"testing"
)

// TestEngineRun_CleanDiff expects a clean verdict when a diff references only
// known symbols and makes no unsubstantiated claims.
func TestEngineRun_CleanDiff(t *testing.T) {
	e := NewEngine(nil)
	known := map[string][]string{
		"validate": {"internal/auth/validate.go:12"},
		"handler":  {"internal/web/handler.go:5"},
		"Error":    {"internal/web/errors.go:3"},
	}
	// Uses handler.route(validate) - both known, no new definitions
	pr := &PRContext{
		Repo:        "acme/app",
		PRRef:       "pr-42",
		HeadRef:     "main",
		Diff:        "+handler.route(validate)",
		Body:        "Add handler with validation.",
		SymbolIndex: known,
	}
	out, err := e.Run(t.Context(), pr)
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if !out.Verdict.Mergeable {
		t.Fatalf("expected mergeable, got %+v", out.Verdict)
	}
	if out.Verdict.TrustScore != 100 {
		t.Fatalf("expected trust 100, got %0.1f", out.Verdict.TrustScore)
	}
}

// TestEngineRun_HallucinatedSymbol catches a diff referencing a symbol that
// does not exist anywhere in the repository — the "hallucinated API" failure.
func TestEngineRun_HallucinatedSymbol(t *testing.T) {
	e := NewEngine(nil)
	known := map[string][]string{
		"handler": {"internal/web/handler.go:5"},
	}
	// handler is known; machenhance.Generate() is a hallucinated call
	pr := &PRContext{
		Repo:        "acme/app",
		PRRef:       "pr-43",
		HeadRef:     "main",
		Diff:        "+x := machenhance.Generate()\n+handler.route(x)",
		Body:        "Wire in machenhance.",
		SymbolIndex: known,
	}
	out, err := e.Run(t.Context(), pr)
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if out.Verdict.Mergeable {
		t.Fatalf("expected blocked on hallucinated symbol, got %+v", out.Verdict)
	}
	// Expect trust 70 (one critical: machenhance)
	if out.Verdict.TrustScore != 70 {
		t.Fatalf("expected trust 70 (one critical), got %0.1f", out.Verdict.TrustScore)
	}
}

// TestEngineRun_GhostClaim catches a PR summary claiming work the diff lacks.
func TestEngineRun_GhostClaim(t *testing.T) {
	e := NewEngine(nil)
	pr := &PRContext{
		Repo:    "acme/app",
		PRRef:   "pr-44",
		HeadRef: "main",
		Diff:    "+fmt.Println(\"hello\")",
		Body:    "Add pagination and rate limiting for the API.",
	}
	out, err := e.Run(t.Context(), pr)
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	crit := 0
	for _, f := range out.Verdict.Findings {
		if f.Severity == "critical" {
			crit++
		}
	}
	// Expect the pagination claim to be refuted.
	if crit == 0 {
		t.Fatalf("expected ghost-claim finding, got %+v", out.Verdict.Findings)
	}
}
