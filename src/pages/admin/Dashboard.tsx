import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, LogOut, LayoutDashboard, Users } from 'lucide-react';

export default function AdminDashboard() {
  const { user, signOut, loading } = useAuth();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !adminLoading) {
      if (!user) {
        navigate('/admin');
      } else if (!isAdmin) {
        navigate('/admin');
      }
    }
  }, [user, loading, isAdmin, adminLoading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    enabled: !!user && !!supabase && isAdmin,
    queryFn: async () => {
      const client = await getSupabase();
      const [products, orders, pendingOrders] = await Promise.all([
        client.from('products').select('id', { count: 'exact' }),
        client.from('orders').select('id', { count: 'exact' }),
        client.from('orders').select('id', { count: 'exact' }).eq('status', 'pending')
      ]);
      return {
        products: products.count || 0,
        orders: orders.count || 0,
        pending: pendingOrders.count || 0
      };
    }
  });

  if (loading || supabaseLoading || adminLoading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/admin/dashboard" className="text-2xl font-bold text-gradient">Village Admin</Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">الموقع</Link>
            <Button variant="ghost" size="icon" onClick={() => signOut()}><LogOut className="w-5 h-5" /></Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">لوحة التحكم</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground">المنتجات</p>
                <p className="text-3xl font-bold">{stats?.products || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground">الطلبات</p>
                <p className="text-3xl font-bold">{stats?.orders || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/20 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-muted-foreground">طلبات معلقة</p>
                <p className="text-3xl font-bold">{stats?.pending || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/products" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <Package className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">إدارة المنتجات</h2>
            <p className="text-muted-foreground">إضافة وتعديل وحذف المنتجات</p>
          </Link>
          <Link to="/admin/orders" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <ShoppingCart className="w-12 h-12 text-accent mb-4" />
            <h2 className="text-2xl font-bold mb-2">إدارة الطلبات</h2>
            <p className="text-muted-foreground">عرض ومعالجة طلبات الزبائن</p>
          </Link>
          <Link to="/admin/users" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <Users className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">إدارة المستخدمين</h2>
            <p className="text-muted-foreground">إنشاء وإدارة حسابات المستخدمين</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
