// Audit page: the referee as a service. Paste any agent diff — the server
// runs the deterministic checks against the exact input and returns a real
// verdict with evidence. This is the standalone product surface.
//
// Beyond the verdict itself, this page proves the referee's two hardest
// claims, live:
//   - Tamper-evidence: verify the receipt, then flip one finding and watch
//     the receipt break.
//   - Determinism: the same diff audited 5 times produces 5 identical
//     receipt hashes. No LLM judge could make that promise.

import { audit, determinism, verifyReceipt, type Verdict, type VerdictFinding } from '../api';

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

// The real build output the Go toolchain produces for the theater sample's
// hallucinated call — paste it in the build-output field and the referee
// reports the compiler's own evidence instead of a static guess.
const SAMPLE_BUILD = `# example.com/rest-api-auth/auth
./auth/auth_test.go:16:13: undefined: machenhance
FAIL\texample.com/rest-api-auth/auth [build failed]
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
              <label class="field-label" for="audit-build">Build / CI output · optional, makes symbol checks compiler-backed</label>
              <textarea id="audit-build" class="input audit-build" spellcheck="false"
                placeholder="Paste go test / go build output — undefined: X errors become compiler-reality findings with the compiler's own file:line."></textarea>
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

// A finding's evidence renders as a clickable code block — drill down to the
// exact line, claim, or mutant the referee pointed at.
function evidenceBlock(f: VerdictFinding): string {
  const snippet = f.evidence || f.evidence_path;
  if (!snippet) return '';
  return `
    <details class="evidence-detail">
      <summary>evidence · <code>${esc(f.evidence_path || 'inline')}</code></summary>
      <pre class="evidence-snippet"><code>${esc(snippet)}</code></pre>
    </details>`;
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

  const findings = (v.findings ?? []).length
    ? (v.findings ?? []).map(f => `
      <div class="finding ${f.severity}">
        <div class="f-head">
          <span class="badge badge-${f.severity === 'critical' ? 'danger' : f.severity === 'warning' ? 'amber' : 'cyan'}">${f.severity}</span>
          <span class="f-cat">${esc(f.category)}</span>
        </div>
        <p>${esc(f.message)}</p>
        ${evidenceBlock(f)}
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
      ${(v.checks_run ?? []).map(c => `<span class="badge badge-cyan">${esc(c)}</span>`).join('')}
    </div>
    <div class="findings">
      <div class="field-label" style="margin: 0 0 var(--space-3);">Findings</div>
      ${findings}
    </div>
    <div class="receipt">
      <div class="field-label" style="margin: 0 0 var(--space-2);">Receipt · tamper-evident</div>
      <code>${esc(v.receipt_hash)}</code>
    </div>

    <div class="proof-actions">
      <button class="btn btn-ghost" id="verify-receipt">Verify receipt</button>
      <button class="btn btn-ghost" id="tamper-test">Tamper test · flip a finding</button>
      <button class="btn btn-ghost" id="det-check">Determinism · run ×5</button>
    </div>
    <div id="proof-outcome"></div>
  `;

  document.getElementById('verify-receipt')?.addEventListener('click', () =>
    runProof(v, 'verify'));
  document.getElementById('tamper-test')?.addEventListener('click', () =>
    runProof(v, 'tamper'));
  document.getElementById('det-check')?.addEventListener('click', () =>
    runProof(v, 'determinism'));
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

// runProof drives the three referee proofs: verify, tamper, determinism.
// Each is a real server-side computation over the exact verdict the user
// just received — nothing is hardcoded.
async function runProof(v: Verdict, kind: 'verify' | 'tamper' | 'determinism') {
  const out = document.getElementById('proof-outcome')!;
  const render = (html: string, tone: 'ok' | 'danger' | 'info') => {
    out.innerHTML = `<div class="proof-result ${tone}">${html}</div>`;
  };

  try {
    if (kind === 'verify') {
      const r = await verifyReceipt(v, v.receipt_hash);
      render(
        r.valid
          ? `<strong>RECEIPT VERIFIED ✓</strong><br><span class="body-sm">recomputed <code>${esc(r.recomputed)}</code> matches the receipt — the verdict is exactly as it was sealed.</span>`
          : `<strong>RECEIPT BROKEN ✗</strong><br><span class="body-sm">recomputed <code>${esc(r.recomputed)}</code> ≠ claimed <code>${esc(r.claimed)}</code>.</span>`,
        r.valid ? 'ok' : 'danger'
      );
      return;
    }

    if (kind === 'tamper') {
      // Clone the verdict, change one finding, keep the ORIGINAL receipt.
      // The server recomputes over the tampered verdict — and the receipt
      // must break.
      const tampered: Verdict = JSON.parse(JSON.stringify(v));
      if (tampered.findings.length) {
        tampered.findings[0] = {
          ...tampered.findings[0],
          message: tampered.findings[0].message + ' (edited by the attacker)',
        };
      } else {
        tampered.summary = tampered.summary + ' — silently rewritten';
      }
      const r = await verifyReceipt(tampered, v.receipt_hash);
      render(
        r.valid
          ? `<strong>TAMPER WENT UNDETECTED ✗</strong><br><span class="body-sm">this should never happen — the receipt must break.</span>`
          : `<strong>TAMPER CAUGHT ✓</strong><br><span class="body-sm">one finding edited → <code>${esc(r.recomputed.slice(0, 16))}…</code> ≠ <code>${esc(r.claimed.slice(0, 16))}…</code>. Edit any evidence, break the receipt.</span>`,
        r.valid ? 'danger' : 'ok'
      );
      return;
    }

    // determinism: same input through the referee 5 times.
    const diffEl = document.getElementById('audit-diff') as HTMLTextAreaElement;
    const bodyEl = document.getElementById('audit-body') as HTMLTextAreaElement;
    const d = await determinism(diffEl.value, bodyEl.value);
    const hashes = d.receipts.map(h => `<code>${esc(h.slice(0, 20))}…</code>`).join('<br>');
    render(
      d.deterministic
        ? `<strong>DETERMINISTIC ✓ · ${d.runs} runs, ${d.receipts.length} identical receipts</strong><br><span class="body-sm">${hashes}</span><br><span class="body-sm">same diff → same verdict → same receipt. A judge-model cannot promise that.</span>`
        : `<strong>NON-DETERMINISTIC ✗</strong><br><span class="body-sm">${hashes}</span>`,
      d.deterministic ? 'ok' : 'danger'
    );
  } catch (e) {
    render(`proof failed: ${esc((e as Error).message)}`, 'danger');
  }
}

export function mountAudit(): () => void {
  const diffEl = document.getElementById('audit-diff') as HTMLTextAreaElement;
  const bodyEl = document.getElementById('audit-body') as HTMLTextAreaElement;
  const buildEl = document.getElementById('audit-build') as HTMLTextAreaElement;
  const runBtn = document.getElementById('run-audit') as HTMLButtonElement;

  document.getElementById('load-theater')?.addEventListener('click', () => {
    diffEl.value = SAMPLE_THEATER;
    bodyEl.value = 'Added tests and authentication for the login flow.';
    buildEl.value = SAMPLE_BUILD;
    diffEl.focus();
  });
  document.getElementById('load-clean')?.addEventListener('click', () => {
    diffEl.value = SAMPLE_CLEAN;
    bodyEl.value = 'Added a guard for empty tokens.';
    buildEl.value = '';
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
      const v = await audit(diff, bodyEl.value, [], buildEl.value);
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
