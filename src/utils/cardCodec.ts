/**
 * Binary encoding/decoding for share card parameters.
 *
 * Format:
 *   [version:4bit] [tab:2bit] [theme:2bit] [template:8bit]
 *   [customLen:5bit] [customText:0-90B]
 *   [payload:N B]  — tab-specific
 *
 * Encoded as base62 string.
 */

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export type CardTab = 'offset' | 'interval' | 'lunar';
export type CardTheme = 'auto' | 'light' | 'dark';

export interface CardCode {
  version: number;
  tab: CardTab;
  theme: CardTheme;
  templateId: number;
  customText: string;
  /** Tab-specific parameters */
  params: OffsetParams | IntervalParams | LunarParams;
}

export interface OffsetParams {
  zone: string;
  startDate: string; // yyyy-MM-dd
  offset: number;
  mode: 'thDay' | 'interval';
  direction: 'forward' | 'backward';
}

export interface IntervalParams {
  startZone: string;
  endZone: string;
  startDate: string;
  endDate: string;
  inclusion: 'both' | 'start' | 'end' | 'exclude';
}

export interface LunarParams {
  zone: string;
  year: number;
  month: number;
  day: number;
  leap: boolean;
  mode: 'thDay' | 'interval';
  offset: number;
}

// ---------------------------------------------------------------------------
// Bit packing helpers
// ---------------------------------------------------------------------------

class BitWriter {
  private bytes: number[] = [];
  private buffer = 0;
  private bitsInBuffer = 0;

  write(value: number, bits: number): void {
    while (bits > 0) {
      const space = 8 - this.bitsInBuffer;
      const chunk = Math.min(bits, space);
      const shift = bits - chunk;
      const mask = (1 << chunk) - 1;
      this.buffer = (this.buffer << chunk) | ((value >> shift) & mask);
      this.bitsInBuffer += chunk;
      bits -= chunk;
      if (this.bitsInBuffer === 8) {
        this.bytes.push(this.buffer);
        this.buffer = 0;
        this.bitsInBuffer = 0;
      }
    }
  }

  writeSigned(value: number, bits: number): void {
    // Two's complement for signed integers
    if (value < 0) {
      this.write((1 << bits) + value, bits);
    } else {
      this.write(value, bits);
    }
  }

  writeString(s: string, maxBytes: number): void {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(s);
    const len = Math.min(encoded.length, maxBytes);
    this.write(len, 5); // customLen field is 5 bits = max 31
    for (let i = 0; i < len; i++) {
      this.write(encoded[i], 8);
    }
    // Pad remaining
    for (let i = len; i < maxBytes; i++) {
      this.write(0, 8);
    }
  }

  toBytes(): Uint8Array {
    // Flush remaining bits
    if (this.bitsInBuffer > 0) {
      this.buffer = this.buffer << (8 - this.bitsInBuffer);
      this.bytes.push(this.buffer);
    }
    return new Uint8Array(this.bytes);
  }
}

class BitReader {
  private byteIndex = 0;
  private bitIndex = 0;
  private bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  read(bits: number): number {
    let value = 0;
    while (bits > 0) {
      if (this.byteIndex >= this.bytes.length) return value;
      const remainingInByte = 8 - this.bitIndex;
      const chunk = Math.min(bits, remainingInByte);
      const shift = remainingInByte - chunk;
      const mask = (1 << chunk) - 1;
      value = (value << chunk) | ((this.bytes[this.byteIndex] >> shift) & mask);
      this.bitIndex += chunk;
      bits -= chunk;
      if (this.bitIndex >= 8) {
        this.bitIndex = 0;
        this.byteIndex++;
      }
    }
    return value;
  }

  readSigned(bits: number): number {
    const raw = this.read(bits);
    const signBit = 1 << (bits - 1);
    if (raw & signBit) {
      return raw - (1 << bits);
    }
    return raw;
  }

  readString(maxBytes: number): string {
    const len = this.read(5);
    const actualLen = Math.min(len, maxBytes);
    const raw: number[] = [];
    for (let i = 0; i < actualLen; i++) {
      raw.push(this.read(8));
    }
    // Skip padding
    for (let i = actualLen; i < maxBytes; i++) {
      this.read(8);
    }
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(raw)).replace(/\0/g, '');
  }
}

// ---------------------------------------------------------------------------
// Zone ID compression (reference table of common zones)
// ---------------------------------------------------------------------------

const ZONE_IDS: Record<string, number> = {
  'UTC': 0,
  'Asia/Shanghai': 1,
  'Asia/Tokyo': 2,
  'Asia/Seoul': 3,
  'Asia/Singapore': 4,
  'Asia/Hong_Kong': 5,
  'Asia/Taipei': 6,
  'Asia/Kolkata': 7,
  'Asia/Dubai': 8,
  'Asia/Bangkok': 9,
  'Europe/London': 10,
  'Europe/Paris': 11,
  'Europe/Berlin': 12,
  'Europe/Moscow': 13,
  'America/New_York': 14,
  'America/Chicago': 15,
  'America/Denver': 16,
  'America/Los_Angeles': 17,
  'America/Toronto': 18,
  'America/Sao_Paulo': 19,
  'America/Mexico_City': 20,
  'Australia/Sydney': 21,
  'Pacific/Auckland': 22,
};

const ZONE_NAMES: Record<number, string> = {};
for (const [name, id] of Object.entries(ZONE_IDS)) {
  ZONE_NAMES[id] = name;
}

