// Package verdict defines the trust-audit data model shared across the
// referee engine, the CLI, and the broadcast layer.
package verdict

import (
	"time"
)

// Severity of a finding. Higher = more damaging to trust.
type Severity string

const (
	SeverityInfo     Severity = "info"
	SeverityWarning  Severity = "warning"
	SeverityCritical Severity = "critical"
)

// Category names the check that produced a finding.
type Category string

const (
	CategorySymbolReality Category = "symbol-reality"
	CategoryCompilerReality Category = "compiler-reality"
	CategoryTestMutation  Category = "test-mutation"
	CategoryClaimDiff     Category = "claim-vs-diff"
	CategoryMergeGate     Category = "merge-gate"
)

// Finding is a single piece of evidence produced by a check.
type Finding struct {
	Category     Category `json:"category"`
	Severity     Severity `json:"severity"`
	Message      string   `json:"message"`
	EvidencePath string   `json:"evidence_path,omitempty"` // file:line or symbol reference
	Evidence     string   `json:"evidence,omitempty"`       // code/claim snippet — what the finding points at
	Suggestion   string   `json:"suggestion,omitempty"`
}

// Verdict is the output of a referee run over one pull request.
type Verdict struct {
	PRRef       string    `json:"pr_ref"`
	Repo        string    `json:"repo"`
	Ref         string    `json:"ref"`
	Agent       string    `json:"agent,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	DurationMS  int64     `json:"duration_ms"`
	ChecksRun   []string  `json:"checks_run"`
	Findings    []Finding `json:"findings"`
	TrustScore  float64   `json:"trust_score"` // 0..100
	Mergeable   bool      `json:"mergeable"`
	Summary     string    `json:"summary"`
	ReceiptHash string    `json:"receipt_hash"` // sha256 of canonical JSON — tamper-evident
}

// VerdictText renders a human-readable report for the CLI and PR comments.
func (v *Verdict) VerdictText() string {
	return v.Summary
}
