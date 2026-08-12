// Audit page: the referee as a service. Paste any agent diff — the server
// runs the four deterministic checks against the exact input and returns a
// real verdict with evidence. This is the standalone product surface.

import { audit, type Verdict } from '../api';

// Real unified diffs so anyone can try the referee in two clicks. The server
// analyzes these inputs exactly as written — nothing is special-cased.
const SAMPLE_THEATER = `diff --git a/auth/auth_test.go b/auth/auth_test.go
--- a/auth/auth_test.go
+++ b/auth/auth_test.go
@@ -13,3 +13,5 @@
 \tif token == "" {
-\t\tt.Fatal("token empty")
+\t\tif true {
+\t\t\t_ = machenhance.Generate() // hallucinated API — resolves nowhere
+\t\t}
 \t}
`;

const SAMPLE_CLEAN = `diff --git a/auth/auth.go b/auth/auth.go
--- a/auth/auth.go
+++ b/auth/auth.go
@@ -10,6 +10,10 @@
 \tif u == nil {
 \t\treturn "", ErrNotFound
 \t}
+\t// guard: reject empty tokens before returning them
+\tif u != nil && u.Token == "" {
+\t\treturn "", ""
+\t}
 \treturn u.Token, nil
`;

export function renderAudit(): string {
  return `
    <div class="page" id="audit">
      <main class="container">
        <div class="page-head">
          <div>
            <div class="kicker">Referee · standalone</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">Audit any diff against reality</h1>
          </div>
          <div class="flex gap-2 flex-wrap">
            <span class="badge badge-cyan">symbol-reality</span>
            <span class="badge badge-cyan">test-reality</span>
            <span class="badge badge-cyan">claim-vs-diff</span>
            <span class="badge badge-cyan">merge-gate</span>
          </div>
        </div>

        <div class="audit-grid">
          <!-- CASE FILE -->
          <section class="panel reveal">
            <div class="panel-head">
              <h3>Case file · input</h3>
              <div class="flex gap-2">
                <button class="btn btn-ghost" id="load-theater" style="min-height: 32px; padding: var(--space-1) var(--space-3); font-size: var(--text-2xs);">Theater sample</button>
                <button class="btn btn-ghost" id="load-clean" style="min-height: 32px; padding: var(--space-1) var(--space-3); font-size: var(--text-2xs);">Clean sample</button>
              </div>
            </div>
            <div class="panel-body">
              <textarea id="audit-diff" class="input audit-diff" spellcheck="false"
                placeholder="Paste a unified diff here, e.g.&#10;diff --git a/auth/auth_test.go b/auth/auth_test.go&#10;--- a/auth/auth_test.go&#10;+++ b/auth/auth_test.go"></textarea>
              <label class="field-label" for="audit-body">PR body · checked against the diff for ghost claims</label>
              <textarea id="audit-body" class="input audit-body" spellcheck="false"
                placeholder="Added authentication, added validation, added tests…"></textarea>
              <button class="btn btn-primary btn-lg" id="run-audit" style="width: 100%; margin-top: var(--space-5);">
                Run Referee
              </button>
            </div>
          </section>

          <!-- RULING -->
          <section class="panel reveal" style="--reveal-delay: 80ms;">
            <div class="panel-head">
              <h3>Ruling · verdict</h3>
              <span class="badge badge-neutral" id="verdict-badge">waiting</span>
            </div>
            <div class="panel-body">
              <div id="verdict-empty" class="verdict-empty">
                <div class="score-ring ring-empty"><span>—</span></div>
                <p class="body-sm text-muted">The referee is ready. Paste a diff and run it.</p>
              </div>
              <div id="verdict-body" style="display: none;"></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  `;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderVerdict(v: Verdict) {
  const empty = document.getElementById('verdict-empty')!;
  const body = document.getElementById('verdict-body')!;
  const badge = document.getElementById('verdict-badge')!;

  const status = !v.mergeable && v.trust_score < 70 ? 'blocked' : v.mergeable ? 'clean' : 'caution';
  const statusLabel = status === 'blocked' ? 'blocked' : status === 'clean' ? 'clean' : 'caution';
  const score = Math.round(v.trust_score);
  const color = status === 'blocked' ? 'var(--danger)' : status === 'clean' ? 'var(--ok)' : 'var(--warn)';
  const pct = Math.max(0, Math.min(100, score));

  badge.className = `badge badge-${status === 'blocked' ? 'danger' : status === 'clean' ? 'ok' : 'amber'}`;
  badge.textContent = statusLabel;

  empty.style.display = 'none';
  body.style.display = 'block';

  const findings = v.findings.length
    ? v.findings.map(f => `
      <div class="finding ${f.severity}">
        <div class="f-head">
          <span class="badge badge-${f.severity === 'critical' ? 'danger' : f.severity === 'warning' ? 'amber' : 'cyan'}">${f.severity}</span>
          <span class="f-cat">${esc(f.category)}</span>
        </div>
        <p>${esc(f.message)}</p>
        ${f.evidence_path ? `<code>${esc(f.evidence_path)}</code>` : ''}
        ${f.suggestion ? `<p class="f-sugg">↳ ${esc(f.suggestion)}</p>` : ''}
      </div>
    `).join('')
    : `<p class="body-sm" style="color: var(--ok);">No findings — every check passed.</p>`;

  body.innerHTML = `
    <div class="verdict-top">
      <div class="score-ring" style="--ring-color: ${color}; --ring-pct: ${pct * 3.6}deg;">
        <span>${score}</span>
      </div>
      <div class="verdict-summary">
        <p>${esc(v.summary)}</p>
        <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
          <span class="badge badge-neutral">${v.duration_ms}ms</span>
          <span class="badge badge-neutral">${v.checks_run.length} checks</span>
          <span class="badge badge-neutral">${esc(v.pr_ref)}</span>
        </div>
      </div>
    </div>
    <div class="flex gap-2" style="margin: var(--space-5) 0; flex-wrap: wrap;">
      ${v.checks_run.map(c => `<span class="badge badge-cyan">${esc(c)}</span>`).join('')}
    </div>
    <div class="findings">
      <div class="field-label" style="margin: 0 0 var(--space-3);">Findings</div>
      ${findings}
    </div>
    <div class="receipt">
      <div class="field-label" style="margin: 0 0 var(--space-2);">Receipt · tamper-evident</div>
      <code>${esc(v.receipt_hash)}</code>
    </div>
  `;
}

function showError(msg: string) {
  const empty = document.getElementById('verdict-empty')!;
  const body = document.getElementById('verdict-body')!;
  const badge = document.getElementById('verdict-badge')!;
  badge.className = 'badge badge-danger';
  badge.textContent = 'error';
  empty.style.display = 'flex';
  body.style.display = 'none';
  empty.innerHTML = `
    <div class="score-ring ring-empty"><span>!</span></div>
    <p class="body-sm" style="color: var(--danger);">${esc(msg)}</p>
  `;
}

export function mountAudit(): () => void {
  const diffEl = document.getElementById('audit-diff') as HTMLTextAreaElement;
  const bodyEl = document.getElementById('audit-body') as HTMLTextAreaElement;
  const runBtn = document.getElementById('run-audit') as HTMLButtonElement;

  document.getElementById('load-theater')?.addEventListener('click', () => {
    diffEl.value = SAMPLE_THEATER;
    bodyEl.value = 'Added tests and authentication for the login flow.';
    diffEl.focus();
  });
  document.getElementById('load-clean')?.addEventListener('click', () => {
    diffEl.value = SAMPLE_CLEAN;
    bodyEl.value = 'Added a guard for empty tokens.';
    diffEl.focus();
  });

  runBtn.addEventListener('click', async () => {
    const diff = diffEl.value.trim();
    if (!diff) {
      showError('Paste a diff first — the referee audits the exact input you give it.');
      return;
    }
    runBtn.disabled = true;
    runBtn.textContent = 'Auditing…';
    const badge = document.getElementById('verdict-badge')!;
    badge.className = 'badge badge-cyan';
    badge.textContent = 'running';
    try {
      const v = await audit(diff, bodyEl.value);
      renderVerdict(v);
    } catch (e) {
      showError((e as Error).message);
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = 'Run Referee';
    }
  });

  return () => {};
}
