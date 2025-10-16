export interface FooterSlideOptions {
  footerId: string;
  maxReveal?: number;
  parallaxRatio?: number;
  maxStepPx?: number;
  smoothness?: number;
  throttleMs?: number;
  breakpointFullPx?: number;
  keyDeltaPx?: number;
  focusPaddingPx?: number;
  ignoreMouseFocus?: boolean;
  zIndex?: string;
}

type StyleSnapshot = Pick<
  CSSStyleDeclaration,
  'position' | 'left' | 'right' | 'bottom' | 'transform' | 'willChange' | 'transition' | 'zIndex'
>;

type LastInputType = 'keyboard' | 'mouse' | 'touch';

interface FooterSlideState {
  footer: HTMLElement;
  original: StyleSnapshot;

  maxReveal: number;
  parallaxRatio: number;
  maxStepPx: number;
  smoothness: number;
  throttleMs: number;
  breakpointFullPx: number;
  keyDeltaPx: number;
  focusPaddingPx: number;
  ignoreMouseFocus: boolean;

  currentY: number;
  targetY: number;
  revealedPx: number;
  rafId: number;

  lastTouchY: number | null;
  lastInput: LastInputType;
  
  // Добавляем отслеживание позиции скролла
  lastScrollY: number;
  isScrollbarDragging: boolean;

  resizeObserver: ResizeObserver | null;

  onScroll: (() => void) | null;
  onResize: (() => void) | null;
  onWheel: ((e: WheelEvent) => void) | null;
  onTouchStart: ((e: TouchEvent) => void) | null;
  onTouchMove: ((e: TouchEvent) => void) | null;
  onKeyDown: ((e: KeyboardEvent) => void) | null;
  onFocusIn: ((e: FocusEvent) => void) | null;
  onFocusOut: ((e: FocusEvent) => void) | null;
  onPointerDown: ((e: PointerEvent) => void) | null;
  onMouseDown: ((e: MouseEvent) => void) | null;
  onMouseUp: ((e: MouseEvent) => void) | null;
}

interface DestroyOptions {
  footerId?: string;
}

export interface FooterController {
  _footerSlide: FooterSlideState | null;

  initFooterSlide(this: FooterController, options?: Partial<FooterSlideOptions>): void;
  destroyFooterSlide(this: FooterController, options?: DestroyOptions): void;
  accordion(this: FooterController): void;
  init(this: FooterController): void;
}

