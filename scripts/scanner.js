/**
 * CSSScanner - Main class for the extension functionality
 */
class CSSScanner {
  constructor() {
    this.isActive = false;
    this.isPaused = false;
    this.currentTarget = null;
    this.highlightOverlay = null;
    this.stylePanel = null;
    this.debounceTimer = null;
    this.debounceDelay = 30;

    this.boundHandleMouseOver = this.handleMouseOver.bind(this);
    this.boundHandleMouseOut = this.handleMouseOut.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleMouseMove = null;
    this.boundHandleClick = null;
  }

  init() {
    if (this.isActive) return;
    this.isActive = true;

    this.createHighlightOverlay();
    this.stylePanel = new StylePanel();

    document.addEventListener('mouseover', this.boundHandleMouseOver, true);
    document.addEventListener('mouseout', this.boundHandleMouseOut, true);
    document.addEventListener('keydown', this.boundHandleKeyDown, true);
  }

  createHighlightOverlay() {
    this.highlightOverlay = document.createElement('div');
    this.highlightOverlay.id = 'css-scan-highlight';
    this.highlightOverlay.style.display = 'none';
    
    document.body.appendChild(this.highlightOverlay);
    
    this.boundHandleClick = this.handleClick.bind(this);
    document.addEventListener('click', this.boundHandleClick, true);
    
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    document.addEventListener('mousemove', this.boundHandleMouseMove, true);
  }

  handleClick(event) {
    if (!this.isActive || !this.currentTarget) return;
    if (this.isOwnElement(event.target)) return;

    event.preventDefault();
    event.stopPropagation();

    let textToCopy;
    if (this.stylePanel.isComparisonMode) {
      textToCopy = this.stylePanel.getDifferencesCSS();
    } else {
      textToCopy = this.getComputedCSSString(this.stylePanel.currentStyleGroups);
    }

    this.copyToClipboard(textToCopy);
    this.stylePanel.showCopyFeedback();
  }

  getComputedCSSString(styleGroups) {
    let css = '';
    for (const [group, props] of Object.entries(styleGroups)) {
      for (const [prop, val] of Object.entries(props)) {
        css += `${prop}: ${val};\n`;
      }
    }
    return css;
  }

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy:', err);
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textarea);
  }

  handleMouseMove(event) {
    if (this.isPaused || !this.isActive) return;

    const wasVisible = this.highlightOverlay && this.highlightOverlay.style.display !== 'none';
    if (wasVisible) {
      this.highlightOverlay.style.display = 'none';
    }

    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);

    if (wasVisible) {
      this.highlightOverlay.style.display = 'block';
    }

    if (this.isOwnElement(elementUnderCursor)) return;

    if (elementUnderCursor && elementUnderCursor !== this.currentTarget) {
      this.currentTarget = elementUnderCursor;

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        if (this.currentTarget) {
          this.highlightElement(this.currentTarget);
          this.showStylesForElement(this.currentTarget, event.clientX, event.clientY);
        }
      }, this.debounceDelay);
    }
  }

  handleMouseOver(event) {
    if (this.isPaused || !this.isActive) return;
    if (this.isOwnElement(event.target)) return;
  }

  handleMouseOut(event) {
    if (this.isPaused) return;

    if (event.target === this.currentTarget) {
      if (!event.target.contains(event.relatedTarget)) {
        this.removeHighlight();
      }
    }
  }

  handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      if (this.stylePanel && this.stylePanel.isComparisonMode) {
        this.stylePanel.unpinElement();
      } else {
        this.destroy();

        if (chrome && chrome.runtime) {
          chrome.runtime.sendMessage({ action: 'deactivate' }).catch(err => {
            console.error('Failed to send deactivation message:', err);
          });
        }
      }
    } else if (event.key === 'p' || event.key === 'P') {
      if (this.stylePanel && this.currentTarget && !this.isOwnElement(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        this.stylePanel.pinCurrentElement();
      }
    } else if (event.key === 'r' || event.key === 'R') {
      if (this.stylePanel && !this.isOwnElement(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        this.stylePanel.toggleResponsiveMode();
      }
    }
  }

  isOwnElement(element) {
    if (!element) return false;

    return element.id === 'css-scan-panel' ||
      element.id === 'css-scan-highlight' ||
      element.closest('#css-scan-panel') !== null;
  }

  highlightElement(element) {
    if (!this.highlightOverlay || !element) return;

    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    this.highlightOverlay.style.display = 'block';
    this.highlightOverlay.style.left = `${rect.left + scrollX}px`;
    this.highlightOverlay.style.top = `${rect.top + scrollY}px`;
    this.highlightOverlay.style.width = `${rect.width}px`;
    this.highlightOverlay.style.height = `${rect.height}px`;
  }

  removeHighlight() {
    if (this.highlightOverlay) {
      this.highlightOverlay.style.display = 'none';
    }
  }

  showStylesForElement(element, clientX, clientY) {
    if (!element || !this.stylePanel) return;

    const computedStyles = StyleExtractor.getComputedStyles(element);
    if (!computedStyles) {
      console.warn('Unable to extract styles for element');
      return;
    }

    const styleGroups = StyleExtractor.groupStyles(computedStyles);

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const absoluteX = clientX + scrollX;
    const absoluteY = clientY + scrollY;

    this.stylePanel.show(element, styleGroups, { x: absoluteX, y: absoluteY });
  }

  destroy() {
    if (!this.isActive) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    document.removeEventListener('mouseover', this.boundHandleMouseOver, true);
    document.removeEventListener('mouseout', this.boundHandleMouseOut, true);
    document.removeEventListener('keydown', this.boundHandleKeyDown, true);
    
    if (this.boundHandleMouseMove) {
      document.removeEventListener('mousemove', this.boundHandleMouseMove, true);
    }
    if (this.boundHandleClick) {
      document.removeEventListener('click', this.boundHandleClick, true);
    }

    if (this.highlightOverlay && this.highlightOverlay.parentNode) {
      this.highlightOverlay.parentNode.removeChild(this.highlightOverlay);
    }
    this.highlightOverlay = null;

    if (this.stylePanel) {
      this.stylePanel.destroy();
      this.stylePanel = null;
    }

    this.currentTarget = null;
    this.isActive = false;
  }
}
