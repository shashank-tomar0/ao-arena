# AO Arena — Research & Winning Thesis

*The Orchestra · Agent Orchestrator Hackathon · Aug 12–13*

## 1. The market moment

In 2026 the bottleneck in software engineering has shifted from **writing code** to
**verifying it**. Every major analysis of the agent wave lands on the same conclusion:

- *"Coding agents need independent review — trust, not output, is the bottleneck."* — The Futurum Group, Jul 2026
- *"AI PR Review in 2026: 12 things to check in every AI-generated PR — from hallucinated packages to fake tests."* — GitAutoReview, Jul 2026
- Every vendor ships an "AI code review" feature now — but almost all of them are **LLM-as-judge**:
  another model reading the diff and giving an opinion. An opinion is not evidence.

The documented, repeatable failure modes of agent-produced code are not "subtle bugs."
They are structural:

1. **Hallucinated APIs** — imports and calls that resolve to nothing (`macenhance.Generate()`).
2. **Theater tests** — suites that pass because they assert nothing (`expect(true).toBe(true)`).
3. **Ghost claims** — PR summaries describing work the diff does not contain.

These are the *fingerprints of dishonesty in agent output*. They are detectable
**deterministically** — you do not need a judge, you need a referee.

## 2. Why not the obvious alternatives

| Idea | Why not |
|---|---|
| Chat wrapper / agent UI | Hundreds of entries. Zero moat. The hackathon judges are *the people who build agent UIs*. |
| Yet another AI code review with an LLM judge | Saturated market (CodeAnt, Qodo, Cursor, GitClear…). "LLM judges LLM" is the weakest possible trust claim — and it's exactly what judges will roll their eyes at. |
| Demo app with mock data | Explicitly disqualified by the brief: *nothing fake*. |
| A tool that *is* the hackathon (another orchestration layer) | You cannot out-AO AO. Competing with the host is not a winning strategy. |

## 3. Why this wins

**AO Arena is the trust layer for AO itself.** The host built a tool that spawns fleets of
agents that ship code *faster than any human can review*. The obvious missing piece — the
one every AO user will hit within a day — is: **who verifies the agents?**

Three properties make it defensible:

1. **Deterministic, not judged.** Four checks (symbol-reality, test-reality with mutation
   differential, claim-vs-diff, merge-gate) run against the *actual repository state* —
   real symbols, real test executions, real diffs. Evidence with file:line. A receipt hash
   that makes the verdict tamper-evident.
2. **AO-native, not AO-copy.** The arena consumes AO's daemon vocabulary (session statuses →
   Kanban lanes), broadcasts through an SSE stream, and the Kanban board *is* the broadcast.
   We built *with* AO (multi-daemon, isolated worktrees), on AO's own Kanban model.
3. **It ships as a standalone product.** The `referee` binary + GitHub Action gates any agent
   PR in any repo. The Arena is the spectacle; the Referee is the product.

## 4. Fit with the hackathon format

- **Demo-ability**: a deterministic 90-second honest-vs-dishonest race that cannot fail on stage.
- **Watchability**: the broadcast UI turns verification into a spectator sport — two Kanban
  boards, a live evidence rail, a scoreboard flip. The judges watch the referee catch a
  liar *live*.
- **Realness**: every match runs real `go test` in real git worktrees against a real spec.
  The dishonest fleet's diff genuinely breaks the build; the referee's findings are genuine.
- **Bonus points for surprising**: verification-as-officiating — agents as *athletes*, trust
  as *score* — is a frame nobody else in the arena will have.

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| "Demo is scripted" | The `--demo` flag is only for the video. The web UI, CLI, and API run **real matches**: real worktrees, real `go test -cover`, real referee. Nothing else is fake. |
| LLM-judge skepticism | We never call a model. All checks are regex/symbol/execution-based. The mutation-differential test proves theater by *breaking assertions and watching tests still pass*. |
| Scope creep | The product has one core loop (deliver → test → referee → score → broadcast) and two standalone surfaces (audit page, GitHub Action). Everything else is polish. |

## 6. The one-line pitch

> **Your agents are faster than your review. The Referee is faster than both — and it never lies.**
