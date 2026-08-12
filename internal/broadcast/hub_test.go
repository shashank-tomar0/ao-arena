package broadcast

import (
	"testing"
	"time"
)

func TestHubPublishSubscribe(t *testing.T) {
	h := NewHub()
	ch := h.Subscribe()
	defer h.Unsubscribe(ch)

	h.BroadcastSession(SessionCard{ID: "a1", Fleet: "a", Status: "working"})

	select {
	case ev := <-ch:
		if ev.Kind != "session" {
			t.Fatalf("expected kind session, got %s", ev.Kind)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("expected event within 2s, got none")
	}
}

func TestHubFanoutMultipleSubscribers(t *testing.T) {
	h := NewHub()
	ch1 := h.Subscribe()
	ch2 := h.Subscribe()
	defer h.Unsubscribe(ch1)
	defer h.Unsubscribe(ch2)

	h.BroadcastScore(30, 100)

	for name, ch := range map[string]chan Event{"ch1": ch1, "ch2": ch2} {
		select {
		case ev := <-ch:
			if ev.Kind != "score" {
				t.Fatalf("%s: expected kind score, got %s", name, ev.Kind)
			}
		case <-time.After(2 * time.Second):
			t.Fatalf("%s: expected score event, got none", name)
		}
	}
}

func TestHubSlowConsumerDrops(t *testing.T) {
	h := NewHub()
	ch := h.Subscribe()
	defer h.Unsubscribe(ch)

	// Fill the subscriber buffer with unread events, then publish more.
	// The hub must not block.
	for i := 0; i < 1024; i++ {
		h.BroadcastSession(SessionCard{ID: "x", Status: "working"})
	}
	// If it blocked, the test would hang; reaching here means non-blocking drop works.
	select {
	case <-ch:
		// fine
	default:
	}
}
