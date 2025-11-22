/**
 * CSS Scan Extension - Main Entry Point
 * Modular architecture for better maintainability
 */

let scannerInstance = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'activate') {
    if (!scannerInstance) {
      scannerInstance = new CSSScanner();
      scannerInstance.init();
      sendResponse({ success: true, isActive: true });
    } else {
      sendResponse({ success: true, isActive: true });
    }
  } else if (message.action === 'deactivate') {
    if (scannerInstance) {
      scannerInstance.destroy();
      scannerInstance = null;
      sendResponse({ success: true, isActive: false });
    } else {
      sendResponse({ success: true, isActive: false });
    }
  }

  return true;
});

window.addEventListener('beforeunload', () => {
  if (scannerInstance) {
    scannerInstance.destroy();
    scannerInstance = null;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && scannerInstance) {
    if (scannerInstance.stylePanel) {
      scannerInstance.stylePanel.hide();
    }
  }
});
