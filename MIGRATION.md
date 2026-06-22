# Firefox Migration Summary

## Migration Completed ✓

The Chrome extension "Stores Info Extractor" has been successfully migrated to a Firefox addon (Manifest V2). All files have been created and adapted with Firefox-compatible APIs.

## File Structure

```
stores-info-extractor-mf/
├── manifest.json           # Firefox MV2 manifest (updated)
├── background.js           # Firefox background script (adapted)
├── content.js              # Content script (API calls updated)
├── config.js               # Extraction mode definitions (copied as-is)
├── handlers.js             # Event handlers (Firefox browser API adapted)
├── sidebar.js              # Sidebar initialization (copied with minor updates)
├── render.js               # UI rendering functions (copied as-is)
├── storage.js              # Firefox storage API wrappers (new)
├── browser-api.js          # Firefox API helpers (new)
├── utils.js                # Utility functions (copied as-is)
├── sidebar.html            # Sidebar UI template (copied)
├── sidebar.css             # Sidebar styles (responsive adjustments made)
├── README.md               # Firefox-specific documentation
├── LICENSE                 # License file (copied)
└── icons/                  # Extension icons (all PNG files copied)
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Key Changes Made

### 1. Manifest Conversion (manifest.json)
- **Manifest version**: 3 → 2
- **API namespace**: `chrome.*` → `browser.*`
- **Side panel**: Removed `sidePanel` key
- **Sidebar action**: Added `sidebar_action` key with Firefox sidebar configuration
- **Browser action**: Replaced `action` with `browser_action` for toolbar icon
- **Background script**: Changed from `service_worker` to `scripts` array
- **Permissions**: Kept `activeTab`, `downloads`, `storage` and explicitly listed URL patterns

### 2. API Adaptations

#### background.js
- **Removed**: `chrome.sidePanel.setPanelBehavior()` (Chrome-specific)
- **Replaced**: `chrome.runtime.onInstalled` → `browser.runtime.onInstalled`
- **Replaced**: `chrome.runtime.onStartup` → `browser.runtime.onStartup`
- **Replaced**: `chrome.runtime.onMessage` → `browser.runtime.onMessage`
- **Replaced**: `chrome.downloads.download()` → `browser.downloads.download()`
- **Added**: `clearSessionStorageOnStartup()` call to emulate Chrome's `storage.session`

#### handlers.js
- **Replaced**: `chrome.tabs.query()` → `browser.tabs.query()` (now Promise-based)
- **Replaced**: `chrome.tabs.sendMessage()` → `browser.tabs.sendMessage()` (Promise-based instead of callback)
- **Removed**: `chrome.runtime.lastError` (Firefox uses Promise rejection)
- **Replaced**: `chrome.runtime.sendMessage()` → `browser.runtime.sendMessage()`
- **Updated**: Error handling to work with Firefox's Promise-based APIs

#### content.js
- **Replaced**: `chrome.runtime.onMessage.addListener()` → `browser.runtime.onMessage.addListener()`
- **Unchanged**: All DOM scraping logic (browser-agnostic)

#### storage.js (NEW)
- **New file** with Firefox-specific storage wrappers
- **Session storage emulation**: Firefox MV2 lacks `storage.session`, so we use `storage.local` with `session_` prefix
- **Cleanup on startup**: Clears session-prefixed keys on addon load
- **Functions**:
  - `clearSessionStorageOnStartup()` - Call on addon startup
  - `getSelectedModeId()` - Get persistent mode selection
  - `getStoredRows(mode)` - Get session-emulated rows
  - `saveRows(mode, rows)` - Save session-emulated rows
  - `clearRows(mode)` - Clear mode's rows
  - `persistSelectedMode(modeId)` - Save mode selection

#### browser-api.js (NEW)
- **New file** with Firefox API helpers (optional, currently unused but available for future use)
- Includes wrappers for common operations

#### sidebar.js
- **Minimal changes**: Import statements already use relative paths
- Works identically with Firefox storage.js wrappers

#### render.js
- **No changes**: DOM manipulation is browser-agnostic
- Copied as-is

#### config.js
- **No changes**: Mode definitions don't use any APIs
- Copied as-is

#### utils.js
- **No changes**: CSV building and dedup logic don't use any APIs
- Copied as-is

### 3. UI/UX Adaptations (sidebar.css)
- **Responsive breakpoint**: Adjusted from 380px to 350px (Firefox sidebar typical width)
- **Category select**: Removed `min-width: 220px` constraint for better narrow-width compatibility
- **Table layout**: Already uses `overflow: auto` for horizontal scrolling if needed

## API Differences: Chrome vs. Firefox

| Feature | Chrome | Firefox | Handled |
|---------|--------|---------|---------|
| **Side panel** | `chrome.sidePanel.setPanelBehavior()` | `sidebar_action` in manifest | ✓ Removed Chrome call, using sidebar_action |
| **Runtime message** | Callback-based with `lastError` | Promise-based | ✓ Updated to async/await |
| **Tab messaging** | Callback-based | Promise-based | ✓ Updated to Promises |
| **Downloads** | `chrome.downloads.download()` | `browser.downloads.download()` | ✓ Updated namespace |
| **Storage session** | `chrome.storage.session` | Not available in MV2 | ✓ Emulated with `storage.local` + cleanup |
| **Storage local** | `chrome.storage.local` | `browser.storage.local` | ✓ Updated namespace |
| **Manifest version** | 3 | 2 | ✓ Converted to MV2 |
| **Service worker** | `service_worker` in manifest | Not supported in MV2 | ✓ Changed to `scripts` array |

## Testing Checklist

Before deploying, verify:

- [ ] **Installation**: Load addon at `about:debugging` without errors
- [ ] **Content script injection**: Addon loads on Amazon and Walmart pages
- [ ] **Amazon Orders extraction**: Extract from `https://www.amazon.com.mx/gp/css/order-history/`
- [ ] **Amazon Transactions extraction**: Extract from `https://www.amazon.com.mx/cpe/yourpayments/transactions`
- [ ] **Walmart List extraction**: Extract from `https://www.walmart.com.mx/lists`
- [ ] **Walmart Cart extraction**: Extract from `https://www.walmart.com.mx/cart`
- [ ] **Message passing**: Content script correctly receives messages and responds
- [ ] **Storage persistence**: Data persists across sidebar reopens during same session
- [ ] **Mode switching**: Switching modes and re-opening sidebar maintains selection
- [ ] **CSV download**: Downloaded files have correct encoding (UTF-8 BOM) and format
- [ ] **Row operations**: Add, remove, and update category work correctly
- [ ] **Error handling**: Shows appropriate messages for unsupported pages
- [ ] **Session cleanup**: Verify session data is cleared on browser restart (optional)

