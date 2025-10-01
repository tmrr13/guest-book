/**
 * Упрощенная и оптимизированная версия для плавного появления футера
 * Готова к использованию - просто замените ваш код на этот
 */
function initFooterSlide() {
  const footer = document.querySelector(".footer-wrapper");
  
  if (!footer) {
    console.warn('Footer element not found');
    return;
  }

  // Добавляем оптимизированные стили
  const style = document.createElement('style');
  style.textContent = `
    .footer-slide-optimized {
      position: relative;
      transform: translate3d(0, var(--slide-offset, 100%), 0);
      will-change: transform;
      transition: transform 0.1s linear;
    }
    
    .footer-slide-optimized.smooth {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;
  
  if (!document.querySelector('#footer-slide-styles')) {
    style.id = 'footer-slide-styles';
    document.head.appendChild(style);
  }

  footer.classList.add('footer-slide-optimized');
  footer.style.setProperty('--slide-offset', '100%');

  let isActive = false;
  let ticking = false;

  // Создаем триггер для Intersection Observer
  const trigger = document.createElement('div');
  trigger.style.cssText = `
    height: 50vh;
    position: absolute;
    top: -50vh;
    width: 100%;
    pointer-events: none;
  `;
  footer.appendChild(trigger);

  // Оптимизированный Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        isActive = true;
        footer.classList.remove('smooth');
        updateFooterPosition();
      } else {
        isActive = false;
        footer.classList.add('smooth');
        footer.style.setProperty('--slide-offset', '100%');
        
        // Убираем smooth класс после анимации
        setTimeout(() => footer.classList.remove('smooth'), 300);
      }
    });
  }, { 
    threshold: 0,
    rootMargin: '0px'
  });

  observer.observe(trigger);

  // Оптимизированный scroll handler
  function handleScroll() {
    if (!isActive || ticking) return;
    
    ticking = true;
    requestAnimationFrame(() => {
      updateFooterPosition();
      ticking = false;
    });
  }

  function updateFooterPosition() {
    if (!isActive) return;
    
    const rect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Вычисляем прогресс (0-1)
    const progress = Math.max(0, Math.min(1, 
      (windowHeight - rect.top) / windowHeight
    ));
    
    // Применяем easing для плавности
    const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    
    // Обновляем позицию через CSS переменную
    const offset = (1 - easedProgress) * 100;
    footer.style.setProperty('--slide-offset', `${offset}%`);
  }

  // Используем passive listener для лучшей производительности
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Возвращаем функцию для очистки (опционально)
  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', handleScroll);
    footer.classList.remove('footer-slide-optimized', 'smooth');
    footer.style.removeProperty('--slide-offset');
    if (trigger.parentNode) {
      trigger.parentNode.removeChild(trigger);
    }
  };
}