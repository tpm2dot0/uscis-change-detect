import { useTranslation } from 'react-i18next';
import { Trash2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { KnownCase } from '@/types/api';

interface CaseSummaryCardProps {
  caseData: KnownCase;
  onClear: (receiptNumber: string) => void;
}

export function CaseSummaryCard({ caseData, onClear }: CaseSummaryCardProps) {
  const { t } = useTranslation();
  const lastChecked = new Date(caseData.lastChecked).toLocaleString();

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium font-mono">{caseData.receiptNumber}</span>
              {caseData.hasChanges && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t('popup.changed')}
                </Badge>
              )}
            </div>
            {caseData.formType && (
              <div className="text-xs text-muted-foreground">{caseData.formType}</div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {lastChecked}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => onClear(caseData.receiptNumber)}
            title={t('popup.clearCase')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
