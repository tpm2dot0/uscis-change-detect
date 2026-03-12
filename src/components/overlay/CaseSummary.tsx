import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import type { FetchResult } from '@/types/api';
import { parseOverview, parseStatus, parseReceipt, parseTimeline } from '@/lib/case-parser';
import type { CaseOverview, StatusDisplay, ReceiptDisplay } from '@/lib/case-parser';
import { Badge } from '@/components/ui/badge';

interface CaseSummaryProps {
  data: FetchResult;
}

function Field({ label, value, changed }: { label: string; value: string | undefined | null; changed?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm gap-4">
      <span
        className={`shrink-0 ${
          changed
            ? 'font-bold text-foreground underline decoration-orange-400 decoration-[1.5px] underline-offset-[1.5px]'
            : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
      <span
        className={`text-right ${
          changed ? 'font-bold underline decoration-orange-400 decoration-[1.5px] underline-offset-[1.5px]' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function CaseSummary({ data }: CaseSummaryProps) {
  const { t } = useTranslation();
  const overview = parseOverview(data.current.caseDetails);
  const status = parseStatus(data.current.caseStatus);
  const receipt = parseReceipt(data.current.receiptInfo);
  const timeline = parseTimeline(data.current.caseDetails);

  // Parse previous data for field-level change comparison
  const prevOverview = parseOverview(data.previous?.caseDetails ?? null);
  const prevStatus = parseStatus(data.previous?.caseStatus ?? null);
  const prevReceipt = parseReceipt(data.previous?.receiptInfo ?? null);

  const oc = (field: keyof CaseOverview) =>
    data.hasChanges.caseDetails && overview != null && prevOverview != null && overview[field] !== prevOverview[field];
  const sc = (field: keyof StatusDisplay) =>
    data.hasChanges.caseStatus && status != null && prevStatus != null && status[field] !== prevStatus[field];
  const rc = (field: keyof ReceiptDisplay) =>
    data.hasChanges.receiptInfo && receipt != null && prevReceipt != null && receipt[field] !== prevReceipt[field];

  const hasAny = overview || status || receipt;
  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      {/* Overview */}
      {overview && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t('summary.overview')}</h3>
          <div className="space-y-1">
            <Field label={t('summary.formType')} value={overview.formType} changed={oc('formType')} />
            <Field label={t('summary.formName')} value={overview.formName} changed={oc('formName')} />
            <Field label={t('summary.applicant')} value={overview.applicantName} changed={oc('applicantName')} />
            <Field label={t('summary.submitted')} value={overview.submissionDate} changed={oc('submissionDate')} />
            <Field label={t('summary.updatedAt')} value={overview.updatedAt} changed={oc('updatedAt')} />
            <Field label={t('summary.channel')} value={overview.channel} changed={oc('channel')} />
          </div>
        </div>
      )}

      {overview && (status || receipt) && <Separator />}

      {/* Status */}
      {status && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t('summary.statusTitle')}</h3>
          <div className="space-y-1">
            <Field label={t('summary.statusHeading')} value={status.statusTitle} changed={sc('statusTitle')} />
            <Field
              label={t('summary.actionCode')}
              value={`${status.actionCode} - ${status.actionCodeDescription}`}
              changed={sc('actionCode')}
            />
            <Field label={t('summary.actionDate')} value={status.actionDate} changed={sc('actionDate')} />
          </div>
          {status.statusText && (
            <p
              className="text-sm text-muted-foreground mt-1"
              dangerouslySetInnerHTML={{ __html: status.statusText }}
            />
          )}
        </div>
      )}

      {status && receipt && <Separator />}

      {/* Receipt Info */}
      {receipt && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t('summary.receiptTitle')}</h3>
          <div className="space-y-1">
            <Field label={t('summary.form')} value={receipt.form} changed={rc('form')} />
            <Field label={t('summary.location')} value={receipt.location} changed={rc('location')} />
            <Field label={t('summary.receiptDate')} value={receipt.receiptDate} changed={rc('receiptDate')} />
            <Field label={t('summary.subtype')} value={receipt.subtype} changed={rc('subtype')} />
          </div>
        </div>
      )}

      {/* Timeline (events from case details) */}
      {timeline.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t('summary.timeline')}</h3>
            <div className="space-y-2">
              {timeline.map((event, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary" className="text-xs shrink-0 mt-0.5 font-mono min-w-[52px] justify-center">
                    {event.eventCode}
                  </Badge>
                  <div>
                    <div className="font-medium">{event.eventDescription}</div>
                    {event.date && (
                      <div className="text-muted-foreground text-xs">{event.date}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
