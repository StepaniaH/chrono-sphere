import React from 'react';
import { utcOffsetLabel } from '../utils/cardHelpers';
import { DonutChart } from './DonutChart';

export interface CardIntervalProps {
  customText: string;
  startDate: string; endDate: string; startZone: string; endZone: string;
  totalDays: number; isNegative: boolean;
  workdays: number; weekends: number;
  workdayPercent: number; weekendPercent: number;
  absoluteDays: number; absoluteHours: number;
  startLunarStr?: string; endLunarStr?: string;
  code: string; theme: 'auto' | 'light' | 'dark'; locale: 'zh' | 'en';
}

const Brand: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/>
  </svg>
);

const CardInterval: React.FC<CardIntervalProps> = ({
  customText, startDate, endDate, startZone, endZone,
  totalDays, isNegative, workdays, weekends,
  workdayPercent, weekendPercent, absoluteDays, absoluteHours,
  startLunarStr, endLunarStr,
  code, theme, locale,
}) => {
  const utcS = utcOffsetLabel(startZone);
  const utcE = utcOffsetLabel(endZone);
  const diff = startZone !== endZone;
  const zh = locale === 'zh';
  const d = zh ? '天' : 'days';
  const absTot = absoluteDays * 24 + absoluteHours;

  return (
    <div className="share-card" data-card-theme={theme === 'auto' ? undefined : theme}>
      {/* Title bar */}
      <div className="sc-title-bar">
        <span className="sc-title">{customText || (zh ? '日期区间' : 'Date Interval')}</span>
      </div>

      {/* Hero — start → end + big number */}
      <div className="sc-hero">
        <div className="sc-hero-dates">
          <span className="sc-hero-date-plain">{startDate}</span>
          <span className="sc-hero-arrow">→</span>
          <span className="sc-hero-date-plain">{endDate}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
          <span className="sc-hero-number">{isNegative ? `-${totalDays}` : totalDays}</span>
          <span className="sc-hero-unit">{d}</span>
        </div>
        <div className="sc-pills">
          <span className="sc-pill">{utcS}{diff ? ` → ${utcE}` : ''}</span>
          <span className="sc-pill">{zh ? `${absoluteDays}天${absoluteHours}时` : `${absoluteDays}d ${absoluteHours}h`}</span>
        </div>
        {(startLunarStr || endLunarStr) && (
          <div className="sc-hero-sub">
            {startLunarStr && <span>{startLunarStr}</span>}
            {startLunarStr && endLunarStr && <span> · </span>}
            {endLunarStr && <span>{endLunarStr}</span>}
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
          <span className="sc-summary-key">{zh ? '起始' : 'Start'}</span>
          <span className="sc-summary-val">{startDate} · {utcS}</span>
        </div>
        <div className="sc-summary-row">
          <span className="sc-summary-key">{zh ? '结束' : 'End'}</span>
          <span className="sc-summary-val accent">{endDate} · {utcE}</span>
        </div>
        <div className="sc-summary-row">
          <span className="sc-summary-key">{zh ? '总天数' : 'Total Days'}</span>
          <span className="sc-summary-val">{isNegative ? `-${totalDays}` : totalDays} {d}</span>
        </div>
        <div className="sc-summary-row">
          <span className="sc-summary-key">{zh ? '绝对时长' : 'Elapsed'}</span>
          <span className="sc-summary-val">{absoluteDays}d {absoluteHours}h ({absTot}h)</span>
        </div>
        <div className="sc-summary-note">
          {zh
            ? `${workdays} 工作日 · ${weekends} 休息日${diff ? ' · 含 DST 修正' : ''}`
            : `${workdays} workdays · ${weekends} weekends${diff ? ' · incl. DST' : ''}`}
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

export default CardInterval;
