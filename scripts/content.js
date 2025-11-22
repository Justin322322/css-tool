/**
 * StyleExtractor - Utility class for extracting and formatting CSS properties
 */
class StyleExtractor {
  /**
   * Extract computed CSS properties from an element
   * @param {HTMLElement} element - The target element
   * @returns {CSSStyleDeclaration} Computed styles for the element
   */
  static getComputedStyles(element) {
    try {
      return window.getComputedStyle(element);
    } catch (error) {
      console.error('Failed to extract computed styles:', error);
      return null;
    }
  }

  /**
   * Group CSS properties into logical categories
   * @param {CSSStyleDeclaration} computedStyles - Computed styles from getComputedStyle
   * @returns {Object} Styles organized by category
   */
  static groupStyles(computedStyles) {
    if (!computedStyles) {
      return {};
    }

    const styleGroups = {
      Layout: {},
      Typography: {},
      Background: {},
      Border: {},
      Other: {}
    };

    // Define which properties belong to which group
    const propertyMap = {
      Layout: [
        'display', 'position', 'top', 'right', 'bottom', 'left',
        'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'box-sizing', 'overflow', 'overflow-x', 'overflow-y',
        'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
        'grid', 'grid-template-columns', 'grid-template-rows', 'gap'
      ],
      Typography: [
        'font-family', 'font-size', 'font-weight', 'font-style',
        'line-height', 'letter-spacing', 'text-align', 'text-decoration',
        'text-transform', 'color', 'white-space', 'word-spacing'
      ],
      Background: [
        'background', 'background-color', 'background-image',
        'background-size', 'background-position', 'background-repeat',
        'background-attachment'
      ],
      Border: [
        'border', 'border-width', 'border-style', 'border-color',
        'border-top', 'border-right', 'border-bottom', 'border-left',
        'border-radius', 'box-shadow', 'outline'
      ],
      Other: [
        'opacity', 'z-index', 'transform', 'transition',
        'animation', 'cursor', 'visibility', 'filter'
      ]
    };

    // Extract and filter properties
    for (const [group, properties] of Object.entries(propertyMap)) {
      for (const prop of properties) {
        const value = computedStyles.getPropertyValue(prop);

        // Filter out default/empty values
        if (value && this.shouldIncludeProperty(prop, value)) {
          styleGroups[group][prop] = value;
        }
      }
    }

    // Remove empty groups
    for (const group in styleGroups) {
      if (Object.keys(styleGroups[group]).length === 0) {
        delete styleGroups[group];
      }
    }

    return styleGroups;
  }

