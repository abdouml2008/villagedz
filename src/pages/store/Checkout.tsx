import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Wilaya } from '@/types/store';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, totalPrice: cartTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    wilayaId: '',
    deliveryType: 'office' as 'home' | 'office'
  });

  // Check if there's a direct item from "Buy Now"
  const directItem = location.state?.directItem as CartItem | undefined;
  
  // Use direct item if present, otherwise use cart
  const items = useMemo(() => {
    if (directItem) {
      return [directItem];
    }
    return cartItems;
  }, [directItem, cartItems]);

  const totalPrice = useMemo(() => {
    if (directItem) {
      return directItem.product.price * directItem.quantity;
    }
    return cartTotalPrice;
  }, [directItem, cartTotalPrice]);

  const { data: wilayas, isLoading: wilayasLoading } = useQuery({
    queryKey: ['wilayas'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('wilayas').select('*').order('code');
      if (error) throw error;
      return data as Wilaya[];
    }
  });

  const selectedWilaya = wilayas?.find(w => w.id.toString() === form.wilayaId);
  const deliveryPrice = selectedWilaya 
    ? (form.deliveryType === 'home' ? selectedWilaya.home_delivery_price : selectedWilaya.office_delivery_price)
    : 0;
  const finalTotal = totalPrice + deliveryPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.wilayaId) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (items.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    setLoading(true);
    try {
      const client = await getSupabase();
      const { data: order, error: orderError } = await client
        .from('orders')
        .insert({
          customer_first_name: form.firstName,
          customer_last_name: form.lastName,
          customer_phone: form.phone,
          wilaya_id: parseInt(form.wilayaId),
          delivery_type: form.deliveryType,
          delivery_price: deliveryPrice,
          total_price: finalTotal
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
        price: item.product.price
      }));

      const { error: itemsError } = await client.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Only clear cart if not a direct purchase
      if (!directItem) {
        clearCart();
      }
      toast.success('تم إرسال طلبك بنجاح!');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6 bg-card rounded-xl p-6 shadow-village-sm border border-border">
            <h2 className="text-xl font-bold">معلومات التوصيل</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">الاسم</Label>
                <Input id="firstName" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
              </div>
              <div>
                <Label htmlFor="lastName">اللقب</Label>
                <Input id="lastName" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="05XXXXXXXX" required />
            </div>

            <div>
              <Label>الولاية</Label>
              <Select value={form.wilayaId} onValueChange={v => setForm({...form, wilayaId: v})}>
                <SelectTrigger><SelectValue placeholder={wilayasLoading ? "جاري التحميل..." : "اختر الولاية"} /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {wilayas?.map(w => (
                    <SelectItem key={w.id} value={w.id.toString()}>{w.code} - {w.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>نوع التوصيل</Label>
              <RadioGroup value={form.deliveryType} onValueChange={v => setForm({...form, deliveryType: v as 'home' | 'office'})} className="mt-2">
                <div className="flex items-center space-x-reverse space-x-3 p-4 border border-border rounded-lg">
                  <RadioGroupItem value="office" id="office" />
                  <Label htmlFor="office" className="flex-1 cursor-pointer">
                    <span className="font-medium">توصيل للمكتب</span>
                    <span className="block text-sm text-muted-foreground">{selectedWilaya?.office_delivery_price || 400} دج</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-reverse space-x-3 p-4 border border-border rounded-lg">
                  <RadioGroupItem value="home" id="home" />
                  <Label htmlFor="home" className="flex-1 cursor-pointer">
                    <span className="font-medium">توصيل للمنزل</span>
                    <span className="block text-sm text-muted-foreground">{selectedWilaya?.home_delivery_price || 600} دج</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-village-md border border-border h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4">ملخص الطلب</h2>
            <div className="space-y-3 mb-4 max-h-60 overflow-auto">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>{item.product.price * item.quantity} دج</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between"><span>المنتجات</span><span>{totalPrice} دج</span></div>
              <div className="flex justify-between"><span>التوصيل</span><span>{deliveryPrice} دج</span></div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                <span>الإجمالي</span><span className="text-primary">{finalTotal} دج</span>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-6 gradient-primary text-primary-foreground text-lg py-6">
              {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
            </Button>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}