import { test, expect } from './fixture';

test('overlay tabs: summary and raw diff', async ({ pg }) => {
  await pg.goto('https://my.uscis.gov/account/applicant');
  await pg.waitForSelector('div[role="region"][id^="region_"]', { timeout: 30_000 });

  // Fetch real data
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

  // Inject an overlay with two tabs, simulating "first check" (no previous data)
  // and then "has changes" (with fake previous data that differs)
  await pg.evaluate(({ rcpt, data }) => {
    // --- helpers ---
    function createPatchSimple(label: string, oldStr: string, newStr: string): string | null {
      if (oldStr === newStr) return null;
      const oldLines = oldStr.split('\n');
      const newLines = newStr.split('\n');
      let patch = `--- previous\n+++ current\n@@ -1 +1 @@\n`;
      for (const line of oldLines) {
        if (!newLines.includes(line)) patch += `-${line}\n`;
      }
      for (const line of newLines) {
        if (!oldLines.includes(line)) patch += `+${line}\n`;
      }
      // also add a few matching context lines
      for (const line of oldLines) {
        if (newLines.includes(line)) patch += ` ${line}\n`;
      }
      return patch;
    }

    // Create fake previous data (modify a few fields to simulate changes)
    const prevCaseStatus = data.caseStatus
      ? { ...data.caseStatus, statusTitle: 'Case Was Received' }
      : null;

    const endpoints = [
      { key: 'caseDetails', label: 'Case Details', prev: data.caseDetails, curr: data.caseDetails },
      { key: 'caseStatus', label: 'Case Status', prev: prevCaseStatus, curr: data.caseStatus },
      { key: 'receiptInfo', label: 'Receipt Info', prev: data.receiptInfo, curr: data.receiptInfo },
    ];

    // Build diff patches
    const diffs = endpoints.map(ep => {
      const oldStr = JSON.stringify(ep.prev, null, 2) + '\n';
      const newStr = JSON.stringify(ep.curr, null, 2) + '\n';
      const patch = createPatchSimple(ep.label, oldStr, newStr);
      return { key: ep.key, label: ep.label, patch, hasChange: patch !== null };
    });

    // --- build overlay DOM ---
    const overlay = document.createElement('div');
    overlay.id = 'test-overlay-tabs';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)';

    const card = document.createElement('div');
    card.style.cssText = 'background:white;border:1px solid #e5e7eb;max-width:640px;width:100%;max-height:85vh;display:flex;flex-direction:column;font-family:system-ui,sans-serif;color:#111';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'padding:16px 24px 0;display:flex;flex-direction:column';
    header.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px;font-weight:600">${rcpt}</span>
          <span style="background:#fef2f2;color:#dc2626;padding:1px 8px;font-size:12px;font-weight:600">Changed</span>
        </div>
        <button id="tab-close" style="border:none;background:none;cursor:pointer;font-size:18px">✕</button>
      </div>
    `;

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;border-bottom:1px solid #e5e7eb';

    function makeTab(label: string, id: string, active: boolean, dot: boolean) {
      const btn = document.createElement('button');
      btn.id = id;
      btn.type = 'button';
      btn.style.cssText = `padding:8px 16px;font-size:14px;font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid ${active ? '#18181b' : 'transparent'};color:${active ? '#18181b' : '#6b7280'}`;
      btn.textContent = label;
      if (dot) {
        const d = document.createElement('span');
        d.style.cssText = 'display:inline-block;width:6px;height:6px;border-radius:50%;background:#dc2626;margin-left:6px;vertical-align:middle';
        btn.appendChild(d);
      }
      return btn;
    }

    const tabSummary = makeTab('Summary', 'tab-summary', true, false);
    const tabDiff = makeTab('Raw Diff', 'tab-diff', false, true);
    tabBar.append(tabSummary, tabDiff);
    header.appendChild(tabBar);
    card.appendChild(header);

    // Content area
    const content = document.createElement('div');
    content.id = 'tab-content';
    content.style.cssText = 'padding:16px 24px 24px;overflow-y:auto;flex:1';
    card.appendChild(content);

    // --- Summary panel ---
    function renderSummary() {
      let html = '';
      if (data.caseDetails) {
        const d = data.caseDetails;
        html += `<h3 style="font-size:14px;font-weight:600;margin:0 0 8px">Overview</h3>`;
        html += `<div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Form Type</span><span>${d.formType}</span></div>`;
        html += `<div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Form Name</span><span>${d.formName}</span></div>`;
        html += `<div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Applicant</span><span>${d.applicantName}</span></div>`;
        html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0">`;
      }
      if (data.caseStatus) {
        html += `<h3 style="font-size:14px;font-weight:600;margin:0 0 8px">Status</h3>`;
        html += `<div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Status</span><span>${data.caseStatus.statusTitle}</span></div>`;
        html += `<div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Action Code</span><span>${data.caseStatus.currentActionCode}</span></div>`;
        html += `<hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0">`;
      }
      if (data.receiptInfo?.receipt_details) {
        const r = data.receiptInfo.receipt_details;
        html += `<h3 style="font-size:14px;font-weight:600;margin:0 0 8px">Receipt Info</h3>`;
        html += `<div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Form</span><span>${r.form}</span></div>`;
        html += `<div style="font-size:14px;display:flex;justify-content:space-between"><span style="color:#6b7280">Location</span><span>${r.location}</span></div>`;
      }
      return html;
    }

    // --- Diff panel ---
    function renderDiffPanel() {
      let html = '';
      for (const d of diffs) {
        html += `<div style="margin-bottom:12px">`;
        html += `<div style="font-size:14px;font-weight:500;margin-bottom:4px">${d.label}${d.hasChange ? '' : ' <span style="color:#6b7280">— no changes</span>'}</div>`;
        if (d.patch) {
          html += `<pre style="overflow-x:auto;border:1px solid #e5e7eb;background:#fafafa;padding:8px;font-size:12px;font-family:monospace;line-height:1.6;margin:0">`;
          for (const line of d.patch.split('\n')) {
            let bg = '';
            let color = '';
            if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
              bg = '#eff6ff'; color = '#1d4ed8';
            } else if (line.startsWith('+')) {
              bg = '#f0fdf4'; color = '#166534';
            } else if (line.startsWith('-')) {
              bg = '#fef2f2'; color = '#991b1b';
            }
            html += `<div style="background:${bg};color:${color}">${line.replace(/</g, '&lt;') || '&nbsp;'}</div>`;
          }
          html += `</pre>`;
        }
        html += `</div>`;
      }
      return html;
    }

    content.innerHTML = renderSummary();

    // Tab switching
    tabSummary.addEventListener('click', () => {
      tabSummary.style.borderBottomColor = '#18181b'; tabSummary.style.color = '#18181b';
      tabDiff.style.borderBottomColor = 'transparent'; tabDiff.style.color = '#6b7280';
      content.innerHTML = renderSummary();
    });
    tabDiff.addEventListener('click', () => {
      tabDiff.style.borderBottomColor = '#18181b'; tabDiff.style.color = '#18181b';
      tabSummary.style.borderBottomColor = 'transparent'; tabSummary.style.color = '#6b7280';
      content.innerHTML = renderDiffPanel();
    });

    document.getElementById('tab-close')?.addEventListener('click', () => overlay.remove());

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }, { rcpt: receiptNumber, data: apiData });

  await pg.waitForTimeout(300);

  // Screenshot Summary tab
  await pg.screenshot({ path: 'tests/screenshots/overlay-tab-summary.png' });

  // Verify summary tab is visible
  const summaryText = await pg.locator('#tab-content').textContent();
  expect(summaryText).toContain('Overview');
  expect(summaryText).toContain('I-765');
  console.log('Summary tab renders correctly');

  // Switch to Raw Diff tab
  await pg.click('#tab-diff');
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: 'tests/screenshots/overlay-tab-rawdiff.png' });

  // Verify diff tab content
  const diffText = await pg.locator('#tab-content').textContent();
  expect(diffText).toContain('Case Details');
  expect(diffText).toContain('Case Status');
  expect(diffText).toContain('Receipt Info');
  // Case Status should have a diff (we faked a change)
  expect(diffText).toContain('Case Was Received');
  console.log('Raw Diff tab renders correctly with diff content');

  // Switch back to Summary
  await pg.click('#tab-summary');
  await pg.waitForTimeout(200);
  const backToSummary = await pg.locator('#tab-content').textContent();
  expect(backToSummary).toContain('Overview');
  console.log('Tab switching works correctly');

  // Clean up
  await pg.evaluate(() => document.getElementById('test-overlay-tabs')?.remove());
});
