// Command arena is the AO Arena CLI.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/shashank-tomar0/ao-arena/internal/arena"
	"github.com/shashank-tomar0/ao-arena/internal/broadcast"
	"github.com/shashank-tomar0/ao-arena/internal/referee"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(1)
	}
	ctx := context.Background()
	switch os.Args[1] {
	case "referee":
		runReferee(ctx)
	case "match":
		runMatch(ctx)
	case "league":
		runLeague(ctx)
	default:
		usage()
		os.Exit(1)
	}
}

func usage() {
	fmt.Println(`ao-arena — verification-as-officiating for AI agent fleets

Commands:
  referee <repo> <pr-ref>   Audit a pull request against reality
  match [--demo] [--serve]  Run a head-to-head on a spec; --serve broadcasts
  league                    Show season standings`)
}

func runReferee(ctx context.Context) {
	if len(os.Args) < 4 {
		fmt.Fprintln(os.Stderr, "usage: ao-arena referee <repo> <pr-ref>")
		os.Exit(2)
	}
	e := referee.NewEngine(nil)
	pr := &referee.PRContext{
		Repo:  os.Args[2],
		PRRef: os.Args[3],
		Diff:  "(standalone mode: connect a diff source)",
	}
	out, err := e.Run(ctx, pr)
	if err != nil {
		fmt.Fprintln(os.Stderr, "referee error:", err)
		os.Exit(1)
	}
	fmt.Println(out.Verdict.Summary)
	for _, f := range out.Verdict.Findings {
		fmt.Printf("  [%s] %s — %s\n", f.Severity, f.Category, f.Message)
	}
	fmt.Println("receipt:", out.Verdict.ReceiptHash)
}

func runMatch(ctx context.Context) {
	fs := flag.NewFlagSet("match", flag.ExitOnError)
	demo := fs.Bool("demo", false, "run the deterministic scripted demo match (no AO daemons needed)")
	serve := fs.Bool("serve", false, "start the SSE broadcast server on :8091")
	specID := fs.String("spec", "rest-api-auth", "spec id to run")
	_ = fs.Parse(os.Args[2:])

	if *serve {
		go broadcast.StartSSE(8091)
		fmt.Println("broadcast server: http://localhost:8091/events")
		fmt.Println("open frontend:   http://localhost:5173 (vite dev)")
	}

	if *demo {
		fmt.Println("match: demo race — honest vs dishonest fleet (deterministic)")
		score := broadcast.ScriptedMatch(ctx, broadcast.NewHub(), *specID)
		fmt.Print(broadcast.RenderFinale(score))
		return
	}

	spec := &arena.Spec{
		ID:      *specID,
		Name:    "REST API with authentication",
		RepoDir: "specs/" + *specID,
		Timeout: 10 * time.Minute,
	}
	fmt.Println("match:", spec.Name)
	fmt.Println("NOTE: live AO fleet registration + live verifier run land in the v0.2.0 milestone.")
	r := arena.NewRunner(referee.NewEngine(nil), 10*time.Minute)
	m, err := r.Run(ctx, spec, map[string]*arena.Fleet{})
	if err != nil {
		fmt.Fprintln(os.Stderr, "match error:", err)
		os.Exit(1)
	}
	fmt.Println("winner:", m.Winner)
	fmt.Println("log:", m.Log)
}

func runLeague(ctx context.Context) {
	fmt.Print(arena.LeagueTable(nil))
}
