import React from 'react';
import { Calendar } from 'lucide-react';

interface RangeVisualizerProps {
  startDateStr: string;
  endDateStr: string;
  totalDays: number;
}

export const RangeVisualizer: React.FC<RangeVisualizerProps> = ({
  startDateStr,
  endDateStr,
  totalDays,
}) => {
  const displayDays = Math.abs(totalDays);
  
  return (
    <div className="range-visualizer fade-in">
      <div className="result-card-heading">
        <Calendar size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        <span>区间可视化</span>
      </div>
      
      <div className="timeline-track">
        <div 
          className="timeline-progress" 
          style={{ width: '100%', left: '0%' }}
        />
        <div className="timeline-node start" style={{ left: '0%' }} />
        <div className="timeline-node end" style={{ left: '100%' }} />
      </div>
      
      <div className="timeline-labels">
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{startDateStr}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>起始点</div>
        </div>
        
        <div style={{ textAlign: 'center', alignSelf: 'center' }}>
          <div style={{ 
            fontWeight: 700, 
            color: 'var(--accent-primary)',
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            {totalDays < 0 ? `倒退 ${displayDays} 天` : `经过 ${displayDays} 天`}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{endDateStr}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>结束点</div>
        </div>
      </div>
    </div>
  );
};
