'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Download, 
  Receipt, 
  Home, 
  Droplets, 
  Zap, 
  Wifi, 
  Trash2, 
  Calculator, 
  History, 
  CreditCard, 
  Wallet, 
  Scale,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';

const getStatusBadge = (status: string, t: any) => {
  switch (status) {
    case 'PAID':
      return (
        <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 tracking-wider">
          {t.paid}
        </span>
      );
    case 'PARTIALLY_PAID':
      return (
        <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 tracking-wider">
          {t.partial}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 tracking-wider">
          {t.unpaid}
        </span>
      );
  }
};

function ItemizedBillCard({ bill, t, formatDate, formatMoney, formatNumber, language }: any) {
  const [expanded, setExpanded] = useState(true);

  const accentBorder = 
    bill.status === 'PAID' ? 'border-l-[5px] border-l-emerald-500' :
    bill.status === 'PARTIALLY_PAID' ? 'border-l-[5px] border-l-amber-500' :
    'border-l-[5px] border-l-rose-500';

  return (
    <Card className={`border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden rounded-2xl ${accentBorder} transition-all`}>
      {/* ── CARD HEADER ── */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/60 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            {formatDate(bill.bill_date)}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(bill.status, t)}
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3.5 sm:p-4 space-y-3.5 text-xs">
          {/* ── ITEMIZED SERVICES GRID ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Room Rent */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Home size={11} className="text-emerald-500 shrink-0" />
                {t.room_rent || 'Room Rent'}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {formatMoney(bill.room_rent)}
              </span>
            </div>

            {/* Water Bill */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Droplets size={11} className="text-blue-500 shrink-0" />
                {t.water || 'Water Bill'}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {formatMoney(bill.water_bill)}
              </span>
            </div>

            {/* Meter Reading */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Zap size={11} className="text-amber-500 shrink-0" />
                {t.meter_reading || 'Meter'}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {formatNumber(bill.electric_units_used || 0)} <span className="text-[10px] text-slate-400 font-normal">{language === 'np' ? 'युनिट' : 'units'}</span>
              </span>
            </div>

            {/* Internet Bill */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Wifi size={11} className="text-indigo-500 shrink-0" />
                {t.internet || 'Internet Bill'}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {bill.wifi_enabled ? formatMoney(bill.wifi_bill) : '—'}
              </span>
            </div>

            {/* Waste Bill */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Trash2 size={11} className="text-rose-500 shrink-0" />
                {t.waste || 'Waste Bill'}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {formatMoney(bill.waste_bill)}
              </span>
            </div>

            {/* Electricity Bill */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Zap size={11} className="text-amber-500 shrink-0" />
                {t.electricity || 'Electricity Bill'}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {formatMoney(bill.electric_bill)}
              </span>
            </div>
          </div>

          {/* ── SUB-TOTALS ── */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calculator size={11} className="text-slate-400 shrink-0" />
                {t.current_month_total || 'Current Month Total'}
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {formatMoney(bill.current_month_total)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 text-right sm:text-left">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 justify-end sm:justify-start">
                <History size={11} className="text-amber-500 shrink-0" />
                {t.previous_balance || 'Previous Balance'}
              </span>
              <span className={`font-extrabold text-xs sm:text-sm ${Number(bill.previous_balance) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                {formatMoney(bill.previous_balance)}
              </span>
            </div>
          </div>

          {/* ── GRAND TOTALS ── */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <CreditCard size={10} className="shrink-0" />
                {t.grand_total}
              </span>
              <span className="font-black text-xs sm:text-base text-blue-600 dark:text-blue-400">
                {formatMoney(bill.grand_total)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Wallet size={10} className="shrink-0" />
                {t.amount_paid}
              </span>
              <span className="font-black text-xs sm:text-base text-emerald-600 dark:text-emerald-400">
                {formatMoney(bill.amount_paid)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800/60 pt-2 sm:pt-0">
              <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Scale size={10} className="shrink-0" />
                {t.remaining_balance}
              </span>
              <span className={`font-black text-xs sm:text-base ${Number(bill.remaining_balance) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                {formatMoney(bill.remaining_balance)}
              </span>
            </div>
          </div>

          {/* ── ACTION FOOTER ── */}
          <div className="pt-1">
            <Button 
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl h-10 text-xs shadow-sm shadow-emerald-500/20 transition-all font-extrabold cursor-pointer border-0 flex items-center justify-center gap-2" 
              onClick={() => window.print()}
            >
              <Download size={14} />
              <span>{t.pdf || 'Print PDF Receipt'}</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function TenantDashboard() {
  const { user } = useAuth();
  const { t, formatDate, formatMoney, formatNumber, language } = useLanguage();

  const roomId = user?.room_id || user?.roomId;

  const { data: room, isLoading: loadingRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data.data;
    },
    enabled: !!roomId
  });

  const { data: bills, isLoading: loadingBills } = useQuery({
    queryKey: ['room-bills', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/bills`);
      return res.data.data;
    },
    enabled: !!roomId
  });

  if (loadingRoom || loadingBills) {
    return <div className="p-3.5 sm:p-4 md:p-8 space-y-6 max-w-3xl mx-auto pb-24"><Skeleton className="h-40 w-full rounded-2xl" /></div>;
  }

  const latestBill = bills && bills.length > 0 ? bills[0] : null;
  const previousBills = bills && bills.length > 1 ? bills.slice(1) : [];

  return (
    <div className="p-3.5 sm:p-4 md:p-8 space-y-4 md:space-y-6 max-w-3xl mx-auto text-slate-900 dark:text-slate-100 relative pb-24">
      
      {/* Background Decorator */}
      <div className="absolute top-0 right-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-emerald-400/5 dark:bg-teal-500/10 rounded-full blur-[60px] md:blur-[100px] pointer-events-none -z-10" />

      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
        {room?.room_name || (language === 'np' ? 'मेरो कोठा' : 'My Room')}
      </h1>

      {/* ── CURRENT BILL ITEMIZED CARD ── */}
      {latestBill ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'np' ? 'हालको बिल' : 'Current Bill'}
            </span>
          </div>
          <ItemizedBillCard 
            bill={latestBill} 
            t={t} 
            formatDate={formatDate} 
            formatMoney={formatMoney} 
            formatNumber={formatNumber} 
            language={language}
            isCurrent={true}
          />
        </div>
      ) : (
        <div className="py-8 px-4 text-center flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
            <Receipt size={18} />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {t.no_bills_found}
          </p>
        </div>
      )}

      {/* ── BILLING HISTORY ITEMIZED CARDS ── */}
      {previousBills.length > 0 && (
        <div className="space-y-3 mt-6">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.billing_history}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {previousBills.map((bill: any) => (
              <ItemizedBillCard 
                key={bill.id}
                bill={bill} 
                t={t} 
                formatDate={formatDate} 
                formatMoney={formatMoney} 
                formatNumber={formatNumber} 
                language={language}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