  /**
   * Determine if a property should be included based on its value
   * @param {string} property - CSS property name
   * @param {string} value - CSS property value
   * @returns {boolean} Whether to include the property
   */
  static shouldIncludeProperty(property, value) {
    // Exclude common default values
    const excludeDefaults = {
      'position': ['static'],
      'display': ['inline'],
      'opacity': ['1'],
      'z-index': ['auto'],
      'transform': ['none'],
      'transition': ['all 0s ease 0s'],
      'animation': ['none'],
      'background-image': ['none'],
      'border-style': ['none'],
      'border-width': ['0px'],
      'box-shadow': ['none'],
      'outline': ['none'],
      'margin': ['0px'],
      'padding': ['0px']
    };

    // Check if value is a default that should be excluded
    if (excludeDefaults[property] && excludeDefaults[property].includes(value)) {
      return false;
    }

    // Exclude zero margins/paddings
    if ((property.startsWith('margin') || property.startsWith('padding')) && value === '0px') {
      return false;
    }

    return true;
  }

}

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
      { name: 'Desktop', width: 1440, icon: 'monitor' }
    ];
    this.currentBreakpoint = null;
    this.breakpointStyles = {};
    this.create();
  }

  create() {
    if (this.panel) return;

    this.panel = document.createElement('div');
    this.panel.id = 'css-scan-panel';
    this.panel.style.display = 'none';

    // Improved structure with icon and pin button
    this.panel.innerHTML = `
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

    document.body.appendChild(this.panel);
    
    // Add button click handlers
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

  pinCurrentElement() {
    if (!this.currentElement || !this.currentStyleGroups) return;
    
    this.pinnedElement = this.currentElement;
    this.pinnedStyleGroups = this.currentStyleGroups;
    this.isComparisonMode = true;
    
    // Update pin button state
    const pinButton = this.panel.querySelector('.pin-button');
    pinButton.classList.add('pinned');
    
    // Show feedback
    this.showPinFeedback();
    
    // Re-render to show comparison
    this.render();
  }

  unpinElement() {
    this.pinnedElement = null;
    this.pinnedStyleGroups = null;
    this.isComparisonMode = false;
    
    // Update pin button state
    const pinButton = this.panel.querySelector('.pin-button');
    pinButton.classList.remove('pinned');
    
    // Re-render
    this.render();
  }

  showPinFeedback() {
    const feedback = this.panel.querySelector('.pin-feedback');
    if (feedback) {
      feedback.classList.add('show');
      setTimeout(() => {
        feedback.classList.remove('show');
      }, 2000);
    }
  }

  toggleResponsiveMode() {
    this.isResponsiveMode = !this.isResponsiveMode;
    
    const responsiveButton = this.panel.querySelector('.responsive-button');
    if (this.isResponsiveMode) {
      responsiveButton.classList.add('active');
      if (this.currentElement) {
        this.captureBreakpointStyles(this.currentElement);
      }
    } else {
      responsiveButton.classList.remove('active');
      this.breakpointStyles = {};
      this.currentBreakpoint = null;
    }
    
    this.render();
  }

  captureBreakpointStyles(element) {
    this.breakpointStyles = {};
    const originalWidth = window.innerWidth;
    
    // Capture styles at each breakpoint
    for (const breakpoint of this.breakpoints) {
      // Temporarily set viewport width
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = breakpoint.width + 'px';
      iframe.style.height = '100vh';
      document.body.appendChild(iframe);
      
      // Clone element into iframe to get styles at that width
      const iframeDoc = iframe.contentDocument;
      iframeDoc.write('<!DOCTYPE html><html><head></head><body></body></html>');
      
      // Copy all stylesheets
      const stylesheets = Array.from(document.styleSheets);
      stylesheets.forEach(sheet => {
        try {
          const style = iframeDoc.createElement('style');
          const rules = Array.from(sheet.cssRules || []);
          style.textContent = rules.map(rule => rule.cssText).join('\n');
          iframeDoc.head.appendChild(style);
        } catch (e) {
          // Cross-origin stylesheets will throw
        }
      });
      
      // Clone the element
      const clonedElement = element.cloneNode(true);
      iframeDoc.body.appendChild(clonedElement);
      
      // Get computed styles
      const computedStyles = iframe.contentWindow.getComputedStyle(clonedElement);
      this.breakpointStyles[breakpoint.name] = StyleExtractor.groupStyles(computedStyles);
      
      // Cleanup
      document.body.removeChild(iframe);
    }
  }

  show(element, styleGroups, position) {
    this.currentElement = element;
    this.currentStyleGroups = styleGroups;
    this.render();

    this.panel.style.display = 'flex';

    // Position logic
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = 380;
    const panelHeight = Math.min(600, viewportHeight - 40);

    let left = position.x + 20;
    let top = position.y + 20;

    if (left + panelWidth > viewportWidth) {
      left = position.x - panelWidth - 20;
    }

    if (top + panelHeight > viewportHeight) {
      top = viewportHeight - panelHeight - 20;
    }

    // Ensure not off-screen
    left = Math.max(10, left);
    top = Math.max(10, top);

    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${top}px`;
  }

  /**
   * Show copy feedback message
   */
  showCopyFeedback() {
    const feedback = this.panel.querySelector('.copy-feedback');
    if (feedback) {
      feedback.classList.add('show');
      setTimeout(() => {
        feedback.classList.remove('show');
      }, 2000);
    }
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

  renderComputed(container) {
    // Add instruction banner with better icon
    const instructionDiv = document.createElement('div');
    instructionDiv.className = 'instruction-banner';
    instructionDiv.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <span>Click the highlighted element to copy CSS</span>
    `;
    container.appendChild(instructionDiv);

    for (const [group, props] of Object.entries(this.currentStyleGroups)) {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'style-group';

      const groupTitle = document.createElement('div');
      groupTitle.className = 'group-title';
      groupTitle.textContent = group;
      groupDiv.appendChild(groupTitle);

      for (const [prop, val] of Object.entries(props)) {
        const propRow = document.createElement('div');
        propRow.className = 'style-property';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'property-name';
        nameSpan.textContent = prop + ': ';

        const valSpan = document.createElement('span');
        valSpan.className = 'property-value';
        valSpan.textContent = val + ';';

        propRow.appendChild(nameSpan);
        propRow.appendChild(valSpan);

        // Color preview
        if (val.includes('#') || val.includes('rgb') || val.includes('hsl')) {
          const preview = document.createElement('span');
          preview.className = 'color-preview';
          preview.style.backgroundColor = val;
          propRow.appendChild(preview);
        }

        groupDiv.appendChild(propRow);
      }
      container.appendChild(groupDiv);
    }
  }

  renderComparison(container) {
    // Add comparison header with unpin button
    const comparisonHeader = document.createElement('div');
    comparisonHeader.className = 'comparison-header';
    comparisonHeader.innerHTML = `
      <div class="comparison-info">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span>Comparing elements</span>
      </div>
      <button class="unpin-button" title="Clear comparison">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    container.appendChild(comparisonHeader);

    // Add unpin button handler
    const unpinButton = comparisonHeader.querySelector('.unpin-button');
    unpinButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.unpinElement();
    });

    // Add instruction banner
    const instructionDiv = document.createElement('div');
    instructionDiv.className = 'instruction-banner comparison';
    instructionDiv.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Click to copy differences • Press Escape to unpin</span>
    `;
    container.appendChild(instructionDiv);

    // Get all unique property groups
    const allGroups = new Set([
      ...Object.keys(this.pinnedStyleGroups),
      ...Object.keys(this.currentStyleGroups)
    ]);

    for (const group of allGroups) {
      const pinnedProps = this.pinnedStyleGroups[group] || {};
      const currentProps = this.currentStyleGroups[group] || {};
      
      // Get all unique properties in this group
      const allProps = new Set([
        ...Object.keys(pinnedProps),
        ...Object.keys(currentProps)
      ]);

      if (allProps.size === 0) continue;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'style-group comparison';

      const groupTitle = document.createElement('div');
      groupTitle.className = 'group-title';
      groupTitle.textContent = group;
      groupDiv.appendChild(groupTitle);

      for (const prop of allProps) {
        const pinnedVal = pinnedProps[prop];
        const currentVal = currentProps[prop];
        
        // Determine diff status
        let diffStatus = 'same';
        if (!pinnedVal) diffStatus = 'current-only';
        else if (!currentVal) diffStatus = 'pinned-only';
        else if (pinnedVal !== currentVal) diffStatus = 'different';

        if (diffStatus === 'same') continue; // Skip identical properties

        const propRow = document.createElement('div');
        propRow.className = `style-property comparison ${diffStatus}`;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'property-name';
        nameSpan.textContent = prop + ': ';

        propRow.appendChild(nameSpan);

        // Show both values if different
        if (diffStatus === 'different') {
          const pinnedValSpan = document.createElement('span');
          pinnedValSpan.className = 'property-value pinned';
          pinnedValSpan.textContent = pinnedVal + ';';
          pinnedValSpan.title = 'Pinned element';
          
          const arrow = document.createElement('span');
          arrow.className = 'diff-arrow';
          arrow.textContent = '→';
          
          const currentValSpan = document.createElement('span');
          currentValSpan.className = 'property-value current';
          currentValSpan.textContent = currentVal + ';';
          currentValSpan.title = 'Current element';

          propRow.appendChild(pinnedValSpan);
          propRow.appendChild(arrow);
          propRow.appendChild(currentValSpan);
        } else {
          const valSpan = document.createElement('span');
          valSpan.className = `property-value ${diffStatus === 'pinned-only' ? 'pinned' : 'current'}`;
          valSpan.textContent = (pinnedVal || currentVal) + ';';
          valSpan.title = diffStatus === 'pinned-only' ? 'Only in pinned element' : 'Only in current element';
          propRow.appendChild(valSpan);
        }

        // Add color preview if applicable
        const colorVal = currentVal || pinnedVal;
        if (colorVal && (colorVal.includes('#') || colorVal.includes('rgb') || colorVal.includes('hsl'))) {
          const preview = document.createElement('span');
          preview.className = 'color-preview';
          preview.style.backgroundColor = colorVal;
          propRow.appendChild(preview);
        }

        groupDiv.appendChild(propRow);
      }

      // Only add group if it has differences
      if (groupDiv.children.length > 1) {
        container.appendChild(groupDiv);
      }
    }
  }

  getDifferencesCSS() {
    if (!this.isComparisonMode || !this.pinnedStyleGroups || !this.currentStyleGroups) {
      return '';
    }

    let css = '/* CSS Differences */\n\n';
    
    const allGroups = new Set([
      ...Object.keys(this.pinnedStyleGroups),
      ...Object.keys(this.currentStyleGroups)
    ]);

    for (const group of allGroups) {
      const pinnedProps = this.pinnedStyleGroups[group] || {};
      const currentProps = this.currentStyleGroups[group] || {};
      
      const allProps = new Set([
        ...Object.keys(pinnedProps),
        ...Object.keys(currentProps)
      ]);

      let groupHasDiff = false;
      let groupCSS = '';

      for (const prop of allProps) {
        const pinnedVal = pinnedProps[prop];
        const currentVal = currentProps[prop];
        
        if (!pinnedVal) {
          groupCSS += `${prop}: ${currentVal}; /* only in current */\n`;
          groupHasDiff = true;
        } else if (!currentVal) {
          groupCSS += `${prop}: ${pinnedVal}; /* only in pinned */\n`;
          groupHasDiff = true;
        } else if (pinnedVal !== currentVal) {
          groupCSS += `${prop}: ${currentVal}; /* was: ${pinnedVal} */\n`;
          groupHasDiff = true;
        }
      }

      if (groupHasDiff) {
        css += `/* ${group} */\n${groupCSS}\n`;
      }
    }

    return css;
  }

  renderResponsive(container) {
    // Add breakpoint tabs
    const breakpointTabs = document.createElement('div');
    breakpointTabs.className = 'breakpoint-tabs';
    
    for (const breakpoint of this.breakpoints) {
      const tab = document.createElement('button');
      tab.className = 'breakpoint-tab';
      if (this.currentBreakpoint === breakpoint.name) {
        tab.classList.add('active');
      }
      
      const icon = this.getBreakpointIcon(breakpoint.icon);
      tab.innerHTML = `
        ${icon}
        <span>${breakpoint.name}</span>
        <span class="breakpoint-width">${breakpoint.width}px</span>
      `;
      
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentBreakpoint = breakpoint.name;
        this.render();
      });
      
      breakpointTabs.appendChild(tab);
    }
    
    container.appendChild(breakpointTabs);

    // If no breakpoint selected, show instruction
    if (!this.currentBreakpoint) {
      this.currentBreakpoint = this.breakpoints[0].name;
    }

    // Add instruction banner
    const instructionDiv = document.createElement('div');
    instructionDiv.className = 'instruction-banner responsive';
    instructionDiv.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Showing styles at ${this.currentBreakpoint} breakpoint</span>
    `;
    container.appendChild(instructionDiv);

    // Show styles for selected breakpoint
    const breakpointStyleGroups = this.breakpointStyles[this.currentBreakpoint] || this.currentStyleGroups;
    
    // Compare with base styles to show differences
    const baseStyleGroups = this.currentStyleGroups;
    const allGroups = new Set([
      ...Object.keys(baseStyleGroups),
      ...Object.keys(breakpointStyleGroups)
    ]);

    for (const group of allGroups) {
      const baseProps = baseStyleGroups[group] || {};
      const breakpointProps = breakpointStyleGroups[group] || {};
      
      const allProps = new Set([
        ...Object.keys(baseProps),
        ...Object.keys(breakpointProps)
      ]);

      if (allProps.size === 0) continue;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'style-group responsive';

      const groupTitle = document.createElement('div');
      groupTitle.className = 'group-title';
      groupTitle.textContent = group;
      groupDiv.appendChild(groupTitle);

      for (const prop of allProps) {
        const baseVal = baseProps[prop];
        const breakpointVal = breakpointProps[prop];
        
        // Determine if changed
        const isChanged = baseVal !== breakpointVal;

        const propRow = document.createElement('div');
        propRow.className = `style-property responsive ${isChanged ? 'changed' : ''}`;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'property-name';
        nameSpan.textContent = prop + ': ';

        const valSpan = document.createElement('span');
        valSpan.className = 'property-value';
        valSpan.textContent = (breakpointVal || baseVal) + ';';

        propRow.appendChild(nameSpan);
        propRow.appendChild(valSpan);

        // Show change indicator
        if (isChanged && baseVal) {
          const changeIndicator = document.createElement('span');
          changeIndicator.className = 'change-indicator';
          changeIndicator.textContent = `was: ${baseVal}`;
          changeIndicator.title = `Original: ${baseVal}`;
          propRow.appendChild(changeIndicator);
        }

        // Color preview
        const colorVal = breakpointVal || baseVal;
        if (colorVal && (colorVal.includes('#') || colorVal.includes('rgb') || colorVal.includes('hsl'))) {
          const preview = document.createElement('span');
          preview.className = 'color-preview';
          preview.style.backgroundColor = colorVal;
          propRow.appendChild(preview);
        }

        groupDiv.appendChild(propRow);
      }

      container.appendChild(groupDiv);
    }
  }

  getBreakpointIcon(iconName) {
    const icons = {
      smartphone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
      tablet: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
      monitor: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
    };
    return icons[iconName] || icons.monitor;
  }


}

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
    
    // Note: mousemove and click handlers are added in createHighlightOverlay
  }

  createHighlightOverlay() {
    this.highlightOverlay = document.createElement('div');
    this.highlightOverlay.id = 'css-scan-highlight';
    this.highlightOverlay.style.display = 'none';
    
    document.body.appendChild(this.highlightOverlay);
    
    // Add global click handler that works through the overlay
    this.boundHandleClick = this.handleClick.bind(this);
    document.addEventListener('click', this.boundHandleClick, true);
    
    // Add global mousemove handler for smooth tracking
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    document.addEventListener('mousemove', this.boundHandleMouseMove, true);
  }

  /**
   * Handle click events - copy styles when clicking on highlighted element
   * @param {MouseEvent} event - The click event
   */
  handleClick(event) {
    if (!this.isActive || !this.currentTarget) return;

    // Don't interfere with panel clicks
    if (this.isOwnElement(event.target)) return;

    event.preventDefault();
    event.stopPropagation();

    // Copy CSS based on mode
    let textToCopy;
    if (this.stylePanel.isComparisonMode) {
      textToCopy = this.stylePanel.getDifferencesCSS();
    } else {
      textToCopy = this.getComputedCSSString(this.stylePanel.currentStyleGroups);
    }

    // Copy to clipboard
    this.copyToClipboard(textToCopy);

    // Show copy feedback (but don't close the panel)
    this.stylePanel.showCopyFeedback();
  }

  /**
   * Convert style groups to CSS string
   */
  getComputedCSSString(styleGroups) {
    let css = '';
    for (const [group, props] of Object.entries(styleGroups)) {
      for (const [prop, val] of Object.entries(props)) {
        css += `${prop}: ${val};\n`;
      }
    }
    return css;
  }

  /**
   * Copy text to clipboard
   */
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

  /**
   * Fallback copy method for older browsers
   */
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

  togglePause() {
    this.isPaused = !this.isPaused;
    // Visual feedback for pause could be added here
  }

  /**
   * Handle mousemove events - continuously track element under cursor
   * @param {MouseEvent} event - The mousemove event
   */
  handleMouseMove(event) {
    if (this.isPaused || !this.isActive) return;

    // Temporarily hide highlight to get element underneath
    const wasVisible = this.highlightOverlay && this.highlightOverlay.style.display !== 'none';
    if (wasVisible) {
      this.highlightOverlay.style.display = 'none';
    }

    // Get the actual element under the cursor
    const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);

    // Restore highlight visibility
    if (wasVisible) {
      this.highlightOverlay.style.display = 'block';
    }

    // Don't scan our own UI
    if (this.isOwnElement(elementUnderCursor)) return;

    // Only update if we're hovering a different element
    if (elementUnderCursor && elementUnderCursor !== this.currentTarget) {
      this.currentTarget = elementUnderCursor;

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        if (this.currentTarget) {
          // Highlight the element
          this.highlightElement(this.currentTarget);

          // Extract and display styles
          this.showStylesForElement(this.currentTarget, event.clientX, event.clientY);
        }
      }, this.debounceDelay);
    }
  }

  /**
   * Handle mouseover events
   * @param {MouseEvent} event - The mouseover event
   */
  handleMouseOver(event) {
    // This is now just a backup, main logic is in handleMouseMove
    if (this.isPaused || !this.isActive) return;
    if (this.isOwnElement(event.target)) return;
  }

  /**
   * Handle mouseout events
   * @param {MouseEvent} event - The mouseout event
   */
  handleMouseOut(event) {
    if (this.isPaused) return;

    // Only remove highlight if we're leaving the current target
    if (event.target === this.currentTarget) {
      // Check if we're not entering a child element
      if (!event.target.contains(event.relatedTarget)) {
        this.removeHighlight();
      }
    }
  }

  /**
   * Handle keyboard events (Escape and P keys)
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      // If in comparison mode, unpin first
      if (this.stylePanel && this.stylePanel.isComparisonMode) {
        this.stylePanel.unpinElement();
      } else {
        // Deactivate scanning mode
        this.destroy();

        // Send message to background script to update state
        if (chrome && chrome.runtime) {
          chrome.runtime.sendMessage({ action: 'deactivate' }).catch(err => {
            console.error('Failed to send deactivation message:', err);
          });
        }
      }
    } else if (event.key === 'p' || event.key === 'P') {
      // Pin current element with P key
      if (this.stylePanel && this.currentTarget && !this.isOwnElement(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        this.stylePanel.pinCurrentElement();
      }
    } else if (event.key === 'r' || event.key === 'R') {
      // Toggle responsive mode with R key
      if (this.stylePanel && !this.isOwnElement(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        this.stylePanel.toggleResponsiveMode();
      }
    }
  }

  /**
   * Check if an element is part of the CSS scanner UI
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element is part of scanner UI
   */
  isOwnElement(element) {
    if (!element) {
      return false;
    }

    // Check if element is the panel, highlight, or their descendants
    return element.id === 'css-scan-panel' ||
      element.id === 'css-scan-highlight' ||
      element.closest('#css-scan-panel') !== null;
  }

  /**
   * Highlight an element by positioning the overlay
   * @param {HTMLElement} element - Element to highlight
   */
  highlightElement(element) {
    if (!this.highlightOverlay || !element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Position the highlight overlay
    this.highlightOverlay.style.display = 'block';
    this.highlightOverlay.style.left = `${rect.left + scrollX}px`;
    this.highlightOverlay.style.top = `${rect.top + scrollY}px`;
    this.highlightOverlay.style.width = `${rect.width}px`;
    this.highlightOverlay.style.height = `${rect.height}px`;
  }

  /**
   * Remove the highlight overlay
   */
  removeHighlight() {
    if (this.highlightOverlay) {
      this.highlightOverlay.style.display = 'none';
    }
  }

  /**
   * Extract styles and show panel for an element
   * @param {HTMLElement} element - Target element
   * @param {number} clientX - Cursor X position
   * @param {number} clientY - Cursor Y position
   */
  showStylesForElement(element, clientX, clientY) {
    if (!element || !this.stylePanel) {
      return;
    }

    // Extract computed styles
    const computedStyles = StyleExtractor.getComputedStyles(element);

    if (!computedStyles) {
      console.warn('Unable to extract styles for element');
      return;
    }

    // Group styles into categories
    const styleGroups = StyleExtractor.groupStyles(computedStyles);

    // Calculate absolute position from client position
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const absoluteX = clientX + scrollX;
    const absoluteY = clientY + scrollY;

    // Show the style panel
    this.stylePanel.show(element, styleGroups, { x: absoluteX, y: absoluteY });
  }

  /**
   * Clean up and destroy the scanner
   */
  destroy() {
    if (!this.isActive) {
      return;
    }

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Remove event listeners
    document.removeEventListener('mouseover', this.boundHandleMouseOver, true);
    document.removeEventListener('mouseout', this.boundHandleMouseOut, true);
    document.removeEventListener('keydown', this.boundHandleKeyDown, true);
    
    if (this.boundHandleMouseMove) {
      document.removeEventListener('mousemove', this.boundHandleMouseMove, true);
    }
    if (this.boundHandleClick) {
      document.removeEventListener('click', this.boundHandleClick, true);
    }

    // Remove highlight overlay
    if (this.highlightOverlay && this.highlightOverlay.parentNode) {
      this.highlightOverlay.parentNode.removeChild(this.highlightOverlay);
    }
    this.highlightOverlay = null;

    // Destroy style panel
    if (this.stylePanel) {
      this.stylePanel.destroy();
      this.stylePanel = null;
    }

    // Clear references
    this.currentTarget = null;
    this.isActive = false;
  }
}

