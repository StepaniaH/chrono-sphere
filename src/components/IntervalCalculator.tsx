import React, { useMemo, useState } from 'react';
import { Calendar, CalendarRange } from 'lucide-react';
import { calculateInterval, detectDstTransitions, getFriendlyZoneLabel, getLunarDetails, getZoneShortLabel } from '../utils/dateUtils';
import type { IntervalResult } from '../utils/dateUtils';
import { TimezoneSelect } from './TimezoneSelect';
import { DstAuditor } from './DstAuditor';
import type { DstTransitionWithZone } from './DstAuditor';
import { RangeVisualizer } from './RangeVisualizer';
import { DateTime } from 'luxon';
import { usePreferences } from '../context/usePreferences';

export const IntervalCalculator: React.FC = () => {
  const { locale, t } = usePreferences();
  // Initialize start and end timezones to local timezone or Asia/Shanghai
  const [startZone, setStartZone] = useState(() => {
    try {
      return DateTime.local().zoneName || 'Asia/Shanghai';
    } catch {
      return 'Asia/Shanghai';
    }
  });

  const [endZone, setEndZone] = useState(() => {
    try {
      return DateTime.local().zoneName || 'Asia/Shanghai';
    } catch {
      return 'Asia/Shanghai';
    }
  });

  const getTodayStr = (tz: string) => DateTime.now().setZone(tz).toFormat('yyyy-MM-dd');
  const getFutureStr = (tz: string) => DateTime.now().setZone(tz).plus({ days: 10 }).toFormat('yyyy-MM-dd');

  const [startDate, setStartDate] = useState(() => getTodayStr(startZone));
  const [endDate, setEndDate] = useState(() => getFutureStr(endZone));
  const [inclusion, setInclusion] = useState<'both' | 'start' | 'end' | 'exclude'>('both');

  const { result, transitions, error } = useMemo<{
    result: IntervalResult | null;
    transitions: DstTransitionWithZone[];
    error: string | null;
  }>(() => {
    if (!startDate || !endDate) {
      return { result: null, transitions: [], error: null };
    }

    const calc = calculateInterval(startDate, endDate, inclusion, startZone, endZone, locale);
    if (calc.success && calc.result) {
      // Audit DST transitions in both timezones
      const dstStart = detectDstTransitions(startDate, endDate, startZone, locale);
      const dstEnd = startZone !== endZone ? detectDstTransitions(startDate, endDate, endZone, locale) : [];

      // Combine transitions and tag them with timezone descriptions
      const startLabel = getZoneShortLabel(startZone, locale);
      const endLabel = getZoneShortLabel(endZone, locale);

      const combined: DstTransitionWithZone[] = [
        ...dstStart.map(t => ({ ...t, zoneName: startLabel })),
        ...dstEnd.map(t => ({ ...t, zoneName: endLabel }))
      ];

      // Remove any exact duplicates (if they overlap and refer to the same event on same date)
      const seen = new Set<string>();
      const filteredCombined = combined.filter(t => {
        const key = `${t.zoneName}-${t.date}-${t.type}-${t.shiftMinutes}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return { result: calc.result, transitions: filteredCombined, error: null };
    }

    return { result: null, transitions: [], error: calc.error || t('interval.invalid') };
  }, [startDate, endDate, inclusion, startZone, endZone, locale, t]);

  return (
    <div className="calculator-grid fade-in">
      {/* Form controls */}
      <div className="form-section">
        {/* Start Date Configuration */}
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '15px', background: 'var(--surface-raised)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>●</span> {t('interval.startConfig')}
          </h3>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('interval.startZone')}</label>
            <TimezoneSelect value={startZone} onChange={setStartZone} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('interval.startDate')}</label>
            <div className="input-icon-wrapper">
              <Calendar className="input-icon" size={18} />
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            {startDate && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '4px', marginTop: '2px' }}>
                {(() => {
                  const d = getLunarDetails(startDate, startZone);
                  return d ? `${t('offset.lunarTitle')}：${d.lunarStr} (${d.yearGanZhi} · ${d.shengXiao})` : '';
                })()}
              </span>
            )}
          </div>
        </div>

        {/* End Date Configuration */}
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '15px', background: 'var(--surface-raised)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>●</span> {t('interval.endConfig')}
          </h3>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('interval.endZone')}</label>
            <TimezoneSelect value={endZone} onChange={setEndZone} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('interval.endDate')}</label>
            <div className="input-icon-wrapper">
              <Calendar className="input-icon" size={18} />
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {endDate && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '4px', marginTop: '2px' }}>
                {(() => {
                  const d = getLunarDetails(endDate, endZone);
                  return d ? `${t('offset.lunarTitle')}：${d.lunarStr} (${d.yearGanZhi} · ${d.shengXiao})` : '';
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Inclusion Rules */}
        <div className="form-group">
          <label className="form-label">{t('interval.inclusion')}</label>
          <div className="segmented-control" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', background: 'var(--surface-muted)', padding: '4px' }}>
            <button
              type="button"
              className={`segmented-btn ${inclusion === 'both' ? 'active' : ''}`}
              onClick={() => setInclusion('both')}
              style={{ fontSize: '0.8rem' }}
            >
              {t('interval.both')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${inclusion === 'start' ? 'active' : ''}`}
              onClick={() => setInclusion('start')}
              style={{ fontSize: '0.8rem' }}
            >
              {t('interval.startOnly')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${inclusion === 'end' ? 'active' : ''}`}
              onClick={() => setInclusion('end')}
              style={{ fontSize: '0.8rem' }}
            >
              {t('interval.endOnly')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${inclusion === 'exclude' ? 'active' : ''}`}
              onClick={() => setInclusion('exclude')}
              style={{ fontSize: '0.8rem' }}
            >
              {t('interval.exclude')}
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '4px' }}>
            {inclusion === 'both' && t('interval.bothHelp')}
            {inclusion === 'start' && t('interval.startHelp')}
            {inclusion === 'end' && t('interval.endHelp')}
            {inclusion === 'exclude' && t('interval.excludeHelp')}
          </span>
        </div>
      </div>

      {/* Results panel */}
      <div className="results-section">
        {error ? (
          <div className="results-placeholder" style={{ color: 'var(--color-error)' }}>
            <p>{error}</p>
          </div>
        ) : !result ? (
          <div className="results-placeholder">
            <CalendarRange className="placeholder-icon" size={48} />
            <p>{t('interval.placeholder')}</p>
          </div>
        ) : (
          <div className="results-content">
            <div>
              <div className="result-card-heading">{t('interval.calendarDiff')}</div>
              <div className="big-result-wrapper">
                <span className="big-result-val">
                  {result.totalDays >= 0 ? result.totalDays : `-${Math.abs(result.totalDays)}`}
                </span>
                <span className="big-result-unit">{t('interval.totalDaysUnit')}</span>
                {result.isNegative && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: 600, marginTop: '4px' }}>
                    {t('interval.negativeNote')}
                  </div>
                )}
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">{t('interval.workdays')}</span>
                <span className="stat-value workday">{result.workdays} {t('interval.totalDaysUnit')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('interval.weekends')}</span>
                <span className="stat-value weekend">{result.weekends} {t('interval.totalDaysUnit')}</span>
              </div>
            </div>

            {/* Absolute elapsed time breakdown */}
            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="stat-label" style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('interval.absoluteTime')}
              </div>
              <div style={{ textAlign: 'center', fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                {t('interval.hoursUnit', { days: result.absoluteDays, hours: result.absoluteHours })}
              </div>
            </div>

            {/* Lunar Calendar equivalents */}
            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="result-card-heading" style={{ border: 'none', padding: 0, fontSize: '0.75rem', textTransform: 'none', letterSpacing: '0.05em' }}>{t('interval.lunarInfo')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('interval.startLunar')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {(() => {
                      const d = getLunarDetails(startDate, startZone);
                      return d ? `${d.lunarStr} (${d.yearGanZhi} · ${d.shengXiao})` : '';
                    })()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('interval.endLunar')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {(() => {
                      const d = getLunarDetails(endDate, endZone);
                      return d ? `${d.lunarStr} (${d.yearGanZhi} · ${d.shengXiao})` : '';
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <RangeVisualizer 
              startDateStr={startDate} 
              endDateStr={endDate} 
              totalDays={result.totalDays} 
              startZone={startZone}
              endZone={endZone}
              locale={locale}
            />

            <DstAuditor
              transitions={transitions}
              zone={startZone}
              zoneLabel={getFriendlyZoneLabel(startZone, locale)}
              isDualZone={startZone !== endZone}
            />
          </div>
        )}
      </div>
    </div>
  );
};
