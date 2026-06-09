import React, { useState, useEffect } from 'react';
import { Plus, CalendarRange, Info } from 'lucide-react';
import { Solar } from 'lunar-javascript';
import { TimezoneSelect } from './TimezoneSelect';
import { getLunarDetails, convertLunarToSolar, calculateOffset, getFriendlyZoneLabel } from '../utils/dateUtils';
import type { LunarResult } from '../utils/dateUtils';
import { DateTime } from 'luxon';

// Traditional Chinese Month Names
const LUNAR_MONTHS = [
  { value: 1, label: '正月' },
  { value: 2, label: '二月' },
  { value: 3, label: '三月' },
  { value: 4, label: '四月' },
  { value: 5, label: '五月' },
  { value: 6, label: '六月' },
  { value: 7, label: '七月' },
  { value: 8, label: '八月' },
  { value: 9, label: '九月' },
  { value: 10, label: '十月' },
  { value: 11, label: '十一月 (冬月)' },
  { value: 12, label: '十二月 (腊月)' },
];

// Traditional Chinese Day Names
const LUNAR_DAYS = [
  { value: 1, label: '初一' }, { value: 2, label: '初二' }, { value: 3, label: '初三' }, { value: 4, label: '初四' }, { value: 5, label: '初五' },
  { value: 6, label: '初六' }, { value: 7, label: '初七' }, { value: 8, label: '初八' }, { value: 9, label: '初九' }, { value: 10, label: '初十' },
  { value: 11, label: '十一' }, { value: 12, label: '十二' }, { value: 13, label: '十三' }, { value: 14, label: '十四' }, { value: 15, label: '十五' },
  { value: 16, label: '十六' }, { value: 17, label: '十七' }, { value: 18, label: '十八' }, { value: 19, label: '十九' }, { value: 20, label: '二十' },
  { value: 21, label: '廿一' }, { value: 22, label: '廿二' }, { value: 23, label: '廿三' }, { value: 24, label: '廿四' }, { value: 25, label: '廿五' },
  { value: 26, label: '廿六' }, { value: 27, label: '廿七' }, { value: 28, label: '廿八' }, { value: 29, label: '廿九' }, { value: 30, label: '三十' }
];

// Year range: 1950 to 2080
const years = Array.from({ length: 131 }, (_, i) => 1950 + i);

