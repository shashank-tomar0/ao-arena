package ao

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Event is one daemon event in the SSE stream.
type Event struct {
	Name string
	Data json.RawMessage
}

// SubscribeSSE streams daemon events (session.created, session.updated, ...)
// until ctx is cancelled. Events are delivered on the returned channel.
func (c *Client) SubscribeSSE(ctx context.Context) (<-chan Event, <-chan error) {
	events := make(chan Event, 256)
	errs := make(chan error, 1)
	go func() {
		defer close(events)
		defer close(errs)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/events", nil)
		if err != nil {
			errs <- err
			return
		}
		req.Header.Set("Accept", "text/event-stream")
		resp, err := c.http.Do(req)
		if err != nil {
			errs <- err
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			errs <- fmt.Errorf("sse: unexpected status %d", resp.StatusCode)
			return
		}
		sc := bufio.NewScanner(resp.Body)
		sc.Buffer(make([]byte, 1<<20), 1<<20)
		var name string
		var data []byte
		flush := func() {
			if name == "" {
				return
			}
			events <- Event{Name: name, Data: append([]byte(nil), data...)}
			name, data = "", nil
		}
		for sc.Scan() {
			line := sc.Text()
			switch {
			case len(line) == 0:
				flush()
			case len(line) > 6 && line[:6] == "event:":
				name = trimSpace(line[6:])
			case len(line) > 5 && line[:5] == "data:":
				data = append(data, []byte(trimSpace(line[5:]))...)
			}
		}
		if err := sc.Err(); err != nil && err != io.EOF && ctx.Err() == nil {
			errs <- err
		}
	}()
	return events, errs
}

func trimSpace(s string) string {
	for len(s) > 0 && (s[0] == ' ' || s[0] == '\t') {
		s = s[1:]
	}
	for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t' || s[len(s)-1] == '\r') {
		s = s[:len(s)-1]
	}
	return s
}

// WaitStatus polls a session until its status leaves "pending"/"spawning" or
// the timeout expires. Returns the final observed status.
func (c *Client) WaitStatus(ctx context.Context, id string, timeout time.Duration) (string, error) {
	deadline := time.Now().Add(timeout)
	for {
		s, err := c.getSession(ctx, id)
		if err == nil && s.Status != "" && s.Status != "pending" && s.Status != "spawning" && !s.IsTerminated {
			return s.Status, nil
		}
		if time.Now().After(deadline) {
			return "", fmt.Errorf("wait status %s: timed out after %s", id, timeout)
		}
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case <-time.After(500 * time.Millisecond):
		}
	}
}
