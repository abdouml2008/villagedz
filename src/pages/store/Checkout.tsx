import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { getSupabase } from '@/hooks/useSupabase';
import { StoreLayout } from '@/components/store/StoreLayout';
import { useCart, getItemPrice } from '@/hooks/useCart';
import { CartItem, Coupon } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Wilaya } from '@/types/store';
import { Tag, X, Check, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

// Validation schema for order form
const orderFormSchema = z.object({
  firstName: z.string()
    .trim()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(50, 'الاسم يجب أن لا يتجاوز 50 حرف')
    .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, 'الاسم يجب أن يحتوي على حروف فقط'),
  lastName: z.string()
    .trim()
    .min(2, 'اللقب يجب أن يكون حرفين على الأقل')
    .max(50, 'اللقب يجب أن لا يتجاوز 50 حرف')
    .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, 'اللقب يجب أن يحتوي على حروف فقط'),
  phone: z.string()
    .trim()
    .regex(/^0[567][0-9]{8}$/, 'رقم الهاتف يجب أن يكون بالصيغة 05XXXXXXXX أو 06XXXXXXXX أو 07XXXXXXXX'),
  wilayaId: z.string().min(1, 'يرجى اختيار الولاية'),
  deliveryType: z.enum(['home', 'office'])
});

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { items: cartItems, totalPrice: cartTotalPrice, totalDiscount: cartTotalDiscount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
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

  const { totalPrice, totalDiscount } = useMemo(() => {
    if (directItem) {
      const priceInfo = getItemPrice(directItem);
      return { 
        totalPrice: priceInfo.discountedPrice, 
        totalDiscount: priceInfo.originalPrice - priceInfo.discountedPrice 
      };
    }
    return { totalPrice: cartTotalPrice, totalDiscount: cartTotalDiscount };
  }, [directItem, cartTotalPrice, cartTotalDiscount]);

  // Calculate coupon discount
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return totalPrice * (appliedCoupon.discount_value / 100);
    }
    return Math.min(appliedCoupon.discount_value, totalPrice);
  }, [appliedCoupon, totalPrice]);

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
  const finalTotal = totalPrice - couponDiscount + deliveryPrice;

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error(t.checkout.enterCoupon);
      return;
    }
    
    setCouponLoading(true);
    try {
      const client = await getSupabase();
      // Get product IDs from cart items
      const productIds = items.map(item => item.product.id);
      
      // Use secure RPC to validate coupon without exposing coupon details
      const { data: result, error } = await client.rpc('validate_coupon_code', {
        p_code: couponCode.trim(),
        p_order_amount: totalPrice,
        p_product_ids: productIds
      });
      
      if (error) throw error;
      
      if (!result || !result.valid) {
        toast.error(result?.error || t.checkout.invalidCoupon);
        return;
      }
      
      // Create a minimal coupon object with only what we need
      setAppliedCoupon({
        id: result.coupon_id,
        code: couponCode.toUpperCase().trim(),
        discount_type: result.discount_type,
        discount_value: result.discount_value,
        is_active: true,
        applies_to_all: result.applies_to_all,
        created_at: ''
      } as Coupon);
      toast.success(t.checkout.couponApplied);
    } catch (error) {
      logger.error('Coupon validation error:', error);
      toast.error(t.checkout.couponError);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success(t.checkout.couponRemoved);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with zod
    const validationResult = orderFormSchema.safeParse(form);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }
    
    if (items.length === 0) {
      toast.error(t.checkout.emptyCart);
      return;
    }
    
    // Sanitize inputs
    const sanitizedData = {
      firstName: validationResult.data.firstName.trim(),
      lastName: validationResult.data.lastName.trim(),
      phone: validationResult.data.phone.trim(),
      wilayaId: validationResult.data.wilayaId,
      deliveryType: validationResult.data.deliveryType
    };

    setLoading(true);
    try {
      const client = await getSupabase();
      
      // Check stock availability for all items
      for (const item of items) {
        const { data: currentProduct, error: stockCheckError } = await client
          .from('products')
          .select('stock, name')
          .eq('id', item.product.id)
          .maybeSingle();
        
        if (stockCheckError) throw stockCheckError;
        
        if (!currentProduct || currentProduct.stock < item.quantity) {
          toast.error(t.checkout.quantityUnavailable.replace('{name}', currentProduct?.name || item.product.name).replace('{available}', String(currentProduct?.stock || 0)));
          setLoading(false);
          return;
        }
      }
      
      // Generate order ID client-side to avoid needing SELECT after INSERT
      const orderId = crypto.randomUUID();
      
      const { error: orderError } = await client
        .from('orders')
        .insert({
          id: orderId,
          customer_first_name: sanitizedData.firstName,
          customer_last_name: sanitizedData.lastName,
          customer_phone: sanitizedData.phone,
          wilaya_id: parseInt(sanitizedData.wilayaId),
          delivery_type: sanitizedData.deliveryType,
          delivery_price: deliveryPrice,
          total_price: finalTotal,
          coupon_code: appliedCoupon?.code || null,
          coupon_discount: couponDiscount
        });
      if (orderError) throw orderError;

      // Atomically apply coupon using database function to prevent race conditions
      if (appliedCoupon) {
        const productIds = items.map(item => item.product.id);
        const { data: couponResult, error: couponError } = await client.rpc('apply_coupon_atomic', {
          p_coupon_code: appliedCoupon.code,
          p_order_amount: totalPrice,
          p_product_ids: productIds
        });
        
        if (couponError) {
          logger.error('Coupon atomic apply error:', couponError);
          // Continue with order - coupon was already validated client-side
        } else if (couponResult && !couponResult.success) {
          // Coupon is no longer valid (e.g., max uses reached during race condition)
          // The order is already created, but we should log this
          logger.warn('Coupon validation failed during order:', couponResult.error);
        }
      }

      const orderItems = items.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
        price: item.product.price
      }));

      const { error: itemsError } = await client.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Decrease stock for each product
      for (const item of items) {
        await client.rpc('decrease_product_stock', {
          p_product_id: item.product.id,
          p_quantity: item.quantity
        });
      }

      // Only clear cart if not a direct purchase
      if (!directItem) {
        clearCart();
      }
      toast.success(t.checkout.orderSuccess);
      navigate('/order-confirmation');
    } catch (error) {
      logger.error('Order submission error:', error);
      toast.error(t.checkout.orderError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t.checkout.title}</h1>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6 bg-card rounded-xl p-6 shadow-village-sm border border-border">
            <h2 className="text-xl font-bold">{t.checkout.deliveryInfo}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t.checkout.firstName}</Label>
                <Input id="firstName" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
              </div>
              <div>
                <Label htmlFor="lastName">{t.checkout.lastName}</Label>
                <Input id="lastName" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">{t.checkout.phone}</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder={t.checkout.phonePlaceholder} required />
            </div>

            <div>
              <Label>{t.checkout.wilaya}</Label>
              <Select value={form.wilayaId} onValueChange={v => setForm({...form, wilayaId: v})}>
                <SelectTrigger><SelectValue placeholder={wilayasLoading ? t.common.loading : t.checkout.selectWilaya} /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {wilayas?.map(w => (
                    <SelectItem key={w.id} value={w.id.toString()}>{w.code} - {language === 'ar' ? w.name_ar : w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t.checkout.deliveryType}</Label>
              <RadioGroup value={form.deliveryType} onValueChange={v => setForm({...form, deliveryType: v as 'home' | 'office'})} className="mt-2">
                <div className="flex items-center space-x-reverse space-x-3 p-4 border border-border rounded-lg">
                  <RadioGroupItem value="office" id="office" />
                  <Label htmlFor="office" className="flex-1 cursor-pointer">
                    <span className="font-medium">{t.checkout.officeDelivery}</span>
                    <span className="block text-sm text-muted-foreground">{selectedWilaya?.office_delivery_price || 400} {t.common.currency}</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-reverse space-x-3 p-4 border border-border rounded-lg">
                  <RadioGroupItem value="home" id="home" />
                  <Label htmlFor="home" className="flex-1 cursor-pointer">
                    <span className="font-medium">{t.checkout.homeDelivery}</span>
                    <span className="block text-sm text-muted-foreground">{selectedWilaya?.home_delivery_price || 600} {t.common.currency}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-village-md border border-border h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4">{t.checkout.orderSummary}</h2>
            <div className="space-y-3 mb-4 max-h-60 overflow-auto">
              {items.map((item, i) => {
                const priceInfo = getItemPrice(item);
                return (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.product.name} x{item.quantity}</span>
                    <div className="text-left">
                      {priceInfo.hasDiscount ? (
                        <>
                          <span className="text-green-600">{priceInfo.discountedPrice.toFixed(0)} {t.common.currency}</span>
                          <span className="text-muted-foreground line-through text-xs mr-1">{priceInfo.originalPrice.toFixed(0)}</span>
                        </>
                      ) : (
                        <span>{priceInfo.originalPrice.toFixed(0)} {t.common.currency}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Input */}
            <div className="border-t border-border pt-4 mb-4">
              <Label className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4" />
                {t.checkout.couponCode}
              </Label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-500/10 text-green-600 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">{appliedCoupon.code}</span>
                    <span className="text-sm">
                      ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `${appliedCoupon.discount_value} ${t.common.currency}`})
                    </span>
                  </div>
                  <button type="button" onClick={removeCoupon} className="hover:bg-green-500/20 p-1 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input 
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={t.checkout.enterCode}
                    className="uppercase"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={applyCoupon}
                    disabled={couponLoading}
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.common.apply}
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between"><span>{t.checkout.products}</span><span>{(totalPrice + totalDiscount).toFixed(0)} {t.common.currency}</span></div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600"><span>{t.checkout.quantityDiscount}</span><span>-{totalDiscount.toFixed(0)} {t.common.currency}</span></div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600"><span>{t.checkout.couponDiscount}</span><span>-{couponDiscount.toFixed(0)} {t.common.currency}</span></div>
              )}
              <div className="flex justify-between"><span>{t.cart.delivery}</span><span>{deliveryPrice} {t.common.currency}</span></div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                <span>{t.cart.total}</span><span className="text-primary">{finalTotal.toFixed(0)} {t.common.currency}</span>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-6 gradient-primary text-primary-foreground text-lg py-6">
              {loading ? t.checkout.submitting : t.checkout.confirmOrder}
            </Button>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}