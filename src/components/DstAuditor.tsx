import React from 'react';
import { Clock, HelpCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { DstTransition } from '../utils/dateUtils';

export interface DstTransitionWithZone extends DstTransition {
  zoneName?: string;
}

interface DstAuditorProps {
  transitions: DstTransitionWithZone[];
  zone: string;
  isDualZone?: boolean;
}

export const DstAuditor: React.FC<DstAuditorProps> = ({ transitions, zone, isDualZone = false }) => {
  const hasTransitions = transitions.length > 0;

  return (
    <div className="dst-auditor-card fade-in">
      <div className="dst-auditor-header">
        <Clock size={16} />
        <span>夏令时变更审计 (DST Auditor)</span>
      </div>

      {!hasTransitions ? (
        <div className="dst-no-transition-text">
          <HelpCircle size={14} className="text-muted" />
          <span>
            在所选计算范围内，
            {isDualZone ? '所涉及的两个时区' : <strong>{zone}</strong>}
            均未发生夏令时令时切换。
          </span>
        </div>
      ) : (
        <div className="dst-transitions-list">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            检测到所选期间包含 <strong>{transitions.length}</strong> 次夏令时转换事件：
          </p>
          {transitions.map((t, idx) => (
            <div key={idx} className="dst-transition-item">
              <div className="dst-transition-icon-wrapper">
                {t.type === 'forward' ? (
                  <ArrowUpRight size={18} style={{ color: 'var(--color-warning)' }} />
                ) : (
                  <ArrowDownRight size={18} style={{ color: 'var(--color-info)' }} />
                )}
              </div>
              <div className="dst-transition-details">
                <div className="dst-transition-meta">
                  {t.zoneName && <span style={{ color: 'var(--accent-primary)', marginRight: '6px', fontWeight: 600 }}>[{t.zoneName}]</span>}
                  <span>{t.date}</span>
                  <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>|</span>
                  <span>{t.fromOffsetName} → {t.toOffsetName}</span> 
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    ({t.shiftMinutes > 0 ? `+${t.shiftMinutes}分钟` : `${t.shiftMinutes}分钟`})
                  </span>
                </div>
                <div className="dst-transition-desc">{t.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
