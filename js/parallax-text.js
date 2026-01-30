(() => {
  const CLASS_NAME = 'parallax-text';
  const DEFAULT_SPEED = 1;
  const DEFAULT_DISTANCE = 1130;
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

  const getDistance = (el) =>
    getNumber(el.getAttribute('data-parallax-distance'), DEFAULT_DISTANCE);

  const update = () => {
    if (activeElements.size === 0) {
      rafId = null;
      return;
    }

    const vh = window.innerHeight || 1;
    activeElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const progress = 1 - rect.top / vh;
      const offset = progress * getDistance(el) * getSpeed(el);
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
        } else {
          activeElements.delete(entry.target);
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
    io.observe(el);
  };

  const unobserveElement = (el) => {
    if (!observedElements.has(el)) {
      return;
    }
    observedElements.delete(el);
    activeElements.delete(el);
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
