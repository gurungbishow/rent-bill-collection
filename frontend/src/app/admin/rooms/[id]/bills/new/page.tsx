'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  Calculator, 
  Calendar, 
  AlertTriangle, 
  Download, 
  Share2, 
  Printer, 
  Zap, 
  Droplets, 
  Trash2, 
  Wifi, 
  Home,
  History,
  Pencil,
  CheckCircle2
} from 'lucide-react';
import { BsDatePicker } from '@/components/BsDatePicker';
import { toPng } from 'html-to-image';
import { useLanguage } from '@/context/LanguageContext';
import { getTodayBsDate, formatBsPeriod, bsToAd, parseBsDate, adToBs, formatBsDate } from '@/lib/bsDate';

const billSchema = z.object({
  bs_date: z.string().min(1, "Bill date is required"),
  water_bill: z.coerce.number().min(0),
  waste_bill: z.coerce.number().min(0),
  wifi_bill: z.coerce.number().min(0),
  wifi_enabled: z.boolean(),
  room_rent: z.coerce.number().min(0),
  prev_electric_unit: z.coerce.number().min(0),
  pres_electric_unit: z.coerce.number().min(0),
  electric_rate: z.coerce.number().min(0),
}).refine(data => data.pres_electric_unit >= data.prev_electric_unit, {
  message: "Present unit cannot be lower than previous unit",
  path: ["pres_electric_unit"]
});

type BillFormValues = z.infer<typeof billSchema>;

