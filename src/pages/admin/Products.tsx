import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import { Product, Category } from '@/types/store';
import { logger } from '@/lib/logger';

export default function AdminProducts() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category_id: '', image_url: '', sizes: '', colors: '', min_quantity: '1', max_quantity: '', discount_quantity: '', discount_percentage: '', stock: '0' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Additional images state
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) navigate('/admin');
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    enabled: !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const { data } = await client.from('categories').select('*');
      return data as Category[];
    }
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    enabled: !!user && !!supabase,
    queryFn: async () => {
      const client = await getSupabase();
      const { data } = await client.from('products').select('*, category:categories(*)').order('created_at', { ascending: false });
      return data as (Product & { category: Category })[];
    }
  });

  const uploadImage = async (file: File): Promise<string> => {
    const client = await getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await client.storage.from('product-images').upload(fileName, file);
    if (error) throw error;
    
    const { data: { publicUrl } } = client.storage.from('product-images').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type - only allow images
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('نوع الملف غير مدعوم. يرجى رفع صورة (JPEG, PNG, WebP, GIF)');
        return;
      }
      
      // Validate file size - max 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAdditionalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;
    const maxImages = 10;
    
    const currentCount = additionalImages.length + additionalImageFiles.length;
    if (currentCount + files.length > maxImages) {
      toast.error(`الحد الأقصى للصور هو ${maxImages} صور`);
      return;
    }
    
    const validFiles: File[] = [];
    const previews: string[] = [];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: نوع الملف غير مدعوم`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: حجم الصورة يجب أن يكون أقل من 5 ميجابايت`);
        continue;
      }
      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }
    
    setAdditionalImageFiles(prev => [...prev, ...validFiles]);
    setAdditionalImagePreviews(prev => [...prev, ...previews]);
    if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = '';
  };

  const removeAdditionalImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const adjustedIndex = index - additionalImages.length;
      setAdditionalImageFiles(prev => prev.filter((_, i) => i !== adjustedIndex));
      setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== adjustedIndex));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      setUploading(true);
      const client = await getSupabase();
      
      let imageUrl = data.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      // Upload additional images
      const uploadedAdditionalImages: string[] = [...additionalImages];
      for (const file of additionalImageFiles) {
        const url = await uploadImage(file);
        uploadedAdditionalImages.push(url);
      }
      
      const productData = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        category_id: data.category_id || null,
        image_url: imageUrl || null,
        images: uploadedAdditionalImages,
        sizes: data.sizes ? data.sizes.split(',').map(s => s.trim()) : [],
        colors: data.colors ? data.colors.split(',').map(c => c.trim()) : [],
        min_quantity: data.min_quantity ? parseInt(data.min_quantity) : 1,
        max_quantity: data.max_quantity ? parseInt(data.max_quantity) : null,
        discount_quantity: data.discount_quantity ? parseInt(data.discount_quantity) : null,
        discount_percentage: data.discount_percentage ? parseFloat(data.discount_percentage) : null,
        stock: data.stock ? parseInt(data.stock) : 0
      };
      if (editProduct) {
        const { error } = await client.from('products').update(productData).eq('id', editProduct.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('products').insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editProduct ? 'تم تحديث المنتج' : 'تمت إضافة المنتج');
      setDialogOpen(false);
      resetForm();
      setUploading(false);
    },
    onError: (error: Error) => {
      toast.error(`حدث خطأ: ${error.message}`);
      setUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabase();
      if (!client) throw new Error('لم يتم تهيئة الاتصال بالخادم');
      const { error } = await client.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('تم حذف المنتج');
    },
    onError: (error: Error) => {
      logger.error('Delete error:', error);
      toast.error('فشل الحذف');
    }
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category_id: '', image_url: '', sizes: '', colors: '', min_quantity: '1', max_quantity: '', discount_quantity: '', discount_percentage: '', stock: '0' });
    setEditProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setAdditionalImages([]);
    setAdditionalImageFiles([]);
    setAdditionalImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = '';
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      sizes: product.sizes?.join(', ') || '',
      colors: product.colors?.join(', ') || '',
      min_quantity: product.min_quantity?.toString() || '1',
      max_quantity: product.max_quantity?.toString() || '',
      discount_quantity: product.discount_quantity?.toString() || '',
      discount_percentage: product.discount_percentage?.toString() || '',
      stock: product.stock?.toString() || '0'
    });
    setImageFile(null);
    setImagePreview(null);
    setAdditionalImages(product.images || []);
    setAdditionalImageFiles([]);
    setAdditionalImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (additionalImagesInputRef.current) additionalImagesInputRef.current.value = '';
    setDialogOpen(true);
  };

  if (loading || supabaseLoading || roleLoading || !user || !hasRole) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="إدارة المنتجات" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">المنتجات ({products?.length || 0})</h2>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 ml-2" /> إضافة منتج</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
              <DialogHeader><DialogTitle>{editProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
                <div><Label>الاسم</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div><Label>السعر (دج)</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
                <div><Label>القسم</Label>
                  <Select value={form.category_id} onValueChange={v => setForm({...form, category_id: v})}>
                    <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                    <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                
                {/* Image Upload Section */}
                <div>
                  <Label>صورة المنتج</Label>
                  <div className="mt-2 space-y-3">
                    {(imagePreview || form.image_url) && (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                        <img 
                          src={imagePreview || form.image_url} 
                          alt="معاينة" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => { clearImage(); setForm({...form, image_url: ''}); }}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 ml-2" />
                        رفع صورة
                      </Button>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">أو</div>
                    <Input 
                      value={form.image_url} 
                      onChange={e => { setForm({...form, image_url: e.target.value}); clearImage(); }} 
                      placeholder="https://... رابط الصورة"
                    />
                  </div>
                </div>

                {/* Additional Images Section */}
                <div>
                  <Label>صور إضافية (حتى 10 صور)</Label>
                  <p className="text-xs text-muted-foreground mb-2">أضف صوراً متعددة ليتمكن الزبون من رؤية المنتج من زوايا مختلفة</p>
                  <div className="mt-2 space-y-3">
                    {(additionalImages.length > 0 || additionalImagePreviews.length > 0) && (
                      <div className="grid grid-cols-4 gap-2">
                        {additionalImages.map((url, index) => (
                          <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                            <img src={url} alt={`صورة ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(index, true)}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {additionalImagePreviews.map((url, index) => (
                          <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-primary border-dashed">
                            <img src={url} alt={`صورة جديدة ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(additionalImages.length + index, false)}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">جديد</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      ref={additionalImagesInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalFilesChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => additionalImagesInputRef.current?.click()}
                      disabled={additionalImages.length + additionalImageFiles.length >= 10}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة صور ({additionalImages.length + additionalImageFiles.length}/10)
                    </Button>
                  </div>
                </div>

                <div><Label>المقاسات (مفصولة بفواصل)</Label><Input value={form.sizes} onChange={e => setForm({...form, sizes: e.target.value})} placeholder="S, M, L, XL" /></div>
                <div><Label>الألوان (مفصولة بفواصل)</Label><Input value={form.colors} onChange={e => setForm({...form, colors: e.target.value})} placeholder="أسود, أبيض, أزرق" /></div>
                <div><Label>المخزون المتاح</Label><Input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="0" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>الحد الأدنى للكمية</Label><Input type="number" min="1" value={form.min_quantity} onChange={e => setForm({...form, min_quantity: e.target.value})} placeholder="1" /></div>
                  <div><Label>الحد الأقصى للكمية</Label><Input type="number" min="1" value={form.max_quantity} onChange={e => setForm({...form, max_quantity: e.target.value})} placeholder="غير محدود" /></div>
                </div>
                <div className="border-t border-border pt-4">
                  <Label className="text-base font-semibold">خصم الكمية</Label>
                  <p className="text-sm text-muted-foreground mb-3">تطبيق خصم عند شراء كمية معينة أو أكثر</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>الكمية المطلوبة</Label><Input type="number" min="2" value={form.discount_quantity} onChange={e => setForm({...form, discount_quantity: e.target.value})} placeholder="مثال: 5" /></div>
                    <div><Label>نسبة الخصم (%)</Label><Input type="number" min="1" max="100" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: e.target.value})} placeholder="مثال: 10" /></div>
                  </div>
                </div>
                <Button type="submit" disabled={saveMutation.isPending || uploading} className="w-full">
                  {uploading ? 'جاري رفع الصورة...' : saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="bg-card h-32 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products?.map(product => (
              <div key={product.id} className="bg-card rounded-xl p-4 shadow-village-sm border border-border">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">لا صورة</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <p className="text-primary font-bold">{product.price} دج</p>
                    <p className="text-sm text-muted-foreground">{product.category?.name_ar}</p>
                    <p className={`text-sm font-medium ${(product.stock || 0) > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      المخزون: {product.stock || 0}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => openEdit(product)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(product.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
