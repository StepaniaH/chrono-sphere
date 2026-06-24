import React from 'react';
import { utcOffsetLabel } from '../utils/cardHelpers';
import { DonutChart } from './DonutChart';

interface CardOffsetProps {
  customText: string;
  startDate: string; resultDate: string; weekday: string; zone: string;
  offsetDays: number; isBackward: boolean;
  workdays: number; weekends: number; workdayPercent: number; weekendPercent: number;
  lunarStr?: string; yearGanZhi?: string; shengXiao?: string;
  jieQi?: string; festivals?: string[];
  code: string; theme: 'auto' | 'light' | 'dark'; locale: 'zh' | 'en';
}

const Brand: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/>
  </svg>
);

const CardOffset: React.FC<CardOffsetProps> = ({
  customText, startDate, resultDate, weekday, zone,
  offsetDays, isBackward, workdays, weekends, workdayPercent, weekendPercent,
  lunarStr, yearGanZhi, shengXiao, jieQi, festivals,
  code, theme, locale,
}) => {
  const utc = utcOffsetLabel(zone);
  const zh = locale === 'zh';
  const dirText = isBackward ? (zh ? '向后追溯' : 'Backward') : (zh ? '向前推算' : 'Forward');

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

  return (
    <div className="share-card" data-card-theme={theme === 'auto' ? undefined : theme}>
      {/* Title bar */}
      <div className="sc-title-bar">
        <span className="sc-title">{customText || (zh ? '日期推算' : 'Date Offset')}</span>
      </div>

      {/* Hero — result date */}
      <div className="sc-hero">
        <div className="sc-hero-date">{resultDate}</div>
        <div className="sc-pills">
          <span className="sc-pill">{weekday}</span>
          <span className="sc-pill">{utc}</span>
        </div>
        {(lunarStr || yearGanZhi) && (
          <div className="sc-hero-sub">
            {lunarStr && `${zh ? '农历' : 'Lunar'} ${lunarStr}`}
            {yearGanZhi && ` · ${yearGanZhi}${zh ? '年' : ''}`}
            {shengXiao && ` · ${zh ? '属' : ''}${shengXiao}`}
          </div>
        )}
        {(jieQi || (festivals && festivals.length > 0)) && (
          <div className="sc-tags">
            {jieQi && <span className="sc-tag" style={tagJieqi}>{jieQi}</span>}
            {festivals && festivals.map(f => (
              <span key={f} className="sc-tag" style={tagFestival}>{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* Donut charts */}
      <div className="sc-donuts">
        <DonutChart
          percent={workdayPercent}
          label={zh ? '工作日' : 'Workdays'}
          sublabel={`${workdays} ${zh ? '天' : 'days'}`}
          color="var(--color-success)"
        />
        <DonutChart
          percent={weekendPercent}
          label={zh ? '双休日' : 'Weekends'}
          sublabel={`${weekends} ${zh ? '天' : 'days'}`}
          color="var(--accent-secondary)"
        />
      </div>

      {/* Summary panel */}
      <div className="sc-summary">
        <div className="sc-summary-title">{zh ? '计算摘要' : 'Summary'}</div>
        <div className="sc-summary-row">
          <span className="sc-summary-key">{zh ? '起始日期' : 'Start'}</span>
          <span className="sc-summary-val">{startDate}</span>
        </div>
        <div className="sc-summary-row">
          <span className="sc-summary-key">{zh ? '目标日期' : 'Target'}</span>
          <span className="sc-summary-val accent">{resultDate}</span>
        </div>
        <div className="sc-summary-row">
          <span className="sc-summary-key">{zh ? '方向' : 'Direction'}</span>
          <span className="sc-summary-val">{dirText}</span>
        </div>
        <div className="sc-summary-row">
          <span className="sc-summary-key">{zh ? '偏移量' : 'Offset'}</span>
          <span className="sc-summary-val">{isBackward ? '-' : '+'}{offsetDays} {zh ? '天' : 'days'}</span>
        </div>
        <div className="sc-summary-row">
          <span className="sc-summary-key">{zh ? '时区' : 'Timezone'}</span>
          <span className="sc-summary-val">{utc}</span>
        </div>
        <div className="sc-summary-note">
          {zh
            ? `共 ${offsetDays} 天 · ${workdays} 工作日 · ${weekends} 休息日`
            : `${offsetDays} days total · ${workdays} workdays · ${weekends} weekends`}
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

export { CardOffset }; export default CardOffset; export type { CardOffsetProps };
