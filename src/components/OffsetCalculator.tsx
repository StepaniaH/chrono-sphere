import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CalendarRange } from 'lucide-react';
import { calculateOffset, detectDstTransitions, getLunarDetails } from '../utils/dateUtils';
import type { DateResult, DstTransition } from '../utils/dateUtils';
import { TimezoneSelect } from './TimezoneSelect';
import { DstAuditor } from './DstAuditor';
import { RangeVisualizer } from './RangeVisualizer';
import { DateTime } from 'luxon';

export const OffsetCalculator: React.FC = () => {
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
  
  const [result, setResult] = useState<DateResult | null>(null);
  const [transitions, setTransitions] = useState<DstTransition[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync starting date if the timezone changes
  useEffect(() => {
    if (!startDate) {
      setStartDate(getTodayStr(zone));
    }
  }, [zone]);

  // Recalculate whenever inputs change
  useEffect(() => {
    setError(null);
    const offset = parseInt(offsetStr, 10);

    if (!startDate) {
      setResult(null);
      setTransitions([]);
      return;
    }

    if (isNaN(offset)) {
      setError('请输入有效的数字');
      setResult(null);
      setTransitions([]);
      return;
    }

    const calc = calculateOffset(startDate, offset, mode, zone);
    if (calc.success && calc.result) {
      setResult(calc.result);
      const dst = detectDstTransitions(startDate, calc.result.dateStr, zone);
      setTransitions(dst);
    } else {
      setError(calc.error || '计算出错');
      setResult(null);
      setTransitions([]);
    }
  }, [startDate, offsetStr, mode, zone]);

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOffsetStr(e.target.value);
  };

  return (
    <div className="calculator-grid fade-in">
      {/* Form controls */}
      <div className="form-section">
        <div className="form-group">
          <label className="form-label">基准时区</label>
          <TimezoneSelect value={zone} onChange={setZone} />
        </div>

        <div className="form-group">
          <label className="form-label">起始日期</label>
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
                return details ? `农历：${details.lunarStr} (${details.yearGanZhi}${details.shengXiao}年)` : '';
              })()}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">模式选择</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${mode === 'interval' ? 'active' : ''}`}
              onClick={() => setMode('interval')}
            >
              间隔 X 日 (D + X)
            </button>
            <button
              type="button"
              className={`segmented-btn ${mode === 'thDay' ? 'active' : ''}`}
              onClick={() => setMode('thDay')}
            >
              第 X 日 (D + X - 1)
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
            {mode === 'interval' 
              ? '「间隔 X 日」：从起始日算起，跨越 X 天。例如 6月1日 间隔 2天 是 6月3日。'
              : '「第 X 日」：起始日算作第 1 天。例如 6月1日 的第 2 天是 6月2日（要求 X ≥ 1）。'}
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">向后计算天数 (X)</label>
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
            <p>请输入有效参数开始计算</p>
          </div>
        ) : (
          <div className="results-content">
            <div>
              <div className="result-card-heading">计算结果</div>
              <div style={{ marginTop: '15px' }}>
                <div className="big-date-display">{result.dateStr}</div>
                <div className="date-meta-info">
                  <span className="meta-pill">{result.weekday}</span>
                  <span className="meta-pill">UTC{result.offsetHours >= 0 ? `+${result.offsetHours}` : result.offsetHours} ({result.offsetName})</span>
                  {result.isDst && <span className="meta-pill dst-active">夏令时中</span>}
                </div>
                {(() => {
                  const details = getLunarDetails(result.dateStr, zone);
                  if (!details) return null;
                  return (
                    <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderTop: '1px dashed rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '1.25rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                        农历 {details.lunarStr}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <span className="meta-pill">{details.yearGanZhi}年</span>
                        <span className="meta-pill">属{details.shengXiao}</span>
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
              totalDays={parseInt(offsetStr, 10) * (mode === 'thDay' ? 1 : 1) - (mode === 'thDay' ? 1 : 0)} 
              startZone={zone}
              endZone={zone}
            />

            <DstAuditor transitions={transitions} zone={zone} />
          </div>
        )}
      </div>
    </div>
  );
};
