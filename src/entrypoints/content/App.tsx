import { useEffect, useState, useCallback } from 'react';
import { detectCases } from '@/lib/dom-detector';
import { sendMessage } from '@/lib/messaging';
import type { FetchResult } from '@/types/api';
import { CaseOverlay } from '@/components/overlay/CaseOverlay';

const BUTTON_ATTR = 'data-uscis-detect-btn';

export default function App() {
  const [overlayData, setOverlayData] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheck = useCallback(async (receiptNumber: string) => {
    setLoading(receiptNumber);
    try {
      const result = await sendMessage('fetchCase', { receiptNumber });
      setOverlayData(result);
    } catch (err) {
      console.error('Failed to fetch case:', err);
    } finally {
      setLoading(null);
    }
  }, []);

  const injectButtons = useCallback(() => {
    const cases = detectCases();
    for (const { receiptNumber, h3El } of cases) {
      const parent = h3El.parentElement;
      if (!parent) continue;

      // Skip if button already injected
      if (parent.querySelector(`[${BUTTON_ATTR}="${receiptNumber}"]`)) continue;

      // Make parent flex for inline button next to h3
      parent.style.display = 'flex';
      parent.style.alignItems = 'center';
      parent.style.gap = '8px';
      parent.style.flexWrap = 'wrap';

      const btn = document.createElement('button');
      btn.setAttribute(BUTTON_ATTR, receiptNumber);
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

      btn.addEventListener('mouseenter', () => { btn.style.background = '#e5e7eb'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = '#f9fafb'; });
      btn.addEventListener('click', () => handleCheck(receiptNumber));

      parent.appendChild(btn);
    }
  }, [handleCheck]);

  useEffect(() => {
    injectButtons();

    const observer = new MutationObserver(() => {
      injectButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [injectButtons]);

  // Update button text when loading
  useEffect(() => {
    if (loading) {
      const btn = document.querySelector(`[${BUTTON_ATTR}="${loading}"]`) as HTMLButtonElement | null;
      if (btn) {
        btn.textContent = 'Checking...';
        btn.disabled = true;
      }
    }
    return () => {
      if (loading) {
        const btn = document.querySelector(`[${BUTTON_ATTR}="${loading}"]`) as HTMLButtonElement | null;
        if (btn) {
          btn.textContent = 'Check Changes';
          btn.disabled = false;
        }
      }
    };
  }, [loading]);

  if (!overlayData) return null;

  return <CaseOverlay data={overlayData} onClose={() => setOverlayData(null)} />;
}
