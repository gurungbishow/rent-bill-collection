'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Building,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/context/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api from '@/lib/axios';
import { toast } from 'sonner';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoggingIn, user, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // Minimalist Password Reset state
  const [isDirectResetOpen, setIsDirectResetOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    if (user && !isLoading) {
      if (user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/room/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Open reset dialog if ?reset=true in query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'true') {
        setIsDirectResetOpen(true);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    login({
      email: data.email.toLowerCase().trim(),
      password: data.password.trim(),
    });
  };

  const handleDirectReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    const target = resetIdentifier.trim();
    if (!target) {
      setResetError(
        language === 'np'
          ? 'इमेल वा कोठाको नाम प्रविष्ट गर्नुहोस्'
          : 'Please enter your email or room name'
      );
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError(t.password_min_length || 'Password must be at least 6 characters long.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError(t.passwords_dont_match || 'Passwords do not match.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await api.post('/auth/direct-reset-password', {
        identifier: target,
        newPassword: resetNewPassword,
      });

      toast.success(
        t.direct_reset_success || 'Password reset successfully! You can now sign in.'
      );

      // Pre-fill login email for easy sign in
      if (res.data?.data?.email) {
        setValue('email', res.data.data.email);
      } else if (target.includes('@')) {
        setValue('email', target);
      }

      setResetIdentifier('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setIsDirectResetOpen(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (language === 'np' ? 'पासवर्ड रिसेट गर्न असफल भयो' : 'Failed to reset password');
      setResetError(msg);
      toast.error(msg);
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-[#0f172a] dark:to-indigo-950/20 overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[100px] sm:blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/10 dark:bg-cyan-600/10 blur-[100px] sm:blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1 sm:gap-2 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <LanguageToggle />
        <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-0.5 sm:mx-1" />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="w-full max-w-[26rem] z-10 mt-8 sm:mt-0"
      >
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-40 dark:opacity-30 rounded-full" />
            <div className="relative bg-gradient-to-tr from-blue-600 to-cyan-500 p-3.5 sm:p-4 rounded-2xl text-white shadow-xl ring-4 ring-white/50 dark:ring-slate-900/50">
              <Building size={32} className="sm:w-9 sm:h-9" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] sm:rounded-[24px] overflow-hidden ring-1 ring-slate-200/60 dark:ring-slate-800/60">
          <CardHeader className="space-y-1.5 sm:space-y-2 text-center pb-5 sm:pb-6 pt-8 sm:pt-10 px-6 sm:px-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
              {t.welcome_back}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              {t.sign_in_to_continue}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-7 sm:pb-8 pt-1 sm:pt-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5 sm:space-y-2 relative group">
                <Label
                  htmlFor="email"
                  className="text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 ml-1"
                >
                  {t.email_address || 'Email Address'}
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register('email')}
                    className={`pl-10 sm:pl-11 h-11 sm:h-12 text-[14px] sm:text-[15px] bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80 rounded-xl focus-visible:ring-blue-500 transition-all ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] sm:h-5 sm:w-5 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-500 z-10"
                    strokeWidth={1.5}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] sm:text-xs font-medium text-red-500 ml-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2 relative group">
                <div className="flex items-center justify-between ml-1">
                  <Label
                    htmlFor="password"
                    className="text-[13px] sm:text-sm text-slate-700 dark:text-slate-300"
                  >
                    {t.password}
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      const curEmail = getValues('email');
                      if (curEmail) {
                        setResetIdentifier(curEmail);
                      }
                      setResetError('');
                      setIsDirectResetOpen(true);
                    }}
                    className="text-[12px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    {t.forgot_password || 'Forgot password?'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`pl-10 sm:pl-11 pr-10 sm:pr-11 h-11 sm:h-12 text-[14px] sm:text-[15px] bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80 rounded-xl focus-visible:ring-blue-500 transition-all ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] sm:h-5 sm:w-5 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-500 z-10"
                    strokeWidth={1.5}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] sm:text-xs font-medium text-red-500 ml-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full mt-6 sm:mt-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white h-11 sm:h-12 rounded-xl text-[14px] sm:text-[15px] font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group border-0"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? t.loading : t.sign_in}
                {!isLoggingIn && (
                  <ArrowRight
                    className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform"
                    strokeWidth={2}
                  />
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/50 flex justify-center py-4 sm:py-5 rounded-b-[20px] sm:rounded-b-[24px]">
            <p className="text-[12px] sm:text-[13px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
              Rent Bill Collection System © 2026
            </p>
          </CardFooter>
        </Card>
      </motion.div>

      {/* ── MINIMALIST PASSWORD RESET DIALOG ── */}
      <Dialog open={isDirectResetOpen} onOpenChange={setIsDirectResetOpen}>
        <DialogContent className="sm:max-w-[380px] p-5 sm:p-6 gap-4 rounded-2xl">
          <DialogHeader className="gap-1 text-left pb-1">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <KeyRound size={18} className="text-blue-600 dark:text-blue-400" />
              {t.reset_password || 'Reset Password'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleDirectReset} className="space-y-3.5">
            {resetError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={15} className="shrink-0" />
                <span className="font-medium">{resetError}</span>
              </div>
            )}

            {/* Email or Room */}
            <div className="space-y-1">
              <Label
                htmlFor="reset-identifier"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-0.5"
              >
                {t.email_or_room || 'Email or Room'}
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="reset-identifier"
                  type="text"
                  placeholder={t.email_or_room_placeholder || 'name@example.com or Room 101'}
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  className="pl-9 h-10 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-blue-500"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <Label
                htmlFor="reset-new-password"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-0.5"
              >
                {t.new_password || 'New Password'}
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="reset-new-password"
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="pl-9 pr-9 h-10 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-blue-500"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label
                htmlFor="reset-confirm-password"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-0.5"
              >
                {t.confirm_password || 'Confirm Password'}
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="reset-confirm-password"
                  type={showResetConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="pl-9 pr-9 h-10 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-blue-500"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showResetConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={
                  isResetSubmitting ||
                  !resetIdentifier ||
                  !resetNewPassword ||
                  !resetConfirmPassword
                }
                className="w-full h-10 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-[0.98]"
              >
                {isResetSubmitting
                  ? t.loading || 'Loading...'
                  : t.reset_password || 'Reset Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
