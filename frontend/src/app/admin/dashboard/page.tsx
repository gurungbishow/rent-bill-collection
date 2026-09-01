'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, ReceiptText, Banknote, AlertCircle, CheckCircle2, Clock, CalendarDays, LayoutDashboard } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, Label as RechartsLabel } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from 'next-themes';
import { BS_MONTHS_EN, BS_MONTHS_NP, getTodayBsDate, parseBsDate } from '@/lib/bsDate';

export default function AdminDashboard() {
  const { t, formatMoney, formatNumber, language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const bsToday = parseBsDate(getTodayBsDate()) || { year: 2081, month: 5 };
  const currentMonthName = language === 'np' 
    ? `${BS_MONTHS_NP[bsToday.month - 1]} ${formatNumber(bsToday.year)}`
    : `${BS_MONTHS_EN[bsToday.month - 1]} ${formatNumber(bsToday.year)}`;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard');
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="p-3.5 sm:p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
        <h1 className="text-xl md:text-2xl font-extrabold">{t.dashboard}</h1>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const totalBills = (stats?.paid || 0) + (stats?.partiallyPaid || 0) + (stats?.unpaid || 0);

  // Tooltip styles that respect dark mode
  const tooltipStyle = {
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.8)',
    borderRadius: '12px',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontWeight: 700,
    boxShadow: isDark ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    fontSize: '11px',
    padding: '8px 12px'
  };
  const tooltipItemStyle = { color: isDark ? '#f8fafc' : '#0f172a' };

  // Pie chart data — ordered: Paid → Partial → Unpaid
  const pieData = [
    { name: t.paid, value: stats?.paid || 0, color: '#10b981' },
    { name: t.partial, value: stats?.partiallyPaid || 0, color: '#f59e0b' },
    { name: t.unpaid, value: stats?.unpaid || 0, color: '#f43f5e' }
  ];

  // Find the dominant status for center label
  const getDominantLabel = () => {
    if (totalBills === 0) return t.no_data_yet;
    const dominant = pieData.reduce((a, b) => a.value >= b.value ? a : b);
    const pct = Math.round((dominant.value / totalBills) * 100);
    return `${pct}% ${dominant.name}`;
  };

  return (
    <div className="p-3.5 sm:p-4 md:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 pb-24">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8.5 w-8.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t.dashboard}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium">
              {language === 'np' ? 'तपाईंको भाडा र बिल सङ्कलनको सिंहावलोकन' : 'Overview of your rent and bill collections'}
            </p>
          </div>
        </div>

        <Badge variant="outline" className="flex items-center gap-1.5 text-xs font-extrabold px-3 h-8.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-blue-600 dark:text-blue-400 border-slate-200/80 dark:border-slate-800/80 shadow-xs rounded-full shrink-0">
          <CalendarDays size={13} className="text-blue-500 shrink-0" />
          <span>{currentMonthName}</span>
        </Badge>
      </div>
      
      {/* ── TOP VIBRANT GLASS METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-5">
        {/* Rooms */}
        <Card className="border border-blue-200/80 dark:border-blue-800/60 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 backdrop-blur-md rounded-2xl overflow-hidden p-3.5 sm:p-4 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardContent className="p-0 flex flex-col justify-between h-full pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{t.all_rooms}</span>
              <div className="w-7 h-7 rounded-xl bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <DoorOpen size={14} />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mt-2">
              {formatNumber(stats?.totalRooms || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Expected Collection */}
        <Card className="border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 backdrop-blur-md rounded-2xl overflow-hidden p-3.5 sm:p-4 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardContent className="p-0 flex flex-col justify-between h-full pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate">{t.expected_collection}</span>
              <div className="w-7 h-7 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ReceiptText size={14} />
              </div>
            </div>
            <div className="text-sm sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight truncate mt-2">
              {formatMoney(stats?.expected || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Total Collected */}
        <Card className="border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 backdrop-blur-md rounded-2xl overflow-hidden p-3.5 sm:p-4 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardContent className="p-0 flex flex-col justify-between h-full pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">{t.total_collected}</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Banknote size={14} />
              </div>
            </div>
            <div className="text-sm sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate mt-2">
              {formatMoney(stats?.collected || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Total Outstanding */}
        <Card className="border border-rose-200/80 dark:border-rose-800/60 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 dark:from-rose-950/40 dark:via-slate-900 dark:to-rose-950/20 backdrop-blur-md rounded-2xl overflow-hidden p-3.5 sm:p-4 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-500" />
          <CardContent className="p-0 flex flex-col justify-between h-full pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 truncate">{t.total_outstanding}</span>
              <div className="w-7 h-7 rounded-xl bg-rose-100/80 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle size={14} />
              </div>
            </div>
            <div className="text-sm sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight truncate mt-2">
              {formatMoney(stats?.outstanding || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── BILL STATUS OVERVIEW ── */}
      <div className="space-y-2">
        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.bills_status}
        </h2>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
          {/* Paid */}
          <Card className="border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
            <div className="p-2.5 sm:p-4 pt-3.5 sm:pt-5 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 tracking-wider">
                  {t.paid}
                </span>
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              </div>
              <div className="flex flex-col mt-1">
                <span className="text-base sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatNumber(stats?.paid || 0)}</span>
                {totalBills > 0 && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {language === 'np' ? `जम्मा ${formatNumber(totalBills)} मध्ये` : `out of ${formatNumber(totalBills)} bills`}
                  </span>
                )}
              </div>
            </div>
          </Card>
          
          {/* Partial */}
          <Card className="border border-amber-200/80 dark:border-amber-900/40 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400" />
            <div className="p-2.5 sm:p-4 pt-3.5 sm:pt-5 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 tracking-wider">
                  {t.partial}
                </span>
                <Clock size={13} className="text-amber-500 shrink-0" />
              </div>
              <div className="flex flex-col mt-1">
                <span className="text-base sm:text-2xl font-black text-amber-500 dark:text-amber-400">{formatNumber(stats?.partiallyPaid || 0)}</span>
                {totalBills > 0 && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {language === 'np' ? `जम्मा ${formatNumber(totalBills)} मध्ये` : `out of ${formatNumber(totalBills)} bills`}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Unpaid */}
          <Card className="border border-rose-200/80 dark:border-rose-900/40 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-rose-400" />
            <div className="p-2.5 sm:p-4 pt-3.5 sm:pt-5 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 tracking-wider">
                  {t.unpaid}
                </span>
                <AlertCircle size={13} className="text-rose-500 shrink-0" />
              </div>
              <div className="flex flex-col mt-1">
                <span className="text-base sm:text-2xl font-black text-rose-500 dark:text-rose-400">{formatNumber(stats?.unpaid || 0)}</span>
                {totalBills > 0 && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {language === 'np' ? `जम्मा ${formatNumber(totalBills)} मध्ये` : `out of ${formatNumber(totalBills)} bills`}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5 mt-4">
        {/* Collection Overview Bar Chart */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden rounded-2xl">
          <CardHeader className="p-3.5 sm:p-5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t.collection_overview}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-5 pt-3 h-[220px] sm:h-[320px] flex items-center justify-center text-[9px] sm:text-xs relative">
            {(Number(stats?.collected) === 0 && Number(stats?.expected) > 0) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium border border-amber-200 dark:border-amber-800/50">
                  {language === 'np' ? 'अहिलेसम्म कुनै भुक्तानी भएको छैन' : 'No payments collected yet'}
                </span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: t.expected_collection, amount: Number(stats?.expected) || 0, fill: '#6366f1' },
                { name: t.total_collected, amount: Number(stats?.collected) || 0, fill: '#10b981' },
                { name: t.total_outstanding, amount: Number(stats?.outstanding) || 0, fill: '#f43f5e' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.5} />
                <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 9, fontWeight: 600, fill: isDark ? '#94a3b8' : '#64748b' }} tickMargin={6} axisLine={false} tickLine={false} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} width={35} tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => formatMoney(value)} 
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status Distribution Pie Chart */}
        <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden rounded-2xl">
          <CardHeader className="p-3.5 sm:p-5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {t.payment_status_distribution}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-5 pt-3 h-[220px] sm:h-[320px] flex items-center justify-center text-[9px] sm:text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius="45%"
                  outerRadius="75%"
                  paddingAngle={totalBills > 0 ? 3 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <RechartsLabel
                    value={getDominantLabel()}
                    position="center"
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      fill: isDark ? '#e2e8f0' : '#334155',
                    }}
                  />
                </Pie>
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '5px', fontSize: '10px', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
