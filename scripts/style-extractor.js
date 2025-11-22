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
