/*
 * AO Arena — App shell + router
 * Views: landing → arena / audit / league. Shared topbar with hash routing.
 * No framework, vanilla TS — intentional, minimal, fast.
 */

import './styles.css';
import { initReveal, initGhostParallax } from './motion';
import { renderLanding, mountLanding } from './pages/landing';
import { renderArena, mountArena } from './pages/arena';
import { renderAudit, mountAudit } from './pages/audit';
import { renderLeague, mountLeague } from './pages/league';
import { renderOverlay, mountOverlay } from './pages/overlay';
import { renderReceipt, mountReceipt } from './pages/receipt';

export type View = 'landing' | 'arena' | 'audit' | 'league' | 'overlay' | 'receipt';

interface Page {
  render: () => string;
  mount?: () => () => void;
  bare?: boolean; // render without the pillnav (broadcast overlay)
}

const pages: Record<View, Page> = {
  landing: { render: () => renderLanding(navigate), mount: mountLanding },
  arena: { render: renderArena, mount: mountArena },
  audit: { render: renderAudit, mount: mountAudit },
  league: { render: renderLeague, mount: mountLeague },
  overlay: { render: renderOverlay, mount: mountOverlay, bare: true },
  // receipt is parameterized by the hash — handled specially in navigate.
  receipt: { render: () => '', mount: () => () => {} },
};

const app = document.getElementById('app')!;
let currentView: View = 'landing';
let cleanup: (() => void) | null = null;

// N5 floating pill nav — rendered above every view.
function pillnav(): string {
  return `
    <nav class="pillnav" aria-label="Primary">
      <button class="logo" data-nav="landing">AO<span class="logo-accent">▲</span>ARENA</button>
      <div class="pillnav-links">
        <button class="nav-link" data-nav="arena">Arena</button>
        <button class="nav-link" data-nav="audit">Audit</button>
        <button class="nav-link" data-nav="league">League</button>
      </div>
      <span id="clock" class="pillnav-clock">--:--</span>
      <a class="pillnav-gh" href="https://github.com/shashank-tomar0/ao-arena" target="_blank" rel="noopener">GitHub ↗</a>
    </nav>
  `;
}

export function navigate(view: View): void {
  cleanup?.();
  cleanup = null;
  currentView = view;

  const receiptHash = view === 'receipt' ? location.hash.replace(/^#r\//, '') : '';
  const page: Page =
    view === 'receipt'
      ? { render: () => renderReceipt(receiptHash), mount: () => mountReceipt(receiptHash) }
      : pages[view];
  app.innerHTML = (page.bare ? '' : pillnav()) + page.render();

  // Wire navigation + active state.
  document.querySelectorAll<HTMLElement>('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.nav as View));
  });
  document.querySelectorAll<HTMLElement>('.nav-link').forEach((el) => {
    el.classList.toggle('active', el.dataset.nav === view);
  });

  if (page.mount) cleanup = page.mount() ?? null;

  // The nav is re-rendered with every navigation — paint the clock
  // immediately instead of waiting for the next second-tick.
  updateClock();

  // Scroll-reveal + stagger for this view's content.
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach((el, i) => {
    (el as HTMLElement).style.setProperty('--reveal-delay', `${Math.min(i, 8) * 60}ms`);
  });
  initReveal(app);
  initGhostParallax(app);

  // Receipt pages keep their #r/<hash> address; everything else normalizes.
  if (view !== 'receipt' && location.hash !== `#${view}`) {
    history.pushState({ view }, '', view === 'landing' ? '#' : `#${view}`);
  }
}

function viewFromHash(): View {
  const h = location.hash.replace(/^#/, '');
  if (h.startsWith('r/')) return 'receipt';
  return (['arena', 'audit', 'league', 'overlay'] as View[]).includes(h as View) ? (h as View) : 'landing';
}

window.addEventListener('popstate', () => navigate(viewFromHash()));

// Boot to the hashed view (defaults to landing).
navigate(viewFromHash());

// The pillnav clock is a single app-lifetime interval — one writer, stable
// tabular digits, alive on every page. (The old per-page timer leaked on
// navigation and made the clock flicker between two values.)
function updateClock(): void {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date();
  el.textContent =
    [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, '0'))
      .join(':');
}
function startClock(): void {
  updateClock();
  window.setInterval(updateClock, 1000);
}
startClock();

// Expose for debugging.
(window as any).aoArena = { navigate, get view() { return currentView; } };
