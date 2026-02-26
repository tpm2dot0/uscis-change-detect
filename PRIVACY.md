# Privacy Policy

**USCIS Change Detect** is a browser extension that helps you track changes to your USCIS case status.

## Data Collection

This extension **does not collect, transmit, or share any personal data**. It has no analytics, no telemetry, and no external servers.

## How It Works

- The extension runs entirely in your browser.
- When you click "Check Changes" on the my.uscis.gov account page, it fetches case data from USCIS APIs using your existing browser session cookies. These requests go directly to `my.uscis.gov` — no third-party servers are involved.
- API responses are stored locally in `chrome.storage.local` on your device so that changes can be detected on your next visit.
- All comparisons and diff computations happen locally in your browser.

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Store previous case data locally for change detection |
| `host_permissions: https://my.uscis.gov/*` | Fetch case data from USCIS APIs using your session |

## Data Storage

- Case data (status, receipt info, event history) is stored in `chrome.storage.local`.
- Data never leaves your device.
- You can remove any tracked case from the extension popup, which deletes all stored data for that case.
- Uninstalling the extension removes all stored data.

## Third-Party Services

This extension does not communicate with any third-party services. The only network requests are to `my.uscis.gov`, initiated by you.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/tpm2dot0/uscis-change-detect).
