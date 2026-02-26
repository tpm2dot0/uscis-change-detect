import type { CaseDetails, CaseStatus, ReceiptInfo } from '@/types/api';

const BASE = 'https://my.uscis.gov';

async function fetchAndUnwrap<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    // All 3 USCIS endpoints wrap payload in { data: ... }
    return (json.data ?? json) as T;
  } catch {
    return null;
  }
}

export function fetchCaseDetails(receiptNumber: string): Promise<CaseDetails | null> {
  return fetchAndUnwrap<CaseDetails>(
    `${BASE}/account/case-service/api/cases/${receiptNumber}`
  );
}

export function fetchCaseStatus(receiptNumber: string): Promise<CaseStatus | null> {
  return fetchAndUnwrap<CaseStatus>(
    `${BASE}/account/case-service/api/case_status/${receiptNumber}`
  );
}

export function fetchReceiptInfo(receiptNumber: string): Promise<ReceiptInfo | null> {
  return fetchAndUnwrap<ReceiptInfo>(
    `${BASE}/secure-messaging/api/case-service/receipt_info/${receiptNumber}`
  );
}
