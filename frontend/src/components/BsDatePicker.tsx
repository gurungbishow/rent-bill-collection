import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BS_MONTHS_EN, BS_MONTHS_NP, toDevanagariDigits, getTodayBsDate, parseBsDate } from '@/lib/bsDate';
import NepaliDate from 'nepali-date-converter';

interface BsDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  language?: 'en' | 'np';
}

export function BsDatePicker({ value, onChange, language = 'en' }: BsDatePickerProps) {
  const defaultDate = parseBsDate(value || '') || parseBsDate(getTodayBsDate())!;
  
  const [year, setYear] = useState<number>(defaultDate.year);
  const [month, setMonth] = useState<number>(defaultDate.month); // 1-12
  const [day, setDay] = useState<number>(defaultDate.day); // 1-32

  useEffect(() => {
    if (value) {
      const parsed = parseBsDate(value);
      if (parsed) {
        setYear(parsed.year);
        setMonth(parsed.month);
        setDay(parsed.day);
      }
    }
  }, [value]);

  const updateDate = (y: number, m: number, d: number) => {
    // Validate the day. If it's too high for the month, cap it.
    let validDay = d;
    while (validDay > 28) {
      try {
        const nd = new NepaliDate(y, m - 1, validDay);
        if (nd.getDate() === validDay && nd.getMonth() === m - 1) {
          break; // Valid date
        }
        validDay--;
      } catch (e) {
        validDay--; // Invalid date, try smaller
      }
    }

    setYear(y);
    setMonth(m);
    setDay(validDay);

    const mm = String(m).padStart(2, '0');
    const dd = String(validDay).padStart(2, '0');
    onChange(`${y}-${mm}-${dd}`);
  };

  const years = Array.from({ length: 50 }, (_, i) => 2060 + i);
  const days = Array.from({ length: 32 }, (_, i) => i + 1);

  const displayNum = (num: number) => (language === 'np' ? toDevanagariDigits(num) : num.toString());
  const displayMonth = (m: number) => (language === 'np' ? BS_MONTHS_NP[m - 1] : BS_MONTHS_EN[m - 1]);

  return (
    <div className="flex gap-2 w-full">
      <Select value={year.toString()} onValueChange={(val) => updateDate(Number(val), month, day)}>
        <SelectTrigger className="flex-1 h-8 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {years.map(y => (
            <SelectItem key={y} value={y.toString()}>{displayNum(y)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={month.toString()} onValueChange={(val) => updateDate(year, Number(val), day)}>
        <SelectTrigger className="flex-[1.2] h-8 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <SelectItem key={m} value={m.toString()}>{displayMonth(m)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={day.toString()} onValueChange={(val) => updateDate(year, month, Number(val))}>
        <SelectTrigger className="flex-1 h-8 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {days.map(d => {
            // Only show valid days for the selected year and month
            let isValid = true;
            if (d > 28) {
              try {
                const nd = new NepaliDate(year, month - 1, d);
                if (nd.getDate() !== d || nd.getMonth() !== month - 1) {
                  isValid = false;
                }
              } catch (e) {
                isValid = false;
              }
            }
            if (!isValid) return null;
            return <SelectItem key={d} value={d.toString()}>{displayNum(d)}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
