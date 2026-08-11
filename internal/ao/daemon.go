// This file manages isolated AO daemon processes for fleet separation.
//
// Each competing fleet runs in its own AO daemon instance with isolated
// SQLite state (via AO_DATA_DIR), so worktrees, sessions, and PRs never
// cross-contaminate. This is the "stadium" — one daemon per team.
package ao

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

// DaemonProcess wraps a running AO daemon.
type DaemonProcess struct {
	Cmd    *exec.Cmd
	Config EnvConfig
	Client *Client
	Cancel context.CancelFunc
	Ready  chan struct{}
}

// Manager creates and tracks isolated daemon instances.
type Manager struct {
	baseDir string
	daemons map[string]*DaemonProcess
}

// NewManager builds a daemon manager rooted at baseDir.
func NewManager(baseDir string) *Manager {
	return &Manager{
		baseDir: baseDir,
		daemons: map[string]*DaemonProcess{},
	}
}

// StartDaemon launches an isolated AO daemon for the given fleet name.
// It:
//   - Creates isolated AO_DATA_DIR / AO_RUN_FILE
//   - Starts `ao daemon` (or the AO CLI entrypoint)
//   - Waits for /readyz
//   - Returns a ready Client for that daemon
func (m *Manager) StartDaemon(ctx context.Context, fleetName string, aoBinary string) (*DaemonProcess, error) {
	cfg := IsolatedConfig(fleetName)
	if err := os.MkdirAll(cfg.DataDir, 0o755); err != nil {
		return nil, fmt.Errorf("mkdir data dir: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(cfg.RunFile), 0o755); err != nil {
		return nil, fmt.Errorf("mkdir run file dir: %w", err)
	}

	cmd := exec.CommandContext(ctx, aoBinary, "daemon")
	cmd.Env = append(os.Environ(),
		"AO_DATA_DIR="+cfg.DataDir,
		"AO_RUN_FILE="+cfg.RunFile,
		"AO_PORT="+fmt.Sprintf("%d", cfg.Port),
	)
	// Ensure the daemon logs to our pipes so we can surface errors.
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	daemonCtx, cancel := context.WithCancel(ctx)
	cmd.Cancel = func() error { return cmd.Process.Kill() }

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("start daemon: %w", err)
	}

	dp := &DaemonProcess{
		Cmd:    cmd,
		Config: cfg,
		Cancel: cancel,
		Ready:  make(chan struct{}),
	}

	go func() {
		defer close(dp.Ready)
		client := NewClientFor(cfg)
		if err := client.Ready(daemonCtx); err != nil {
			return
		}
		dp.Client = client
	}()

	// Wait for ready or context cancel with a hard cap.
	select {
	case <-dp.Ready:
		m.daemons[fleetName] = dp
		return dp, nil
	case <-time.After(30 * time.Second):
		cancel()
		return nil, fmt.Errorf("daemon %s did not become ready in time", fleetName)
	case <-ctx.Done():
		cancel()
		return nil, ctx.Err()
	}
}

// StopDaemon gracefully stops the daemon for a fleet.
func (m *Manager) StopDaemon(fleetName string) error {
	dp, ok := m.daemons[fleetName]
	if !ok {
		return nil
	}
	dp.Cancel()
	if dp.Cmd != nil && dp.Cmd.Process != nil {
		dp.Cmd.Process.Kill()
	}
	delete(m.daemons, fleetName)
	return nil
}

// StopAll shuts down all managed daemons.
func (m *Manager) StopAll() {
	for name := range m.daemons {
		m.StopDaemon(name)
	}
}

// Client returns the AO client for a fleet's daemon.
func (m *Manager) Client(fleetName string) *Client {
	if dp, ok := m.daemons[fleetName]; ok {
		return dp.Client
	}
	return nil
}
