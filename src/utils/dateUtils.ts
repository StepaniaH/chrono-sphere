import { DateTime } from 'luxon';

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

// Country & Region based timezone database
const timezoneDatabase = [
  { value: 'Asia/Shanghai', country: '中国', city: '北京/上海 (北京时间)', group: '常用与亚洲' },
  { value: 'Asia/Hong_Kong', country: '中国香港', city: '香港', group: '常用与亚洲' },
  { value: 'Asia/Taipei', country: '中国台湾', city: '台北', group: '常用与亚洲' },
  { value: 'Asia/Macau', country: '中国澳门', city: '澳门', group: '常用与亚洲' },
  { value: 'Asia/Urumqi', country: '中国', city: '乌鲁木齐 (新疆时间)', group: '常用与亚洲' },
  { value: 'America/New_York', country: '美国', city: '纽约 (东部时间)', group: '美洲' },
  { value: 'America/Chicago', country: '美国', city: '芝加哥 (中部时间)', group: '美洲' },
  { value: 'America/Denver', country: '美国', city: '丹佛 (山地时间)', group: '美洲' },
  { value: 'America/Los_Angeles', country: '美国', city: '洛杉矶 (太平洋时间)', group: '美洲' },
  { value: 'America/Anchorage', country: '美国', city: '安克雷奇 (阿拉斯加时间)', group: '美洲' },
  { value: 'Pacific/Honolulu', country: '美国', city: '檀香山/火奴鲁鲁 (夏威夷时间)', group: '美洲' },
  { value: 'Europe/London', country: '英国', city: '伦敦 (格林威治/夏令时)', group: '欧洲与非洲' },
  { value: 'Europe/Paris', country: '法国', city: '巴黎 (中欧时间)', group: '欧洲与非洲' },
  { value: 'Europe/Berlin', country: '德国', city: '柏林 (中欧时间)', group: '欧洲与非洲' },
  { value: 'Europe/Rome', country: '意大利', city: '罗马 (中欧时间)', group: '欧洲与非洲' },
  { value: 'Europe/Moscow', country: '俄罗斯', city: '莫斯科', group: '欧洲与非洲' },
  { value: 'Africa/Johannesburg', country: '南非', city: '约翰内斯堡', group: '欧洲与非洲' },
  { value: 'Africa/Cairo', country: '埃及', city: '开罗', group: '欧洲与非洲' },
  { value: 'Asia/Tokyo', country: '日本', city: '东京', group: '常用与亚洲' },
  { value: 'Asia/Seoul', country: '韩国', city: '首尔', group: '常用与亚洲' },
  { value: 'Asia/Singapore', country: '新加坡', city: '新加坡', group: '常用与亚洲' },
  { value: 'Asia/Kolkata', country: '印度', city: '加尔各答', group: '常用与亚洲' },
  { value: 'Asia/Dubai', country: '阿联酋', city: '迪拜', group: '常用与亚洲' },
  { value: 'Australia/Sydney', country: '澳大利亚', city: '悉尼 (东部时间)', group: '大洋洲' },
  { value: 'Australia/Adelaide', country: '澳大利亚', city: '阿德莱德 (中部时间)', group: '大洋洲' },
  { value: 'Australia/Perth', country: '澳大利亚', city: '珀斯 (西部时间)', group: '大洋洲' },
  { value: 'Pacific/Auckland', country: '新西兰', city: '奥克兰', group: '大洋洲' },
  { value: 'America/Toronto', country: '加拿大', city: '多伦多 (东部时间)', group: '美洲' },
  { value: 'America/Vancouver', country: '加拿大', city: '温哥华 (太平洋时间)', group: '美洲' },
  { value: 'America/Sao_Paulo', country: '巴西', city: '圣保罗', group: '美洲' },
  { value: 'UTC', country: '协调世界时', city: '全球 (UTC)', group: '协调世界时' },
];

