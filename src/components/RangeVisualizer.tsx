import React from 'react';
import { Calendar, Clock, Sparkles, Activity } from 'lucide-react';
import { DateTime } from 'luxon';
import { getLunarDetails, detectDstTransitions } from '../utils/dateUtils';

interface RangeVisualizerProps {
  startDateStr: string;
  endDateStr: string;
  totalDays: number;
  startZone?: string;
  endZone?: string;
}

interface TimelineMarker {
  key: string;
  dateStr: string;
  percent: number;
  label: string;
  type: 'dst' | 'holiday' | 'jieqi';
}

export const RangeVisualizer: React.FC<RangeVisualizerProps> = ({
  startDateStr,
  endDateStr,
  totalDays,
  startZone = 'UTC',
  endZone = 'UTC',
}) => {
  const absDays = Math.abs(totalDays);
  const isNegative = totalDays < 0;

  // Swapped chronological boundaries for visualization math
  const startISO = isNegative ? endDateStr : startDateStr;
  const endISO = isNegative ? startDateStr : endDateStr;
  const zoneStart = isNegative ? endZone : startZone;
  const zoneEnd = isNegative ? startZone : endZone;

  // 1. Calculate workday vs weekend ratio
  let workdays = 0;
  let weekends = 0;

  try {
    const startUtc = DateTime.fromISO(startISO, { zone: 'UTC' }).startOf('day');
    const endUtc = DateTime.fromISO(endISO, { zone: 'UTC' }).startOf('day');
    
    if (startUtc.isValid && endUtc.isValid) {
      let current = startUtc;
      while (current <= endUtc) {
        const wd = current.weekday; // 1 = Mon, 7 = Sun
        if (wd === 6 || wd === 7) {
          weekends++;
        } else {
          workdays++;
        }
        current = current.plus({ days: 1 });
      }
    }
  } catch (e) {
    console.error('Ratio calculation failed:', e);
  }

  const totalSegmentDays = workdays + weekends || 1;
  const workdayPercent = (workdays / totalSegmentDays) * 100;
  const weekendPercent = (weekends / totalSegmentDays) * 100;

  // 2. Scan for timeline markers (Only for reasonable ranges to prevent slowdown)
  const markers: TimelineMarker[] = [];
  
  if (absDays > 0 && absDays <= 90) {
    try {
      const dtStart = DateTime.fromISO(startISO, { zone: zoneStart }).startOf('day');
      const dtEnd = DateTime.fromISO(endISO, { zone: zoneEnd }).startOf('day');
      const totalHoursDiff = Math.abs(dtEnd.diff(dtStart, 'hours').hours) || 24;

      // Scan for DST transitions
      const dstTransitions = detectDstTransitions(startISO, endISO, zoneStart);
      if (zoneStart !== zoneEnd) {
        const dstEnd = detectDstTransitions(startISO, endISO, zoneEnd);
        dstTransitions.push(...dstEnd);
      }

      // Add DST markers
      const seenDates = new Set<string>();
      dstTransitions.forEach(t => {
        if (seenDates.has(t.date)) return;
        seenDates.add(t.date);

        const dtMarker = DateTime.fromISO(t.date, { zone: zoneStart });
        const hoursPassed = dtMarker.diff(dtStart, 'hours').hours;
        let percent = (hoursPassed / totalHoursDiff) * 100;
        percent = Math.max(3, Math.min(97, percent)); // cap boundaries

        markers.push({
          key: `dst-${t.date}`,
          dateStr: t.date,
          percent,
          label: '夏令时',
          type: 'dst'
        });
      });

      // Scan for major Lunar holidays & solar terms day-by-day
      let current = dtStart;
      let stepCount = 0;
      while (current <= dtEnd && stepCount < 100) {
        stepCount++;
        const currISO = current.toFormat('yyyy-MM-dd');
        const lunar = getLunarDetails(currISO, zoneStart);
        
        if (lunar) {
          const hoursPassed = current.diff(dtStart, 'hours').hours;
          let percent = (hoursPassed / totalHoursDiff) * 100;
          percent = Math.max(3, Math.min(97, percent));

          // Check Solar Terms (节气)
          if (lunar.jieQi) {
            markers.push({
              key: `jieqi-${currISO}`,
              dateStr: currISO,
              percent,
              label: lunar.jieQi,
              type: 'jieqi'
            });
          }

          // Check festivals (holiday) - take first if multiple
          if (lunar.festivals && lunar.festivals.length > 0) {
            // Filter out minor ones if possible, or take first
            const mainFestival = lunar.festivals[0];
            markers.push({
              key: `holiday-${currISO}`,
              dateStr: currISO,
              percent,
              label: mainFestival.substring(0, 4), // cap name length
              type: 'holiday'
            });
          }
        }
        current = current.plus({ days: 1 });
      }
    } catch (e) {
      console.error('Timeline scanning failed:', e);
    }
  }

  // Filter overlapping markers (prioritize Holiday > JieQi > DST)
  const sortedMarkers = markers.sort((a, b) => a.percent - b.percent);
  const visibleMarkers: TimelineMarker[] = [];
  let lastPercent = -20; // threshold separation

  sortedMarkers.forEach(m => {
    if (m.percent - lastPercent >= 8) { // Minimum 8% gap to prevent visual overlap
      visibleMarkers.push(m);
      lastPercent = m.percent;
    }
  });

  return (
    <div className="range-visualizer fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="result-card-heading">
        <Activity size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        <span>区间结构与关键节点</span>
      </div>

      {/* 1. Day Type Ratio Breakdown Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>工作日占比：{Math.round(workdayPercent)}% ({workdays}天)</span>
          <span>双休日占比：{Math.round(weekendPercent)}% ({weekends}天)</span>
        </div>
        <div style={{ display: 'flex', height: '10px', width: '100%', borderRadius: '50px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
          {workdays > 0 && (
            <div 
              style={{ 
                width: `${workdayPercent}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #10b981, #059669)',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
              }} 
            />
          )}
          {weekends > 0 && (
            <div 
              style={{ 
                width: `${weekendPercent}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)'
              }} 
            />
          )}
        </div>
      </div>

      {/* 2. Spatiotemporal Marker Timeline */}
      <div style={{ padding: '0 10px', marginTop: '5px' }}>
        <div className="timeline-track" style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="timeline-progress" style={{ width: '100%', left: '0%' }} />
          
          {/* Start node */}
          <div className="timeline-node start" style={{ left: '0%' }} />

          {/* Dynamic Event nodes */}
          {visibleMarkers.map(m => (
            <div 
              key={m.key}
              className={`timeline-marker-wrapper`}
              style={{ 
                position: 'absolute', 
                left: `${m.percent}%`, 
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10
              }}
            >
              {/* Marker Dot */}
              <div 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: m.type === 'dst' ? 'var(--color-warning)' : m.type === 'holiday' ? 'var(--accent-secondary)' : 'var(--color-success)',
                  border: '2px solid #0f0f1b',
                  boxShadow: '0 0 6px rgba(255, 255, 255, 0.4)'
                }} 
              />
              {/* Tooltip text under the line */}
              <div 
                style={{ 
                  whiteSpace: 'nowrap',
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                  marginTop: '12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                {m.type === 'dst' && <Clock size={10} style={{ color: 'var(--color-warning)' }} />}
                {m.type === 'holiday' && <Sparkles size={10} style={{ color: 'var(--accent-secondary)' }} />}
                {m.type === 'jieqi' && <Calendar size={10} style={{ color: 'var(--color-success)' }} />}
                <span>{m.label}</span>
              </div>
            </div>
          ))}

          {/* End node */}
          <div className="timeline-node end" style={{ left: '100%' }} />
        </div>

        <div className="timeline-labels" style={{ marginTop: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{startDateStr}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              起始 {startZone !== 'UTC' && `(${startZone.split('/').pop()?.replace('_', ' ')})`}
            </div>
          </div>
          
          <div style={{ textAlign: 'center', alignSelf: 'center' }}>
            <div style={{ 
              fontWeight: 700, 
              color: 'var(--accent-primary)',
              background: 'rgba(99, 102, 241, 0.1)',
              padding: '2px 10px',
              borderRadius: '50px',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: '0.75rem'
            }}>
              {totalDays < 0 ? `倒退 ${absDays} 天` : `跨越 ${absDays} 天`}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{endDateStr}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              结束 {endZone !== 'UTC' && `(${endZone.split('/').pop()?.replace('_', ' ')})`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
