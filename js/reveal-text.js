const ROOT_CLASS = 'reveal-text';
const ANIMATE_CLASS = 'animate-fadeInUp';
const HIDDEN_CLASS = 'opacity-0';
const IN_UP_CLASS = 'animate-inUp';
const IN_UP_CHILD_CLASS = 'reveal-text__inup';
const THRESHOLD = 0.05;

const setState = (element, isVisible) => {
  if (isVisible) {
    element.classList.add(ANIMATE_CLASS);
    element.classList.remove(HIDDEN_CLASS);
  } else {
    element.classList.add(HIDDEN_CLASS);
    element.classList.remove(ANIMATE_CLASS);
  }

  element
    .querySelectorAll(`.${IN_UP_CHILD_CLASS}`)
    .forEach((child) => {
      if (isVisible) {
        child.classList.add(IN_UP_CLASS);
      } else {
        child.classList.remove(IN_UP_CLASS);
      }
    });
};

const init = () => {
  const elements = Array.from(document.querySelectorAll(`.${ROOT_CLASS}`));
  if (!elements.length) {
    return;
  }

  elements.forEach((element) => setState(element, false));

  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => setState(element, true));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        setState(entry.target, entry.isIntersecting);
      });
    },
    {
      root: null,
      rootMargin: '0px',
      threshold: THRESHOLD,
    }
  );

  elements.forEach((element) => io.observe(element));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
