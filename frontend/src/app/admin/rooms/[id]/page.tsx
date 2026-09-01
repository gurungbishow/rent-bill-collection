'use client';

import { use, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Plus, Settings, User, Pencil, Trash2, Eye, AlertTriangle, Calendar, Info, Home, Droplets, Zap, Wifi, Calculator, History, CreditCard, Banknote, Receipt } from 'lucide-react';
import { BsDatePicker } from '@/components/BsDatePicker';
import { toast } from 'sonner';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { adToBs, bsToAd, formatBsPeriod, getTodayBsDate } from '@/lib/bsDate';

export default function RoomDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  const queryClient = useQueryClient();
  const { t, formatDate, formatMoney, formatNumber, language } = useLanguage();

  // Room Settings Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDefaultsOpen, setIsDefaultsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    room_name: '',
    enrollment_date: '',
    default_room_rent: 0,
    default_water_bill: 0,
    default_waste_bill: 0,
    default_wifi_bill: 0,
    wifi_enabled: false,
    starting_electric_unit: 0,
    default_electric_rate: 0,
    prorate_rent: true,
    prorate_water: true,
    prorate_waste: true,
    prorate_wifi: true
  });

  // Edit Bill Modal state
  const [isEditBillOpen, setIsEditBillOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<any | null>(null);
  const [editBillForm, setEditBillForm] = useState({
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

  // Delete Bill state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingBill, setDeletingBill] = useState<any | null>(null);

  const { data: room, isLoading: loadingRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data.data;
    }
  });

  const handleOpenSettings = () => {
    if (room) {
      setSettingsForm({
        room_name: room.room_name || '',
        enrollment_date: room.enrollment_date ? adToBs(room.enrollment_date) : '',
        default_room_rent: room.settings?.default_room_rent || 0,
        default_water_bill: room.settings?.default_water_bill || 0,
        default_waste_bill: room.settings?.default_waste_bill || 0,
        default_wifi_bill: room.settings?.default_wifi_bill || 0,
        wifi_enabled: !!room.settings?.wifi_enabled,
        starting_electric_unit: room.settings?.starting_electric_unit || 0,
        default_electric_rate: room.settings?.default_electric_rate || 0,
        prorate_rent: room.settings?.prorate_rent ?? true,
        prorate_water: room.settings?.prorate_water ?? true,
        prorate_waste: room.settings?.prorate_waste ?? true,
        prorate_wifi: room.settings?.prorate_wifi ?? true
      });
    }
    setIsSettingsOpen(true);
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.put(`/rooms/${roomId}/settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(t.room_updated_success);
      setIsSettingsOpen(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update settings';
      toast.error(msg);
    }
  });

  const { data: bills, isLoading: loadingBills } = useQuery({
    queryKey: ['room-bills', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/bills`);
      return res.data.data;
    }
  });

  const handleOpenEditBill = (bill: any) => {
    setEditingBill(bill);
    setEditBillForm({
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
    setIsEditBillOpen(true);
  };

  const updateBillMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.put(`/bills/${editingBill.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-bills', roomId] });
      queryClient.invalidateQueries({ queryKey: ['bill', editingBill?.id] });
      toast.success(t.bill_updated_success);
      setIsEditBillOpen(false);
      setEditingBill(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update bill';
      toast.error(msg);
    }
  });

  const handleDeletePrompt = (bill: any) => {
    setDeletingBill(bill);
    setIsDeleteOpen(true);
  };

  const deleteBillMutation = useMutation({
    mutationFn: async (billId: string) => {
      await api.delete(`/bills/${billId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-bills', roomId] });
      toast.success(t.bill_deleted_success);
      setIsDeleteOpen(false);
      setDeletingBill(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete bill';
      toast.error(msg);
    }
  });

  const getStatusBadge = (status: string, isLatest: boolean = true) => {
    if (status === 'UNPAID' && !isLatest) {
      return (
        <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 tracking-wider">
          {t.forwarded}
        </span>
      );
    }
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 tracking-wider">
            {t.paid}
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 tracking-wider">
            {t.partial}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-800/60 tracking-wider">
            {t.unpaid}
          </span>
        );
    }
  };

  // Live calculations for Edit Bill Modal
  const editElectricUnits = Math.max(0, editBillForm.pres_electric_unit - editBillForm.prev_electric_unit);
  const editElectricBill = editElectricUnits * editBillForm.electric_rate;
  const editCurrentMonthTotal = Number(editBillForm.water_bill || 0) +
    Number(editBillForm.waste_bill || 0) +
    (editBillForm.wifi_enabled ? Number(editBillForm.wifi_bill || 0) : 0) +
    Number(editBillForm.room_rent || 0) +
    editElectricBill;
  const editGrandTotal = editCurrentMonthTotal + Number(editBillForm.previous_balance || 0);

  if (loadingRoom) return <div className="p-6"><Skeleton className="h-10 w-48" /></div>;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 w-full">
          <Link href="/admin/rooms" className="hidden md:block">
            <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"><ChevronLeft size={20} /></Button>
          </Link>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">{room?.room_name}</h1>
              <Badge 
                variant={room?.is_active ? "default" : "secondary"} 
                className={room?.is_active ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-[10px] sm:text-xs" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs"}
              >
                {room?.is_active ? (language === 'np' ? 'सक्रिय' : 'Active') : (language === 'np' ? 'निष्क्रिय' : 'Inactive')}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1 w-full">
              <span className="flex items-center gap-1 shrink-0">
                <User size={13} />
                <span className="truncate">{room?.user ? room.user.name : (language === 'np' ? 'तोकिएको छैन' : 'No user assigned')}</span>
              </span>
              {room?.enrollment_date && (
                <span className="flex items-center gap-1 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/40 sm:bg-blue-50 sm:dark:bg-blue-950/60 px-1.5 py-0.5 rounded font-medium text-[10px] sm:text-xs ml-2 shrink-0">
                  <Calendar size={11} />
                  {t.enrollment_date}: {formatDate(room.enrollment_date)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-full border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <Link href={`/admin/rooms/${roomId}/bills/new`} className="flex-1 sm:flex-none min-w-0">
            <Button
              variant="ghost"
              className="w-full h-8.5 px-3 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full transition-colors"
            >
              <Plus size={15} className="shrink-0 mr-1.5 text-blue-500" />
              <span className="truncate">{t.generate_bill}</span>
            </Button>
          </Link>

          <div className="h-4 w-[1px] bg-slate-200/80 dark:bg-slate-800 shrink-0" />

          <Button 
            variant="ghost" 
            className="flex-1 sm:flex-none min-w-0 h-8.5 px-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            onClick={() => setIsDefaultsOpen(true)}
          >
            <Info size={15} className="shrink-0 mr-1.5 text-indigo-500" />
            <span className="truncate">{t.room_defaults}</span>
          </Button>

          <div className="h-4 w-[1px] bg-slate-200/80 dark:bg-slate-800 shrink-0" />

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger render={
              <Button variant="ghost" size="icon" title={t.room_settings} onClick={handleOpenSettings} className="h-8.5 w-8.5 shrink-0 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Settings size={15} />
              </Button>
            } />
            <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[440px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
              <DialogHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50">
                <DialogTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Settings size={13} />
                  </div>
                  <span>{t.room_settings}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 p-4 text-xs sm:text-sm">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <User size={12} className="text-blue-500" />
                    {t.room_name}
                  </Label>
                  <Input 
                    type="text" 
                    className="h-8.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-xl"
                    placeholder={t.room_name_placeholder} 
                    value={settingsForm.room_name} 
                    autoComplete="off"
                    onChange={(e) => setSettingsForm({...settingsForm, room_name: e.target.value})} 
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Calendar size={12} className="text-blue-500" />
                      {t.enrollment_date}
                    </Label>
                    <Switch 
                      className="scale-75 origin-right" 
                      checked={!!settingsForm.enrollment_date}
                      onCheckedChange={(val) => setSettingsForm({...settingsForm, enrollment_date: val ? getTodayBsDate() : ''})} 
                    />
                  </div>
                  {!!settingsForm.enrollment_date && (
                    <BsDatePicker 
                      value={settingsForm.enrollment_date} 
                      onChange={(val) => setSettingsForm({...settingsForm, enrollment_date: val})} 
                      language={language as 'en' | 'np'}
                    />
                  )}
                </div>

                <div className="col-span-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Home size={12} className="text-emerald-500" />
                      {t.rent}
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{language === 'np' ? 'दिनको' : 'Prorate'}</span>
                      <Switch className="scale-50 origin-right" checked={settingsForm.prorate_rent} onCheckedChange={(val) => setSettingsForm({...settingsForm, prorate_rent: val})} />
                    </div>
                  </div>
                  <Input type="number" className="h-8.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-xl" autoComplete="off" value={settingsForm.default_room_rent} onChange={(e) => setSettingsForm({...settingsForm, default_room_rent: e.target.value === '' ? '' as any : Number(e.target.value) })} />
                </div>

                <div className="col-span-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Droplets size={12} className="text-blue-500" />
                      {t.water}
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{language === 'np' ? 'दिनको' : 'Prorate'}</span>
                      <Switch className="scale-50 origin-right" checked={settingsForm.prorate_water} onCheckedChange={(val) => setSettingsForm({...settingsForm, prorate_water: val})} />
                    </div>
                  </div>
                  <Input type="number" className="h-8.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-xl" autoComplete="off" value={settingsForm.default_water_bill} onChange={(e) => setSettingsForm({...settingsForm, default_water_bill: e.target.value === '' ? '' as any : Number(e.target.value) })} />
                </div>

                <div className="col-span-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Trash2 size={12} className="text-rose-500" />
                      {t.waste}
                    </Label>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{language === 'np' ? 'दिनको' : 'Prorate'}</span>
                      <Switch className="scale-50 origin-right" checked={settingsForm.prorate_waste} onCheckedChange={(val) => setSettingsForm({...settingsForm, prorate_waste: val})} />
                    </div>
                  </div>
                  <Input type="number" className="h-8.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-xl" autoComplete="off" value={settingsForm.default_waste_bill} onChange={(e) => setSettingsForm({...settingsForm, default_waste_bill: e.target.value === '' ? '' as any : Number(e.target.value) })} />
                </div>

                <div className="col-span-1 space-y-1">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Zap size={12} className="text-amber-500" />
                    {t.rate_per_unit}
                  </Label>
                  <Input type="number" className="h-8.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-xl" step="0.01" autoComplete="off" value={settingsForm.default_electric_rate} onChange={(e) => setSettingsForm({...settingsForm, default_electric_rate: e.target.value === '' ? '' as any : Number(e.target.value) })} />
                </div>

                <div className="col-span-1 space-y-1">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Zap size={12} className="text-amber-500" />
                    {t.starting_electric_unit}
                  </Label>
                  <Input type="number" className="h-8.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-xl" autoComplete="off" value={settingsForm.starting_electric_unit} onChange={(e) => setSettingsForm({...settingsForm, starting_electric_unit: e.target.value === '' ? '' as any : Number(e.target.value) })} />
                </div>
                
                <div className="col-span-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 cursor-pointer" onClick={() => setSettingsForm({...settingsForm, wifi_enabled: !settingsForm.wifi_enabled})}>
                      <Wifi size={12} className="text-violet-500" />
                      {t.wifi}
                    </Label>
                    <Switch className="scale-75 origin-right" checked={settingsForm.wifi_enabled} onCheckedChange={(val) => setSettingsForm({...settingsForm, wifi_enabled: val})} />
                  </div>
                  {settingsForm.wifi_enabled && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-1">
                      <div className="flex items-center justify-end gap-1 mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{language === 'np' ? 'दिनको' : 'Prorate'}</span>
                        <Switch className="scale-50 origin-right" checked={settingsForm.prorate_wifi} onCheckedChange={(val) => setSettingsForm({...settingsForm, prorate_wifi: val})} />
                      </div>
                      <Input type="number" className="h-8.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-xl" autoComplete="off" value={settingsForm.default_wifi_bill} onChange={(e) => setSettingsForm({...settingsForm, default_wifi_bill: e.target.value === '' ? '' as any : Number(e.target.value) })} />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                >
                  {t.cancel}
                </Button>
                <Button 
                  type="button" 
                  onClick={() => updateSettingsMutation.mutate({
                    ...settingsForm,
                    enrollment_date: settingsForm.enrollment_date ? bsToAd(settingsForm.enrollment_date)?.toISOString() : null
                  })} 
                  disabled={updateSettingsMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold"
                >
                  {updateSettingsMutation.isPending ? t.loading : (language === 'np' ? 'परिवर्तनहरू बचत गर्नुहोस्' : 'Save Changes')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Room Defaults Modal */}
      <Dialog open={isDefaultsOpen} onOpenChange={setIsDefaultsOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[380px] rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50">
            <DialogTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Info size={14} />
              </div>
              <span>{t.room_defaults}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 p-4 text-xs sm:text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Calendar size={12} className="text-blue-500" />
                {t.enrollment_date}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">{room?.enrollment_date ? formatDate(room.enrollment_date) : '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Home size={12} className="text-emerald-500" />
                {t.rent}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatMoney(room?.settings?.default_room_rent || 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Droplets size={12} className="text-blue-500" />
                {t.water}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatMoney(room?.settings?.default_water_bill || 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Trash2 size={12} className="text-rose-500" />
                {t.waste}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatMoney(room?.settings?.default_waste_bill || 0)}</span>
            </div>
            {room?.settings?.wifi_enabled && (
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 items-center">
                <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                  <Wifi size={12} className="text-violet-500" />
                  {t.wifi}
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatMoney(room?.settings?.default_wifi_bill || 0)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 items-center">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Zap size={12} className="text-amber-500" />
                {t.rate_per_unit}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatMoney(room?.settings?.default_electric_rate || 0)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDefaultsOpen(false)} className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80">{language === 'np' ? 'बन्द गर्नुहोस्' : 'Close'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-width Billing History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{t.billing_history}</h2>
        
        {loadingBills ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : bills?.length === 0 ? (
          <div className="py-8 sm:py-10 px-4 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
              <Receipt size={18} />
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              {t.no_bills_found}
            </p>
          </div>
        ) : (
          <>
          <Card className="hidden md:block border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <TableRow>
                  <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.date}</TableHead>
                  <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.rent}</TableHead>
                  <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.water}</TableHead>
                  <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.waste}</TableHead>
                  <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.wifi}</TableHead>
                  <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.pres_unit}</TableHead>
                  <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.electricity}</TableHead>
                  <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">{t.current_total}</TableHead>
                  <TableHead className="text-center font-bold text-amber-700 dark:text-amber-400">{t.prev_balance}</TableHead>
                  <TableHead className="text-center font-bold text-slate-900 dark:text-slate-100">{t.grand_total}</TableHead>
                  <TableHead className="text-center font-bold text-emerald-600 dark:text-emerald-400">{t.amount_paid}</TableHead>
                  <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.status}</TableHead>
                  <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills?.map((bill: any, index: number) => (
                  <TableRow key={bill.id} className="text-center hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                    <TableCell className="text-center font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                      {formatDate(bill.bill_date)}
                    </TableCell>
                    <TableCell className="text-center">{formatMoney(bill.room_rent)}</TableCell>
                    <TableCell className="text-center">{formatMoney(bill.water_bill)}</TableCell>
                    <TableCell className="text-center">{formatMoney(bill.waste_bill)}</TableCell>
                    <TableCell className="text-center">{formatMoney(bill.wifi_bill)}</TableCell>
                    <TableCell className="text-center font-medium text-slate-800 dark:text-slate-200">{formatNumber(bill.pres_electric_unit)}</TableCell>
                    <TableCell className="text-center">{formatMoney(bill.electric_bill)}</TableCell>
                    <TableCell className="text-center font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatMoney(bill.current_month_total)}</TableCell>
                    <TableCell className="text-center text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap">{formatMoney(bill.previous_balance)}</TableCell>
                    <TableCell className="text-center font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{formatMoney(bill.grand_total)}</TableCell>
                    <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">{formatMoney(bill.amount_paid)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(bill.status, index === 0)}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/admin/bills/${bill.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50" title={t.view}>
                            <Eye size={16} />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50" 
                          title={t.edit}
                          onClick={() => handleOpenEditBill(bill)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50" 
                          title={t.delete}
                          onClick={() => handleDeletePrompt(bill)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          
          <div className="md:hidden space-y-3">
            {bills?.map((bill: any, index: number) => (
              <div
                key={bill.id}
                className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col
                  ${bill.status === 'PAID'
                    ? 'border-l-4 border-l-emerald-500 dark:border-l-emerald-500 border-slate-200/80 dark:border-slate-800/80'
                    : bill.status === 'PARTIAL'
                    ? 'border-l-4 border-l-amber-500 dark:border-l-amber-500 border-slate-200/80 dark:border-slate-800/80'
                    : 'border-l-4 border-l-red-500 dark:border-l-red-500 border-slate-200/80 dark:border-slate-800/80'
                  }`}
              >
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">{formatDate(bill.bill_date)}</span>
                  {getStatusBadge(bill.status, index === 0)}
                </div>

                {/* Fields Grid */}
                <div className="px-4 py-3 grid grid-cols-3 gap-x-3 gap-y-3">
                  {/* Row 1 */}
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Home size={11} className="text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{t.rent}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(bill.room_rent)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Droplets size={11} className="text-blue-500 flex-shrink-0" />
                      <span className="truncate">{t.water}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(bill.water_bill)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Zap size={11} className="text-amber-500 flex-shrink-0" />
                      <span className="truncate">{language === 'np' ? 'मिटर रिडिङ' : 'Meter'}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{bill.pres_electric_unit || 0}</div>
                  </div>
                  {/* Row 2 */}
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Wifi size={11} className="text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{t.wifi}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(bill.wifi_bill)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Trash2 size={11} className="text-rose-500 flex-shrink-0" />
                      <span className="truncate">{t.waste}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(bill.waste_bill)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Zap size={11} className="text-amber-500 flex-shrink-0" />
                      <span className="truncate">{t.electricity}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(bill.electric_bill)}</div>
                  </div>
                </div>

                {/* Totals Row */}
                <div className="px-4 py-2.5 grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-800/20">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Calculator size={11} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{t.current_total}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{formatMoney(Number(bill.grand_total) - Number(bill.previous_balance || 0))}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <History size={11} className="text-amber-500 flex-shrink-0" />
                      <span className="truncate">{t.prev_balance}</span>
                    </div>
                    <div className="font-semibold text-xs text-amber-600 dark:text-amber-400 mt-0.5">{formatMoney(bill.previous_balance || 0)}</div>
                  </div>
                </div>

                {/* Grand Total + Amount Paid */}
                <div className="px-4 py-2.5 grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-700/60">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <CreditCard size={11} className="text-blue-500 flex-shrink-0" />
                      <span className="truncate">{t.grand_total}</span>
                    </div>
                    <div className="font-extrabold text-sm text-blue-600 dark:text-blue-400 mt-0.5">{formatMoney(bill.grand_total)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Banknote size={11} className="text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{t.amount_paid}</span>
                    </div>
                    <div className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(bill.amount_paid)}</div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200/80 dark:border-slate-800 flex items-stretch h-11 bg-slate-50/50 dark:bg-slate-900/50 divide-x divide-slate-200/80 dark:divide-slate-800 rounded-b-2xl overflow-hidden mt-auto">
                  <Link href={`/admin/bills/${bill.id}`} className="flex-1 flex items-stretch">
                    <button className="w-full h-full text-[11px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 active:bg-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer select-none rounded-bl-2xl">
                      <Eye size={13} /> {t.view}
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDeletePrompt(bill)}
                    className="flex-1 h-full text-[11px] font-extrabold text-red-700 dark:text-red-300 bg-red-50/70 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 active:bg-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer select-none rounded-br-2xl"
                  >
                    <Trash2 size={13} /> {t.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Edit Bill Dialog */}
      <Dialog open={isEditBillOpen} onOpenChange={setIsEditBillOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t.edit} - {editingBill ? formatDate(editingBill.bill_date) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
                <Label className="text-xs">{t.date}</Label>
                <BsDatePicker 
                  value={editBillForm.bs_date} 
                  onChange={(val) => setEditBillForm({...editBillForm, bs_date: val})} 
                  language={language as 'en' | 'np'}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{t.rent}</Label>
                <Input 
                  type="number" 
                  value={editBillForm.room_rent} 
                  onChange={(e) => setEditBillForm({...editBillForm, room_rent: e.target.value === '' ? '' as any : Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t.water}</Label>
                <Input 
                  type="number" 
                  value={editBillForm.water_bill} 
                  onChange={(e) => setEditBillForm({...editBillForm, water_bill: e.target.value === '' ? '' as any : Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t.waste}</Label>
                <Input 
                  type="number" 
                  value={editBillForm.waste_bill} 
                  onChange={(e) => setEditBillForm({...editBillForm, waste_bill: e.target.value === '' ? '' as any : Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs">{t.wifi}</Label>
                  <Switch 
                    checked={editBillForm.wifi_enabled} 
                    onCheckedChange={(val) => setEditBillForm({...editBillForm, wifi_enabled: val})} 
                  />
                </div>
                <Input 
                  type="number" 
                  disabled={!editBillForm.wifi_enabled}
                  value={editBillForm.wifi_bill} 
                  onChange={(e) => setEditBillForm({...editBillForm, wifi_bill: e.target.value === '' ? '' as any : Number(e.target.value)})} 
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t.electricity}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500 dark:text-slate-400">{t.prev_unit}</Label>
                  <Input 
                    type="number" 
                    value={editBillForm.prev_electric_unit} 
                    onChange={(e) => setEditBillForm({...editBillForm, prev_electric_unit: e.target.value === '' ? '' as any : Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500 dark:text-slate-400">{t.pres_unit}</Label>
                  <Input 
                    type="number" 
                    value={editBillForm.pres_electric_unit} 
                    onChange={(e) => setEditBillForm({...editBillForm, pres_electric_unit: e.target.value === '' ? '' as any : Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500 dark:text-slate-400">{t.rate_per_unit}</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={editBillForm.electric_rate} 
                    onChange={(e) => setEditBillForm({...editBillForm, electric_rate: e.target.value === '' ? '' as any : Number(e.target.value)})} 
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                <span>{t.units_used}: <strong className="text-slate-900 dark:text-slate-100">{formatNumber(editElectricUnits)}</strong></span>
                <span>{t.electricity}: <strong className="text-slate-900 dark:text-slate-100">{formatMoney(editElectricBill)}</strong></span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-amber-700 dark:text-amber-400 font-medium">{t.prev_balance}</Label>
              <Input 
                type="number" 
                value={editBillForm.previous_balance} 
                onChange={(e) => setEditBillForm({...editBillForm, previous_balance: e.target.value === '' ? '' as any : Number(e.target.value)})} 
              />
            </div>

            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg space-y-1 text-xs border border-blue-100 dark:border-blue-900/40">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.current_total}:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(editCurrentMonthTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-slate-100 font-bold text-sm pt-1 border-t border-blue-200 dark:border-blue-900">
                <span>{t.grand_total}:</span>
                <span className="text-blue-700 dark:text-blue-400">{formatMoney(editGrandTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditBillOpen(false)}
              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
            >
              {t.cancel}
            </Button>
            <Button 
              type="button"
              onClick={() => {
                if (editBillForm.pres_electric_unit < editBillForm.prev_electric_unit) {
                  toast.error(language === 'np' ? 'अहिलेको युनिट पहिलेको भन्दा कम हुनु हुँदैन' : 'Present unit cannot be less than previous unit');
                  return;
                }
                const payload = {
                  ...editBillForm,
                  bill_date: editBillForm.bs_date ? bsToAd(editBillForm.bs_date)?.toISOString() : undefined
                };
                // @ts-ignore
                delete payload.bs_date;
                updateBillMutation.mutate(payload);
              }}
              disabled={updateBillMutation.isPending}
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold"
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
            <DialogTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle size={18} />
              <span>{t.delete_bill}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2.5">
            <p>
              {language === 'np' ? 'के तपाईं ' : 'Are you sure you want to delete the bill for '}
              <strong className="text-slate-900 dark:text-slate-100">
                {deletingBill ? formatDate(deletingBill.bill_date) : ''}
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
              onClick={() => deletingBill && deleteBillMutation.mutate(deletingBill.id)}
              disabled={deleteBillMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold"
            >
              {deleteBillMutation.isPending ? t.loading : t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
