import { test, expect } from './fixture';

test('test all 3 API endpoints from page context', async ({ pg }) => {
  await pg.goto('https://my.uscis.gov/account/applicant');
  await pg.waitForSelector('text=/Receipt/', { timeout: 30_000 });

  // Extract receipt number from page
  const receiptNumber = await pg.evaluate(() => {
    const match = document.body.innerHTML.match(/[A-Z]{3}\d{10}/);
    return match?.[0] ?? null;
  });
  console.log('Receipt number:', receiptNumber);
  expect(receiptNumber).toBeTruthy();

  // Test all 3 API endpoints
  const results = await pg.evaluate(async (rcpt) => {
    const endpoints = [
      { name: 'caseDetails', url: `/account/case-service/api/cases/${rcpt}` },
      { name: 'caseStatus', url: `/account/case-service/api/case_status/${rcpt}` },
      { name: 'receiptInfo', url: `/secure-messaging/api/case-service/receipt_info/${rcpt}` },
    ];

    const out: Record<string, { status: number; ok: boolean; data: any; error?: string }> = {};

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, { credentials: 'include' });
        const data = res.ok ? await res.json() : await res.text();
        out[ep.name] = { status: res.status, ok: res.ok, data };
      } catch (err: any) {
        out[ep.name] = { status: 0, ok: false, data: null, error: err.message };
      }
    }
    return out;
  }, receiptNumber);

  for (const [name, result] of Object.entries(results)) {
    console.log(`\n=== ${name} (status: ${result.status}, ok: ${result.ok}) ===`);
    if (result.error) {
      console.log('ERROR:', result.error);
    } else if (result.ok) {
      console.log('Keys:', Object.keys(result.data));
      console.log('Data:', JSON.stringify(result.data, null, 2).slice(0, 1000));
    } else {
      console.log('Response:', typeof result.data === 'string' ? result.data.slice(0, 300) : result.data);
    }
  }

  // Also check the embedded JSON data from React on Rails
  const embeddedData = await pg.evaluate(() => {
    const script = document.querySelector('script.js-react-on-rails-component[data-component-name="CaseCardsApp"]');
    if (!script) return null;
    try {
      return JSON.parse(script.textContent ?? '');
    } catch {
      return null;
    }
  });

  console.log('\n=== Embedded CaseCardsApp JSON ===');
  if (embeddedData) {
    console.log('Keys:', Object.keys(embeddedData));
    if (embeddedData.cases?.[0]) {
      console.log('Case keys:', Object.keys(embeddedData.cases[0]));
      console.log('Case data:', JSON.stringify(embeddedData.cases[0], null, 2).slice(0, 2000));
    }
  } else {
    console.log('Not found');
  }

  // At least check we got some results
  const anyOk = Object.values(results).some(r => r.ok);
  if (!anyOk) {
    console.log('\nWARNING: No API endpoints returned OK. Embedded data available:', !!embeddedData);
  }
});
