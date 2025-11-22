// Tab state tracking using Map data structure
const tabStates = new Map();

// Browser action click listener to toggle scanning mode
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await toggleScanning(tab.id);
  } catch (error) {
    console.error("Error toggling scanning:", error);
  }
});

// Toggle scanning mode for a specific tab
async function toggleScanning(tabId) {
  const currentState = tabStates.get(tabId) || {
    isActive: false,
    injected: false,
  };
  const newState = !currentState.isActive;

  tabStates.set(tabId, { isActive: newState, injected: currentState.injected });

  // Update icon to reflect new state
  updateIcon(tabId, newState);

  if (newState) {
    // Activate scanning
    await injectContentScript(tabId);
    await sendMessageToTab(tabId, { action: "activate" });
  } else {
    // Deactivate scanning
    await sendMessageToTab(tabId, { action: "deactivate" });
  }
}

// Update browser action icon based on active/inactive state
function updateIcon(tabId, isActive) {
  const iconPath = isActive
    ? {
      16: "icons/icon16.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png",
    }
    : {
      16: "icons/icon16-inactive.png",
      48: "icons/icon48-inactive.png",
      128: "icons/icon128-inactive.png",
    };

  chrome.action.setIcon({ tabId, path: iconPath });
}

// Clean up state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

// Clean up state when tab is updated (navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    const state = tabStates.get(tabId);
    if (state) {
      // Reset injected flag on navigation, but maintain active state
      tabStates.set(tabId, { isActive: state.isActive, injected: false });
      // Update icon to reflect maintained state
      updateIcon(tabId, state.isActive);
    }
  }
});

// Inject content script into active tab using chrome.scripting API
async function injectContentScript(tabId) {
  const state = tabStates.get(tabId);

  // Skip if already injected
  if (state && state.injected) {
    return;
  }

  try {
    // Get tab information to check URL
    const tab = await chrome.tabs.get(tabId);

    // Check for restricted pages
    if (isRestrictedUrl(tab.url)) {
      throw new Error(
        "Cannot inject script into restricted pages (chrome://, about:, etc.)"
      );
    }

    // Inject CSS first
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["styles/content.css"],
    });

    // Inject JavaScript modules in order
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [
        "scripts/style-extractor.js",
        "scripts/style-panel.js",
        "scripts/panel-renderers.js",
        "scripts/panel-features.js",
        "scripts/responsive-renderer.js",
        "scripts/scanner.js",
        "scripts/content-new.js"
      ],
    });

    // Mark as injected
    const currentState = tabStates.get(tabId) || { isActive: false };
    tabStates.set(tabId, { ...currentState, injected: true });
  } catch (error) {
    console.error("Failed to inject content script:", error);

    // Show notification to user about injection failure
    if (error.message.includes("restricted")) {
      console.warn("Cannot scan restricted pages");
    }

    // Reset state on failure
    const currentState = tabStates.get(tabId);
    if (currentState) {
      tabStates.set(tabId, { isActive: false, injected: false });
      updateIcon(tabId, false);
    }

    throw error;
  }
}

// Send activation/deactivation messages to content script
async function sendMessageToTab(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    // Content script might not be ready or tab might be closed
    console.error("Failed to send message to tab:", error);
  }
}

// Check if URL is restricted for content script injection
function isRestrictedUrl(url) {
  if (!url) return true;

  const restrictedProtocols = [
    "chrome://",
    "about:",
    "edge://",
    "chrome-extension://",
    "moz-extension://",
    "view-source:",
    "data:",
    "file://",
  ];

  return restrictedProtocols.some((protocol) => url.startsWith(protocol));
}
