import { defineExtensionMessaging } from '@webext-core/messaging';
import type { FetchResult, KnownCase } from '@/types/api';

interface ProtocolMap {
  fetchCase(data: { receiptNumber: string }): FetchResult;
  getStoredCases(): KnownCase[];
  clearCase(data: { receiptNumber: string }): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
