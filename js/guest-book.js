
let calendar = document.getElementById('calendar'),
    nowDate = document.getElementById('now-date'),
    month = document.getElementById('month');

let now = new Date(),
    nowMonth = now.getMonth() + 1,
    nowYear = now.getFullYear();
let daysWeek = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

function daysInMonth (month, year) {
  return new Date(year, month, 0).getDate();
}

let quantityDays = daysInMonth(nowMonth,nowYear);

function outputDays() {
  let day = "";
  for(let i = 1; i <= quantityDays; i++) {
    day += "<span class='day'>" + i + "</span>";
  }
  return day;
}

// function outputDaysWeek() {
//   return daysWeek.join(' ');
// }

let days = outputDays();

if (calendar) {
  calendar.innerHTML = days;
}



// console.log(daysWeek[new Date().getDay()]);



















/*
function getWeekDay(date, month) {
  return new Date(date, month, 0).getDate();
}
let quantityDaysWeek = daysInMonth(nowMonth,daysWeek);

*/
// getWeekDay(date)















// const myForm = document.getElementById("myForm");
//
// let paginationBox = document.getElementById("pagination");
// let fieldTextUser = document.getElementById("text-user");
// let contentPage = document.getElementById("content-page");
//
// let userName = "egor";
//
// let message = JSON.parse(localStorage.getItem("messages") || "[]");
// let pageSize = 10;
//
// function messageOutput(e) {
//   e.preventDefault();
//   message.push({
//     name: userName,
//     text: fieldTextUser.value
//   });
//
//   render();
//   localStorage.setItem('messages', JSON.stringify(message));
// }
//
// let pageNumber;
//
// function render(p) {
//
//   pageNumber = p || Math.ceil(message.length / pageSize);
//   contentPage.innerHTML = "";
//   let total = message.length > pageSize * pageNumber ? pageSize * pageNumber : message.length;
//   for (var i = pageSize * (pageNumber - 1); i < total; i++) {
//     let user = message[i];
//     let userName = "<span class='user-name'>" + user.name + "</span>";
//     let userText = "<span class='user-text'>" + user.text + "</span>";
//     let row = "<div class='row'>" + userName + userText + "</div>";
//     contentPage.innerHTML += row;
//   }
//   pagination()
// }
//
// function pagination() {
//   let page = "";
//   let totalPage = Math.ceil(message.length / pageSize);
//
//   if (totalPage > 1) {
//     if (pageNumber > 1) {
//       page += "<a href='javascript:void(0)' onclick='render(" + (pageNumber - 1) + ")'\>prev</a>";
//     }
//     for (let i = 0; i < totalPage; i++) {
//       page += "<a href='javascript:void(0)' onclick='render(" + (i + 1) + ")'\>" + (i + 1) + "</a>";
//     }
//     if (pageNumber < totalPage) {
//       page += "<a href='javascript:void(0)' onclick='render(" + (pageNumber + 1) + ")'\> next </a>";
//     }
//     paginationBox.innerHTML = page;
//   }
// }
//
// // function moveToPage() {
// //   pageNumber ++;
// //   render(pageNumber);
// // })
// //
// // btnNext.addEventListener('click', moveToPage() {
// //
// // })
// //
// // btnBack.addEventListener('click', function() {
// //   pageNumber --;
// //   render(pageNumber)
// // });
//
// myForm.onsubmit = messageOutput;
// render();
//
// // pagination();

