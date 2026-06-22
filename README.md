# Stores Info Extractor - Firefox Addon

Firefox addon (Manifest V2) that unifies multiple extraction workflows into one sidebar with selectable extraction modes.

## Included extraction modes

- Amazon Orders
- Amazon Transactions (Your Payments)
- Walmart List Prices
- Walmart Cart

## Features

- Select extraction mode from the sidebar.
- Extract rows from current page.
- Keep mode-specific rows in persistent browser storage.
- De-duplicate repeated rows in append modes.
- Replace rows with current page snapshot for Walmart cart mode.
- Remove individual rows and reset data.
- Download CSV (UTF-8 with BOM for spreadsheet compatibility).

## Installation (Developer Mode)

### Firefox Developer Edition or ESR

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select the `manifest.json` file from this folder.

### Alternative: Permanent Installation (Requires Signing)

Firefox requires addons to be signed before permanent installation. For development, use the temporary load method above.

## How to use

1. Install the addon using the instructions above.
2. Open one supported page (according to the selected mode):
   - Amazon Orders: `https://www.amazon.com.mx/gp/css/order-history/`
   - Amazon Transactions: `https://www.amazon.com.mx/cpe/yourpayments/transactions`
   - Walmart Lists: `https://www.walmart.com.mx/lists`
   - Walmart Cart: `https://www.walmart.com.mx/cart`
3. Click the extension icon to open/toggle the sidebar (or use the View menu).
4. Select extraction mode from the dropdown.
5. Click **Extract current page**.
6. Repeat for other pages if needed (pagination/manual navigation), then click **Download CSV**.

## Firefox Sidebar Behavior

- The sidebar opens via the browser's **View → Sidebars → Stores Info Extractor** menu, or by clicking the addon icon.
- The sidebar persists across page navigations within the same tab.
- Data is session-based (stored locally during the session) and grouped by mode.
- Refreshing the page does NOT clear data — it persists in storage.

## Notes

- Data is stored persistently using `browser.storage.local` and is **not** cleared on browser restart. Use the "Reset" button in the sidebar to clear data for a specific mode.
- Website DOM/data structures can change; extractor selectors may need maintenance.
- The sidebar width is optimized for Firefox's default sidebar width (~300-350px).
- Some columns may require horizontal scrolling in very narrow sidebars.

## Firefox vs. Chrome

This addon is adapted from the Chrome extension with the following differences:

| Feature | Chrome | Firefox |
|---------|--------|---------|
| **Side Panel/Sidebar** | Chrome-specific side panel API | Firefox sidebar (persistent, accessible via menu) |
| **Manifest Version** | Manifest V3 | Manifest V2 |
| **Background Script** | Service Worker | Background Script |
| **API Namespace** | `chrome.*` | `browser.*` |
| **Storage Session** | `chrome.storage.session` (temporary) | `browser.storage.local` (persistent during session) |

## Troubleshooting

**Addon doesn't appear in the sidebar menu:**
- Ensure you loaded it at `about:debugging` as a temporary addon.
- Restart Firefox if needed.

**Extraction returns "No results":**
- Verify you're on a supported page (see "How to use" section).
- Website DOM selectors may have changed; check the [GitHub repo](https://github.com/your-username/stores-info-extractor) for updates.

**CSV downloads with encoding issues:**
- Ensure your spreadsheet application supports UTF-8 with BOM (most do).
- The CSV always includes BOM prefix (`\uFEFF`) for Excel compatibility.

**Data is cleared when I restart Firefox:**
- This is expected behavior. Firefox's Manifest V2 doesn't have a true "session storage" API.
- Use the "Reset" button to manually clear data within the current session.

## License

See LICENSE file for details.