function encodeZone(zone: string): number {
  return ZONE_IDS[zone] ?? 16383; // 14-bit max = fallback sentinel
}

function decodeZone(id: number): string {
  if (id === 16383) return 'UTC';
  return ZONE_NAMES[id] ?? 'UTC';
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function dateStrToDays(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Days since 1970-01-01 (approximate, fine for ±200 year range)
  const utc = Date.UTC(y, m - 1, d);
  return Math.floor(utc / 86400000);
}

function daysToDateStr(days: number): string {
  const d = new Date(days * 86400000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Encode
// ---------------------------------------------------------------------------

export function encodeCardCode(card: CardCode): string {
  const w = new BitWriter();

  w.write(card.version, 4);
  w.write(card.tab === 'offset' ? 0 : card.tab === 'interval' ? 1 : 2, 2);
  w.write(card.theme === 'auto' ? 0 : card.theme === 'light' ? 1 : 2, 2);
  w.write(card.templateId, 8);
  w.writeString(card.customText, 30);

  switch (card.tab) {
    case 'offset': {
      const p = card.params as OffsetParams;
      w.write(encodeZone(p.zone), 14);
      w.write(dateStrToDays(p.startDate), 32);
      w.writeSigned(p.offset, 30);
      w.write(p.mode === 'thDay' ? 1 : 0, 1);
      w.write(p.direction === 'backward' ? 1 : 0, 1);
      break;
    }
    case 'interval': {
      const p = card.params as IntervalParams;
      w.write(encodeZone(p.startZone), 14);
      w.write(encodeZone(p.endZone), 14);
      w.write(dateStrToDays(p.startDate), 32);
      w.write(dateStrToDays(p.endDate), 32);
      const incMap: Record<string, number> = { both: 0, start: 1, end: 2, exclude: 3 };
      w.write(incMap[p.inclusion] ?? 0, 2);
      break;
    }
    case 'lunar': {
      const p = card.params as LunarParams;
      w.write(encodeZone(p.zone), 14);
      w.write(p.year, 12);
      w.write(p.month, 4);
      w.write(p.day, 5);
      w.write(p.leap ? 1 : 0, 1);
      w.write(p.mode === 'thDay' ? 1 : 0, 1);
      w.writeSigned(p.offset, 30);
      break;
    }
  }

  const bytes = w.toBytes();
  return bytesToBase62(bytes);
}

// ---------------------------------------------------------------------------
// Decode
// ---------------------------------------------------------------------------

export function decodeCardCode(code: string): CardCode | null {
  try {
    const bytes = base62ToBytes(code);
    const r = new BitReader(bytes);

    const version = r.read(4);
    if (version !== 0) return null;

    const tabRaw = r.read(2);
    const tab: CardTab = tabRaw === 0 ? 'offset' : tabRaw === 1 ? 'interval' : 'lunar';

    const themeRaw = r.read(2);
    const theme: CardTheme = themeRaw === 0 ? 'auto' : themeRaw === 1 ? 'light' : 'dark';

    const templateId = r.read(8);
    const customText = r.readString(30);

    let params: OffsetParams | IntervalParams | LunarParams;

    switch (tab) {
      case 'offset': {
        const zone = decodeZone(r.read(14));
        const startDate = daysToDateStr(r.read(32));
        const offset = r.readSigned(30);
        const mode = r.read(1) === 1 ? 'thDay' as const : 'interval' as const;
        const direction = r.read(1) === 1 ? 'backward' as const : 'forward' as const;
        params = { zone, startDate, offset, mode, direction };
        break;
      }
      case 'interval': {
        const startZone = decodeZone(r.read(14));
        const endZone = decodeZone(r.read(14));
        const startDate = daysToDateStr(r.read(32));
        const endDate = daysToDateStr(r.read(32));
        const incRaw = r.read(2);
        const incMap: Record<number, IntervalParams['inclusion']> = { 0: 'both', 1: 'start', 2: 'end', 3: 'exclude' };
        const inclusion = incMap[incRaw] ?? 'both';
        params = { startZone, endZone, startDate, endDate, inclusion };
        break;
      }
      case 'lunar': {
        const zone = decodeZone(r.read(14));
        const year = r.read(12);
        const month = r.read(4);
        const day = r.read(5);
        const leap = r.read(1) === 1;
        const mode = r.read(1) === 1 ? 'thDay' as const : 'interval' as const;
        const offset = r.readSigned(30);
        params = { zone, year, month, day, leap, mode, offset };
        break;
      }
    }

    return { version, tab, theme, templateId, customText, params };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Base62
// ---------------------------------------------------------------------------

function bytesToBase62(bytes: Uint8Array): string {
  // Convert bytes to a big integer, then to base62
  let num = 0n;
  for (const b of bytes) {
    num = (num << 8n) | BigInt(b);
  }

  if (num === 0n) return '0';

  let result = '';
  while (num > 0n) {
    const rem = Number(num % 62n);
    result = BASE62[rem] + result;
    num = num / 62n;
  }

  return result;
}

function base62ToBytes(code: string): Uint8Array {
  let num = 0n;
  for (const c of code) {
    const idx = BASE62.indexOf(c);
    if (idx === -1) throw new Error(`Invalid base62 character: ${c}`);
    num = num * 62n + BigInt(idx);
  }

  if (num === 0n) return new Uint8Array([0]);

  // Convert big int back to bytes
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num = num >> 8n;
  }

  return new Uint8Array(bytes);
}
