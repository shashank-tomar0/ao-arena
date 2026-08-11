package referee

import (
	"context"
	"regexp"
	"strings"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

// symbolRealityCheck resolves symbols referenced by the diff against a known
// symbol index. References to symbols that don't exist anywhere in the
// codebase (or its manifests) are the signature of hallucinated APIs — the
// most documented agent failure mode.
type symbolRealityCheck struct{}

func NewSymbolRealityCheck() Check { return &symbolRealityCheck{} }

func (c *symbolRealityCheck) Name() string { return string(verdict.CategorySymbolReality) }

var ignoreTokens = map[string]bool{
	"true": true, "false": true, "null": true, "nil": true,
	"return": true, "import": true, "from": true, "def": true,
	"function": true, "const": true, "let": true, "var": true,
	"await": true, "async": true, "export": true, "default": true,
	"new": true, "class": true, "extends": true, "throw": true,
	"func": true, "package": true, "type": true,
}

var identifierRe = regexp.MustCompile(`[A-Za-z_][A-Za-z0-9_]{1,63}`)

// definitionRe matches local-definition patterns (func NAME, NAME := ...) which
// introduce symbols rather than reference them.
var definitionRe = regexp.MustCompile(`(?:^|\s)(?:func|type|const|var|let|class)\s+([A-Za-z_][A-Za-z0-9_]*)`)

func (c *symbolRealityCheck) Run(ctx context.Context, pr *PRContext) ([]verdict.Finding, error) {
	symbols := pr.SymbolIndex
	if symbols == nil {
		symbols = map[string][]string{}
	}

	// Track which symbols are defined in this diff (local introductions).
	introduced := map[string]bool{}
	for _, line := range addedLines(pr.Diff) {
		if m := definitionRe.FindStringSubmatch(line); m != nil {
			introduced[m[1]] = true
			continue
		}
		// also NAME := ... pattern: capture LHS of assignment
		if i := strings.Index(line, ":="); i > 0 {
			lhs := strings.TrimSpace(line[:i])
			if ident := identifierRe.FindString(lhs); ident != "" && len(ident) >= 2 {
				introduced[ident] = true
			}
		}
	}

	var findings []verdict.Finding
	seen := map[string]bool{} // dedupe per line(+symbol)

	for _, line := range addedLines(pr.Diff) {
		if !looksLikeCode(line) {
			continue
		}
		for _, tok := range identifierRe.FindAllString(line, -1) {
			if ignoreTokens[tok] || len(tok) < 3 {
				continue
			}
			if introduced[tok] {
				continue // defined by this same diff — not a reference
			}
			// Tokens preceded by '.' are method names resolved against the
			// receiver's type — not global namespace references. Verifying
			// them requires type resolution, so don't false-positive here.
			if idx := strings.Index(line, tok); idx > 0 && line[idx-1] == '.' {
				continue
			}
			if !possiblySymbolUse(line, tok) {
				continue
			}
			if _, ok := symbols[tok]; ok {
				continue // known symbol: fine
			}
			key := line + "|" + tok
			if seen[key] {
				continue
			}
			seen[key] = true
			findings = append(findings, verdict.Finding{
				Category:     verdict.CategorySymbolReality,
				Severity:     verdict.SeverityCritical,
				Message:      "diff references symbol not resolvable anywhere in the repository",
				EvidencePath: evidencePath(line),
				Suggestion:   "verify this API/import actually exists before shipping agent-written code",
			})
			if len(findings) >= 20 {
				return findings, nil
			}
		}
	}
	return findings, nil
}

func addedLines(diff string) []string {
	var out []string
	for _, line := range strings.Split(diff, "\n") {
		if strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") {
			out = append(out, strings.TrimPrefix(line, "+"))
		}
	}
	return out
}

func looksLikeCode(line string) bool {
	line = strings.TrimSpace(line)
	if line == "" || strings.HasPrefix(line, "//") || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "/*") {
		return false
	}
	// Heuristic: code lines carry operators, parens, or assignment.
	return strings.ContainsAny(line, "()={};") || strings.Contains(line, "import") || strings.Contains(line, "require")
}

func possiblySymbolUse(line, tok string) bool {
	idx := strings.Index(line, tok)
	if idx < 0 {
		return false
	}
	after := ""
	if idx+len(tok) < len(line) {
		after = string(line[idx+len(tok)])
	}
	return after == "(" || after == "." || strings.Contains(line, "import "+tok) ||
		strings.Contains(line, "from "+tok) || strings.Contains(line, "require('"+tok)
}

func evidencePath(line string) string {
	t := strings.TrimSpace(line)
	if len(t) > 120 {
		return t[:120]
	}
	return t
}
