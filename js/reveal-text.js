const CLASS_NAME = 'reveal-text';
const ENABLED_CLASS = 'reveal-text-enabled';
const VISIBLE_CLASS = 'reveal-text--visible';

const init = () => {
  const elements = Array.from(document.querySelectorAll(`.${CLASS_NAME}`));
  if (!elements.length) {
    return;
  }

  document.documentElement.classList.add(ENABLED_CLASS);

  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add(VISIBLE_CLASS));
    return;
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(VISIBLE_CLASS);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1,
    }
  );

  elements.forEach((element) => io.observe(element));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
