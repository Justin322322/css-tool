/**
 * Panel feature methods (pin, responsive, etc.)
 */

// Pin/Unpin functionality
StylePanel.prototype.pinCurrentElement = function() {
  if (!this.currentElement || !this.currentStyleGroups) return;
  
  this.pinnedElement = this.currentElement;
  this.pinnedStyleGroups = this.currentStyleGroups;
  this.isComparisonMode = true;
  
  const pinButton = this.panel.querySelector('.pin-button');
  pinButton.classList.add('pinned');
  
  this.showPinFeedback();
  this.render();
};

StylePanel.prototype.unpinElement = function() {
  this.pinnedElement = null;
  this.pinnedStyleGroups = null;
  this.isComparisonMode = false;
  
  const pinButton = this.panel.querySelector('.pin-button');
  pinButton.classList.remove('pinned');
  
  this.render();
};

// Get differences CSS for comparison mode
StylePanel.prototype.getDifferencesCSS = function() {
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
};

// Responsive mode functionality
StylePanel.prototype.toggleResponsiveMode = function() {
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
};

StylePanel.prototype.captureBreakpointStyles = function(element) {
  this.breakpointStyles = {};
  
  for (const breakpoint of this.breakpoints) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = breakpoint.width + 'px';
    iframe.style.height = '100vh';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument;
    iframeDoc.write('<!DOCTYPE html><html><head></head><body></body></html>');
    
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
    
    const clonedElement = element.cloneNode(true);
    iframeDoc.body.appendChild(clonedElement);
    
    const computedStyles = iframe.contentWindow.getComputedStyle(clonedElement);
    this.breakpointStyles[breakpoint.name] = StyleExtractor.groupStyles(computedStyles);
    
    document.body.removeChild(iframe);
  }
};

StylePanel.prototype.getBreakpointIcon = function(iconName) {
  const icons = {
    smartphone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    tablet: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    monitor: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
  };
  return icons[iconName] || icons.monitor;
};
