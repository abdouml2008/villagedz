import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !adminLoading) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      }
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    const { error } = await signIn(email, password);
    if (error) {
      toast.error('خطأ في تسجيل الدخول - تحقق من البريد وكلمة المرور');
    }
    
    setLoading(false);
  };

  if (adminLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (user && !isAdmin && !adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-village-lg border border-border text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">غير مصرح</h1>
          <p className="text-muted-foreground mb-4">ليس لديك صلاحية الوصول للوحة التحكم</p>
          <div className="flex flex-col gap-3">
            <Button onClick={async () => {
              const { signOut } = await import('@/hooks/useAuth').then(m => ({ signOut: m.useAuth }));
              const { supabase } = await import('@/integrations/supabase/client');
              await supabase.auth.signOut();
              window.location.reload();
            }} variant="default" className="gradient-primary text-primary-foreground">
              تسجيل الخروج وإعادة المحاولة
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-village-lg border border-border">
        <h1 className="text-3xl font-bold text-center mb-2">
          <span className="text-gradient">Village</span>
        </h1>
        <p className="text-center text-muted-foreground mb-8">لوحة التحكم</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">
            {loading ? 'جاري المعالجة...' : 'دخول'}
          </Button>
        </form>
      </div>
    </div>
  );
}
