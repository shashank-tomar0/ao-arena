package arena

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// git runs a git command in dir and fails the test on error.
func git(t *testing.T, dir string, args ...string) string {
	t.Helper()
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("git %v: %v (%s)", args, err, string(out))
	}
	return string(out)
}

func TestFetchPRDiff(t *testing.T) {
	dir := t.TempDir()
	git(t, dir, "init", "-b", "main", "-q")
	git(t, dir, "config", "user.email", "test@arena")
	git(t, dir, "config", "user.name", "Arena Test")

	// Base commit: a real file.
	if err := os.WriteFile(filepath.Join(dir, "base.txt"), []byte("hello\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	git(t, dir, "add", ".")
	git(t, dir, "commit", "-q", "-m", "base")

	// A feature branch that changes the file — what an agent session's PR
	// would look like.
	git(t, dir, "checkout", "-q", "-b", "feat/agent-1")
	if err := os.WriteFile(filepath.Join(dir, "base.txt"), []byte("hello world\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	git(t, dir, "add", ".")
	git(t, dir, "commit", "-q", "-m", "agent change")

	// The diff of the agent branch against main must contain the change.
	diff := FetchPRDiff(context.Background(), dir, "feat/agent-1")
	if diff == "" {
		t.Fatal("expected a diff for the agent branch, got empty")
	}
	if !strings.Contains(diff, "hello world") {
		t.Errorf("diff should contain the agent's change, got:\n%s", diff)
	}

	// Unknown refs resolve to nothing — no false diffs.
	if d := FetchPRDiff(context.Background(), dir, "no-such-ref"); d != "" {
		t.Errorf("unknown ref should produce no diff, got %q", d)
	}

	// Missing repo produces nothing, not a panic.
	if d := FetchPRDiff(context.Background(), t.TempDir(), "main"); d != "" {
		t.Errorf("non-repo dir should produce no diff, got %q", d)
	}
}
