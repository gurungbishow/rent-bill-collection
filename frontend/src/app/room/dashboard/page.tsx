'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Receipt } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-none shadow-emerald-500/20">{t.paid}</Badge>;
      case 'PARTIALLY_PAID': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-none shadow-amber-500/20">{t.partial}</Badge>;
      default: return <Badge className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm border-none shadow-rose-500/20">{t.unpaid}</Badge>;
    }
  };

  if (loadingRoom || loadingBills) {
    return <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto"><Skeleton className="h-40 w-full rounded-2xl" /></div>;
  }

  const latestBill = bills && bills.length > 0 ? bills[0] : null;
  const previousBills = bills && bills.length > 1 ? bills.slice(1) : [];

  return (
    <div className="p-3 md:p-8 space-y-6 md:space-y-8 max-w-3xl mx-auto text-slate-900 dark:text-slate-100 relative">
      
      {/* Background Decorator */}
      <div className="absolute top-0 right-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-emerald-400/5 dark:bg-teal-500/10 rounded-full blur-[60px] md:blur-[100px] pointer-events-none -z-10" />

      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
        {room?.room_name || (language === 'np' ? 'मेरो कोठा' : 'My Room')}
      </h1>

      {latestBill ? (
        <Card className="border-0 shadow-[0_4px_20px_rgb(0,0,0,0.04)] md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] md:dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/90 md:bg-white/80 dark:bg-slate-900/90 md:dark:bg-slate-900/80 md:backdrop-blur-xl overflow-hidden rounded-2xl md:rounded-3xl group">
          <CardHeader className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-900 dark:to-teal-950 p-4 md:p-8 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 md:opacity-10 transform translate-x-2 md:translate-x-4 -translate-y-2 md:-translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Receipt className="w-20 h-20 md:w-[120px] md:h-[120px]" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <CardTitle className="text-xl md:text-2xl font-extrabold text-white">
                  {language === 'np' ? 'हालको बिल' : 'Current Bill'}
                </CardTitle>
                <p className="text-emerald-100/80 mt-1 md:mt-1.5 font-medium tracking-wide text-xs md:text-sm">
                  {formatDate(latestBill.bill_date)}
                </p>
              </div>
              <div className="shadow-lg rounded-full">
                {getStatusBadge(latestBill.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-8 space-y-4 md:space-y-5">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
               <span>{t.grand_total}</span>
               <span className="font-bold text-slate-900 dark:text-slate-100 text-base md:text-xl">{formatMoney(latestBill.grand_total)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-sm md:text-base font-medium">
               <span>{t.amount_paid}</span>
               <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base md:text-xl">{formatMoney(latestBill.amount_paid)}</span>
            </div>
            <div className="flex justify-between items-center text-base md:text-xl font-bold border-t border-slate-200/60 dark:border-slate-800/60 pt-4 md:pt-5 mt-1 md:mt-2">
               <span>{t.remaining_balance}</span>
               <span className={latestBill.remaining_balance > 0 ? "text-rose-600 dark:text-rose-400 text-xl md:text-3xl" : "text-slate-900 dark:text-slate-100 text-xl md:text-3xl"}>
                 {formatMoney(latestBill.remaining_balance)}
               </span>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50 flex gap-3 p-3 md:p-6">
             <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg md:rounded-xl h-10 md:h-12 text-sm md:text-md shadow-md shadow-emerald-500/20 transition-all font-semibold" onClick={() => window.print()}>
               <Download size={16} className="mr-2 md:w-[18px] md:h-[18px]" /> {t.pdf}
             </Button>
          </CardFooter>
        </Card>
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

      {previousBills.length > 0 && (
        <div className="space-y-3 md:space-y-4 mt-8 md:mt-12">
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t.billing_history}</h2>
          <div className="space-y-2.5 md:space-y-4">
            {previousBills.map((bill: any) => (
              <Card key={bill.id} className="border border-slate-200/50 dark:border-slate-800/50 shadow-sm md:hover:shadow-md md:hover:-translate-y-0.5 transition-all duration-300 bg-white/90 md:bg-white/70 dark:bg-slate-900/90 md:dark:bg-slate-900/70 md:backdrop-blur-xl rounded-xl md:rounded-2xl overflow-hidden">
                <div className="p-3.5 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 md:gap-3 mb-1.5 md:mb-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base">
                        {formatDate(bill.bill_date)}
                      </span>
                      {getStatusBadge(bill.status)}
                    </div>
                    <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-3 md:gap-4 font-medium">
                      <span>{t.grand_total}: <strong className="text-slate-800 dark:text-slate-200">{formatMoney(bill.grand_total)}</strong></span>
                      <span>{t.remaining_balance}: <strong className={bill.remaining_balance > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>{formatMoney(bill.remaining_balance)}</strong></span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg md:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto h-8 md:h-9">
                    <FileText size={14} className="mr-1.5 md:mr-2" /> <span className="font-semibold text-xs md:text-sm">{t.view}</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
