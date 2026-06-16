import React from 'react';
import { Calendar, Clock, Sparkles, Activity } from 'lucide-react';
import { DateTime } from 'luxon';
import { getLunarDetails, detectDstTransitions } from '../utils/dateUtils';
import { translate, type Locale } from '../i18n';

interface RangeVisualizerProps {
  startDateStr: string;
  endDateStr: string;
  totalDays: number;
  startZone?: string;
  endZone?: string;
  locale?: Locale;
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
  locale = 'zh',
}) => {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  const absDays = Math.abs(totalDays);
  const isNegative = totalDays < 0;

  const startISO = isNegative ? endDateStr : startDateStr;
  const endISO = isNegative ? startDateStr : endDateStr;
  const zoneStart = isNegative ? endZone : startZone;
  const zoneEnd = isNegative ? startZone : endZone;

  let workdays = 0;
  let weekends = 0;

  try {
    const startUtc = DateTime.fromISO(startISO, { zone: 'UTC' }).startOf('day');
    const endUtc = DateTime.fromISO(endISO, { zone: 'UTC' }).startOf('day');

    if (startUtc.isValid && endUtc.isValid) {
      let current = startUtc;
      while (current <= endUtc) {
        const wd = current.weekday;
        if (wd === 6 || wd === 7) {
          weekends++;
        } else {
          workdays++;
        }
        current = current.plus({ days: 1 });
      }
    }
  } catch (error) {
    console.error('Ratio calculation failed:', error);
  }

  const totalSegmentDays = workdays + weekends || 1;
  const workdayPercent = (workdays / totalSegmentDays) * 100;
  const weekendPercent = (weekends / totalSegmentDays) * 100;

  const markers: TimelineMarker[] = [];

  if (absDays > 0 && absDays <= 90) {
    try {
      const dtStart = DateTime.fromISO(startISO, { zone: zoneStart }).startOf('day');
      const dtEnd = DateTime.fromISO(endISO, { zone: zoneEnd }).startOf('day');
      const totalHoursDiff = Math.abs(dtEnd.diff(dtStart, 'hours').hours) || 24;

      const dstTransitions = detectDstTransitions(startISO, endISO, zoneStart, locale);
      if (zoneStart !== zoneEnd) {
        dstTransitions.push(...detectDstTransitions(startISO, endISO, zoneEnd, locale));
      }

      const seenDates = new Set<string>();
      dstTransitions.forEach((transition) => {
        if (seenDates.has(transition.date)) return;
        seenDates.add(transition.date);

        const dtMarker = DateTime.fromISO(transition.date, { zone: zoneStart });
        const hoursPassed = dtMarker.diff(dtStart, 'hours').hours;
        let percent = (hoursPassed / totalHoursDiff) * 100;
        percent = Math.max(3, Math.min(97, percent));

        markers.push({
          key: `dst-${transition.date}`,
          dateStr: transition.date,
          percent,
          label: t('visualizer.dst'),
          type: 'dst',
        });
      });

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

          if (lunar.jieQi) {
            markers.push({
              key: `jieqi-${currISO}`,
              dateStr: currISO,
              percent,
              label: lunar.jieQi,
              type: 'jieqi',
            });
          }

          if (lunar.festivals && lunar.festivals.length > 0) {
            const mainFestival = lunar.festivals[0];
            markers.push({
              key: `holiday-${currISO}`,
              dateStr: currISO,
              percent,
              label: mainFestival.substring(0, 4),
              type: 'holiday',
            });
          }
        }
        current = current.plus({ days: 1 });
      }
    } catch (error) {
      console.error('Timeline scanning failed:', error);
    }
  }

  const sortedMarkers = markers.sort((a, b) => a.percent - b.percent);
  const visibleMarkers: TimelineMarker[] = [];
  let lastPercent = -20;

  sortedMarkers.forEach((marker) => {
    if (marker.percent - lastPercent >= 8) {
      visibleMarkers.push(marker);
      lastPercent = marker.percent;
    }
  });

  const zoneLabel = (zone: string) => {
    if (zone === 'UTC') return 'UTC';
    return zone.split('/').pop()?.replaceAll('_', ' ') || zone;
  };

  return (
    <div className="range-visualizer fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="result-card-heading">
        <Activity size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        <span>{t('visualizer.title')}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>
            {t('visualizer.workdayShare')}：{Math.round(workdayPercent)}% ({workdays}{t('interval.totalDaysUnit')})
          </span>
          <span>
            {t('visualizer.weekendShare')}：{Math.round(weekendPercent)}% ({weekends}{t('interval.totalDaysUnit')})
          </span>
        </div>
        <div style={{ display: 'flex', height: '10px', width: '100%', borderRadius: '50px', overflow: 'hidden', background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)' }}>
          {workdays > 0 && (
            <div
              style={{
                width: `${workdayPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)',
              }}
            />
          )}
          {weekends > 0 && (
            <div
              style={{
                width: `${weekendPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)',
              }}
            />
          )}
        </div>
      </div>

      <div style={{ padding: '0 10px', marginTop: '5px' }}>
        <div className="timeline-track" style={{ height: '4px', background: 'var(--surface-line)' }}>
          <div className="timeline-progress" style={{ width: '100%', left: '0%' }} />
          <div className="timeline-node start" style={{ left: '0%' }} />

          {visibleMarkers.map((marker) => (
            <div
              key={marker.key}
              className="timeline-marker-wrapper"
              style={{
                position: 'absolute',
                left: `${marker.percent}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background:
                    marker.type === 'dst'
                      ? 'var(--color-warning)'
                      : marker.type === 'holiday'
                        ? 'var(--accent-secondary)'
                        : 'var(--color-success)',
                  border: '2px solid var(--bg-page)',
                  boxShadow: '0 0 6px rgba(255, 255, 255, 0.4)',
                }}
              />
              <div
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                  marginTop: '12px',
                  background: 'var(--surface-popover)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                {marker.type === 'dst' && <Clock size={10} style={{ color: 'var(--color-warning)' }} />}
                {marker.type === 'holiday' && <Sparkles size={10} style={{ color: 'var(--accent-secondary)' }} />}
                {marker.type === 'jieqi' && <Calendar size={10} style={{ color: 'var(--color-success)' }} />}
                <span>{marker.label}</span>
              </div>
            </div>
          ))}

          <div className="timeline-node end" style={{ left: '100%' }} />
        </div>

        <div className="timeline-labels" style={{ marginTop: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{startDateStr}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {t('visualizer.start')} {zoneStart !== 'UTC' && `(${zoneLabel(zoneStart)})`}
            </div>
          </div>

          <div style={{ textAlign: 'center', alignSelf: 'center' }}>
            <div
              style={{
                fontWeight: 700,
                color: 'var(--accent-primary)',
                background: 'var(--surface-highlight)',
                padding: '2px 10px',
                borderRadius: '50px',
                border: '1px solid var(--border-accent)',
                fontSize: '0.75rem',
              }}
            >
              {totalDays < 0 ? t('visualizer.reversing', { days: absDays }) : t('visualizer.spanning', { days: absDays })}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{endDateStr}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {t('visualizer.end')} {endZone !== 'UTC' && `(${zoneLabel(endZone)})`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
