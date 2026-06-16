import { DateTime } from 'luxon';
import { Solar, Lunar } from 'lunar-javascript';
import { translate, type Locale } from '../i18n';

export interface DateResult {
  dateStr: string;
  weekday: string;
  isDst: boolean;
  offsetName: string;
  offsetHours: number;
}

export interface DstTransition {
  date: string;
  type: 'forward' | 'backward';
  fromOffsetName: string;
  toOffsetName: string;
  shiftMinutes: number;
  description: string;
}

export interface CountryTimezone {
  value: string;
  label: string;
  country: string;
  city: string;
  group: string;
  searchText: string;
}

type TimezoneGroupKey = 'commonAsia' | 'america' | 'europeAfrica' | 'oceania' | 'utc';

interface TimezoneEntry {
  value: string;
  countryZh: string;
  countryEn: string;
  cityZh: string;
  cityEn: string;
  groupKey: TimezoneGroupKey;
}

export interface LunarResult {
  lunarStr: string;
  yearGanZhi: string;
  shengXiao: string;
  monthName: string;
  dayName: string;
  jieQi: string;
  festivals: string[];
  yi: string[];
  ji: string[];
}

const timezoneDatabase: TimezoneEntry[] = [
  { value: 'Asia/Shanghai', countryZh: '中国', countryEn: 'China', cityZh: '北京 / 上海（北京时间）', cityEn: 'Beijing / Shanghai (China Standard Time)', groupKey: 'commonAsia' },
  { value: 'Asia/Hong_Kong', countryZh: '中国香港', countryEn: 'Hong Kong', cityZh: '香港', cityEn: 'Hong Kong', groupKey: 'commonAsia' },
  { value: 'Asia/Taipei', countryZh: '中国台湾', countryEn: 'Taiwan', cityZh: '台北', cityEn: 'Taipei', groupKey: 'commonAsia' },
  { value: 'Asia/Macau', countryZh: '中国澳门', countryEn: 'Macau', cityZh: '澳门', cityEn: 'Macau', groupKey: 'commonAsia' },
  { value: 'Asia/Urumqi', countryZh: '中国', countryEn: 'China', cityZh: '乌鲁木齐（新疆时间）', cityEn: 'Urumqi (Xinjiang Time)', groupKey: 'commonAsia' },
  { value: 'Asia/Tokyo', countryZh: '日本', countryEn: 'Japan', cityZh: '东京', cityEn: 'Tokyo', groupKey: 'commonAsia' },
  { value: 'Asia/Seoul', countryZh: '韩国', countryEn: 'South Korea', cityZh: '首尔', cityEn: 'Seoul', groupKey: 'commonAsia' },
  { value: 'Asia/Singapore', countryZh: '新加坡', countryEn: 'Singapore', cityZh: '新加坡', cityEn: 'Singapore', groupKey: 'commonAsia' },
  { value: 'Asia/Kolkata', countryZh: '印度', countryEn: 'India', cityZh: '加尔各答', cityEn: 'Kolkata', groupKey: 'commonAsia' },
  { value: 'Asia/Dubai', countryZh: '阿联酋', countryEn: 'United Arab Emirates', cityZh: '迪拜', cityEn: 'Dubai', groupKey: 'commonAsia' },
  { value: 'America/New_York', countryZh: '美国', countryEn: 'United States', cityZh: '纽约（东部时间）', cityEn: 'New York (Eastern Time)', groupKey: 'america' },
  { value: 'America/Chicago', countryZh: '美国', countryEn: 'United States', cityZh: '芝加哥（中部时间）', cityEn: 'Chicago (Central Time)', groupKey: 'america' },
  { value: 'America/Denver', countryZh: '美国', countryEn: 'United States', cityZh: '丹佛（山地时间）', cityEn: 'Denver (Mountain Time)', groupKey: 'america' },
  { value: 'America/Los_Angeles', countryZh: '美国', countryEn: 'United States', cityZh: '洛杉矶（太平洋时间）', cityEn: 'Los Angeles (Pacific Time)', groupKey: 'america' },
  { value: 'America/Anchorage', countryZh: '美国', countryEn: 'United States', cityZh: '安克雷奇（阿拉斯加时间）', cityEn: 'Anchorage (Alaska Time)', groupKey: 'america' },
  { value: 'Pacific/Honolulu', countryZh: '美国', countryEn: 'United States', cityZh: '檀香山 / 火奴鲁鲁（夏威夷时间）', cityEn: 'Honolulu (Hawaii Time)', groupKey: 'america' },
  { value: 'America/Toronto', countryZh: '加拿大', countryEn: 'Canada', cityZh: '多伦多（东部时间）', cityEn: 'Toronto (Eastern Time)', groupKey: 'america' },
  { value: 'America/Vancouver', countryZh: '加拿大', countryEn: 'Canada', cityZh: '温哥华（太平洋时间）', cityEn: 'Vancouver (Pacific Time)', groupKey: 'america' },
  { value: 'America/Sao_Paulo', countryZh: '巴西', countryEn: 'Brazil', cityZh: '圣保罗', cityEn: 'Sao Paulo', groupKey: 'america' },
  { value: 'Europe/London', countryZh: '英国', countryEn: 'United Kingdom', cityZh: '伦敦（格林威治 / 夏令时）', cityEn: 'London (GMT / BST)', groupKey: 'europeAfrica' },
  { value: 'Europe/Paris', countryZh: '法国', countryEn: 'France', cityZh: '巴黎（中欧时间）', cityEn: 'Paris (Central European Time)', groupKey: 'europeAfrica' },
  { value: 'Europe/Berlin', countryZh: '德国', countryEn: 'Germany', cityZh: '柏林（中欧时间）', cityEn: 'Berlin (Central European Time)', groupKey: 'europeAfrica' },
  { value: 'Europe/Rome', countryZh: '意大利', countryEn: 'Italy', cityZh: '罗马（中欧时间）', cityEn: 'Rome (Central European Time)', groupKey: 'europeAfrica' },
  { value: 'Europe/Moscow', countryZh: '俄罗斯', countryEn: 'Russia', cityZh: '莫斯科', cityEn: 'Moscow', groupKey: 'europeAfrica' },
  { value: 'Africa/Johannesburg', countryZh: '南非', countryEn: 'South Africa', cityZh: '约翰内斯堡', cityEn: 'Johannesburg', groupKey: 'europeAfrica' },
  { value: 'Africa/Cairo', countryZh: '埃及', countryEn: 'Egypt', cityZh: '开罗', cityEn: 'Cairo', groupKey: 'europeAfrica' },
  { value: 'Australia/Sydney', countryZh: '澳大利亚', countryEn: 'Australia', cityZh: '悉尼（东部时间）', cityEn: 'Sydney (Eastern Time)', groupKey: 'oceania' },
  { value: 'Australia/Adelaide', countryZh: '澳大利亚', countryEn: 'Australia', cityZh: '阿德莱德（中部时间）', cityEn: 'Adelaide (Central Time)', groupKey: 'oceania' },
  { value: 'Australia/Perth', countryZh: '澳大利亚', countryEn: 'Australia', cityZh: '珀斯（西部时间）', cityEn: 'Perth (Western Time)', groupKey: 'oceania' },
  { value: 'Pacific/Auckland', countryZh: '新西兰', countryEn: 'New Zealand', cityZh: '奥克兰', cityEn: 'Auckland', groupKey: 'oceania' },
  { value: 'UTC', countryZh: '协调世界时', countryEn: 'Coordinated Universal Time', cityZh: '全球（UTC）', cityEn: 'Global (UTC)', groupKey: 'utc' },
];

