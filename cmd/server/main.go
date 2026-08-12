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
	"path/filepath"
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
}

func main() {
	// Default spec path (can be overridden by env). The engine runs real
	// `go test -cover` against this spec in git worktrees.
	specPath := os.Getenv("SPEC_PATH")
	if specPath == "" {
		specPath = "specs/rest-api-auth"
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

	matchEngine := match.NewEngine(repoRoot, specPath, "example.com/rest-api-auth/auth")

	app := &App{
		hub:         broadcast.NewHub(),
		matchEngine: matchEngine,
		referee:     referee.NewEngine(nil),
		league:      store,
	}

	mux := http.NewServeMux()

	// API endpoints
	mux.HandleFunc("/api/health", app.handleHealth)
	mux.HandleFunc("/api/match", app.handleMatch)
	mux.HandleFunc("/api/match/status", app.handleMatchStatus)
	mux.HandleFunc("/api/spec", app.handleSpec)
	mux.HandleFunc("/api/audit", app.handleAudit)
	mux.HandleFunc("/api/league", app.handleLeague)
	mux.HandleFunc("/api/history", app.handleHistory)

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
	log.Printf("Spec: %s | store: %s", specPath, storePath(store))
	log.Printf("SSE: http://%s/events", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func storePath(s *league.Store) string {
	return os.Getenv("ARENA_STORE")
}

func (a *App) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (a *App) handleSpec(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	spec := map[string]string{
		"id":          filepath.Base(a.matchEngine.SpecRelPath),
		"name":        filepath.Base(a.matchEngine.SpecRelPath),
		"description": "REST API with authentication",
	}
	json.NewEncoder(w).Encode(spec)
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

	// Empty diffs default to the canonical honest-vs-dishonest fixture: the
	// referee really runs the spec's tests in fresh worktrees and really
	// audits both deliveries. Nothing is scripted on this path.
	if req.FleetADiff == "" {
		req.FleetADiff = match.DishonestDiff
	}
	if req.FleetBDiff == "" {
		req.FleetBDiff = match.HonestDiff
	}

	// Start the match asynchronously.
	go func() {
		a.hub.BroadcastStatus("running", "Fleets are working — real worktrees, real go test, real referee.")
		a.hub.BroadcastReferee(broadcast.RefereeEvent{
			Fleet:    "system",
			Severity: "info",
			Category: "match",
			Message:  "Match started — honest vs dishonest delivery on the spec",
			TS:       time.Now().UnixMilli(),
		})

		result, err := a.matchEngine.Run(ctx, req.FleetADiff, req.FleetBDiff)
		if err != nil {
			log.Printf("Match error: %v", err)
			a.hub.BroadcastReferee(broadcast.RefereeEvent{
				Fleet:    "system",
				Severity: "critical",
				Category: "match",
				Message:  "Match failed: " + err.Error(),
				TS:       time.Now().UnixMilli(),
			})
			a.hub.BroadcastStatus("error", "Match failed: "+err.Error())
			return
		}

		a.mu.Lock()
		a.activeMatch = result
		a.mu.Unlock()

		// Broadcast each fleet's real verdict findings, then the final
		// cumulative scoreboard once.
		a.broadcastVerdict("a", result.FleetA)
		a.broadcastVerdict("b", result.FleetB)
		a.hub.BroadcastScore(result.FleetA.TrustScore, result.FleetB.TrustScore)

		a.hub.BroadcastReferee(broadcast.RefereeEvent{
			Fleet:    "system",
			Severity: "info",
			Category: "match",
			Message:  "Match complete: winner " + result.Winner,
			TS:       time.Now().UnixMilli(),
		})
		a.hub.BroadcastStatus("complete", "Match complete — winner " + result.Winner)

		// Persist the season record + ELO. Winner is mapped to the display
		// name so standings and history read naturally.
		_ = a.league.Record(league.MatchRecord{
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
		})
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
		a.hub.BroadcastReferee(broadcast.RefereeEvent{
			Fleet:    fleet,
			Severity: sev,
			Category: string(f.Category),
			Message:  f.Message,
			Evidence: f.EvidencePath,
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
		Repo   string `json:"repo"`
		PRRef  string `json:"pr_ref"`
		Diff   string `json:"diff"`
		Body   string `json:"body"`
		Claims []string `json:"claims"`
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
	}
	out, err := a.referee.Run(r.Context(), pr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Persist the audit so the league page shows a complete activity log.
	_ = a.league.Record(league.MatchRecord{
		ID:         req.PRRef,
		Kind:       league.KindAudit,
		FleetA:     "Audit",
		FleetB:     req.PRRef,
		ScoreA:     out.Verdict.TrustScore,
		Winner:     auditWinner(out.Verdict),
		Summary:    out.Verdict.Summary,
		DurationMS: out.Verdict.DurationMS,
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
