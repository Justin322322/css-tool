/**
 * Responsive mode renderer
 */

StylePanel.prototype.renderResponsive = function(container) {
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

  if (!this.currentBreakpoint) {
    this.currentBreakpoint = this.breakpoints[0].name;
  }

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

  const breakpointStyleGroups = this.breakpointStyles[this.currentBreakpoint] || this.currentStyleGroups;
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

      if (isChanged && baseVal) {
        const changeIndicator = document.createElement('span');
        changeIndicator.className = 'change-indicator';
        changeIndicator.textContent = `was: ${baseVal}`;
        changeIndicator.title = `Original: ${baseVal}`;
        propRow.appendChild(changeIndicator);
      }

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
};
