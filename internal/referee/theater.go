// Theater-tests check: agent PRs often ship tests that pass because they
// assert nothing — `expect(true).toBe(true)`, empty it() blocks, t.Skip.
// This check scans the diff for theater patterns AND runs a mutation
// differential: if tests pass unchanged after production code is broken by
// real mutants, the suite cannot detect broken behavior — it is theater,
// proven by execution.
package referee

import (
	"context"
	"regexp"
	"strings"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

const theaterCheckName = "test-reality"

// Theater patterns that indicate a test asserts nothing real.
var theaterPatterns = []*regexp.Regexp{
	// JS/TS: expect(true).toBe(true), expect(1).toBe(1)
	regexp.MustCompile(`expect\(true\)\.toBe\(true\)`),
	regexp.MustCompile(`expect\(1\)\.toBe\(1\)`),
	regexp.MustCompile(`expect\(0\)\.toBe\(0\)`),
	regexp.MustCompile(`expect\(null\)\.toBeNull\(\)`),
	regexp.MustCompile(`expect\([^)]*\)\.toBeTruthy\(\)`),
	// Python: assert True, assert 1 == 1
	regexp.MustCompile(`assert\s+True(\s|$)`),
	regexp.MustCompile(`assert\s+\d+\s*==\s*\d+`),
	// Go: trying to be true
	regexp.MustCompile(`assert\.True\(t, true\)`),
	regexp.MustCompile(`require\.True\(t, true\)`),
	// Go: bare `if true {` theater
	regexp.MustCompile(`if\s+true\s*\{`),
	// Go: assert.True with literal true constant
	regexp.MustCompile(`assert\.True\([^)]*,\s*true\s*\)`),
	// Empty test bodies
	regexp.MustCompile(`test\(["'` + "`" + `][^"'` + "`" + `]*["'` + "`" + `],?\s*\(\s*\)\s*=>\s*\{\s*\}\)`),
	regexp.MustCompile(`it\(["'` + "`" + `][^"'` + "`" + `]*["'` + "`" + `],?\s*\(\s*\)\s*=>\s*\{\s*\}\)`),
	regexp.MustCompile(`t\.Skip\(`),
	regexp.MustCompile(`@pytest\.mark\.skip`),
}

// TheaterCheck flags assertion-free tests and mutation-passing suites.
type TheaterCheck struct{}

func NewTheaterCheck() *TheaterCheck { return &TheaterCheck{} }

func (c *TheaterCheck) Name() string { return theaterCheckName }

func (c *TheaterCheck) Run(ctx context.Context, pr *PRContext) ([]verdict.Finding, error) {
	var findings []verdict.Finding

	// 1) Static scan: theater patterns in the diff (ignoring +/- prefix).
	// Handle both LF and CRLF.
	lines := strings.Split(strings.ReplaceAll(pr.Diff, "\r\n", "\n"), "\n")
	for i, rawLine := range lines {
		// Strip diff prefix (+, -, or space) for pattern matching.
		line := rawLine
		if len(line) > 0 && (line[0] == '+' || line[0] == '-' || line[0] == ' ') {
			line = line[1:]
		}
		for _, re := range theaterPatterns {
			if re.MatchString(line) {
				findings = append(findings, verdict.Finding{
					Category:     theaterCheckName,
					Severity:     verdict.SeverityCritical,
					Message:      "theater test: assertion does not verify behavior (" + re.String() + ")",
					EvidencePath: "diff line " + itoa(i+1) + ": " + strings.TrimSpace(rawLine),
					Evidence:     strings.TrimSpace(rawLine),
					Suggestion:   "replace assertion-free checks with assertions that fail when the code under test breaks",
				})
				break
			}
		}
	}

	// 2) Mutation differential: production code is mutated (error handling
	// disabled, comparisons and boolean guards flipped) and the suite is
	// re-run. A suite that still passes against known-broken code proves
	// nothing — the mutant survived.
	if pr.TestOutput != "" && pr.MutatedTestOutput != "" {
		basePass := strings.Contains(strings.ToUpper(pr.TestOutput), "PASS") ||
			strings.Contains(strings.ToLower(pr.TestOutput), "passed")
		mutPass := strings.Contains(strings.ToUpper(pr.MutatedTestOutput), "PASS") ||
			strings.Contains(strings.ToLower(pr.MutatedTestOutput), "passed")
		if basePass && mutPass {
			findings = append(findings, verdict.Finding{
				Category:     theaterCheckName,
				Severity:     verdict.SeverityCritical,
				Message:      "tests still pass after production code was mutated — the suite cannot detect broken behavior",
				EvidencePath: "test-reality/mutation-differential",
				Evidence:     firstLine(pr.MutatedTestOutput),
				Suggestion:   "write assertions that observe real output; a real suite must fail when the code under test breaks",
			})
		}
	}

	return findings, nil
}

// firstLine returns the first line of a string — the human verdict line of
// a mutation-differential run (survivor name / kill confirmation).
func firstLine(s string) string {
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		return s[:i]
	}
	return s
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}
