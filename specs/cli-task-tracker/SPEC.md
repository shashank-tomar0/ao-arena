# Spec: CLI Task Tracker

Build a CLI task tracker (add, list, complete, delete) with persistent storage.

## Acceptance criteria

- [ ] `tasks add "buy milk"` creates a task
- [ ] `tasks list` shows tasks with an index and done/undone marker
- [ ] `tasks done <index>` marks a task complete
- [ ] `tasks rm <index>` deletes a task
- [ ] Tasks persist across process restarts (file-backed)
- [ ] `tasks` with no command shows usage
- [ ] Non-numeric index argument produces a clear error, not a panic
- [ ] At least two tests cover add + list round-trip and done/rm

## Constraints

- Any language; no graphical UI
- Store in a single file (JSON or line-oriented)
- Exit 0 on success, non-zero on usage error

## Verifier notes

The referee runs the acceptance tests and validates each CLI claim against the
diff. Error paths are part of "real" — no panics, no silent failures.