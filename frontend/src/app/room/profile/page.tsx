'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User as UserIcon, 
  Mail, 
  DoorOpen, 
  Calendar, 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export default function TenantProfilePage() {
  const { user } = useAuth();
  const { t, formatDate, language } = useLanguage();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data;
    }
  });

  const roomId = profile?.room_id || profile?.roomId || user?.room_id || user?.roomId;

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data.data;
    },
    enabled: !!roomId
  });

  const effectiveRoom = profile?.room || room;

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(t.password_updated_success);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    }
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error(language === 'np' ? 'कृपया सबै विवरण भर्नुहोस्' : 'Please fill all required fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(language === 'np' ? 'नयाँ पासवर्ड मिलेन' : 'New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(language === 'np' ? 'पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ' : 'Password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  if (loadingProfile && !profile) {
    return (
      <div className="p-3.5 sm:p-4 md:p-6 space-y-4 max-w-2xl mx-auto pb-24">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const initials = (profile?.name || user?.name || 'T').charAt(0).toUpperCase();

  return (
    <div className="p-3.5 sm:p-4 md:p-6 space-y-4 md:space-y-5 max-w-2xl mx-auto text-slate-900 dark:text-slate-100 pb-24">
      
      {/* ── TOP HERO AVATAR PASS ── */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-4 sm:p-6 shadow-md shadow-emerald-500/15 relative overflow-hidden flex items-center gap-3.5 sm:gap-5 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
          <UserIcon className="w-28 h-28 sm:w-36 sm:h-36 text-white" />
        </div>
        <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-inner shrink-0">
          {initials}
        </div>
        <div className="flex flex-col min-w-0 z-10">
          <h1 className="text-lg sm:text-2xl font-black text-white leading-tight truncate">
            {profile?.name || user?.name}
          </h1>
          <p className="text-emerald-100/90 text-xs font-medium flex items-center gap-1 mt-0.5 truncate">
            <Mail size={12} className="shrink-0" />
            <span className="truncate">{profile?.email || user?.email}</span>
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
              <DoorOpen size={11} className="shrink-0 text-emerald-200" />
              <span>{effectiveRoom?.room_name || (language === 'np' ? 'तोकिएको छैन' : 'Unassigned')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── PERSONAL INFORMATION CARD ── */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60 p-3.5 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <UserIcon size={14} />
            </div>
            <span>{t.personal_info}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4 space-y-2.5 text-xs">
          
          {/* Name */}
          <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <UserIcon size={13} />
              </div>
              {t.name}
            </span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100">{profile?.name || user?.name}</span>
          </div>

          {/* Email */}
          <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Mail size={13} />
              </div>
              {t.email}
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[160px] sm:max-w-none">{profile?.email || user?.email}</span>
          </div>

          {/* Assigned Room */}
          <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <DoorOpen size={13} />
              </div>
              {t.assigned_room}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              <DoorOpen size={10} className="text-emerald-500 shrink-0" />
              <span>{effectiveRoom?.room_name || (language === 'np' ? 'तोकिएको छैन' : 'Unassigned')}</span>
            </span>
          </div>

          {/* Move-in Date */}
          {effectiveRoom?.enrollment_date && (
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Calendar size={13} />
                </div>
                {t.enrollment_date || 'Move-in Date'}
              </span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatDate(effectiveRoom.enrollment_date)}</span>
            </div>
          )}

          {/* Role */}
          <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <ShieldCheck size={13} />
              </div>
              {t.role}
            </span>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
              {language === 'np' ? 'भाडावाल (Tenant)' : 'ROOM_USER'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ── CHANGE PASSWORD CARD ── */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60 p-3.5 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <KeyRound size={14} />
            </div>
            <span>{t.change_password}</span>
          </CardTitle>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit}>
          <CardContent className="p-3.5 sm:p-4 space-y-3">
            
            {/* Current Password */}
            <div className="space-y-1 group">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">{t.current_password}</Label>
              <div className="relative flex items-center">
                <Input 
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="pl-9 pr-9 h-10 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80 focus-visible:ring-emerald-500"
                  placeholder="••••••••"
                />
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                >
                  {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1 group">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">{t.new_password}</Label>
              <div className="relative flex items-center">
                <Input 
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="pl-9 pr-9 h-10 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80 focus-visible:ring-emerald-500"
                  placeholder="••••••••"
                />
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1 group">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-0.5">{t.confirm_password}</Label>
              <div className="relative flex items-center">
                <Input 
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="pl-9 h-10 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80 focus-visible:ring-emerald-500"
                  placeholder="••••••••"
                />
                <CheckCircle2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/60 p-3 sm:p-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl h-11 text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer border-0"
              disabled={changePasswordMutation.isPending}
            >
              <span>{changePasswordMutation.isPending ? t.loading : t.update_password}</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