function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
}

function getZonePieces(zoneValue: string, locale: Locale) {
  const entry = timezoneDatabase.find((z) => z.value === zoneValue);
  if (!entry) {
    return null;
  }

  const country = locale === 'en' ? entry.countryEn : entry.countryZh;
  const city = locale === 'en' ? entry.cityEn : entry.cityZh;
  return { entry, country, city };
}

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

// Get standard list of IANA timezones mapped with country details
export function getAvailableTimezones(locale: Locale = 'zh'): CountryTimezone[] {
  return timezoneDatabase.map((z) => {
    try {
      const dt = DateTime.now().setZone(z.value);
      const offset = formatUtcOffset(dt.offset);
      const offsetName = dt.offsetNameShort || '';
      const country = locale === 'en' ? z.countryEn : z.countryZh;
      const city = locale === 'en' ? z.cityEn : z.cityZh;
      const group = translate(locale, `timezone.groups.${z.groupKey}`);
      const label = `${country} - ${city} (${offsetName ? `${offsetName}, ` : ''}${offset})`;
      return {
        value: z.value,
        label,
        country,
        city,
        group,
        searchText: `${z.countryZh} ${z.countryEn} ${z.cityZh} ${z.cityEn} ${z.value}`.toLowerCase(),
      };
    } catch {
      const country = locale === 'en' ? z.countryEn : z.countryZh;
      const city = locale === 'en' ? z.cityEn : z.cityZh;
      return {
        value: z.value,
        label: `${country} - ${city} (${z.value})`,
        country,
        city,
        group: translate(locale, `timezone.groups.${z.groupKey}`),
        searchText: `${z.countryZh} ${z.countryEn} ${z.cityZh} ${z.cityEn} ${z.value}`.toLowerCase(),
      };
    }
  });
}

