import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Order, Wilaya, OrderItem, Product } from '@/types/store';

type OrderWithDetails = Order & { wilaya: Wilaya; items: (OrderItem & { product: Product })[] };

interface EditOrderItem {
  id?: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface EditOrderDialogProps {
  order: OrderWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOrderDialog({ order, open, onOpenChange }: EditOrderDialogProps) {
  const queryClient = useQueryClient();
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<EditOrderItem[]>([]);
  
  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['admin-products-for-edit'],
    enabled: open,
    queryFn: async () => {
      const client = await getSupabase();
      const { data } = await client.from('products').select('*').eq('is_active', true);
      return data as Product[];
    }
  });
  
  // Fetch wilayas
  const { data: wilayas } = useQuery({
    queryKey: ['wilayas-for-edit'],
    enabled: open,
    queryFn: async () => {
      const client = await getSupabase();
      const { data } = await client.from('wilayas').select('*').order('code');
      return data as Wilaya[];
    }
  });
  
  // Initialize form when order changes
  useEffect(() => {
    if (order && open) {
      setFirstName(order.customer_first_name);
      setLastName(order.customer_last_name);
      setPhone(order.customer_phone);
      setWilayaId(order.wilaya_id);
      setDeliveryType(order.delivery_type as 'home' | 'office');
      setNotes(order.notes || '');
      setItems(order.items.map(item => ({
        id: item.id,
        product_id: item.product_id || '',
        size: item.size || '',
        color: item.color || '',
        quantity: item.quantity,
        price: item.price
      })));
    }
  }, [order, open]);
  
  // Calculate delivery price
  const deliveryPrice = useMemo(() => {
    if (!wilayaId || !wilayas) return 0;
    const wilaya = wilayas.find(w => w.id === wilayaId);
    if (!wilaya) return 0;
    return deliveryType === 'home' ? (wilaya.home_delivery_price || 0) : (wilaya.office_delivery_price || 0);
  }, [wilayaId, wilayas, deliveryType]);
  
  // Calculate items total
  const itemsTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);
  
  // Calculate grand total
  const grandTotal = useMemo(() => {
    const couponDiscount = order?.coupon_discount || 0;
    return itemsTotal + deliveryPrice - couponDiscount;
  }, [itemsTotal, deliveryPrice, order?.coupon_discount]);
  
  // Get product by ID
  const getProduct = (productId: string) => products?.find(p => p.id === productId);
  
  // Add new item
  const addItem = () => {
    setItems([...items, { product_id: '', size: '', color: '', quantity: 1, price: 0 }]);
  };
  
  // Remove item
  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('يجب أن يحتوي الطلب على منتج واحد على الأقل');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };
  
  // Update item
  const updateItem = (index: number, field: keyof EditOrderItem, value: string | number) => {
    const newItems = [...items];
    
    if (field === 'product_id') {
      const product = getProduct(value as string);
      newItems[index] = {
        ...newItems[index],
        product_id: value as string,
        price: product?.price || 0,
        size: '',
        color: '',
        quantity: product?.min_quantity || 1
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setItems(newItems);
  };
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('No order');
      
      const client = await getSupabase();
      
      // Validate
      if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
        throw new Error('يرجى ملء جميع بيانات الزبون');
      }
      if (!wilayaId) {
        throw new Error('يرجى اختيار الولاية');
      }
      if (items.length === 0 || items.some(item => !item.product_id)) {
        throw new Error('يرجى إضافة منتج واحد على الأقل');
      }
      
      // Get old items for stock management
      const oldItems = order.items;
      
      // Only adjust stock if order is not cancelled
      if (order.status !== 'cancelled') {
        // Restore stock for old items
        for (const item of oldItems) {
          if (item.product_id) {
            await client.rpc('increase_product_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });
          }
        }
        
        // Decrease stock for new items
        for (const item of items) {
          if (item.product_id) {
            await client.rpc('decrease_product_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });
          }
        }
      }
      
      // Delete old order items
      await client.from('order_items').delete().eq('order_id', order.id);
      
      // Insert new order items
      const newOrderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        size: item.size || null,
        color: item.color || null,
        quantity: item.quantity,
        price: item.price
      }));
      
      const { error: itemsError } = await client.from('order_items').insert(newOrderItems);
      if (itemsError) throw itemsError;
      
      // Update order
      const { error: orderError } = await client.from('orders').update({
        customer_first_name: firstName.trim(),
        customer_last_name: lastName.trim(),
        customer_phone: phone.trim(),
        wilaya_id: wilayaId,
        delivery_type: deliveryType,
        delivery_price: deliveryPrice,
        total_price: grandTotal,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString()
      }).eq('id', order.id);
      
      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['orders-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('تم تحديث الطلب بنجاح');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'حدث خطأ أثناء التحديث');
    }
  });
  
  if (!order) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الطلب #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">معلومات الزبون</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>الاسم الأول</Label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>الاسم الأخير</Label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <Label>الولاية</Label>
                <Select value={wilayaId?.toString() || ''} onValueChange={v => setWilayaId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                  <SelectContent>
                    {wilayas?.map(w => (
                      <SelectItem key={w.id} value={w.id.toString()}>{w.code} - {w.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع التوصيل</Label>
                <Select value={deliveryType} onValueChange={v => setDeliveryType(v as 'home' | 'office')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">توصيل للمنزل</SelectItem>
                    <SelectItem value="office">توصيل للمكتب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Products */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">المنتجات</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة منتج
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => {
                const product = getProduct(item.product_id);
                return (
                  <div key={index} className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Product Select */}
                        <div>
                          <Label className="text-xs">المنتج</Label>
                          <Select value={item.product_id} onValueChange={v => updateItem(index, 'product_id', v)}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="اختر" /></SelectTrigger>
                            <SelectContent>
                              {products?.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Size */}
                        <div>
                          <Label className="text-xs">المقاس</Label>
                          <Select value={item.size || 'none'} onValueChange={v => updateItem(index, 'size', v === 'none' ? '' : v)}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="اختر" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">بدون</SelectItem>
                              {product?.sizes?.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Color */}
                        <div>
                          <Label className="text-xs">اللون</Label>
                          <Select value={item.color || 'none'} onValueChange={v => updateItem(index, 'color', v === 'none' ? '' : v)}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="اختر" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">بدون</SelectItem>
                              {product?.colors?.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Quantity */}
                        <div>
                          <Label className="text-xs">الكمية</Label>
                          <Input 
                            type="number" 
                            min={product?.min_quantity || 1}
                            max={product?.max_quantity || 100}
                            value={item.quantity} 
                            onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      السعر: {item.price} دج × {item.quantity} = <span className="font-semibold text-foreground">{item.price * item.quantity} دج</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." />
          </div>
          
          {/* Totals */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>مجموع المنتجات:</span>
              <span className="font-semibold">{itemsTotal} دج</span>
            </div>
            <div className="flex justify-between">
              <span>سعر التوصيل:</span>
              <span className="font-semibold">{deliveryPrice} دج</span>
            </div>
            {order.coupon_discount ? (
              <div className="flex justify-between text-green-600">
                <span>خصم الكوبون ({order.coupon_code}):</span>
                <span className="font-semibold">-{order.coupon_discount} دج</span>
              </div>
            ) : null}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>المجموع الكلي:</span>
              <span className="text-primary">{grandTotal} دج</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
