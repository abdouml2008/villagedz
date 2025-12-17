import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { getSupabase } from '@/hooks/useSupabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Key, Edit, Mail } from 'lucide-react';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  role: z.enum(['admin', 'user']),
});

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  role_id?: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const queryClient = useQueryClient();
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPasswordChange, setNewPasswordChange] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Edit user state
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPassword, setEditPassword] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Redirect if not admin
  if (!adminLoading && (!user || !isAdmin)) {
    navigate('/admin');
    return null;
  }

  // Fetch users using edge function
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const client = await getSupabase();
      const response = await client.functions.invoke('list-users');
      
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data as { users: UserData[]; isAdmin: boolean };
    },
    enabled: !!session,
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: 'admin' | 'user' }) => {
      const client = await getSupabase();
      const response = await client.functions.invoke('create-user', {
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
      if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
        toast.error('هذا البريد مسجل مسبقاً');
      } else {
        toast.error(`خطأ: ${error.message}`);
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, email, role, password }: { userId: string; email?: string; role?: 'admin' | 'user'; password?: string }) => {
      const client = await getSupabase();
      const response = await client.functions.invoke('update-user', {
        body: { userId, email, role, password: password || undefined },
      });
      
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsEditDialogOpen(false);
      setEditUser(null);
      toast.success('تم تحديث المستخدم بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const client = await getSupabase();
      
      if (userId === user?.id) {
        throw new Error('لا يمكنك حذف حسابك الخاص');
      }
      
      const response = await client.functions.invoke('delete-user', {
        body: { userId },
      });
      
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('تم حذف الحساب بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.message || 'خطأ في الحذف');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const client = await getSupabase();
      const { error } = await client.auth.updateUser({
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

  const openEditDialog = (userData: UserData) => {
    setEditUser(userData);
    setEditEmail(userData.email);
    setEditRole(userData.role);
    setEditPassword('');
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editUser) return;
    
    if (editEmail && !z.string().email().safeParse(editEmail).success) {
      toast.error('بريد إلكتروني غير صالح');
      return;
    }
    
    if (editPassword && editPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    updateUserMutation.mutate({
      userId: editUser.id,
      email: editEmail !== editUser.email ? editEmail : undefined,
      role: editRole !== editUser.role ? editRole : undefined,
      password: editPassword || undefined,
    });
  };

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const users = usersData?.users || [];
  const currentUserIsAdmin = usersData?.isAdmin || false;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="إدارة المستخدمين" />

      {/* Header Actions */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-end gap-2">
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
                  <DialogTitle>تغيير كلمة المرور الخاصة بك</DialogTitle>
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

            {/* Create User Dialog - Admin only */}
            {currentUserIsAdmin && (
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
            )}
          </div>
        </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input 
                type="email" 
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            {currentUserIsAdmin && (
              <div>
                <Label>الدور</Label>
                <Select value={editRole} onValueChange={(v: 'admin' | 'user') => setEditRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">مستخدم</SelectItem>
                    <SelectItem value="admin">مدير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>كلمة المرور الجديدة (اتركه فارغاً للإبقاء على القديمة)</Label>
              <Input 
                type="password" 
                value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button 
              onClick={handleUpdateUser} 
              disabled={updateUserMutation.isPending}
              className="w-full gradient-primary"
            >
              {updateUserMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4" />
                    البريد الإلكتروني
                  </div>
                </th>
                <th className="text-right px-4 py-3 font-medium">الدور</th>
                <th className="text-right px-4 py-3 font-medium">تاريخ الإنشاء</th>
                <th className="text-center px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userData) => (
                <tr key={userData.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <span className="font-medium">{userData.email}</span>
                    {userData.id === user?.id && (
                      <span className="mr-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">أنت</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      userData.role === 'admin' 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {userData.role === 'admin' ? 'مدير' : 'مستخدم'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(userData.created_at).toLocaleDateString('ar-DZ')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Edit button - visible for own account or admin for others */}
                      {(userData.id === user?.id || currentUserIsAdmin) && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(userData)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="size-4" />
                        </Button>
                      )}
                      {/* Delete button - admin only and not self */}
                      {currentUserIsAdmin && userData.id !== user?.id && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteUserMutation.mutate(userData.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
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