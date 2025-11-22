# CSS Scan Extension

A powerful browser extension for developers to inspect, compare, and analyze CSS properties across different elements and breakpoints.

## Features

### Core Functionality

- **Instant CSS Inspection** - Hover over any element to see its computed styles
- **One-Click Copy** - Click highlighted elements to copy CSS to clipboard
- **Smart Grouping** - Styles organized by Layout, Typography, Background, Border, and Other

### Comparison Mode

- **Pin Elements** - Press `P` or click the pin button to lock an element
- **Side-by-Side Diff** - Compare CSS between two elements with color-coded differences
- **Smart Highlighting**:
  - Purple: Properties only in current element
  - Pink: Properties only in pinned element
  - Orange: Properties with different values
- **Copy Differences** - Click to copy only the CSS that differs

### Responsive Inspector

- **Multi-Breakpoint View** - Press `R` or click the monitor button
- **Preset Breakpoints**:
  - Mobile (375px)
  - Tablet (768px)
  - Desktop (1440px)
- **Change Detection** - Automatically highlights properties that change at each breakpoint
- **No Browser Resize** - See all breakpoints without resizing your window

## Keyboard Shortcuts

| Key      | Action                              |
| -------- | ----------------------------------- |
| `Escape` | Exit scanning mode or unpin element |
| `P`      | Pin current element for comparison  |
| `R`      | Toggle responsive breakpoint view   |

## Installation

### Chrome/Edge

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the extension directory

### Firefox

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file

## Project Structure

```
css-scan-extension/
├── icons/                      # Extension icons
├── scripts/
│   ├── style-extractor.js      # CSS extraction and filtering logic
│   ├── style-panel.js          # Main panel UI component
│   ├── panel-renderers.js      # Normal and comparison mode renderers
│   ├── panel-features.js       # Pin and responsive mode features
│   ├── responsive-renderer.js  # Breakpoint rendering logic
│   ├── scanner.js              # Main scanner class with event handling
│   ├── content-new.js          # Entry point and message handling
│   └── background.js           # Service worker for extension lifecycle
├── styles/
│   └── content.css             # All extension UI styles
├── manifest.json               # Extension configuration
└── README.md                   # This file
```

## Development Guide

### Architecture

The extension uses a modular architecture for maintainability:

1. **style-extractor.js** - Extracts and groups CSS properties
2. **style-panel.js** - Core panel UI and state management
3. **panel-renderers.js** - Renders different view modes
4. **panel-features.js** - Implements pin and responsive features
5. **responsive-renderer.js** - Handles breakpoint visualization
6. **scanner.js** - Manages element scanning and highlighting
7. **content-new.js** - Coordinates all modules

### Adding New Features

**Example: Adding a new CSS property group**

Edit `scripts/style-extractor.js`:

```javascript
const propertyMap = {
  Layout: [...],
  Typography: [...],
  YourNewGroup: ['property-1', 'property-2']  // Add here
};
```

**Example: Adding a new breakpoint**

Edit `scripts/style-panel.js`:

```javascript
this.breakpoints = [
  { name: "Mobile", width: 375, icon: "smartphone" },
  { name: "YourBreakpoint", width: 1024, icon: "tablet" }, // Add here
];
```

### Modifying Styles

All styles are in `styles/content.css` with CSS variables for easy theming:

```css
:root {
  --scan-bg: #0a0a0a; /* Main background */
  --scan-accent: #3b82f6; /* Accent color */
  --scan-text: #fafafa; /* Text color */
  /* ... more variables */
}
```

### Testing Changes

1. Make your changes
2. Go to `chrome://extensions/`
3. Click the refresh icon on the CSS Scan extension
4. Test on any webpage

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Firefox 89+ (with minor adjustments)

## Contributing

When contributing, please:

1. Keep modules focused and under 200 lines
2. Follow the existing code style
3. Test on multiple websites
4. Update this README if adding features

## License

MIT License - feel free to use and modify!