export default function NewBillPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, formatMoney, formatNumber, language } = useLanguage();

  const [generatedBill, setGeneratedBill] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [isMeterReset, setIsMeterReset] = useState(false);

  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState({
    room_name: '',
    is_active: true,
    enrollment_date: ''
  });

  const updateRoomMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/rooms/${roomId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(language === 'np' ? 'कोठा अद्यावधिक भयो' : 'Room updated successfully');
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      setIsEditRoomOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update room');
    }
  });

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data.data;
    }
  });

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['room-settings', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/settings`);
      return res.data.data;
    }
  });

  const { data: previousBillData } = useQuery({
    queryKey: ['room-bills-latest', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/bills`);
      const bills = res.data.data;
      if (bills && bills.length > 0) {
        return {
          hasBills: true,
          lastBsDate: bills[0].bill_date ? adToBs(bills[0].bill_date) : undefined,
          prevUnit: bills[0].pres_electric_unit,
          prevBalance: bills[0].remaining_balance
        };
      }
      return { hasBills: false, lastBsDate: null, prevUnit: 0, prevBalance: 0 };
    }
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<BillFormValues>({
    resolver: zodResolver(billSchema as any),
    defaultValues: {
      bs_date: getTodayBsDate(),
      wifi_enabled: true
    }
  });

  const [prorateDetails, setProrateDetails] = useState<{
    isProrated: boolean;
    days: number;
    baseRent: number;
    baseWater: number;
    baseWaste: number;
    baseWifi: number;
  } | null>(null);

  useEffect(() => {
    const suggestNextMonth1st = (bsDateStr: string) => {
      const parsed = parseBsDate(bsDateStr);
      if (parsed) {
        let nextM = parsed.month + 1;
        let nextY = parsed.year;
        if (nextM > 12) { nextM = 1; nextY++; }
        setValue('bs_date', `${nextY}-${nextM.toString().padStart(2, '0')}-01`);
      }
    };

    if (previousBillData?.hasBills && previousBillData?.lastBsDate) {
      const enrollmentBs = room?.enrollment_date ? adToBs(room.enrollment_date) : '';
      if (enrollmentBs && enrollmentBs > previousBillData.lastBsDate) {
        suggestNextMonth1st(enrollmentBs);
      } else {
        suggestNextMonth1st(previousBillData.lastBsDate);
      }
    } else if (room?.enrollment_date) {
      suggestNextMonth1st(adToBs(room.enrollment_date));
    }
  }, [previousBillData, room, setValue]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const formValues = watch() as any;
  const moveInBs = room?.enrollment_date ? adToBs(room.enrollment_date) : '';
  const minDate = previousBillData?.lastBsDate || moveInBs;

  useEffect(() => {
    if (settings && minDate && formValues.bs_date) {
      const startAd = bsToAd(minDate);
      const endAd = bsToAd(formValues.bs_date);
      
      let diffDays = 30; // default to 1 month
      let isExactMonth = true;
      if (startAd && endAd && startAd <= endAd) {
        const startBsParsed = parseBsDate(minDate);
        const endBsParsed = parseBsDate(formValues.bs_date);
        
        // Exact same day of month = calendar month calculation
        if (startBsParsed && endBsParsed && startBsParsed.day === endBsParsed.day) {
          let monthDiff = (endBsParsed.year - startBsParsed.year) * 12 + (endBsParsed.month - startBsParsed.month);
          if (monthDiff < 1) monthDiff = 1;
          diffDays = monthDiff * 30;
          isExactMonth = true;
        } else {
          // Calculate exact day difference
          const diffTime = Math.abs(endAd.getTime() - startAd.getTime());
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          isExactMonth = false;
        }
      }

      setProrateDetails({
        isProrated: !isExactMonth,
        days: diffDays,
        baseRent: Number(settings.default_room_rent),
        baseWater: Number(settings.default_water_bill),
        baseWaste: Number(settings.default_waste_bill),
        baseWifi: Number(settings.default_wifi_bill)
      });

      const calcValue = (rate: number, shouldProrate: boolean) => {
        if (isExactMonth) return rate;          // Full month: always charge full rate
        if (!shouldProrate) return rate;        // Partial month + prorate OFF: charge FULL rate (was 0!)
        return Math.round((rate / 30) * diffDays); // Partial month + prorate ON: proportional
      };

      setValue('room_rent', calcValue(settings.default_room_rent, settings.prorate_rent ?? true));
      setValue('water_bill', calcValue(settings.default_water_bill, settings.prorate_water ?? true));
      setValue('waste_bill', calcValue(settings.default_waste_bill, settings.prorate_waste ?? true));
      setValue('wifi_bill', calcValue(settings.default_wifi_bill, settings.prorate_wifi ?? true));
      
      setValue('wifi_enabled', settings.wifi_enabled);
      setValue('electric_rate', settings.default_electric_rate);
    }
  }, [settings, minDate, formValues.bs_date, setValue]);

  useEffect(() => {
    if (isMeterReset) {
      setValue('prev_electric_unit', settings?.starting_electric_unit ?? 0);
    } else if (previousBillData) {
      if (!previousBillData.hasBills && settings?.starting_electric_unit !== undefined) {
        setValue('prev_electric_unit', settings.starting_electric_unit);
      } else {
        setValue('prev_electric_unit', previousBillData.prevUnit);
      }
    }
  }, [isMeterReset, previousBillData, settings, setValue]);

  const prevUnit = Number(formValues.prev_electric_unit) || 0;
  const presUnit = Number(formValues.pres_electric_unit) || 0;
  const rate = Number(formValues.electric_rate) || 0;

  let electricity = 0;
  if (presUnit >= prevUnit) {
    electricity = (presUnit - prevUnit) * rate;
  }

  const wifi = formValues.wifi_enabled ? (Number(formValues.wifi_bill) || 0) : 0;
  const currentCharges =
    (Number(formValues.water_bill) || 0) +
    (Number(formValues.waste_bill) || 0) +
    wifi +
    (Number(formValues.room_rent) || 0) +
    electricity;

  const prevBalance = Number(previousBillData?.prevBalance) || 0;
  const grandTotal = currentCharges + prevBalance;

  const liveTotals = { electricity, currentCharges, grandTotal };

  const createMutation = useMutation({
    mutationFn: async (data: BillFormValues) => {
      const parsedBs = parseBsDate(data.bs_date);
      const payload = {
        ...data,
        bill_date: bsToAd(data.bs_date)?.toISOString() || new Date().toISOString(),
        billing_year: parsedBs?.year,
        billing_month: parsedBs?.month,
        prorate_details: prorateDetails?.isProrated ? prorateDetails : null,
        is_meter_reset: isMeterReset
      };
      // @ts-expect-error // payload cleanup; safe to ignore TypeScript error
      delete payload.bs_date;

      const res = await api.post(`/rooms/${roomId}/bills`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room-bills', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-bills-latest', roomId] });
      toast.success(t.bill_saved_success);
      setGeneratedBill(data.data);
      setIsReceiptOpen(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    }
  });

  if (loadingSettings) return <div className="p-6">{t.loading}</div>;

  const isMoveInDateMissing = room && !room.enrollment_date;
  const isDateInvalid = minDate && formValues.bs_date <= minDate;

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-28 md:pb-8 space-y-4 md:space-y-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push(`/admin/rooms/${roomId}`)} 
            className="h-9 w-9 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${room?.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                {room?.room_name}
              </h1>
              {room?.user && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md hidden sm:inline-block">
                  {room.user.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.generate_monthly_bill || 'Create and issue a new monthly bill'}
            </p>
          </div>
        </div>
      </div>

      {/* Informative Warning Banner when Move-in date is missing */}
      {isMoveInDateMissing && (
        <div className="p-3.5 sm:p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                {language === 'np' ? 'प्रवेश मिति (Move-in Date) तोकिएको छैन' : 'Move-in Date Not Set'}
              </p>
              <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {language === 'np' 
                  ? 'यस कोठाको बिल जारी गर्न पहिले कोठा सम्पादन गरी प्रवेश मिति राख्नुहोस्।' 
                  : 'Please set a Move-in Date in room settings before generating a bill.'}
              </p>
            </div>
          </div>
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={() => {
              setEditRoomForm({
                room_name: room?.room_name || '',
                is_active: room?.is_active ?? true,
                enrollment_date: getTodayBsDate()
              });
              setIsEditRoomOpen(true);
            }} 
            className="text-xs font-bold bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0 rounded-full"
          >
            {language === 'np' ? 'मिति राख्नुहोस्' : 'Set Move-in Date'}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-start">
        {/* Left 2 Columns: Input Form */}
        <div className={`md:col-span-2 space-y-4 md:space-y-5 ${isMoveInDateMissing ? 'opacity-60 pointer-events-none' : ''}`}>
          <form id="bill-form" onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 md:space-y-5">
            
            {/* Unified Billing Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <CardHeader className="p-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
                <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-slate-900 dark:text-slate-100 flex-shrink-0">
                  <div className="h-6 w-6 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Calendar size={13} />
                  </div>
                  <span>{t.generate_monthly_bill || 'Monthly Bill'}</span>
                </CardTitle>
                <span className={`text-[9px] sm:text-xs font-bold px-2.5 py-1 rounded-full border truncate ${
                  isMoveInDateMissing 
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' 
                    : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                }`}>
                  {isMoveInDateMissing ? (
                    language === 'np' ? 'प्रवेश मिति तोकिएको छैन' : 'Move-in Date Not Set'
                  ) : minDate ? (
                    language === 'np' 
                      ? `${formatBsDate(minDate, language)} देखि ${formatBsDate(formValues.bs_date, language)}`
                      : `${formatBsDate(minDate, language)} to ${formatBsDate(formValues.bs_date, language)}`
                  ) : (
                    formatBsPeriod(formValues.bs_date, language)
                  )}
                  {!isMoveInDateMissing && prorateDetails?.isProrated && ` (${prorateDetails.days}d)`}
                </span>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                {/* 1. Date Section */}
                <div className="space-y-1 max-w-sm">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    {t.date || 'Bill Date'}
                  </Label>
                  <BsDatePicker
                    value={formValues.bs_date}
                    onChange={(val) => {
                      setValue('bs_date', val, { shouldValidate: true });
                    }}
                    language={language as 'en' | 'np'}
                  />
                  {errors.bs_date && <p className="text-xs text-red-500">{errors.bs_date.message}</p>}
                  {isDateInvalid && !errors.bs_date && (
                    <div className="flex items-center justify-between gap-2 mt-1.5 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                      <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 font-medium">
                        <AlertTriangle size={12} className="flex-shrink-0" />
                        {language === 'np'
                          ? `मिति ${formatBsDate(minDate, language)} भन्दा पछि हुनुपर्छ`
                          : `Date must be after ${formatBsDate(minDate, language)}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Electricity Section */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Zap size={12} className="text-amber-500" />
                      {t.electricity || 'Electricity Reading'}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors select-none">
                      <input
                        type="checkbox"
                        checked={isMeterReset}
                        onChange={(e) => setIsMeterReset(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span>{language === 'np' ? 'मिटर रिसेट' : 'Meter Reset'}</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{t.prev_unit || 'Previous'}</Label>
                        {isMeterReset && (
                          <span className="text-[9px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200/80 dark:border-blue-800/60">
                            {language === 'np' ? 'सुरुवाती रिडिङ' : 'Starting Unit'}
                          </span>
                        )}
                      </div>
                      <Input 
                        type="number" 
                        readOnly 
                        className={`h-8 text-xs font-semibold rounded-md ${isMeterReset ? "bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800" : "bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed"}`} 
                        {...register('prev_electric_unit')} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{t.pres_unit || 'Current'}</Label>
                      <Input 
                        type="number" 
                        placeholder="0"
                        autoFocus
                        {...register('pres_electric_unit')} 
                        className={`h-8 text-xs font-semibold rounded-md ${errors.pres_electric_unit ? "border-red-500 ring-1 ring-red-500" : ""}`} 
                      />
                      {errors.pres_electric_unit && <p className="text-xs text-red-500">{errors.pres_electric_unit.message}</p>}
                    </div>
                  </div>
                  {Number(formValues.pres_electric_unit) < Number(formValues.prev_electric_unit) && (
                    <div className="flex items-center justify-between gap-2 mt-1.5 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                      <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 font-medium">
                        <AlertTriangle size={12} className="flex-shrink-0" />
                        {isMeterReset
                          ? (language === 'np'
                              ? 'हालको रिडिङ सुरुवाती रिडिङ भन्दा कम हुन सक्दैन'
                              : 'Present unit cannot be lower than starting unit')
                          : (language === 'np'
                              ? 'हालको रिडिङ अघिल्लो भन्दा कम छ। मिटर रिसेट चेक गर्नुहोस्।'
                              : 'Present unit is lower than previous. Please check Meter Reset.')}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Utility Charges Section */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2.5 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Home size={12} className="text-emerald-500" />
                    {t.room_defaults || 'Utility Charges'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {/* Water Bill */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Droplets size={10} className="text-blue-500" />
                        {t.water || 'Water'}
                      </Label>
                      <Input type="number" step="any" className="h-8 text-xs font-semibold rounded-md" {...register('water_bill')} />
                    </div>

                    {/* Waste Bill */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Trash2 size={10} className="text-slate-400" />
                        {t.waste || 'Waste'}
                      </Label>
                      <Input type="number" step="any" className="h-8 text-xs font-semibold rounded-md" {...register('waste_bill')} />
                    </div>
                  </div>
                </div>

                {/* Hidden Fields */}
                <div className="hidden">
                  <Input type="number" step="0.01" {...register('electric_rate')} />
                  <Input type="number" step="any" {...register('room_rent')} />
                  <Input type="number" step="any" {...register('wifi_bill')} />
                  <input type="checkbox" {...register('wifi_enabled')} className="hidden" />
                </div>
              </CardContent>
            </Card>

          </form>
        </div>

        {/* Right 1 Column: Live Calculation Summary */}
        <div className="md:col-span-1">
          <Card className="border border-slate-200/70 dark:border-slate-800/70 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden pb-0">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-3 px-4">
              <CardTitle className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Calculator size={13} />
                </div>
                <span>{t.current_total || 'Current Month Total'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pb-0 space-y-1.5 text-xs sm:text-sm">
              {/* Rent Line */}
              <div className="flex justify-between items-center py-0.5 border-b border-slate-50 dark:border-slate-800/40 pb-1.5">
                <div className="min-w-0 pr-2">
                  <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    <Home size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{t.rent || 'Room Rent'}</span>
                  </span>
                  {prorateDetails?.isProrated && settings?.prorate_rent && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block pl-4">
                      {formatMoney(prorateDetails.baseRent)} / 30 × {prorateDetails.days}d
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatMoney(formValues.room_rent || 0)}</span>
              </div>

              {/* Water Line */}
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100/70 dark:border-slate-800/40 pb-1.5">
                <div className="min-w-0 pr-2">
                  <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    <Droplets size={12} className="text-blue-500 flex-shrink-0" />
                    <span className="truncate">{t.water || 'Water Bill'}</span>
                  </span>
                  {prorateDetails?.isProrated && settings?.prorate_water && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block pl-4">
                      {formatMoney(prorateDetails.baseWater)} / 30 × {prorateDetails.days}d
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatMoney(formValues.water_bill || 0)}</span>
              </div>

              {/* Electricity Line */}
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100/70 dark:border-slate-800/40 pb-1.5">
                <div className="min-w-0 pr-2">
                  <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    <Zap size={12} className="text-amber-500 flex-shrink-0" />
                    <span className="truncate">{t.electricity || 'Electricity'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block pl-4">
                    {formatNumber(presUnit)} - {formatNumber(prevUnit)} = {formatNumber(Math.max(0, presUnit - prevUnit))} units × {formatMoney(rate)}
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatMoney(liveTotals.electricity)}</span>
              </div>

              {/* Waste Line */}
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100/70 dark:border-slate-800/40 pb-1.5">
                <div className="min-w-0 pr-2">
                  <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                    <Trash2 size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{t.waste || 'Waste Bill'}</span>
                  </span>
                  {prorateDetails?.isProrated && settings?.prorate_waste && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block pl-4">
                      {formatMoney(prorateDetails.baseWaste)} / 30 × {prorateDetails.days}d
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatMoney(formValues.waste_bill || 0)}</span>
              </div>

              {/* Internet Line */}
              {formValues.wifi_enabled && (
                <div className="flex justify-between items-center py-0.5 border-b border-slate-100/70 dark:border-slate-800/40 pb-1.5">
                  <div className="min-w-0 pr-2">
                    <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                      <Wifi size={12} className="text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{t.wifi || 'Internet Bill'}</span>
                    </span>
                    {prorateDetails?.isProrated && settings?.prorate_wifi && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block pl-4">
                        {formatMoney(prorateDetails.baseWifi)} / 30 × {prorateDetails.days}d
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatMoney(formValues.wifi_bill || 0)}</span>
                </div>
              )}

              {/* Subtotal & Prev Balance Shaded Footer Block */}
              <div className="bg-slate-50 dark:bg-slate-800/40 pt-3 flex flex-col -mx-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm px-3 pb-1.5">
                  <span>{t.current_total || 'Current Month Total'}</span>
                  <span className="font-bold">{formatMoney(liveTotals.currentCharges)}</span>
                </div>
                <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400 font-bold border-t border-slate-200/50 dark:border-slate-850/40 pt-1.5 pb-1.5 px-3">
                  <span>{t.prev_balance || 'Previous Dues'}</span>
                  <span>{formatMoney(previousBillData?.prevBalance || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm border-t border-blue-200/70 dark:border-blue-800/60 bg-blue-500/10 dark:bg-blue-500/20 py-2.5 px-3">
                  <span className="text-blue-700 dark:text-blue-300 font-bold">{t.grand_total || 'Grand Total'}</span>
                  <span className="text-blue-700 dark:text-blue-300 font-extrabold text-xs sm:text-sm">{formatMoney(liveTotals.grandTotal)}</span>
                </div>
              </div>
            </CardContent>

            {/* Edge-to-Edge Action Bar */}
            <CardFooter className="p-0 border-t border-blue-200/80 dark:border-blue-800/80 rounded-b-2xl overflow-hidden mt-0">
              <button
                type="submit"
                form="bill-form"
                className="w-full h-11 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none rounded-b-2xl"
                disabled={isSubmitting || (Number(formValues.pres_electric_unit) < Number(formValues.prev_electric_unit)) || isMoveInDateMissing || isDateInvalid}
              >
                {isSubmitting ? t.loading : (language === 'np' ? 'बिल जारी गर्नुहोस्' : 'Generate & Save Bill')}
              </button>
            </CardFooter>
          </Card>
        </div>

      </div>

      {/* Receipt Modal */}
      <Dialog open={isReceiptOpen} onOpenChange={(open) => {
        if (!open) {
          setIsReceiptOpen(false);
          router.push(`/admin/rooms/${roomId}`);
        }
      }}>
        <DialogContent className="max-w-[calc(100%-2.5rem)] sm:max-w-sm md:max-w-md bg-white border border-slate-200 p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div ref={receiptRef} className="bg-white text-slate-900 p-4 sm:p-5 flex flex-col gap-3">
            {/* Header info */}
            <div className="text-center pb-2.5 border-b border-slate-100">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{room?.room_name}</h2>
              {room?.user && (
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{room.user.name || room.user.username}</p>
              )}
              {generatedBill && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
                  <Calendar size={12} className="text-blue-500" />
                  <span>
                    {isMoveInDateMissing ? (
                      language === 'np' ? 'प्रवेश मिति तोकिएको छैन' : 'Move-in Date Not Set'
                    ) : minDate ? (
                      `${formatBsDate(minDate, language)} to ${formatBsDate(formValues.bs_date, language)}`
                    ) : (
                      formatBsPeriod(formValues.bs_date, language)
                    )}
                  </span>
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
                    
                    const prevDues = Number(generatedBill.previous_balance ?? generatedBill.remaining_balance ?? previousBillData?.prevBalance ?? 0);
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
          <div className="border-t border-slate-200/80 flex items-stretch h-11 bg-slate-50 divide-x divide-slate-200/80 rounded-b-2xl overflow-hidden">
            <button 
              type="button"
              className="flex-1 font-extrabold text-xs text-slate-700 bg-white hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer select-none rounded-bl-2xl" 
              onClick={async () => {
                if (!receiptRef.current) return;
                try {
                  const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
                  const link = document.createElement('a');
                  link.download = `bill-${room?.room_name || 'receipt'}.png`;
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
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    const file = new File([blob], `bill-${room?.room_name || 'receipt'}.png`, { type: blob.type });
                    await navigator.share({
                      title: 'Monthly Rent Bill',
                      text: `Here is the rent bill for ${room?.room_name}`,
                      files: [file]
                    });
                  } else {
                    const link = document.createElement('a');
                    link.download = `bill-${room?.room_name || 'receipt'}.png`;
                    link.href = dataUrl;
                    link.click();
                    toast.success("Image saved (Sharing not supported on this browser)");
                  }
                } catch (err: any) {
                  if (err.name !== 'AbortError') {
                    toast.error("Failed to share");
                  }
                }
              }}
            >
              <Share2 size={15} className="text-white shrink-0" />
              <span>{language === 'np' ? 'शेयर' : 'Share'}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Room Modal (In-context) */}
      <Dialog open={isEditRoomOpen} onOpenChange={setIsEditRoomOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[440px] rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50">
            <DialogTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <div className="h-6 w-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Pencil size={13} />
              </div>
              <span>{language === 'np' ? 'प्रवेश मिति मिलाउनुहोस्' : 'Set Move-in Date'}</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!editRoomForm.room_name.trim()) {
              toast.error(language === 'np' ? 'कृपया कोठाको नाम लेख्नुहोस्' : 'Room name is required');
              return;
            }
            updateRoomMutation.mutate({
              ...editRoomForm,
              enrollment_date: editRoomForm.enrollment_date ? bsToAd(editRoomForm.enrollment_date)?.toISOString() : null
            });
          }}>
            <div className="space-y-4 p-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <Label htmlFor="incontext-edit-room-name" className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Home size={12} className="text-blue-500" />
                  {t.room_name}
                </Label>
                <Input 
                  id="incontext-edit-room-name" 
                  value={editRoomForm.room_name} 
                  onChange={(e) => setEditRoomForm({...editRoomForm, room_name: e.target.value})} 
                  className="h-8.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="incontext-edit-enrollment-date" className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar size={12} className="text-blue-500" />
                    {t.enrollment_date}
                  </Label>
                  <Switch 
                    className="scale-75 origin-right" 
                    checked={!!editRoomForm.enrollment_date} 
                    onCheckedChange={(val) => setEditRoomForm({...editRoomForm, enrollment_date: val ? getTodayBsDate() : ''})} 
                  />
                </div>
                {!!editRoomForm.enrollment_date && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <BsDatePicker 
                      value={editRoomForm.enrollment_date}
                      onChange={(val) => setEditRoomForm({...editRoomForm, enrollment_date: val})}
                      language={language as 'en' | 'np'}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-1">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {language === 'np' ? 'सक्रिय स्थिति' : 'Active Status'}
                  </Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{language === 'np' ? 'यदि यो कोठा अब भाडामा छैन भने निष्क्रिय गर्नुहोस्।' : 'Deactivate if this room is no longer in use.'}</p>
                </div>
                <Switch 
                  checked={editRoomForm.is_active} 
                  onCheckedChange={(val) => setEditRoomForm({...editRoomForm, is_active: val})} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditRoomOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80">{t.cancel}</Button>
              <Button type="submit" disabled={updateRoomMutation.isPending} className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold">
                {updateRoomMutation.isPending ? t.loading : (t.save || 'Save Changes')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
