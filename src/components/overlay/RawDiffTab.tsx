import { useTranslation } from 'react-i18next';
import { DiffViewer } from './DiffViewer';
import type { FetchResult } from '@/types/api';

interface RawDiffTabProps {
  data: FetchResult;
}

const ENDPOINTS = ['caseDetails', 'caseStatus', 'receiptInfo'] as const;

export function RawDiffTab({ data }: RawDiffTabProps) {
  const { t } = useTranslation();
  const hasPrevious = data.previous !== null;

  if (!hasPrevious) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('overlay.noHistory')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {ENDPOINTS.map((key) => (
        <DiffViewer
          key={key}
          label={t(`overlay.${key}`)}
          oldObj={data.previous?.[key] ?? null}
          newObj={data.current[key]}
        />
      ))}
    </div>
  );
}