// Footer slide controller with continuous reveal on scrollbar drag
(function () {
  function createFooterController() {
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    let _state = null;

    function initFooterSlide(options) {
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
      } = options || {};

      if (!footerId) return;
      const child = document.getElementById(footerId);
      if (!child) return;

      let footerEl = child.closest('.footer-wrapper > div');
      if (!footerEl) {
        const wrapper = child.closest('.footer-wrapper');
        if (wrapper) footerEl = wrapper.querySelector(':scope > div');
      }
      if (!footerEl) return;

      // if already same footer, update tunables
      if (_state && _state.footer === footerEl) {
        _state.maxReveal = clamp01(maxReveal);
        _state.parallaxRatio = parallaxRatio;
        _state.maxStepPx = maxStepPx;
        _state.smoothness = smoothness;
        _state.throttleMs = throttleMs;
        _state.breakpointFullPx = breakpointFullPx;
        _state.keyDeltaPx = keyDeltaPx;
        _state.focusPaddingPx = focusPaddingPx;
        _state.ignoreMouseFocus = !!ignoreMouseFocus;
        syncSpacerHeight();
        return;
      }

      let footerHeight = Math.max(1, footerEl.offsetHeight);

      const original = {
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
      });

      const scrollEl = document.scrollingElement || document.documentElement;
      const getScrollTop = () => Math.max(0, scrollEl.scrollTop);
      const setScrollTop = (v) => {
        scrollEl.scrollTop = Math.max(0, v);
      };
      const getScrollHeight = () => scrollEl.scrollHeight;
      const getClientHeight = () => scrollEl.clientHeight;

      // spacer at document end
      const spacer = document.createElement('div');
      spacer.setAttribute('data-footer-reveal-spacer', 'true');
      spacer.style.cssText = 'height:0;width:1px;pointer-events:none;opacity:0;overflow:hidden;';
      (document.body || document.documentElement).appendChild(spacer);

      _state = {
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
        spacer,
        lastScrollTop: getScrollTop(),
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

      const isMobileViewport = () => window.innerWidth < _state.breakpointFullPx;
      const getEffectiveMaxRevealPx = () => footerHeight * (isMobileViewport() ? 1 : _state.maxReveal);
      const getSpacerHeight = () => _state.spacer?.offsetHeight || 0;
      const getBaseScrollHeight = () => Math.max(getScrollHeight() - getSpacerHeight(), 0);
      const getBaseMaxScrollTop = () => Math.max(0, getBaseScrollHeight() - getClientHeight());
      const getExtraScroll = () => Math.max(0, getScrollTop() - getBaseMaxScrollTop());
      const isAtBottomBase = () => Math.ceil(getScrollTop() + getClientHeight()) >= getBaseScrollHeight();

      function syncSpacerHeight() {
        if (!_state || !_state.spacer) return;
        _state.spacer.style.height = `${Math.round(getEffectiveMaxRevealPx())}px`;
      }

      function requestTick() {
        if (!_state.rafId) _state.rafId = requestAnimationFrame(tick);
      }
      function tick() {
        _state.rafId = 0;
        _state.currentY = lerp(_state.currentY, _state.targetY, _state.smoothness);
        if (Math.abs(_state.currentY - _state.targetY) < 0.4) {
          _state.currentY = _state.targetY;
        }
        _state.footer.style.transform = `translate3d(0, ${_state.currentY}px, 0)`;
        if (Math.abs(_state.currentY - _state.targetY) >= 0.4) requestTick();
      }

      function setReveal(px) {
        const cap = getEffectiveMaxRevealPx();
        _state.revealedPx = clamp(px, 0, cap);
        _state.targetY = Math.round(footerHeight - _state.revealedPx);
        requestTick();
      }

      function handleRevealDelta(rawDeltaY) {
        if (!isAtBottomBase()) return false;
        const cap = getEffectiveMaxRevealPx();
        const goingDown = rawDeltaY > 0;
        const goingUp = rawDeltaY < 0;
        if (goingDown && _state.revealedPx >= cap - 0.1) return true;
        if (goingUp && _state.revealedPx <= 0.1) return false;
        const step = Math.min(Math.abs(rawDeltaY) * _state.parallaxRatio, _state.maxStepPx);
        if (goingDown) {
          setReveal(_state.revealedPx + step);
          return true;
        } else if (goingUp) {
          setReveal(_state.revealedPx - step);
          return _state.revealedPx > 0.1;
        }
        return false;
      }

      function measureAndClamp() {
        const newH = _state.footer.offsetHeight || footerHeight;
        if (newH !== footerHeight) {
          footerHeight = newH;
          _state.currentY = Math.min(_state.currentY, footerHeight);
          _state.targetY = Math.min(_state.targetY, footerHeight);
          setReveal(_state.revealedPx);
          syncSpacerHeight();
        }
      }

      if (typeof window !== 'undefined' && typeof window.ResizeObserver !== 'undefined') {
        try {
          const ro = new ResizeObserver(() => {
            const newH = _state.footer.offsetHeight || footerHeight;
            if (newH == null) return;
            if (newH !== footerHeight) {
              const diff = newH - footerHeight;
              footerHeight = newH;
              _state.currentY = Math.max(0, Math.min(footerHeight, _state.currentY + diff));
              _state.targetY = Math.max(0, Math.min(footerHeight, _state.targetY + diff));
              _state.footer.style.transform = `translate3d(0, ${_state.currentY}px, 0)`;
              syncSpacerHeight();
              requestTick();
            }
          });
          ro.observe(_state.footer);
          _state.resizeObserver = ro;
        } catch {
          _state.resizeObserver = null;
        }
      }

      function throttle(fn, wait) {
        let waiting = false;
        let pending = false;
        return (...args) => {
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

      syncSpacerHeight();

      const onScroll = throttle(() => {
        _state.lastScrollTop = getScrollTop();
        const extra = getExtraScroll();
        if (extra > 0) {
          setReveal(extra);
          return;
        }
        if (_state.revealedPx > 0) {
          setReveal(0);
        } else {
          _state.targetY = footerHeight;
          requestTick();
        }
      }, _state.throttleMs);

      const onWheel = (e) => {
        if (getExtraScroll() > 0) return;
        if (handleRevealDelta(e.deltaY)) e.preventDefault();
      };
      const onTouchStart = (e) => {
        _state.lastInput = 'touch';
        _state.lastTouchY = e.touches && e.touches.length ? e.touches[0].clientY : null;
      };
      const onTouchMove = (e) => {
        if (_state.lastTouchY == null) return;
        if (getExtraScroll() > 0) return;
        const currentY = e.touches && e.touches.length ? e.touches[0].clientY : _state.lastTouchY;
        const deltaY = _state.lastTouchY - currentY;
        _state.lastTouchY = currentY;
        if (handleRevealDelta(deltaY)) e.preventDefault();
      };
      const isTextInput = (el) => {
        if (!el) return false;
        const tag = el.tagName;
        const editable = el.getAttribute && el.getAttribute('contenteditable');
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable === '' || editable === 'true';
      };
      const onKeyDown = (e) => {
        _state.lastInput = 'keyboard';
        if (e.defaultPrevented) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (isTextInput(e.target)) return;
        let deltaRaw = 0;
        const vh = window.innerHeight;
        switch (e.key) {
          case 'ArrowDown': deltaRaw = +_state.keyDeltaPx; break;
          case 'ArrowUp': deltaRaw = -_state.keyDeltaPx; break;
          case 'PageDown': deltaRaw = +vh; break;
          case 'PageUp': deltaRaw = -vh; break;
          case ' ': case 'Spacebar': deltaRaw = e.shiftKey ? -vh * 0.8 : +vh * 0.8; break;
          default: return;
        }
        if (getExtraScroll() > 0) return;
        if (handleRevealDelta(deltaRaw)) e.preventDefault();
      };
      const onPointerDown = (e) => {
        _state.lastInput = e && e.pointerType ? (e.pointerType === 'mouse' ? 'mouse' : 'touch') : 'mouse';
      };
      const onFocusIn = (e) => {
        const el = e.target;
        if (!el || !_state.footer.contains(el)) return;
        if (_state.ignoreMouseFocus && _state.lastInput !== 'keyboard') return;
        const revealForElement = () => {
          measureAndClamp();
          const footerRect = _state.footer.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const elTopInFooter = elRect.top - footerRect.top;
          const requiredReveal = elTopInFooter + elRect.height + _state.focusPaddingPx;
          const cap = getEffectiveMaxRevealPx();
          const revealPx = Math.min(Math.max(requiredReveal, 0), cap);
          setReveal(revealPx);
        };
        if (!isAtBottomBase()) {
          const targetTop = getBaseMaxScrollTop();
          setScrollTop(targetTop);
          requestAnimationFrame(() => requestAnimationFrame(revealForElement));
        } else {
          revealForElement();
        }
      };
      const onFocusOut = (e) => {
        const next = e.relatedTarget || document.activeElement;
        if (next && _state.footer.contains(next)) return;
        if (_state.lastInput !== 'keyboard') return;
        setReveal(0);
      };
      const onResize = throttle(() => {
        measureAndClamp();
        syncSpacerHeight();
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

      _state.onScroll = onScroll;
      _state.onResize = onResize;
      _state.onWheel = onWheel;
      _state.onTouchStart = onTouchStart;
      _state.onTouchMove = onTouchMove;
      _state.onKeyDown = onKeyDown;
      _state.onPointerDown = onPointerDown;
      _state.onFocusIn = onFocusIn;
      _state.onFocusOut = onFocusOut;

      requestTick();
    }

    function destroyFooterSlide({ footerId } = {}) {
      if (!footerId) return;
      if (!_state) return;
      const footerEl = (document.getElementById(footerId)?.closest('.footer-wrapper > div')) || null;
      if (!_state.footer || _state.footer !== footerEl) return;
      window.removeEventListener('scroll', _state.onScroll);
      window.removeEventListener('resize', _state.onResize);
      window.removeEventListener('wheel', _state.onWheel);
      window.removeEventListener('touchstart', _state.onTouchStart);
      window.removeEventListener('touchmove', _state.onTouchMove);
      window.removeEventListener('keydown', _state.onKeyDown);
      window.removeEventListener('pointerdown', _state.onPointerDown);
      document.removeEventListener('focusin', _state.onFocusIn);
      document.removeEventListener('focusout', _state.onFocusOut);
      if (_state.rafId) cancelAnimationFrame(_state.rafId);
      if (_state.resizeObserver) {
        try { _state.resizeObserver.disconnect(); } catch {}
        _state.resizeObserver = null;
      }
      if (_state.spacer && _state.spacer.parentNode) {
        try { _state.spacer.parentNode.removeChild(_state.spacer); } catch {}
      }
      const f = _state.footer;
      f.style.position = _state.original.position;
      f.style.left = _state.original.left;
      f.style.right = _state.original.right;
      f.style.bottom = _state.original.bottom;
      f.style.transform = _state.original.transform;
      f.style.willChange = _state.original.willChange;
      f.style.transition = _state.original.transition;
      f.style.zIndex = _state.original.zIndex;
      _state = null;
    }

    return { initFooterSlide, destroyFooterSlide };
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const ctrl = createFooterController();
      ctrl.initFooterSlide({ footerId: 'new-footer' });
    });
  } else {
    const ctrl = createFooterController();
    ctrl.initFooterSlide({ footerId: 'new-footer' });
  }
})();
