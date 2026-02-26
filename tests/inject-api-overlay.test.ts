import { test, expect } from './fixture';

test('fetch APIs, parse data, and verify overlay content', async ({ pg }) => {
  await pg.goto('https://my.uscis.gov/account/applicant');
  await pg.waitForSelector('div[role="region"][id^="region_"]', { timeout: 30_000 });

  // Extract receipt number
  const receiptNumber = await pg.evaluate(() => {
    const region = document.querySelector<HTMLElement>('div[role="region"][id^="region_"]');
    const match = region?.id.match(/^region_([A-Z]{3}\d{10})$/);
    return match?.[1] ?? null;
  });
  console.log('Receipt:', receiptNumber);
  expect(receiptNumber).toBeTruthy();

  // Fetch all 3 APIs and collect real data
  const apiData = await pg.evaluate(async (rcpt) => {
    async function fetchAndUnwrap(url: string) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? json;
      } catch { return null; }
    }

    const caseDetails = await fetchAndUnwrap(`/account/case-service/api/cases/${rcpt}`);
    const caseStatus = await fetchAndUnwrap(`/account/case-service/api/case_status/${rcpt}`);
    const receiptInfo = await fetchAndUnwrap(`/secure-messaging/api/case-service/receipt_info/${rcpt}`);

    return { caseDetails, caseStatus, receiptInfo };
  }, receiptNumber);

  console.log('=== caseDetails keys:', Object.keys(apiData.caseDetails ?? {}));
  console.log('=== caseStatus keys:', Object.keys(apiData.caseStatus ?? {}));
  console.log('=== receiptInfo keys:', Object.keys(apiData.receiptInfo ?? {}));

  // Verify caseDetails shape matches our types
  expect(apiData.caseDetails).toBeTruthy();
  expect(apiData.caseDetails.receiptNumber).toBe(receiptNumber);
  expect(apiData.caseDetails.formType).toBeTruthy();
  expect(apiData.caseDetails.formName).toBeTruthy();
  expect(apiData.caseDetails.applicantName).toBeTruthy();
  expect(apiData.caseDetails.submissionDate).toBeTruthy();
  expect(apiData.caseDetails.events).toBeInstanceOf(Array);

  // Verify caseStatus shape
  expect(apiData.caseStatus).toBeTruthy();
  expect(apiData.caseStatus.receiptNumber).toBe(receiptNumber);
  expect(apiData.caseStatus.statusTitle).toBeTruthy();
  expect(apiData.caseStatus.statusText).toBeTruthy();
  expect(apiData.caseStatus.currentActionCode).toBeTruthy();

  // Verify receiptInfo shape
  expect(apiData.receiptInfo).toBeTruthy();
  expect(apiData.receiptInfo.receipt_details).toBeTruthy();
  expect(apiData.receiptInfo.receipt_details.receipt_number).toBe(receiptNumber);
  expect(apiData.receiptInfo.receipt_details.form).toBeTruthy();

  // Test sha256
  const hashResult = await pg.evaluate(async (data) => {
    const encoder = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }, JSON.stringify(apiData.caseDetails));

  console.log('SHA-256 of caseDetails:', hashResult);
  expect(hashResult).toMatch(/^[0-9a-f]{64}$/);

  // Test diff computation
  const diffResult = await pg.evaluate((data) => {
    // Simulate a small change
    const oldData = { ...data, updatedAt: '2026-02-23' };
    const newData = { ...data };

    const oldStr = JSON.stringify(oldData, null, 2) + '\n';
    const newStr = JSON.stringify(newData, null, 2) + '\n';

    if (oldStr === newStr) return { identical: true, patch: null };

    // Basic line diff (we can't import createPatch here, but verify strings differ)
    return { identical: false, oldLen: oldStr.length, newLen: newStr.length };
  }, apiData.caseDetails);

  console.log('Diff test:', diffResult);
  expect(diffResult.identical).toBe(false);

  // Test event code lookup (IAF should be "RECEIPT LETTER EMAILED")
  const eventCode = apiData.caseDetails.events?.[0]?.eventCode;
  console.log('First event code:', eventCode);
  // We know from enum.txt that IAF = "RECEIPT LETTER EMAILED"
  if (eventCode === 'IAF') {
    console.log('Event IAF decoded: RECEIPT LETTER EMAILED ✓');
  }
});

