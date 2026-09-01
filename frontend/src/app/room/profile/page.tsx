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
import { User as UserIcon, Mail, DoorOpen, Calendar, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export default function TenantProfilePage() {
  const { user } = useAuth();
  const { t, formatDate, language } = useLanguage();

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
      <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-4 md:p-6 space-y-4 md:space-y-6 max-w-2xl mx-auto text-slate-900 dark:text-slate-100 pb-24">
      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t.profile}</h1>

      {/* Personal & Room Details */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60 p-3.5 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <UserIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t.personal_info}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-5 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <UserIcon size={14} className="text-slate-400" /> {t.name}
            </span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100">{profile?.name || user?.name}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <Mail size={14} className="text-slate-400" /> {t.email}
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.email || user?.email}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <DoorOpen size={14} className="text-slate-400" /> {t.assigned_room}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              <DoorOpen size={11} className="text-emerald-500 shrink-0" />
              <span>{effectiveRoom?.room_name || (language === 'np' ? 'तोकिएको छैन' : 'Unassigned')}</span>
            </span>
          </div>

          {effectiveRoom?.enrollment_date && (
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <Calendar size={14} className="text-slate-400" /> {t.enrollment_date}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{formatDate(effectiveRoom.enrollment_date)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <ShieldCheck size={14} className="text-slate-400" /> {t.role}
            </span>
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-[10px] px-2 py-0.5 rounded-full">
              {language === 'np' ? 'भाडावाल (Tenant)' : 'ROOM_USER'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60 p-3.5 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Lock size={16} className="text-blue-600 dark:text-blue-400" />
            <span>{t.change_password}</span>
          </CardTitle>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit}>
          <CardContent className="p-3.5 sm:p-5 space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t.current_password}</Label>
              <Input 
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t.new_password}</Label>
              <Input 
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t.confirm_password}</Label>
              <Input 
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/60 p-3 sm:p-4 flex justify-end">
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl h-10 px-4 text-xs shadow-md shadow-emerald-500/20 cursor-pointer border-0"
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
