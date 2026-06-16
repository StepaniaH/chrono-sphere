import { useEffect, useState } from 'react';
import { Calendar, RefreshCw, Layers, Sparkles, Code2, Languages, Moon, Sun, Monitor, ShieldCheck } from 'lucide-react';
import { OffsetCalculator } from './components/OffsetCalculator';
import { IntervalCalculator } from './components/IntervalCalculator';
import { LunarCalculator } from './components/LunarCalculator';
import { usePreferences } from './context/usePreferences';
import './App.css';

function App() {
  const { locale, themeMode, resolvedTheme, toggleLocale, toggleTheme, t } = usePreferences();
  const [activeTab, setActiveTab] = useState<'offset' | 'interval' | 'lunar'>('offset');

  useEffect(() => {
    document.title =
      locale === 'zh'
        ? 'ChronoSphere - 高精度日期计算与时区夏令时审计服务'
        : 'ChronoSphere - Precision date, timezone, and DST calculator';

    const description =
      locale === 'zh'
        ? 'ChronoSphere 是一款支持时区感知与夏令时变更审计的日期计算工具，支持日期偏移、日期区间、农历转换，且全部计算在浏览器本地完成。'
        : 'ChronoSphere is a local-first date calculator with timezone and DST auditing, supporting offsets, intervals, and lunar calendar conversion.';

    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) {
      meta.content = description;
    }
  }, [locale]);

  const themeIcon = themeMode === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
  const ThemeIcon = themeIcon;

  return (
    <div className="app-container fade-in">
      <header className="app-header">
        <div className="app-header-row">
          <div className="logo-container">
            <Calendar className="logo-icon" size={36} />
            <h1 className="app-title">ChronoSphere</h1>
          </div>
          <div className="header-actions">
            <a
              className="header-action-btn"
              href="https://github.com/StepaniaH/chrono-sphere"
              target="_blank"
              rel="noreferrer"
              aria-label={t('actions.github')}
              title={t('actions.github')}
            >
              <Code2 size={18} />
            </a>
            <button
              type="button"
              className="header-action-btn"
              onClick={toggleLocale}
              aria-label={t('actions.locale')}
              title={t('actions.locale')}
            >
              <Languages size={18} />
            </button>
            <button
              type="button"
              className="header-action-btn"
              onClick={toggleTheme}
              aria-label={t('actions.theme')}
              title={`${t('actions.theme')} · ${themeMode === 'system' ? t('actions.themeSystem') : resolvedTheme === 'dark' ? t('actions.themeDark') : t('actions.themeLight')}`}
            >
              <ThemeIcon size={18} />
            </button>
          </div>
        </div>
        <p className="app-subtitle">{t('app.subtitle')}</p>
      </header>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'offset' ? 'active' : ''}`}
          onClick={() => setActiveTab('offset')}
        >
          <RefreshCw size={16} />
          {t('tabs.offset')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'interval' ? 'active' : ''}`}
          onClick={() => setActiveTab('interval')}
        >
          <Layers size={16} />
          {t('tabs.interval')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'lunar' ? 'active' : ''}`}
          onClick={() => setActiveTab('lunar')}
        >
          <Sparkles size={16} />
          {t('tabs.lunar')}
        </button>
      </div>

      <main className="main-card">
        {activeTab === 'offset' && <OffsetCalculator />}
        {activeTab === 'interval' && <IntervalCalculator />}
        {activeTab === 'lunar' && <LunarCalculator />}
      </main>

      <section className="privacy-note" aria-label={t('privacy.label')}>
        <ShieldCheck className="privacy-note-icon" size={18} />
        <span>
          <strong>{t('privacy.label')}</strong>
          {` · ${t('privacy.body')}`}
        </span>
      </section>

      <footer className="app-footer">
        <div>{t('footer.copyright', { year: new Date().getFullYear() })}</div>
        <div>{t('footer.hosted')}</div>
      </footer>
    </div>
  );
}

export default App;
