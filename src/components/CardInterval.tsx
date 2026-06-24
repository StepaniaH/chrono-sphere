import React from 'react';
import { getZoneShortLabel } from '../utils/dateUtils';

export interface CardIntervalProps {
  customText: string;
  startDate: string;
  endDate: string;
  startZone: string;
  endZone: string;
  totalDays: number;       // absolute (always positive; use isNegative for sign)
  isNegative: boolean;
  workdays: number;
  weekends: number;
  workdayPercent: number;
  weekendPercent: number;
  absoluteDays: number;
  absoluteHours: number;
  startLunarStr?: string;
  endLunarStr?: string;
  code: string;
  theme: 'auto' | 'light' | 'dark';
  locale: 'zh' | 'en';
}

/** Brand SVG: a minimal calendar-with-clockmark icon */
const BrandIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="15" r="4" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12 12.5v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

function formatDate(dateStr: string, locale: 'zh' | 'en'): string {
  const [y, m, d] = dateStr.split('-');
  const month = parseInt(m, 10);
  const day = parseInt(d, 10);
  if (locale === 'zh') {
    return `${y}年${month}月${day}日`;
  }
  // English: "Jun 24, 2026" style
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[month - 1]} ${day}, ${y}`;
}

const CardInterval: React.FC<CardIntervalProps> = ({
  customText,
  startDate,
  endDate,
  startZone,
  endZone,
  totalDays,
  isNegative,
  workdays,
  weekends,
  workdayPercent,
  weekendPercent,
  absoluteDays,
  absoluteHours,
  startLunarStr,
  endLunarStr,
  code,
  theme,
  locale,
}) => {
  const differentZones = startZone !== endZone;
  const startLabel = getZoneShortLabel(startZone, locale);
  const endLabel = getZoneShortLabel(endZone, locale);

  const daysLabel = locale === 'zh' ? '天' : 'days';
  const hrsLabel = locale === 'zh' ? '时' : 'hr';
  const workdaysLabel = locale === 'zh' ? '工作日' : 'Weekdays';
  const weekendsLabel = locale === 'zh' ? '双休日' : 'Weekends';
  const absoluteLabel = locale === 'zh' ? '绝对时间' : 'Absolute time';
  const zoneInfoLabel = locale === 'zh' ? '时区' : 'Timezone';
  const brandLabel = 'ChronoSphere';

  const displayDays = isNegative ? `-${totalDays}` : `${totalDays}`;

  return (
    <div className="share-card" data-card-theme={theme === 'auto' ? undefined : theme}>
      {/* ── Header / Custom text ── */}
      <div className="share-card-header">
        <div className="share-card-custom-text">{customText}</div>
      </div>

      {/* ── Result box: startDate → endDate ── */}
      <div className="share-card-result">
        <div className="share-card-result-row">
          <span className="share-card-big-date">{formatDate(startDate, locale)}</span>
          <span className="share-card-arrow">→</span>
          <span className="share-card-big-date">{formatDate(endDate, locale)}</span>
        </div>
        {differentZones && (
          <div className="share-card-result-row">
            <span className="share-card-meta">
              {startLabel} → {endLabel}
            </span>
          </div>
        )}
        {(startLunarStr || endLunarStr) && (
          <div className="share-card-lunar">
            {startLunarStr && <span>{startLunarStr}</span>}
            {startLunarStr && endLunarStr && <span> · </span>}
            {endLunarStr && <span>{endLunarStr}</span>}
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="share-card-stats">
        <div className="share-card-stat">
          <div className="share-card-stat-value">{displayDays}</div>
          <div className="share-card-stat-label">{daysLabel}</div>
        </div>
        <div className="share-card-stat">
          <div className="share-card-stat-value">{workdays}</div>
          <div className="share-card-stat-label">{workdaysLabel}</div>
        </div>
        <div className="share-card-stat">
          <div className="share-card-stat-value">{weekends}</div>
          <div className="share-card-stat-label">{weekendsLabel}</div>
        </div>
        <div className="share-card-stat">
          <div className="share-card-stat-value">
            {absoluteDays}
            <span style={{ fontSize: '0.6em', fontWeight: 400 }}>
              {daysLabel}
            </span>{' '}
            {absoluteHours}
            <span style={{ fontSize: '0.6em', fontWeight: 400 }}>
              {hrsLabel}
            </span>
          </div>
          <div className="share-card-stat-label">{absoluteLabel}</div>
        </div>
      </div>

      {/* ── Ratio bar ── */}
      {(workdayPercent > 0 || weekendPercent > 0) && (
        <>
          <div className="share-card-ratio-bar">
            {workdayPercent > 0 && (
              <div
                className="share-card-ratio-fill-work"
                style={{ width: `${workdayPercent}%` }}
              />
            )}
            {weekendPercent > 0 && (
              <div
                className="share-card-ratio-fill-weekend"
                style={{ width: `${weekendPercent}%` }}
              />
            )}
          </div>
          <div className="share-card-ratio-labels">
            <span>
              {workdaysLabel} · {Math.round(workdayPercent)}%
            </span>
            <span>
              {Math.round(weekendPercent)}% · {weekendsLabel}
            </span>
          </div>
        </>
      )}

      {/* ── Simplified timeline ── */}
      <div className="share-card-timeline">
        <div className="share-card-timeline-progress" />
        <div className="share-card-timeline-node" style={{ left: '0%' }} />
        <div className="share-card-timeline-label" style={{ left: '0%' }}>
          {locale === 'zh' ? '起始' : 'Start'}
        </div>
        <div className="share-card-timeline-node end" style={{ left: '100%' }} />
        <div className="share-card-timeline-label" style={{ left: '100%' }}>
          {locale === 'zh' ? '结束' : 'End'}
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="share-card-info">
        <div className="share-card-info-item">
          <span className="share-card-info-label">
            {zoneInfoLabel} ({locale === 'zh' ? '起' : 'Start'})
          </span>
          <span className="share-card-info-value">{startLabel}</span>
        </div>
        <div className="share-card-info-item">
          <span className="share-card-info-label">
            {zoneInfoLabel} ({locale === 'zh' ? '止' : 'End'})
          </span>
          <span className="share-card-info-value">{endLabel}</span>
        </div>
        <div className="share-card-info-item">
          <span className="share-card-info-label">
            {workdaysLabel}
          </span>
          <span className="share-card-info-value">{workdays} {daysLabel}</span>
        </div>
        <div className="share-card-info-item">
          <span className="share-card-info-label">
            {weekendsLabel}
          </span>
          <span className="share-card-info-value">{weekends} {daysLabel}</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="share-card-footer">
        <span className="share-card-code">{code}</span>
        <div className="share-card-brand">
          <BrandIcon />
          <span>{brandLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default CardInterval;
