import { MODE_KEY, MODES } from './config.js';

// Firefox MV2 doesn't have chrome.storage.session, so we emulate it using local storage
// with keys prefixed by "session_" and clear them on startup
const SESSION_PREFIX = "session_";
const CLEARED_KEY = "session_cleared_on_startup";

/**
 * Clear session storage on extension startup
 * Called once from background.js
 */
export async function clearSessionStorageOnStartup() {
  const result = await browser.storage.local.get(CLEARED_KEY);
  
  if (!result[CLEARED_KEY]) {
    // First run, clear all session-prefixed keys
    const allStorage = await browser.storage.local.get(null);
    const keysToRemove = Object.keys(allStorage).filter(key => key.startsWith(SESSION_PREFIX));
    
    if (keysToRemove.length > 0) {
      await browser.storage.local.remove(keysToRemove);
    }
    
    // Mark that we've cleared on this startup
    await browser.storage.local.set({ [CLEARED_KEY]: Date.now() });
  }
}

/**
 * Get the selected mode ID from persistent storage
 */
export async function getSelectedModeId() {
  const result = await browser.storage.local.get(MODE_KEY);
  const savedModeId = result?.[MODE_KEY];
  return MODES[savedModeId] ? savedModeId : "amazonOrders";
}

/**
 * Get rows for a mode from session storage (emulated)
 */
export async function getStoredRows(mode) {
  const sessionKey = SESSION_PREFIX + mode.storageKey;
  const result = await browser.storage.local.get(sessionKey);
  const rows = Array.isArray(result[sessionKey]) ? result[sessionKey] : [];
  return rows.map((row) => mode.normalize(row));
}

/**
 * Save rows for a mode to session storage (emulated)
 */
export async function saveRows(mode, rows) {
  const sessionKey = SESSION_PREFIX + mode.storageKey;
  await browser.storage.local.set({ [sessionKey]: rows });
}

/**
 * Clear rows for a mode from session storage (emulated)
 */
export async function clearRows(mode) {
  const sessionKey = SESSION_PREFIX + mode.storageKey;
  await browser.storage.local.remove(sessionKey);
}

/**
 * Persist selected mode to persistent storage
 */
export async function persistSelectedMode(modeId) {
  await browser.storage.local.set({ [MODE_KEY]: modeId });
}
