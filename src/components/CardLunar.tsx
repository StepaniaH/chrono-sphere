import React from 'react';
import { utcOffsetLabel } from '../utils/cardHelpers';
import type { Locale } from '../i18n';

interface CardLunarProps {
  customText: string;
  lunarYear: number; lunarMonth: number; lunarDay: number; isLeap: boolean;
  lunarStr: string; yearGanZhi: string; shengXiao: string;
  solarDate: string; weekday: string; zone: string;
  jieQi?: string; festivals?: string[];
  auspicious?: string[]; inauspicious?: string[];
  code: string; theme: 'auto' | 'light' | 'dark'; locale: Locale;
}

const Brand: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/>
  </svg>
);

function trunc(items: string[] | undefined, max: number, loc: Locale): string[] {
  if (!items || items.length === 0) return [];
  if (items.length <= max) return items;
  return [...items.slice(0, max), loc === 'zh' ? `…等${items.length - max}项` : `…+${items.length - max}`];
}

const LUNAR_MONTH_ZH = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];

export const CardLunar: React.FC<CardLunarProps> = ({
  customText, lunarStr, yearGanZhi, shengXiao, solarDate, weekday, zone,
  jieQi, festivals, auspicious, inauspicious, code, theme, locale,
  lunarMonth, isLeap,
}) => {
  const utc = utcOffsetLabel(zone);
  const zh = locale === 'zh';
  const hasYi = auspicious && auspicious.length > 0;
  const hasJi = inauspicious && inauspicious.length > 0;
  const hasYiJi = hasYi || hasJi;
  const hasSpecial = !!(jieQi || (festivals && festivals.length > 0));

  const tagJieqi = {
    color: 'var(--color-success)',
    background: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
    borderColor: 'color-mix(in srgb, var(--color-success) 20%, transparent)',
  };
  const tagFestival = {
    color: 'var(--accent-secondary)',
    background: 'color-mix(in srgb, var(--accent-secondary) 10%, transparent)',
    borderColor: 'color-mix(in srgb, var(--accent-secondary) 20%, transparent)',
  };

  const monthName = isLeap
    ? (zh ? `闰${LUNAR_MONTH_ZH[lunarMonth - 1] || ''}` : `Leap ${lunarMonth}th`)
    : (zh ? LUNAR_MONTH_ZH[lunarMonth - 1] || '' : `${lunarMonth}th Month`);

  return (
    <div className="share-card" data-card-theme={theme === 'auto' ? undefined : theme}>
      {/* Title bar */}
      <div className="sc-title-bar">
        <span className="sc-title">{customText || (zh ? '农历日期' : 'Lunar Date')}</span>
      </div>

      {/* Hero — lunar date */}
      <div className="sc-hero">
        <div className="sc-hero-date" style={{ color: 'var(--text-primary)' }}>{lunarStr}</div>
        <div className="sc-hero-sub" style={{ fontSize: 24, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {yearGanZhi}{zh ? '年' : ''} · {zh ? '属' : ''}{shengXiao}
        </div>
      </div>

      {/* Solar date */}
      <div className="sc-hero" style={{ marginBottom: 20 }}>
        <div className="sc-hero-date-plain" style={{ fontSize: 44 }}>{solarDate}</div>
        <div className="sc-pills">
          <span className="sc-pill">{weekday}</span>
          <span className="sc-pill">{utc}</span>
        </div>
        {hasSpecial && (
          <div className="sc-tags">
            {jieQi && <span className="sc-tag" style={tagJieqi}>{jieQi}</span>}
            {festivals && festivals.map(f => (
              <span key={f} className="sc-tag" style={tagFestival}>{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* Info cells */}
      <div className="sc-cells">
        <div className="sc-cell">
          <div className="sc-cell-value">{monthName}</div>
          <div className="sc-cell-label">{zh ? '农历月' : 'Month'}</div>
        </div>
        <div className="sc-cell">
          <div className="sc-cell-value">{yearGanZhi}</div>
          <div className="sc-cell-label">{zh ? '干支' : 'GanZhi'}</div>
        </div>
        <div className="sc-cell">
          <div className="sc-cell-value">{zh ? `属${shengXiao}` : shengXiao}</div>
          <div className="sc-cell-label">{zh ? '生肖' : 'Zodiac'}</div>
        </div>
      </div>

      {/* Yi/Ji summary panel — fills remaining space */}
      <div className="sc-summary">
        <div className="sc-summary-title">{zh ? '黄历宜忌' : 'Almanac'}</div>
        {hasYiJi ? (
          <div className="sc-yiji">
            {hasYi && (
              <div className="sc-yiji-row">
                <span className="sc-yiji-label" style={{ color: 'var(--color-success)' }}>
                  {zh ? '宜' : '✓'}
                </span>
                <span className="sc-yiji-items">{trunc(auspicious, 8, locale).join(' · ')}</span>
              </div>
            )}
            {hasJi && (
              <div className="sc-yiji-row">
                <span className="sc-yiji-label" style={{ color: 'var(--color-error)' }}>
                  {zh ? '忌' : '✗'}
                </span>
                <span className="sc-yiji-items">{trunc(inauspicious, 8, locale).join(' · ')}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 18, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            {zh ? '当日无宜忌记载' : 'No Yi/Ji records'}
          </div>
        )}
        <div className="sc-summary-note">
          {zh ? `${solarDate} · ${weekday} · ${utc}` : `${solarDate} · ${weekday} · ${utc}`}
        </div>
      </div>

      {/* Footer */}
      <div className="sc-footer">
        <span className="sc-code">#{code}</span>
        <div className="sc-brand"><Brand /><span>ChronoSphere</span></div>
      </div>
    </div>
  );
};

export default CardLunar;
