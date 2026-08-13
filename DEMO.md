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
| 35–40s | **Third fingerprint**: `critical claim-vs-diff: PR summary claims "added rate limiting" but the diff contains no supporting evidence` — the dishonest fleet's PR body is full of ghost claims | "And its PR summary? Claims work the diff never shipped. All three fingerprints, one match." |
| 45–50s | Scoreboard flips: "fleet a: trust 0/100", "fleet b: trust 100/100" | "Fleet B builds honest. Verdict: clean." |
| 50–60s | Broadcast UI (optional): Kanban boards animate the same sequence; evidence rail shows findings with file:line | "The Kanban board IS the broadcast. You see every card, every catch." |
| 60–70s | **Audit page**: theater sample → verdict → click **Tamper test** → "TAMPER CAUGHT ✓" (one finding edited, receipt hash breaks) → **Determinism ×5** → five identical receipts | "The receipt is tamper-evident, and the referee is deterministic — same diff, same receipt, five times. A judge-model can't promise that." |
| 70–75s | **League page**: standings (real ELO) + **Trust ledger: VERIFIED · N SEALS** + genesis hash | "And the whole season is sealed: every verdict chained to the one before it. Rewrite any past result, break the chain." |
| 55–70s | Terminal prints finale: `MATCH FINALE` → winner = fleet b | "Round to Fleet B. ELO moves." |
| 75–82s | `referee --live --post` on a real PR → shows check run + comment | "Same referee gates any agent PR in your repo. One Action." |
| 82–90s | `ao-arena` logo + repo URL | "This is the trust layer for AI code. Your agents are invited." |

---

## Key talking points for the showcase post

- **Not a chat wrapper** — this is worktree-based, CI-grounded, evidence-grade verification.
- **Deterministic demo** — `--demo` is fully scripted; no flaky agents, no network, cannot fail on stage.
- **The referee is the product** — the Arena just makes it watchable. The standalone `referee` binary + GitHub Action is what ships to every repo.
- **Multi-language, for real** — the engine runs `go test` OR `node --test` from a spec manifest; the realtime-chat spec is a zero-dependency RFC 6455 WebSocket server whose acceptance suite kills every mutant.
- **Proof, not promises** — the tamper test (edit a finding, break the receipt), determinism ×5 (same diff → same receipt), and the chained trust ledger (rewrite history, break the chain) are all live in the UI.
- **AO-native** — built *with* AO (multi-daemon, SSE, CLI), demo *on* AO (Kanban board is the broadcast).

---

## Tags / posts

- `#agentorchestrator`
- `@aoagents`
- `#AIagents` `#devtools` `#verification`
- Screenshot: two Kanban boards side-by-side, one with red critical badges
- Video: 90s, the shot list above