import { describe, it, expect } from 'vitest';
import { parseOverview, parseStatus, parseReceipt, parseTimeline } from './case-parser';
import type { CaseDetails, CaseStatus, ReceiptInfo } from '@/types/api';

// Fake data matching USCIS API shape (all values fabricated)
const fakeCaseDetails: CaseDetails = {
  receiptNumber: 'IOE0000000001',
  submissionDate: '2025-01-15',
  submissionTimestamp: '2025-01-15T00:00:00.000Z',
  formType: 'I-765',
  formName: 'Application for Employment Authorization',
  cmsFailure: false,
  closed: false,
  ackedByAdjudicatorAndCms: true,
  applicantName: 'DOE, JANE',
  nonElisPaperFiled: false,
  noticeMailingPrefIndicator: false,
  docMailingPrefIndicator: false,
  elisBeneficiaryAddendum: {},
  areAllGroupStatusesComplete: false,
  areAllGroupMembersAuthorizedForTravel: true,
  isPremiumProcessed: false,
  actionRequired: false,
  elisChannelType: 'EFile',
  updatedAt: '2025-01-18',
  updatedAtTimestamp: '2025-01-18T07:45:37.979Z',
  concurrentCases: [],
  documents: [],
  evidenceRequests: [],
  notices: [],
  events: [
    {
      receiptNumber: 'IOE0000000001',
      eventId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      eventCode: 'IAF',
      createdAt: '2025-01-15',
      createdAtTimestamp: '2025-01-15T08:17:14.110Z',
      updatedAt: '2025-01-15',
      updatedAtTimestamp: '2025-01-15T08:17:14.110Z',
      eventDateTime: '2025-01-15',
      eventTimestamp: '2025-01-15T13:17:07.000Z',
    },
  ],
  addendums: [],
};

const fakeCaseStatus: CaseStatus = {
  receiptNumber: 'IOE0000000001',
  formType: 'I-765',
  currentActionCode: 'IAF',
  currentActionCodeDate: '2025-01-15T13:17:07.000Z',
  statusTitle: 'Case Was Received and A Receipt Notice Was Sent',
  statusText: 'On January 15, 2025, we received your Form I-765...',
};

const fakeReceiptInfo: ReceiptInfo = {
  receipt_details: {
    form: 'I-765',
    location: 'SCD',
    milnatz: 0,
    onpt: 0,
    premproc: 0,
    receipt_date: 'Wed, 15 Jan 2025 00:00:00 GMT',
    receipt_number: 'IOE0000000001',
    subtype: '147-C3',
  },
};

describe('parseOverview', () => {
  it('returns null for null input', () => {
    expect(parseOverview(null)).toBeNull();
  });

  it('parses real case details', () => {
    const result = parseOverview(fakeCaseDetails);
    expect(result).toEqual({
      receiptNumber: 'IOE0000000001',
      formType: 'I-765',
      formName: 'Application for Employment Authorization',
      applicantName: 'DOE, JANE',
      submissionDate: '2025-01-15',
      channel: 'EFile',
      closed: false,
    });
  });
});

describe('parseStatus', () => {
  it('returns null for null input', () => {
    expect(parseStatus(null)).toBeNull();
  });

  it('parses real case status with event code decode', () => {
    const result = parseStatus(fakeCaseStatus);
    expect(result).toBeTruthy();
    expect(result!.statusTitle).toBe('Case Was Received and A Receipt Notice Was Sent');
    expect(result!.actionCode).toBe('IAF');
    expect(result!.actionCodeDescription).toBe('RECEIPT LETTER EMAILED');
  });
});

describe('parseReceipt', () => {
  it('returns null for null input', () => {
    expect(parseReceipt(null)).toBeNull();
  });

  it('parses real receipt info', () => {
    const result = parseReceipt(fakeReceiptInfo);
    expect(result).toEqual({
      form: 'I-765',
      location: 'SCD',
      receiptDate: 'Wed, 15 Jan 2025 00:00:00 GMT',
      subtype: '147-C3',
    });
  });
});

describe('parseTimeline', () => {
  it('returns empty for null input', () => {
    expect(parseTimeline(null)).toEqual([]);
  });

  it('parses events from case details', () => {
    const result = parseTimeline(fakeCaseDetails);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      eventCode: 'IAF',
      eventDescription: 'RECEIPT LETTER EMAILED',
      date: '2025-01-15',
    });
  });
});
