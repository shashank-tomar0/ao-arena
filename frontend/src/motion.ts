// Motion helpers — transform/opacity only, reduced-motion aware.

/** Observe `.reveal` elements inside root and add `.in-view` as they enter. */
export function initReveal(root: ParentNode = document): void {
  const els = root.querySelectorAll<HTMLElement>('.reveal');
  if (els.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

/** Animate an element's textContent from its current value to `target`. */
export function countUp(el: HTMLElement, target: number, duration = 700): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    el.textContent = String(Math.round(target));
    return;
  }
  const from = Number(el.textContent) || 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
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
