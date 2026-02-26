import { test, expect } from './fixture';

test('inject DOM detector and button into live page', async ({ pg }) => {
  await pg.goto('https://my.uscis.gov/account/applicant');
  await pg.waitForSelector('div[role="region"][id^="region_"]', { timeout: 30_000 });

  // Inject the DOM detector code
  const detected = await pg.evaluate(() => {
    const results: { receiptNumber: string; h3Text: string; regionId: string }[] = [];
    const regions = document.querySelectorAll<HTMLElement>('div[role="region"][id^="region_"]');
    for (const region of regions) {
      const idMatch = region.id.match(/^region_([A-Z]{3}\d{10})$/);
      if (!idMatch) continue;
      const h3 = region.querySelector<HTMLHeadingElement>('h3');
      if (!h3) continue;
      results.push({
        receiptNumber: idMatch[1],
        h3Text: h3.textContent?.trim() ?? '',
        regionId: region.id,
      });
    }
    return results;
  });

  console.log('Detected cases:', detected);
  expect(detected.length).toBeGreaterThan(0);
  expect(detected[0].receiptNumber).toMatch(/^[A-Z]{3}\d{10}$/);

  // Now inject a button next to the h3
  await pg.evaluate((cases) => {
    for (const c of cases) {
      const region = document.getElementById(c.regionId);
      if (!region) continue;
      const h3 = region.querySelector('h3');
      if (!h3) continue;
      const parent = h3.parentElement;
      if (!parent) continue;

      parent.style.display = 'flex';
      parent.style.alignItems = 'center';
      parent.style.gap = '8px';
      parent.style.flexWrap = 'wrap';

      const btn = document.createElement('button');
      btn.setAttribute('data-uscis-detect-btn', c.receiptNumber);
      btn.textContent = 'Check Changes';
      btn.style.cssText = [
        'font-size: 12px',
        'padding: 2px 8px',
        'border: 1px solid #6b7280',
        'border-radius: 0',
        'background: #f9fafb',
        'color: #374151',
        'cursor: pointer',
        'font-family: system-ui, sans-serif',
        'white-space: nowrap',
      ].join(';');
      parent.appendChild(btn);
    }
  }, detected);

  // Screenshot to verify button injection
  await pg.screenshot({ path: 'tests/screenshots/button-injected.png', fullPage: true });

  // Verify button exists in DOM
  const btnCount = await pg.locator('[data-uscis-detect-btn]').count();
  console.log('Buttons injected:', btnCount);
  expect(btnCount).toBe(detected.length);
});
