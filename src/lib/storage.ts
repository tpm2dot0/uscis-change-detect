import { storage } from 'wxt/utils/storage';
import type { KnownCase, StoredCaseEntry } from '@/types/api';

/** Get the storage key for a specific case */
function caseKey(receiptNumber: string) {
  return `local:case:${receiptNumber}` as const;
}

/** Store case data */
export async function storeCaseEntry(entry: StoredCaseEntry): Promise<void> {
  await storage.setItem(caseKey(entry.receiptNumber), entry);
}

/** Retrieve stored case data */
export async function getCaseEntry(receiptNumber: string): Promise<StoredCaseEntry | null> {
  return storage.getItem<StoredCaseEntry>(caseKey(receiptNumber));
}

/** Remove stored case data */
export async function removeCaseEntry(receiptNumber: string): Promise<void> {
  await storage.removeItem(caseKey(receiptNumber));
}

/** Get list of known/tracked cases */
export async function getKnownCases(): Promise<KnownCase[]> {
  return (await storage.getItem<KnownCase[]>('local:knownCases')) ?? [];
}

/** Update the known cases list */
export async function setKnownCases(cases: KnownCase[]): Promise<void> {
  await storage.setItem('local:knownCases', cases);
}

/** Add or update a case in the known list */
export async function upsertKnownCase(kc: KnownCase): Promise<void> {
  const cases = await getKnownCases();
  const idx = cases.findIndex((c) => c.receiptNumber === kc.receiptNumber);
  if (idx >= 0) {
    cases[idx] = kc;
  } else {
    cases.push(kc);
  }
  await setKnownCases(cases);
}

/** Remove a case from the known list */
export async function removeKnownCase(receiptNumber: string): Promise<void> {
  const cases = await getKnownCases();
  await setKnownCases(cases.filter((c) => c.receiptNumber !== receiptNumber));
}

/** Get the user's language preference */
export async function getLanguagePref(): Promise<string | null> {
  return storage.getItem<string>('local:languagePref');
}

/** Set the user's language preference */
export async function setLanguagePref(lang: string): Promise<void> {
  await storage.setItem('local:languagePref', lang);
}
