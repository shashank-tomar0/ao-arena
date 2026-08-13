// Package server is the AO Arena full-stack server.
// It serves the REST API, SSE event stream, and the built frontend.
package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/shashank-tomar0/ao-arena/internal/broadcast"
	"github.com/shashank-tomar0/ao-arena/internal/league"
	"github.com/shashank-tomar0/ao-arena/internal/match"
	"github.com/shashank-tomar0/ao-arena/internal/referee"
	"github.com/shashank-tomar0/ao-arena/internal/verdict"
)

//go:embed static/*
var frontendFS embed.FS

type App struct {
	mu          sync.RWMutex
	hub         *broadcast.Hub
	matchEngine *match.Engine
	referee     *referee.Engine
	league      *league.Store
	activeMatch *match.MatchResult
	matchCancel context.CancelFunc

	// matchEvents buffers the broadcast timeline of the running match so it
	// can be persisted for replay after the match completes.
	matchEvents []broadcast.Event
}

func main() {
	// Spec selection: SPEC_ID (default rest-api-auth). The engine runs real
	// acceptance tests — `go test` or `node --test` — against this spec in
	// git worktrees, whatever toolchain the spec declares.
	specID := os.Getenv("SPEC_ID")
	if specID == "" {
		specID = "rest-api-auth"
	}

	// The match engine expects the repo root that contains specs/.
	repoRoot := os.Getenv("REPO_ROOT")
	if repoRoot == "" {
		repoRoot = "."
	}

	store, err := league.NewStore(os.Getenv("ARENA_STORE"))
	if err != nil {
		log.Fatalf("league store: %v", err)
	}

	engine, err := match.NewEngine(repoRoot, specID)
	if err != nil {
		log.Fatalf("match engine: %v", err)
	}

	app := &App{
		hub:         broadcast.NewHub(),
		matchEngine: engine,
		referee:     referee.NewEngine(nil),
		league:      store,
	}

	// The match engine's real pipeline phases (worktree → testing →
	// mutation → referee → verdict) become live session cards on the arena
	// boards and progress lines in the evidence rail. Nothing is scripted:
	// every phase reflects the actual state of the running match — and every
	// event is recorded so the match can be replayed later.
	app.matchEngine.PhaseFn = func(fleet, phase, detail string) {
		card := broadcast.SessionCard{
			ID:     "fleet-" + fleet,
			Fleet:  fleet,
			Label:  "fleet-" + fleet + "-" + app.matchEngine.Spec.Lang + "-harness",
			Branch: fleetBranch(fleet),
			Status: phase,
			TS:     time.Now().UnixMilli(),
		}
		app.record(card)
		ev := broadcast.RefereeEvent{
			Fleet:    fleet,
			Severity: "info",
			Category: "match",
			Message:  detail,
			TS:       time.Now().UnixMilli(),
		}
		app.record(ev)
	}

	mux := http.NewServeMux()

	// API endpoints
	mux.HandleFunc("/api/health", app.handleHealth)
	mux.HandleFunc("/api/match", app.handleMatch)
	mux.HandleFunc("/api/match/status", app.handleMatchStatus)
	mux.HandleFunc("/api/match/replay", app.handleMatchReplay)
	mux.HandleFunc("/api/spec", app.handleSpec)
	mux.HandleFunc("/api/audit", app.handleAudit)
	mux.HandleFunc("/api/verify", app.handleVerify)
	mux.HandleFunc("/api/determinism", app.handleDeterminism)
	mux.HandleFunc("/api/ledger", app.handleLedger)
	mux.HandleFunc("/api/verdict/", app.handleVerdictPage)
	mux.HandleFunc("/api/league", app.handleLeague)
	mux.HandleFunc("/api/history", app.handleHistory)
	mux.HandleFunc("/api/stats", app.handleStats)

	// SSE broadcast
	mux.HandleFunc("/events", app.handleEvents)

	// Serve frontend (embedded dist)
	app.serveFrontend(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := "127.0.0.1:" + port

	log.Printf("AO Arena server starting on http://%s", addr)
	log.Printf("Spec: %s (%s) | store: %s", app.matchEngine.Spec.ID, app.matchEngine.Spec.Lang, storePath(store))
	log.Printf("SSE: http://%s/events", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func storePath(s *league.Store) string {
	return os.Getenv("ARENA_STORE")
}

// record broadcasts an event to SSE subscribers and appends it to the
// running match's timeline so the match can be replayed from the league
// store after it completes.
func (a *App) record(data any) {
	var ev broadcast.Event
	switch d := data.(type) {
	case broadcast.SessionCard:
		ev = broadcast.Event{Kind: "session", Data: d}
	case broadcast.RefereeEvent:
		ev = broadcast.Event{Kind: "referee", Data: d}
	case [2]float64:
		ev = broadcast.Event{Kind: "score", Data: d}
	case map[string]string:
		ev = broadcast.Event{Kind: "status", Data: d}
	default:
		return
	}
	a.hub.Publish(ev.Kind, ev.Data)
	a.mu.Lock()
	a.matchEvents = append(a.matchEvents, ev)
	a.mu.Unlock()
}

func (a *App) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (a *App) handleSpec(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"id":     a.matchEngine.Spec.ID,
		"name":   a.matchEngine.Spec.Name,
		"lang":   a.matchEngine.Spec.Lang,
		"checks": []string{"symbol-reality", "compiler-reality", "test-reality", "claim-vs-diff", "merge-gate"},
	})
}

func (a *App) handleMatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Cancel any running match.
	if a.matchCancel != nil {
		a.matchCancel()
	}

	ctx, cancel := context.WithCancel(context.Background())
	a.matchCancel = cancel

	var req struct {
		FleetADiff string `json:"fleet_a_diff"`
		FleetBDiff string `json:"fleet_b_diff"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Empty diffs default to the canonical honest-vs-dishonest fixture for
	// the configured spec: the referee really runs the spec's tests in fresh
	// worktrees and really audits both deliveries. Nothing is scripted on
	// this path. The fixture ships a dishonest PR *body* full of ghost
	// claims too, so the match catches all three documented failure modes
	// live on every spec (Go or Node).
	diffA, diffB, bodyA, bodyB := match.FixturesFor(a.matchEngine.Spec.ID)
	if req.FleetADiff != "" {
		bodyA = "" // caller supplied the delivery — no fixture body
	}
	if req.FleetBDiff != "" {
		bodyB = ""
	}
	if req.FleetADiff == "" {
		req.FleetADiff = diffA
	}
	if req.FleetBDiff == "" {
		req.FleetBDiff = diffB
	}

	// Start the match asynchronously.
	go func() {
		a.mu.Lock()
		a.matchEvents = nil
		a.mu.Unlock()

		a.record(map[string]string{"status": "running", "detail": "Fleets are working — real worktrees, real " + a.matchEngine.Spec.Lang + " tests, real referee."})
		a.record(broadcast.RefereeEvent{
			Fleet:    "system",
			Severity: "info",
			Category: "match",
			Message:  "Match started — honest vs dishonest delivery on the spec",
			TS:       time.Now().UnixMilli(),
		})

		result, err := a.matchEngine.Run(ctx, req.FleetADiff, req.FleetBDiff, bodyA, bodyB)
		if err != nil {
			log.Printf("Match error: %v", err)
			a.record(broadcast.RefereeEvent{
				Fleet:    "system",
				Severity: "critical",
				Category: "match",
				Message:  "Match failed: " + err.Error(),
				TS:       time.Now().UnixMilli(),
			})
			a.record(map[string]string{"status": "error", "detail": "Match failed: " + err.Error()})
			return
		}

		a.mu.Lock()
		a.activeMatch = result
		a.mu.Unlock()

		// Broadcast each fleet's real verdict findings, then the final
		// cumulative scoreboard once.
		a.broadcastVerdict("a", result.FleetA)
		a.broadcastVerdict("b", result.FleetB)
		a.record([2]float64{result.FleetA.TrustScore, result.FleetB.TrustScore})

		a.record(broadcast.RefereeEvent{
			Fleet:    "system",
			Severity: "info",
			Category: "match",
			Message:  "Match complete: winner " + result.Winner,
			TS:       time.Now().UnixMilli(),
		})
		a.record(map[string]string{"status": "complete", "detail": "Match complete — winner " + result.Winner})

		// Persist the season record + ELO, sealed into the trust ledger with
		// the full verdicts and the event timeline (for replay).
		rec := league.MatchRecord{
			ID:         fmt.Sprintf("m-%d", time.Now().UnixMilli()),
			Kind:       league.KindMatch,
			SpecID:     result.SpecID,
			FleetA:     "Fleet A",
			FleetB:     "Fleet B",
			ScoreA:     result.FleetA.TrustScore,
			ScoreB:     result.FleetB.TrustScore,
			Winner:     fleetDisplayName(result.Winner),
			Summary:    "winner " + fleetDisplayName(result.Winner),
			DurationMS: result.Duration.Milliseconds(),
		}
		rec.VerdictA, _ = json.Marshal(result.FleetA.Verdict)
		rec.VerdictB, _ = json.Marshal(result.FleetB.Verdict)
		if result.FleetA.Verdict != nil {
			rec.Receipt = result.FleetA.Verdict.ReceiptHash
		}
		if result.FleetB.Verdict != nil {
			rec.Receipt = result.FleetB.Verdict.ReceiptHash
		}
		a.mu.Lock()
		events := append([]broadcast.Event(nil), a.matchEvents...)
		a.mu.Unlock()
		for _, ev := range events {
			b, err := json.Marshal(ev)
			if err == nil {
				rec.Events = append(rec.Events, b)
			}
		}
		_ = a.league.Record(rec)
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "started"})
}

func (a *App) broadcastVerdict(fleet string, fr match.FleetResult) {
	if fr.Verdict == nil {
		return
	}
	for _, f := range fr.Verdict.Findings {
		sev := string(f.Severity)
		if sev == "" {
			sev = "info"
		}
		evidence := f.Evidence
		if evidence == "" {
			evidence = f.EvidencePath
		}
		a.record(broadcast.RefereeEvent{
			Fleet:    fleet,
			Severity: sev,
			Category: string(f.Category),
			Message:  f.Message,
			Evidence: evidence,
			TS:       time.Now().UnixMilli(),
		})
	}
}

func (a *App) handleMatchStatus(w http.ResponseWriter, r *http.Request) {
	a.mu.RLock()
	m := a.activeMatch
	a.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	if m == nil {
		json.NewEncoder(w).Encode(map[string]any{"status": "idle"})
		return
	}
	json.NewEncoder(w).Encode(map[string]any{
		"status":   "complete",
		"winner":   m.Winner,
		"fleet_a":  fleetSummary(m.FleetA),
		"fleet_b":  fleetSummary(m.FleetB),
		"duration": m.Duration.Milliseconds(),
		"spec_id":  m.SpecID,
	})
}

func fleetSummary(fr match.FleetResult) map[string]any {
	return map[string]any{
		"trust_score": fr.TrustScore,
		"tests_pass":  fr.TestsPass,
		"coverage":    fr.Coverage,
		"duration":    fr.Duration.Milliseconds(),
		"error":       nil,
	}
}

// handleAudit runs the standalone referee on a raw diff + PR body. This is
// the referee-as-a-service surface: paste any agent diff, get a real,
// evidence-grade verdict. No script, no fixture, no demo — the checks run
// against the exact input.
func (a *App) handleAudit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Repo       string   `json:"repo"`
		PRRef      string   `json:"pr_ref"`
		Diff       string   `json:"diff"`
		Body       string   `json:"body"`
		Claims     []string `json:"claims"`
		TestOutput string   `json:"test_output"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.Diff == "" {
		http.Error(w, "diff is required", http.StatusBadRequest)
		return
	}
	if req.Repo == "" {
		req.Repo = "arena/audit"
	}
	if req.PRRef == "" {
		req.PRRef = "audit-" + fmt.Sprintf("%d", time.Now().UnixMilli())
	}

	pr := &referee.PRContext{
		Repo:            req.Repo,
		PRRef:           req.PRRef,
		HeadRef:         "HEAD",
		Diff:            req.Diff,
		Body:            req.Body,
		ClaimStatements: req.Claims,
		// Optional CI/build output: real toolchain failures become
		// compiler-reality findings with the compiler's own file:line.
		CompilerErrors: referee.ParseCompilerErrors(req.TestOutput),
	}
	out, err := a.referee.Run(r.Context(), pr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Persist the audit — verdict JSON + receipt sealed into the trust ledger
	// — so the league shows it AND the receipt is verifiable forever
	// (shareable /r/<receipt> pages).
	vJSON, _ := json.Marshal(out.Verdict)
	_ = a.league.Record(league.MatchRecord{
		ID:         req.PRRef,
		Kind:       league.KindAudit,
		FleetA:     "Audit",
		FleetB:     req.PRRef,
		ScoreA:     out.Verdict.TrustScore,
		Winner:     auditWinner(out.Verdict),
		Summary:    out.Verdict.Summary,
		DurationMS: out.Verdict.DurationMS,
		Receipt:    out.Verdict.ReceiptHash,
		Verdict:    vJSON,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out.Verdict)
}

// auditWinner labels a standalone audit record for the activity log.
func auditWinner(v *verdict.Verdict) string {
	if v.Mergeable {
		return "clean"
	}
	return "blocked"
}

// handleVerify recomputes the receipt hash over a verdict and compares it to
// the claimed receipt. This is the tamper-evidence demo: edit any finding
// (or score, or summary) and the receipt breaks.
func (a *App) handleVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Verdict *verdict.Verdict `json:"verdict"`
		Receipt string           `json:"receipt"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Verdict == nil {
		http.Error(w, "verdict is required", http.StatusBadRequest)
		return
	}
	recomputed := referee.Hash(*req.Verdict)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"valid":      recomputed == req.Receipt && req.Receipt != "",
		"recomputed": recomputed,
		"claimed":    req.Receipt,
	})
}

// handleDeterminism runs the same audit input through the referee N times and
// proves identical receipts — the deterministic-verdict guarantee, measured.
func (a *App) handleDeterminism(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Diff string `json:"diff"`
		Body string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.Diff == "" {
		http.Error(w, "diff is required", http.StatusBadRequest)
		return
	}

	const runs = 5
	receipts := make([]string, 0, runs)
	var first *verdict.Verdict
	for i := 0; i < runs; i++ {
		// Identical input every run — the receipt hash covers repo, ref, and
		// findings, so the PRRef must be identical too. Only then is "same
		// diff → same receipt" a real, measured guarantee.
		pr := &referee.PRContext{
			Repo:            "arena/determinism",
			PRRef:           "det-run",
			HeadRef:         "HEAD",
			Diff:            req.Diff,
			Body:            req.Body,
			ClaimStatements: []string{},
		}
		out, err := a.referee.Run(r.Context(), pr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		receipts = append(receipts, out.Verdict.ReceiptHash)
		if first == nil {
			first = out.Verdict
		}
	}

	deterministic := true
	for _, rc := range receipts {
		if rc != receipts[0] {
			deterministic = false
			break
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"receipts":     receipts,
		"deterministic": deterministic,
		"score":        first.TrustScore,
		"runs":         runs,
	})
}

// handleLedger reports the health of the season's tamper-evident trust
// ledger: every record is chained to the one before it, so rewriting any
// past result breaks the chain.
func (a *App) handleLedger(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"chain": a.league.VerifyChain(),
	})
}

// handleVerdictPage resolves a receipt hash to its persisted verdict — the
// shareable /r/<receipt> surface. Any audit or match verdict recorded in the
// league can be re-opened and re-verified by its receipt alone.
func (a *App) handleVerdictPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	hash := strings.TrimPrefix(r.URL.Path, "/api/verdict/")
	if hash == "" {
		http.Error(w, "receipt hash required", http.StatusBadRequest)
		return
	}
	rec := a.league.FindByReceipt(hash)
	if rec == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]any{"found": false})
		return
	}

	resp := map[string]any{
		"found":      true,
		"kind":       rec.Kind,
		"winner":     rec.Winner,
		"created_at": rec.CreatedAt,
		"summary":    rec.Summary,
		"score_a":    rec.ScoreA,
		"score_b":    rec.ScoreB,
	}
	if len(rec.Verdict) > 0 {
		resp["verdict"] = json.RawMessage(rec.Verdict)
	}
	if len(rec.VerdictA) > 0 {
		resp["fleet_a"] = json.RawMessage(rec.VerdictA)
	}
	if len(rec.VerdictB) > 0 {
		resp["fleet_b"] = json.RawMessage(rec.VerdictB)
	}
	json.NewEncoder(w).Encode(resp)
}

// handleMatchReplay returns the recorded broadcast timeline of the most
// recent completed match — the raw material for the Arena replay mode.
func (a *App) handleMatchReplay(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var found *league.MatchRecord
	for _, h := range a.league.History(50) {
		if h.Kind == league.KindMatch && len(h.Events) > 0 {
			cp := h
			found = &cp
			break
		}
	}
	if found == nil {
		json.NewEncoder(w).Encode(map[string]any{"events": []any{}})
		return
	}
	events := make([]json.RawMessage, len(found.Events))
	copy(events, found.Events)
	json.NewEncoder(w).Encode(map[string]any{
		"match_id": found.ID,
		"events":   events,
	})
}

// fleetBranch labels each fleet's role for the board cards.
func fleetBranch(id string) string {
	if id == "a" {
		return "dishonest"
	}
	return "honest"
}

// fleetDisplayName maps the engine's fleet identifiers to display names.
func fleetDisplayName(id string) string {
	switch id {
	case "a":
		return "Fleet A"
	case "b":
		return "Fleet B"
	default:
		return "draw"
	}
}

func (a *App) handleLeague(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"standings": a.league.Standings(),
		"matches":   a.league.Count(),
	})
}

// handleStats reports the arena's real, computed numbers: matches officiated
// and audits run (persisted in the league store) plus the benchmark summary
// (computed live by actually running the crafted PRs through the referee).
// No invented metrics — everything here is measured.
func (a *App) handleStats(w http.ResponseWriter, r *http.Request) {
	matches, audits := 0, 0
	for _, h := range a.league.History(0) {
		if h.Kind == league.KindMatch {
			matches++
		} else {
			audits++
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"matches_officiated": matches,
		"audits_run":         audits,
		"benchmark":          referee.BenchmarkSummary(),
		"ledger":             a.league.VerifyChain(),
	})
}

func (a *App) handleHistory(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"history": a.league.History(50),
	})
}

func (a *App) handleEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	ch := a.hub.Subscribe()
	defer a.hub.Unsubscribe(ch)

	fmt.Fprint(w, ": connected\n\n")
	flusher.Flush()

	for {
		select {
		case ev := <-ch:
			b, err := json.Marshal(ev)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", b)
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func (a *App) serveFrontend(mux *http.ServeMux) {
	// Serve embedded frontend dist
	distFS, err := fs.Sub(frontendFS, "static")
	if err != nil {
		log.Printf("embed error: %v", err)
		return
	}
	fileServer := http.FileServer(http.FS(distFS))
	mux.Handle("/", http.StripPrefix("/", fileServer))
}
