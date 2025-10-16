// TypeScript interfaces for the footer component
interface FooterSlideOptions {
  footerId?: string;
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

interface OriginalStyles {
  position: string;
  left: string;
  right: string;
  bottom: string;
  transform: string;
  willChange: string;
  transition: string;
  zIndex: string;
}

interface FooterSlideState {
  footer: HTMLElement;
  original: OriginalStyles;
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
  lastInput: 'keyboard' | 'mouse' | 'touch';
  
  resizeObserver: ResizeObserver | null;
  
  onScroll: ((event: Event) => void) | null;
  onResize: ((event: Event) => void) | null;
  onWheel: ((event: WheelEvent) => void) | null;
  onTouchStart: ((event: TouchEvent) => void) | null;
  onTouchMove: ((event: TouchEvent) => void) | null;
  onKeyDown: ((event: KeyboardEvent) => void) | null;
  onFocusIn: ((event: FocusEvent) => void) | null;
  onFocusOut: ((event: FocusEvent) => void) | null;
  onPointerDown: ((event: PointerEvent) => void) | null;
}

interface FooterComponent {
  _footerSlide: FooterSlideState | null;
  initFooterSlide(options?: FooterSlideOptions): void;
  destroyFooterSlide(options?: FooterSlideOptions): void;
  accordion(): void;
  init(): void;
}

export default (): FooterComponent => ({
  _footerSlide: null, // Poc new footer

  initFooterSlide(options: FooterSlideOptions = {}): void {
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
      } catch (e) {}
      return false;
    };
    if (isAemPreviewEnv()) return;

    if (!footerId) return;
    const child = document.getElementById(footerId);
    if (!child) return;

    let footer = child.closest('.footer-wrapper > div') as HTMLElement | null;
    if (!footer) {
      const wrapper = child.closest('.footer-wrapper');
      if (wrapper) {
        footer = wrapper.querySelector(':scope > div') as HTMLElement | null;
      }
    }
    if (!footer) return;

    if (this._footerSlide && this._footerSlide.footer === footer) {
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

    let footerHeight: number = Math.max(1, footer.offsetHeight);

    const original: OriginalStyles = {
      position: footer.style.position,
      left: footer.style.left,
      right: footer.style.right,
      bottom: footer.style.bottom,
      transform: footer.style.transform,
      willChange: footer.style.willChange,
      transition: footer.style.transition,
      zIndex: footer.style.zIndex
    };

    Object.assign(footer.style, {
      position: 'fixed',
      left: '0',
      right: '0',
      bottom: '0',
      transform: `translate3d(0, ${footerHeight}px, 0)`,
      willChange: 'transform',
      transition: 'none',
      zIndex: original.zIndex || zIndex
    });

    const state: FooterSlideState = this._footerSlide = {
      footer,
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
      lastInput: 'mouse', // 'keyboard' | 'mouse' | 'touch'

      resizeObserver: null,

      onScroll: null,
      onResize: null,
      onWheel: null,
      onTouchStart: null,
      onTouchMove: null,
      onKeyDown: null,
      onFocusIn: null,
      onFocusOut: null,
      onPointerDown: null
    };

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
      footer.style.transform = `translate3d(0, ${state.currentY}px, 0)`;
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
      const newH = footer.offsetHeight || footerHeight;
      if (newH !== footerHeight) {
        footerHeight = newH;
        state.currentY = Math.min(state.currentY, footerHeight);
        state.targetY = Math.min(state.targetY, footerHeight);
        setReveal(state.revealedPx);
      }
    };

    if (typeof window !== 'undefined' && typeof window.ResizeObserver !== 'undefined') {
      try {
        const ro = new ResizeObserver(() => {
          const newH = footer.offsetHeight || footerHeight;
          if (newH === undefined || newH === null) return;
          if (newH !== footerHeight) {
            const diff = newH - footerHeight;
            footerHeight = newH;

            state.currentY = state.currentY + diff;
            state.targetY = state.targetY + diff;

            state.currentY = Math.max(0, Math.min(footerHeight, state.currentY));
            state.targetY = Math.max(0, Math.min(footerHeight, state.targetY));

            footer.style.transform = `translate3d(0, ${state.currentY}px, 0)`;
            requestTick();
          }
        });
        ro.observe(footer);
        state.resizeObserver = ro;
      } catch (e) {
        state.resizeObserver = null;
      }
    }

    const throttle = <T extends (...args: any[]) => void>(fn: T, wait: number): T => {
      let waiting = false, pending = false;
      return ((...args: Parameters<T>) => {
        if (waiting) { pending = true; return; }
        fn(...args);
        waiting = true;
        setTimeout(() => {
          waiting = false;
          if (pending) { pending = false; fn(...args); }
        }, wait);
      }) as T;
    };

    const onScroll = throttle(() => {
      if (!isAtBottom()) {
        if (state.revealedPx > 0) {
          setReveal(0);
        } else {
          state.targetY = footerHeight;
          requestTick();
        }
      }
    }, state.throttleMs);

    const onWheel = (e: WheelEvent): void => {
      if (handleRevealDelta(e.deltaY)) {
        e.preventDefault();
      }
    };

    const onTouchStart = (e: TouchEvent): void => {
      state.lastInput = 'touch';
      state.lastTouchY = e.touches && e.touches.length ? e.touches[0].clientY : null;
    };

    const onTouchMove = (e: TouchEvent): void => {
      if (state.lastTouchY == null) return;
      const currentY = e.touches && e.touches.length ? e.touches[0].clientY : state.lastTouchY;
      const deltaY = state.lastTouchY - currentY;
      state.lastTouchY = currentY;
      if (handleRevealDelta(deltaY)) {
        e.preventDefault();
      }
    };

    const isTextInput = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName;
      const editable = el.getAttribute && el.getAttribute('contenteditable');
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable === '' || editable === 'true';
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      state.lastInput = 'keyboard';
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTextInput(e.target as Element)) return;

