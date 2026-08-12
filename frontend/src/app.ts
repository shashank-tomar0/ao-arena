/*
 * AO Arena — App shell + router
 * Views: landing → arena / audit / league. Shared topbar with hash routing.
 * No framework, vanilla TS — intentional, minimal, fast.
 */

import './styles.css';
import { initReveal } from './motion';
import { renderLanding } from './pages/landing';
import { renderArena, mountArena } from './pages/arena';
import { renderAudit, mountAudit } from './pages/audit';
import { renderLeague, mountLeague } from './pages/league';

export type View = 'landing' | 'arena' | 'audit' | 'league';

interface Page {
  render: () => string;
  mount?: () => () => void;
}

const pages: Record<View, Page> = {
  landing: { render: () => renderLanding(navigate) },
  arena: { render: renderArena, mount: mountArena },
  audit: { render: renderAudit, mount: mountAudit },
  league: { render: renderLeague, mount: mountLeague },
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

  const page = pages[view];
  app.innerHTML = pillnav() + page.render();

  // Wire navigation + active state.
  document.querySelectorAll<HTMLElement>('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.nav as View));
  });
  document.querySelectorAll<HTMLElement>('.nav-link').forEach((el) => {
    el.classList.toggle('active', el.dataset.nav === view);
  });

  if (page.mount) cleanup = page.mount() ?? null;

  // Scroll-reveal + stagger for this view's content.
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach((el, i) => {
    (el as HTMLElement).style.setProperty('--reveal-delay', `${Math.min(i, 8) * 60}ms`);
  });
  initReveal(app);

  if (location.hash !== `#${view}`) {
    history.pushState({ view }, '', view === 'landing' ? '#' : `#${view}`);
  }
}

function viewFromHash(): View {
  const h = location.hash.replace(/^#/, '');
  return (['arena', 'audit', 'league'] as View[]).includes(h as View) ? (h as View) : 'landing';
}

window.addEventListener('popstate', () => navigate(viewFromHash()));

// Boot to the hashed view (defaults to landing).
navigate(viewFromHash());

// Expose for debugging.
(window as any).aoArena = { navigate, get view() { return currentView; } };
