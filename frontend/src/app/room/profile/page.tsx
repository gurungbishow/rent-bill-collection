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
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto text-slate-900 dark:text-slate-100">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t.profile}</h1>

      {/* Personal & Room Details */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <UserIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
            {t.personal_info}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <UserIcon size={15} /> {t.name}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{profile?.name || user?.name}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Mail size={15} /> {t.email}
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{profile?.email || user?.email}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <DoorOpen size={15} /> {t.assigned_room}
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
              {effectiveRoom?.room_name || (language === 'np' ? 'तोकिएको छैन' : 'Unassigned')}
            </span>
          </div>

          {effectiveRoom?.enrollment_date && (
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Calendar size={15} /> {t.enrollment_date}
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(effectiveRoom.enrollment_date)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck size={15} /> {t.role}
            </span>
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
              {language === 'np' ? 'भाडावाल (Tenant)' : 'ROOM_USER'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Lock size={18} className="text-blue-600 dark:text-blue-400" />
            {t.change_password}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit}>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t.current_password}</Label>
              <Input 
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t.new_password}</Label>
              <Input 
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t.confirm_password}</Label>
              <Input 
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? t.loading : t.update_password}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
