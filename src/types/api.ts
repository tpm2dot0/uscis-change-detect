/**
 * Real response shapes verified against live USCIS APIs on 2026-02-26.
 * All three endpoints wrap their payload in { data: ... }.
 */

/** Event inside a case */
export interface CaseEvent {
  receiptNumber: string;
  eventId: string;
  eventCode: string;
  createdAt: string;
  createdAtTimestamp: string;
  updatedAt: string;
  updatedAtTimestamp: string;
  eventDateTime: string;
  eventTimestamp: string;
}

/** GET /account/case-service/api/cases/{id} → { data: CaseDetails } */
export interface CaseDetails {
  receiptNumber: string;
  submissionDate: string;
  submissionTimestamp: string;
  formType: string;
  formName: string;
  cmsFailure: boolean;
  closed: boolean;
  ackedByAdjudicatorAndCms: boolean;
  applicantName: string;
  nonElisPaperFiled: boolean;
  noticeMailingPrefIndicator: boolean;
  docMailingPrefIndicator: boolean;
  elisBeneficiaryAddendum: Record<string, unknown>;
  areAllGroupStatusesComplete: boolean;
  areAllGroupMembersAuthorizedForTravel: boolean;
  isPremiumProcessed: boolean;
  actionRequired: boolean;
  elisChannelType: string;
  updatedAt?: string;
  updatedAtTimestamp?: string;
  concurrentCases: unknown[];
  documents: unknown[];
  evidenceRequests: unknown[];
  notices: unknown[];
  events: CaseEvent[];
  addendums: unknown[];
}

/** GET /account/case-service/api/case_status/{id} → { data: CaseStatus } */
export interface CaseStatus {
  receiptNumber: string;
  formType: string;
  currentActionCode: string;
  currentActionCodeDate: string;
  statusTitle: string;
  statusText: string;
  statusTitleSpanish?: string;
  statusTextSpanish?: string;
  message?: string;
  historicalCaseStatuses?: unknown[];
  isPremiumProcessed?: boolean;
  isPremiumRefunded?: boolean;
}

/** GET /secure-messaging/api/case-service/receipt_info/{id} → { data: { receipt_details: ReceiptDetails }, message: string } */
export interface ReceiptDetails {
  form: string;
  location: string;
  milnatz: number;
  onpt: number;
  premproc: number;
  receipt_date: string;
  receipt_number: string;
  subtype: string;
}

export interface ReceiptInfo {
  receipt_details: ReceiptDetails;
}

/** Combined result from background fetch */
export interface FetchResult {
  receiptNumber: string;
  current: {
    caseDetails: CaseDetails | null;
    caseStatus: CaseStatus | null;
    receiptInfo: ReceiptInfo | null;
  };
  previous: {
    caseDetails: CaseDetails | null;
    caseStatus: CaseStatus | null;
    receiptInfo: ReceiptInfo | null;
  } | null;
  hasChanges: {
    caseDetails: boolean;
    caseStatus: boolean;
    receiptInfo: boolean;
  };
  fetchedAt: string;
  error?: string;
}

/** Stored entry per case per endpoint */
export interface StoredCaseEntry {
  receiptNumber: string;
  lastHash: {
    caseDetails: string;
    caseStatus: string;
    receiptInfo: string;
  };
  lastData: {
    caseDetails: CaseDetails | null;
    caseStatus: CaseStatus | null;
    receiptInfo: ReceiptInfo | null;
  };
  previousData: {
    caseDetails: CaseDetails | null;
    caseStatus: CaseStatus | null;
    receiptInfo: ReceiptInfo | null;
  } | null;
  hasChanges: {
    caseDetails: boolean;
    caseStatus: boolean;
    receiptInfo: boolean;
  };
  fetchedAt: string;
}

/** Known case entry in the case list */
export interface KnownCase {
  receiptNumber: string;
  formType: string;
  lastChecked: string;
  hasChanges: boolean;
}
