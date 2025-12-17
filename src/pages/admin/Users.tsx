import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useSupabase } from '@/hooks/useSupabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRight, Plus, Trash2, Key } from 'lucide-react';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  role: z.enum(['admin', 'user']),
});

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPasswordChange, setNewPasswordChange] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if not admin
  if (!adminLoading && (!user || !isAdmin)) {
    navigate('/admin');
    return null;
  }

  // Fetch users with roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase && isAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: 'admin' | 'user' }) => {
      if (!supabase || !session) throw new Error('غير مصرح');
      
      const response = await supabase.functions.invoke('create-user', {
        body: { email, password, role },
      });
      
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreateDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      toast.success('تم إنشاء الحساب بنجاح');
    },
    onError: (error: any) => {
      console.error('Create user error:', error);
      if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
        toast.error('هذا البريد مسجل مسبقاً');
      } else {
        toast.error(`خطأ: ${error.message}`);
      }
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Can't delete yourself
      if (userId === user?.id) {
        throw new Error('لا يمكنك حذف حسابك الخاص');
      }
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('تم حذف صلاحية المستخدم');
    },
    onError: (error: any) => {
      toast.error(error.message || 'خطأ في الحذف');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تغيير كلمة المرور بنجاح');
      setIsPasswordDialogOpen(false);
      setNewPasswordChange('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const handleCreateUser = () => {
    const validation = userSchema.safeParse({ email: newEmail, password: newPassword, role: newRole });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    createUserMutation.mutate({ email: newEmail, password: newPassword, role: newRole });
  };

  const handleChangePassword = () => {
    if (newPasswordChange.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPasswordChange !== confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }
    changePasswordMutation.mutate({ newPassword: newPasswordChange });
  };

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
              <ArrowRight className="size-5" />
            </Button>
            <h1 className="text-xl font-bold">إدارة المستخدمين</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Key className="size-4 ml-2" />
                  تغيير كلمة السر
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>تغيير كلمة المرور</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>كلمة المرور الجديدة</Label>
                    <Input 
                      type="password" 
                      value={newPasswordChange}
                      onChange={e => setNewPasswordChange(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Label>تأكيد كلمة المرور</Label>
                    <Input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={changePasswordMutation.isPending}
                    className="w-full"
                  >
                    {changePasswordMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create User Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary">
                  <Plus className="size-4 ml-2" />
                  إضافة مستخدم
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء حساب جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>البريد الإلكتروني</Label>
                    <Input 
                      type="email" 
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label>كلمة المرور</Label>
                    <Input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Label>الدور</Label>
                    <Select value={newRole} onValueChange={(v: 'admin' | 'user') => setNewRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">مستخدم</SelectItem>
                        <SelectItem value="admin">مدير</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreateUser} 
                    disabled={createUserMutation.isPending}
                    className="w-full gradient-primary"
                  >
                    {createUserMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right px-4 py-3 font-medium">معرف المستخدم</th>
                <th className="text-right px-4 py-3 font-medium">الدور</th>
                <th className="text-right px-4 py-3 font-medium">تاريخ الإنشاء</th>
                <th className="text-center px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((userRole) => (
                <tr key={userRole.id} className="border-t border-border">
                  <td className="px-4 py-3 text-sm font-mono">
                    {userRole.user_id.slice(0, 8)}...
                    {userRole.user_id === user?.id && (
                      <span className="mr-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">أنت</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      userRole.role === 'admin' 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {userRole.role === 'admin' ? 'مدير' : 'مستخدم'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(userRole.created_at).toLocaleDateString('ar-DZ')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      disabled={userRole.user_id === user?.id}
                      onClick={() => deleteUserMutation.mutate(userRole.user_id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    لا يوجد مستخدمين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
