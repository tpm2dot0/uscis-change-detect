import { test, expect } from './fixture';

test('overlay scrolls and diff ignores key order', async ({ pg }) => {
  await pg.goto('https://my.uscis.gov/account/applicant');
  await pg.waitForLoadState('networkidle');
  await pg.screenshot({ path: 'tests/screenshots/debug-page-state.png' });
  console.log('Page URL:', pg.url());
  await pg.waitForSelector('div[role="region"][id^="region_"]', { timeout: 30_000 });

  const receiptNumber = await pg.evaluate(() => {
    const region = document.querySelector<HTMLElement>('div[role="region"][id^="region_"]');
    return region?.id.match(/^region_([A-Z]{3}\d{10})$/)?.[1] ?? '';
  });

  const apiData = await pg.evaluate(async (rcpt) => {
    async function fetchAndUnwrap(url: string) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? json;
      } catch { return null; }
    }
    return {
      caseDetails: await fetchAndUnwrap(`/account/case-service/api/cases/${rcpt}`),
      caseStatus: await fetchAndUnwrap(`/account/case-service/api/case_status/${rcpt}`),
      receiptInfo: await fetchAndUnwrap(`/secure-messaging/api/case-service/receipt_info/${rcpt}`),
    };
  }, receiptNumber);

  // --- Test 1: key-order diff ---
  // Create "previous" with same values but shuffled key order
  const diffResult = await pg.evaluate((data) => {
    function sortKeys(val: unknown): unknown {
      if (val === null || typeof val !== 'object') return val;
      if (Array.isArray(val)) return (val as unknown[]).map(sortKeys);
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(val as Record<string, unknown>).sort()) {
        sorted[key] = sortKeys((val as Record<string, unknown>)[key]);
      }
      return sorted;
    }

    // Reverse key order of caseStatus to simulate API returning keys differently
    const status = data.caseStatus;
    if (!status) return { error: 'no caseStatus' };
    const reversedStatus: Record<string, unknown> = {};
    const keys = Object.keys(status).reverse();
    for (const k of keys) reversedStatus[k] = (status as any)[k];

    // After sortKeys, they should be identical
    const oldStr = JSON.stringify(sortKeys(reversedStatus), null, 2);
    const newStr = JSON.stringify(sortKeys(status), null, 2);
    return { identical: oldStr === newStr, oldLen: oldStr.length, newLen: newStr.length };
  }, apiData);

  console.log('Key-order diff test:', diffResult);
  expect(diffResult.identical).toBe(true);

  // --- Test 2: scrollable overlay ---
  // Build a tall overlay to test scroll
  await pg.evaluate(({ rcpt, data }) => {
    const overlay = document.createElement('div');
    overlay.id = 'test-scroll-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)';

    const card = document.createElement('div');
    card.style.cssText = 'background:white;border:1px solid #e5e7eb;max-width:640px;width:100%;max-height:85vh;display:flex;flex-direction:column;font-family:system-ui,sans-serif;color:#111';

    // Header (fixed)
    const header = document.createElement('div');
    header.style.cssText = 'padding:16px 24px;border-bottom:1px solid #e5e7eb;flex-shrink:0';
    header.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:18px;font-weight:600">${rcpt}</span>
      <button id="scroll-close" style="border:none;background:none;cursor:pointer;font-size:18px">✕</button>
    </div>`;
    card.appendChild(header);

    // Scrollable content
    const content = document.createElement('div');
    content.id = 'scroll-content';
    content.style.cssText = 'flex:1;min-height:0;overflow-y:auto;padding:16px 24px';

    // Fill with enough content to need scrolling
    let html = '';
    for (let i = 0; i < 50; i++) {
      html += `<div style="padding:8px 0;border-bottom:1px solid #f3f4f6" data-row="${i}">Row ${i}: ${JSON.stringify(data.caseDetails?.formType ?? 'N/A')}</div>`;
    }
    html += `<div id="scroll-bottom-marker">BOTTOM</div>`;
    content.innerHTML = html;
    card.appendChild(content);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }, { rcpt: receiptNumber, data: apiData });

  await pg.waitForTimeout(300);

  // Check that scroll container exists and has overflow
  const scrollInfo = await pg.evaluate(() => {
    const el = document.getElementById('scroll-content');
    if (!el) return { error: 'not found' };
    return {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      isScrollable: el.scrollHeight > el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
    };
  });

  console.log('Scroll info:', scrollInfo);
  expect(scrollInfo.isScrollable).toBe(true);
  expect(scrollInfo.overflowY).toBe('auto');

  // Screenshot before scroll
  await pg.screenshot({ path: 'tests/screenshots/overlay-scroll-top.png' });

  // Scroll to bottom
  await pg.evaluate(() => {
    const el = document.getElementById('scroll-content')!;
    el.scrollTop = el.scrollHeight;
  });
  await pg.waitForTimeout(200);

  // Verify bottom marker is visible
  const bottomVisible = await pg.evaluate(() => {
    const marker = document.getElementById('scroll-bottom-marker');
    if (!marker) return false;
    const rect = marker.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  expect(bottomVisible).toBe(true);
  console.log('Bottom marker visible after scroll:', bottomVisible);

  await pg.screenshot({ path: 'tests/screenshots/overlay-scroll-bottom.png' });

  // Clean up
  await pg.evaluate(() => document.getElementById('test-scroll-overlay')?.remove());
});
