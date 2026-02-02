# Security & CSP Notes

## Manifest V3 Compliance

This extension follows **Manifest V3** best practices for security:

### Content Security Policy (CSP)
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self'; img-src 'self' data:"
}
```

✅ **Security Features:**
- `script-src 'self'` - Only allows scripts from the extension itself (no external URLs)
- `object-src 'self'` - Only embeds the extension can create
- `style-src 'self'` - Only extension CSS files (no external stylesheets)
- `img-src 'self' data:` - Images from extension + inline SVG/data URLs

### Local Dependencies
- **Chart.js** (204KB) - Bundled locally in `chart.min.js`
  - Library: https://www.chartjs.org/
  - License: MIT
  - No external CDN calls required
  - Data never leaves your device

### Permissions Justification
- `storage` - Store tracking data locally ✓
- `tabs` - Monitor active tab for time tracking ✓
- `history` - Optional: can analyze visit history (not currently used)
- `idle` - Detect AFK periods to pause tracking ✓
- `alarms` - Set periodic background updates ✓

### No External Communications
- ✅ No API calls to external servers
- ✅ No telemetry or analytics
- ✅ No Firebase, Sentry, or logging services
- ✅ 100% local-first architecture

---

**Privacy Guarantee:** All data is stored in `chrome.storage.local` and never transmitted.
