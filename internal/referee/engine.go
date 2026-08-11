// Package referee implements deterministic trust checks for agent-produced
// pull requests. Each check works against reality — the actual diff, the
// actual test suite, the actual repository symbol graph — not against an
// LLM's opinion.
package referee

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

// Result of a referee run over a single PR.
type Result struct {
	Verdict *verdict.Verdict
}

// Engine runs a set of checks against a PR and aggregates findings.
type Engine struct {
	Client      *http.Client
	Checks      []Check
	MaxFindings int
}

type Check interface {
	Name() string
	Run(ctx context.Context, pr *PRContext) ([]verdict.Finding, error)
}

// PRContext carries everything a check needs about the pull request.
type PRContext struct {
	Repo              string // owner/name
	PRRef             string
	HeadRef           string // branch or sha
	Diff              string // unified diff text
	Body              string // PR description / commit summary
	TestOutput        string
	MutatedTestOutput string
	ClaimStatements   []string
	SymbolIndex       map[string][]string // symbol -> file:line
}

// SummaryFromBody returns the PR body used to extract claims, falling back
// to the diff when no body is available.
func (p *PRContext) SummaryFromBody() string {
	if p.Body != "" {
		return p.Body
	}
	return p.Diff
}

// NewEngine builds an engine with the required checks in order.
func NewEngine(client *http.Client) *Engine {
	if client == nil {
		client = http.DefaultClient
	}
	return &Engine{
		Client:      client,
		Checks:      []Check{NewSymbolRealityCheck(), NewClaimDiffCheck()},
		MaxFindings: 50,
	}
}

// Run executes every check and assembles the verdict.
func (e *Engine) Run(ctx context.Context, pr *PRContext) (*Result, error) {
	start := time.Now()
	var findings []verdict.Finding
	checksRun := []string{}
	for _, c := range e.Checks {
		fs, err := c.Run(ctx, pr)
		if err != nil {
			// A broken check must not silently pass; record as a warning.
			fs = append(fs, verdict.Finding{
				Category: verdict.Category(c.Name()),
				Severity: verdict.SeverityWarning,
				Message:  fmt.Sprintf("check %q failed to run: %v", c.Name(), err),
			})
		}
		checksRun = append(checksRun, c.Name())
		findings = append(findings, fs...)
		if len(findings) >= e.MaxFindings {
			break
		}
	}

	v := verdict.Verdict{
		PRRef:      pr.PRRef,
		Repo:       pr.Repo,
		Ref:        pr.HeadRef,
		CreatedAt:  start,
		DurationMS: time.Since(start).Milliseconds(),
		ChecksRun:  checksRun,
		Findings:   findings,
		TrustScore: Score(findings),
	}
	v.Mergeable = v.TrustScore >= 70 && !hasCritical(v.Findings)
	v.Summary = Summary(v)
	v.ReceiptHash = Hash(v)
	return &Result{Verdict: &v}, nil
}

// hasCritical reports whether any finding is critical. Critical findings are
// merge-blocking regardless of the numeric score.
func hasCritical(findings []verdict.Finding) bool {
	for _, f := range findings {
		if f.Severity == verdict.SeverityCritical {
			return true
		}
	}
	return false
}

// Score maps findings to a 0..100 trust score.
func Score(findings []verdict.Finding) float64 {
	score := 100.0
	for _, f := range findings {
		switch f.Severity {
		case verdict.SeverityCritical:
			score -= 30
		case verdict.SeverityWarning:
			score -= 10
		case verdict.SeverityInfo:
			score -= 2
		}
	}
	if score < 0 {
		return 0
	}
	return score
}

// Summary renders a one-line human verdict.
func Summary(v verdict.Verdict) string {
	crit := 0
	for _, f := range v.Findings {
		if f.Severity == verdict.SeverityCritical {
			crit++
		}
	}
	if crit > 0 {
		return fmt.Sprintf(
			"BLOCKED — %d critical finding(s) undermine agent trust in %s. Score %0.1f/100. See evidence below.",
			crit, v.PRRef, v.TrustScore)
	}
	if v.TrustScore >= 70 {
		return fmt.Sprintf(
			"CLEAN — evidence checks passed for %s. Score %0.1f/100, mergeable.",
			v.PRRef, v.TrustScore)
	}
	return fmt.Sprintf(
		"CAUTION — %s shows unresolved trust gaps. Score %0.1f/100, not cleared for merge.",
		v.PRRef, v.TrustScore)
}

// Hash produces a tamper-evident receipt hash over canonical verdict JSON.
func Hash(v verdict.Verdict) string {
	var sb strings.Builder
	sb.WriteString(v.Repo + "|" + v.PRRef + "|" + v.Ref)
	for _, f := range v.Findings {
		sb.WriteString(fmt.Sprintf("|%s|%s|%s|%s", f.Category, f.Severity, f.EvidencePath, f.Message))
	}
	sum := sha256.Sum256([]byte(sb.String()))
	return fmt.Sprintf("%x", sum)
}