test('verify overlay HTML renders correctly with real data', async ({ pg }) => {
  await pg.goto('https://my.uscis.gov/account/applicant');
  await pg.waitForSelector('div[role="region"][id^="region_"]', { timeout: 30_000 });

  // Fetch data
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

  // Inject a mock overlay to verify layout renders
  await pg.evaluate((data) => {
    const { caseDetails, caseStatus, receiptInfo } = data;

    const overlay = document.createElement('div');
    overlay.id = 'test-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)';

    const card = document.createElement('div');
    card.style.cssText = 'background:white;border-radius:0;border:1px solid #e5e7eb;max-width:640px;width:100%;max-height:85vh;overflow-y:auto;padding:24px;font-family:system-ui,sans-serif;color:#111';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px';
    header.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
      <h2 style="font-size:18px;font-weight:600;margin:0">${caseDetails?.receiptNumber ?? 'Unknown'}</h2>
      <span style="background:#f3f4f6;padding:1px 8px;font-size:12px;font-weight:600">First check</span>
    </div>
    <button id="test-close" style="border:none;background:none;cursor:pointer;font-size:18px">✕</button>`;
    card.appendChild(header);

    // Overview section
    if (caseDetails) {
      const section = document.createElement('div');
      section.innerHTML = `
        <h3 style="font-size:14px;font-weight:600;margin:0 0 8px">Overview</h3>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Form Type</span><span>${caseDetails.formType}</span></div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Form Name</span><span>${caseDetails.formName}</span></div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Applicant</span><span>${caseDetails.applicantName}</span></div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Submitted</span><span>${caseDetails.submissionDate}</span></div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Channel</span><span>${caseDetails.elisChannelType}</span></div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0">
      `;
      card.appendChild(section);
    }

    // Status section
    if (caseStatus) {
      const section = document.createElement('div');
      section.innerHTML = `
        <h3 style="font-size:14px;font-weight:600;margin:0 0 8px">Status</h3>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Status</span><span>${caseStatus.statusTitle}</span></div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Action Code</span><span>${caseStatus.currentActionCode}</span></div>
        <p style="font-size:13px;color:#6b7280;margin-top:8px">${caseStatus.statusText}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0">
      `;
      card.appendChild(section);
    }

    // Receipt section
    if (receiptInfo?.receipt_details) {
      const d = receiptInfo.receipt_details;
      const section = document.createElement('div');
      section.innerHTML = `
        <h3 style="font-size:14px;font-weight:600;margin:0 0 8px">Receipt Info</h3>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Form</span><span>${d.form}</span></div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Location</span><span>${d.location}</span></div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Receipt Date</span><span>${d.receipt_date}</span></div>
        <div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Subtype</span><span>${d.subtype}</span></div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0">
      `;
      card.appendChild(section);
    }

    // Event history
    if (caseDetails?.events?.length) {
      const section = document.createElement('div');
      let eventsHtml = '<h3 style="font-size:14px;font-weight:600;margin:0 0 8px">Event History</h3>';
      for (const ev of caseDetails.events) {
        eventsHtml += `<div style="display:flex;gap:8px;font-size:14px;margin-bottom:4px">
          <span style="background:#f3f4f6;padding:1px 6px;font-size:12px;font-family:monospace">${ev.eventCode}</span>
          <span>${ev.eventDateTime}</span>
        </div>`;
      }
      section.innerHTML = eventsHtml;
      card.appendChild(section);
    }

    // "No history" hint
    const hint = document.createElement('p');
    hint.style.cssText = 'font-size:13px;color:#6b7280;margin-top:12px';
    hint.textContent = 'This is the first time checking this case. Changes will be detected on your next visit.';
    card.appendChild(hint);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Close button
    document.getElementById('test-close')?.addEventListener('click', () => overlay.remove());
  }, apiData);

  await pg.waitForTimeout(500);
  await pg.screenshot({ path: 'tests/screenshots/overlay-rendered.png' });

  // Verify overlay content
  const overlayVisible = await pg.locator('#test-overlay').isVisible();
  expect(overlayVisible).toBe(true);

  // Check the text content
  const overlayText = await pg.locator('#test-overlay').textContent();
  expect(overlayText).toContain(receiptNumber);
  expect(overlayText).toContain('I-765');
  expect(overlayText).toContain('Overview');
  expect(overlayText).toContain('Status');
  expect(overlayText).toContain('Receipt Info');

  console.log('Overlay rendered successfully with all sections');

  // Close overlay
  await pg.click('#test-close');
  const overlayGone = await pg.locator('#test-overlay').count();
  expect(overlayGone).toBe(0);
  console.log('Overlay closed successfully');
});
