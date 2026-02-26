# USCIS Change Detect

A Chrome extension that detects changes in your USCIS case status directly on the [my.uscis.gov](https://my.uscis.gov) account page.

## What It Does

When you visit your USCIS account page, the extension adds a **"Check Changes"** button next to each case. Clicking it fetches data from three USCIS APIs and compares it against the previous check, highlighting any differences.

- **Case summary** — Displays form type, applicant name, current status, action codes, receipt info, and event history in a clean overlay.
- **Change detection** — Compares API responses against the last check using content hashing. Changed fields are flagged.
- **Side-by-side diff** — A "Raw Diff" tab shows exactly what changed in the JSON payloads, with syntax highlighting.
- **Popup dashboard** — Lists all tracked cases and their last-checked status.
- **Bilingual** — English and Chinese (zh) via i18next.

## How It Works

1. A content script detects case cards on the USCIS account page by matching `region_` DOM elements.
2. On click, the background service worker fetches three endpoints (`cases`, `case_status`, `receipt_info`) using the page's existing session cookies.
3. Responses are SHA-256 hashed and compared to stored values in `chrome.storage.local`.
4. The overlay renders a structured summary and, when changes exist, a side-by-side diff.

No data leaves your browser. All comparisons happen locally.

## Build

Requires [Node.js](https://nodejs.org/) 18+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm build          # produces .output/chrome-mv3/
```

### Load in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `.output/chrome-mv3` directory

### Development

```bash
pnpm dev            # launches Chrome with hot reload
```

## Tech Stack

- [WXT](https://wxt.dev) — Web extension framework (Manifest V3)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- `@webext-core/messaging` — Type-safe message passing
- `diff` — JSON diff computation
- i18next — Internationalization

## License

MIT
