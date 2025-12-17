import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Package, ShoppingCart, DollarSign, CheckCircle, XCircle, Clock, Truck, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, startOfMonth, startOfYear, subHours, subMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusLabels: Record<string, string> = {
  pending: 'معلق',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغى'
};

const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444'];

type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'year' | 'custom';

const timeRangeLabels: Record<TimeRange, string> = {
  hour: 'آخر ساعة',
  day: 'اليوم',
  week: 'آخر 7 أيام',
  month: 'آخر شهر',
  year: 'آخر سنة',
  custom: 'مخصص'
};

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) navigate('/admin');
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (timeRange) {
      case 'hour':
        start = subHours(now, 1);
        break;
      case 'day':
        start = startOfDay(now);
        break;
      case 'week':
        start = subDays(now, 7);
        break;
      case 'month':
        start = subMonths(now, 1);
        break;
      case 'year':
        start = subYears(now, 1);
        break;
      case 'custom':
        start = customStartDate ? startOfDay(customStartDate) : subDays(now, 7);
        end = customEndDate ? endOfDay(customEndDate) : endOfDay(now);
        break;
      default:
        start = subDays(now, 7);
    }

    return { start, end };
  }, [timeRange, customStartDate, customEndDate]);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics', timeRange, customStartDate?.toISOString(), customEndDate?.toISOString()],
    enabled: !!user && !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      
      const [ordersRes, productsRes] = await Promise.all([
        client.from('orders')
          .select('*, items:order_items(quantity, price, product_id)')
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString()),
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

      // Generate time-based data based on range
      let timeData: { date: string; orders: number; revenue: number }[] = [];
      
      if (timeRange === 'hour') {
        // Last 60 minutes, grouped by 5-minute intervals
        const intervals = 12;
        for (let i = intervals - 1; i >= 0; i--) {
          const intervalStart = subMinutes(new Date(), i * 5 + 5);
          const intervalEnd = subMinutes(new Date(), i * 5);
          const intervalOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate >= intervalStart && orderDate < intervalEnd;
          });
          timeData.push({
            date: format(intervalEnd, 'HH:mm'),
            orders: intervalOrders.length,
            revenue: intervalOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
          });
        }
      } else if (timeRange === 'day') {
        // Today by hours
        for (let i = 0; i < 24; i++) {
          const hourStart = new Date(startOfDay(new Date()));
          hourStart.setHours(i);
          const hourEnd = new Date(hourStart);
          hourEnd.setHours(i + 1);
          const hourOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate >= hourStart && orderDate < hourEnd;
          });
          timeData.push({
            date: `${i}:00`,
            orders: hourOrders.length,
            revenue: hourOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
          });
        }
      } else {
        // Days for week/month/year/custom
        const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'year' ? 12 : 
          Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (timeRange === 'year') {
          // Group by months for year view
          for (let i = 11; i >= 0; i--) {
            const monthStart = subMonths(startOfMonth(new Date()), i);
            const monthEnd = subMonths(startOfMonth(new Date()), i - 1);
            const monthOrders = orders.filter(o => {
              const orderDate = new Date(o.created_at);
              return orderDate >= monthStart && orderDate < monthEnd;
            });
            timeData.push({
              date: format(monthStart, 'MMM', { locale: ar }),
              orders: monthOrders.length,
              revenue: monthOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
            });
          }
        } else {
          // Group by days
          const numDays = Math.min(days, 30);
          for (let i = numDays - 1; i >= 0; i--) {
            const day = subDays(new Date(), i);
            const dayStr = day.toISOString().split('T')[0];
            const dayOrders = orders.filter(o => o.created_at?.startsWith(dayStr));
            timeData.push({
              date: format(day, 'd MMM', { locale: ar }),
              orders: dayOrders.length,
              revenue: dayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
            });
          }
        }
      }

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
        timeData,
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
        {/* Time Range Selector */}
        <div className="bg-card rounded-xl p-4 shadow-village-sm border border-border mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-muted-foreground font-medium">الفترة الزمنية:</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(timeRangeLabels) as TimeRange[]).filter(t => t !== 'custom').map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {timeRangeLabels[range]}
                </Button>
              ))}
            </div>
            
            {/* Custom Date Range */}
            <div className="flex items-center gap-2 mr-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={timeRange === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => setTimeRange('custom')}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    {timeRange === 'custom' && customStartDate && customEndDate
                      ? `${format(customStartDate, 'dd/MM/yyyy')} - ${format(customEndDate, 'dd/MM/yyyy')}`
                      : 'تاريخ مخصص'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">من تاريخ:</p>
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={(date) => {
                          setCustomStartDate(date);
                          setTimeRange('custom');
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">إلى تاريخ:</p>
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={(date) => {
                          setCustomEndDate(date);
                          setTimeRange('custom');
                        }}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

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
              {/* Orders over Time */}
              <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
                <h3 className="text-lg font-bold mb-4">الطلبات خلال {timeRangeLabels[timeRange]}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics?.timeData}>
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

            {/* Revenue by Time & Top Products */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Revenue over Time */}
              <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
                <h3 className="text-lg font-bold mb-4">الإيرادات خلال {timeRangeLabels[timeRange]}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics?.timeData}>
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
