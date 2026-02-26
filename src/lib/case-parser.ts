import type { CaseDetails, CaseStatus, ReceiptInfo, CaseEvent } from '@/types/api';
import { decodeEventCode } from './event-codes';

export interface CaseOverview {
  receiptNumber: string;
  formType: string;
  formName: string;
  applicantName: string;
  submissionDate: string;
  channel: string;
  closed: boolean;
}

export interface StatusDisplay {
  statusTitle: string;
  statusText: string;
  actionCode: string;
  actionCodeDescription: string;
  actionDate: string;
}

export interface ReceiptDisplay {
  form: string;
  location: string;
  receiptDate: string;
  subtype: string;
}

export interface TimelineEvent {
  eventCode: string;
  eventDescription: string;
  date: string;
}

export function parseOverview(details: CaseDetails | null): CaseOverview | null {
  if (!details) return null;
  return {
    receiptNumber: details.receiptNumber,
    formType: details.formType,
    formName: details.formName,
    applicantName: details.applicantName,
    submissionDate: details.submissionDate,
    channel: details.elisChannelType,
    closed: details.closed,
  };
}

export function parseStatus(status: CaseStatus | null): StatusDisplay | null {
  if (!status) return null;
  return {
    statusTitle: status.statusTitle,
    statusText: status.statusText,
    actionCode: status.currentActionCode,
    actionCodeDescription: decodeEventCode(status.currentActionCode),
    actionDate: status.currentActionCodeDate,
  };
}

export function parseReceipt(info: ReceiptInfo | null): ReceiptDisplay | null {
  if (!info?.receipt_details) return null;
  const d = info.receipt_details;
  return {
    form: d.form,
    location: d.location,
    receiptDate: d.receipt_date,
    subtype: d.subtype,
  };
}

export function parseTimeline(details: CaseDetails | null): TimelineEvent[] {
  if (!details?.events) return [];
  return details.events.map((event: CaseEvent) => ({
    eventCode: event.eventCode,
    eventDescription: decodeEventCode(event.eventCode),
    date: event.eventDateTime,
  }));
}
