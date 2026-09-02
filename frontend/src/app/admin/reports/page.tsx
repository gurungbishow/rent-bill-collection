'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Printer, TrendingUp, AlertCircle, CheckCircle2, DoorOpen, Calendar, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { BS_MONTHS_EN, BS_MONTHS_NP, getTodayBsDate, parseBsDate } from '@/lib/bsDate';

export default function AdminReportsPage() {
  const { t, formatMoney, formatNumber, language } = useLanguage();
  const bsToday = parseBsDate(getTodayBsDate()) || { year: 2081, month: 5 };
  const [year, setYear] = useState(bsToday.year.toString());
  const [month, setMonth] = useState(bsToday.month.toString());

  const { data: report, isLoading } = useQuery({
    queryKey: ['report-monthly', year, month],
    queryFn: async () => {
      const res = await api.get(`/reports/monthly?year=${year}&month=${month}`);
      return res.data.data;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 tracking-wider">
            {t.paid}
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 tracking-wider">
            {t.partial}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-800/60 tracking-wider">
            {t.unpaid}
          </span>
        );
    }
  };

  const monthName = language === 'np' ? BS_MONTHS_NP[Number(month) - 1] : BS_MONTHS_EN[Number(month) - 1];

  return (
    <div className="p-3.5 sm:p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto print:p-0 print:m-0 text-slate-900 dark:text-slate-100 pb-24">
      {/* ── TOP HEADER & GLASS CONTROLS BAR ── */}
      <div className="flex flex-col gap-3 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {t.collection_report}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'np' ? `वर्ष ${formatNumber(year)} को ${monthName} महिनाको विवरण` : `Monthly summary for ${monthName} ${formatNumber(year)} BS`}
            </p>
          </div>
        </div>

        {/* ── SEGMENTED GLASS PILL BAR (PICTURE 2 STYLE) ── */}
        <div className="flex items-center divide-x divide-slate-200/80 dark:divide-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-full h-10 shadow-xs overflow-hidden select-none">
          {/* Year Segment */}
          <div className="flex-1 h-full min-w-0 flex items-center">
            <Select value={year} onValueChange={(v: any) => setYear(v)}>
              <SelectTrigger className="w-full h-full border-0 bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-xs font-semibold rounded-none px-2 sm:px-3.5 flex items-center justify-between gap-1 cursor-pointer transition-colors outline-none shadow-none focus:ring-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar size={13} className="text-blue-500 shrink-0" />
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatNumber(year)}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => (bsToday.year - 5 + i).toString()).map(y => (
                  <SelectItem key={y} value={y}>{formatNumber(y)} BS</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Segment */}
          <div className="flex-1 h-full min-w-0 flex items-center">
            <Select value={month} onValueChange={(v: any) => setMonth(v)}>
              <SelectTrigger className="w-full h-full border-0 bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-xs font-semibold rounded-none px-2 sm:px-3.5 flex items-center justify-between gap-1 cursor-pointer transition-colors outline-none shadow-none focus:ring-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar size={13} className="text-blue-500 shrink-0" />
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 whitespace-nowrap">{monthName}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <SelectItem key={m} value={m.toString()}>
                    {language === 'np' ? BS_MONTHS_NP[m - 1] : BS_MONTHS_EN[m - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Print Segment */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 h-full bg-transparent hover:bg-blue-50/70 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-xs px-2 sm:px-3.5 flex items-center justify-center gap-1.5 cursor-pointer transition-colors outline-none active:scale-[0.98] shrink-0"
          >
            <Printer size={14} className="text-blue-500 shrink-0" />
            <span className="whitespace-nowrap">{t.print}</span>
          </button>
        </div>
      </div>

      {/* Print Document Title */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold">{t.collection_report}</h1>
        <p className="text-slate-500 dark:text-slate-400">{formatNumber(year)} {monthName}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* ── 3-STAT VIBRANT KPI CARDS ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Expected Collection */}
            <Card className="border border-blue-200/80 dark:border-blue-800/60 shadow-xs bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 backdrop-blur-md rounded-2xl overflow-hidden p-2.5 sm:p-4">
              <CardContent className="p-0 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">{t.expected_collection}</span>
                  <TrendingUp size={14} className="text-blue-500 shrink-0 hidden sm:block" />
                </div>
                <div className="text-xs sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                  {formatMoney(report?.summary.totalExpected || 0)}
                </div>
              </CardContent>
            </Card>

            {/* Total Outstanding */}
            <Card className="border border-red-200/80 dark:border-red-800/60 shadow-xs bg-gradient-to-br from-red-50/80 via-white to-red-50/30 dark:from-red-950/40 dark:via-slate-900 dark:to-red-950/20 backdrop-blur-md rounded-2xl overflow-hidden p-2.5 sm:p-4">
              <CardContent className="p-0 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 truncate">{t.total_outstanding}</span>
                  <AlertCircle size={14} className="text-red-500 shrink-0 hidden sm:block" />
                </div>
                <div className="text-xs sm:text-lg font-bold text-red-600 dark:text-red-400 mt-1 truncate">
                  {formatMoney(report?.summary.totalOutstanding || 0)}
                </div>
              </CardContent>
            </Card>

            {/* Total Collected */}
            <Card className="border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 backdrop-blur-md rounded-2xl overflow-hidden p-2.5 sm:p-4">
              <CardContent className="p-0 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">{t.total_collected}</span>
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 hidden sm:block" />
                </div>
                <div className="text-xs sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                  {formatMoney(report?.summary.totalCollected || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── DESKTOP REPORTS TABLE ── */}
          <Card className="hidden md:block border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden print:shadow-none">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                <TableRow>
                  <TableHead className="text-center font-semibold text-xs text-slate-700 dark:text-slate-200">{t.room_name}</TableHead>
                  <TableHead className="text-center font-semibold text-xs text-slate-700 dark:text-slate-200">{t.grand_total}</TableHead>
                  <TableHead className="text-center font-semibold text-xs text-emerald-600 dark:text-emerald-400">{t.amount_paid}</TableHead>
                  <TableHead className="text-center font-semibold text-xs text-red-600 dark:text-red-400">{t.remaining_balance}</TableHead>
                  <TableHead className="text-center font-semibold text-xs text-slate-700 dark:text-slate-200">{t.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.bills?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500 dark:text-slate-400 text-xs">
                      {language === 'np' ? 'यो महिनाको लागि कुनै बिल भेटिएन।' : 'No bills found for this period.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  report?.bills?.map((bill: any, index: number) => (
                    <TableRow key={index} className="text-center hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="text-center font-semibold text-xs text-slate-900 dark:text-slate-100">
                        <Link 
                          href={`/admin/rooms/${bill.room_id}`}
                          className="inline-flex items-center justify-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                        >
                          <DoorOpen size={13} className="text-blue-500 shrink-0" />
                          <span className="group-hover:underline underline-offset-2">{bill.room_name}</span>
                          <ChevronRight size={12} className="text-slate-400 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs text-slate-800 dark:text-slate-200">{formatMoney(bill.bill_total)}</TableCell>
                      <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-medium text-xs">{formatMoney(bill.paid)}</TableCell>
                      <TableCell className="text-center text-red-600 dark:text-red-400 font-semibold text-xs">{formatMoney(bill.remaining)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(bill.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* ── MOBILE REPORTS CARD BREAKDOWN ── */}
          <div className="md:hidden grid grid-cols-1 gap-2.5">
            {report?.bills?.map((bill: any, index: number) => (
              <Card key={index} className="p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
                  <Link 
                    href={`/admin/rooms/${bill.room_id}`}
                    className="flex items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <DoorOpen size={12} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                      <span>{bill.room_name}</span>
                      <ChevronRight size={11} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </h3>
                  </Link>
                  <div>{getStatusBadge(bill.status)}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t.grand_total}</span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{formatMoney(bill.bill_total)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t.amount_paid}</span>
                    <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">{formatMoney(bill.paid)}</span>
                  </div>
                </div>
                
                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t.remaining_balance}</span>
                  <span className="font-extrabold text-xs text-red-600 dark:text-red-400">{formatMoney(bill.remaining)}</span>
                </div>
              </Card>
            ))}

            {report?.bills?.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {language === 'np' ? 'यो महिनाको लागि कुनै बिल भेटिएन।' : 'No bills found for this period.'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
