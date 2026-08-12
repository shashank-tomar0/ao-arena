// Landing page: the pitch. Verification-as-officiating for AI agent fleets.

import type { View } from '../app';

export function renderLanding(navigate: (v: View) => void): string {
  return `
    <div class="landing" id="landing">
      <!-- HERO -->
      <header class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge animate-slide-up">
              <span class="badge badge-primary">The Orchestra Hackathon • Aug 12–13</span>
            </div>
            <h1 class="display-1 animate-slide-up delay-1">
              Verification-as-officiating<br>for AI agent fleets
            </h1>
            <p class="body animate-slide-up delay-2" style="max-width: 48ch; color: var(--text-muted); margin-top: var(--space-4);">
              Agent velocity has outrun human inspection. PRs land containing hallucinated APIs,
              theater tests, and ghost claims. The Referee turns "trust me" into "show me the evidence."
            </p>
            <div class="flex gap-3 animate-slide-up delay-3" style="margin-top: var(--space-6); flex-wrap: wrap;">
              <button class="btn btn-primary" data-nav="arena">Enter the Arena</button>
              <a href="https://github.com/shashank-tomar0/ao-arena" target="_blank" class="btn btn-secondary">View on GitHub</a>
            </div>
          </div>

          <!-- Hero Visual: Mini Arena Preview -->
          <div class="hero-visual animate-scale-in delay-4" style="margin-top: var(--space-10);">
            <div class="mini-arena">
              <div class="mini-board" data-fleet="a">
                <div class="mini-header"><span class="mini-title">Fleet A</span></div>
                <div class="mini-lanes">
                  <div class="mini-lane"><span class="mini-lane-label">working</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">ci_failed</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">review_pending</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">mergeable</span></div>
                </div>
              </div>
              <div class="mini-vs">VS</div>
              <div class="mini-board" data-fleet="b">
                <div class="mini-header"><span class="mini-title">Fleet B</span></div>
                <div class="mini-lanes">
                  <div class="mini-lane"><span class="mini-lane-label">working</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">working</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">review_pending</span></div>
                  <div class="mini-lane"><span class="mini-lane-label mergeable">mergeable</span></div>
                </div>
              </div>
            </div>
            <div class="mini-scoreboard">
              <div class="mini-score" style="color: var(--fleet-a)">100</div>
              <div class="mini-divider">/</div>
              <div class="mini-score" style="color: var(--fleet-b)">40</div>
            </div>
          </div>
        </div>
      </header>

      <!-- FEATURES -->
      <section class="section features">
        <div class="container">
          <div class="section-head animate-slide-up">
            <span class="caption">Core Primitives</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">Deterministic verification, not LLM-as-judge</h2>
          </div>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-top: var(--space-8);">
            ${[
              { icon: '🔍', title: 'Symbol Reality', desc: 'Catches hallucinated imports and API calls that resolve to nothing. Every reference verified against the actual codebase symbol graph.', tag: 'Critical' },
              { icon: '🎭', title: 'Test Reality', desc: 'Mutation-differential proof: if tests pass after assertions are neutralized, the suite is theater. Catches expect(true).toBe(true) and empty test bodies.', tag: 'Critical' },
              { icon: '👻', title: 'Claim vs Diff', desc: 'Agent PR summaries often describe work the diff doesn\'t contain. Ghost claims flagged with file:line evidence.', tag: 'Critical' },
              { icon: '🚪', title: 'Merge Gate', desc: 'CI status, conflicts, coverage sanity. An agent PR must be merge-ready, not just green.', tag: 'Warning' },
            ].map((f, i) => `
              <article class="card feature-card animate-slide-up" style="animation-delay: ${i * 80}ms;">
                <div class="feature-icon">${f.icon}</div>
                <h3 class="heading-2" style="margin: var(--space-3) 0 var(--space-2);">${f.title}</h3>
                <p class="body-sm" style="color: var(--text-muted);">${f.desc}</p>
                <span class="badge badge-${f.tag.toLowerCase()}" style="margin-top: var(--space-3); display: inline-block;">${f.tag}</span>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- SPECS -->
      <section class="section specs" style="background: var(--bg-elevated);">
        <div class="container">
          <div class="section-head animate-slide-up">
            <span class="caption">Challenge Specs</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">Real engineering challenges, not toy problems</h2>
          </div>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-top: var(--space-8);">
            ${[
              { id: 'rest-api-auth', name: 'REST API with Auth', desc: 'JWT register/login/me endpoints. Acceptance: 4 behaviors, 100% coverage target.', checks: ['Symbol Reality', 'Test Reality', 'Claim vs Diff'] },
              { id: 'realtime-chat', name: 'Real-time Chat', desc: 'WebSocket server with presence. Bidirectional messaging, graceful shutdown, 100ms echo.', checks: ['Symbol Reality', 'Test Reality', 'Claim vs Diff'] },
              { id: 'cli-task-tracker', name: 'CLI Task Tracker', desc: 'Persistent add/list/done/rm with file storage. Error paths tested, no panics.', checks: ['Symbol Reality', 'Test Reality', 'Claim vs Diff'] },
            ].map((s, i) => `
              <article class="card spec-card animate-slide-up" style="animation-delay: ${i * 80}ms;">
                <div class="spec-header">
                  <span class="caption" style="color: var(--primary);">${s.id}</span>
                  <span class="badge badge-neutral">${s.checks.length} checks</span>
                </div>
                <h3 class="heading-2" style="margin: var(--space-3) 0 var(--space-2);">${s.name}</h3>
                <p class="body-sm" style="color: var(--text-muted); margin-bottom: var(--space-4);">${s.desc}</p>
                <div class="flex gap-2 flex-wrap">
                  ${s.checks.map(c => `<span class="badge badge-info">${c}</span>`).join('')}
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="section how-it-works">
        <div class="container">
          <div class="section-head animate-slide-up" style="text-align: center; margin: 0 auto;">
            <span class="caption">The Flow</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">From agent code to trust score in seconds</h2>
          </div>
          <div class="flow" style="display: flex; gap: var(--space-4); margin-top: var(--space-8); flex-wrap: wrap; justify-content: center;">
            ${[
              { step: '1', label: 'Agent delivers', desc: 'Code pushed to isolated worktree' },
              { step: '2', label: 'Tests run', desc: 'go test -cover in real environment' },
              { step: '3', label: 'Referee audits', desc: '4 deterministic checks execute' },
              { step: '4', label: 'Score computed', desc: '0–100 trust score, merge gate' },
              { step: '5', label: 'Broadcast', desc: 'Live Kanban + evidence rail' },
            ].map((f, i) => `
              <div class="flow-step card animate-slide-up" style="animation-delay: ${i * 80}ms; min-width: 180px; max-width: 220px; text-align: center;">
                <div class="flow-step-num" style="font-size: var(--text-3xl); font-weight: 700; color: var(--primary); font-family: var(--font-display);">${f.step}</div>
                <h4 class="heading-2" style="margin: var(--space-2) 0;">${f.label}</h4>
                <p class="caption" style="color: var(--text-muted);">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FOOTER CTA -->
      <footer class="footer" style="background: var(--bg-elevated); border-top: 1px solid var(--border);">
        <div class="container" style="text-align: center; padding: var(--space-12) 0;">
          <h3 class="display-3">Ready to see agents compete?</h3>
          <p class="body" style="color: var(--text-muted); margin: var(--space-3) 0 var(--space-6); max-width: 40ch; margin-left: auto; margin-right: auto;">
            Built with Agent Orchestrator for The Orchestra hackathon. Real worktrees, real CI, real referee.
          </p>
          <button class="btn btn-primary btn-lg" data-nav="arena" style="padding: var(--space-3) var(--space-8); font-size: var(--text-base);">
            Enter the Arena →
          </button>
        </div>
      </footer>
    </div>
  `;
}
