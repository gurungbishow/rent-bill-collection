'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

import { useRouter } from 'next/navigation';
import { Plus, User, MoreVertical, Eye, Receipt, Pencil, Trash2, AlertTriangle, Calendar, Home, ChevronRight, Search, X, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { BsDatePicker } from '@/components/BsDatePicker';
import { useLanguage } from '@/context/LanguageContext';
import { getTodayBsDate, bsToAd, adToBs } from '@/lib/bsDate';

export default function AdminRoomsPage() {
  const queryClient = useQueryClient();
  const { t, formatDate, formatMoney, language } = useLanguage();
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newEnrollmentDate, setNewEnrollmentDate] = useState(getTodayBsDate());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OCCUPIED' | 'VACANT'>('ALL');

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    room_name: '',
    enrollment_date: '',
    is_active: true
  });

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<any>(null);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data.data;
    }
  });

  const totalCount = rooms?.length || 0;
  const occupiedCount = rooms?.filter((r: any) => !!r.user)?.length || 0;
  const vacantCount = totalCount - occupiedCount;

  const filteredRooms = rooms?.filter((room: any) => {
    const matchesSearch = !searchQuery.trim() || 
      room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (room.user?.name && room.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (statusFilter === 'OCCUPIED') return !!room.user;
    if (statusFilter === 'VACANT') return !room.user;
    return true;
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: { room_name: string; enrollment_date: string }) => {
      const res = await api.post('/rooms', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(t.room_saved_success);
      setIsAddOpen(false);
      setNewRoomName('');
      setNewEnrollmentDate(getTodayBsDate());
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create room';
      toast.error(msg);
    }
  });

  const updateRoomMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/rooms/${editingRoom?.id}`, {
        room_name: data.room_name,
        is_active: data.is_active,
        enrollment_date: data.enrollment_date ? bsToAd(data.enrollment_date)?.toISOString() : null
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(language === 'np' ? 'कोठा अद्यावधिक भयो' : 'Room updated successfully');
      setIsEditOpen(false);
      setEditingRoom(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update room';
      toast.error(msg);
    }
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/rooms/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(language === 'np' ? 'कोठा हटाइयो' : 'Room deleted successfully');
      setIsDeleteOpen(false);
      setDeletingRoom(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete room';
      toast.error(msg);
    }
  });

  const openEdit = (room: any) => {
    setEditingRoom(room);
    
    let bsDate = '';
    if (room.enrollment_date) {
      try {
        const dateObj = new Date(room.enrollment_date);
        bsDate = adToBs(dateObj.toISOString().split('T')[0]);
      } catch (e) {
        bsDate = getTodayBsDate();
      }
    }

    setEditForm({
      room_name: room.room_name,
      enrollment_date: bsDate,
      is_active: room.is_active
    });
    setIsEditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-4 md:p-6 space-y-3 md:space-y-5 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 pb-24">
      {/* ── HEADER ROW ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t.rooms}</h1>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{totalCount} {language === 'np' ? 'कुल' : 'Total'}</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />{occupiedCount} {language === 'np' ? 'भरिएको' : 'Occupied'}</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{vacantCount} {language === 'np' ? 'खाली' : 'Vacant'}</span>
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button
              className="h-9 px-3.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 rounded-full transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus size={15} className="mr-1" />
              <span>{language === 'np' ? 'कोठा थप्नुहोस्' : 'Add Room'}</span>
            </Button>
          } />
          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[460px] rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
            <DialogHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50">
              <DialogTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Plus size={14} />
                </div>
                <span>{t.add_room}</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newRoomName.trim()) {
                toast.error(language === 'np' ? 'कृपया कोठाको नाम लेख्नुहोस्' : 'Room name is required');
                return;
              }
              createRoomMutation.mutate({
                room_name: newRoomName.trim(),
                enrollment_date: bsToAd(newEnrollmentDate)?.toISOString() || new Date().toISOString()
              });
            }} className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="room_name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{t.room_name} <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">{language === 'np' ? 'उदा: 101, Room A' : 'e.g. 101, Room A'}</span>
                </Label>
                <Input
                  id="room_name"
                  placeholder={language === 'np' ? 'कोठाको नाम प्रविष्टि गर्नुहोस्' : 'Enter room name'}
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enrollment_date" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'np' ? 'दर्ता / भर्ना मिति (नेपाली वि.सं.)' : 'Enrollment / Move-in Date (B.S.)'}
                </Label>
                <BsDatePicker
                  value={newEnrollmentDate}
                  onChange={setNewEnrollmentDate}
                  language={language as 'en' | 'np'}
                />
                <p className="text-[10px] text-slate-400">
                  {language === 'np' ? 'ऐच्छिक: पछिको प्रोरसन हिसाबको लागि प्रयोग गरिन्छ' : 'Optional: Used for prorated rent calculation'}
                </p>
              </div>

              {/* Edge-to-Edge Modal Action Footer */}
              <div className="border-t border-slate-200/80 dark:border-slate-800 flex items-stretch h-11 bg-slate-50/50 dark:bg-slate-900/50 -mx-4 -mb-4 mt-2 divide-x divide-slate-200/80 dark:divide-slate-800 rounded-b-2xl overflow-hidden select-none">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 h-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer outline-none"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createRoomMutation.isPending || !newRoomName.trim()}
                  className="flex-1 h-full text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none"
                >
                  {createRoomMutation.isPending ? t.loading : (language === 'np' ? 'कोठा सिर्जना गर्नुहोस्' : 'Create Room')}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── STICKY SEARCH & FILTER BAR ── */}
      <div className="sticky top-0 z-20 -mx-3.5 sm:-mx-4 md:-mx-6 px-3.5 sm:px-4 md:px-6 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-800/40">
        <div className="flex flex-col gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'np' ? 'कोठा वा बहालदार खोज्नुहोस्...' : 'Search room or tenant...'}
              className="h-8.5 text-xs pl-9 pr-8 bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-1 rounded-full border border-slate-200/80 dark:border-slate-800/80 shadow-sm w-full justify-between">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 px-3 py-1 rounded-full text-xs font-bold transition-all text-center whitespace-nowrap active:scale-95 ${
                  statusFilter === 'ALL'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {language === 'np' ? 'सबै' : 'All'} ({totalCount})
              </button>

              <div className="h-3.5 w-[1px] bg-slate-200/80 dark:bg-slate-800 shrink-0" />

              <button
                onClick={() => setStatusFilter('OCCUPIED')}
                className={`flex-1 px-3 py-1 rounded-full text-xs font-bold transition-all text-center whitespace-nowrap active:scale-95 ${
                  statusFilter === 'OCCUPIED'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {language === 'np' ? 'बहालमा' : 'Occupied'} ({occupiedCount})
              </button>

              <div className="h-3.5 w-[1px] bg-slate-200/80 dark:bg-slate-800 shrink-0" />

              <button
                onClick={() => setStatusFilter('VACANT')}
                className={`flex-1 px-3 py-1 rounded-full text-xs font-bold transition-all text-center whitespace-nowrap active:scale-95 ${
                  statusFilter === 'VACANT'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {language === 'np' ? 'खाली' : 'Vacant'} ({vacantCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROOM CARDS: 2-col mobile / 3-col desktop ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        {filteredRooms?.length === 0 && (
          <div className="col-span-full py-12 sm:py-16 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-400">
              <Home size={22} />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium">
              {searchQuery ? (language === 'np' ? 'कुनै कोठा फेला परेन' : 'No matching rooms found') : t.no_rooms_found}
            </p>
          </div>
        )}

        {filteredRooms?.map((room: any) => {
          const accents = [
            { icon: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' },
            { icon: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
            { icon: 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' },
            { icon: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' },
            { icon: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' },
            { icon: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' },
          ];
          const idNum = typeof room.id === 'number' ? room.id : String(room.id).split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
          const a = accents[idNum % accents.length];

          return (
            <div
              key={room.id}
              className="group"
            >
              {/* ── CARD WITH ACTIVE/INACTIVE RIBBON ── */}
              <div className={`flex flex-col h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 border-l-[4px] ${
                room.is_active
                  ? 'border-l-emerald-500 dark:border-l-emerald-500'
                  : 'border-l-slate-300 dark:border-l-slate-600 opacity-80'
              } shadow-xs group-hover:shadow-md group-hover:border-slate-300 dark:group-hover:border-slate-700 group-hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 overflow-hidden`}>

                {/* Header */}
                <div className="px-3.5 pt-3.5 pb-2 sm:px-4 sm:pt-4 sm:pb-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-8 w-8 rounded-xl ${a.icon} flex items-center justify-center flex-shrink-0`}>
                      <Home size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight truncate">{room.room_name}</h3>
                        {!room.is_active && (
                          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                            {language === 'np' ? 'निष्क्रिय' : 'Inactive'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg focus:ring-0 focus:outline-none shadow-none border-none" />}>
                        <MoreVertical size={14} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 z-50 p-1.5 rounded-xl border-slate-200/80 dark:border-slate-800 shadow-lg">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setEditForm({ room_name: room.room_name, is_active: room.is_active, enrollment_date: room.enrollment_date ? adToBs(room.enrollment_date) : getTodayBsDate() }); setIsEditOpen(true); }} className="cursor-pointer gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 py-2.5 rounded-lg focus:bg-amber-50 focus:text-amber-700 dark:focus:bg-amber-900/30 dark:focus:text-amber-300 transition-colors">
                          <Pencil size={14} className="text-amber-500" />{t.edit || 'Edit'}
                        </DropdownMenuItem>
                        <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80 my-1 mx-2" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeletingRoom(room); setIsDeleteOpen(true); }} className="cursor-pointer gap-2.5 text-xs font-semibold text-red-600 dark:text-red-500 py-2.5 rounded-lg focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/30 dark:focus:text-red-400 transition-colors">
                          <Trash2 size={14} />{t.delete || 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Body */}
                <div className="px-3.5 pb-3 sm:px-4 sm:pb-3.5 flex flex-col gap-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {room.user ? (
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80">
                        <div className="h-4.5 w-4.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                          {room.user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate max-w-[90px]">
                          {room.user.name}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        {language === 'np' ? 'खाली' : 'Vacant'}
                      </div>
                    )}
                    {room.enrollment_date && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/70">
                        <Calendar size={10} className="text-slate-400 dark:text-slate-400" />
                        {formatDate(room.enrollment_date)}
                      </div>
                    )}
                  </div>

                  {/* Rent */}
                  <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.rent || 'Room Rent'}</span>
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {room.settings?.default_room_rent !== undefined
                        ? (formatMoney ? formatMoney(room.settings.default_room_rent) : `Rs ${room.settings.default_room_rent}`)
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 dark:border-slate-800 flex items-stretch h-10 bg-slate-50/60 dark:bg-slate-900/60 divide-x divide-slate-100 dark:divide-slate-800 rounded-b-2xl overflow-hidden mt-auto">
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/admin/rooms/${room.id}/bills/new`); }}
                    className="flex-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 active:bg-blue-100 dark:active:bg-blue-900/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none rounded-bl-2xl"
                  >
                    <Receipt size={13} /> {t.generate_monthly_bill || 'Generate Bill'}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/admin/rooms/${room.id}`); }}
                    className="flex-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:bg-slate-200 dark:active:bg-slate-700/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none rounded-br-2xl"
                  >
                    <Eye size={13} /> {t.view || 'View'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>


      {/* Edit Room Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[440px] rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50">
            <DialogTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <div className="h-6 w-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Pencil size={13} />
              </div>
              <span>{t.edit || 'Edit Room'}</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!editForm.room_name.trim()) {
              toast.error(language === 'np' ? 'कृपया कोठाको नाम लेख्नुहोस्' : 'Room name is required');
              return;
            }
            updateRoomMutation.mutate({
              ...editForm,
              enrollment_date: editForm.enrollment_date ? bsToAd(editForm.enrollment_date)?.toISOString() : null
            });
          }}>
            <div className="space-y-4 p-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <Label htmlFor="edit-room-name" className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Home size={12} className="text-blue-500" />
                  {t.room_name}
                </Label>
                <Input 
                  id="edit-room-name" 
                  value={editForm.room_name} 
                  onChange={(e) => setEditForm({...editForm, room_name: e.target.value})} 
                  className="h-8.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-enrollment-date" className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar size={12} className="text-blue-500" />
                    {t.enrollment_date}
                  </Label>
                  <Switch 
                    className="scale-75 origin-right" 
                    checked={!!editForm.enrollment_date} 
                    onCheckedChange={(val) => setEditForm({...editForm, enrollment_date: val ? getTodayBsDate() : ''})} 
                  />
                </div>
                {!!editForm.enrollment_date && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <BsDatePicker 
                      value={editForm.enrollment_date}
                      onChange={(val) => setEditForm({...editForm, enrollment_date: val})}
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
                  checked={editForm.is_active} 
                  onCheckedChange={(val) => setEditForm({...editForm, is_active: val})} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80">{t.cancel}</Button>
              <Button type="submit" disabled={updateRoomMutation.isPending} className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold">
                {updateRoomMutation.isPending ? t.loading : (t.save || 'Save Changes')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50">
            <DialogTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle size={18} />
              <span>{language === 'np' ? 'कोठा मेटाउनुहोस्' : 'Delete Room'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2.5">
            <p>
              {language === 'np' ? 'तपाईं पक्का मेटाउन चाहनुहुन्छ:' : 'Are you sure you want to delete:'} 
              <strong className="text-slate-900 dark:text-slate-100 ml-1">{deletingRoom?.room_name}</strong>?
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-100 dark:border-red-900/40 font-medium">
              <strong>{language === 'np' ? 'चेतावनी:' : 'Warning:'}</strong> {language === 'np' ? 'यसले यो कोठासँग सम्बन्धित सबै बिलहरू र भुक्तानी इतिहास मेट्नेछ! यो कार्य उल्टाउन सकिँदैन।' : 'This will permanently delete ALL bills and payment history associated with this room! This action cannot be undone.'}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80">{t.cancel}</Button>
            <Button 
              type="button"
              onClick={() => deleteRoomMutation.mutate(deletingRoom?.id)}
              disabled={deleteRoomMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold"
            >
              {deleteRoomMutation.isPending ? t.loading : (t.delete || 'Delete Room')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
