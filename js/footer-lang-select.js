const footerLangSelectData = () => ({
  langSelectOpen: false,
  isSmall: window.innerWidth < 1240,
  _footerSlide: null,
  tabPressed: false,

  handleLangSelectHover() {
    if (!this.isSmall) {
      this.langSelectOpen = true;
    }
  },

  handleLangSelectLeave(e) {
    if (!this.isSmall && !e.currentTarget.contains(e.relatedTarget)) {
      this.langSelectOpen = false;
    }
  },

  leaveLangSelect(e) {
    this.handleLangSelectLeave(e);
  },

  handleLangSelectFocusOut(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      this.langSelectOpen = false;
      this.applyLangSelectAccordion(e, this.langSelectOpen);
    }
  },

  clickOutsideCloseLangSelect(event) {
    if (!this.langSelectOpen) {
      return;
    }

    this.langSelectOpen = false;
    this.applyLangSelectAccordion(event, this.langSelectOpen);
  },

  onKeyDown(event) {
    const isTabKey =
      event.key === 'Tab' || event.which === 9 || event.keyCode === 9;
    this.tabPressed = isTabKey;
  },

  handleLangSelectClick() {
    if (this.isSmall) {
      this.langSelectOpen = !this.langSelectOpen;
    }
  },

  applyLangSelectAccordion(e, open) {
    const accordion = e?.currentTarget?.closest?.(
      '.footer-lang-select-container'
    );
    if (!accordion) {
      return;
    }

    const content = accordion.querySelector('.footer-lang-select-content');
    const button = accordion.querySelector('button');
    const links = content?.querySelectorAll('a') || [];

    accordion.classList.toggle('open', open);

    if (button) {
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    if (content) {
      content.setAttribute('aria-hidden', open ? 'false' : 'true');
      content.style.maxHeight = open ? `${content.scrollHeight}px` : '0px';
    }

    links.forEach((link) => {
      if (open) {
        link.setAttribute('tabindex', '0');
      } else {
        link.setAttribute('tabindex', '-1');
      }
    });
  },

  getLangSelectMenuClasses() {
    return {
      hidden: !this.langSelectOpen,
      flex: this.langSelectOpen,
    };
  },

  handleLangSelectEnter(e) {
    this.langSelectOpen = !this.langSelectOpen;
    this.applyLangSelectAccordion(e, this.langSelectOpen);

    this.$nextTick(() => {
      if (this.langSelectOpen) {
        const container = this.$refs.listLangSelectFooter;
        if (!container) {
          return;
        }

        const firstFocusable = container.querySelector('a[tabindex="0"]');
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    });
  },

  handleLangSelectItemClick() {
    localStorage.setItem('langPref', this.$el.dataset.langPref);
  },

  getLangChevronClasses() {
    return {
      'rotate-180': this.langSelectOpen,
    };
  },

  getLangFocusables(node) {
    const container = node.closest('[data-language-dropdown-footer]');
    if (!container) {
      return [];
    }

    return Array.from(container.querySelectorAll('ul a[tabindex="0"]'));
  },

  focusLangNext(event) {
    this.moveLangFocus(event.currentTarget, 1);
  },

  focusLangPrev(event) {
    this.moveLangFocus(event.currentTarget, -1);
  },

  moveLangFocus(node, step) {
    const focusables = this.getLangFocusables(node);
    if (!focusables.length) {
      return;
    }

    const index = focusables.indexOf(node);
    if (index === -1) {
      return;
    }

    const nextIndex = index + step;
    if (nextIndex < 0 || nextIndex >= focusables.length) {
      return;
    }
    focusables[nextIndex].focus();
  },

  closeLangSelectOnFocusOut(event) {
    const container = event.currentTarget;
    const relatedTarget = event.relatedTarget;
    this.langSelectOpen = false;

    if (this.tabPressed && !container.contains(relatedTarget)) {
      if (this.langSelectOpen) {
        this.langSelectOpen = false;
      }
    }
    this.tabPressed = false;
  },

  closeLangSelection(event) {
    if (!this.isSmall) {
      return;
    }
    const buttonLangSelect = this.$refs.buttonLangSelect;
    this.langSelectOpen = false;
    this.applyLangSelectAccordion(event, this.langSelectOpen);

    const isTabKey =
      event.key === 'Tab' || event.which === 9 || event.keyCode === 9;

    const isEscKey =
      event.key === 'Escape' || event.which === 27 || event.keyCode === 27;

    if (isTabKey || isEscKey) {
      this.$nextTick(() => {
        if (buttonLangSelect) {
          buttonLangSelect.focus();
        }
      });
    }
  },
});

const registerFooterLangSelectData = () => {
  if (typeof window === 'undefined' || !window.Alpine) {
    return;
  }

  window.Alpine.data('footerLangSelectData', footerLangSelectData);
};

if (typeof document !== 'undefined') {
  document.addEventListener('alpine:init', registerFooterLangSelectData);
}

registerFooterLangSelectData();

export default footerLangSelectData;