/**
 * Global scanner instance to manage lifecycle
 */
let scannerInstance = null;

/**
 * Message listener for activate/deactivate commands from background script
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'activate') {
    // Initialize CSSScanner when activation message is received
    if (!scannerInstance) {
      scannerInstance = new CSSScanner();
      scannerInstance.init();
      sendResponse({ success: true, isActive: true });
    } else {
      // Already active
      sendResponse({ success: true, isActive: true });
    }
  } else if (message.action === 'deactivate') {
    // Call destroy() on CSSScanner when deactivation message is received
    if (scannerInstance) {
      scannerInstance.destroy();
      scannerInstance = null;
      sendResponse({ success: true, isActive: false });
    } else {
      // Already inactive
      sendResponse({ success: true, isActive: false });
    }
  }

  // Return true to indicate we will send a response asynchronously
  return true;
});

/**
 * Cleanup when page navigates or extension is disabled
 */
window.addEventListener('beforeunload', () => {
  if (scannerInstance) {
    scannerInstance.destroy();
    scannerInstance = null;
  }
});

/**
 * Cleanup when page becomes hidden (tab switch, minimize, etc.)
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden && scannerInstance) {
    // Optionally hide the panel when tab is hidden
    if (scannerInstance.stylePanel) {
      scannerInstance.stylePanel.hide();
    }
  }
});
