import { onMessage } from '@/lib/messaging';
import { fetchCaseDetails, fetchCaseStatus, fetchReceiptInfo } from '@/lib/api';
import {
  getCaseEntry,
  storeCaseEntry,
  removeCaseEntry,
  getKnownCases,
  upsertKnownCase,
  removeKnownCase,
} from '@/lib/storage';
import { sha256 } from '@/lib/utils';
import type { FetchResult, StoredCaseEntry } from '@/types/api';

export default defineBackground(() => {
  onMessage('fetchCase', async ({ data }) => {
    const { receiptNumber } = data;
    const fetchedAt = new Date().toISOString();

    // Fetch all 3 APIs in parallel
    const [caseDetails, caseStatus, receiptInfo] = await Promise.all([
      fetchCaseDetails(receiptNumber),
      fetchCaseStatus(receiptNumber),
      fetchReceiptInfo(receiptNumber),
    ]);

    // If all failed, return error
    if (!caseDetails && !caseStatus && !receiptInfo) {
      return {
        receiptNumber,
        current: { caseDetails: null, caseStatus: null, receiptInfo: null },
        previous: null,
        hasChanges: { caseDetails: false, caseStatus: false, receiptInfo: false },
        fetchedAt,
        error: 'All API calls failed. Make sure you are logged in to my.uscis.gov.',
      } satisfies FetchResult;
    }

    // Hash current responses
    const currentHashes = {
      caseDetails: await sha256(JSON.stringify(caseDetails)),
      caseStatus: await sha256(JSON.stringify(caseStatus)),
      receiptInfo: await sha256(JSON.stringify(receiptInfo)),
    };

    // Get previously stored entry
    const stored = await getCaseEntry(receiptNumber);

    // Determine changes
    const hasChanges = {
      caseDetails: stored ? stored.lastHash.caseDetails !== currentHashes.caseDetails : false,
      caseStatus: stored ? stored.lastHash.caseStatus !== currentHashes.caseStatus : false,
      receiptInfo: stored ? stored.lastHash.receiptInfo !== currentHashes.receiptInfo : false,
    };

    // Build new stored entry
    const newEntry: StoredCaseEntry = {
      receiptNumber,
      lastHash: currentHashes,
      lastData: { caseDetails, caseStatus, receiptInfo },
      previousData: stored?.lastData ?? null,
      hasChanges,
      fetchedAt,
    };

    await storeCaseEntry(newEntry);

    // Update known cases list
    await upsertKnownCase({
      receiptNumber,
      formType: caseDetails?.formType ?? receiptInfo?.receipt_details?.form ?? '',
      lastChecked: fetchedAt,
      hasChanges: hasChanges.caseDetails || hasChanges.caseStatus || hasChanges.receiptInfo,
    });

    return {
      receiptNumber,
      current: { caseDetails, caseStatus, receiptInfo },
      previous: stored?.lastData ?? null,
      hasChanges,
      fetchedAt,
    } satisfies FetchResult;
  });

  onMessage('getStoredCases', async () => {
    return getKnownCases();
  });

  onMessage('clearCase', async ({ data }) => {
    const { receiptNumber } = data;
    await removeCaseEntry(receiptNumber);
    await removeKnownCase(receiptNumber);
  });
});
