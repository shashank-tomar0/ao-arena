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

	"github.com/shashank-tomar0/ao-arena/internal/referee"
)

func main() {
	stdin := flag.Bool("stdin", false, "read unified diff from stdin")
	j := flag.Bool("json", false, "emit verdict as JSON")
	flag.Parse()
	args := flag.Args()
	if len(args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: referee [-stdin] [-json] <repo> <pr-ref> [<head-sha>]")
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

	e := referee.NewEngine(nil)
	pr := &referee.PRContext{
		Repo:    repo,
		PRRef:   prRef,
		HeadRef: head,
		Diff:    diff,
	}
	out, err := e.Run(context.Background(), pr)
	if err != nil {
		fmt.Fprintln(os.Stderr, "referee:", err)
		os.Exit(1)
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
