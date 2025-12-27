import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { LowStockAlert } from '@/components/admin/LowStockAlert';
import { Package, ShoppingCart, LayoutDashboard, Users, Truck, BarChart3, Tag, FolderOpen, Megaphone, MessageSquare, Share2, BarChart } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, isAdmin, loading: roleLoading } = useHasAnyRole();
  const navigate = useNavigate();
  
  // Enable order notifications for admin
  useOrderNotifications(!!user && hasRole);

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) {
        navigate('/admin');
      }
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    enabled: !!user && !!supabase && hasRole,
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

  if (loading || supabaseLoading || roleLoading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  if (!user || !hasRole) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="لوحة التحكم" showBackButton={false} showLogo={true} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">لوحة التحكم</h1>
        
        <LowStockAlert threshold={5} />
        
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
          {isAdmin && (
            <Link to="/admin/users" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
              <Users className="w-12 h-12 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">إدارة المستخدمين</h2>
              <p className="text-muted-foreground">إنشاء وإدارة حسابات المستخدمين</p>
            </Link>
          )}
          <Link to="/admin/delivery-prices" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <Truck className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">أسعار التوصيل</h2>
            <p className="text-muted-foreground">إدارة أسعار التوصيل حسب الولاية</p>
          </Link>
          <Link to="/admin/analytics" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <BarChart3 className="w-12 h-12 text-accent mb-4" />
            <h2 className="text-2xl font-bold mb-2">التحليلات</h2>
            <p className="text-muted-foreground">إحصائيات المبيعات والطلبات</p>
          </Link>
          <Link to="/admin/coupons" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <Tag className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">كوبونات الخصم</h2>
            <p className="text-muted-foreground">إنشاء وإدارة أكواد الخصم</p>
          </Link>
          <Link to="/admin/categories" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <FolderOpen className="w-12 h-12 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">إدارة الأقسام</h2>
            <p className="text-muted-foreground">إضافة وتعديل أقسام المنتجات</p>
          </Link>
          <Link to="/admin/banners" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <Megaphone className="w-12 h-12 text-pink-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">البانرات الترويجية</h2>
            <p className="text-muted-foreground">تخصيص البانرات في الصفحة الرئيسية</p>
          </Link>
          <Link to="/admin/reviews" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <MessageSquare className="w-12 h-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">إدارة التقييمات</h2>
            <p className="text-muted-foreground">عرض وحذف تقييمات العملاء</p>
          </Link>
          <Link to="/admin/social-links" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <Share2 className="w-12 h-12 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">وسائل التواصل</h2>
            <p className="text-muted-foreground">إدارة روابط التواصل الاجتماعي</p>
          </Link>
          <Link to="/admin/tracking-pixels" className="bg-card rounded-xl p-8 shadow-village-sm border border-border hover:shadow-village-lg transition-shadow">
            <BarChart className="w-12 h-12 text-purple-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">بيكسلات التتبع</h2>
            <p className="text-muted-foreground">إدارة بيكسلات Meta و TikTok</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
