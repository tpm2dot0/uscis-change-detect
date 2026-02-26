import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import type { FetchResult } from '@/types/api';
import { parseOverview, parseStatus, parseReceipt, parseTimeline } from '@/lib/case-parser';
import { Badge } from '@/components/ui/badge';

interface CaseSummaryProps {
  data: FetchResult;
}

function Field({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function CaseSummary({ data }: CaseSummaryProps) {
  const { t } = useTranslation();
  const overview = parseOverview(data.current.caseDetails);
  const status = parseStatus(data.current.caseStatus);
  const receipt = parseReceipt(data.current.receiptInfo);
  const timeline = parseTimeline(data.current.caseDetails);

  const hasAny = overview || status || receipt;
  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      {/* Overview */}
      {overview && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t('summary.overview')}</h3>
          <div className="space-y-1">
            <Field label={t('summary.formType')} value={overview.formType} />
            <Field label={t('summary.formName')} value={overview.formName} />
            <Field label={t('summary.applicant')} value={overview.applicantName} />
            <Field label={t('summary.submitted')} value={overview.submissionDate} />
            <Field label={t('summary.channel')} value={overview.channel} />
          </div>
        </div>
      )}

      {overview && (status || receipt) && <Separator />}

      {/* Status */}
      {status && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t('summary.statusTitle')}</h3>
          <div className="space-y-1">
            <Field label={t('summary.statusHeading')} value={status.statusTitle} />
            <Field label={t('summary.actionCode')} value={`${status.actionCode} - ${status.actionCodeDescription}`} />
            <Field label={t('summary.actionDate')} value={status.actionDate} />
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
            <Field label={t('summary.form')} value={receipt.form} />
            <Field label={t('summary.location')} value={receipt.location} />
            <Field label={t('summary.receiptDate')} value={receipt.receiptDate} />
            <Field label={t('summary.subtype')} value={receipt.subtype} />
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
                  <Badge variant="secondary" className="text-xs shrink-0 mt-0.5 font-mono">
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