## Known Limitations

1. **Session storage lifetime**: Firefox MV2 doesn't have a true session storage. Data persists until manually cleared or browser restart (depending on storage configuration). Unlike Chrome, data will persist after F5 refresh - users should use the "Reset" button to manually clear if needed.

2. **Sidebar width**: Firefox sidebars are typically 300-350px wide. The layout may require horizontal scrolling for some tables with many columns. This is acceptable UX for a sidebar.

3. **Sidebar behavior**: Unlike Chrome's side panel, Firefox sidebars are toggled via View menu or addon icon. The sidebar persists across page navigations within the same tab.

## How to Test

### 1. Load Addon Temporarily
1. Open Firefox Developer Edition or regular Firefox
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Navigate to `/home/urizenix/repos/stores-info-extractor-mf/`
5. Select `manifest.json`

### 2. Test Extraction
1. Open a supported page (see Testing Checklist)
2. Click the addon icon or open sidebar via View menu
3. Select extraction mode from dropdown
4. Click **Extract current page**
5. Verify data appears in the table

### 3. Test Downloads
1. Click **Download CSV**
2. Open downloaded file in spreadsheet application
3. Verify data is correctly formatted with UTF-8 encoding

## Next Steps

1. **User testing**: Test on actual Amazon.com.mx and Walmart.com.mx pages to ensure DOM selectors still work
2. **Performance testing**: Load with 50+ rows to verify sidebar performance
3. **Firefox ESR compatibility**: Test on Firefox ESR (Extended Support Release) if targeting stable users
4. **Submission to Mozilla**: Once stable, consider submitting to [Mozilla Add-ons](https://addons.mozilla.org/)

## Migration Statistics

- **Files created**: 14 (manifest.json, 9 JS files, HTML, CSS, README, LICENSE)
- **Files adapted**: 5 (background.js, handlers.js, content.js, sidebar.js, sidebar.css)
- **Files copied as-is**: 5 (config.js, utils.js, render.js, sidebar.html, icons)
- **New files created**: 2 (storage.js, browser-api.js)
- **Chrome API calls replaced**: 14+ (all replaced with Firefox equivalents)
- **Lines of code**: ~1,500 total (mostly unchanged from original)

## Support & Debugging

If issues arise:

1. **Check manifest.json**: Ensure all keys are valid for Manifest V2
2. **Browser console**: Open DevTools (F12) on any page with the addon and check console for errors
3. **Addon debugging**: Visit `about:debugging` and click "Inspect" on the addon for background script logs
4. **DOM selectors**: If extraction fails, check if website structure has changed
5. **Storage**: Clear storage via Firefox about:addons if data becomes inconsistent

---

**Migration Date**: June 22, 2026
**Manifest Version**: Firefox MV2 (compatible with Firefox 109+)
**Status**: ✅ Ready for Testing
