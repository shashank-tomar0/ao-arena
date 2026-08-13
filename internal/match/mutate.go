// Mutation differential: the deepest theater-tests detector in the referee.
//
// Standard mutation testing mutates the PRODUCTION code, not the tests, and
// asks: does the suite still pass against known-broken code? If yes, the
// suite cannot detect broken behavior — it is theater, proven by execution.
//
// The match engine runs the fleet's tests twice: once on the delivered code
// (baseline), once on the delivered code with production mutants applied.
// A suite that passes both has no teeth. The surviving mutant IS the evidence.
//
// Mutants are textual and language-specific: each must compile (it is valid
// source) and must change observable behavior if the code path it touches is
// exercised. A suite that still passes against a mutant proves it never
// exercised that path's consequences.
package match

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// mutant is one deterministic production-code break.
type mutant struct {
	name string
	// apply rewrites production source. Must produce valid code.
	apply func(src string) string
}

// goMutants target Go idioms.
var goMutants = []mutant{
	{
		name: "disable-error-handling",
		apply: func(src string) string {
			return strings.ReplaceAll(src, "if err != nil {", "if false && err != nil {")
		},
	},
	{
		name: "flip-comparisons",
		apply: func(src string) string {
			src = strings.ReplaceAll(src, "==", "\x00")
			src = strings.ReplaceAll(src, "!=", "==")
			src = strings.ReplaceAll(src, "\x00", "!=")
			return src
		},
	},
	{
		name: "flip-boolean-guards",
		apply: func(src string) string {
			re := regexp.MustCompile(`if\s+!([a-zA-Z_][a-zA-Z0-9_]*)`)
			return re.ReplaceAllString(src, "if $1")
		},
	},
}

// nodeMutants target JavaScript/TypeScript idioms. The realtime-chat spec's
// production code is written so every mutant is deterministically killable
// by the acceptance suite — no race-dependent error paths.
var nodeMutants = []mutant{
	{
		name: "flip-strict-comparisons",
		apply: func(src string) string {
			src = strings.ReplaceAll(src, "===", "\x00")
			src = strings.ReplaceAll(src, "!==", "===")
			src = strings.ReplaceAll(src, "\x00", "!==")
			return src
		},
	},
	{
		name: "flip-truthy-guards",
		apply: func(src string) string {
			re := regexp.MustCompile(`if\s*\(\s*!([a-zA-Z_][a-zA-Z0-9_]*)\s*\)`)
			return re.ReplaceAllString(src, "if ($1)")
		},
	},
	{
		name: "disable-leave-broadcast",
		apply: func(src string) string {
			// Never clean the peer up: the room keeps a ghost member.
			return strings.ReplaceAll(src, "peers.delete(id)", "peers.delete(-1)")
		},
	},
}

// mutantsFor selects the mutant set for a spec's language.
func mutantsFor(spec Spec) []mutant {
	if spec.MutationLang == "node" {
		return nodeMutants
	}
	return goMutants
}

// runMutation runs the fleet's tests against mutated production code and
// returns the output of the surviving mutant if one exists, or FAIL output if
// every mutant was killed. Callers only invoke this when the baseline passed.
//
// Mutants are scoped to the package under test: mutation is only meaningful
// when the broken code is actually compiled and exercised by the test run.
// Mutating files the suite never loads (e.g. a server binary in a sibling
// module) would produce false survivors, so those files are copied verbatim.
//
// The result feeds the referee's mutation-differential check: a surviving
// mutant (tests pass against known-broken code) is a critical theater finding.
func runMutation(ctx context.Context, specDir string, spec Spec) string {
	applied := 0
	for _, m := range mutantsFor(spec) {
		dir, changed, err := copyWithMutant(specDir, spec, m)
		if err != nil {
			return fmt.Sprintf("mutation %q could not be prepared: %v", m.name, err)
		}
		defer os.RemoveAll(dir)

		// A mutant with no target in this codebase is not a test of the
		// suite — skip it rather than claim a false differential result.
		if !changed {
			continue
		}
		applied++

		cmdArgs := spec.TestCmd
		if spec.Lang == "go" && spec.Module != "" {
			cmdArgs = append(append([]string{}, spec.TestCmd...), spec.Module)
		}
		// A mutant that hangs the toolchain is a fail, not a pass: CI timeouts
		// reject code too. Bounded per-mutant budget so a hung suite cannot
		// block the whole differential.
		mctx, cancel := context.WithTimeout(ctx, 120*time.Second)
		cmd := exec.CommandContext(mctx, cmdArgs[0], cmdArgs[1:]...)
		cmd.Dir = dir
		out, cmdErr := cmd.CombinedOutput()
		cancel()
		output := string(out)

		passed := cmdErr == nil
		if spec.Lang != "node" {
			passed = testPassed(output)
		}
		if passed {
			// Survivor — the suite cannot detect this break.
			return fmt.Sprintf("MUTANT SURVIVED (%s)\n%s", m.name, truncate(output, 600))
		}
	}
	if applied == 0 {
		return "NO MUTANTS APPLIED — differential inconclusive for this codebase"
	}
	return "FAIL — every mutant was killed by the test suite"
}

