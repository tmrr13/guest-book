const CLASS_NAME = 'parallax-text';
const DEFAULT_SPEED = 1;
const DEFAULT_RANGE = 100;
const DEFAULT_DIRECTION = 'up';

let rafId = null;
const activeElements = new Set();
const lastOffsets = new WeakMap();

const getNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getSpeed = (element) =>
  getNumber(element.getAttribute('data-parallax-speed'), DEFAULT_SPEED);

const getRange = (element) =>
  getNumber(element.getAttribute('data-parallax-range'), DEFAULT_RANGE);

const getDirection = (element) => {
  const dir = (
    element.getAttribute('data-parallax-direction') || DEFAULT_DIRECTION
  ).toLowerCase();
  return dir === 'down' ? 1 : -1;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const update = () => {
  if (!activeElements.size) {
    rafId = null;
    return;
  }

  const vh = window.innerHeight || 1;

  activeElements.forEach((element) => {
    const rect = element.getBoundingClientRect();

    // Subtract previous transform to get natural position.
    const lastOffset = lastOffsets.get(element) || 0;
    const naturalTop = rect.top - lastOffset;

    const elementHeight = rect.height || 1;
    const progress = clamp(
      (vh - naturalTop) / (vh + elementHeight),
      0,
      1
    );

    const range = getRange(element);
    const direction = getDirection(element);
    const speed = getSpeed(element);

    const rawOffset = (progress - 0.5) * 2 * range * direction * speed;
    const offset = clamp(rawOffset, -range, range);

    lastOffsets.set(element, offset);
    element.style.transform = `translate3d(0, ${offset}px, 0)`;
  });

  rafId = requestAnimationFrame(update);
};

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const element = entry.target;

      if (entry.isIntersecting) {
        activeElements.add(element);
      } else {
        activeElements.delete(element);
      }
    });

    if (activeElements.size && !rafId) {
      rafId = requestAnimationFrame(update);
    }
  },
  {
    root: null,
    rootMargin: '20% 0px',
    threshold: 0,
  }
);

const init = () => {
  document.querySelectorAll(`.${CLASS_NAME}`).forEach((element) => {
    element.style.willChange = 'transform';
    element.style.transform = 'translate3d(0,0,0)';
    lastOffsets.set(element, 0);
    io.observe(element);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