// Get user-friendly timezone name by IANA ID
export function getFriendlyZoneLabel(zoneValue: string, locale: Locale = 'zh'): string {
  const zone = getZonePieces(zoneValue, locale);
  if (!zone) return zoneValue;
  try {
    const dt = DateTime.now().setZone(zoneValue);
    const offset = formatUtcOffset(dt.offset);
    const offsetName = dt.offsetNameShort || '';
    return `${zone.country} - ${zone.city} (${offsetName ? `${offsetName}, ` : ''}${offset})`;
  } catch {
    return `${zone.country} - ${zone.city} (${zoneValue})`;
  }
}

export function getZoneShortLabel(zoneValue: string, locale: Locale = 'zh'): string {
  const zone = getZonePieces(zoneValue, locale);
  if (!zone) return zoneValue;
  return `${zone.country} ${zone.city}`;
}

// Get details of a DateTime object
function getDateResult(dt: DateTime, locale: Locale): DateResult {
  return {
    dateStr: dt.toFormat('yyyy-MM-dd'),
    weekday: dt.setLocale(locale === 'en' ? 'en-US' : 'zh-CN').toFormat('cccc'),
    isDst: dt.isInDST,
    offsetName: dt.offsetNameShort || formatUtcOffset(dt.offset),
    offsetHours: dt.offset / 60,
  };
}

/**
 * Get Chinese Lunar details for a Gregorian date
 */
export function getLunarDetails(dateStr: string, zone: string): LunarResult | null {
  try {
    const dt = DateTime.fromISO(dateStr, { zone });
    if (!dt.isValid) return null;
    
    // Create local Date object
    const jsDate = new Date(dt.year, dt.month - 1, dt.day);
    const solar = Solar.fromDate(jsDate);
    const lunar = solar.getLunar();
    
    return {
      lunarStr: lunar.toString(),
      yearGanZhi: lunar.getYearInGanZhi(),
      shengXiao: lunar.getYearShengXiao(),
      monthName: lunar.getMonthInChinese() + '月',
      dayName: lunar.getDayInChinese(),
      jieQi: lunar.getJieQi() || '',
      festivals: [...lunar.getFestivals(), ...solar.getFestivals()],
      yi: lunar.getDayYi() || [],
      ji: lunar.getDayJi() || [],
    };
  } catch (e) {
    console.error('Error fetching lunar details:', e);
    return null;
  }
}

/**
 * Convert Lunar date to Gregorian Date string (yyyy-MM-dd)
 */
export function convertLunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeap: boolean,
  locale: Locale = 'zh',
): { success: boolean; dateStr?: string; error?: string } {
  try {
    const lunar = Lunar.fromYmd(year, isLeap ? -month : month, day);
    const solar = lunar.getSolar();
    
    return {
      success: true,
      dateStr: solar.toYmd(),
    };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) || translate(locale, 'lunar.invalidLunar') };
  }
}

/**
 * Calculate target date from start date by offset days
 * @param startDateStr 'yyyy-MM-dd'
 * @param offset X days
 * @param mode 'thDay' (第 X 日) or 'interval' (间隔 X 日)
 * @param zone Timezone name
 */
export function calculateOffset(
  startDateStr: string,
  offset: number,
  mode: 'thDay' | 'interval',
  zone: string,
  locale: Locale = 'zh',
): { success: boolean; result?: DateResult; error?: string } {
  try {
    const start = DateTime.fromISO(startDateStr, { zone });
    if (!start.isValid) {
      return { success: false, error: translate(locale, 'offset.invalidDate') };
    }

    let target: DateTime;
    if (mode === 'thDay') {
      if (offset < 1) {
        return { success: false, error: translate(locale, 'offset.thDayMinimum') };
      }
      target = start.plus({ days: offset - 1 });
    } else {
      target = start.plus({ days: offset });
    }

    return {
      success: true,
      result: getDateResult(target, locale),
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || translate(locale, 'lunar.offsetError') };
  }
}

/**
 * Calculate the interval between two dates with dual timezone support
 * @param startDateStr 'yyyy-MM-dd'
 * @param endDateStr 'yyyy-MM-dd'
 * @param inclusion 'both' | 'start' | 'end' | 'exclude'
 * @param startZone Timezone name for start date
 * @param endZone Timezone name for end date
 */
export interface IntervalResult {
  totalDays: number;
  workdays: number;
  weekends: number;
  isNegative: boolean;
  actualStart: DateResult;
  actualEnd: DateResult;
  absoluteDays: number;
  absoluteHours: number;
}

