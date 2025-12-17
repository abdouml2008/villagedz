import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, CheckCircle, XCircle, Clock, Truck, CalendarIcon, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, startOfMonth, subHours, subMinutes } from 'date-fns';
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

function getDateRange(timeRange: TimeRange, customStart?: Date, customEnd?: Date) {
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
      start = customStart ? startOfDay(customStart) : subDays(now, 7);
      end = customEnd ? endOfDay(customEnd) : endOfDay(now);
      break;
    default:
      start = subDays(now, 7);
  }

  return { start, end };
}

function getPreviousPeriodRange(start: Date, end: Date) {
  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return { start: previousStart, end: previousEnd };
}

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) navigate('/admin');
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const dateRange = useMemo(() => {
    return getDateRange(timeRange, customStartDate, customEndDate);
  }, [timeRange, customStartDate, customEndDate]);

  const previousDateRange = useMemo(() => {
    return getPreviousPeriodRange(dateRange.start, dateRange.end);
  }, [dateRange]);

  const fetchAnalytics = async (startDate: Date, endDate: Date) => {
    const client = await getSupabase();
    
    const [ordersRes, productsRes] = await Promise.all([
      client.from('orders')
        .select('*, items:order_items(quantity, price, product_id)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      client.from('products').select('*')
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];

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
      topProducts,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.filter(o => o.status !== 'cancelled').length : 0,
      orders
    };
  };

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics', timeRange, customStartDate?.toISOString(), customEndDate?.toISOString()],
    enabled: !!user && !!supabase,
    queryFn: () => fetchAnalytics(dateRange.start, dateRange.end)
  });

  const { data: previousAnalytics } = useQuery({
    queryKey: ['admin-analytics-previous', timeRange, customStartDate?.toISOString(), customEndDate?.toISOString()],
    enabled: !!user && !!supabase && compareMode,
    queryFn: () => fetchAnalytics(previousDateRange.start, previousDateRange.end)
  });

  const getTimeData = (orders: any[], range: TimeRange, label: string) => {
    const timeData: { date: string; [key: string]: number | string }[] = [];
    
    if (range === 'hour') {
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
          [label]: intervalOrders.length,
          [`revenue_${label}`]: intervalOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
        });
      }
    } else if (range === 'day') {
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
          [label]: hourOrders.length,
          [`revenue_${label}`]: hourOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
        });
      }
    } else if (range === 'year') {
      for (let i = 11; i >= 0; i--) {
        const monthStart = subMonths(startOfMonth(new Date()), i);
        const monthEnd = subMonths(startOfMonth(new Date()), i - 1);
        const monthOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= monthStart && orderDate < monthEnd;
        });
        timeData.push({
          date: format(monthStart, 'MMM', { locale: ar }),
          [label]: monthOrders.length,
          [`revenue_${label}`]: monthOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
        });
      }
    } else {
      const numDays = range === 'week' ? 7 : 30;
      for (let i = numDays - 1; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStr = day.toISOString().split('T')[0];
        const dayOrders = orders.filter(o => o.created_at?.startsWith(dayStr));
        timeData.push({
          date: format(day, 'd MMM', { locale: ar }),
          [label]: dayOrders.length,
          [`revenue_${label}`]: dayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
        });
      }
    }
    return timeData;
  };

  const chartData = useMemo(() => {
    if (!analytics?.orders) return [];
    
    const currentData = getTimeData(analytics.orders, timeRange, 'current');
    
    if (compareMode && previousAnalytics?.orders) {
      const previousData = getTimeData(previousAnalytics.orders, timeRange, 'previous');
      return currentData.map((item, index) => ({
        ...item,
        previous: previousData[index]?.previous || 0,
        revenue_previous: previousData[index]?.revenue_previous || 0
      }));
    }
    
    return currentData;
  }, [analytics, previousAnalytics, timeRange, compareMode]);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

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

            {/* Compare Mode Toggle */}
            <div className="flex items-center gap-2 mr-auto border-r border-border pr-4">
              <GitCompare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">مقارنة مع الفترة السابقة</span>
              <Switch checked={compareMode} onCheckedChange={setCompareMode} />
            </div>
          </div>
          
          {compareMode && (
            <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 bg-primary rounded-full" />
                الفترة الحالية: {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
              </span>
              <span className="mx-4">|</span>
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 bg-muted-foreground rounded-full" />
                الفترة السابقة: {format(previousDateRange.start, 'dd/MM/yyyy')} - {format(previousDateRange.end, 'dd/MM/yyyy')}
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card h-32 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards with Comparison */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <CompareStatCard
                icon={<DollarSign className="w-6 h-6" />}
                label="إجمالي الإيرادات"
                value={analytics?.totalRevenue || 0}
                previousValue={previousAnalytics?.totalRevenue}
                format={(v) => `${v.toLocaleString()} دج`}
                color="bg-green-500"
                showComparison={compareMode}
              />
              <CompareStatCard
                icon={<ShoppingCart className="w-6 h-6" />}
                label="إجمالي الطلبات"
                value={analytics?.totalOrders || 0}
                previousValue={previousAnalytics?.totalOrders}
                color="bg-blue-500"
                showComparison={compareMode}
              />
              <CompareStatCard
                icon={<Package className="w-6 h-6" />}
                label="المنتجات النشطة"
                value={analytics?.activeProducts || 0}
                previousValue={previousAnalytics?.activeProducts}
                format={(v) => `${v}/${analytics?.totalProducts}`}
                color="bg-purple-500"
                showComparison={compareMode}
              />
              <CompareStatCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="متوسط قيمة الطلب"
                value={Math.round(analytics?.avgOrderValue || 0)}
                previousValue={previousAnalytics ? Math.round(previousAnalytics.avgOrderValue || 0) : undefined}
                format={(v) => `${v} دج`}
                color="bg-orange-500"
                showComparison={compareMode}
              />
            </div>

            {/* Order Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatusCard icon={<Clock />} label="معلق" value={analytics?.pendingOrders || 0} previousValue={previousAnalytics?.pendingOrders} color="text-yellow-500" bgColor="bg-yellow-500/10" showComparison={compareMode} />
              <StatusCard icon={<CheckCircle />} label="مؤكد" value={analytics?.confirmedOrders || 0} previousValue={previousAnalytics?.confirmedOrders} color="text-blue-500" bgColor="bg-blue-500/10" showComparison={compareMode} />
              <StatusCard icon={<Truck />} label="تم الشحن" value={analytics?.shippedOrders || 0} previousValue={previousAnalytics?.shippedOrders} color="text-purple-500" bgColor="bg-purple-500/10" showComparison={compareMode} />
              <StatusCard icon={<CheckCircle />} label="تم التسليم" value={analytics?.deliveredOrders || 0} previousValue={previousAnalytics?.deliveredOrders} color="text-green-500" bgColor="bg-green-500/10" showComparison={compareMode} />
              <StatusCard icon={<XCircle />} label="ملغى" value={analytics?.cancelledOrders || 0} previousValue={previousAnalytics?.cancelledOrders} color="text-red-500" bgColor="bg-red-500/10" showComparison={compareMode} />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Orders over Time */}
              <div className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
                <h3 className="text-lg font-bold mb-4">الطلبات خلال {timeRangeLabels[timeRange]}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
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
                    {compareMode && <Legend />}
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2} 
                      dot={{ fill: 'hsl(var(--primary))' }}
                      name="الفترة الحالية"
                    />
                    {compareMode && (
                      <Line 
                        type="monotone" 
                        dataKey="previous" 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={{ fill: 'hsl(var(--muted-foreground))' }}
                        name="الفترة السابقة"
                      />
                    )}
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
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString()} دج`, 
                        name === 'revenue_current' ? 'الفترة الحالية' : 'الفترة السابقة'
                      ]}
                    />
                    {compareMode && <Legend />}
                    <Bar 
                      dataKey="revenue_current" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      name="الفترة الحالية"
                    />
                    {compareMode && (
                      <Bar 
                        dataKey="revenue_previous" 
                        fill="hsl(var(--muted-foreground))" 
                        radius={[4, 4, 0, 0]} 
                        name="الفترة السابقة"
                      />
                    )}
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

function CompareStatCard({ 
  icon, 
  label, 
  value, 
  previousValue, 
  format = (v) => v.toString(), 
  color,
  showComparison 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  previousValue?: number;
  format?: (v: number) => string;
  color: string;
  showComparison: boolean;
}) {
  const change = previousValue !== undefined ? ((value - previousValue) / (previousValue || 1)) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="bg-card rounded-xl p-4 shadow-village-sm border border-border">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-bold">{format(value)}</p>
      {showComparison && previousValue !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change).toFixed(1)}%</span>
          <span className="text-muted-foreground text-xs">({format(previousValue)})</span>
        </div>
      )}
    </div>
  );
}

function StatusCard({ 
  icon, 
  label, 
  value, 
  previousValue,
  color, 
  bgColor,
  showComparison 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  previousValue?: number;
  color: string; 
  bgColor: string;
  showComparison: boolean;
}) {
  const change = previousValue !== undefined ? value - previousValue : 0;
  
  return (
    <div className={`${bgColor} rounded-xl p-4 border border-border`}>
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {showComparison && previousValue !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">
          {change >= 0 ? '+' : ''}{change} من السابق ({previousValue})
        </p>
      )}
    </div>
  );
}
