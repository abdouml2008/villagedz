import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Order, Wilaya, OrderItem, Product } from '@/types/store';
import { Trash2, CheckCircle, XCircle, Clock, Truck, Package, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusLabels: Record<string, string> = {
  pending: 'معلق',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغى'
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function AdminOrders() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) navigate('/admin');
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', filter],
    enabled: !!user && !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      let query = client
        .from('orders')
        .select('*, wilaya:wilayas(*), items:order_items(*, product:products(*))')
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data } = await query;
      return data as (Order & { wilaya: Wilaya; items: (OrderItem & { product: Product })[] })[];
    }
  });

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!orders || !searchQuery.trim()) return orders;
    const query = searchQuery.trim().toLowerCase();
    return orders.filter(order => 
      order.customer_first_name.toLowerCase().includes(query) ||
      order.customer_last_name.toLowerCase().includes(query) ||
      order.customer_phone.includes(query) ||
      `${order.customer_first_name} ${order.customer_last_name}`.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  const { data: counts } = useQuery({
    queryKey: ['orders-counts'],
    enabled: !!user && !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const [pending, confirmed, shipped, delivered, cancelled] = await Promise.all([
        client.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
        client.from('orders').select('id', { count: 'exact' }).eq('status', 'confirmed'),
        client.from('orders').select('id', { count: 'exact' }).eq('status', 'shipped'),
        client.from('orders').select('id', { count: 'exact' }).eq('status', 'delivered'),
        client.from('orders').select('id', { count: 'exact' }).eq('status', 'cancelled'),
      ]);
      return {
        pending: pending.count || 0,
        confirmed: confirmed.count || 0,
        shipped: shipped.count || 0,
        delivered: delivered.count || 0,
        cancelled: cancelled.count || 0
      };
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const client = await getSupabase();
      const { error } = await client.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      toast.success('تم تحديث الحالة');
    }
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabase();
      await client.from('order_items').delete().eq('order_id', id);
      const { error } = await client.from('orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      toast.success('تم حذف الطلب');
    }
  });

  const exportToExcel = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      toast.error('لا توجد طلبات للتصدير');
      return;
    }

    const data = filteredOrders.map(order => ({
      'رقم الطلب': order.id.slice(0, 8),
      'الاسم': `${order.customer_first_name} ${order.customer_last_name}`,
      'رقم الهاتف': order.customer_phone,
      'الولاية': order.wilaya?.name_ar || '',
      'نوع التوصيل': order.delivery_type === 'home' ? 'منزل' : 'مكتب',
      'المنتجات': order.items?.map(i => `${i.product?.name} x${i.quantity}`).join(', ') || '',
      'سعر التوصيل': order.delivery_price,
      'المجموع': order.total_price,
      'الحالة': statusLabels[order.status] || order.status,
      'التاريخ': new Date(order.created_at).toLocaleDateString('ar-DZ'),
      'ملاحظات': order.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الطلبات');
    XLSX.writeFile(wb, `orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('تم تصدير الطلبات بنجاح');
  };

  if (loading || supabaseLoading || roleLoading || !user || !hasRole) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="إدارة الطلبات" />

      <div className="container mx-auto px-4 py-8">
        {/* Status Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Link to="/admin/orders/pending" className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors">
            <Clock className="w-6 h-6 text-yellow-500 mb-2" />
            <p className="text-sm text-muted-foreground">معلق</p>
            <p className="text-2xl font-bold text-yellow-500">{counts?.pending || 0}</p>
          </Link>
          <Link to="/admin/orders/confirmed" className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
            <CheckCircle className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-sm text-muted-foreground">مؤكد</p>
            <p className="text-2xl font-bold text-blue-500">{counts?.confirmed || 0}</p>
          </Link>
          <Link to="/admin/orders/shipped" className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
            <Truck className="w-6 h-6 text-purple-500 mb-2" />
            <p className="text-sm text-muted-foreground">مشحون</p>
            <p className="text-2xl font-bold text-purple-500">{counts?.shipped || 0}</p>
          </Link>
          <Link to="/admin/orders/delivered" className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 hover:bg-green-500/20 transition-colors">
            <Package className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">مسلم</p>
            <p className="text-2xl font-bold text-green-500">{counts?.delivered || 0}</p>
          </Link>
          <Link to="/admin/orders/cancelled" className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 hover:bg-red-500/20 transition-colors">
            <XCircle className="w-6 h-6 text-red-500 mb-2" />
            <p className="text-sm text-muted-foreground">ملغى</p>
            <p className="text-2xl font-bold text-red-500">{counts?.cancelled || 0}</p>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-2xl font-bold">الطلبات ({filteredOrders?.length || 0})</h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="shipped">مشحون</SelectItem>
                <SelectItem value="delivered">مسلم</SelectItem>
                <SelectItem value="cancelled">ملغى</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToExcel} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير Excel
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="bg-card h-32 rounded-xl animate-pulse" />)}</div>
        ) : filteredOrders?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders?.map(order => (
              <div key={order.id} className="bg-card rounded-xl p-6 shadow-village-sm border border-border">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-bold text-lg">{order.customer_first_name} {order.customer_last_name}</p>
                    <p className="text-muted-foreground">{order.customer_phone}</p>
                    <p className="text-sm">{order.wilaya?.name_ar} - {order.delivery_type === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب'}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-primary">{order.total_price} دج</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString('ar-DZ')}</p>
                  </div>
                </div>
                
                <div className="border-t border-border pt-4 mb-4">
                  <p className="font-semibold mb-2">المنتجات:</p>
                  <div className="space-y-1">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product?.name} x{item.quantity} {item.size && `(${item.size})`} {item.color && `[${item.color}]`}</span>
                        <span>{item.price * item.quantity} دج</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  <Select value={order.status} onValueChange={status => updateStatus.mutate({ id: order.id, status })}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف هذا الطلب نهائياً ولا يمكن استرجاعه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteOrder.mutate(order.id)} className="bg-destructive text-destructive-foreground">
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}