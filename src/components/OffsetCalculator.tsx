import React, { useMemo, useState } from 'react';
import { Calendar, Plus, CalendarRange } from 'lucide-react';
import { calculateOffset, detectDstTransitions, getLunarDetails, getZoneShortLabel } from '../utils/dateUtils';
import type { DateResult, DstTransition } from '../utils/dateUtils';
import { TimezoneSelect } from './TimezoneSelect';
import { DstAuditor } from './DstAuditor';
import { RangeVisualizer } from './RangeVisualizer';
import { ShareButton } from './ShareButton';
import type { CardOffsetData } from './CardRenderer';
import { encodeCardCode } from '../utils/cardCodec';

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
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const offset = Math.min(parseInt(offsetStr, 10) || 0, 99999);
  const signedOffset = direction === 'backward' ? -Math.abs(offset) : Math.abs(offset);
  
  const { result, transitions, error } = useMemo<{
    result: DateResult | null;
    transitions: DstTransition[];
    error: string | null;
  }>(() => {
    if (!startDate) {
      return { result: null, transitions: [], error: null };
    }

    if (isNaN(signedOffset)) {
      return { result: null, transitions: [], error: t('offset.invalidNumber') };
    }

    const calc = calculateOffset(startDate, signedOffset, mode, zone, locale);
    if (calc.success && calc.result) {
      const dst = detectDstTransitions(startDate, calc.result.dateStr, zone, locale);
      return { result: calc.result, transitions: dst, error: null };
    }

    return { result: null, transitions: [], error: calc.error || t('offset.invalidCalculation') };
  }, [startDate, signedOffset, mode, zone, locale, t]);

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOffsetStr(e.target.value);
  };

  const visualizerTotalDays = useMemo(() => {
    if (isNaN(signedOffset)) return 0;
    const inclusive = Math.abs(signedOffset) + (mode === 'interval' ? 1 : 0);
    return signedOffset >= 0 ? inclusive : -inclusive;
  }, [signedOffset, mode]);

  // Build card data
  const cardData = useMemo<CardOffsetData | null>(() => {
    if (!result || isNaN(offset)) return null;

    const absOffset = Math.abs(offset);

    // Default card text (user can customize in share modal)
    const displayText = `${absOffset} ${locale === 'zh' ? '天' : 'days'}`;

    // Calculate workday/weekend counts for card (same as visualizer)
    let workdays = 0, weekends = 0;
    try {
      const s = DateTime.fromISO(startDate, { zone: 'UTC' }).startOf('day');
      const e = DateTime.fromISO(result.dateStr, { zone: 'UTC' }).startOf('day');
      const [st, en] = s <= e ? [s, e] : [e, s];
      const dayCount = Math.round(en.diff(st, 'days').days) + 1;
      const startWd = st.weekday;
      const fullWeeks = Math.floor(dayCount / 7);
      workdays = fullWeeks * 5;
      weekends = fullWeeks * 2;
      for (let i = 0; i < (dayCount % 7); i++) {
        const wd = ((startWd + i - 1) % 7) + 1;
        if (wd <= 5) workdays++; else weekends++;
      }
    } catch { /* ignore */ }

    const total = workdays + weekends || 1;
    const workdayPercent = Math.round((workdays / total) * 100);
    const weekendPercent = 100 - workdayPercent;

    const lunarDetails = getLunarDetails(result.dateStr, zone);

    // Generate code
    const code = encodeCardCode({
      version: 0,
      tab: 'offset',
      theme: 'auto',
      templateId: 0,
      customText: '',
      params: {
        zone,
        startDate,
        offset,
        mode,
        direction,
      },
    });

    return {
      customText: displayText,
      startDate,
      resultDate: result.dateStr,
      weekday: result.weekday,
      zone,
      offsetDays: absOffset,
      isBackward: direction === 'backward',
      workdays,
      weekends,
      workdayPercent,
      weekendPercent,
      lunarStr: lunarDetails?.lunarStr,
      yearGanZhi: lunarDetails?.yearGanZhi,
      shengXiao: lunarDetails?.shengXiao,
      jieQi: lunarDetails?.jieQi,
      festivals: lunarDetails?.festivals,
      code,
      theme: 'auto' as const,
      locale,
    };
  }, [result, offset, startDate, zone, direction, mode, locale]);

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
              {direction === 'forward'
                ? t('offset.intervalMode')
                : t('offset.intervalModeBackward')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${mode === 'thDay' ? 'active' : ''}`}
              onClick={() => setMode('thDay')}
            >
              {direction === 'forward'
                ? t('offset.thDayMode')
                : t('offset.thDayModeBackward')}
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
            {mode === 'interval'
              ? (direction === 'forward' ? t('offset.intervalHelp') : t('offset.intervalHelpBackward'))
              : (direction === 'forward' ? t('offset.thDayHelp') : t('offset.thDayHelpBackward'))}
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">{t('offset.direction')}</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${direction === 'forward' ? 'active' : ''}`}
              onClick={() => setDirection('forward')}
            >
              {t('offset.forward')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${direction === 'backward' ? 'active' : ''}`}
              onClick={() => setDirection('backward')}
            >
              {t('offset.backward')}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('offset.amount')}</label>
          <div className="input-icon-wrapper">
            <Plus className="input-icon" size={18} />
            <input
              type="number"
              className="form-input"
              placeholder={t('offset.amountPlaceholder')}
              value={offsetStr}
              onChange={handleOffsetChange}
              min={0}
              max={99999}
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
              <div className="result-card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('offset.resultTitle')}</span>
                {cardData && (
                  <ShareButton
                    cardType="offset"
                    cardData={cardData}
                    locale={locale}
                  />
                )}
              </div>
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
                    <div className="offset-lunar-display">
                      <div className="offset-lunar-title">
                        {t('offset.lunarTitle')} {details.lunarStr}
                      </div>
                      <div className="offset-lunar-pills">
                        <span className="meta-pill">{details.yearGanZhi}</span>
                        <span className="meta-pill">{t('lunar.zodiacLabel')}{details.shengXiao}</span>
                        {details.jieQi && (
                          <span className="meta-pill jieqi">
                            {details.jieQi}
                          </span>
                        )}
                        {details.festivals.map(f => (
                          <span key={f} className="meta-pill festival">
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
