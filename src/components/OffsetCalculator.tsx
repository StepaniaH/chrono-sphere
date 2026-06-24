import React, { useMemo, useState } from 'react';
import { Calendar, Plus, CalendarRange } from 'lucide-react';
import { calculateOffset, detectDstTransitions, getLunarDetails, getZoneShortLabel } from '../utils/dateUtils';
import type { DateResult, DstTransition } from '../utils/dateUtils';
import { TimezoneSelect } from './TimezoneSelect';
import { DstAuditor } from './DstAuditor';
import { RangeVisualizer } from './RangeVisualizer';
import { DateTime } from 'luxon';
import { usePreferences } from '../context/usePreferences';

export const OffsetCalculator: React.FC = () => {
  const { locale, t } = usePreferences();
  // Initialize timezone state locally to browser's default or Asia/Shanghai
  const [zone, setZone] = useState(() => {
    try {
      return DateTime.local().zoneName || 'Asia/Shanghai';
    } catch {
      return 'Asia/Shanghai';
    }
  });

  const getTodayStr = (tz: string) => DateTime.now().setZone(tz).toFormat('yyyy-MM-dd');

  const [startDate, setStartDate] = useState(() => getTodayStr(zone));
  const [offsetStr, setOffsetStr] = useState('10');
  const [mode, setMode] = useState<'thDay' | 'interval'>('interval');
  
  const { result, transitions, error } = useMemo<{
    result: DateResult | null;
    transitions: DstTransition[];
    error: string | null;
  }>(() => {
    const offset = parseInt(offsetStr, 10);

    if (!startDate) {
      return { result: null, transitions: [], error: null };
    }

    if (isNaN(offset)) {
      return { result: null, transitions: [], error: t('offset.invalidNumber') };
    }

    const calc = calculateOffset(startDate, offset, mode, zone, locale);
    if (calc.success && calc.result) {
      const dst = detectDstTransitions(startDate, calc.result.dateStr, zone, locale);
      return { result: calc.result, transitions: dst, error: null };
    }

    return { result: null, transitions: [], error: calc.error || t('offset.invalidCalculation') };
  }, [startDate, offsetStr, mode, zone, locale, t]);

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOffsetStr(e.target.value);
  };

  const visualizerTotalDays = useMemo(() => {
    const o = parseInt(offsetStr, 10);
    if (isNaN(o)) return 0;
    const inclusive = Math.abs(o) + (mode === 'interval' ? 1 : 0);
    return o >= 0 ? inclusive : -inclusive;
  }, [offsetStr, mode]);

  return (
    <div className="calculator-grid fade-in">
      {/* Form controls */}
      <div className="form-section">
        <div className="form-group">
          <label className="form-label">{t('offset.baseZone')}</label>
          <TimezoneSelect value={zone} onChange={setZone} />
        </div>

        <div className="form-group">
          <label className="form-label">{t('offset.startDate')}</label>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '4px', marginTop: '2px' }}>
              {(() => {
                const details = getLunarDetails(startDate, zone);
                return details ? `${t('offset.lunarTitle')}：${details.lunarStr} (${details.yearGanZhi} · ${details.shengXiao})` : '';
              })()}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">{t('offset.mode')}</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${mode === 'interval' ? 'active' : ''}`}
              onClick={() => setMode('interval')}
            >
              {t('offset.intervalMode')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${mode === 'thDay' ? 'active' : ''}`}
              onClick={() => setMode('thDay')}
            >
              {t('offset.thDayMode')}
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
            {mode === 'interval' ? t('offset.intervalHelp') : t('offset.thDayHelp')}
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">{t('offset.amount')}</label>
          <div className="input-icon-wrapper">
            <Plus className="input-icon" size={18} />
            <input
              type="number"
              className="form-input"
              placeholder="例如：10"
              value={offsetStr}
              onChange={handleOffsetChange}
              min={mode === 'thDay' ? 1 : undefined}
            />
          </div>
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
            <p>{t('offset.placeholder')}</p>
          </div>
        ) : (
          <div className="results-content">
            <div>
              <div className="result-card-heading">{t('offset.resultTitle')}</div>
              <div style={{ marginTop: '15px' }}>
                <div className="big-date-display">{result.dateStr}</div>
                <div className="date-meta-info">
                  <span className="meta-pill">{result.weekday}</span>
                  <span className="meta-pill">UTC{result.offsetHours >= 0 ? `+${result.offsetHours}` : result.offsetHours} ({result.offsetName})</span>
                  {result.isDst && <span className="meta-pill dst-active">{t('offset.dstActive')}</span>}
                </div>
                {(() => {
                  const details = getLunarDetails(result.dateStr, zone);
                  if (!details) return null;
                  return (
                    <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '1.25rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                        {t('offset.lunarTitle')} {details.lunarStr}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <span className="meta-pill">{details.yearGanZhi}</span>
                        <span className="meta-pill">{t('lunar.zodiacLabel')}{details.shengXiao}</span>
                        {details.jieQi && (
                          <span className="meta-pill" style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                            {details.jieQi}
                          </span>
                        )}
                        {details.festivals.map(f => (
                          <span key={f} className="meta-pill" style={{ borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)', background: 'rgba(168, 85, 247, 0.05)' }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <RangeVisualizer 
              startDateStr={startDate} 
              endDateStr={result.dateStr} 
              totalDays={visualizerTotalDays} 
              startZone={zone}
              endZone={zone}
              locale={locale}
            />

            <DstAuditor transitions={transitions} zone={zone} zoneLabel={getZoneShortLabel(zone, locale)} />
          </div>
        )}
      </div>
    </div>
  );
};
