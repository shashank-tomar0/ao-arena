# Demo script — 90 seconds, pre-recorded, unbreakable

**Command to run (Terminal 1):**
```bash
arena match --demo --serve
```

**Command to run (Terminal 2):**
```bash
arena match --demo
```

**Optional — Terminal 3 (broadcast UI):**
```bash
cd frontend && npm run dev
# open http://localhost:5173
```

---

## Shot list

| Time | Screen | Audio |
|---|---|---|
| 0–5s | Terminal: `arena match --demo --serve` → "broadcast server: http://localhost:8091/events" | "Two agent fleets. Same spec. One referee." |
| 5–10s | Terminal 2: `arena match --demo` → boards spawn, cards move | "Fleet A ships fast. Fleet B ships honest." |
| 10–20s | Terminal 2 shows live cards: Fleet A "working" → "ci_failed" → "changes_requested" | "Fleet A opens a PR. Claims all tests pass." |
| 20–30s | **Referee event fires** (terminal prints): `critical test-reality: theater test: assertion survives mutation (expect(true).toBe(true))` | "But the referee checks reality. That test? Theater." |
| 30–35s | **Second referee event**: `critical symbol-reality: references symbol not resolvable... machenhance.Generate()` | "And that API? Hallucinated." |
| 35–45s | Scoreboard flips: "fleet a: trust 30/100", "fleet b: trust 100/100" | "Fleet B builds honest. Verdict: clean." |
| 45–55s | Broadcast UI (optional): Kanban boards animate the same sequence; evidence rail shows findings with file:line | "The Kanban board IS the broadcast. You see every card, every catch." |
| 55–70s | Terminal prints finale: `MATCH FINALE` → winner = fleet b | "Round to Fleet B. ELO moves." |
| 70–80s | `referee --live --post` on a real PR → shows check run + comment | "Same referee gates any agent PR in your repo. One Action." |
| 80–90s | `ao-arena` logo + repo URL | "This is the trust layer for AI code. Your agents are invited." |

---

## Key talking points for the showcase post

- **Not a chat wrapper** — this is worktree-based, CI-grounded, evidence-grade verification.
- **Deterministic demo** — `--demo` is fully scripted; no flaky agents, no network, cannot fail on stage.
- **The referee is the product** — the Arena just makes it watchable. The standalone `referee` binary + GitHub Action is what ships to every repo.
- **AO-native** — built *with* AO (multi-daemon, SSE, CLI), demo *on* AO (Kanban board is the broadcast).

---

## Tags / posts

- `#agentorchestrator`
- `@aoagents`
- `#AIagents` `#devtools` `#verification`
- Screenshot: two Kanban boards side-by-side, one with red critical badges
- Video: 90s, the shot list above