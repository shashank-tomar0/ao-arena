// Command referee is the standalone verification binary.
//
// It audits a pull request against reality and prints a verdict with
// evidence. In CI it is meant to run as a GitHub Action; locally it can
// consume a diff via stdin.
//
// Usage:
//
//	referee <repo> <pr-ref> [<head-sha>]
//	cat pr.diff | referee --stdin <repo> <pr-ref>
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"github.com/shashank-tomar0/ao-arena/internal/referee"
	"github.com/shashank-tomar0/ao-arena/internal/vcs"
)

func main() {
	stdin := flag.Bool("stdin", false, "read unified diff from stdin")
	j := flag.Bool("json", false, "emit verdict as JSON")
	live := flag.Bool("live", false, "fetch the PR from GitHub (needs GITHUB_TOKEN)")
	post := flag.Bool("post", false, "post verdict as check run + review comment (needs --live and GITHUB_TOKEN)")
	threshold := flag.Float64("threshold", 70, "minimum trust score (0-100) for the posted check run to pass")
	flag.Parse()
	args := flag.Args()
	if len(args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: referee [-stdin|-live [-post]] [-json] <repo> <pr-ref> [<head-sha>]")
		os.Exit(2)
	}
	repo, prRef := args[0], args[1]
	head := ""
	if len(args) > 2 {
		head = args[2]
	}

	diff := ""
	if *stdin {
		b, err := io.ReadAll(os.Stdin)
		if err != nil {
			fmt.Fprintln(os.Stderr, "read stdin:", err)
			os.Exit(1)
		}
		diff = string(b)
	}

	var pr *referee.PRContext
	switch {
	case *live:
		num, err := strconv.Atoi(strings.TrimPrefix(prRef, "pr-"))
		if err != nil {
			fmt.Fprintln(os.Stderr, "live mode needs a numeric PR number:", err)
			os.Exit(2)
		}
		vc, err := vcs.NewClient(repo)
		if err != nil {
			fmt.Fprintln(os.Stderr, "vcs:", err)
			os.Exit(1)
		}
		data, err := vc.FetchPR(context.Background(), num)
		if err != nil {
			fmt.Fprintln(os.Stderr, "fetch PR:", err)
			os.Exit(1)
		}
		pr = &referee.PRContext{
			Repo:            repo,
			PRRef:           fmt.Sprintf("pr-%d", num),
			HeadRef:         data.HeadSHA[:12],
			Diff:            data.Diff,
			Body:            data.Body,
			ClaimStatements: vcs.ExtractClaimStatements(data),
			Mergeable:       data.Mergeable,
			ChecksStatus:    data.ChecksStatus,
		}
	default:
		pr = &referee.PRContext{
			Repo:    repo,
			PRRef:   prRef,
			HeadRef: head,
			Diff:    diff,
		}
	}

	e := referee.NewEngine(nil)
	out, err := e.Run(context.Background(), pr)
	if err != nil {
		fmt.Fprintln(os.Stderr, "referee:", err)
		os.Exit(1)
	}

	if *post && *live {
		num, _ := strconv.Atoi(strings.TrimPrefix(prRef, "pr-"))
		vc, err := vcs.NewClient(repo)
		if err == nil {
		// The check conclusion respects BOTH reality (mergeability) and the
		// operator's configured threshold — an action threshold below 100
		// cannot green-light a verdict the referee already blocked.
		conclusion := "neutral"
		switch {
		case !out.Verdict.Mergeable:
			conclusion = "failure"
		case out.Verdict.TrustScore < *threshold:
			conclusion = "failure"
		default:
			conclusion = "success"
		}
			_ = vc.PostCheckRun(context.Background(), num, "AO Arena Referee", conclusion,
				out.Verdict.Summary, renderEvidence(out))
			_ = vc.PostReviewComment(context.Background(), num, renderEvidence(out))
		}
	}

	if *j {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		if err := enc.Encode(out.Verdict); err != nil {
			fmt.Fprintln(os.Stderr, "encode verdict:", err)
			os.Exit(1)
		}
		return
	}
	fmt.Println(out.Verdict.Summary)
	for _, f := range out.Verdict.Findings {
		fmt.Printf("  [%s] %s: %s\n", f.Severity, f.Category, f.Message)
		if f.EvidencePath != "" {
			fmt.Printf("        evidence: %s\n", f.EvidencePath)
		}
	}
	fmt.Println("receipt:", out.Verdict.ReceiptHash)
}

func renderEvidence(res *referee.Result) string {
	var sb strings.Builder
	sb.WriteString("## AO Arena Referee verdict\n\n")
	sb.WriteString(res.Verdict.Summary + "\n\n")
	sb.WriteString(fmt.Sprintf("**Trust score:** %0.1f/100\n\n", res.Verdict.TrustScore))
	if len(res.Verdict.Findings) == 0 {
		sb.WriteString("No findings.\n")
		return sb.String()
	}
	sb.WriteString("### Findings\n\n")
	for _, f := range res.Verdict.Findings {
		sb.WriteString(fmt.Sprintf("- **[%s]** %s: %s\n", f.Severity, f.Category, f.Message))
		if f.EvidencePath != "" {
			sb.WriteString(fmt.Sprintf("  `%s`\n", f.EvidencePath))
		}
	}
	sb.WriteString(fmt.Sprintf("\nReceipt: `%s`\n", res.Verdict.ReceiptHash))
	return sb.String()
}
