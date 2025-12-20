import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tag, Percent, DollarSign, Calendar, Users, Package } from 'lucide-react';
import { Coupon, Product } from '@/types/store';

export default function AdminCoupons() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
    applies_to_all: true
  });

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) navigate('/admin');
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    enabled: !!user && !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    }
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products-for-coupons'],
    enabled: !!user && !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('products').select('id, name, image_url').order('name');
      if (error) throw error;
      return data as Pick<Product, 'id' | 'name' | 'image_url'>[];
    }
  });

  const { data: couponProducts } = useQuery({
    queryKey: ['coupon-products', editCoupon?.id],
    enabled: !!editCoupon && !!supabase,
    queryFn: async () => {
      if (!editCoupon) return [];
      const client = await getSupabase();
      const { data, error } = await client.from('coupon_products').select('product_id').eq('coupon_id', editCoupon.id);
      if (error) throw error;
      return data.map(cp => cp.product_id);
    }
  });

  // Load coupon products when editing
  useEffect(() => {
    if (couponProducts) {
      setSelectedProductIds(couponProducts);
    }
  }, [couponProducts]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const client = await getSupabase();
      const couponData = {
        code: data.code.toUpperCase().trim(),
        discount_type: data.discount_type,
        discount_value: parseFloat(data.discount_value),
        min_order_amount: data.min_order_amount ? parseFloat(data.min_order_amount) : null,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        expires_at: data.expires_at || null,
        is_active: data.is_active,
        applies_to_all: data.applies_to_all
      };
      
      let couponId: string;
      
      if (editCoupon) {
        const { error } = await client.from('coupons').update(couponData).eq('id', editCoupon.id);
        if (error) throw error;
        couponId = editCoupon.id;
      } else {
        const { data: newCoupon, error } = await client.from('coupons').insert(couponData).select('id').single();
        if (error) throw error;
        couponId = newCoupon.id;
      }

      // Update coupon products if not applies_to_all
      if (!data.applies_to_all) {
        // Delete existing coupon products
        await client.from('coupon_products').delete().eq('coupon_id', couponId);
        
        // Insert new coupon products
        if (selectedProductIds.length > 0) {
          const couponProductsData = selectedProductIds.map(productId => ({
            coupon_id: couponId,
            product_id: productId
          }));
          const { error: cpError } = await client.from('coupon_products').insert(couponProductsData);
          if (cpError) throw cpError;
        }
      } else {
        // Clear coupon products if applies_to_all
        await client.from('coupon_products').delete().eq('coupon_id', couponId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-products'] });
      toast.success(editCoupon ? 'تم تحديث الكوبون' : 'تمت إضافة الكوبون');
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      if (error.message.includes('unique')) {
        toast.error('كود الكوبون موجود مسبقاً');
      } else {
        toast.error(`حدث خطأ: ${error.message}`);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabase();
      const { error } = await client.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('تم حذف الكوبون');
    },
    onError: (error: Error) => {
      toast.error(`فشل الحذف: ${error.message}`);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const client = await getSupabase();
      const { error } = await client.from('coupons').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('تم تحديث حالة الكوبون');
    }
  });

  const resetForm = () => {
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_uses: '',
      expires_at: '',
      is_active: true,
      applies_to_all: true
    });
    setEditCoupon(null);
    setSelectedProductIds([]);
  };

  const openEdit = (coupon: Coupon) => {
    setEditCoupon(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
      is_active: coupon.is_active,
      applies_to_all: coupon.applies_to_all ?? true
    });
    setDialogOpen(true);
  };

  const isExpired = (expires_at: string | null) => {
    if (!expires_at) return false;
    return new Date(expires_at) < new Date();
  };

  const isMaxUsesReached = (coupon: Coupon) => {
    if (!coupon.max_uses) return false;
    return coupon.used_count >= coupon.max_uses;
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading || supabaseLoading || roleLoading || !user || !hasRole) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="إدارة الكوبونات" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">الكوبونات ({coupons?.length || 0})</h2>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 ml-2" /> إضافة كوبون</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
                <div>
                  <Label>كود الكوبون</Label>
                  <Input 
                    value={form.code} 
                    onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} 
                    placeholder="SUMMER2024"
                    className="uppercase"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>نوع الخصم</Label>
                    <Select value={form.discount_type} onValueChange={v => setForm({...form, discount_type: v as 'percentage' | 'fixed'})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                        <SelectItem value="fixed">مبلغ ثابت (دج)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>قيمة الخصم</Label>
                    <Input 
                      type="number" 
                      value={form.discount_value} 
                      onChange={e => setForm({...form, discount_value: e.target.value})} 
                      placeholder={form.discount_type === 'percentage' ? '10' : '500'}
                      min="1"
                      max={form.discount_type === 'percentage' ? '100' : undefined}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الحد الأدنى للطلب (اختياري)</Label>
                    <Input 
                      type="number" 
                      value={form.min_order_amount} 
                      onChange={e => setForm({...form, min_order_amount: e.target.value})} 
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <Label>عدد الاستخدامات (اختياري)</Label>
                    <Input 
                      type="number" 
                      value={form.max_uses} 
                      onChange={e => setForm({...form, max_uses: e.target.value})} 
                      placeholder="100"
                    />
                  </div>
                </div>

                <div>
                  <Label>تاريخ انتهاء الصلاحية (اختياري)</Label>
                  <Input 
                    type="date" 
                    value={form.expires_at} 
                    onChange={e => setForm({...form, expires_at: e.target.value})} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>الكوبون نشط</Label>
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} />
                </div>

                {/* Product Selection Section */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      يطبق على جميع المنتجات
                    </Label>
                    <Switch 
                      checked={form.applies_to_all} 
                      onCheckedChange={v => setForm({...form, applies_to_all: v})} 
                    />
                  </div>

                  {!form.applies_to_all && (
                    <div className="space-y-2">
                      <Label>اختر المنتجات ({selectedProductIds.length} منتج محدد)</Label>
                      <ScrollArea className="h-48 border border-border rounded-lg p-2">
                        <div className="space-y-2">
                          {products?.map(product => (
                            <div 
                              key={product.id} 
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedProductIds.includes(product.id) 
                                  ? 'bg-primary/10 border border-primary/30' 
                                  : 'hover:bg-muted border border-transparent'
                              }`}
                              onClick={() => toggleProductSelection(product.id)}
                            >
                              <Checkbox 
                                checked={selectedProductIds.includes(product.id)}
                                onCheckedChange={() => toggleProductSelection(product.id)}
                              />
                              {product.image_url && (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name} 
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <span className="flex-1 truncate">{product.name}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {!form.applies_to_all && selectedProductIds.length === 0 && (
                        <p className="text-sm text-destructive">يرجى اختيار منتج واحد على الأقل</p>
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending || (!form.applies_to_all && selectedProductIds.length === 0)} 
                  className="w-full"
                >
                  {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-card h-40 rounded-xl animate-pulse" />)}
          </div>
        ) : coupons?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>لا توجد كوبونات بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons?.map(coupon => {
              const expired = isExpired(coupon.expires_at);
              const maxReached = isMaxUsesReached(coupon);
              const isInactive = !coupon.is_active || expired || maxReached;
              
              return (
                <div 
                  key={coupon.id} 
                  className={`bg-card rounded-xl p-5 shadow-village-sm border ${isInactive ? 'border-muted opacity-60' : 'border-border'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" />
                      <span className="font-bold text-lg tracking-wider">{coupon.code}</span>
                    </div>
                    <Switch 
                      checked={coupon.is_active} 
                      onCheckedChange={v => toggleActiveMutation.mutate({ id: coupon.id, is_active: v })}
                    />
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                      {coupon.discount_type === 'percentage' ? (
                        <><Percent className="w-4 h-4" /> {coupon.discount_value}% خصم</>
                      ) : (
                        <><DollarSign className="w-4 h-4" /> {coupon.discount_value} دج خصم</>
                      )}
                    </div>
                    
                    {coupon.min_order_amount && (
                      <p className="text-muted-foreground">الحد الأدنى: {coupon.min_order_amount} دج</p>
                    )}
                    
                    {coupon.max_uses && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>الاستخدام: {coupon.used_count}/{coupon.max_uses}</span>
                        {maxReached && <span className="text-destructive text-xs">(منتهي)</span>}
                      </div>
                    )}
                    
                    {coupon.expires_at && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>ينتهي: {new Date(coupon.expires_at).toLocaleDateString('ar-DZ')}</span>
                        {expired && <span className="text-destructive text-xs">(منتهي)</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Package className="w-3 h-3" />
                      <span>{coupon.applies_to_all ? 'جميع المنتجات' : 'منتجات محددة'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(coupon)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(coupon.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}