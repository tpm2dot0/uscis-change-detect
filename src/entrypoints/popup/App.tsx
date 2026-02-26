import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendMessage } from '@/lib/messaging';
import type { KnownCase } from '@/types/api';
import { CaseSummaryCard } from '@/components/popup/CaseSummaryCard';
import { QuickLinks } from '@/components/popup/QuickLinks';
import { SettingsPanel } from '@/components/popup/SettingsPanel';
import { Separator } from '@/components/ui/separator';

export default function App() {
  const { t } = useTranslation();
  const [cases, setCases] = useState<KnownCase[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCases = async () => {
    try {
      const result = await sendMessage('getStoredCases', undefined);
      setCases(result);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleClear = async (receiptNumber: string) => {
    await sendMessage('clearCase', { receiptNumber });
    setCases((prev) => prev.filter((c) => c.receiptNumber !== receiptNumber));
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold">{t('popup.title')}</h1>
        <SettingsPanel />
      </div>

      <Separator />

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('popup.loading')}</p>
      ) : cases.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('popup.noCases')}</p>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <CaseSummaryCard key={c.receiptNumber} caseData={c} onClear={handleClear} />
          ))}
        </div>
      )}

      <Separator />
      <QuickLinks />
    </div>
  );
}
