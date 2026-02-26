import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setLanguagePref } from '@/lib/storage';

export function SettingsPanel() {
  const { i18n } = useTranslation();

  const toggleLang = async () => {
    const next = i18n.language === 'en' ? 'zh' : 'en';
    await i18n.changeLanguage(next);
    await setLanguagePref(next);
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1 text-xs">
      <Globe className="h-3.5 w-3.5" />
      {i18n.language === 'en' ? '中文' : 'EN'}
    </Button>
  );
}
