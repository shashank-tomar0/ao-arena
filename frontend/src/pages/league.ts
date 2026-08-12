// League page: persistent season standings + activity log. Data comes from
// the server's JSON-backed league store — every real match and audit is
// recorded and survives restarts.

import { history, league, type HistoryRecord, type Standing } from '../api';

export function renderLeague(): string {
  return `
    <div class="page" id="league">
      <main class="container container-wide">
        <div class="page-head">
          <div>
            <div class="kicker">Season 0 · standings</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">League Table</h1>
          </div>
          <span class="badge badge-neutral" id="league-count">0 records</span>
        </div>
        <p class="lede reveal" style="margin-top: var(--space-5); max-width: 56ch;">
          ELO ratings computed from every completed head-to-head. Audits are logged but don't move ratings.
          Persisted to disk — a season survives server restarts.
        </p>

        <div class="league-grid">
          <section class="panel reveal">
            <div class="panel-head">
              <h3>Standings</h3>
              <button class="btn btn-ghost" id="refresh-league" style="min-height: 32px; padding: var(--space-1) var(--space-3); font-size: var(--text-2xs);">Refresh</button>
            </div>
            <div class="table-wrap">
              <table class="standings-table" id="standings-table">
                <thead>
                  <tr>
                    <th>#</th><th>Fleet</th><th>ELO</th><th class="col-w">W</th><th class="col-l">L</th><th class="col-d">D</th><th>Matches</th>
                  </tr>
                </thead>
                <tbody id="standings-body">
                  <tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel reveal" style="--reveal-delay: 80ms;">
            <div class="panel-head">
              <h3>Activity log</h3>
              <span class="badge badge-neutral">recent</span>
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
  countEl.className = 'badge badge-neutral';

  if (!standings.length) {
    body.innerHTML = `<tr><td colspan="7" class="table-empty">No matches yet — run one in the Arena.</td></tr>`;
    return;
  }

  body.innerHTML = standings.map((s, i) => `
    <tr class="${i < 3 ? 'podium' : ''}">
      <td class="rank">${String(i + 1).padStart(2, '0')}</td>
      <td class="fleet-name">${esc(s.name)}</td>
      <td class="elo">${Math.round(s.elo)}</td>
      <td class="col-w">${s.wins}</td>
      <td class="col-l">${s.losses}</td>
      <td class="col-d">${s.draws}</td>
      <td>${s.matches}</td>
    </tr>
  `).join('');
}

function winnerBadge(kind: string, winner: string): string {
  if (kind === 'audit') {
    return winner === 'clean'
      ? '<span class="badge badge-ok">clean</span>'
      : '<span class="badge badge-danger">blocked</span>';
  }
  return winner === 'Fleet A'
    ? '<span class="badge badge-fleet-a">Fleet A</span>'
    : winner === 'Fleet B'
      ? '<span class="badge badge-fleet-b">Fleet B</span>'
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
        <span>${fmtTime(r.created_at)} · ${esc(r.kind)}</span>
        ${winnerBadge(r.kind, r.winner)}
      </div>
      <div class="history-match">
        <span>${esc(r.fleet_a)}</span>
        <span class="history-score">${Math.round(r.score_a)} : ${Math.round(r.score_b)}</span>
        <span>${esc(r.fleet_b)}</span>
      </div>
      <p class="history-sum">${esc(r.summary)}</p>
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
