// Motion helpers — transform/opacity only, reduced-motion aware.
// Enhanced with spring physics, card hover, and premium scroll reveals.

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Observe `.reveal` elements inside root and add `.in-view` as they enter. */
export function initReveal(root: ParentNode = document): void {
  const els = root.querySelectorAll<HTMLElement>('.reveal');
  if (els.length === 0) return;

  if (prefersReduced) {
    els.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('in-view');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

/** Animate an element's textContent from its current value to `target` with spring easing. */
export function countUp(el: HTMLElement, target: number, duration = 700): void {
  if (prefersReduced) {
    el.textContent = String(Math.round(target));
    return;
  }
  const from = Number(el.textContent) || 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    // Spring-like easing: cubic-bezier(0.16, 1, 0.3, 1)
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(from + (target - from) * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Assign a staggered reveal delay to a list of elements (0-based index). */
export function stagger(els: NodeListOf<Element>, base = 60): void {
  els.forEach((el, i) => {
    (el as HTMLElement).style.setProperty('--reveal-delay', `${i * base}ms`);
  });
}

/** Initialize subtle card hover lift effects on all .task-card and .proof-cell elements. */
export function initCardHover(root: ParentNode = document): void {
  if (prefersReduced) return;

  const cards = root.querySelectorAll<HTMLElement>('.task-card, .proof-cell');
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1)';
    });
  });
}

/**
 * Scroll parallax for the hero ghost wordmark — drifts slower than the page,
 * transform-only, rAF-throttled, reduced-motion aware.
 */
export function initGhostParallax(root: ParentNode = document): void {
  const ghost = root.querySelector<HTMLElement>('.ghost-word');
  if (!ghost || prefersReduced) return;

  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    // Words the referee's shadow up and sideways as you scroll — subtle, 0.07x.
    ghost.style.transform = `translate3d(${y * 0.03}px, ${y * 0.07}px, 0)`;
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

/** Pulse animation on an element — e.g. score update. */
export function pulseEl(el: HTMLElement): void {
  if (prefersReduced) return;
  el.classList.remove('score-pulse');
  void el.offsetWidth; // force reflow
  el.classList.add('score-pulse');
}

/** Flash an element briefly — e.g. badge update. */
export function flashEl(el: HTMLElement, cls = 'flash'): void {
  if (prefersReduced) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
