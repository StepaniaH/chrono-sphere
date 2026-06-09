import React, { useState, useEffect } from 'react';
import { Calendar, CalendarRange } from 'lucide-react';
import { calculateInterval, detectDstTransitions, getFriendlyZoneLabel } from '../utils/dateUtils';
import type { IntervalResult } from '../utils/dateUtils';
import { TimezoneSelect } from './TimezoneSelect';
import { DstAuditor } from './DstAuditor';
import type { DstTransitionWithZone } from './DstAuditor';
import { RangeVisualizer } from './RangeVisualizer';
import { DateTime } from 'luxon';

export const IntervalCalculator: React.FC = () => {
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

  const [result, setResult] = useState<IntervalResult | null>(null);
  const [transitions, setTransitions] = useState<DstTransitionWithZone[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync date inputs if timezone changes
  useEffect(() => {
    if (!startDate) {
      setStartDate(getTodayStr(startZone));
    }
  }, [startZone]);

  useEffect(() => {
    if (!endDate) {
      setEndDate(getFutureStr(endZone));
    }
  }, [endZone]);

  // Recalculate on input changes
  useEffect(() => {
    setError(null);
    
    if (!startDate || !endDate) {
      setResult(null);
      setTransitions([]);
      return;
    }

    const calc = calculateInterval(startDate, endDate, inclusion, startZone, endZone);
    if (calc.success && calc.result) {
      setResult(calc.result);

      // Audit DST transitions in both timezones
      const dstStart = detectDstTransitions(startDate, endDate, startZone);
      const dstEnd = startZone !== endZone ? detectDstTransitions(startDate, endDate, endZone) : [];

      // Combine transitions and tag them with timezone descriptions
      const startLabel = getFriendlyZoneLabel(startZone).split(' - ')[1] || startZone;
      const endLabel = getFriendlyZoneLabel(endZone).split(' - ')[1] || endZone;

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

      setTransitions(filteredCombined);
    } else {
      setError(calc.error || '计算出错');
      setResult(null);
      setTransitions([]);
    }
  }, [startDate, endDate, inclusion, startZone, endZone]);

  return (
    <div className="calculator-grid fade-in">
      {/* Form controls */}
      <div className="form-section">
        {/* Start Date Configuration */}
        <div style={{ border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', padding: '15px', background: 'rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>●</span> 起始点设置
          </h3>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>起始时区 (国家/地区)</label>
            <TimezoneSelect value={startZone} onChange={setStartZone} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem' }}>起始日期</label>
            <div className="input-icon-wrapper">
              <Calendar className="input-icon" size={18} />
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* End Date Configuration */}
        <div style={{ border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', padding: '15px', background: 'rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>●</span> 结束点设置
          </h3>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>结束时区 (国家/地区)</label>
            <TimezoneSelect value={endZone} onChange={setEndZone} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem' }}>结束日期</label>
            <div className="input-icon-wrapper">
              <Calendar className="input-icon" size={18} />
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Inclusion Rules */}
        <div className="form-group">
          <label className="form-label">包含规则</label>
          <div className="segmented-control" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', background: 'rgba(0, 0, 0, 0.25)', padding: '4px' }}>
            <button
              type="button"
              className={`segmented-btn ${inclusion === 'both' ? 'active' : ''}`}
              onClick={() => setInclusion('both')}
              style={{ fontSize: '0.8rem' }}
            >
              包括首尾日 (+1)
            </button>
            <button
              type="button"
              className={`segmented-btn ${inclusion === 'start' ? 'active' : ''}`}
              onClick={() => setInclusion('start')}
              style={{ fontSize: '0.8rem' }}
            >
              仅包括首日 (+0)
            </button>
            <button
              type="button"
              className={`segmented-btn ${inclusion === 'end' ? 'active' : ''}`}
              onClick={() => setInclusion('end')}
              style={{ fontSize: '0.8rem' }}
            >
              仅包括尾日 (+0)
            </button>
            <button
              type="button"
              className={`segmented-btn ${inclusion === 'exclude' ? 'active' : ''}`}
              onClick={() => setInclusion('exclude')}
              style={{ fontSize: '0.8rem' }}
            >
              不包括首尾日 (-1)
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '4px' }}>
            {inclusion === 'both' && '「包括首尾日」：计算天数包括起始和结束那两天。'}
            {inclusion === 'start' && '「仅包括首日」：算头不算尾。例如 6月1日 到 6月2日 为 1天。'}
            {inclusion === 'end' && '「仅包括尾日」：算尾不算头。例如 6月1日 到 6月2日 为 1天。'}
            {inclusion === 'exclude' && '「不包括首尾日」：仅计算夹在中间的天数。'}
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
            <p>请选择日期范围开始计算</p>
          </div>
        ) : (
          <div className="results-content">
            <div>
              <div className="result-card-heading">日历天数差 (Local Calendar Diff)</div>
              <div className="big-result-wrapper">
                <span className="big-result-val">
                  {result.totalDays}
                </span>
                <span className="big-result-unit">天</span>
                {result.isNegative && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: 600, marginTop: '4px' }}>
                    （起始日晚于结束日，计算结果为负）
                  </div>
                )}
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">工作日 (周一至周五)</span>
                <span className="stat-value workday">{result.workdays} 天</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">双休日 (周六至周日)</span>
                <span className="stat-value weekend">{result.weekends} 天</span>
              </div>
            </div>

            {/* Absolute elapsed time breakdown */}
            <div style={{ background: 'rgba(0, 0, 0, 0.15)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="stat-label" style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                跨时区绝对时间差 (从起始日0点到结束日0点实际流逝时间)
              </div>
              <div style={{ textAlign: 'center', fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                {result.absoluteDays} 天 {result.absoluteHours} 小时
              </div>
            </div>

            <RangeVisualizer 
              startDateStr={startDate} 
              endDateStr={endDate} 
              totalDays={result.totalDays} 
            />

            <DstAuditor transitions={transitions} zone="" isDualZone={startZone !== endZone} />
          </div>
        )}
      </div>
    </div>
  );
};