export const LunarCalculator: React.FC = () => {
  // Initialize timezone locally
  const [zone, setZone] = useState(() => {
    try {
      return DateTime.local().zoneName || 'Asia/Shanghai';
    } catch {
      return 'Asia/Shanghai';
    }
  });

  // Default values based on current local date
  const [year, setYear] = useState(() => {
    try {
      const jsDate = new Date();
      const solar = Solar.fromDate(jsDate);
      const lunar = solar.getLunar();
      return lunar.getYear();
    } catch {
      return 2026;
    }
  });
  const [month, setMonth] = useState(() => {
    try {
      const jsDate = new Date();
      const solar = Solar.fromDate(jsDate);
      const lunar = solar.getLunar();
      return Math.abs(lunar.getMonth());
    } catch {
      return 4;
    }
  });
  const [day, setDay] = useState(() => {
    try {
      const jsDate = new Date();
      const solar = Solar.fromDate(jsDate);
      const lunar = solar.getLunar();
      return lunar.getDay();
    } catch {
      return 24;
    }
  });
  const [isLeap, setIsLeap] = useState(() => {
    try {
      const jsDate = new Date();
      const solar = Solar.fromDate(jsDate);
      const lunar = solar.getLunar();
      return lunar.isLeap();
    } catch {
      return false;
    }
  });
  const [offsetStr, setOffsetStr] = useState('10');
  const [mode, setMode] = useState<'thDay' | 'interval'>('interval');

  // Outputs
  const [startSolarDate, setStartSolarDate] = useState<string>('');
  const [startLunarDetails, setStartLunarDetails] = useState<LunarResult | null>(null);
  const [targetSolarDate, setTargetSolarDate] = useState<string>('');
  const [targetLunarDetails, setTargetLunarDetails] = useState<LunarResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Recalculate
  useEffect(() => {
    setError(null);
    setStartLunarDetails(null);
    setTargetLunarDetails(null);

    const offset = parseInt(offsetStr, 10);
    if (isNaN(offset)) {
      setError('请输入向后计算的有效天数');
      return;
    }

    // 1. Convert start lunar date to solar date
    const conv = convertLunarToSolar(year, month, day, isLeap);
    if (!conv.success || !conv.dateStr) {
      setError(conv.error || '该农历日期在此年份不存在，请检查是否输入了错误的闰月或大/小月天数');
      return;
    }

    setStartSolarDate(conv.dateStr);

    // Fetch start date lunar details
    const startDetails = getLunarDetails(conv.dateStr, zone);
    setStartLunarDetails(startDetails);

    // 2. Add offset to the converted solar date
    const calc = calculateOffset(conv.dateStr, offset, mode, zone);
    if (!calc.success || !calc.result) {
      setError(calc.error || '天数偏移计算出错');
      return;
    }

    setTargetSolarDate(calc.result.dateStr);

    // 3. Convert target solar date back to lunar details
    const targetDetails = getLunarDetails(calc.result.dateStr, zone);
    setTargetLunarDetails(targetDetails);

  }, [year, month, day, isLeap, offsetStr, mode, zone]);

  // Sync year/month/day with current date on first mount
  useEffect(() => {
    try {
      const todayStr = DateTime.now().setZone(zone).toFormat('yyyy-MM-dd');
      const details = getLunarDetails(todayStr, zone);
      if (details) {
        // Parse lunarStr to approximate values if needed, but since lunar-javascript returns objects under the hood,
        // we can extract details from l-j directly.
        // For simplicity, we just initialize to 2026 (丙午马年) as the baseline.
      }
    } catch {}
  }, [zone]);

  return (
    <div className="calculator-grid fade-in">
      {/* Form section */}
      <div className="form-section">
        <div className="form-group">
          <label className="form-label">基准时区</label>
          <TimezoneSelect value={zone} onChange={setZone} />
        </div>

        {/* Lunar Date Picker */}
        <div style={{ border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', padding: '15px', background: 'rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>●</span> 起始农历日期
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>农历年份</label>
              <select 
                className="form-input" 
                style={{ paddingLeft: '12px' }}
                value={year}
                onChange={e => setYear(parseInt(e.target.value, 10))}
              >
                {years.map(y => (
                  <option key={y} value={y} style={{ background: '#121225' }}>{y}年</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>农历月份</label>
              <select 
                className="form-input" 
                style={{ paddingLeft: '12px' }}
                value={month}
                onChange={e => setMonth(parseInt(e.target.value, 10))}
              >
                {LUNAR_MONTHS.map(m => (
                  <option key={m.value} value={m.value} style={{ background: '#121225' }}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>农历日期</label>
              <select 
                className="form-input" 
                style={{ paddingLeft: '12px' }}
                value={day}
                onChange={e => setDay(parseInt(e.target.value, 10))}
              >
                {LUNAR_DAYS.map(d => (
                  <option key={d.value} value={d.value} style={{ background: '#121225' }}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="isLeap"
              checked={isLeap}
              onChange={e => setIsLeap(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
            />
            <label htmlFor="isLeap" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              此月是闰月 (例如：闰四月)
            </label>
          </div>

          {startSolarDate && startLunarDetails && (
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '4px', border: '1px dashed rgba(255, 255, 255, 0.05)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>对应公历：<strong>{startSolarDate}</strong></div>
              <div>干支生肖：{startLunarDetails.yearGanZhi}年 ({startLunarDetails.shengXiao}年)</div>
            </div>
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
        </div>

        <div className="form-group">
          <label className="form-label">天数偏移 (X)</label>
          <div className="input-icon-wrapper">
            <Plus className="input-icon" size={18} />
            <input
              type="number"
              className="form-input"
              value={offsetStr}
              onChange={e => setOffsetStr(e.target.value)}
              min={mode === 'thDay' ? 1 : undefined}
            />
          </div>
        </div>
      </div>

      {/* Results section */}
      <div className="results-section">
        {error ? (
          <div className="results-placeholder" style={{ color: 'var(--color-error)' }}>
            <Info size={32} style={{ marginBottom: '10px' }} />
            <p>{error}</p>
          </div>
        ) : !targetLunarDetails ? (
          <div className="results-placeholder">
            <CalendarRange className="placeholder-icon" size={48} />
            <p>请选择农历日期并开始计算</p>
          </div>
        ) : (
          <div className="results-content">
            {/* Target Gregorian Date */}
            <div>
              <div className="result-card-heading">公历对应日期</div>
              <div style={{ marginTop: '10px' }}>
                <div className="big-date-display">{targetSolarDate}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className="meta-pill">周{targetSolarDate ? DateTime.fromISO(targetSolarDate).setLocale('zh-CN').toFormat('ccc') : ''}</span>
                  <span className="meta-pill">{getFriendlyZoneLabel(zone).split(' - ')[1] || zone}</span>
                </div>
              </div>
            </div>

            {/* Target Lunar Date */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '15px' }}>
              <div className="result-card-heading">农历计算结果</div>
              <div style={{ textAlign: 'center', margin: '12px 0' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)', textShadow: '0 0 10px rgba(99, 102, 241, 0.2)' }}>
                  {targetLunarDetails.lunarStr}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <span className="meta-pill">{targetLunarDetails.yearGanZhi}年</span>
                  <span className="meta-pill">属{targetLunarDetails.shengXiao}</span>
                  {targetLunarDetails.jieQi && (
                    <span className="meta-pill" style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                      {targetLunarDetails.jieQi}
                    </span>
                  )}
                  {targetLunarDetails.festivals.map(f => (
                    <span key={f} className="meta-pill" style={{ borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)', background: 'rgba(168, 85, 247, 0.05)' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Almanac Daily Yi & Ji (黄历宜忌) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '15px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
                  宜 (Auspicious)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {targetLunarDetails.yi.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>诸事不宜</span>
                  ) : (
                    targetLunarDetails.yi.slice(0, 8).map(y => (
                      <span key={y} style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-success)' }}>
                        {y}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-error)', borderBottom: '1px solid rgba(239, 68, 68, 0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
                  忌 (Inauspicious)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {targetLunarDetails.ji.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>诸事无忌</span>
                  ) : (
                    targetLunarDetails.ji.slice(0, 8).map(j => (
                      <span key={j} style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-error)' }}>
                        {j}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
