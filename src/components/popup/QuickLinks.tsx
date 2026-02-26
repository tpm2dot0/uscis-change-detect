import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickLinks() {
  const { t } = useTranslation();

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2"
      onClick={() => {
        window.open('https://my.uscis.gov/account/applicant', '_blank');
      }}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {t('popup.openUscis')}
    </Button>
  );
}