      let deltaRaw = 0;
      const vh = window.innerHeight;

      switch (e.key) {
        case 'ArrowDown': deltaRaw = +state.keyDeltaPx; break;
        case 'ArrowUp': deltaRaw = -state.keyDeltaPx; break;
        case 'PageDown': deltaRaw = +vh; break;
        case 'PageUp': deltaRaw = -vh; break;
        case ' ':
        case 'Spacebar':
          deltaRaw = e.shiftKey ? -vh * 0.8 : +vh * 0.8;
          break;
        default: return;
      }

      if (handleRevealDelta(deltaRaw)) {
        e.preventDefault();
      }
    };

    const onPointerDown = (e: PointerEvent): void => {
      if (e && e.pointerType) {
        state.lastInput = e.pointerType === 'mouse' ? 'mouse' : 'touch';
      } else {
        state.lastInput = 'mouse';
      }
    };

    const onFocusIn = (e: FocusEvent): void => {
      const el = e.target as HTMLElement;
      if (!el || !footer.contains(el)) return;
      if (state.ignoreMouseFocus && state.lastInput !== 'keyboard') return;

      const revealForElement = (): void => {
        measureAndClamp();

        const footerRect = footer.getBoundingClientRect();
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

    const onFocusOut = (e: FocusEvent): void => {
      const next = e.relatedTarget || document.activeElement;
      if (next && footer.contains(next as Node)) return;

      if (state.lastInput !== 'keyboard') return;

      setReveal(0);
    };

    const onResize = throttle(() => {
      measureAndClamp();
      requestTick();
    }, 120);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
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

    requestTick();
  },

  destroyFooterSlide(options: FooterSlideOptions = {}): void {
    const { footerId } = options;

    if (!footerId) return;

    const st = this._footerSlide;
    const footer = document.getElementById(footerId)
      ?.closest('.footer-wrapper > div') as HTMLElement | null;

    if (!st || !st.footer || st.footer !== footer) return;

    if (st.onScroll) window.removeEventListener('scroll', st.onScroll);
    if (st.onResize) window.removeEventListener('resize', st.onResize);
    if (st.onWheel) window.removeEventListener('wheel', st.onWheel);
    if (st.onTouchStart) window.removeEventListener('touchstart', st.onTouchStart);
    if (st.onTouchMove) window.removeEventListener('touchmove', st.onTouchMove);
    if (st.onKeyDown) window.removeEventListener('keydown', st.onKeyDown);
    if (st.onPointerDown) window.removeEventListener('pointerdown', st.onPointerDown);
    if (st.onFocusIn) document.removeEventListener('focusin', st.onFocusIn);
    if (st.onFocusOut) document.removeEventListener('focusout', st.onFocusOut);
    if (st.rafId) cancelAnimationFrame(st.rafId);

    if (st.resizeObserver) {
      try { st.resizeObserver.disconnect(); } catch (e) {}
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

  accordion(): void {
    const accordions = document.querySelectorAll(".footer-accordion") as NodeListOf<HTMLElement>;

    accordions.forEach((accordion) => {
      const header = accordion.querySelector(".accordion-header") as HTMLElement;

      header.addEventListener("click", () => {
        accordions.forEach((acc) => {
          if (acc !== accordion) {
            acc.classList.remove("open");
            const content = acc.querySelector(".footer-accordion-content") as HTMLElement;
            if (content) {
              content.style.maxHeight = '';
            }
          }
        });

        accordion.classList.toggle("open");

        const content = accordion.querySelector(".footer-accordion-content") as HTMLElement;
        if (content) {
          if (accordion.classList.contains("open")) {
            content.style.maxHeight = content.scrollHeight + "px";

            requestAnimationFrame(() => {
              const rect = content.getBoundingClientRect();
              if (rect.bottom > window.innerHeight) {
                content.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest"
                });
              }
            });
          } else {
            content.style.maxHeight = '';
          }
        }
      });
    });
  },

  init(): void {
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
  // end
});