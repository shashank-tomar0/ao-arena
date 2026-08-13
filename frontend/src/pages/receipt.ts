// Receipt page — the shareable /r/<hash> surface.
// A verdict was sealed with a tamper-evident receipt; open that receipt
// anywhere and the full ruling re-renders from the league store, with a
// one-click re-verification. This is what "trust, verifiable by anyone"
// looks like.

import { verdictPage, verifyReceipt, type Verdict, type VerdictFinding } from '../api';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function findingsList(v: Verdict): string {
  const findings = v.findings ?? [];
  if (!findings.length) return `<p class="body-sm" style="color: var(--ok);">No findings — every check passed.</p>`;
  return findings.map(f => `
    <div class="finding ${f.severity}">
      <div class="f-head">
        <span class="badge badge-${f.severity === 'critical' ? 'danger' : f.severity === 'warning' ? 'amber' : 'cyan'}">${f.severity}</span>
        <span class="f-cat">${esc(f.category)}</span>
      </div>
      <p>${esc(f.message)}</p>
      ${(f.evidence || f.evidence_path) ? `
        <details class="evidence-detail">
          <summary>evidence · <code>${esc(f.evidence_path || 'inline')}</code></summary>
          <pre class="evidence-snippet"><code>${esc(f.evidence || f.evidence_path || '')}</code></pre>
        </details>` : ''}
      ${f.suggestion ? `<p class="f-sugg">↳ ${esc(f.suggestion)}</p>` : ''}
    </div>`).join('');
}

function verdictCard(v: Verdict, fleetLabel: string): string {
  const checks = v.checks_run ?? [];
  const status = !v.mergeable && v.trust_score < 70 ? 'blocked' : v.mergeable ? 'clean' : 'caution';
  const score = Math.round(v.trust_score);
  const color = status === 'blocked' ? 'var(--danger)' : status === 'clean' ? 'var(--ok)' : 'var(--warn)';
  const pct = Math.max(0, Math.min(100, score));
  return `
    <div class="panel">
      <div class="panel-head">
        <h3>${fleetLabel}</h3>
        <span class="badge badge-${status === 'blocked' ? 'danger' : status === 'clean' ? 'ok' : 'amber'}">${status}</span>
      </div>
      <div class="panel-body">
        <div class="verdict-top">
          <div class="score-ring" style="--ring-color: ${color}; --ring-pct: ${pct * 3.6}deg;"><span>${score}</span></div>
          <div class="verdict-summary">
            <p>${esc(v.summary)}</p>
            <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
            <span class="badge badge-neutral">${v.duration_ms}ms</span>
            <span class="badge badge-neutral">${checks.length} checks</span>
            <span class="badge badge-neutral">${esc(v.pr_ref)}</span>
            </div>
          </div>
        </div>
        <div class="findings" style="margin-top: var(--space-5);">${findingsList(v)}</div>
        <div class="receipt" style="margin-top: var(--space-5);">
          <div class="field-label">Receipt · tamper-evident</div>
          <code>${esc(v.receipt_hash)}</code>
        </div>
      </div>
    </div>`;
}

export function renderReceipt(hash: string): string {
  return `
    <div class="page" id="receipt">
      <main class="container">
        <div class="page-head">
          <div>
            <div class="kicker">Public receipt</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">Verdict · sealed</h1>
          </div>
          <span class="badge badge-neutral" id="receipt-badge">resolving ${esc(hash.slice(0, 12))}…</span>
        </div>
        <div id="receipt-body" class="receipt-body">
          <p class="body-sm text-muted">Resolving the receipt against the league store…</p>
        </div>
      </main>
    </div>
  `;
}

export function mountReceipt(hash: string): () => void {
  void (async () => {
    const body = document.getElementById('receipt-body')!;
    const badge = document.getElementById('receipt-badge')!;
    let page;
    try {
      page = await verdictPage(hash);
    } catch {
      badge.className = 'badge badge-danger';
      badge.textContent = 'not found';
      body.innerHTML = `<p class="body-sm" style="color: var(--danger);">Could not resolve <code>${esc(hash)}</code>. Receipts are valid only for verdicts recorded in this arena's league store.</p>`;
      return;
    }
    if (!page.found) {
      badge.className = 'badge badge-danger';
      badge.textContent = 'not found';
      body.innerHTML = `<p class="body-sm" style="color: var(--danger);">No verdict carries the receipt <code>${esc(hash)}</code>.</p>`;
      return;
    }

    badge.className = 'badge badge-ok';
    badge.textContent = 'sealed · verified';

    const when = page.created_at ? new Date(page.created_at).toLocaleString() : '';
    let cards = '';
    if (page.kind === 'audit' && page.verdict) {
      cards = verdictCard(page.verdict, 'Audit ruling');
    } else if (page.fleet_a && page.fleet_b) {
      cards = `
        <div class="receipt-grid">
          ${verdictCard(page.fleet_a, 'Fleet A')}
          ${verdictCard(page.fleet_b, 'Fleet B')}
        </div>`;
    } else {
      cards = `<p class="body-sm text-muted">${esc(page.summary || '')} · winner ${esc(page.winner || '')} · ${String(page.score_a ?? 0)} : ${String(page.score_b ?? 0)}</p>`;
    }

    body.innerHTML = `
      <p class="lede" style="margin: var(--space-5) 0;">Ruling recorded ${esc(when || 'this season')}. Every verdict below is sealed into the arena's tamper-evident trust ledger.</p>
      ${cards}
      <div class="flex gap-2" style="margin-top: var(--space-5);">
        <button class="btn btn-ghost" id="receipt-verify">Verify this receipt</button>
        <span class="body-sm text-muted" id="receipt-outcome"></span>
      </div>
    `;

    document.getElementById('receipt-verify')?.addEventListener('click', async () => {
      const out = document.getElementById('receipt-outcome')!;
      const v = page.verdict ?? page.fleet_a ?? page.fleet_b;
      if (!v) return;
      try {
        const r = await verifyReceipt(v, hash);
        out.textContent = r.valid
          ? `✓ ${r.recomputed.slice(0, 16)}… — matches the sealed receipt`
          : `✗ ${r.recomputed.slice(0, 16)}… — receipt broken`;
      } catch (e) {
        out.textContent = `verify failed: ${(e as Error).message}`;
      }
    });
  })();
  return () => {};
}
