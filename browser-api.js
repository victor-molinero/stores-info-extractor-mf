/**
 * Firefox browser API helpers
 * Wraps browser.* API calls for consistency and easier maintenance
 */

/**
 * Query tabs with given options
 */
export async function queryTabs(options) {
  return browser.tabs.query(options);
}

/**
 * Send a message to a specific tab
 */
export async function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    browser.tabs.sendMessage(tabId, message)
      .then(resolve)
      .catch((error) => {
        // Firefox uses Promises, so we catch rejected promises
        reject(new Error(error?.message || String(error)));
      });
  });
}

/**
 * Send a message to the background script
 */
export async function sendRuntimeMessage(message) {
  return browser.runtime.sendMessage(message);
}

/**
 * Initiate a download
 */
export async function downloadFile(options) {
  return browser.downloads.download(options);
}

/**
 * Listen for messages from content scripts or other parts
 */
export function onRuntimeMessage(callback) {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    callback(message, sender, sendResponse);
    return true; // Allow async response
  });
}

/**
 * Listen for installation/startup events
 */
export function onInstalled(callback) {
  browser.runtime.onInstalled.addListener(callback);
}

/**
 * Listen for startup event
 */
export function onStartup(callback) {
  browser.runtime.onStartup.addListener(callback);
}
