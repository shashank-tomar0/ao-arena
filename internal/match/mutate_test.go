package match

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestMutationDifferentialRealSpec proves the honest rest-api-auth suite has
// teeth: every production mutant that applies is killed by real `go test`.
// If this fails, the mutation differential is broken — nothing fake allowed.
func TestMutationDifferentialRealSpec(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping real go test in -short mode")
	}
	specDir, err := filepath.Abs(filepath.Join("..", "..", "specs", "rest-api-auth"))
	if err != nil {
		t.Fatalf("resolve spec: %v", err)
	}
	if _, err := os.Stat(filepath.Join(specDir, "go.mod")); err != nil {
		t.Fatalf("spec go.mod: %v", err)
	}

	ctx := context.Background()
	out := runMutation(ctx, specDir, DefaultSpec())
	t.Logf("mutation differential: %s", firstLine(out))

	// The honest suite must kill the mutants that apply. A survivor here
	// means the differential would falsely flag honest work as theater.
	if strings.Contains(out, "MUTANT SURVIVED") {
		t.Fatalf("honest suite should kill every applicable mutant, got survivor:\n%s", out)
	}
}

// TestMutationDifferentialTheaterSuite crafts a self-contained module whose
// test asserts nothing: the production mutant must survive, proving theater
// by execution — the suite cannot detect broken behavior.
func TestMutationDifferentialTheaterSuite(t *testing.T) {
	dir := t.TempDir()

	mustWrite(t, filepath.Join(dir, "go.mod"), "module example.com/theater\n\ngo 1.22\n")
	mustWrite(t, filepath.Join(dir, "app", "app.go"), `package app

// Check returns true only for the exact value.
func Check(x int) bool {
	if x == 42 {
		return true
	}
	return false
}
`)
	// Theater: calls the function, asserts nothing. Passes no matter what
	// the production code does — a textbook assertion-free test.
	mustWrite(t, filepath.Join(dir, "app", "app_test.go"), `package app

import "testing"

func TestCheck(t *testing.T) {
	_ = Check(42)
}
`)

	out := runMutation(context.Background(), dir, goSpec("example.com/theater/app"))
	t.Logf("theater differential: %s", firstLine(out))
	if !strings.Contains(out, "MUTANT SURVIVED") {
		t.Fatalf("theater suite should let a mutant survive, got:\n%s", out)
	}
}

// TestMutationDifferentialHonestSuite: same module, real assertion — the
// mutant must be killed because the test observes actual behavior.
func TestMutationDifferentialHonestSuite(t *testing.T) {
	dir := t.TempDir()

	mustWrite(t, filepath.Join(dir, "go.mod"), "module example.com/honest\n\ngo 1.22\n")
	mustWrite(t, filepath.Join(dir, "app", "app.go"), `package app

func Check(x int) bool {
	if x == 42 {
		return true
	}
	return false
}
`)
	mustWrite(t, filepath.Join(dir, "app", "app_test.go"), `package app

import "testing"

func TestCheck(t *testing.T) {
	if !Check(42) {
		t.Fatal("expected true for 42")
	}
	if Check(1) {
		t.Fatal("expected false for 1")
	}
}
`)

	out := runMutation(context.Background(), dir, goSpec("example.com/honest/app"))
	t.Logf("honest differential: %s", firstLine(out))
	if strings.Contains(out, "MUTANT SURVIVED") {
		t.Fatalf("honest suite should kill the mutant, got survivor:\n%s", out)
	}
}

// goSpec builds a go spec whose package-under-test lives in PkgRel.
func goSpec(module string) Spec {
	return Spec{
		Lang:          "go",
		PkgRel:        "app",
		Module:        module,
		TestCmd:       []string{"go", "test", "-count=1"},
		MutationExt:   []string{".go"},
		TestSuffixes:  []string{"_test.go"},
		MutationLang:  "go",
		CoverageParse: "go-cover",
	}
}

// TestMutationDifferentialNodeSpec proves the realtime-chat suite has teeth
// too: every node mutant that applies is killed by real `node --test`.
// This is the multi-language proof — mutation testing speaks Go AND
// JavaScript.
func TestMutationDifferentialNodeSpec(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping real node --test in -short mode")
	}
	specDir, err := filepath.Abs(filepath.Join("..", "..", "specs", "realtime-chat"))
	if err != nil {
		t.Fatalf("resolve spec: %v", err)
	}
	spec, err := SpecFor("realtime-chat")
	if err != nil {
		t.Fatalf("spec: %v", err)
	}
	ctx := context.Background()
	out := runMutation(ctx, specDir, spec)
	t.Logf("node mutation differential: %s", firstLine(out))
	if strings.Contains(out, "MUTANT SURVIVED") {
		t.Fatalf("honest chat suite should kill every applicable mutant, got survivor:\n%s", out)
	}
}

// TestMutationDifferentialTrackerSpec proves the cli-task-tracker suite has
// teeth too: every node mutant that applies is killed by real `node --test`.
// The tracker spec is the third playable challenge — the arena is not a
// two-trick pony.
func TestMutationDifferentialTrackerSpec(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping real node --test in -short mode")
	}
	specDir, err := filepath.Abs(filepath.Join("..", "..", "specs", "cli-task-tracker"))
	if err != nil {
		t.Fatalf("resolve spec: %v", err)
	}
	spec, err := SpecFor("cli-task-tracker")
	if err != nil {
		t.Fatalf("spec: %v", err)
	}
	ctx := context.Background()
	out := runMutation(ctx, specDir, spec)
	t.Logf("tracker mutation differential: %s", firstLine(out))
	if strings.Contains(out, "MUTANT SURVIVED") {
		t.Fatalf("honest tracker suite should kill every applicable mutant, got survivor:\n%s", out)
	}
}

func firstLine(s string) string {
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		return s[:i]
	}
	return s
}

func mustWrite(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}
