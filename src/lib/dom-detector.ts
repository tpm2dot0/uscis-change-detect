/**
 * Detect cases on the USCIS account page.
 *
 * Expected DOM structure on the USCIS account page:
 *   <div role="region" id="region_IOE0000000001" class="uscis-card account-card ...">
 *     <div class="with-margin-ml">
 *       <div class="with-padding-top-lg">
 *         <div><div class="uscis-row"></div>
 *           <h3 class="inline-block">I-765, Application for Employment Authorization</h3>
 *         </div>
 *         <div class="uscis-row ...">
 *           <div class="... case-card-header">
 *             <span>...<b>Submitted on</b> ...</span>
 *             <span><b>Receipt #</b> IOE0000000001</span>
 *           </div>
 *         </div>
 */

const RECEIPT_PATTERN = /[A-Z]{3}\d{10}/;

export interface DetectedCase {
  receiptNumber: string;
  /** The region div wrapping the case card */
  regionEl: HTMLElement;
  /** The h3 element with the form name */
  h3El: HTMLHeadingElement;
}

/**
 * Scan the page for case cards using region elements with id="region_XXX".
 */
export function detectCases(): DetectedCase[] {
  const results: DetectedCase[] = [];
  const regions = document.querySelectorAll<HTMLElement>('div[role="region"][id^="region_"]');

  for (const region of regions) {
    const idMatch = region.id.match(/^region_([A-Z]{3}\d{10})$/);
    if (!idMatch) continue;

    const receiptNumber = idMatch[1];
    const h3 = region.querySelector<HTMLHeadingElement>('h3');
    if (!h3) continue;

    results.push({ receiptNumber, regionEl: region, h3El: h3 });
  }

  // Fallback: scan text nodes for receipt numbers if no region divs found
  if (results.length === 0) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<string>();
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent?.trim() ?? '';
      const match = text.match(RECEIPT_PATTERN);
      if (match && !seen.has(match[0])) {
        seen.add(match[0]);
        // Try to find a nearby h3
        let el: HTMLElement | null = node.parentElement;
        for (let i = 0; i < 6 && el; i++) {
          const h3 = el.querySelector<HTMLHeadingElement>('h3');
          if (h3) {
            results.push({ receiptNumber: match[0], regionEl: el, h3El: h3 });
            break;
          }
          el = el.parentElement;
        }
      }
    }
  }

  return results;
}
