// Theater-tests check: agent PRs often ship tests that pass because they
// assert nothing — `expect(true).toBe(true)`, empty it() blocks, t.Skip.
// This check scans the diff for theater patterns AND compares the baseline
// test run against a mutation run: if tests pass unchanged after assertions
// are neutralized, the suite is theater.
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
					Suggestion:   "replace assertion-free checks with assertions that fail when the code under test breaks",
				})
				break
			}
		}
	}

	// 2) Mutation differential: a suite that passes with and without real
	// assertions proves nothing about the change.
	if pr.TestOutput != "" && pr.MutatedTestOutput != "" {
		basePass := strings.Contains(strings.ToUpper(pr.TestOutput), "PASS") ||
			strings.Contains(strings.ToLower(pr.TestOutput), "passed")
		mutPass := strings.Contains(strings.ToUpper(pr.MutatedTestOutput), "PASS") ||
			strings.Contains(strings.ToLower(pr.MutatedTestOutput), "passed")
		if basePass && mutPass {
			findings = append(findings, verdict.Finding{
				Category:     theaterCheckName,
				Severity:     verdict.SeverityCritical,
				Message:      "tests still pass after assertions were mutated — the suite does not verify behavior",
				EvidencePath: "test-reality/mutation-differential",
				Suggestion:   "write assertions that observe real output; run mutation testing to prove the suite can fail",
			})
		}
	}

	return findings, nil
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