// Get standard list of IANA timezones mapped with country details
export function getAvailableTimezones(): CountryTimezone[] {
  return timezoneDatabase.map(z => {
    try {
      const dt = DateTime.now().setZone(z.value);
      const offset = dt.toFormat('ZZZ');
      const offsetName = dt.offsetNameShort || '';
      const label = `${z.country} - ${z.city} (${offsetName ? offsetName + ', ' : ''}UTC${offset})`;
      return {
        value: z.value,
        label,
        country: z.country,
        city: z.city,
        group: z.group,
        searchText: `${z.country} ${z.city} ${z.value}`.toLowerCase()
      };
    } catch {
      return {
        value: z.value,
        label: `${z.country} - ${z.city} (${z.value})`,
        country: z.country,
        city: z.city,
        group: z.group,
        searchText: `${z.country} ${z.city} ${z.value}`.toLowerCase()
      };
    }
  });
}

// Get user-friendly timezone name by IANA ID
export function getFriendlyZoneLabel(zoneValue: string): string {
  const dbItem = timezoneDatabase.find(z => z.value === zoneValue);
  if (!dbItem) return zoneValue;
  try {
    const dt = DateTime.now().setZone(zoneValue);
    const offset = dt.toFormat('ZZZ');
    const offsetName = dt.offsetNameShort || '';
    return `${dbItem.country} - ${dbItem.city} (${offsetName ? offsetName + ', ' : ''}UTC${offset})`;
  } catch {
    return `${dbItem.country} - ${dbItem.city} (${zoneValue})`;
  }
}

// Get details of a DateTime object
function getDateResult(dt: DateTime): DateResult {
  return {
    dateStr: dt.toFormat('yyyy-MM-dd'),
    weekday: dt.setLocale('zh-CN').toFormat('cccc'),
    isDst: dt.isInDST,
    offsetName: dt.offsetNameShort || (dt.offset >= 0 ? `UTC+${dt.offset/60}` : `UTC${dt.offset/60}`),
    offsetHours: dt.offset / 60,
  };
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
  zone: string
): { success: boolean; result?: DateResult; error?: string } {
  try {
    const start = DateTime.fromISO(startDateStr, { zone });
    if (!start.isValid) {
      return { success: false, error: '无效的起始日期' };
    }

    let target: DateTime;
    if (mode === 'thDay') {
      if (offset < 1) {
        return { success: false, error: '「第 X 日」模式下，X 必须大于等于 1' };
      }
      target = start.plus({ days: offset - 1 });
    } else {
      target = start.plus({ days: offset });
    }

    return {
      success: true,
      result: getDateResult(target),
    };
  } catch (err: any) {
    return { success: false, error: err.message || '计算出错' };
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
  endZone: string
): { success: boolean; result?: IntervalResult; error?: string } {
  try {
    const startLocal = DateTime.fromISO(startDateStr, { zone: startZone });
    const endLocal = DateTime.fromISO(endDateStr, { zone: endZone });

    if (!startLocal.isValid || !endLocal.isValid) {
      return { success: false, error: '起始日期或结束日期无效' };
    }

    // 1. Local Calendar Day Difference (calculated by treating dates as local strings)
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

    // 2. Workdays and Weekends (local calendar dates)
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

    // 3. Absolute Elapsed Time (comparing absolute UTC instants of start-day-midnight and end-day-midnight)
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
        workdays: isNegative ? -workdays : workdays,
        weekends: isNegative ? -weekends : weekends,
        isNegative,
        actualStart: getDateResult(startLocal.startOf('day')),
        actualEnd: getDateResult(endLocal.startOf('day')),
        absoluteDays,
        absoluteHours,
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || '计算出错' };
  }
}

/**
 * Scan a date range in a timezone for DST transitions
 */
export function detectDstTransitions(
  startDateStr: string,
  endDateStr: string,
  zone: string
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
        
        let description = '';
        if (isForward) {
          description = `夏令时开始：时钟向前拨快 ${shiftHours} 小时。这一天少 ${shiftHours} 小时（通常从 2:00 跳到 3:00）。`;
        } else {
          description = `夏令时结束：时钟向后拨慢 ${shiftHours} 小时。这一天多 ${shiftHours} 小时（通常从 2:00 重复一次 1:00）。`;
        }

        transitions.push({
          date: dateStr,
          type: isForward ? 'forward' : 'backward',
          fromOffsetName: prevOffsetName || (prevOffset >= 0 ? `UTC+${prevOffset/60}` : `UTC${prevOffset/60}`),
          toOffsetName: currOffsetName || (currOffset >= 0 ? `UTC+${currOffset/60}` : `UTC${currOffset/60}`),
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
