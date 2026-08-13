package match

import (
	"fmt"
	"os"
)

// Spec is a challenge map: a repo directory with a SPEC.md and real
// acceptance tests. The engine drives a fleet's delivery against the spec's
// toolchain — `go test` or `node --test` — and the referee audits the result.
// Multi-language support is what makes the Arena a platform, not a demo.
type Spec struct {
	ID   string // stable id, also the directory name under specs/
	Name string
	Lang string // "go" | "node"

	// PkgRel is the package-under-test directory relative to the spec root.
	// Mutation and coverage are scoped to it.
	PkgRel string

	// Module is the Go module path under test (go specs) or "" for node.
	Module string

	// TestCmd is the acceptance test argv, run from the spec root.
	TestCmd []string
	// CoverCmd is the coverage argv, run from the spec root. Output is
	// parsed by the lang-specific extractor.
	CoverCmd []string

	// MutationExt lists the file extensions mutated during the mutation
	// differential; TestSuffixes are filename suffixes skipped (test files).
	MutationExt   []string
	TestSuffixes  []string
	MutationLang  string // "go" | "node" — which mutant set to apply
	CoverageParse string // "go-cover" | "node-cover"
}

// Specs is the registry of playable challenges. Every spec here must have
// real, runnable acceptance tests — nothing in the Arena is fake.
var Specs = []Spec{
	{
		ID:          "rest-api-auth",
		Name:        "REST API with Auth",
		Lang:        "go",
		PkgRel:      "auth",
		Module:      "example.com/rest-api-auth/auth",
		TestCmd:     []string{"go", "test", "-count=1"},
		CoverCmd:    []string{"go", "test", "-cover", "-coverprofile=" + os.DevNull},		MutationExt:   []string{".go"},
		TestSuffixes:  []string{"_test.go"},
		MutationLang:  "go",
		CoverageParse: "go-cover",
	},
	{
		ID:            "realtime-chat",
		Name:          "Real-time Chat",
		Lang:          "node",
		PkgRel:        "src",
		Module:        "",
		// --test-force-exit: a broken server can leak sockets after tests
		// finish; CI terminates hung runners, and so does the referee. The
		// exit code still reflects real pass/fail — no verdict is faked.
		TestCmd:       []string{"node", "--test", "--test-force-exit"},
		CoverCmd:      []string{"node", "--test", "--test-force-exit", "--experimental-test-coverage"},
		MutationExt:   []string{".js", ".mjs", ".cjs"},
		TestSuffixes:  []string{".test.js", ".test.mjs", ".test.cjs", ".spec.js", "_test.js"},
		MutationLang:  "node",
		CoverageParse: "node-cover",
	},
	{
		ID:            "cli-task-tracker",
		Name:          "CLI Task Tracker",
		Lang:          "node",
		PkgRel:        "src",
		Module:        "",
		TestCmd:       []string{"node", "--test", "--test-force-exit"},
		CoverCmd:      []string{"node", "--test", "--test-force-exit", "--experimental-test-coverage"},
		MutationExt:   []string{".js", ".mjs", ".cjs"},
		TestSuffixes:  []string{".test.js", ".test.mjs", ".test.cjs", ".spec.js", "_test.js"},
		MutationLang:  "node",
		CoverageParse: "node-cover",
	},
}

// SpecFor returns the spec with the given id.
func SpecFor(id string) (Spec, error) {
	for _, s := range Specs {
		if s.ID == id {
			return s, nil
		}
	}
	return Spec{}, fmt.Errorf("unknown spec %q (available: %s)", id, SpecIDs())
}

// DefaultSpec is the canonical head-to-head challenge.
func DefaultSpec() Spec { return Specs[0] }

// SpecIDs returns the sorted list of spec ids for help text.
func SpecIDs() string {
	out := ""
	for i, s := range Specs {
		if i > 0 {
			out += ", "
		}
		out += s.ID
	}
	return out
}
