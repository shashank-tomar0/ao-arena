// Compiler-reality check: the strongest possible symbol-reality evidence.
// When the match engine builds the agent's delivery, the Go toolchain itself
// reports undefined symbols and missing packages with file:line evidence.
// This check turns those real compiler errors into referee findings — no
// regex heuristics, no false-positive debate: the toolchain is the judge.
package referee

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

// CompilerError is one real toolchain failure parsed from build/test output.
// Evidence is the compiler's own: file, line, and the raw error text.
type CompilerError struct {
	Symbol string `json:"symbol"`
	File   string `json:"file"`
	Line   int    `json:"line"`
	Raw    string `json:"raw"`
}

// compilerRealityCheck emits critical findings for every real compiler error.
type compilerRealityCheck struct{}

func NewCompilerRealityCheck() Check { return &compilerRealityCheck{} }

func (c *compilerRealityCheck) Name() string { return string(verdict.CategoryCompilerReality) }

func (c *compilerRealityCheck) Run(ctx context.Context, pr *PRContext) ([]verdict.Finding, error) {
	var findings []verdict.Finding
	for _, ce := range pr.CompilerErrors {
		msg := "compiler rejected the delivery: "
		if ce.Symbol != "" {
			msg += "undefined symbol " + ce.Symbol
		} else {
			msg += strings.TrimSpace(ce.Raw)
		}
		evidence := ce.File
		if ce.Line > 0 {
			evidence += ":" + strconv.Itoa(ce.Line)
		}
		if evidence == "" {
			evidence = strings.TrimSpace(ce.Raw) // never leave evidence empty
		}
		findings = append(findings, verdict.Finding{
			Category:     verdict.CategoryCompilerReality,
			Severity:     verdict.SeverityCritical,
			Message:      msg,
			EvidencePath: evidence,
			Evidence:     strings.TrimSpace(ce.Raw),
			Suggestion:   "the agent's delivery does not compile — the toolchain could not resolve the code it shipped",
		})
	}
	return findings, nil
}

// ParseCompilerErrors extracts real symbol/package resolution failures from
// `go test` / `go build` output. Recognized shapes:
//
//	./auth/auth_test.go:16:13: undefined: machenhance
//	auth.go:4:2: cannot find package "example.com/foo" in any of:
//	no required module provides package example.com/foo
//	./auth/auth_test.go:9:5: X is not defined        (JS toolchains)
//
// Every returned error carries the compiler's file:line as evidence.
func ParseCompilerErrors(output string) []CompilerError {
	var out []CompilerError
	seen := map[string]bool{}

	// Go: undefined: <symbol> with file:line.
	reUndefined := regexp.MustCompile(`([^\s]+\.go):(\d+):\d+:\s*undefined:\s*(\S+)`)
	for _, m := range reUndefined.FindAllStringSubmatch(output, -1) {
		line, _ := strconv.Atoi(m[2])
		key := "u|" + m[1] + ":" + m[2]
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, CompilerError{Symbol: m[3], File: m[1], Line: line, Raw: m[0]})
	}

	// Go: cannot find package "X" (optionally with file:line).
	rePkg := regexp.MustCompile(`([^\s]+\.go):(\d+):\d+:\s*cannot find package\s+"([^"]+)"`)
	for _, m := range rePkg.FindAllStringSubmatch(output, -1) {
		line, _ := strconv.Atoi(m[2])
		key := "p|" + m[1] + ":" + m[2]
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, CompilerError{Symbol: m[3], File: m[1], Line: line, Raw: m[0]})
	}

	// Go modules: no required module provides package X (no file context).
	reMod := regexp.MustCompile(`no required module provides package\s+([^\s;]+)`)
	for _, m := range reMod.FindAllStringSubmatch(output, -1) {
		key := "m|" + m[1]
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, CompilerError{Symbol: m[1], Raw: fmt.Sprintf("no required module provides package %s", m[1])})
	}

	// JS/TS: X is not defined with file:line.
	reJS := regexp.MustCompile(`([^\s]+\.(?:js|ts|jsx|tsx)):(\d+):\d+\s*-\s*error\s+TS\d+:\s*(?:Cannot find name|Cannot find module)\s+'([^']+)'`)
	for _, m := range reJS.FindAllStringSubmatch(output, -1) {
		line, _ := strconv.Atoi(m[2])
		key := "j|" + m[1] + ":" + m[2]
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, CompilerError{Symbol: m[3], File: m[1], Line: line, Raw: m[0]})
	}
	return out
}
