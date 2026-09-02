'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Download, Printer, Plus, CreditCard, Banknote, Pencil, Trash2, AlertTriangle, Calendar, ChevronDown, ChevronUp, Share2, Home, Droplets, Zap, Wifi, History, Calculator, Smartphone, Wallet, Building2 } from 'lucide-react';
import { BsDatePicker } from '@/components/BsDatePicker';
import { useRef } from 'react';
import { toPng } from 'html-to-image';
import Link from 'next/link';
import { toast } from 'sonner';
import { adToBs, bsToAd, formatBsPeriod, formatBsDate } from '@/lib/bsDate';
import { useLanguage } from '@/context/LanguageContext';

export default function BillDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const billId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, formatDate, formatMoney, formatNumber, language } = useLanguage();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'CASH', note: '' });

  // Edit Bill State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    bs_date: '',
    bill_date: '',
    room_rent: 0,
    water_bill: 0,
    waste_bill: 0,
    wifi_bill: 0,
    wifi_enabled: false,
    prev_electric_unit: 0,
    pres_electric_unit: 0,
    electric_rate: 0,
    previous_balance: 0
  });

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<any | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Delete Bill State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill', billId],
    queryFn: async () => {
      const res = await api.get(`/bills/${billId}`);
      return res.data.data;
    }
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['payments', billId],
    queryFn: async () => {
      const res = await api.get(`/bills/${billId}/payments`);
      return res.data.data;
    }
  });

  const handleOpenEdit = () => {
    if (bill) {
      setEditForm({
        bs_date: bill.bill_date ? adToBs(bill.bill_date) : '',
        bill_date: bill.bill_date ? new Date(bill.bill_date).toISOString().split('T')[0] : '',
        room_rent: Number(bill.room_rent),
        water_bill: Number(bill.water_bill),
        waste_bill: Number(bill.waste_bill),
        wifi_bill: Number(bill.wifi_bill),
        wifi_enabled: Boolean(bill.wifi_enabled),
        prev_electric_unit: Number(bill.prev_electric_unit),
        pres_electric_unit: Number(bill.pres_electric_unit),
        electric_rate: Number(bill.electric_rate),
        previous_balance: Number(bill.previous_balance)
      });
      setIsEditOpen(true);
    }
  };

  const updateBillMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/bills/${billId}`, data);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bill', billId] });
      queryClient.invalidateQueries({ queryKey: ['room-bills', bill?.room_id] });
      toast.success(t.bill_updated_success);
      setIsEditOpen(false);
      setGeneratedBill(data);
      setIsReceiptOpen(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update bill');
    }
  });

  const deleteBillMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/bills/${billId}`);
    },
    onSuccess: () => {
      toast.success(t.bill_deleted_success);
      router.push(`/admin/rooms/${bill?.room_id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete bill');
    }
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/bills/${billId}/payments`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t.payment_recorded);
      queryClient.invalidateQueries({ queryKey: ['bill', billId] });
      queryClient.invalidateQueries({ queryKey: ['payments', billId] });
      setPaymentOpen(false);
      setPaymentForm({ amount: '', payment_method: 'CASH', note: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  });

  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', payment_method: 'CASH', note: '' });
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/bills/${billId}/payments/${editingPaymentId}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t.payment_recorded);
      queryClient.invalidateQueries({ queryKey: ['bill', billId] });
      queryClient.invalidateQueries({ queryKey: ['payments', billId] });
      setEditPaymentOpen(false);
      setEditingPaymentId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update payment');
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await api.delete(`/bills/${billId}/payments/${paymentId}`);
    },
    onSuccess: () => {
      toast.success(t.payment_deleted || 'Payment deleted');
      queryClient.invalidateQueries({ queryKey: ['bill', billId] });
      queryClient.invalidateQueries({ queryKey: ['payments', billId] });
      setDeletePaymentId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete payment');
    }
  });

  if (isLoading) return <div className="p-6">{t.loading}</div>;
  if (!bill) return <div className="p-6">Bill not found</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 tracking-wider">
            {t.paid}
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 tracking-wider">
            {t.partial}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-800/60 tracking-wider">
            {t.unpaid}
          </span>
        );
    }
  };

  const remaining = Number(bill.remaining_balance || 0);

  // Live calculations for Edit Bill Modal
  const editElectricUnits = Math.max(0, editForm.pres_electric_unit - editForm.prev_electric_unit);
  const editElectricBill = editElectricUnits * editForm.electric_rate;
  const editCurrentMonthTotal = Number(editForm.water_bill || 0) +
    Number(editForm.waste_bill || 0) +
    (editForm.wifi_enabled ? Number(editForm.wifi_bill || 0) : 0) +
    Number(editForm.room_rent || 0) +
    editElectricBill;
  const editGrandTotal = editCurrentMonthTotal + Number(editForm.previous_balance || 0);

  const displayDateStr = formatDate(bill.bill_date);

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-4xl mx-auto text-slate-900 dark:text-slate-100 pb-24">
      {/* ── TOP ACTION TOOLBAR ── */}
      <div className="flex justify-between items-center print:hidden">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/rooms/${bill.room_id}`)} className="hidden md:inline-flex text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
          <ChevronLeft size={20} />
        </Button>
        <div className="flex items-center gap-1 w-full md:w-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-full border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <Button
            variant="ghost"
            className="flex-1 md:flex-none h-8.5 px-3.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-full transition-colors"
            onClick={handleOpenEdit}
          >
            <Pencil size={14} className="mr-1.5 text-amber-500" /> {t.edit}
          </Button>

          <div className="h-4 w-[1px] bg-slate-200/80 dark:bg-slate-800 shrink-0" />

          <Button
            variant="ghost"
            className="flex-1 md:flex-none h-8.5 px-3.5 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 size={14} className="mr-1.5 text-red-500" /> {t.delete}
          </Button>

          <div className="h-4 w-[1px] bg-slate-200/80 dark:bg-slate-800 shrink-0" />

          <Button 
            variant="ghost" 
            onClick={() => { setGeneratedBill(bill); setIsReceiptOpen(true); }} 
            className="flex-1 md:flex-none h-8.5 px-3.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full transition-colors"
          >
            <Printer size={14} className="mr-1.5 text-blue-500" /> {t.print}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* ── MAIN RECEIPT CARD WITH UNIFORM BORDER ── */}
          <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900 rounded-2xl overflow-hidden print:shadow-none print:border-none">
            
            <CardHeader className="text-center border-b border-slate-100 dark:border-slate-800/60 pb-3 pt-4 px-4 md:px-6 bg-slate-50/50 dark:bg-slate-900/50">
              <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{t.receipt_title}</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {t.receipt_subtitle} {bill.room?.room_name && (language === 'np' ? `${bill.room.room_name} को` : `of ${bill.room.room_name}`)}
              </p>
              <div className="mt-3 flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <div className="text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t.date}</p>
                  <p className="text-xs md:text-sm text-slate-900 dark:text-slate-100 font-semibold mt-0.5">{displayDateStr}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(bill.status)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-3 md:pt-4 px-4 md:px-6 space-y-3">
              <div
                className="flex justify-between items-center py-1.5 text-xs sm:text-sm cursor-pointer text-slate-700 dark:text-slate-300 font-semibold print:hidden"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                <span className="flex items-center gap-1.5">
                  <Calculator size={14} className="text-blue-500" />
                  {language === 'np' ? 'बिल विवरण' : 'Bill Details'}
                </span>
                {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              <div className={`space-y-2 ${!showBreakdown ? 'hidden print:block' : 'animate-in slide-in-from-top-2 fade-in duration-200'}`}>
                {/* Water */}
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50 text-xs md:text-sm items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center flex-shrink-0">
                      <Droplets size={12} />
                    </div>
                    <div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">{t.water_np}</span>
                      {bill.prorate_details && bill.prorate_details.baseWater !== undefined && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {formatMoney(bill.prorate_details.baseWater)} / 30 × {bill.prorate_details.days} days
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{formatMoney(bill.water_bill)}</span>
                </div>

                {/* Electricity */}
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50 text-xs md:text-sm items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center flex-shrink-0">
                      <Zap size={12} />
                    </div>
                    <div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">{t.electricity_np}</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatNumber(bill.pres_electric_unit)} - {formatNumber(bill.prev_electric_unit)} = {formatNumber(bill.electric_units_used)} units × {formatMoney(bill.electric_rate)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{formatMoney(bill.electric_bill)}</span>
                </div>

                {/* Waste */}
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50 text-xs md:text-sm items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center flex-shrink-0">
                      <Trash2 size={12} />
                    </div>
                    <div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">{t.waste_np}</span>
                      {bill.prorate_details && bill.prorate_details.baseWaste !== undefined && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {formatMoney(bill.prorate_details.baseWaste)} / 30 × {bill.prorate_details.days} days
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{formatMoney(bill.waste_bill)}</span>
                </div>

                {/* Wifi */}
                {bill.wifi_enabled && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50 text-xs md:text-sm items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-500 flex items-center justify-center flex-shrink-0">
                        <Wifi size={12} />
                      </div>
                      <div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">{t.wifi_np}</span>
                        {bill.prorate_details && bill.prorate_details.baseWifi !== undefined && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {formatMoney(bill.prorate_details.baseWifi)} / 30 × {bill.prorate_details.days} days
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{formatMoney(bill.wifi_bill)}</span>
                  </div>
                )}

                {/* Room Rent */}
                <div className="flex justify-between py-1.5 text-xs md:text-sm items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Home size={12} />
                    </div>
                    <div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">{t.rent_np}</span>
                      {bill.prorate_details && bill.prorate_details.baseRent !== undefined && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {formatMoney(bill.prorate_details.baseRent)} / 30 × {bill.prorate_details.days} days
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{formatMoney(bill.room_rent)}</span>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="pt-2 md:pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 bg-slate-50/70 dark:bg-slate-800/40 -mx-4 md:-mx-6 px-4 md:px-6 py-2.5 rounded-xl">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200 text-xs md:text-sm">
                  <span>{t.current_total}</span>
                  <span className="font-semibold">{formatMoney(bill.current_month_total)}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-semibold text-xs md:text-sm">
                  <span>{t.prev_balance}</span>
                  <span className="font-semibold">{formatMoney(bill.previous_balance)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm md:text-base font-bold text-blue-700 dark:text-blue-300 border-t border-slate-200 dark:border-slate-700/60 pt-2 mt-1">
                  <span>{t.grand_total}</span>
                  <span>{formatMoney(bill.grand_total)}</span>
                </div>
              </div>

              {/* Paid & Remaining */}
              <div className="space-y-1.5 pt-1 text-xs md:text-sm">
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>{t.amount_paid}</span>
                  <span>{formatMoney(bill.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-red-600 dark:text-red-400 font-semibold">
                  <span>{t.remaining_balance}</span>
                  <span>{formatMoney(bill.remaining_balance)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── SIDEBAR PAYMENT COLLECTION & HISTORY ── */}
        <div className="space-y-4 print:hidden">
          {/* Payment Action Card */}
          <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900 rounded-2xl overflow-hidden pb-0">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-3 px-4">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">{t.payment_collection}</CardTitle>
            </CardHeader>
            <CardContent className="py-3 px-4">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">{t.remaining_balance}</span>
                <span className={`text-sm md:text-lg font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatMoney(remaining)}
                </span>
              </div>
            </CardContent>

            {/* Edge-to-Edge 50/50 Split Action Bar */}
            <CardFooter className="p-0 border-t border-slate-200/80 dark:border-slate-800 flex items-stretch h-11 bg-slate-50/50 dark:bg-slate-900/50 divide-x divide-slate-200/80 dark:divide-slate-800 rounded-b-2xl overflow-hidden mt-0">
              <button
                type="button"
                disabled={remaining <= 0 || paymentMutation.isPending}
                onClick={() => {
                  paymentMutation.mutate({
                    amount: remaining,
                    payment_method: 'CASH',
                    note: 'Full payment'
                  });
                }}
                className="flex-1 font-semibold text-xs text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer rounded-bl-2xl"
              >
                <Banknote size={15} />
                <span>{t.full_payment}</span>
              </button>

              <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogTrigger render={
                  <button
                    type="button"
                    disabled={remaining <= 0}
                    className="flex-1 font-semibold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer rounded-br-2xl"
                  >
                    <Plus size={15} />
                    <span>{t.partial_payment}</span>
                  </button>
                } />
                <DialogContent className="sm:max-w-[400px] rounded-2xl overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>{t.record_payment}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.amount_paid} (Rs)</Label>
                      <Input
                        type="number"
                        className="h-9 text-xs rounded-lg"
                        placeholder={remaining ? remaining.toString() : '0'}
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.payment_method}</Label>
                      <Select
                        value={paymentForm.payment_method}
                        onValueChange={(val: any) => setPaymentForm({ ...paymentForm, payment_method: val || 'CASH' })}
                      >
                        <SelectTrigger className="h-9 text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">{t.cash}</SelectItem>
                          <SelectItem value="ESEWA">{t.esewa}</SelectItem>
                          <SelectItem value="KHALTI">{t.khalti}</SelectItem>
                          <SelectItem value="BANK">{t.bank}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{language === 'np' ? 'कैफियत (Note)' : 'Note'}</Label>
                      <Input
                        className="h-9 text-xs rounded-lg"
                        placeholder={language === 'np' ? 'जस्तै: अग्रिम भुक्तानी, चेक नं.' : 'e.g. advance, cheque #'}
                        value={paymentForm.note}
                        onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setPaymentOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">{t.cancel}</Button>
                    <Button
                      type="button"
                      onClick={() => paymentMutation.mutate({
                        amount: paymentForm.amount,
                        payment_method: paymentForm.payment_method || (paymentForm as any).method || 'CASH',
                        note: paymentForm.note
                      })}
                      disabled={!paymentForm.amount || paymentMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                    >
                      {paymentMutation.isPending ? t.loading : t.save}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          {/* Payment History */}
          <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">{t.payment_history}</CardTitle>
              {payments?.length > 0 && (
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
                  {payments.length} {language === 'np' ? 'भुक्तानी' : 'record(s)'}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loadingPayments ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : payments?.length === 0 ? (
                <div className="p-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                  {language === 'np' ? 'कुनै भुक्तानी फेला परेन' : 'No payments recorded yet'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {payments?.map((payment: any) => (
                    <div key={payment.id} className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          {payment.payment_method === 'CASH' ? <Banknote size={16} /> : <CreditCard size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 tracking-tight">{formatMoney(payment.amount)}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-slate-400 shrink-0" />
                              <span>{formatDate(payment.payment_date)}</span>
                            </span>
                            {payment.note && (
                              <span className="truncate max-w-[130px] sm:max-w-[200px] text-slate-400 dark:text-slate-500 font-normal">({payment.note})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {payment.payment_method === 'CASH' && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 tracking-wider">
                            <Banknote size={11} className="text-emerald-500 shrink-0" />
                            <span>CASH</span>
                          </span>
                        )}
                        {payment.payment_method === 'ESEWA' && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-lime-50 dark:bg-lime-950/60 text-lime-700 dark:text-lime-300 border border-lime-200/80 dark:border-lime-800/60 tracking-wider">
                            <Smartphone size={11} className="text-lime-500 shrink-0" />
                            <span>eSewa</span>
                          </span>
                        )}
                        {payment.payment_method === 'KHALTI' && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 tracking-wider">
                            <Wallet size={11} className="text-purple-500 shrink-0" />
                            <span>Khalti</span>
                          </span>
                        )}
                        {payment.payment_method === 'BANK' && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 tracking-wider">
                            <Building2 size={11} className="text-blue-500 shrink-0" />
                            <span>Bank</span>
                          </span>
                        )}
                        {payment.payment_method !== 'CASH' && payment.payment_method !== 'ESEWA' && payment.payment_method !== 'KHALTI' && payment.payment_method !== 'BANK' && (
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 tracking-wider">
                            {payment.payment_method}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-full transition-all active:scale-90"
                          onClick={() => {
                            setEditingPaymentId(payment.id);
                            setEditPaymentForm({
                              amount: payment.amount.toString(),
                              payment_method: payment.payment_method,
                              note: payment.note || ''
                            });
                            setEditPaymentOpen(true);
                          }}
                          title={t.edit || 'Edit'}
                        >
                          <Pencil size={14} className="text-amber-500 dark:text-amber-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-all active:scale-90"
                          onClick={() => setDeletePaymentId(payment.id)}
                          disabled={deletePaymentMutation.isPending}
                          title={t.delete || 'Delete'}
                        >
                          <Trash2 size={14} className="text-red-500 dark:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {/* Edit Payment Dialog */}
            <Dialog open={editPaymentOpen} onOpenChange={setEditPaymentOpen}>
              <DialogContent className="sm:max-w-[400px] rounded-2xl overflow-hidden">
                <DialogHeader>
                  <DialogTitle>{t.edit_payment}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.amount_paid} (Rs)</Label>
                    <Input
                      type="number"
                      className="h-9 text-xs rounded-lg"
                      value={editPaymentForm.amount}
                      onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.payment_method}</Label>
                    <Select
                      value={editPaymentForm.payment_method}
                      onValueChange={(val: any) => setEditPaymentForm({ ...editPaymentForm, payment_method: val || 'CASH' })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">{t.cash}</SelectItem>
                        <SelectItem value="ESEWA">{t.esewa}</SelectItem>
                        <SelectItem value="KHALTI">{t.khalti}</SelectItem>
                        <SelectItem value="BANK">{t.bank}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{language === 'np' ? 'कैफियत (Note)' : 'Note'}</Label>
                    <Input
                      className="h-9 text-xs rounded-lg"
                      placeholder={language === 'np' ? 'जस्तै: अग्रिम भुक्तानी, चेक नं.' : 'e.g. advance, cheque #'}
                      value={editPaymentForm.note}
                      onChange={(e) => setEditPaymentForm({ ...editPaymentForm, note: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setEditPaymentOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">{t.cancel}</Button>
                  <Button
                    type="button"
                    onClick={() => updatePaymentMutation.mutate({
                      amount: editPaymentForm.amount,
                      payment_method: editPaymentForm.payment_method,
                      note: editPaymentForm.note
                    })}
                    disabled={!editPaymentForm.amount || updatePaymentMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                  >
                    {updatePaymentMutation.isPending ? t.loading : t.save}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Payment Dialog */}
            <Dialog open={!!deletePaymentId} onOpenChange={(open) => !open && setDeletePaymentId(null)}>
              <DialogContent className="sm:max-w-[425px] rounded-2xl overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle size={18} /> {language === 'np' ? 'भुक्तानी मेटाउनुहोस्' : 'Delete Payment'}
                  </DialogTitle>
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 mt-3">
                    {language === 'np' ? 'के तपाईं यो भुक्तानी मेटाउन निश्चित हुनुहुन्छ? यो प्रक्रिया उल्टाउन सकिँदैन।' : 'Are you sure you want to delete this payment? This action cannot be undone.'}
                  </p>
                </DialogHeader>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setDeletePaymentId(null)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">{t.cancel}</Button>
                  <Button
                    type="button"
                    onClick={() => deletePaymentId && deletePaymentMutation.mutate(deletePaymentId)}
                    disabled={deletePaymentMutation.isPending}
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold"
                  >
                    {deletePaymentMutation.isPending ? t.loading : t.delete}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      </div>

      {/* Edit Bill Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50">
            <DialogTitle className="text-sm sm:text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <div className="h-6 w-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Pencil size={13} />
              </div>
              <span>{t.edit} - {bill ? formatDate(bill.bill_date) : ''}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 p-4 text-xs sm:text-sm">
            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar size={12} className="text-blue-500" />
                {t.date}
              </Label>
              <BsDatePicker
                value={editForm.bs_date}
                onChange={(val) => setEditForm({ ...editForm, bs_date: val })}
                language={language as 'en' | 'np'}
              />
            </div>

            {/* Rent & Water */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Home size={12} className="text-emerald-500" />
                  {t.rent}
                </Label>
                <Input
                  type="number"
                  step="any"
                  className="h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-lg"
                  value={editForm.room_rent}
                  onChange={(e) => setEditForm({ ...editForm, room_rent: e.target.value === '' ? '' as any : Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Droplets size={12} className="text-blue-500" />
                  {t.water}
                </Label>
                <Input
                  type="number"
                  step="any"
                  className="h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-lg"
                  value={editForm.water_bill}
                  onChange={(e) => setEditForm({ ...editForm, water_bill: e.target.value === '' ? '' as any : Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Waste & Wifi */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Trash2 size={12} className="text-rose-500" />
                  {t.waste}
                </Label>
                <Input
                  type="number"
                  step="any"
                  className="h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-lg"
                  value={editForm.waste_bill}
                  onChange={(e) => setEditForm({ ...editForm, waste_bill: e.target.value === '' ? '' as any : Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-0.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Wifi size={12} className="text-violet-500" />
                    {t.wifi}
                  </Label>
                  <Switch
                    checked={editForm.wifi_enabled}
                    onCheckedChange={(val) => setEditForm({ ...editForm, wifi_enabled: val })}
                  />
                </div>
                <Input
                  type="number"
                  step="any"
                  className="h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-lg"
                  disabled={!editForm.wifi_enabled}
                  value={editForm.wifi_bill}
                  onChange={(e) => setEditForm({ ...editForm, wifi_bill: e.target.value === '' ? '' as any : Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Electricity Card Box */}
            <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl space-y-2.5 border border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <Zap size={14} className="text-amber-500" />
                <span>{t.electricity}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{t.prev_unit}</Label>
                  <Input
                    type="number"
                    className="h-9 text-xs px-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                    value={editForm.prev_electric_unit}
                    onChange={(e) => setEditForm({ ...editForm, prev_electric_unit: e.target.value === '' ? '' as any : Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{t.pres_unit}</Label>
                  <Input
                    type="number"
                    className="h-9 text-xs px-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                    value={editForm.pres_electric_unit}
                    onChange={(e) => setEditForm({ ...editForm, pres_electric_unit: e.target.value === '' ? '' as any : Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{t.rate_per_unit}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-9 text-xs px-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                    value={editForm.electric_rate}
                    onChange={(e) => setEditForm({ ...editForm, electric_rate: e.target.value === '' ? '' as any : Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-amber-200/40 dark:border-amber-900/30">
                <span className="text-[11px]">{t.units_used}: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{formatNumber(editElectricUnits)}</strong></span>
                <span className="text-[11px]">{t.electricity}: <strong className="text-amber-700 dark:text-amber-300 font-semibold">{formatMoney(editElectricBill)}</strong></span>
              </div>
            </div>

            {/* Previous Balance */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <History size={12} className="text-amber-500" />
                {t.prev_balance}
              </Label>
              <Input
                type="number"
                step="any"
                className="h-9 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-lg"
                value={editForm.previous_balance}
                onChange={(e) => setEditForm({ ...editForm, previous_balance: e.target.value === '' ? '' as any : Number(e.target.value) })}
              />
            </div>

            {/* Totals Box */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl space-y-1.5 text-xs border border-blue-100 dark:border-blue-900/50">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                <span>{t.current_total}:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(editCurrentMonthTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-slate-100 font-semibold text-xs sm:text-sm pt-1 border-t border-blue-200/80 dark:border-blue-900/80">
                <span className="text-blue-700 dark:text-blue-300 font-semibold">{t.grand_total}:</span>
                <span className="text-blue-700 dark:text-blue-300 font-bold">{formatMoney(editGrandTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditOpen(false)}
              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (editForm.pres_electric_unit < editForm.prev_electric_unit) {
                  toast.error(language === 'np' ? 'अहिलेको युनिट पहिलेको भन्दा कम हुनु हुँदैन' : 'Present unit cannot be less than previous unit');
                  return;
                }
                const payload = {
                  ...editForm,
                  bill_date: editForm.bs_date ? bsToAd(editForm.bs_date)?.toISOString() : undefined
                };
                // @ts-expect-error // payload cleanup; safe to ignore TypeScript error
                delete payload.bs_date;
                updateBillMutation.mutate(payload);
              }}
              disabled={updateBillMutation.isPending}
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
            >
              {updateBillMutation.isPending ? t.loading : (language === 'np' ? 'परिवर्तनहरू बचत गर्नुहोस्' : 'Save Changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50">
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle size={18} />
              <span>{t.delete_bill}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2.5">
            <p>
              {language === 'np' ? 'के तपाईं ' : 'Are you sure you want to delete the bill for '}
              <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                {bill ? formatDate(bill.bill_date) : ''}
              </strong>
              {language === 'np' ? ' को बिल मेटाउन निश्चित हुनुहुन्छ?' : '?'}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-100 dark:border-red-900/40 font-medium">
              {t.delete_bill_confirm}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80">{t.cancel}</Button>
            <Button
              type="button"
              onClick={() => deleteBillMutation.mutate()}
              disabled={deleteBillMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold"
            >
              {deleteBillMutation.isPending ? t.loading : t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-[calc(100%-2.5rem)] sm:max-w-sm md:max-w-md bg-white border border-slate-200 p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div ref={receiptRef} className="bg-white text-slate-900 p-4 sm:p-5 flex flex-col gap-3">
            {/* Header info */}
            <div className="text-center pb-2.5 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{bill?.room?.room_name}</h2>
              {bill?.room?.user && (
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{bill.room.user.name || bill.room.user.username}</p>
              )}
              {generatedBill && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
                  <Calendar size={12} className="text-blue-500" />
                  <span>Billing Period: {formatBsPeriod(adToBs(generatedBill.bill_date), language as 'en' | 'np')}</span>
                </div>
              )}
            </div>
            
            {/* Line Items with Colorful Icons */}
            <div className="space-y-1.5 text-xs sm:text-sm">
              {generatedBill && (
                <>
                  {generatedBill.room_rent > 0 && (
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Home size={13} />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 block text-xs">{t.rent || 'Room Rent'}</span>
                          {generatedBill.prorate_details?.isProrated && generatedBill.prorate_details?.baseRent && (
                            <span className="text-[9px] text-slate-400">
                              {formatMoney(generatedBill.prorate_details.baseRent)} / 30 × {generatedBill.prorate_details.days} days
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{formatMoney(generatedBill.room_rent)}</span>
                    </div>
                  )}

                  {generatedBill.water_bill > 0 && (
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                          <Droplets size={13} />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 block text-xs">{t.water || 'Water Bill'}</span>
                          {generatedBill.prorate_details?.isProrated && generatedBill.prorate_details?.baseWater && (
                            <span className="text-[9px] text-slate-400">
                              {formatMoney(generatedBill.prorate_details.baseWater)} / 30 × {generatedBill.prorate_details.days} days
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{formatMoney(generatedBill.water_bill)}</span>
                    </div>
                  )}

                  {generatedBill.electric_bill > 0 && (
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                          <Zap size={13} />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 block text-xs">{t.electricity || 'Electricity Bill'}</span>
                          <span className="text-[9px] text-slate-400">
                            {generatedBill.pres_electric_unit} - {generatedBill.prev_electric_unit} = {generatedBill.pres_electric_unit - generatedBill.prev_electric_unit} units × {formatMoney(generatedBill.electric_rate)}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{formatMoney(generatedBill.electric_bill)}</span>
                    </div>
                  )}

                  {generatedBill.waste_bill > 0 && (
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                          <Trash2 size={13} />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 block text-xs">{t.waste || 'Waste Bill'}</span>
                          {generatedBill.prorate_details?.isProrated && generatedBill.prorate_details?.baseWaste && (
                            <span className="text-[9px] text-slate-400">
                              {formatMoney(generatedBill.prorate_details.baseWaste)} / 30 × {generatedBill.prorate_details.days} days
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{formatMoney(generatedBill.waste_bill)}</span>
                    </div>
                  )}

                  {generatedBill.wifi_bill > 0 && (
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Wifi size={13} />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 block text-xs">{t.wifi || 'Internet Bill'}</span>
                          {generatedBill.prorate_details?.isProrated && generatedBill.prorate_details?.baseWifi && (
                            <span className="text-[9px] text-slate-400">
                              {formatMoney(generatedBill.prorate_details.baseWifi)} / 30 × {generatedBill.prorate_details.days} days
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{formatMoney(generatedBill.wifi_bill)}</span>
                    </div>
                  )}
                  
                  {/* Subtotals & Grand Total Section */}
                  {(() => {
                    const currentMonthTotal = 
                      Number(generatedBill.room_rent || 0) +
                      Number(generatedBill.water_bill || 0) +
                      Number(generatedBill.electric_bill || 0) +
                      Number(generatedBill.waste_bill || 0) +
                      Number(generatedBill.wifi_bill || 0);
                    
                    const prevDues = Number(generatedBill.previous_balance ?? generatedBill.remaining_balance ?? 0);
                    const totalAmount = Number(generatedBill.grand_total || (currentMonthTotal + prevDues));

                    return (
                      <>
                        {/* Current Month Total */}
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 pt-1.5 text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                              <Calculator size={13} />
                            </div>
                            <span className="font-bold text-xs">{t.current_total || 'Current Month Total'}</span>
                          </div>
                          <span className="font-bold text-xs sm:text-sm">{formatMoney(currentMonthTotal)}</span>
                        </div>

                        {/* Previous Balance */}
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 text-amber-700">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                              <History size={13} />
                            </div>
                            <span className="font-bold text-xs">{t.prev_balance || 'Previous Balance'}</span>
                          </div>
                          <span className="font-bold text-xs sm:text-sm">{formatMoney(prevDues)}</span>
                        </div>

                        {/* Grand Total Block (100% Full Width) */}
                        <div className="bg-blue-500/10 border-t border-blue-200/80 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-2.5 flex justify-between items-center mt-2">
                          <span className="font-bold text-blue-700 text-xs sm:text-sm">{t.grand_total || 'Grand Total'}</span>
                          <span className="font-extrabold text-base sm:text-lg text-blue-700">{formatMoney(totalAmount)}</span>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
          
          {/* Edge-to-Edge 50/50 Split Action Bar */}
          <div className="border-t border-slate-200/80 dark:border-slate-800 flex items-stretch h-11 bg-slate-50 dark:bg-slate-900 divide-x divide-slate-200/80 dark:divide-slate-800 rounded-b-2xl overflow-hidden">
            <button 
              type="button"
              className="flex-1 font-extrabold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer select-none rounded-bl-2xl" 
              onClick={async () => {
                if (!receiptRef.current) return;
                try {
                  const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
                  const link = document.createElement('a');
                  link.download = `bill-${bill?.room?.room_name || 'receipt'}.png`;
                  link.href = dataUrl;
                  link.click();
                  toast.success("Receipt downloaded");
                } catch (err) {
                  toast.error("Failed to generate image");
                }
              }}
            >
              <Download size={15} className="text-blue-600 shrink-0" />
              <span>{language === 'np' ? 'डाउनलोड' : 'Download'}</span>
            </button>
            <button 
              type="button"
              className="flex-1 font-extrabold text-xs text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer select-none rounded-br-2xl" 
              onClick={async () => {
                if (!receiptRef.current) return;
                try {
                  const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
                  const blob = await (await fetch(dataUrl)).blob();
                  const file = new File([blob], `bill-${bill?.room?.room_name || 'receipt'}.png`, { type: 'image/png' });
                  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                      title: `Bill - ${bill?.room?.room_name}`,
                      text: `Rent bill for ${bill?.room?.room_name}`,
                      files: [file]
                    });
                  } else {
                    const link = document.createElement('a');
                    link.download = file.name;
                    link.href = dataUrl;
                    link.click();
                    toast.success("Receipt image saved for sharing");
                  }
                } catch (err) {
                  toast.error("Sharing not supported or cancelled");
                }
              }}
            >
              <Share2 size={15} className="text-white shrink-0" />
              <span>{language === 'np' ? 'शेयर' : 'Share'}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
