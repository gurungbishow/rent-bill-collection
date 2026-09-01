import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const { data } = await api.get('/auth/me');
        return data.data;
      } catch {
        localStorage.removeItem('token');
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const response = await api.post('/auth/login', credentials);
      return response.data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['auth', 'me'], data);
      toast.success('Logged in successfully');
      
      if (data.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/room/dashboard');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try { await api.post('/auth/logout'); } catch {}
    },
    onSuccess: () => {
      localStorage.removeItem('token');
      queryClient.setQueryData(['auth', 'me'], null);
      router.replace('/');
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  };
};
