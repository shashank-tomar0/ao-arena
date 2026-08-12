// Package vcs provides GitHub API integration for the referee.
// It fetches PR diffs, bodies, CI status, and posts review comments.
package vcs

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/go-github/v60/github"
)

// Client wraps the GitHub client with arena-specific helpers.
type Client struct {
	gh   *github.Client
	repo string // owner/name
}

// NewClient builds a client from GITHUB_TOKEN (required) and optional GITHUB_API_URL.
func NewClient(repo string) (*Client, error) {
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		return nil, fmt.Errorf("GITHUB_TOKEN not set")
	}
	baseURL := os.Getenv("GITHUB_API_URL")
	httpClient := &http.Client{Timeout: 30 * time.Second}
	var gh *github.Client
	if baseURL != "" {
		var err error
		gh, err = github.NewEnterpriseClient(baseURL, baseURL, httpClient)
		if err != nil {
			return nil, err
		}
	} else {
		gh = github.NewClient(httpClient)
	}
	gh = gh.WithAuthToken(token)
	return &Client{gh: gh, repo: repo}, nil
}

// ParseRepo splits "owner/name" into parts.
func ParseRepo(full string) (owner, name string) {
	parts := strings.Split(full, "/")
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return "", ""
}

// PRData is the minimal PR context the referee needs.
type PRData struct {
	Number       int
	HeadSHA      string
	BaseSHA      string
	Title        string
	Body         string
	Diff         string
	HeadRef      string
	BaseRef      string
	Mergeable    *bool
	State        string
	ChecksStatus map[string]string // check name -> conclusion
}

// FetchPR gets the PR diff, body, and CI status in one call.
func (c *Client) FetchPR(ctx context.Context, prNum int) (*PRData, error) {
	owner, name := ParseRepo(c.repo)
	if owner == "" {
		return nil, fmt.Errorf("invalid repo %q", c.repo)
	}

	pr, _, err := c.gh.PullRequests.Get(ctx, owner, name, prNum)
	if err != nil {
		return nil, fmt.Errorf("get PR: %w", err)
	}

	// Diff — use media type for unified diff
	diffBytes, _, err := c.gh.PullRequests.GetRaw(ctx, owner, name, prNum, github.RawOptions{Type: github.Diff})
	if err != nil {
		return nil, fmt.Errorf("get diff: %w", err)
	}

	// CI status from combined status on head SHA
	checks := make(map[string]string)
	if pr.Head != nil && pr.Head.SHA != nil {
		combined, _, err := c.gh.Repositories.GetCombinedStatus(ctx, owner, name, *pr.Head.SHA, nil)
		if err == nil && combined != nil {
			for _, s := range combined.Statuses {
				if s.Context != nil && s.State != nil {
					checks[*s.Context] = *s.State
				}
			}
			// Also check check-runs for richer conclusions
			runs, _, err := c.gh.Checks.ListCheckRunsForRef(ctx, owner, name, *pr.Head.SHA, nil)
			if err == nil && runs != nil {
				for _, run := range runs.CheckRuns {
					if run.Name != nil && run.Conclusion != nil {
						checks[*run.Name] = *run.Conclusion
					}
				}
			}
		}
	}

	return &PRData{
		Number:       prNum,
		HeadSHA:      *pr.Head.SHA,
		BaseSHA:      *pr.Base.SHA,
		Title:        *pr.Title,
		Body:         safeString(pr.Body),
		Diff:         diffBytes,
		HeadRef:      safeString(pr.Head.Ref),
		BaseRef:      safeString(pr.Base.Ref),
		Mergeable:    pr.Mergeable,
		State:        safeString(pr.State),
		ChecksStatus: checks,
	}, nil
}

func safeString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// PostReviewComment posts a review comment on the PR.
func (c *Client) PostReviewComment(ctx context.Context, prNum int, body string) error {
	owner, name := ParseRepo(c.repo)
	comment := &github.IssueComment{Body: github.String(body)}
	_, _, err := c.gh.Issues.CreateComment(ctx, owner, name, prNum, comment)
	return err
}

// PostCheckRun creates/updates a check run for the referee verdict.
func (c *Client) PostCheckRun(ctx context.Context, prNum int, name, conclusion, summary, details string) error {
	owner, repo := ParseRepo(c.repo)
	pr, _, err := c.gh.PullRequests.Get(ctx, owner, repo, prNum)
	if err != nil {
		return err
	}
	headSHA := ""
	if pr.Head != nil && pr.Head.SHA != nil {
		headSHA = *pr.Head.SHA
	}
	run := github.CreateCheckRunOptions{
		Name:       name,
		HeadSHA:    headSHA,
		Status:     github.String("completed"),
		Conclusion: github.String(conclusion),
		Output: &github.CheckRunOutput{
			Title:   github.String("AO Arena Referee"),
			Summary: github.String(summary),
			Text:    github.String(details),
		},
	}
	_, _, err = c.gh.Checks.CreateCheckRun(ctx, owner, repo, run)
	return err
}

// ExtractClaimStatements parses actionable claims from PR body and commit messages.
func ExtractClaimStatements(pr *PRData) []string {
	var claims []string
	for _, line := range strings.Split(pr.Body, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "- [") || strings.HasPrefix(line, "* [") {
			continue
		}
		lower := strings.ToLower(line)
		if strings.Contains(lower, "implement") || strings.Contains(lower, "add") ||
			strings.Contains(lower, "fix") || strings.Contains(lower, "refactor") ||
			strings.Contains(lower, "update") || strings.Contains(lower, "create") {
			claims = append(claims, line)
		}
	}
	return claims
}

// BuildPRContext converts vcs.PRData into referee.PRContext.
func BuildPRContext(pr *PRData) *PRContext {
	return &PRContext{
		Repo:            pr.Title, // placeholder; caller sets actual repo
		PRRef:           fmt.Sprintf("pr-%d", pr.Number),
		HeadRef:         pr.HeadSHA[:12],
		Diff:            pr.Diff,
		Body:            pr.Body,
		ClaimStatements: ExtractClaimStatements(pr),
		ChecksStatus:    pr.ChecksStatus,
	}
}

// PRContext mirrors referee.PRContext but with VCS-specific additions.
type PRContext struct {
	Repo              string
	PRRef             string
	HeadRef           string
	Diff              string
	Body              string
	ClaimStatements   []string
	ChecksStatus      map[string]string
	SymbolIndex       map[string][]string // populated by caller
	TestOutput        string
	MutatedTestOutput string
}