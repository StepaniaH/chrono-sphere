import { forwardRef, useImperativeHandle, useRef } from 'react';
import { CardOffset } from './CardOffset';
import CardInterval from './CardInterval';
import { CardLunar } from './CardLunar';

export type CardRendererHandle = {
  getElement: () => HTMLDivElement | null;
};

export interface CardOffsetData {
  customText: string;
  startDate: string;
  resultDate: string;
  weekday: string;
  zone: string;
  offsetDays: number;
  isBackward: boolean;
  workdays: number;
  weekends: number;
  workdayPercent: number;
  weekendPercent: number;
  lunarStr?: string;
  yearGanZhi?: string;
  shengXiao?: string;
  jieQi?: string;
  festivals?: string[];
  code: string;
  theme: 'auto' | 'light' | 'dark';
  locale: 'zh' | 'en';
}

export interface CardIntervalData {
  customText: string;
  startDate: string;
  endDate: string;
  startZone: string;
  endZone: string;
  totalDays: number;
  isNegative: boolean;
  workdays: number;
  weekends: number;
  workdayPercent: number;
  weekendPercent: number;
  absoluteDays: number;
  absoluteHours: number;
  startLunarStr?: string;
  endLunarStr?: string;
  code: string;
  theme: 'auto' | 'light' | 'dark';
  locale: 'zh' | 'en';
}

export interface CardLunarData {
  customText: string;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeap: boolean;
  lunarStr: string;
  yearGanZhi: string;
  shengXiao: string;
  solarDate: string;
  weekday: string;
  zone: string;
  jieQi?: string;
  festivals?: string[];
  auspicious?: string[];
  inauspicious?: string[];
  code: string;
  theme: 'auto' | 'light' | 'dark';
  locale: 'zh' | 'en';
}

type CardRendererProps =
  | { type: 'offset'; data: CardOffsetData }
  | { type: 'interval'; data: CardIntervalData }
  | { type: 'lunar'; data: CardLunarData };

/**
 * Hidden card renderer for html-to-image capture.
 * Mounts the correct card component inside a share-card container
 * positioned off-screen so it's invisible but rendered.
 */
export const CardRenderer = forwardRef<CardRendererHandle, CardRendererProps>(
  (props, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getElement: () => containerRef.current,
    }));

    return (
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '900px',
          visibility: 'hidden',
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        {props.type === 'offset' && <CardOffset {...props.data} />}
        {props.type === 'interval' && <CardInterval {...props.data} />}
        {props.type === 'lunar' && <CardLunar {...props.data} />}
      </div>
    );
  },
);

CardRenderer.displayName = 'CardRenderer';
