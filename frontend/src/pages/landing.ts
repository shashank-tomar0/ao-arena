// Landing — Marquee Hero macrostructure.
// The hero is a live broadcast console; the ticker IS the broadcast.

import type { View } from '../app';

// Referee verdicts that animate the ticker (real outputs, framed as live feed).
const TICKER = [
  { t: 'theater test caught · expect(true).toBe(true)', c: true },
  { t: 'hallucinated api · machenhance.Generate()', c: true },
  { t: 'fleet B merged clean · trust 100/100', c: false },
  { t: 'ghost claim refuted · file:line evidence', c: true },
  { t: 'mutation differential · suite still passes', c: true },
  { t: 'symbol graph verified · 0 unresolved refs', c: false },
];

function tickerItems(): string {
  const one = TICKER.map(
    (x) => `<span class="ticker-item ${x.c ? 'crit' : ''}">${x.t}</span>`
  ).join('');
  // Duplicate for the seamless marquee loop.
  return one + one;
}

export function renderLanding(navigate: (v: View) => void): string {
  return `
    <div class="landing">
      <!-- HERO: broadcast console -->
      <header class="hero">
        <div class="container">
          <div class="hero-grid">
            <div class="hero-copy">
              <div class="kicker reveal">AO Arena · trust layer for agent fleets</div>
              <h1 class="display-hero hero-title reveal">
                Verification-as-officiating for <span class="accent-word">AI agent fleets</span>
              </h1>
              <p class="lede hero-lede reveal">
                Agent velocity has outrun human inspection. PRs land containing hallucinated APIs,
                theater tests, and ghost claims. The Referee turns "trust me" into "show me the evidence" —
                deterministically, with file:line receipts.
              </p>
              <div class="hero-cta reveal">
                <button class="btn btn-primary btn-lg" data-nav="arena">Enter the Arena</button>
                <a href="https://github.com/shashank-tomar0/ao-arena" target="_blank" rel="noopener" class="btn btn-ghost btn-lg">View on GitHub</a>
              </div>
              <div class="hero-meta reveal">
                <span class="live-dot" aria-hidden="true"></span>
                <span>Live · honest vs dishonest</span>
                <span>·</span>
                <span>spec rest-api-auth</span>
                <span>·</span>
                <span>4 checks · 0 LLM judges</span>
              </div>
            </div>

            <!-- Broadcast console -->
            <div class="console reveal">
              <div class="console-bar">
                <span class="live-dot" aria-hidden="true"></span>
                <span>Live feed</span>
                <span class="spacer"></span>
                <span>SEASON 0 · ROUND 1</span>
              </div>
              <div class="console-score">
                <div class="console-fleet a">
                  <div class="fleet-tag">Fleet A · dishonest</div>
                  <div class="fleet-score" id="console-score-a">40</div>
                  <div class="fleet-sub">caught · blocked</div>
                </div>
                <div class="console-vs">VS</div>
                <div class="console-fleet b">
                  <div class="fleet-tag">Fleet B · honest</div>
                  <div class="fleet-score" id="console-score-b">100</div>
                  <div class="fleet-sub">verified · merged</div>
                </div>
              </div>
              <div class="console-feed">
                <div class="console-line"><span class="ln">01</span><span class="ev-crit">[critical] test-reality · theater test: assertion survives mutation</span></div>
                <div class="console-line"><span class="ln">02</span><span class="ev-crit">[critical] symbol-reality · machenhance.Generate() resolves nowhere</span></div>
                <div class="console-line"><span class="ln">03</span><span class="ev-ok">[clean] merge-gate · fleet B mergeable, CI green</span></div>
                <div class="console-line"><span class="ln">04</span><span class="ev-ok">[receipt] sha256:b6145371…78eaec · tamper-evident</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- TICKER: the broadcast strip -->
      <div class="ticker reveal" aria-hidden="true">
        <div class="ticker-track">${tickerItems()}</div>
      </div>

      <!-- FEATURES: ruled cells -->
      <section class="section">
        <div class="container">
          <div class="section-head reveal">
            <div class="kicker">Core primitives</div>
            <h2 class="display-1">Deterministic verification, not LLM-as-judge</h2>
            <p class="body text-muted">Four checks run against the actual repository state — real symbols, real test executions, real diffs. Evidence with file:line. No opinions.</p>
          </div>
          <div class="feature-grid">
            ${[
              { code: 'CHK/01', title: 'Symbol Reality', desc: 'Catches hallucinated imports and API calls that resolve to nothing. Every reference verified against the actual symbol graph.', tag: 'critical', tagCls: 'badge-danger' },
              { code: 'CHK/02', title: 'Test Reality', desc: 'Mutation-differential proof: if tests pass after assertions are neutralized, the suite is theater. expect(true).toBe(true) dies here.', tag: 'critical', tagCls: 'badge-danger' },
              { code: 'CHK/03', title: 'Claim vs Diff', desc: 'Agent PR summaries describe work the diff doesn\'t contain. Ghost claims flagged with file:line evidence.', tag: 'critical', tagCls: 'badge-danger' },
              { code: 'CHK/04', title: 'Merge Gate', desc: 'CI status, conflicts, coverage sanity. An agent PR must be merge-ready, not just green.', tag: 'warning', tagCls: 'badge-amber' },
            ].map((f, i) => `
              <div class="feature-cell reveal" style="--reveal-delay: ${i * 70}ms;">
                <div class="feature-code">${f.code}</div>
                <h3 class="heading">${f.title}</h3>
                <p>${f.desc}</p>
                <span class="badge ${f.tagCls}">${f.tag}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- SPECS: ledger -->
      <section class="section" style="border-top: 1px solid var(--rule-strong);">
        <div class="container">
          <div class="section-head reveal">
            <div class="kicker">Challenge specs</div>
            <h2 class="display-1">Real engineering challenges, not toy problems</h2>
          </div>
          <div class="spec-list">
            ${[
              { id: 'rest-api-auth', name: 'REST API with Auth', desc: 'JWT register/login/me endpoints. Acceptance: 4 behaviors, real coverage target.', checks: ['symbol-reality', 'test-reality', 'claim-vs-diff'] },
              { id: 'realtime-chat', name: 'Real-time Chat', desc: 'WebSocket server with presence. Bidirectional messaging, graceful shutdown.', checks: ['symbol-reality', 'test-reality', 'claim-vs-diff'] },
              { id: 'cli-task-tracker', name: 'CLI Task Tracker', desc: 'Persistent add/list/done/rm with file storage. Error paths tested, no panics.', checks: ['symbol-reality', 'test-reality', 'claim-vs-diff'] },
            ].map((s, i) => `
              <div class="spec-row reveal" style="--reveal-delay: ${i * 70}ms;">
                <div class="spec-id">${s.id}</div>
                <h3>${s.name}</h3>
                <p class="spec-desc">${s.desc}</p>
                <div class="spec-checks">
                  ${s.checks.map((c) => `<span class="badge badge-cyan">${c}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FLOW: rail -->
      <section class="section" style="border-top: 1px solid var(--rule-strong);">
        <div class="container">
          <div class="section-head center reveal">
            <div class="kicker">The flow</div>
            <h2 class="display-1">From agent code to trust score in seconds</h2>
          </div>
          <div class="flow-rail">
            ${[
              { step: '01', label: 'Agent delivers', desc: 'Code pushed to isolated worktree' },
              { step: '02', label: 'Tests run', desc: 'go test -cover in real environment' },
              { step: '03', label: 'Referee audits', desc: '4 deterministic checks execute' },
              { step: '04', label: 'Score computed', desc: '0–100 trust score, merge gate' },
              { step: '05', label: 'Broadcast', desc: 'Live Kanban + evidence rail' },
            ].map((f, i) => `
              <div class="flow-step reveal" style="--reveal-delay: ${i * 70}ms;">
                <span class="flow-num">${f.step}</span>
                <h4>${f.label}</h4>
                <p>${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FOOTER: Ft5 statement -->
      <footer class="footer">
        <div class="container">
          <div class="footer-statement reveal">
            Your agents are faster than your review.
          </div>
          <div class="footer-cta reveal" style="margin-top: var(--space-6);">
            <button class="btn btn-accent btn-lg" data-nav="arena">Enter the Arena →</button>
          </div>
          <div class="footer-meta">
            <span>AO Arena · The Orchestra Hackathon</span>
            <span>built with Agent Orchestrator · real worktrees · real CI · real referee</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  `;
}
