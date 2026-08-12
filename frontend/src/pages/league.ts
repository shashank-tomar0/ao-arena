// League page: persistent season standings + activity log. Data comes from
// the server's JSON-backed league store — every real match and audit is
// recorded and survives restarts.

import { history, league, type HistoryRecord, type Standing } from '../api';

export function renderLeague(): string {
  return `
    <div class="league" id="league">
      <main class="container" style="flex: 1; padding: var(--space-6); max-width: 1440px;">
        <div class="section-head animate-slide-up" style="margin-bottom: var(--space-6);">
          <span class="caption">Season 0</span>
          <h1 class="display-2" style="margin-top: var(--space-2);">League Table</h1>
          <p class="body" style="max-width: 56ch; color: var(--text-muted); margin-top: var(--space-3);">
            ELO ratings computed from every completed head-to-head. Audits are logged but don't move ratings.
            Persisted to disk — a season survives server restarts.
          </p>
        </div>

        <div class="league-grid">
          <section class="card animate-slide-up delay-1">
            <div class="evidence-header" style="margin-bottom: var(--space-4);">
              <h3 class="heading-2">Standings</h3>
              <span class="badge badge-neutral" id="league-count">0 matches</span>
            </div>
            <div class="table-wrap">
              <table class="standings-table" id="standings-table">
                <thead>
                  <tr>
                    <th>#</th><th>Fleet</th><th>ELO</th><th>W</th><th>L</th><th>D</th><th>Matches</th>
                  </tr>
                </thead>
                <tbody id="standings-body">
                  <tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="card animate-slide-up delay-2">
            <div class="evidence-header" style="margin-bottom: var(--space-4);">
              <h3 class="heading-2">Activity Log</h3>
              <button class="btn btn-ghost" id="refresh-league" style="font-size: var(--text-xs);">Refresh</button>
            </div>
            <ul class="history-list" id="history-list">
              <li class="history-empty">No activity yet.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  `;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderStandings(standings: Standing[], count: number) {
  const body = document.getElementById('standings-body')!;
  const countEl = document.getElementById('league-count')!;
  countEl.textContent = `${count} record${count !== 1 ? 's' : ''}`;

  if (!standings.length) {
    body.innerHTML = `<tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>`;
    return;
  }

  body.innerHTML = standings.map((s, i) => `
    <tr class="${i < 3 ? 'podium' : ''}">
      <td class="rank">${i + 1}</td>
      <td class="fleet-name">${esc(s.name)}</td>
      <td class="elo">${Math.round(s.elo)}</td>
      <td class="w">${s.wins}</td>
      <td class="l">${s.losses}</td>
      <td class="d">${s.draws}</td>
      <td>${s.matches}</td>
    </tr>
  `).join('');
}

function winnerBadge(kind: string, winner: string): string {
  if (kind === 'audit') {
    return winner === 'clean'
      ? '<span class="badge badge-success">clean</span>'
      : '<span class="badge badge-danger">blocked</span>';
  }
  return winner === 'Fleet A'
    ? '<span class="badge badge-info">Fleet A</span>'
    : winner === 'Fleet B'
      ? '<span class="badge badge-accent">Fleet B</span>'
      : '<span class="badge badge-neutral">draw</span>';
}

function renderHistory(records: HistoryRecord[]) {
  const list = document.getElementById('history-list')!;
  if (!records.length) {
    list.innerHTML = `<li class="history-empty">No activity yet.</li>`;
    return;
  }
  list.innerHTML = records.map(r => `
    <li class="history-item">
      <div class="history-head">
        <span class="caption">${fmtTime(r.created_at)} · ${esc(r.kind)}</span>
        ${winnerBadge(r.kind, r.winner)}
      </div>
      <div class="history-match">
        <span>${esc(r.fleet_a)}</span>
        <span class="history-score">${Math.round(r.score_a)} : ${Math.round(r.score_b)}</span>
        <span>${esc(r.fleet_b)}</span>
      </div>
      <p class="caption" style="color: var(--text-muted);">${esc(r.summary)}</p>
    </li>
  `).join('');
}

export function mountLeague(): () => void {
  async function load() {
    try {
      const [l, h] = await Promise.all([league(), history()]);
      renderStandings(l.standings, l.matches);
      renderHistory(h.history);
    } catch {
      const body = document.getElementById('standings-body')!;
      body.innerHTML = `<tr><td colspan="7" class="table-empty">Could not reach the league store.</td></tr>`;
    }
  }

  document.getElementById('refresh-league')?.addEventListener('click', load);
  void load();
  return () => {};
}
