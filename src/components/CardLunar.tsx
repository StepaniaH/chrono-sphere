import React from 'react';

interface CardLunarProps {
  customText: string;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeap: boolean;
  lunarStr: string;
  yearGanZhi: string;
  shengXiao: string;
  solarDate: string;
  weekday: string;
  jieQi?: string;
  festivals?: string[];
  auspicious?: string[];
  inauspicious?: string[];
  code: string;
  theme: 'auto' | 'light' | 'dark';
  locale: 'zh' | 'en';
}

/**
 * Truncate an array and append an overflow label like "…等 N 项"
 * or "…and N more".
 */
function truncateWithOverflow(
  items: string[] | undefined,
  max: number,
  locale: 'zh' | 'en',
): string[] {
  if (!items || items.length === 0) return [];
  if (items.length <= max) return items;

  const shown = items.slice(0, max);
  const remaining = items.length - max;
  const suffix =
    locale === 'zh' ? `…等 ${remaining} 项` : `…and ${remaining} more`;
  return [...shown, suffix];
}

/**
 * ChronoSphere brand icon — a minimalist calendar/sphere mark.
 */
const BrandIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer ring */}
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
    {/* Inner calendar grid */}
    <rect
      x="7"
      y="5"
      width="10"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <line
      x1="7"
      y1="9"
      x2="17"
      y2="9"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <line x1="9.5" y1="3" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1.2" />
    <line x1="14.5" y1="3" x2="14.5" y2="7" stroke="currentColor" strokeWidth="1.2" />
    {/* Moon crescent inside the sphere (lunar hint) */}
    <path
      d="M17.5 17.5 A4 4 0 1 1 14 14"
      stroke="currentColor"
      strokeWidth="1.3"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

export const CardLunar: React.FC<CardLunarProps> = ({
  customText,
  lunarYear: _lunarYear,
  lunarMonth: _lunarMonth,
  lunarDay: _lunarDay,
  isLeap: _isLeap,
  lunarStr,
  yearGanZhi,
  shengXiao,
  solarDate,
  weekday,
  jieQi,
  festivals,
  auspicious,
  inauspicious,
  code,
  theme,
  locale,
}) => {
  const truncatedAuspicious = truncateWithOverflow(auspicious, 4, locale);
  const truncatedInauspicious = truncateWithOverflow(inauspicious, 4, locale);
  const hasFestivals = festivals && festivals.length > 0;
  const hasJieQi = !!jieQi;
  const hasAuspicious = truncatedAuspicious.length > 0;
  const hasInauspicious = truncatedInauspicious.length > 0;
  const hasYiJi = hasAuspicious || hasInauspicious;

  return (
    <div
      className="share-card"
      data-card-theme={theme !== 'auto' ? theme : undefined}
    >
      {/* ── Header: Custom text ── */}
      <div className="share-card-header">
        <div className="share-card-custom-text">{customText}</div>
      </div>

      {/* ── Main display: lunar date + GānZhī / ShēngXiāo ── */}
      <div className="share-card-result">
        <div className="share-card-result-row">
          <span className="share-card-big-date">{lunarStr}</span>
        </div>
        <div className="share-card-result-row">
          <span className="share-card-meta">
            {yearGanZhi} · {shengXiao}
          </span>
        </div>

        {/* Solar date + weekday */}
        <div className="share-card-result-row">
          <span className="share-card-big-date" style={{ fontSize: 36 }}>
            {solarDate}
          </span>
        </div>
        <div className="share-card-result-row">
          <span className="share-card-meta">{weekday}</span>
        </div>

        {/* 节气 + 节日 */}
        {(hasJieQi || hasFestivals) && (
          <div className="share-card-result-row">
            {hasJieQi && (
              <span
                className="share-card-meta"
                style={{ color: 'var(--color-success)' }}
              >
                {jieQi}
              </span>
            )}
            {hasJieQi && hasFestivals && (
              <span className="share-card-meta" style={{ color: 'var(--text-muted)' }}>
                ·
              </span>
            )}
            {hasFestivals && (
              <span
                className="share-card-meta"
                style={{ color: 'var(--accent-secondary)' }}
              >
                {festivals!.join(' · ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 宜忌 (Auspicious / Inauspicious) ── */}
      {hasYiJi && (
        <div className="share-card-auspicious">
          {hasAuspicious && (
            <div className="share-card-auspicious-row">
              <span className="share-card-auspicious-label">
                {locale === 'zh' ? '宜' : 'Auspicious'}
                {': '}
              </span>
              {truncatedAuspicious.join(' · ')}
            </div>
          )}

          {hasInauspicious && (
            <div className="share-card-auspicious-row">
              <span className="share-card-inaauspicious-label">
                {locale === 'zh' ? '忌' : 'Inauspicious'}
                {': '}
              </span>
              {truncatedInauspicious.join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* ── Footer: code + brand ── */}
      <div className="share-card-footer">
        <span className="share-card-code">{code}</span>
        <div className="share-card-brand">
          <BrandIcon />
          <span>ChronoSphere</span>
        </div>
      </div>
    </div>
  );
};

export default CardLunar;
