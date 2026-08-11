package referee

import (
	"context"
	"strings"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

// claimDiffCheck verifies that claimed changes in the agent's PR summary
// actually exist in the diff. Ghost claims — statements describing work the
// diff doesn't contain — are a hallmark of agent overconfidence.
type claimDiffCheck struct{}

func NewClaimDiffCheck() Check { return &claimDiffCheck{} }

func (c *claimDiffCheck) Name() string { return string(verdict.CategoryClaimDiff) }

// Claim patterns map a phrase to the diff evidence that would substantiate it.
var claimPatterns = []struct {
	claim   string
	keyword string
	needle  string
}{
	{"added tests", "test", "+*_test.go"},
	{"added pagination", "pagination", "page"},
	{"added authentication", "auth", "auth"},
	{"added validation", "validat", "validat"},
	{"added error handling", "error handling", "error"},
	{"added timeout", "timeout", "timeout"},
	{"added retry", "retry", "retry"},
	{"added rate limiting", "rate limit", "limit"},
	{"added logging", "log", "log("},
	{"added metrics", "metric", "metric"},
	{"added caching", "cach", "cache"},
	{"refactored", "refactor", "func "},
}

func (c *claimDiffCheck) Run(ctx context.Context, pr *PRContext) ([]verdict.Finding, error) {
	var findings []verdict.Finding
	diffLower := strings.ToLower(pr.Diff)
	hasTests := strings.Contains(diffLower, "_test.go") ||
		strings.Contains(diffLower, ".test.") ||
		strings.Contains(diffLower, "describe(") ||
		strings.Contains(diffLower, "it(") ||
		strings.Contains(diffLower, "func Test")

	claimed := pr.ClaimStatements
	if len(claimed) == 0 {
		claimed = extractClaims(pr.SummaryFromBody())
	}

	for _, stmt := range claimed {
		for _, p := range claimPatterns {
			if !strings.Contains(strings.ToLower(stmt), p.claim) {
				continue
			}
			// The claim mentions a feature; verify the diff actually contains it.
			matched := strings.Contains(diffLower, p.needle)
			if p.claim == "added tests" && hasTests {
				matched = true
			}
			if !matched {
				findings = append(findings, verdict.Finding{
					Category:     verdict.CategoryClaimDiff,
					Severity:     verdict.SeverityCritical,
					Message:      "PR summary claims \"" + p.claim + "\" but the diff contains no supporting evidence",
					EvidencePath: "pr-summary",
					Suggestion:   "agent summary does not match shipped changes — verify before trusting the description",
				})
			}
			break
		}
		if len(findings) >= 20 {
			break
		}
	}
	return findings, nil
}

var claimKeywords = []string{
	"add", "implement", "fix", "refactor", "support", "handle", "migrate",
}

func extractClaims(body string) []string {
	var out []string
	for _, line := range strings.Split(body, "\n") {
		t := strings.TrimSpace(line)
		if t == "" {
			continue
		}
		lower := strings.ToLower(t)
		hit := false
		for _, kw := range claimKeywords {
			if strings.Contains(lower, kw+" ") || strings.HasPrefix(lower, kw+" ") {
				hit = true
				break
			}
		}
		if hit {
			out = append(out, t)
		}
	}
	return out
}
