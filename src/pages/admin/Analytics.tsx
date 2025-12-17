import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Package, ShoppingCart, DollarSign, Users, CheckCircle, XCircle, Clock, Truck } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'معلق',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغى'
};

const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444'];

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, loading: roleLoading } = useHasAnyRole();

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) navigate('/admin');
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    enabled: !!user && !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      
      const [ordersRes, productsRes] = await Promise.all([
        client.from('orders').select('*, items:order_items(quantity, price)'),
        client.from('products').select('*')
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];

      // Calculate stats
      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total_price || 0), 0);

      const statusCounts = orders.reduce((acc, o) => {
        acc[o.status || 'pending'] = (acc[o.status || 'pending'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        status
      }));

      // Orders by day (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const ordersByDay = last7Days.map(day => {
        const dayOrders = orders.filter(o => o.created_at?.startsWith(day));
        return {
          date: new Date(day).toLocaleDateString('ar-DZ', { weekday: 'short', day: 'numeric' }),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
        };
      });

      // Top products by quantity sold
      const productSales: Record<string, number> = {};
      orders.forEach(order => {
        order.items?.forEach((item: any) => {
          productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
        });
      });

      const topProducts = products
        .map(p => ({ name: p.name, sales: productSales[p.id] || 0 }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      return {
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: products.length,
        activeProducts: products.filter(p => p.is_active).length,
        pendingOrders: statusCounts.pending || 0,
        confirmedOrders: statusCounts.confirmed || 0,
        shippedOrders: statusCounts.shipped || 0,
        deliveredOrders: statusCounts.delivered || 0,
        cancelledOrders: statusCounts.cancelled || 0,
        statusData,
        ordersByDay,
        topProducts,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.filter(o => o.status !== 'cancelled').length : 0
      };
    }
  });

  if (loading || supabaseLoading || roleLoading || !user || !hasRole) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="التحليلات والإحصائيات" />

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card h-32 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<DollarSign className="w-6 h-6" />}
                label="إجمالي الإيرادات"
                value={`${analytics?.totalRevenue?.toLocaleString()} دج`}
                color="bg-green-500"
              />
              <StatCard
                icon={<ShoppingCart className="w-6 h-6" />}
                label="إجمالي الطلبات"
                value={analytics?.totalOrders || 0}
                color="bg-blue-500"
              />
              <StatCard
                icon={<Package className="w-6 h-6" />}
                label="المنتجات النشطة"
                value={`${analytics?.activeProducts}/${analytics?.totalProducts}`}
                color="bg-purple-500"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="متوسط قيمة الطلب"
                value={`${Math.round(analytics?.avgOrderValue || 0)} دج`}
                color="bg-orange-500"
              />
            </div>

            {/* Order Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatusCard icon={<Clock />} label="معلق" value={analytics?.pendingOrders || 0} color="text-yellow-500" bgColor="bg-yellow-500/10" />
              <StatusCard icon={<CheckCircle />} label="مؤكد" value={analytics?.confirmedOrders || 0} color="text-blue-500" bgColor="bg-blue-500/10" />
              <StatusCard icon={<Truck />} label="تم الشحن" value={analytics?.shippedOrders || 0} color="text-purple-500" bgColor="bg-purple-500/10" />
              <StatusCard icon={<CheckCircle />} label="تم التسليم" value={analytics?.deliveredOrders || 0} color="text-green-500" bgColor="bg-green-500/10" />
              <StatusCard icon={<XCircle />} label="ملغى" value={analytics?.cancelledOrders || 0} color="text-red-500" bgColor="bg-red-500/10" />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Orders by Day */}
              <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
                <h3 className="text-lg font-bold mb-4">الطلبات خلال الأسبوع</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics?.ordersByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Status Distribution */}
              <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
                <h3 className="text-lg font-bold mb-4">توزيع حالات الطلبات</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics?.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {analytics?.statusData?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by Day & Top Products */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Revenue by Day */}
              <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
                <h3 className="text-lg font-bold mb-4">الإيرادات اليومية</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics?.ordersByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} دج`, 'الإيرادات']}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Products */}
              <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
                <h3 className="text-lg font-bold mb-4">أكثر المنتجات مبيعاً</h3>
                <div className="space-y-4">
                  {analytics?.topProducts?.map((product, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium truncate">{product.name}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(product.sales / (analytics?.topProducts?.[0]?.sales || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-muted-foreground">{product.sales} مبيعات</span>
                    </div>
                  ))}
                  {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">لا توجد مبيعات بعد</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-village-sm border border-border">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusCard({ icon, label, value, color, bgColor }: { icon: React.ReactNode; label: string; value: number; color: string; bgColor: string }) {
  return (
    <div className={`${bgColor} rounded-xl p-4 border border-border`}>
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