export default function createFooterController(): FooterController {
  return {
    _footerSlide: null,

    initFooterSlide(this: FooterController, options: Partial<FooterSlideOptions> = {}) {
      const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
      const clamp = (v: number, minV: number, maxV: number): number => Math.max(minV, Math.min(maxV, v));
      const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

      const {
        footerId,
        maxReveal = 1,
        parallaxRatio = 0.25,
        maxStepPx = 32,
        smoothness = 0.18,
        throttleMs = 40,
        breakpointFullPx = 1240,
        keyDeltaPx = 80,
        focusPaddingPx = 16,
        ignoreMouseFocus = true,
        zIndex = '9999'
      } = options;

      const isAemPreviewEnv = (): boolean => {
        try {
          const params = new URLSearchParams(window.location.search);
          const wcmmode = params.get('wcmmode');
          if (wcmmode && wcmmode !== 'disabled') return true;
          if (window.self !== window.top) return true;
        } catch {
          // ignore
        }
        return false;
      };
      if (isAemPreviewEnv()) return;

      if (!footerId) return;
      const child = document.getElementById(footerId);
      if (!child) return;

      let footerEl: HTMLElement | null = child.closest('.footer-wrapper > div') as HTMLElement | null;
      if (!footerEl) {
        const wrapper = child.closest('.footer-wrapper') as HTMLElement | null;
        if (wrapper) {
          footerEl = wrapper.querySelector(':scope > div') as HTMLElement | null;
        }
      }
      if (!footerEl) return;

      if (this._footerSlide && this._footerSlide.footer === footerEl) {
        const s = this._footerSlide;
        s.maxReveal = clamp01(maxReveal);
        s.parallaxRatio = parallaxRatio;
        s.maxStepPx = maxStepPx;
        s.smoothness = smoothness;
        s.throttleMs = throttleMs;
        s.breakpointFullPx = breakpointFullPx;
        s.keyDeltaPx = keyDeltaPx;
        s.focusPaddingPx = focusPaddingPx;
        s.ignoreMouseFocus = !!ignoreMouseFocus;
        return;
      }

      let footerHeight = Math.max(1, footerEl.offsetHeight);

      const original: StyleSnapshot = {
        position: footerEl.style.position,
        left: footerEl.style.left,
        right: footerEl.style.right,
        bottom: footerEl.style.bottom,
        transform: footerEl.style.transform,
        willChange: footerEl.style.willChange,
        transition: footerEl.style.transition,
        zIndex: footerEl.style.zIndex
      };

      Object.assign(footerEl.style, {
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: '0',
        transform: `translate3d(0, ${footerHeight}px, 0)`,
        willChange: 'transform',
        transition: 'none',
        zIndex: original.zIndex || zIndex
      } as Partial<CSSStyleDeclaration>);

      const state: FooterSlideState = (this._footerSlide = {
        footer: footerEl,
        original,
        maxReveal: clamp01(maxReveal),
        parallaxRatio,
        maxStepPx,
        smoothness,
        throttleMs,
        breakpointFullPx,
        keyDeltaPx,
        focusPaddingPx,
        ignoreMouseFocus: !!ignoreMouseFocus,

        currentY: footerHeight,
        targetY: footerHeight,
        revealedPx: 0,
        rafId: 0,

        lastTouchY: null,
        lastInput: 'mouse',
        
        // Инициализируем новые свойства
        lastScrollY: window.scrollY,
        isScrollbarDragging: false,

        resizeObserver: null,

        onScroll: null,
        onResize: null,
        onWheel: null,
        onTouchStart: null,
        onTouchMove: null,
        onKeyDown: null,
        onFocusIn: null,
        onFocusOut: null,
        onPointerDown: null,
        onMouseDown: null,
        onMouseUp: null
      });

      const isAtBottom = (): boolean => {
        const doc = document.documentElement;
        return Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight;
      };

      const scrollToBottomAndThen = (cb: () => void): void => {
        const doc = document.documentElement;
        const targetTop = Math.max(0, doc.scrollHeight - window.innerHeight);
        if (Math.ceil(window.scrollY) >= targetTop - 1) {
          cb();
          return;
        }
        window.scrollTo({ top: targetTop, behavior: 'auto' });
        requestAnimationFrame(() => requestAnimationFrame(cb));
      };

      const getEffectiveMaxRevealPx = (): number => {
        const isMobile = window.innerWidth < state.breakpointFullPx;
        const effectiveMaxReveal = isMobile ? 1 : state.maxReveal;
        return footerHeight * effectiveMaxReveal;
      };

      const requestTick = (): void => {
        if (!state.rafId) state.rafId = requestAnimationFrame(tick);
      };

      const tick = (): void => {
        state.rafId = 0;
        state.currentY = lerp(state.currentY, state.targetY, state.smoothness);
        if (Math.abs(state.currentY - state.targetY) < 0.4) {
          state.currentY = state.targetY;
        }
        state.footer.style.transform = `translate3d(0, ${state.currentY}px, 0)`;
        if (Math.abs(state.currentY - state.targetY) >= 0.4) requestTick();
      };

      const setReveal = (valPx: number): void => {
        const cap = getEffectiveMaxRevealPx();
        state.revealedPx = clamp(valPx, 0, cap);
        state.targetY = Math.round(footerHeight - state.revealedPx);
        requestTick();
      };

      const handleRevealDelta = (rawDeltaY: number): boolean => {
        if (!isAtBottom()) return false;

        const cap = getEffectiveMaxRevealPx();
        const goingDown = rawDeltaY > 0;
        const goingUp = rawDeltaY < 0;

        if (goingDown && state.revealedPx >= cap - 0.1) return true;
        if (goingUp && state.revealedPx <= 0.1) return false;

        const step = Math.min(Math.abs(rawDeltaY) * state.parallaxRatio, state.maxStepPx);
        if (goingDown) {
          setReveal(state.revealedPx + step);
          return true;
        } else if (goingUp) {
          setReveal(state.revealedPx - step);
          return state.revealedPx > 0.1;
        }
        return false;
      };

      const measureAndClamp = (): void => {
        const newH = state.footer.offsetHeight || footerHeight;
        if (newH !== footerHeight) {
          footerHeight = newH;
          state.currentY = Math.min(state.currentY, footerHeight);
          state.targetY = Math.min(state.targetY, footerHeight);
          setReveal(state.revealedPx);
        }
      };

      if (typeof window !== 'undefined' && typeof (window as any).ResizeObserver !== 'undefined') {
        try {
          const ro = new ResizeObserver(() => {
            const newH = state.footer.offsetHeight || footerHeight;
            if (newH === undefined || newH === null) return;
            if (newH !== footerHeight) {
              const diff = newH - footerHeight;
              footerHeight = newH;

              state.currentY = state.currentY + diff;
              state.targetY = state.targetY + diff;

              state.currentY = Math.max(0, Math.min(footerHeight, state.currentY));
              state.targetY = Math.max(0, Math.min(footerHeight, state.targetY));

              state.footer.style.transform = `translate3d(0, ${state.currentY}px, 0)`;
              requestTick();
            }
          });
          ro.observe(state.footer);
          state.resizeObserver = ro;
        } catch {
          state.resizeObserver = null;
        }
      }

      function throttle<TArgs extends any[]>(
        fn: (...args: TArgs) => void,
        wait: number
      ): (...args: TArgs) => void {
        let waiting = false;
        let pending = false;
        return (...args: TArgs) => {
          if (waiting) {
            pending = true;
            return;
          }
          fn(...args);
          waiting = true;
          window.setTimeout(() => {
            waiting = false;
            if (pending) {
              pending = false;
              fn(...args);
            }
          }, wait);
        };
      }

      // Модифицированный обработчик скролла
      const onScroll = throttle(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - state.lastScrollY;
        
        if (!isAtBottom()) {
          if (state.revealedPx > 0) {
            setReveal(0);
          } else {
            state.targetY = footerHeight;
            requestTick();
          }
        } else {
          // Если мы в конце страницы и есть перетаскивание скроллбара
          if (state.isScrollbarDragging && Math.abs(scrollDelta) > 0) {
            // Обрабатываем изменение скролла как если бы это было колесо мыши
            handleRevealDelta(scrollDelta);
          }
        }
        
        state.lastScrollY = currentScrollY;
      }, state.throttleMs);

      const onWheel = (e: WheelEvent) => {
        if (handleRevealDelta(e.deltaY)) {
          e.preventDefault();
        }
      };

      const onTouchStart = (e: TouchEvent) => {
        state.lastInput = 'touch';
        state.lastTouchY = e.touches && e.touches.length ? e.touches[0].clientY : null;
      };

      const onTouchMove = (e: TouchEvent) => {
        if (state.lastTouchY == null) return;
        const currentY = e.touches && e.touches.length ? e.touches[0].clientY : state.lastTouchY;
        const deltaY = state.lastTouchY - currentY;
        state.lastTouchY = currentY;
        if (handleRevealDelta(deltaY)) {
          e.preventDefault();
        }
      };

      // Обработчики для отслеживания перетаскивания скроллбара
      const onMouseDown = (e: MouseEvent) => {
        // Проверяем, если клик был по скроллбару
        const target = e.target as HTMLElement;
        if (target === document.documentElement || target === document.body) {
          const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
          if (scrollbarWidth > 0 && e.clientX >= window.innerWidth - scrollbarWidth) {
            state.isScrollbarDragging = true;
            state.lastInput = 'mouse';
          }
        }
      };

      const onMouseUp = () => {
        state.isScrollbarDragging = false;
      };

      const isTextInput = (el: Element | null): boolean => {
        if (!el) return false;
        const tag = (el as HTMLElement).tagName;
        const editable = (el as HTMLElement).getAttribute && (el as HTMLElement).getAttribute('contenteditable');
        return (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          editable === '' ||
          editable === 'true'
        );
      };

      const onKeyDown = (e: KeyboardEvent) => {
        state.lastInput = 'keyboard';
        if (e.defaultPrevented) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (isTextInput(e.target as Element | null)) return;

        let deltaRaw = 0;
        const vh = window.innerHeight;

        switch (e.key) {
          case 'ArrowDown':
            deltaRaw = +state.keyDeltaPx;
            break;
          case 'ArrowUp':
            deltaRaw = -state.keyDeltaPx;
            break;
          case 'PageDown':
            deltaRaw = +vh;
            break;
          case 'PageUp':
            deltaRaw = -vh;
            break;
          case ' ':
          case 'Spacebar':
            deltaRaw = e.shiftKey ? -vh * 0.8 : +vh * 0.8;
            break;
          default:
            return;
        }

        if (handleRevealDelta(deltaRaw)) {
          e.preventDefault();
        }
      };

      const onPointerDown = (e: PointerEvent) => {
        if (e && e.pointerType) {
          state.lastInput = e.pointerType === 'mouse' ? 'mouse' : 'touch';
        } else {
          state.lastInput = 'mouse';
        }
      };

      const onFocusIn = (e: FocusEvent) => {
        const el = e.target as Element | null;
        if (!el || !state.footer.contains(el)) return;
        if (state.ignoreMouseFocus && state.lastInput !== 'keyboard') return;

        const revealForElement = () => {
          measureAndClamp();

          const footerRect = state.footer.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();

          const elTopInFooter = elRect.top - footerRect.top;
          const requiredReveal = elTopInFooter + elRect.height + state.focusPaddingPx;

          const cap = getEffectiveMaxRevealPx();
          const revealPx = Math.min(Math.max(requiredReveal, 0), cap);

          setReveal(revealPx);
        };

        if (!isAtBottom()) {
          scrollToBottomAndThen(revealForElement);
        } else {
          revealForElement();
        }
      };

      const onFocusOut = (e: FocusEvent) => {
        const next = (e.relatedTarget as Element | null) || (document.activeElement as Element | null);
        if (next && state.footer.contains(next)) return;

        if (state.lastInput !== 'keyboard') return;

        setReveal(0);
      };

      const onResize = throttle(() => {
        measureAndClamp();
        requestTick();
      }, 120);

      // Добавляем слушатели событий
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('keydown', onKeyDown, { passive: false });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('mousedown', onMouseDown, { passive: true });
      window.addEventListener('mouseup', onMouseUp, { passive: true });
      document.addEventListener('focusin', onFocusIn, { passive: true });
      document.addEventListener('focusout', onFocusOut, { passive: true });

      state.onScroll = onScroll;
      state.onResize = onResize;
      state.onWheel = onWheel;
      state.onTouchStart = onTouchStart;
      state.onTouchMove = onTouchMove;
      state.onKeyDown = onKeyDown;
      state.onPointerDown = onPointerDown;
      state.onFocusIn = onFocusIn;
      state.onFocusOut = onFocusOut;
      state.onMouseDown = onMouseDown;
      state.onMouseUp = onMouseUp;

      requestTick();
    },

    destroyFooterSlide(this: FooterController, options: DestroyOptions = {}) {
      const { footerId } = options;
      if (!footerId) return;

      const st = this._footerSlide;
      const footerEl =
        ((document.getElementById(footerId)?.closest('.footer-wrapper > div') as HTMLElement | null) ||
          null);

      if (!st || !st.footer || st.footer !== footerEl) return;

      // Удаляем все слушатели событий
      window.removeEventListener('scroll', st.onScroll as EventListener);
      window.removeEventListener('resize', st.onResize as EventListener);
      window.removeEventListener('wheel', st.onWheel as EventListener);
      window.removeEventListener('touchstart', st.onTouchStart as EventListener);
      window.removeEventListener('touchmove', st.onTouchMove as EventListener);
      window.removeEventListener('keydown', st.onKeyDown as EventListener);
      window.removeEventListener('pointerdown', st.onPointerDown as EventListener);
      window.removeEventListener('mousedown', st.onMouseDown as EventListener);
      window.removeEventListener('mouseup', st.onMouseUp as EventListener);
      document.removeEventListener('focusin', st.onFocusIn as EventListener);
      document.removeEventListener('focusout', st.onFocusOut as EventListener);
      if (st.rafId) cancelAnimationFrame(st.rafId);

      if (st.resizeObserver) {
        try {
          st.resizeObserver.disconnect();
        } catch {
          // ignore
        }
        st.resizeObserver = null;
      }

      const f = st.footer;
      f.style.position = st.original.position;
      f.style.left = st.original.left;
      f.style.right = st.original.right;
      f.style.bottom = st.original.bottom;
      f.style.transform = st.original.transform;
      f.style.willChange = st.original.willChange;
      f.style.transition = st.original.transition;
      f.style.zIndex = st.original.zIndex;

      this._footerSlide = null;
    },

    accordion(this: FooterController) {
      const accordions = document.querySelectorAll<HTMLElement>('.footer-accordion');

      accordions.forEach((accordion) => {
        const header = accordion.querySelector<HTMLElement>('.accordion-header');
        if (!header) return;

        header.addEventListener('click', () => {
          accordions.forEach((acc) => {
            if (acc !== accordion) {
              acc.classList.remove('open');
              const otherContent = acc.querySelector<HTMLElement>('.footer-accordion-content');
              if (otherContent) otherContent.style.maxHeight = '';
            }
          });

          accordion.classList.toggle('open');

          const content = accordion.querySelector<HTMLElement>('.footer-accordion-content');
          if (!content) return;

          if (accordion.classList.contains('open')) {
            content.style.maxHeight = `${content.scrollHeight}px`;

            requestAnimationFrame(() => {
              const rect = content.getBoundingClientRect();
              if (rect.bottom > window.innerHeight) {
                content.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest'
                });
              }
            });
          } else {
            content.style.maxHeight = '';
          }
        });
      });
    },

    init(this: FooterController) {
      this.initFooterSlide({
        footerId: 'new-footer',
        maxReveal: 1,
        parallaxRatio: 0.25,
        maxStepPx: 32,
        smoothness: 0.18,
        throttleMs: 40,
        breakpointFullPx: 1240,
        keyDeltaPx: 80,
        focusPaddingPx: 16,
        ignoreMouseFocus: true,
        zIndex: '9999'
      });
      this.accordion();
    }
  };
}
