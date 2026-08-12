// Package broadcast implements the live event stream for arena matches.
// The match engine publishes session cards, referee findings, and scores;
// the hub fans them out to SSE clients. The frontend consumes /events.
package broadcast

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// Event is one broadcast frame.
type Event struct {
	Kind string `json:"kind"`
	Data any    `json:"data"`
}

// SessionCard mirrors the frontend card shape. Field casing must match the
// TypeScript SessionCard exactly — the frontend reads msg.data.id etc.
type SessionCard struct {
	ID     string `json:"id"`
	Fleet  string `json:"fleet"`
	Label  string `json:"label"`
	Branch string `json:"branch"`
	Status string `json:"status"`
	PR     string `json:"pr,omitempty"`
	TS     int64  `json:"ts"`
}

// RefereeEvent is a finding as broadcast. Casing matches the frontend
// RefereeEvent (fleet/severity/category/message/evidence/ts).
type RefereeEvent struct {
	Fleet    string `json:"fleet"`
	Severity string `json:"severity"`
	Category string `json:"category"`
	Message  string `json:"message"`
	Evidence string `json:"evidence,omitempty"`
	TS       int64  `json:"ts"`
}

// Hub fans out broadcast events to SSE subscribers.
type Hub struct {
	mu   sync.Mutex
	subs map[chan Event]struct{}
}

func NewHub() *Hub {
	return &Hub{subs: map[chan Event]struct{}{}}
}

// Publish sends an event to all subscribers (non-blocking, drops on slow).
func (h *Hub) Publish(kind string, data any) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for ch := range h.subs {
		select {
		case ch <- Event{Kind: kind, Data: data}:
		default: // slow consumer — drop
		}
	}
}

// BroadcastSession publishes a session card update.
func (h *Hub) BroadcastSession(card SessionCard) { h.Publish("session", card) }

// BroadcastReferee publishes a referee finding.
func (h *Hub) BroadcastReferee(ev RefereeEvent) { h.Publish("referee", ev) }

// BroadcastScore publishes the scoreboard.
func (h *Hub) BroadcastScore(a, b float64) { h.Publish("score", [2]float64{a, b}) }

// BroadcastStatus publishes the match lifecycle state (idle/running/complete).
func (h *Hub) BroadcastStatus(status, detail string) {
	h.Publish("status", map[string]string{"status": status, "detail": detail})
}

// Subscribe registers a subscriber channel.
func (h *Hub) Subscribe() chan Event {
	h.mu.Lock()
	defer h.mu.Unlock()
	ch := make(chan Event, 128)
	h.subs[ch] = struct{}{}
	return ch
}

// Unsubscribe removes a subscriber channel.
func (h *Hub) Unsubscribe(ch chan Event) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.subs, ch)
}

// ServeHTTP streams the broadcast as Server-Sent Events.
func (h *Hub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	ch := h.Subscribe()
	defer h.Unsubscribe(ch)

	// Initial ping so clients settle the connection.
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

// StartSSE serves the broadcast endpoint on localhost:port/events using the
// given hub. The caller creates the hub so a match and the server share one
// stream. Returns the started server.
func StartSSE(h *Hub, port int) *http.Server {
	if h == nil {
		h = NewHub()
	}
	mux := http.NewServeMux()
	mux.Handle("/events", h)
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		fmt.Fprint(w, "ok")
	})
	srv := &http.Server{
		Addr:    fmt.Sprintf("127.0.0.1:%d", port),
		Handler: mux,
	}
	go srv.ListenAndServe()
	return srv
}

// helpers for timestamped events the engine uses
func nowMs() int64 { return time.Now().UnixMilli() }
