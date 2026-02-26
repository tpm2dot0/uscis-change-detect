import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CaseSummary } from './CaseSummary';
import { RawDiffTab } from './RawDiffTab';
import type { FetchResult } from '@/types/api';
import '@/i18n';

interface CaseOverlayProps {
  data: FetchResult;
  onClose: () => void;
}

type Tab = 'summary' | 'diff';

export function CaseOverlay({ data, onClose }: CaseOverlayProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const anyChanges = data.hasChanges.caseDetails || data.hasChanges.caseStatus || data.hasChanges.receiptInfo;
  const hasPrevious = data.previous !== null;

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-5xl max-h-[85vh] flex flex-col m-4">
        <CardHeader className="flex flex-col space-y-0 pb-0">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{data.receiptNumber}</CardTitle>
              {anyChanges && (
                <Badge variant="destructive" className="text-xs">
                  {t('overlay.changed')}
                </Badge>
              )}
              {!hasPrevious && (
                <Badge variant="secondary" className="text-xs">
                  {t('overlay.firstCheck')}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'summary'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              {t('overlay.tabSummary')}
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'diff'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('diff')}
            >
              {t('overlay.tabRawDiff')}
              {anyChanges && (
                <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>
          </div>
        </CardHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <CardContent className="space-y-4 pt-4">
            {data.error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{data.error}</span>
              </div>
            )}

            {activeTab === 'summary' && (
              <>
                <CaseSummary data={data} />
                {!hasPrevious && !data.error && (
                  <p className="text-sm text-muted-foreground">
                    {t('overlay.noHistory')}
                  </p>
                )}
                {hasPrevious && !anyChanges && !data.error && (
                  <p className="text-sm text-muted-foreground">
                    {t('overlay.noChanges')}
                  </p>
                )}
              </>
            )}

            {activeTab === 'diff' && <RawDiffTab data={data} />}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
