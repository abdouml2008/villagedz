import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Megaphone, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface PromoBanner {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  bg_gradient: string;
  link: string | null;
  link_text: string | null;
  is_active: boolean;
  sort_order: number;
}

const gradientOptions = [
  { value: 'from-primary via-primary/90 to-primary/80', label: 'الرئيسي', preview: 'bg-gradient-to-r from-primary via-primary/90 to-primary/80' },
  { value: 'from-green-600 via-green-500 to-emerald-500', label: 'أخضر', preview: 'bg-gradient-to-r from-green-600 via-green-500 to-emerald-500' },
  { value: 'from-purple-600 via-violet-500 to-indigo-500', label: 'بنفسجي', preview: 'bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500' },
  { value: 'from-orange-500 via-amber-500 to-yellow-500', label: 'برتقالي', preview: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500' },
  { value: 'from-red-600 via-rose-500 to-pink-500', label: 'أحمر', preview: 'bg-gradient-to-r from-red-600 via-rose-500 to-pink-500' },
  { value: 'from-blue-600 via-cyan-500 to-teal-500', label: 'أزرق', preview: 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500' },
];

const defaultFormData = {
  title: '',
  subtitle: '',
  icon: '🎉',
  bg_gradient: 'from-primary via-primary/90 to-primary/80',
  link: '',
  link_text: '',
  is_active: true,
  sort_order: 0
};

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('promo_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as PromoBanner[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const client = await getSupabase();
      const payload = {
        ...data,
        subtitle: data.subtitle || null,
        link: data.link || null,
        link_text: data.link_text || null
      };
      
      if (editingBanner) {
        const { error } = await client.from('promo_banners').update(payload).eq('id', editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('promo_banners').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
      toast.success(editingBanner ? 'تم تحديث البانر' : 'تم إضافة البانر');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabase();
      const { error } = await client.from('promo_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
      toast.success('تم حذف البانر');
    },
    onError: () => toast.error('حدث خطأ')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const client = await getSupabase();
      const { error } = await client.from('promo_banners').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
    }
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingBanner(null);
    setIsDialogOpen(false);
  };

  const openEdit = (banner: PromoBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      icon: banner.icon,
      bg_gradient: banner.bg_gradient,
      link: banner.link || '',
      link_text: banner.link_text || '',
      is_active: banner.is_active,
      sort_order: banner.sort_order
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('العنوان مطلوب');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="إدارة البانرات" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">البانرات الترويجية</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 ml-2" />
                إضافة بانر
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">العنوان *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="خصم 20% على جميع المنتجات"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">العنوان الفرعي</label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="استخدم الكود: VILLAGE20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">الأيقونة</label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🎉"
                      className="text-center text-2xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">الترتيب</label>
                    <Input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">لون الخلفية</label>
                  <Select value={formData.bg_gradient} onValueChange={(value) => setFormData({ ...formData, bg_gradient: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gradientOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded ${opt.preview}`} />
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">الرابط (اختياري)</label>
                    <Input
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="/cart"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">نص الزر</label>
                    <Input
                      value={formData.link_text}
                      onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                      placeholder="تسوق الآن"
                    />
                  </div>
                </div>
                
                {/* Preview */}
                <div>
                  <label className="text-sm font-medium mb-2 block">معاينة</label>
                  <div className={`bg-gradient-to-r ${formData.bg_gradient} rounded-lg p-4 text-white text-center`}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">{formData.icon}</span>
                      <div>
                        <p className="font-bold">{formData.title || 'العنوان'}</p>
                        {formData.subtitle && <p className="text-sm opacity-80">{formData.subtitle}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-6 animate-pulse h-24" />
            ))}
          </div>
        ) : banners && banners.length > 0 ? (
          <div className="space-y-4">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                  
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${banner.bg_gradient} flex items-center justify-center text-2xl`}>
                    {banner.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                    )}
                    {banner.link && (
                      <p className="text-xs text-primary">{banner.link}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">مفعّل</span>
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: banner.id, is_active: checked })}
                      />
                    </div>
                    
                    <Button variant="outline" size="icon" onClick={() => openEdit(banner)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا البانر؟')) {
                          deleteMutation.mutate(banner.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-12 text-center">
            <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">لا توجد بانرات</h2>
            <p className="text-muted-foreground">ابدأ بإضافة بانرات ترويجية لمتجرك</p>
          </div>
        )}
      </div>
    </div>
  );
}
