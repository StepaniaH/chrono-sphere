import { describe, it, expect } from 'vitest';
import { encodeCardCode, decodeCardCode } from './cardCodec';
import type { CardCode, OffsetParams, IntervalParams, LunarParams } from './cardCodec';

function roundtrip(card: CardCode, expectedLen?: number): CardCode {
  const encoded = encodeCardCode(card);
  if (expectedLen !== undefined) {
    expect(encoded.length).toBeLessThanOrEqual(expectedLen);
  }
  const decoded = decodeCardCode(encoded);
  expect(decoded).not.toBeNull();
  return decoded!;
}

describe('cardCodec', () => {
  describe('offset card roundtrip', () => {
    it('should encode/decode a simple forward offset card', () => {
      const original: CardCode = {
        version: 0,
        tab: 'offset',
        theme: 'auto',
        templateId: 0,
        customText: '',
        params: {
          zone: 'Asia/Shanghai',
          startDate: '2026-06-01',
          offset: 100,
          mode: 'interval',
          direction: 'forward',
        } satisfies OffsetParams,
      };

      const decoded = roundtrip(original, 20);

      expect(decoded.tab).toBe('offset');
      expect(decoded.templateId).toBe(0);

      const p = decoded.params as OffsetParams;
      expect(p.zone).toBe('Asia/Shanghai');
      expect(p.startDate).toBe('2026-06-01');
      expect(p.offset).toBe(100);
      expect(p.mode).toBe('interval');
      expect(p.direction).toBe('forward');
    });

    it('should handle backward thDay mode', () => {
      const original: CardCode = {
        version: 0,
        tab: 'offset',
        theme: 'dark',
        templateId: 2,
        customText: '生日',
        params: {
          zone: 'America/New_York',
          startDate: '1990-03-15',
          offset: 5,
          mode: 'thDay',
          direction: 'backward',
        } satisfies OffsetParams,
      };

      const decoded = roundtrip(original);

      expect(decoded.theme).toBe('dark');
      expect(decoded.templateId).toBe(2);
      expect(decoded.customText).toBe('生日');

      const p = decoded.params as OffsetParams;
      expect(p.zone).toBe('America/New_York');
      expect(p.startDate).toBe('1990-03-15');
      expect(p.offset).toBe(5);
      expect(p.mode).toBe('thDay');
      expect(p.direction).toBe('backward');
    });
  });

  describe('interval card roundtrip', () => {
    it('should encode/decode interval with different timezones', () => {
      const original: CardCode = {
        version: 0,
        tab: 'interval',
        theme: 'auto',
        templateId: 1,
        customText: '',
        params: {
          startZone: 'Asia/Shanghai',
          endZone: 'America/New_York',
          startDate: '2026-06-01',
          endDate: '2026-06-15',
          inclusion: 'both',
        } satisfies IntervalParams,
      };

      const decoded = roundtrip(original, 25);

      expect(decoded.tab).toBe('interval');

      const p = decoded.params as IntervalParams;
      expect(p.startZone).toBe('Asia/Shanghai');
      expect(p.endZone).toBe('America/New_York');
      expect(p.startDate).toBe('2026-06-01');
      expect(p.endDate).toBe('2026-06-15');
      expect(p.inclusion).toBe('both');
    });

    it('should handle exclude inclusion', () => {
      const original: CardCode = {
        version: 0,
        tab: 'interval',
        theme: 'light',
        templateId: 0,
        customText: '',
        params: {
          startZone: 'UTC',
          endZone: 'UTC',
          startDate: '2026-01-01',
          endDate: '2026-01-10',
          inclusion: 'exclude',
        } satisfies IntervalParams,
      };

      const decoded = roundtrip(original);
      const p = decoded.params as IntervalParams;
      expect(p.inclusion).toBe('exclude');
    });
  });

  describe('lunar card roundtrip', () => {
    it('should encode/decode lunar params', () => {
      const original: CardCode = {
        version: 0,
        tab: 'lunar',
        theme: 'auto',
        templateId: 0,
        customText: '',
        params: {
          zone: 'Asia/Shanghai',
          year: 2026,
          month: 5,
          day: 6,
          leap: false,
          mode: 'interval',
          offset: 0,
        } satisfies LunarParams,
      };

      const decoded = roundtrip(original, 25);

      expect(decoded.tab).toBe('lunar');

      const p = decoded.params as LunarParams;
      expect(p.zone).toBe('Asia/Shanghai');
      expect(p.year).toBe(2026);
      expect(p.month).toBe(5);
      expect(p.day).toBe(6);
      expect(p.leap).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return null for invalid code', () => {
      expect(decodeCardCode('!!!invalid!!!')).toBeNull();
      expect(decodeCardCode('')).toBeNull();
    });

    it('should decode valid codes', () => {
      const code = encodeCardCode({
        version: 0, tab: 'offset', theme: 'auto', templateId: 0, customText: '',
        params: { zone: 'UTC', startDate: '2026-01-01', offset: 0, mode: 'interval', direction: 'forward' } satisfies OffsetParams,
      } as CardCode);
      expect(decodeCardCode(code)).not.toBeNull();
    });
  });

  describe('code length', () => {
    it('should produce short codes for simple cards', () => {
      const card: CardCode = {
        version: 0, tab: 'offset', theme: 'auto', templateId: 0, customText: '',
        params: { zone: 'Asia/Shanghai', startDate: '2026-01-01', offset: 10, mode: 'interval', direction: 'forward' } satisfies OffsetParams,
      };
      const code = encodeCardCode(card);
      expect(code.length).toBeLessThanOrEqual(20);
      expect(code).toMatch(/^[0-9A-Za-z]+$/);
    });
  });
});
