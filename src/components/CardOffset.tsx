import React from 'react';

// ── Types ────────────────────────────────────────────────────────────────

interface CardOffsetProps {
  customText: string;
  startDate: string;       // 'yyyy-MM-dd'
  resultDate: string;      // 'yyyy-MM-dd'
  weekday: string;         // localized weekday name
  zone: string;            // e.g. 'Asia/Shanghai'
  offsetDays: number;      // absolute value
  isBackward: boolean;
  workdays: number;
  weekends: number;
  workdayPercent: number;
  weekendPercent: number;
  lunarStr?: string;       // lunar date string
  yearGanZhi?: string;     // 干支
  shengXiao?: string;      // 生肖
  jieQi?: string;          // 节气
  festivals?: string[];    // 节日列表
  code: string;            // base62 code
  theme: 'auto' | 'light' | 'dark';
  locale: 'zh' | 'en';
}

// ── Sub-components ───────────────────────────────────────────────────────

const ChronoBrand: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="20" height="20" rx="5" fill="currentColor" opacity="0.15" />
    <rect x="1" y="1" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
    <text x="11" y="15.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor" fontFamily="system-ui, sans-serif">C</text>
  </svg>
);

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="share-card-stat">
    <div className="share-card-stat-value">{value.toLocaleString()}</div>
    <div className="share-card-stat-label">{label}</div>
  </div>
);

const RatioBar: React.FC<{
  workdayPercent: number;
  weekendPercent: number;
  locale: 'zh' | 'en';
}> = ({ workdayPercent, weekendPercent, locale }) => (
  <>
    <div className="share-card-ratio-bar">
      <div
        className="share-card-ratio-fill-work"
        style={{ width: `${workdayPercent}%` }}
      />
      <div
        className="share-card-ratio-fill-weekend"
        style={{ width: `${weekendPercent}%` }}
      />
    </div>
    <div className="share-card-ratio-labels">
      <span>
        {locale === 'zh' ? '工作日' : 'Workdays'} {workdayPercent}%
      </span>
      <span>
        {locale === 'zh' ? '双休日' : 'Weekends'} {weekendPercent}%
      </span>
    </div>
  </>
);

const Timeline: React.FC<{
  startLabel: string;
  endLabel: string;
  jieQi?: string;
  festivals?: string[];
}> = ({ startLabel, endLabel, jieQi, festivals }) => {
  const markers: { label: string; position: number }[] = [];

  if (jieQi) {
    markers.push({ label: jieQi, position: 50 });
  }
  if (festivals && festivals.length > 0) {
    festivals.forEach((f, i) => {
      markers.push({ label: f, position: 30 + i * 25 });
    });
  }

  return (
    <div>
      <div className="share-card-timeline">
        <div className="share-card-timeline-progress" />
        <div className="share-card-timeline-node" style={{ left: '0%' }} />
        <div className="share-card-timeline-node end" style={{ left: '100%' }} />
        {markers.map((m, i) => (
          <div
            key={i}
            className="share-card-timeline-node"
            style={{ left: `${m.position}%`, borderColor: 'var(--color-warning)' }}
          >
            <div className="share-card-timeline-label">{m.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 20px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
};

const InfoGrid: React.FC<{
  items: { label: string; value: string }[];
}> = ({ items }) => (
  <div className="share-card-info">
    {items.map((item, i) => (
      <div className="share-card-info-item" key={i}>
        <span className="share-card-info-label">{item.label}</span>
        <span className="share-card-info-value">{item.value}</span>
      </div>
    ))}
  </div>
);

const Footer: React.FC<{ code: string }> = ({ code }) => (
  <div className="share-card-footer">
    <span className="share-card-code">#{code}</span>
    <div className="share-card-brand">
      <ChronoBrand />
      <span>ChronoSphere</span>
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────

const CardOffset: React.FC<CardOffsetProps> = ({
  customText,
  startDate,
  resultDate,
  weekday,
  zone,
  offsetDays,
  isBackward,
  workdays,
  weekends,
  workdayPercent,
  weekendPercent,
  lunarStr,
  yearGanZhi,
  shengXiao,
  jieQi,
  festivals,
  code,
  theme,
  locale,
}) => {
  const resolvedTheme = theme === 'auto' ? 'light' : theme;

  const infoItems: { label: string; value: string }[] = [
    {
      label: locale === 'zh' ? '时区' : 'Zone',
      value: zone,
    },
    {
      label: locale === 'zh' ? '方向' : 'Direction',
      value: isBackward
        ? (locale === 'zh' ? '向前追溯' : 'Backward')
        : (locale === 'zh' ? '向后推算' : 'Forward'),
    },
    {
      label: locale === 'zh' ? '自然天数' : 'Calendar days',
      value: String(offsetDays),
    },
    {
      label: locale === 'zh' ? '分享码' : 'Share code',
      value: code,
    },
    ...(yearGanZhi
      ? [
          {
            label: locale === 'zh' ? '干支' : 'Gan-Zhi',
            value: yearGanZhi,
          },
        ]
      : []),
    ...(shengXiao
      ? [
          {
            label: locale === 'zh' ? '生肖' : 'Zodiac',
            value: shengXiao,
          },
        ]
      : []),
  ];

  return (
    <div className="share-card" data-card-theme={resolvedTheme}>
      {/* Header: custom text */}
      <div className="share-card-header">
        <h1 className="share-card-custom-text">{customText}</h1>
      </div>

      {/* Result box: start date → target date */}
      <div className="share-card-result">
        <div className="share-card-result-row">
          <span className="share-card-big-date">{startDate}</span>
          <span className="share-card-arrow">{isBackward ? '←' : '→'}</span>
          <span className="share-card-big-date">{resultDate}</span>
        </div>
        <div className="share-card-meta">
          {weekday} · {zone.split('/').pop()}
        </div>
        {lunarStr && (
          <div className="share-card-lunar">
            {locale === 'zh' ? '农历' : 'Lunar'} {lunarStr}
            {yearGanZhi && shengXiao ? ` (${yearGanZhi} · ${shengXiao})` : ''}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="share-card-stats">
        <Stat value={offsetDays} label={locale === 'zh' ? '天' : 'days'} />
        <Stat value={workdays} label={locale === 'zh' ? '工作日' : 'workdays'} />
        <Stat value={weekends} label={locale === 'zh' ? '双休日' : 'weekends'} />
      </div>

      {/* Ratio bar */}
      <RatioBar
        workdayPercent={workdayPercent}
        weekendPercent={weekendPercent}
        locale={locale}
      />

      {/* Simplified timeline */}
      <Timeline
        startLabel={startDate}
        endLabel={resultDate}
        jieQi={jieQi}
        festivals={festivals}
      />

      {/* Info grid */}
      <InfoGrid items={infoItems} />

      {/* Footer: code + brand */}
      <Footer code={code} />
    </div>
  );
};

export { CardOffset };
export default CardOffset;
export type { CardOffsetProps };
