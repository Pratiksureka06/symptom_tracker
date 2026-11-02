import { useEffect } from 'react';

/* ---------------------------------------------------------------------------
   Entrance motion for the parts of a section.

   The hidden state is scoped to a `js-motion` class that this hook puts on
   <html>. If the script never runs, the class is never added and every
   element renders at full opacity — content is never hidden behind an
   animation that may not fire.

   Elements opt in with data-reveal. A data-reveal-delay attribute (in ms)
   staggers the parts of one section: heading, then text, then the fragment.
--------------------------------------------------------------------------- */
export function useReveal(): void {
  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (nodes.length === 0) return;

    if (reduced || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('is-in'));
      return;
    }

    const root = document.documentElement;
    root.classList.add('js-motion');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset.revealDelay || 0);
          window.setTimeout(() => el.classList.add('is-in'), delay);
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    nodes.forEach((n) => io.observe(n));

    return () => {
      io.disconnect();
      root.classList.remove('js-motion');
    };
  }, []);
}
