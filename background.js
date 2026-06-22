import { clearSessionStorageOnStartup } from './storage.js';

/**
 * Initialize sidebar on first install and startup
 * In Firefox MV2, there's no direct equivalent to Chrome's sidePanel.setPanelBehavior()
 * The sidebar is controlled through the sidebar_action manifest key
 */
async function onAddonInstalled() {
  console.log("Stores Info Extractor installed");
  
  // Clear session storage on startup
  await clearSessionStorageOnStartup();
}

/**
 * Handle extension startup (Firefox restart)
 */
async function onAddonStartup() {
  console.log("Stores Info Extractor started");
  
  // Clear session storage on startup
  await clearSessionStorageOnStartup();
}

// Register installation listener
browser.runtime.onInstalled.addListener(() => {
  onAddonInstalled();
});

// Register startup listener
browser.runtime.onStartup.addListener(() => {
  onAddonStartup();
});

// Call on script load for immediate initialization
onAddonInstalled();

/**
 * Handle messages from sidebar (e.g., CSV downloads)
 */
browser.runtime.onMessage.addListener((msg) => {
  if (msg?.action !== "downloadCSV") {
    return;
  }

  browser.downloads.download({
    url: msg.dataUrl,
    filename: msg.filename || "online_purchases.csv",
  }).catch((error) => {
    console.error("Download failed:", error);
  });
});