export function calculateInterval(
  startDateStr: string,
  endDateStr: string,
  inclusion: 'both' | 'start' | 'end' | 'exclude',
  startZone: string,
  endZone: string,
  locale: Locale = 'zh',
): { success: boolean; result?: IntervalResult; error?: string } {
  try {
    const startLocal = DateTime.fromISO(startDateStr, { zone: startZone });
    const endLocal = DateTime.fromISO(endDateStr, { zone: endZone });

    if (!startLocal.isValid || !endLocal.isValid) {
      return { success: false, error: translate(locale, 'interval.errorPlaceholder') };
    }

    // 1. Local Calendar Day Difference
    const startUtc = DateTime.fromISO(startDateStr, { zone: 'UTC' }).startOf('day');
    const endUtc = DateTime.fromISO(endDateStr, { zone: 'UTC' }).startOf('day');
    const diffDays = Math.round(endUtc.diff(startUtc, 'days').days);

    const isNegative = diffDays < 0;
    const absDiffDays = Math.abs(diffDays);

    let totalDays = 0;
    if (inclusion === 'both') {
      totalDays = absDiffDays + 1;
    } else if (inclusion === 'start' || inclusion === 'end') {
      totalDays = absDiffDays;
    } else {
      totalDays = Math.max(0, absDiffDays - 1);
    }

    // 2. Workdays and Weekends
    let workdays = 0;
    let weekends = 0;

    if (totalDays > 0) {
      let checkStart = startUtc;
      let checkEnd = endUtc;

      if (isNegative) {
        checkStart = endUtc;
        checkEnd = startUtc;
      }

      if (inclusion === 'start') {
        checkEnd = checkEnd.minus({ days: 1 });
      } else if (inclusion === 'end') {
        checkStart = checkStart.plus({ days: 1 });
      } else if (inclusion === 'exclude') {
        checkStart = checkStart.plus({ days: 1 });
        checkEnd = checkEnd.minus({ days: 1 });
      }

      if (checkStart <= checkEnd) {
        let current = checkStart;
        while (current <= checkEnd) {
          const wd = current.weekday; // 1 = Mon, 7 = Sun
          if (wd === 6 || wd === 7) {
            weekends++;
          } else {
            workdays++;
          }
          current = current.plus({ days: 1 });
        }
      }
    }

    // 3. Absolute Elapsed Time
    const startInstant = startLocal.startOf('day');
    const endInstant = endLocal.startOf('day');
    const diffHoursAbs = endInstant.diff(startInstant, 'hours').hours;
    
    const absoluteTotalHours = Math.abs(diffHoursAbs);
    const absoluteDays = Math.floor(absoluteTotalHours / 24);
    const absoluteHours = Math.round(absoluteTotalHours % 24);

    return {
      success: true,
      result: {
        totalDays: isNegative ? -totalDays : totalDays,
        workdays,
        weekends,
        isNegative,
        actualStart: getDateResult(startLocal.startOf('day'), locale),
        actualEnd: getDateResult(endLocal.startOf('day'), locale),
        absoluteDays,
        absoluteHours,
      }
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || translate(locale, 'interval.invalid') };
  }
}

/**
 * Scan a date range in a timezone for DST transitions
 */
export function detectDstTransitions(
  startDateStr: string,
  endDateStr: string,
  zone: string,
  locale: Locale = 'zh',
): DstTransition[] {
  const transitions: DstTransition[] = [];
  try {
    let start = DateTime.fromISO(startDateStr, { zone }).set({ hour: 12 });
    let end = DateTime.fromISO(endDateStr, { zone }).set({ hour: 12 });

    if (!start.isValid || !end.isValid) {
      return [];
    }

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    const diffYears = end.diff(start, 'years').years;
    if (diffYears > 10) {
      end = start.plus({ years: 10 });
    }

    let current = start;
    let prevOffset = current.offset;
    let prevOffsetName = current.offsetNameShort || '';

    current = current.plus({ days: 1 });
    while (current <= end.plus({ days: 1 })) {
      const currOffset = current.offset;
      const currOffsetName = current.offsetNameShort || '';

      if (currOffset !== prevOffset) {
        const shiftMinutes = currOffset - prevOffset;
        const shiftHours = Math.abs(shiftMinutes / 60);
        const isForward = shiftMinutes > 0;

        const dateStr = current.toFormat('yyyy-MM-dd');
        const description = isForward
          ? translate(locale, 'dst.shiftForward', { hours: shiftHours })
          : translate(locale, 'dst.shiftBackward', { hours: shiftHours });

        transitions.push({
          date: dateStr,
          type: isForward ? 'forward' : 'backward',
          fromOffsetName: prevOffsetName || formatUtcOffset(prevOffset),
          toOffsetName: currOffsetName || formatUtcOffset(currOffset),
          shiftMinutes,
          description,
        });
      }

      prevOffset = currOffset;
      prevOffsetName = currOffsetName;
      current = current.plus({ days: 1 });
    }
  } catch (e) {
    console.error('Error detecting DST transitions:', e);
  }

  const seenDates = new Set<string>();
  return transitions.filter(t => {
    if (seenDates.has(t.date)) return false;
    seenDates.add(t.date);
    return true;
  });
}
