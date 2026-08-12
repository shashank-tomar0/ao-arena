// Package ao is the Arena's programmatic client for Agent Orchestrator.
//
// It wraps the AO daemon's loopback REST API and ambient configuration:
//   - AO_PORT      (default 3001)  loopback daemon port
//   - AO_RUN_FILE  (default ~/.ao/running.json) PID/port handshake
//   - AO_DATA_DIR  (default ~/.ao/data) SQLite data directory
//
// Arena uses these to run isolated, multi-instance AO daemons — one per
// competing fleet — on a single machine.
package ao

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// Client talks to one AO daemon.
type Client struct {
	base    string
	http    *http.Client
	runFile string
}

// EnvConfig is resolved, in order: explicit -> AO_* env vars -> defaults.
type EnvConfig struct {
	Port    int
	RunFile string
	DataDir string
}

// DefaultConfig resolves ambient AO configuration.
func DefaultConfig() EnvConfig {
	home, _ := os.UserHomeDir()
	return EnvConfig{
		Port:    envInt("AO_PORT", 3001),
		RunFile: envStr("AO_RUN_FILE", filepath.Join(home, ".ao", "running.json")),
		DataDir: envStr("AO_DATA_DIR", filepath.Join(home, ".ao", "data")),
	}
}

// IsolatedConfig returns a config for a dedicated, isolated daemon instance.
// Each competitor fleet gets its own data dir and daemon port; the run file
// is the daemon's PID/port handshake on disk.
func IsolatedConfig(name string) EnvConfig {
	base := filepath.Join(os.TempDir(), "ao-arena", name)
	return EnvConfig{
		Port:    0, // caller assigns via nextFreePort
		RunFile: filepath.Join(base, "running.json"),
		DataDir: filepath.Join(base, "data"),
	}
}

// NewClient dials an AO daemon at the given base URL.
func NewClient(baseURL string) *Client {
	return &Client{
		base: baseURL,
		http: &http.Client{Timeout: 30 * time.Second},
	}
}

// NewClientFor builds a client for an isolated config on the given port.
func NewClientFor(c EnvConfig) *Client {
	return &Client{
		base:    fmt.Sprintf("http://127.0.0.1:%d", c.Port),
		http:    &http.Client{Timeout: 30 * time.Second},
		runFile: c.RunFile,
	}
}

// Ready polls /readyz until the daemon accepts work or the context expires.
func (c *Client) Ready(ctx context.Context) error {
	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()
	for {
		req, _ := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/readyz", nil)
		resp, err := c.http.Do(req)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode < 500 {
				return nil
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

// Health returns daemon liveness.
func (c *Client) Health() (bool, error) {
	resp, err := c.http.Get(c.base + "/healthz")
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200, nil
}

// Project is an AO project registered in a daemon.
type Project struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Path string `json:"path"`
}

// CreateProject registers a working directory as an AO project.
func (c *Client) CreateProject(ctx context.Context, path string) (*Project, error) {
	body, _ := json.Marshal(map[string]string{"path": path})
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, c.base+"/api/v1/projects", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("create project: %d %s", resp.StatusCode, string(b))
	}
	var p Project
	if err := json.Unmarshal(b, &p); err != nil {
		return nil, fmt.Errorf("create project decode: %w (%s)", err, string(b))
	}
	return &p, nil
}

// SpawnParams mirrors the AO spawn CLI.
type SpawnParams struct {
	ProjectID string `json:"project_id"`
	Agent     string `json:"agent,omitempty"`
	Task      string `json:"task,omitempty"`
}

// Spawn creates a new session in the daemon.
func (c *Client) Spawn(ctx context.Context, p SpawnParams) (string, error) {
	body, _ := json.Marshal(p)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, c.base+"/api/v1/sessions", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var out struct {
		ID string `json:"id"`
	}
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("spawn failed: %d %s", resp.StatusCode, string(b))
	}
	if err := json.Unmarshal(b, &out); err != nil {
		return "", fmt.Errorf("spawn decode: %w (%s)", err, string(b))
	}
	return out.ID, nil
}

// Session is the durable AO session factset.
type Session struct {
	ID            string `json:"id"`
	ActivityState string `json:"activity_state"`
	IsTerminated  bool   `json:"is_terminated"`
	Status        string `json:"status"`
	Kind          string `json:"kind"`
	ProjectID     string `json:"project_id,omitempty"`
	PRRef         string `json:"pr_ref,omitempty"`
	CreatedAt     string `json:"created_at,omitempty"`
}

// SessionStatus returns the status of one session.
func (c *Client) SessionStatus(ctx context.Context, id string) (*Session, error) {
	return c.getSession(ctx, id)
}

func (c *Client) getSession(ctx context.Context, id string) (*Session, error) {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/api/v1/sessions/"+id, nil)
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("session get %s: %d %s", id, resp.StatusCode, string(b))
	}
	var s Session
	if err := json.Unmarshal(b, &s); err != nil {
		return nil, fmt.Errorf("session decode: %w (%s)", err, string(b))
	}
	return &s, nil
}

// ListSessions returns all sessions with their status.
func (c *Client) ListSessions(ctx context.Context) ([]Session, error) {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/api/v1/sessions", nil)
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("session list: %d %s", resp.StatusCode, string(b))
	}
	var out []Session
	if err := json.Unmarshal(b, &out); err != nil {
		return nil, fmt.Errorf("session list decode: %w (%s)", err, string(b))
	}
	return out, nil
}

// Send delivers an instruction into a session (message-injection path).
func (c *Client) Send(ctx context.Context, id, message string) error {
	payload, _ := json.Marshal(map[string]string{"message": message})
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, c.base+"/api/v1/sessions/"+id+"/send", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("send %s: %d %s", id, resp.StatusCode, string(b))
	}
	return nil
}

// Kill terminates a session (the kill-switch / penalty path).
func (c *Client) Kill(ctx context.Context, id string) error {
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, c.base+"/api/v1/sessions/"+id+"/kill", nil)
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("kill %s: %d %s", id, resp.StatusCode, string(b))
	}
	return nil
}

func envInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		var out int
		if _, err := fmt.Sscanf(v, "%d", &out); err == nil {
			return out
		}
	}
	return def
}

func envStr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
