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
	"github.com/shashank-tomar0/ao-arena/internal/match"
	"github.com/shashank-tomar0/ao-arena/internal/referee"
)

//go:embed static/*
var frontendFS embed.FS

type App struct {
	mu          sync.RWMutex
	hub         *broadcast.Hub
	matchEngine *match.Engine
	referee     *referee.Engine
	activeMatch *match.MatchResult
	matchCancel context.CancelFunc
}

func main() {
	// Default spec path (can be overridden by env).
	specPath := os.Getenv("SPEC_PATH")
	if specPath == "" {
		specPath = "specs/rest-api-auth"
	}

	// Build the real match engine against the spec.
	matchEngine := match.NewEngine(specPath, "example.com/rest-api-auth/auth")

	app := &App{
		hub:         broadcast.NewHub(),
		matchEngine: matchEngine,
		referee:     referee.NewEngine(nil),
	}

	mux := http.NewServeMux()

	// API endpoints
	mux.HandleFunc("/api/health", app.handleHealth)
	mux.HandleFunc("/api/match", app.handleMatch)
	mux.HandleFunc("/api/match/status", app.handleMatchStatus)
	mux.HandleFunc("/api/spec", app.handleSpec)

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
	log.Printf("Spec: %s", specPath)
	log.Printf("SSE: http://%s/events", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func (a *App) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (a *App) handleSpec(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	spec := map[string]string{
		"id":          filepath.Base(a.matchEngine.SpecPath),
		"name":        filepath.Base(a.matchEngine.SpecPath),
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

	// Start the match asynchronously.
	go func() {
		a.hub.BroadcastReferee(broadcast.RefereeEvent{
			Fleet:    "system",
			Severity: "info",
			Category: "match",
			Message:  "Match started",
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
			return
		}

		a.mu.Lock()
		a.activeMatch = result
		a.mu.Unlock()

		// Broadcast the verdict events
		a.broadcastVerdict("a", result.FleetA)
		a.broadcastVerdict("b", result.FleetB)

		a.hub.BroadcastReferee(broadcast.RefereeEvent{
			Fleet:    "system",
			Severity: "info",
			Category: "match",
			Message:  "Match complete: winner " + result.Winner,
			TS:       time.Now().UnixMilli(),
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
	// Also broadcast score updates
	a.hub.BroadcastScore(fr.TrustScore, 0) // other fleet score sent separately
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
