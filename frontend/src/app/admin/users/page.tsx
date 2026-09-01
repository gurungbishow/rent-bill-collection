'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, KeyRound, AlertTriangle, ShieldCheck, Mail, DoorOpen, Home, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ROOM_USER',
    room_id: ''
  });

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'ROOM_USER',
    room_id: '',
    is_active: true
  });

  // Reset Password Modal State
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any>(null);

  // Queries
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data;
    }
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data.data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/users', {
        ...data,
        room_id: data.role === 'ROOM_USER' ? data.room_id : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(language === 'np' ? 'प्रयोगकर्ता सफलतापूर्वक सिर्जना भयो' : 'User created successfully');
      setIsCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'ROOM_USER', room_id: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.put(`/users/${editingUser?.id}`, {
        ...data,
        room_id: data.role === 'ROOM_USER' ? data.room_id : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(language === 'np' ? 'प्रयोगकर्ता अद्यावधिक भयो' : 'User updated successfully');
      setIsEditOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      await api.post(`/users/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast.success(language === 'np' ? 'पासवर्ड सफलतापूर्वक परिवर्तन भयो' : 'Password reset successfully');
      setIsResetPasswordOpen(false);
      setResettingUser(null);
      setNewPassword('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(language === 'np' ? 'प्रयोगकर्ता सफलतापूर्वक हटाइयो' : 'User deleted successfully');
      setIsDeleteOpen(false);
      setDeletingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      room_id: user.room_id || '',
      is_active: Boolean(user.is_active)
    });
    setIsEditOpen(true);
  };

  const handleOpenResetPassword = (user: any) => {
    setResettingUser(user);
    setNewPassword('');
    setIsResetPasswordOpen(true);
  };

  const handleOpenDelete = (user: any) => {
    setDeletingUser(user);
    setIsDeleteOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t.system_users}</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const selectedCreateRoom = rooms?.find((r: any) => r.id?.toString() === createForm.room_id?.toString());
  const selectedEditRoom = rooms?.find((r: any) => r.id?.toString() === editForm.room_id?.toString());

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.system_users}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'np' 
              ? `कुल प्रयोगकर्ताहरू: ${users?.length || 0}` 
              : `Total registered users: ${users?.length || 0}`}
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button
              className="h-9 px-3.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 rounded-full transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus size={15} className="mr-1" />
              <span>{t.add_new_user}</span>
            </Button>
          } />
          <DialogContent className="sm:max-w-[440px] p-0 rounded-2xl overflow-hidden">
            <DialogHeader className="p-4 md:p-5 pb-0">
              <DialogTitle>{t.add_new_user}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3.5 p-4 md:p-5 pt-2">
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right text-xs font-semibold">{t.name}</Label>
                <Input className="col-span-3 h-9 text-xs rounded-lg" placeholder="e.g. John Doe" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right text-xs font-semibold">{t.email}</Label>
                <Input type="email" className="col-span-3 h-9 text-xs rounded-lg" placeholder="e.g. john@example.com" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right text-xs font-semibold">{t.password}</Label>
                <Input type="password" className="col-span-3 h-9 text-xs rounded-lg" placeholder="••••••••" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right text-xs font-semibold">{t.role}</Label>
                <div className="col-span-3">
                  <Select value={createForm.role} onValueChange={(v: any) => setCreateForm({...createForm, role: v})}>
                    <SelectTrigger className="w-full h-9 text-xs rounded-lg">
                      <SelectValue placeholder="Select role">
                        {createForm.role === 'ADMIN' ? t.system_admin : t.room_tenant}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ROOM_USER">{t.room_tenant}</SelectItem>
                      <SelectItem value="ADMIN">{t.system_admin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {createForm.role === 'ROOM_USER' && (
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label className="text-right text-xs font-semibold">{t.room_name}</Label>
                  <div className="col-span-3">
                    <Select value={createForm.room_id} onValueChange={(v: any) => setCreateForm({...createForm, room_id: v})}>
                      <SelectTrigger className="w-full h-9 text-xs rounded-lg">
                        <SelectValue placeholder={language === 'np' ? 'कोठा चयन गर्नुहोस्' : 'Assign a room'}>
                          {selectedCreateRoom ? selectedCreateRoom.room_name : (language === 'np' ? 'कोठा चयन गर्नुहोस्' : 'Assign a room')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {rooms?.map((r: any) => (
                          <SelectItem key={r.id} value={r.id.toString()}>{r.room_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">{t.cancel}</Button>
              <Button type="button" onClick={() => createMutation.mutate(createForm)} disabled={createMutation.isPending || !createForm.name || !createForm.email || !createForm.password || (createForm.role === 'ROOM_USER' && !createForm.room_id)} className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold cursor-pointer">
                {createMutation.isPending ? t.loading : t.add_new_user}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card className="hidden md:block border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden rounded-2xl">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <TableRow>
              <TableHead className="text-left font-bold text-slate-700 dark:text-slate-200 pl-6">{t.name}</TableHead>
              <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.email}</TableHead>
              <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.role}</TableHead>
              <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.room_name}</TableHead>
              <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">{t.status}</TableHead>
              <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200 pr-6">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user: any) => (
              <TableRow key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                <TableCell className="pl-6 font-semibold text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <span>{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center text-slate-600 dark:text-slate-400 text-xs">{user.email}</TableCell>
                <TableCell className="text-center">
                  {user.role === 'ADMIN' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                      <ShieldCheck size={11} className="text-indigo-500 shrink-0" />
                      <span>{t.system_admin}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                      <Home size={11} className="text-emerald-500 shrink-0" />
                      <span>{t.room_tenant}</span>
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {user.room ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                      <DoorOpen size={11} className="text-blue-500 shrink-0" />
                      <span>{user.room.room_name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 italic text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={user.is_active ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] px-2 py-0.5" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.5"}>
                    {user.is_active ? (language === 'np' ? 'सक्रिय' : 'Active') : (language === 'np' ? 'निष्क्रिय' : 'Inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-center pr-6">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg cursor-pointer"
                      title={t.edit}
                      onClick={() => handleOpenEdit(user)}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg cursor-pointer"
                      title={t.reset_user_password}
                      onClick={() => handleOpenResetPassword(user)}
                    >
                      <KeyRound size={15} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={currentUser?.id === user.id}
                      className={`h-8 w-8 rounded-lg cursor-pointer ${currentUser?.id === user.id ? 'opacity-40 cursor-not-allowed' : 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50'}`}
                      title={currentUser?.id === user.id ? (language === 'np' ? 'तपाईं आफ्नै खाता मेटाउन सक्नुहुन्न' : 'You cannot delete your own account') : t.delete}
                      onClick={() => handleOpenDelete(user)}
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

      {/* Mobile Users View */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {users?.map((user: any) => (
          <Card key={user.id} className="p-0 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col bg-white dark:bg-slate-900/80 shadow-sm overflow-hidden backdrop-blur-sm">
            <div className="p-3.5 space-y-2.5">
              {/* Header: Avatar + Name + Status */}
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{user.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Mail size={10} className="text-slate-400 shrink-0" />
                      <span>{user.email}</span>
                    </p>
                  </div>
                </div>
                <Badge className={user.is_active ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[9px] px-1.5 py-0.5 rounded-full shrink-0" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] px-1.5 py-0.5 rounded-full shrink-0"}>
                  {user.is_active ? (language === 'np' ? 'सक्रिय' : 'Active') : (language === 'np' ? 'निष्क्रिय' : 'Inactive')}
                </Badge>
              </div>

              {/* Role & Room Micro Badges */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[10px] font-semibold text-slate-400 mr-1">{t.role}:</span>
                  {user.role === 'ADMIN' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                      <ShieldCheck size={10} className="text-indigo-500 shrink-0" />
                      <span>{t.system_admin}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                      <Home size={10} className="text-emerald-500 shrink-0" />
                      <span>{t.room_tenant}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[10px] font-semibold text-slate-400 mr-1">{t.room_name}:</span>
                  {user.room ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                      <DoorOpen size={10} className="text-blue-500 shrink-0" />
                      <span>{user.room.room_name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 italic text-[11px]">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Standardized 3-Split Solid Tinted Action Bar */}
            <div className="flex items-center divide-x divide-slate-200/80 dark:divide-slate-800 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl overflow-hidden h-10 select-none">
              <button 
                type="button" 
                className="flex-1 h-full text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => handleOpenEdit(user)}
              >
                <Pencil size={13} />
                <span>{t.edit}</span>
              </button>
              <button 
                type="button" 
                className="flex-1 h-full text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => handleOpenResetPassword(user)}
              >
                <KeyRound size={13} />
                <span>Reset</span>
              </button>
              <button 
                type="button" 
                disabled={currentUser?.id === user.id}
                className="flex-1 h-full text-xs font-bold text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-950/40 hover:bg-red-100/70 dark:hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => handleOpenDelete(user)}
              >
                <Trash2 size={13} />
                <span>{t.delete}</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 md:p-5 pb-0">
            <DialogTitle>
              {t.edit} - {editingUser?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3.5 p-4 md:p-5 pt-2">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right text-xs font-semibold">{t.name}</Label>
              <Input className="col-span-3 h-9 text-xs rounded-lg" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right text-xs font-semibold">{t.email}</Label>
              <Input type="email" className="col-span-3 h-9 text-xs rounded-lg" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right text-xs font-semibold">{t.role}</Label>
              <div className="col-span-3">
                <Select value={editForm.role} onValueChange={(v: any) => setEditForm({...editForm, role: v})}>
                  <SelectTrigger className="w-full h-9 text-xs rounded-lg">
                    <SelectValue placeholder="Select role">
                      {editForm.role === 'ADMIN' ? t.system_admin : t.room_tenant}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROOM_USER">{t.room_tenant}</SelectItem>
                    <SelectItem value="ADMIN">{t.system_admin}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editForm.role === 'ROOM_USER' && (
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right text-xs font-semibold">{t.room_name}</Label>
                <div className="col-span-3">
                  <Select value={editForm.room_id} onValueChange={(v: any) => setEditForm({...editForm, room_id: v})}>
                    <SelectTrigger className="w-full h-9 text-xs rounded-lg">
                      <SelectValue placeholder={language === 'np' ? 'कोठा चयन गर्नुहोस्' : 'Assign a room'}>
                        {selectedEditRoom ? selectedEditRoom.room_name : (language === 'np' ? 'कोठा चयन गर्नुहोस्' : 'Assign a room')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {rooms?.map((r: any) => (
                        <SelectItem key={r.id} value={r.id.toString()}>{r.room_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right text-xs font-semibold">{t.status}</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch 
                  checked={editForm.is_active} 
                  onCheckedChange={(val) => setEditForm({...editForm, is_active: val})} 
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {editForm.is_active ? (language === 'np' ? 'सक्रिय (Active)' : 'Active') : (language === 'np' ? 'निष्क्रिय (Inactive)' : 'Inactive')}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">{t.cancel}</Button>
            <Button type="button" onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending || !editForm.name || !editForm.email} className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold cursor-pointer">
              {updateMutation.isPending ? t.loading : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-[420px] p-0 rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 md:p-5 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <KeyRound size={18} className="text-blue-600" />
              {t.reset_user_password}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 p-4 md:p-5 pt-2 text-sm">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t.resetting_password_for}{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">{resettingUser?.name} ({resettingUser?.email})</strong>
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t.new_password}</Label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsResetPasswordOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">{t.cancel}</Button>
            <Button 
              type="button"
              onClick={() => {
                if (!newPassword || newPassword.length < 6) {
                  toast.error(t.password_min_length);
                  return;
                }
                resetPasswordMutation.mutate({ id: resettingUser?.id, newPassword });
              }}
              disabled={resetPasswordMutation.isPending || !newPassword}
              className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold cursor-pointer"
            >
              {resetPasswordMutation.isPending ? t.loading : t.reset_user_password}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 rounded-2xl overflow-hidden">
          <DialogHeader className="bg-red-50 dark:bg-red-950/40 p-4 border-b border-red-100 dark:border-red-900/40">
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-base font-bold">
              <AlertTriangle size={18} /> {t.delete_user}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <p>
              {t.delete_user_confirm}{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">{deletingUser?.name} ({deletingUser?.email})</strong>
              ?
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 font-medium">
              {t.action_cannot_be_undone}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)} className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">{t.cancel}</Button>
            <Button 
              type="button"
              onClick={() => deleteMutation.mutate(deletingUser?.id)}
              disabled={deleteMutation.isPending}
              className="bg-gradient-to-r from-red-600 via-rose-500 to-red-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold cursor-pointer"
            >
              {deleteMutation.isPending ? t.loading : t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