// copyWithMutant copies the spec directory to a fresh temp dir with one
// production mutant applied to non-test source files under the
// package-under-test directory. The second return reports whether the mutant
// changed any file (a no-op mutant is skipped).
func copyWithMutant(specDir string, spec Spec, m mutant) (string, bool, error) {
	dest, err := os.MkdirTemp("", "ao-arena-mutant-*")
	if err != nil {
		return "", false, err
	}
	changed := false
	entries, err := os.ReadDir(specDir)
	if err != nil {
		return "", false, err
	}
	pkgRel := filepath.ToSlash(spec.PkgRel)
	for _, e := range entries {
		c, err := copyTree(filepath.Join(specDir, e.Name()), filepath.Join(dest, e.Name()), m, spec, pkgRel, "")
		if err != nil {
			return "", false, err
		}
		changed = changed || c
	}
	return dest, changed, nil
}

// copyTree copies a file or directory, applying the mutant to production
// source files under the package-under-test directory. Hidden dirs (.git)
// and build artifacts are skipped. Reports whether the copied file was
// mutated.
func copyTree(src, dest string, m mutant, spec Spec, pkgRel, prefix string) (bool, error) {
	info, err := os.Stat(src)
	if err != nil {
		return false, err
	}
	if info.IsDir() {
		base := filepath.Base(src)
		if strings.HasPrefix(base, ".") || base == "bin" || base == "node_modules" || base == "dist" {
			return false, nil
		}
		if err := os.MkdirAll(dest, 0o755); err != nil {
			return false, err
		}
		entries, err := os.ReadDir(src)
		if err != nil {
			return false, err
		}
		changed := false
		childPrefix := prefix + base + "/"
		for _, e := range entries {
			c, err := copyTree(filepath.Join(src, e.Name()), filepath.Join(dest, e.Name()), m, spec, pkgRel, childPrefix)
			if err != nil {
				return false, err
			}
			changed = changed || c
		}
		return changed, nil
	}
	data, err := os.ReadFile(src)
	if err != nil {
		return false, err
	}
	inPackage := prefix == filepath.ToSlash(pkgRel)+"/" || strings.HasPrefix(prefix, filepath.ToSlash(pkgRel)+"/")
	// Mutate production source in the package under test only — tests stay
	// intact so the suite's own assertions are what fight the broken code.
	if inPackage && hasExt(src, spec.MutationExt) && !isTestFile(src, spec.TestSuffixes) {
		mutated := m.apply(string(data))
		if mutated != string(data) {
			data = []byte(mutated)
			if err := os.WriteFile(dest, data, info.Mode()); err != nil {
				return false, err
			}
			return true, nil
		}
	}
	return false, os.WriteFile(dest, data, info.Mode())
}

// testPassed reports whether Go test output indicates a green run.
func testPassed(output string) bool {
	return strings.Contains(output, "ok") && !strings.Contains(output, "FAIL")
}

// hasExt reports whether path ends with one of the given extensions.
func hasExt(path string, exts []string) bool {
	lower := strings.ToLower(path)
	for _, e := range exts {
		if strings.HasSuffix(lower, strings.ToLower(e)) {
			return true
		}
	}
	return false
}

// isTestFile reports whether path matches a test-file suffix (e.g. .test.js).
func isTestFile(path string, suffixes []string) bool {
	lower := strings.ToLower(path)
	for _, s := range suffixes {
		if strings.HasSuffix(lower, strings.ToLower(s)) {
			return true
		}
	}
	return false
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "\n… (truncated)"
}

// SummaryLine returns the first line of a run output — the human verdict
// line (survivor name, kill confirmation, or inconclusive note).
func SummaryLine(s string) string {
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		return s[:i]
	}
	return s
}
