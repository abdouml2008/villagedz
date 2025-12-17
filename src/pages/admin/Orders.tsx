import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { Order, Wilaya, OrderItem, Product } from '@/types/store';

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

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) navigate('/admin');
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    enabled: !!user && !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const { data } = await client
        .from('orders')
        .select('*, wilaya:wilayas(*), items:order_items(*, product:products(*))')
        .order('created_at', { ascending: false });
      return data as (Order & { wilaya: Wilaya; items: (OrderItem & { product: Product })[] })[];
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
      toast.success('تم تحديث الحالة');
    }
  });

  if (loading || supabaseLoading || roleLoading || !user || !hasRole) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin/dashboard" className="text-muted-foreground hover:text-foreground"><ArrowRight className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">إدارة الطلبات</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">الطلبات ({orders?.length || 0})</h2>

        {isLoading ? (
          <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="bg-card h-32 rounded-xl animate-pulse" />)}</div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">لا توجد طلبات</div>
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

                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                  <Select value={order.status} onValueChange={status => updateStatus.mutate({ id: order.id, status })}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
