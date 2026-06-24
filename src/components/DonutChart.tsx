import React from 'react';

interface DonutChartProps {
  percent: number;
  label: string;
  sublabel: string;
  color: string;
  size?: number;
}

/**
 * SVG donut chart with percentage in center.
 * Used in share cards for workday/weekend breakdown.
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  percent, label, sublabel, color, size = 128,
}) => {
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 11;
  const circumference = 2 * Math.PI * r;
  const dashLength = (percent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--surface-raised)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dashLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Center text */}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle" dominantBaseline="central"
          fontSize="34" fontWeight="650" fill="var(--text-primary)"
          fontFamily="ui-rounded, system-ui, sans-serif"
        >
          {percent}%
        </text>
        <text
          x={cx} y={cy + 24}
          textAnchor="middle" dominantBaseline="central"
          fontSize="17" fontWeight="400" fill="var(--text-muted)"
          fontFamily="ui-rounded, system-ui, sans-serif"
        >
          {sublabel}
        </text>
      </svg>
      <span style={{
        fontSize: 20, fontWeight: 550, color: 'var(--text-secondary)',
        letterSpacing: '0.02em',
      }}>
        {label}
      </span>
    </div>
  );
};

export default DonutChart;
