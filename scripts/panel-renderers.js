/**
 * Panel rendering methods for different modes
 */

// Render computed styles (normal mode)
StylePanel.prototype.renderComputed = function(container) {
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
};

// Render comparison mode
StylePanel.prototype.renderComparison = function(container) {
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

  const unpinButton = comparisonHeader.querySelector('.unpin-button');
  unpinButton.addEventListener('click', (e) => {
    e.stopPropagation();
    this.unpinElement();
  });

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
      
      let diffStatus = 'same';
      if (!pinnedVal) diffStatus = 'current-only';
      else if (!currentVal) diffStatus = 'pinned-only';
      else if (pinnedVal !== currentVal) diffStatus = 'different';

      if (diffStatus === 'same') continue;

      const propRow = document.createElement('div');
      propRow.className = `style-property comparison ${diffStatus}`;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'property-name';
      nameSpan.textContent = prop + ': ';

      propRow.appendChild(nameSpan);

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

      const colorVal = currentVal || pinnedVal;
      if (colorVal && (colorVal.includes('#') || colorVal.includes('rgb') || colorVal.includes('hsl'))) {
        const preview = document.createElement('span');
        preview.className = 'color-preview';
        preview.style.backgroundColor = colorVal;
        propRow.appendChild(preview);
      }

      groupDiv.appendChild(propRow);
    }

    if (groupDiv.children.length > 1) {
      container.appendChild(groupDiv);
    }
  }
};
