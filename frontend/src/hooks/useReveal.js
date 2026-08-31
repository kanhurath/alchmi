import { useEffect } from 'react';

/**
 * Attaches an IntersectionObserver that adds the "visible" class
 * to every element with class "reveal" when it enters the viewport.
 *
 * A MutationObserver watches for elements added after the initial mount
 * (e.g. cards rendered once async API data arrives) and registers them
 * with the IntersectionObserver automatically.
 */
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.12 }
    );

    const observe = (el) => {
      if (el.classList.contains('reveal')) io.observe(el);
    };

    // Observe elements already in the DOM.
    document.querySelectorAll('.reveal').forEach(observe);

    // Observe elements added later (e.g. after API data loads).
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList.contains('reveal')) io.observe(node);
          node.querySelectorAll?.('.reveal').forEach(io.observe.bind(io));
        });
      });
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
