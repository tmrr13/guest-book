/**
 * Оптимизированное решение для плавного появления футера при скролле
 * Использует CSS Custom Properties и Intersection Observer для максимальной производительности
 */
class FooterSlideOptimized {
  constructor(footerSelector = '.footer-wrapper') {
    this.footer = document.querySelector(footerSelector);
    this.isActive = false;
    this.lastScrollY = 0;
    this.ticking = false;
    
    if (!this.footer) {
      console.warn('Footer element not found');
      return;
    }
    
    this.init();
  }
  
  init() {
    this.setupCSS();
    this.setupIntersectionObserver();
    this.setupScrollHandler();
  }
  
  setupCSS() {
    // Добавляем CSS переменные для контроля анимации
    this.footer.style.setProperty('--footer-progress', '0');
    
    // Добавляем CSS класс для анимации
    if (!document.querySelector('#footer-slide-styles')) {
      const style = document.createElement('style');
      style.id = 'footer-slide-styles';
      style.textContent = `
        .footer-slide-animated {
          position: relative;
          transform: translateY(calc(100% * (1 - var(--footer-progress))));
          will-change: transform;
          transition: transform 0.1s linear;
        }
        
        .footer-slide-animated.smooth-transition {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Оптимизация для GPU */
        .footer-slide-animated {
          transform: translate3d(0, calc(100% * (1 - var(--footer-progress))), 0);
        }
      `;
      document.head.appendChild(style);
    }
    
    this.footer.classList.add('footer-slide-animated');
  }
  
  setupIntersectionObserver() {
    // Создаем триггер-элемент перед футером
    const trigger = document.createElement('div');
    trigger.style.height = '100vh';
    trigger.style.position = 'absolute';
    trigger.style.top = '-100vh';
    trigger.style.width = '100%';
    trigger.style.pointerEvents = 'none';
    
    this.footer.appendChild(trigger);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.activate();
          } else {
            this.deactivate();
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '0px 0px 0px 0px'
      }
    );
    
    observer.observe(trigger);
  }
  
  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.footer.classList.remove('smooth-transition');
    this.updateProgress();
  }
  
  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.footer.classList.add('smooth-transition');
    this.footer.style.setProperty('--footer-progress', '0');
    
    // Убираем smooth transition через небольшую задержку
    setTimeout(() => {
      this.footer.classList.remove('smooth-transition');
    }, 300);
  }
  
  setupScrollHandler() {
    // Используем passive listener для лучшей производительности
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }
  
  handleScroll() {
    if (!this.isActive) return;
    
    // Оптимизированный throttling
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateProgress();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }
  
  updateProgress() {
    if (!this.isActive) return;
    
    // Кешируем размеры для избежания лишних reflow
    const footerRect = this.footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Вычисляем прогресс появления футера
    const progress = Math.max(0, Math.min(1, 
      (windowHeight - footerRect.top) / windowHeight
    ));
    
    // Применяем easing функцию для более плавной анимации
    const easedProgress = this.easeOutCubic(progress);
    
    // Обновляем CSS переменную
    this.footer.style.setProperty('--footer-progress', easedProgress.toString());
  }
  
  // Easing функция для более естественной анимации
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  
  // Метод для уничтожения экземпляра
  destroy() {
    this.isActive = false;
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    this.footer.classList.remove('footer-slide-animated', 'smooth-transition');
    this.footer.style.removeProperty('--footer-progress');
  }
}

// Альтернативное решение с использованием CSS Scroll-Driven Animations (для современных браузеров)
class FooterSlideModern {
  constructor(footerSelector = '.footer-wrapper') {
    this.footer = document.querySelector(footerSelector);
    
    if (!this.footer) {
      console.warn('Footer element not found');
      return;
    }
    
    // Проверяем поддержку CSS Scroll-Driven Animations
    if (CSS.supports('animation-timeline', 'scroll()')) {
      this.initModern();
    } else {
      console.log('Scroll-driven animations not supported, falling back to JS solution');
      return new FooterSlideOptimized(footerSelector);
    }
  }
  
  initModern() {
    // Добавляем современные CSS стили
    if (!document.querySelector('#footer-slide-modern-styles')) {
      const style = document.createElement('style');
      style.id = 'footer-slide-modern-styles';
      style.textContent = `
        .footer-slide-modern {
          position: relative;
          animation: footer-slide-in linear;
          animation-timeline: scroll(root);
          animation-range: entry 0% entry 100%;
        }
        
        @keyframes footer-slide-in {
          from {
            transform: translate3d(0, 100%, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    this.footer.classList.add('footer-slide-modern');
  }
}

// Экспорт для использования
window.FooterSlideOptimized = FooterSlideOptimized;
window.FooterSlideModern = FooterSlideModern;

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Используем современное решение, если поддерживается, иначе оптимизированное
  if (CSS.supports('animation-timeline', 'scroll()')) {
    new FooterSlideModern();
  } else {
    new FooterSlideOptimized();
  }
});