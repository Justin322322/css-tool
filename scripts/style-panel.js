/**
 * StylePanel - UI component for displaying extracted styles
 */
class StylePanel {
  constructor() {
    this.panel = null;
    this.currentStyleGroups = null;
    this.currentElement = null;
    this.pinnedStyleGroups = null;
    this.pinnedElement = null;
    this.isComparisonMode = false;
    this.isResponsiveMode = false;
    this.breakpoints = [
      { name: 'Mobile', width: 375, icon: 'smartphone' },
      { name: 'Tablet', width: 768, icon: 'tablet' },
      { name: 'Desktop', width: 1440, icon: 'monitor' },
    ];
    this.currentBreakpoint = null;
    this.breakpointStyles = {};
  }

  create() {
    if (this.panel) return;

    this.panel = document.createElement('div');
    this.panel.id = 'css-scan-panel';
    this.panel.style.display = 'none';
    this.panel.innerHTML = this.getTemplate();
    document.body.appendChild(this.panel);

    this.attachEventListeners();
  }

  getTemplate() {
    return `
      <div class="css-scan-header">
        <div class="header-content">
          <svg class="header-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M8 13h2"/>
            <path d="M8 17h2"/>
            <path d="M14 13h2"/>
            <path d="M14 17h2"/>
          </svg>
          <span class="css-scan-title">Element Styles</span>
        </div>
        <div class="header-actions">
          <button class="responsive-button" title="Toggle responsive view (R)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
          <button class="pin-button" title="Pin element for comparison (P)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 17v5"/>
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="css-scan-body"></div>
      <div class="copy-feedback">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>Copied!</span>
      </div>
      <div class="pin-feedback">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 17v5"/>
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
        </svg>
        <span>Element pinned!</span>
      </div>
    `;
  }

  attachEventListeners() {
    const pinButton = this.panel.querySelector('.pin-button');
    pinButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.pinCurrentElement();
    });

    const responsiveButton = this.panel.querySelector('.responsive-button');
    responsiveButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleResponsiveMode();
    });
  }

  show(element, styleGroups, position) {
    if (!this.panel) {
      this.create();
    }
    this.currentElement = element;
    this.currentStyleGroups = styleGroups;
    this.render();

    this.panel.style.display = 'flex';

    this.panel.style.right = '20px';
    this.panel.style.top = '20px';
  }

  hide() {
    if (this.panel) this.panel.style.display = 'none';
  }

  destroy() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }

  showCopyFeedback() {
    const feedback = this.panel.querySelector('.copy-feedback');
    if (feedback) {
      feedback.classList.add('show');
      setTimeout(() => feedback.classList.remove('show'), 2000);
    }
  }

  showPinFeedback() {
    const feedback = this.panel.querySelector('.pin-feedback');
    if (feedback) {
      feedback.classList.add('show');
      setTimeout(() => feedback.classList.remove('show'), 2000);
    }
  }

  render() {
    const body = this.panel.querySelector('.css-scan-body');
    body.innerHTML = '';

    if (!this.currentStyleGroups) return;

    if (this.isResponsiveMode) {
      this.renderResponsive(body);
    } else if (this.isComparisonMode && this.pinnedStyleGroups) {
      this.renderComparison(body);
    } else {
      this.renderComputed(body);
    }
  }
}
