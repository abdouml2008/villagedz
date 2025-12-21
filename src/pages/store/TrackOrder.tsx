import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, Truck, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function TrackOrder() {
  const [phone, setPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const { t } = useTranslation();

  const statusConfig = {
    pending: { label: t.trackOrder.statusPending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    confirmed: { label: t.trackOrder.statusConfirmed, icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    shipped: { label: t.trackOrder.statusShipped, icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    delivered: { label: t.trackOrder.statusDelivered, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    cancelled: { label: t.trackOrder.statusCancelled, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' }
  };

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['track-orders', searchPhone],
    enabled: !!searchPhone,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('orders')
        .select(`*, wilaya:wilayas(name_ar, name), items:order_items(*, product:products(name, image_url))`)
        .eq('customer_phone', searchPhone)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim()) setSearchPhone(phone.trim());
  };

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t.trackOrder.title}</h1>
            <p className="text-muted-foreground">{t.trackOrder.description}</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 mb-8">
            <Input type="tel" placeholder={t.trackOrder.phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 text-lg py-6" dir="ltr" />
            <Button type="submit" size="lg" className="gradient-primary text-primary-foreground px-8"><Search className="w-5 h-5" /></Button>
          </form>

          {isLoading && <div className="space-y-4">{[1, 2].map(i => <div key={i} className="bg-card rounded-xl p-6 animate-pulse"><div className="h-6 bg-muted rounded w-1/3 mb-4" /><div className="h-4 bg-muted rounded w-1/2" /></div>)}</div>}

          {error && <div className="bg-destructive/10 text-destructive rounded-xl p-6 text-center"><AlertCircle className="w-12 h-12 mx-auto mb-2" /><p>{t.trackOrder.searchError}</p></div>}

          {searchPhone && !isLoading && orders?.length === 0 && (
            <div className="bg-card rounded-xl p-8 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t.trackOrder.noOrders}</h2>
              <p className="text-muted-foreground">{t.trackOrder.noOrdersDescription}</p>
            </div>
          )}

          {orders && orders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t.trackOrder.yourOrders} ({orders.length})</h2>
              {orders.map((order) => {
                const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <div key={order.id} className="bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center`}><StatusIcon className={`w-5 h-5 ${status.color}`} /></div>
                        <div>
                          <p className={`font-semibold ${status.color}`}>{status.label}</p>
                          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-primary">{order.total_price} {t.common.currency}</p>
                    </div>
                    <div className="border-t border-border pt-4 space-y-3">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.product?.image_url ? <img src={item.product.image_url} alt={item.product?.name} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground" /></div>}
                          <div className="flex-1">
                            <p className="font-medium">{item.product?.name || t.common.product}</p>
                            <p className="text-sm text-muted-foreground">{t.product.quantity}: {item.quantity} {item.size && `| ${t.product.size}: ${item.size}`} {item.color && `| ${t.product.color}: ${item.color}`}</p>
                          </div>
                          <p className="font-semibold">{item.price} {t.common.currency}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-4 mt-4 text-sm text-muted-foreground">
                      <p>{t.trackOrder.deliveryTo}: {order.wilaya?.name_ar || t.trackOrder.notSpecified} ({order.delivery_type === 'home' ? t.trackOrder.toHome : t.trackOrder.toOffice})</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}
