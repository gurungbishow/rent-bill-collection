// Bikram Sambat (BS) Date Helpers and Localization

export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra'
];

export const BS_MONTHS_NP = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कात्तिक',
  'मंसिर',
  'पुस',
  'माघ',
  'फागुन',
  'चैत'
];

const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toDevanagariDigits(num: number | string): string {
  return String(num).replace(/[0-9]/g, (w) => devanagariDigits[+w]);
}

import NepaliDate from 'nepali-date-converter';

/**
 * Parses BS date string formatted as "YYYY-MM-DD"
 */
export function parseBsDate(bsDateStr: string): { year: number; month: number; day: number } | null {
  if (!bsDateStr) return null;
  try {
    const d = new NepaliDate(bsDateStr);
    return { year: d.getYear(), month: d.getMonth() + 1, day: d.getDate() };
  } catch(e) {
    return null;
  }
}

/**
 * Converts AD Date to BS Date string "YYYY-MM-DD"
 */
export function adToBs(date: Date | string): string {
  try {
    const d = new Date(date);
    return new NepaliDate(d).format('YYYY-MM-DD');
  } catch(e) {
    return '';
  }
}

/**
 * Converts BS Date string to AD Date object
 */
export function bsToAd(bsDateStr: string): Date | null {
  if (!bsDateStr) return null;
  try {
    return new NepaliDate(bsDateStr).toJsDate();
  } catch(e) {
    return null;
  }
}

/**
 * Returns today's Bikram Sambat (BS) date string "YYYY-MM-DD"
 */
export function getTodayBsDate(): string {
  return new NepaliDate().format('YYYY-MM-DD');
}

/**
 * Adds N months to a BS date string
 */
export function addBsMonths(bsDateStr: string, monthsToAdd: number = 1): string {
  try {
    const d = new NepaliDate(bsDateStr);
    d.setMonth(d.getMonth() + monthsToAdd);
    return d.format('YYYY-MM-DD');
  } catch(e) {
    return bsDateStr;
  }
}

/**
 * Formats an AD Date or BS Date string for display in English or Nepali.
 * Assumes it's an AD date if it matches Date format, or handles string parsing.
 */
export function formatBsDate(dateVal: string | Date | null | undefined, lang: 'en' | 'np' = 'en'): string {
  if (!dateVal) return '';
  
  let d: NepaliDate;
  try {
    if (dateVal instanceof Date) {
      d = new NepaliDate(dateVal);
    } else if (typeof dateVal === 'string' && dateVal.includes('T')) {
      // It's likely an AD ISO string
      d = new NepaliDate(new Date(dateVal));
    } else {
      // It's a BS string
      d = new NepaliDate(dateVal);
    }
  } catch(e) {
    return String(dateVal);
  }

  const year = d.getYear();
  const monthIdx = d.getMonth();
  const day = d.getDate();

  if (lang === 'np') {
    const npYear = toDevanagariDigits(year);
    const npMonth = BS_MONTHS_NP[monthIdx];
    const npDay = toDevanagariDigits(day);
    return `${npYear} ${npMonth} ${npDay}`;
  }

  const enMonth = BS_MONTHS_EN[monthIdx];
  return `${year} ${enMonth} ${day}`;
}

/**
 * Formats a billing period cycle (e.g., "2080-01-22 to 2080-02-22")
 * Takes in the CURRENT BS Date string, subtracts one month for the start.
 */
export function formatBsPeriod(currentBsDate: string, lang: 'en' | 'np' = 'en'): string {
  if (!currentBsDate) return '';
  const prevBsDate = addBsMonths(currentBsDate, -1);
  const prevFormatted = formatBsDate(prevBsDate, lang);
  const currFormatted = formatBsDate(currentBsDate, lang);

  return lang === 'np' 
    ? `${prevFormatted} देखि ${currFormatted}`
    : `${prevFormatted} to ${currFormatted}`;
}

/**
 * Formats just the month and year (e.g. "Bhadra 2080")
 */
export function formatBsMonthYear(currentBsDate: string, lang: 'en' | 'np' = 'en'): string {
  if (!currentBsDate) return '';
  const parsed = parseBsDate(currentBsDate);
  if (!parsed) return '';
  
  if (lang === 'np') {
    return `${BS_MONTHS_NP[parsed.month - 1]} ${toDevanagariDigits(parsed.year)}`;
  }
  return `${BS_MONTHS_EN[parsed.month - 1]} ${parsed.year}`;
}

/**
 * Formats currency amount with Nepali / English symbols
 */
export function formatCurrencyLocale(amount: number | string, lang: 'en' | 'np' = 'en'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
  const formattedEn = new Intl.NumberFormat('en-NP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);

  if (lang === 'np') {
    return `रु ${toDevanagariDigits(formattedEn)}`;
  }
  return `Rs ${formattedEn}`;
}
