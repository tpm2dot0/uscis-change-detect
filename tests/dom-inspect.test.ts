import { test, expect } from './fixture';

test('inspect DOM structure around receipt numbers', async ({ pg }) => {
  await pg.goto('https://my.uscis.gov/account/applicant');
  // Wait for the case content to render (SPA)
  await pg.waitForSelector('text=/Receipt/', { timeout: 30_000 });
  await pg.waitForTimeout(2000);

  await pg.screenshot({ path: 'tests/screenshots/page-loaded.png', fullPage: true });

  // Find all elements containing text matching receipt pattern
  const receiptInfo = await pg.evaluate(() => {
    const pattern = /[A-Z]{3}\d{10}/;
    const results: { tag: string; text: string; classes: string; parentTag: string; parentClasses: string; parentText: string; grandparentTag: string; outerHTML: string }[] = [];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent?.trim() ?? '';
      if (pattern.test(text)) {
        const el = node.parentElement!;
        const parent = el.parentElement;
        const grandparent = parent?.parentElement;
        results.push({
          tag: el.tagName.toLowerCase(),
          text: text,
          classes: el.className,
          parentTag: parent?.tagName.toLowerCase() ?? 'none',
          parentClasses: parent?.className ?? '',
          parentText: parent?.textContent?.trim().slice(0, 120) ?? '',
          grandparentTag: grandparent?.tagName.toLowerCase() ?? 'none',
          outerHTML: el.outerHTML.slice(0, 500),
        });
      }
    }
    return results;
  });

  console.log('=== Elements containing receipt numbers ===');
  for (const info of receiptInfo) {
    console.log(`  <${info.tag} class="${info.classes}">: "${info.text}"`);
    console.log(`    parent: <${info.parentTag} class="${info.parentClasses}">`);
    console.log(`    parentText: "${info.parentText}"`);
    console.log(`    outerHTML: ${info.outerHTML}`);
    console.log();
  }

  // Check ALL headings (h1-h4) on the page
  const headings = await pg.evaluate(() => {
    return ['h1','h2','h3','h4'].flatMap(tag => {
      return Array.from(document.querySelectorAll(tag)).map(h => ({
        tag,
        text: h.textContent?.trim().slice(0, 150) ?? '',
        classes: h.className,
        outerHTML: h.outerHTML.slice(0, 500),
      }));
    });
  });

  console.log('=== All headings ===');
  for (const h of headings) {
    console.log(`  <${h.tag} class="${h.classes}">: "${h.text}"`);
    console.log(`    html: ${h.outerHTML}`);
    console.log();
  }

  // Dump a generous ancestor of the receipt number
  const caseCardHTML = await pg.evaluate(() => {
    const pattern = /[A-Z]{3}\d{10}/;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent?.trim() ?? '';
      if (pattern.test(text)) {
        // Walk up 5 levels
        let el: HTMLElement | null = node.parentElement;
        for (let i = 0; i < 5 && el?.parentElement; i++) el = el.parentElement;
        return el?.outerHTML.slice(0, 3000) ?? 'walk-up failed';
      }
    }
    return 'not found';
  });

  console.log('=== Case card ancestor (5 levels up from receipt#) ===');
  console.log(caseCardHTML);

  expect(receiptInfo.length).toBeGreaterThan(0);
});
