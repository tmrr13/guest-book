(() => {
  const CLASS_NAME = 'parallax-text';
  const DEFAULT_SPEED = 1;
  const DEFAULT_RANGE = 100;
  const activeElements = new Set();
  const observedElements = new Set();
  let rafId = null;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  const getNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getSpeed = (el) =>
    getNumber(el.getAttribute('data-parallax-speed'), DEFAULT_SPEED);

  const getRange = (el) => {
    const range = getNumber(
      el.getAttribute('data-parallax-range'),
      Number.NaN
    );
    if (Number.isFinite(range)) {
      return range;
    }
    return getNumber(el.getAttribute('data-parallax-distance'), DEFAULT_RANGE);
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const startTops = new WeakMap();
  const lastOffsets = new WeakMap();

  const update = () => {
    if (activeElements.size === 0) {
      rafId = null;
      return;
    }

    activeElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const lastOffset = lastOffsets.get(el) || 0;
      const naturalTop = rect.top + lastOffset;
      const startTop = startTops.get(el);
      const baseline = Number.isFinite(startTop) ? startTop : naturalTop;
      const delta = baseline - naturalTop;
      const range = getRange(el);
      const offset = clamp(delta * getSpeed(el), -range, range);
      lastOffsets.set(el, offset);
      el.style.transform = `translate3d(0, ${-offset}px, 0)`;
    });

    rafId = window.requestAnimationFrame(update);
  };

  const startLoop = () => {
    if (rafId !== null) {
      return;
    }
    rafId = window.requestAnimationFrame(update);
  };

  const stopLoop = () => {
    if (rafId === null) {
      return;
    }
    window.cancelAnimationFrame(rafId);
    rafId = null;
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeElements.add(entry.target);
          startTops.set(entry.target, entry.boundingClientRect.top);
        } else {
          activeElements.delete(entry.target);
          startTops.delete(entry.target);
          lastOffsets.delete(entry.target);
          entry.target.style.transform = 'translate3d(0, 0px, 0)';
        }
      });

      if (activeElements.size > 0) {
        startLoop();
      } else {
        stopLoop();
      }
    },
    {
      root: null,
      rootMargin: '20% 0px',
      threshold: 0,
    }
  );

  const observeElement = (el) => {
    if (observedElements.has(el)) {
      return;
    }
    observedElements.add(el);
    el.style.willChange = 'transform';
    el.style.transform = 'translate3d(0, 0px, 0)';
    lastOffsets.set(el, 0);
    io.observe(el);
  };

  const unobserveElement = (el) => {
    if (!observedElements.has(el)) {
      return;
    }
    observedElements.delete(el);
    activeElements.delete(el);
    startTops.delete(el);
    lastOffsets.delete(el);
    el.style.transform = 'translate3d(0, 0px, 0)';
    io.unobserve(el);
    if (activeElements.size === 0) {
      stopLoop();
    }
  };

  const scanNode = (node) => {
    if (!(node instanceof Element)) {
      return;
    }
    if (node.classList.contains(CLASS_NAME)) {
      observeElement(node);
    }
    node.querySelectorAll(`.${CLASS_NAME}`).forEach(observeElement);
  };

  const unscanNode = (node) => {
    if (!(node instanceof Element)) {
      return;
    }
    if (node.classList.contains(CLASS_NAME)) {
      unobserveElement(node);
    }
    node.querySelectorAll(`.${CLASS_NAME}`).forEach(unobserveElement);
  };

  const init = () => {
    if (prefersReducedMotion.matches) {
      return;
    }
    document.querySelectorAll(`.${CLASS_NAME}`).forEach(observeElement);
  };

  const mo = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(scanNode);
        mutation.removedNodes.forEach(unscanNode);
      }
      if (mutation.type === 'attributes') {
        const target = mutation.target;
        if (!(target instanceof Element)) {
          return;
        }
        if (target.classList.contains(CLASS_NAME)) {
          observeElement(target);
        } else {
          unobserveElement(target);
        }
      }
    });
  });

  const start = () => {
    init();
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
