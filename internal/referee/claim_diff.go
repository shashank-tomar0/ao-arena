package referee

import (
	"context"
	"regexp"
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
	{"added encryption", "encrypt", "encrypt"},
	{"added history", "history", "histor"},
	{"added moderation", "moderation", "moderat"},
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
					Evidence:     stmt,
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

// claimVerbRe matches the claim-carrying verb forms agents actually use in
// PR summaries: "added pagination", "implemented auth", "fixed the timeout",
// "supports retry". Plain keyword prefix matching ("add ") misses "added",
// which is the single most common agent claim phrasing — word-boundary
// matching catches all of them.
var claimVerbRe = regexp.MustCompile(`\b(added|removed|implemented|implement|fixed|fixing|refactored|refactor|supports?|handles?|migrates?|improves?|adds?)\b`)

func extractClaims(body string) []string {
	var out []string
	for _, line := range strings.Split(body, "\n") {
		t := strings.TrimSpace(line)
		if t == "" {
			continue
		}
		if claimVerbRe.MatchString(strings.ToLower(t)) {
			out = append(out, t)
		}
	}
	return out
}
