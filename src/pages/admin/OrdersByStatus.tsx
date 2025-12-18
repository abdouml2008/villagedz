import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Order, Wilaya, OrderItem, Product } from '@/types/store';
import { logger } from '@/lib/logger';
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

const statusConfig: Record<string, { label: string; title: string }> = {
  pending: { label: 'معلق', title: 'الطلبات المعلقة' },
  confirmed: { label: 'مؤكد', title: 'الطلبات المؤكدة' },
  shipped: { label: 'تم الشحن', title: 'الطلبات المشحونة' },
  delivered: { label: 'تم التسليم', title: 'الطلبات المسلمة' },
  cancelled: { label: 'ملغى', title: 'الطلبات الملغية' }
};

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

export default function OrdersByStatus() {
  const { status } = useParams<{ status: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) navigate('/admin');
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders-by-status', status],
    enabled: !!user && !!supabase && !!status,
    queryFn: async () => {
      const client = await getSupabase();
      const { data } = await client
        .from('orders')
        .select('*, wilaya:wilayas(*), items:order_items(*, product:products(*))')
        .eq('status', status)
        .order('created_at', { ascending: false });
      return data as (Order & { wilaya: Wilaya; items: (OrderItem & { product: Product })[] })[];
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus, oldStatus, orderItems }: { id: string; newStatus: string; oldStatus: string; orderItems: (OrderItem & { product: Product })[] }) => {
      const client = await getSupabase();
      
      logger.log('Updating order status');
      
      // If changing TO cancelled, restore stock
      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        for (const item of orderItems) {
          if (item.product_id) {
            const { error: rpcError } = await client.rpc('increase_product_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });
            if (rpcError) {
              logger.error('RPC error:', rpcError);
            }
          }
        }
      }
      
      // If changing FROM cancelled to another status, decrease stock
      if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
        for (const item of orderItems) {
          if (item.product_id) {
            const { error: rpcError } = await client.rpc('decrease_product_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });
            if (rpcError) logger.error('RPC error:', rpcError);
          }
        }
      }
      
      const { error } = await client.from('orders').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      toast.success('تم تحديث الحالة');
    }
  });

  const deleteOrder = useMutation({
    mutationFn: async ({ id, orderStatus, orderItems }: { id: string; orderStatus: string; orderItems: (OrderItem & { product: Product })[] }) => {
      const client = await getSupabase();
      
      // If order was not cancelled, restore stock before deleting
      if (orderStatus !== 'cancelled') {
        for (const item of orderItems) {
          if (item.product_id) {
            await client.rpc('increase_product_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });
          }
        }
      }
      
      await client.from('order_items').delete().eq('order_id', id);
      const { error } = await client.from('orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      toast.success('تم حذف الطلب');
    }
  });

  if (loading || supabaseLoading || roleLoading || !user || !hasRole) return null;

  const config = statusConfig[status || 'pending'];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title={config?.title || 'الطلبات'} />

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">{config?.title} ({orders?.length || 0})</h2>

        {isLoading ? (
          <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="bg-card h-32 rounded-xl animate-pulse" />)}</div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">لا توجد طلبات {config?.label}</div>
        ) : (
          <div className="space-y-4">
            {orders?.map(order => (
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
                  <Select value={order.status} onValueChange={newStatus => updateStatus.mutate({ id: order.id, newStatus, oldStatus: order.status, orderItems: order.items })}>
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
                        <AlertDialogAction onClick={() => deleteOrder.mutate({ id: order.id, orderStatus: order.status, orderItems: order.items })} className="bg-destructive text-destructive-foreground">
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
