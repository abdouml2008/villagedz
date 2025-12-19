import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '@/types/store';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', name_ar: '', slug: '', icon: '' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('categories').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Category[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const client = await getSupabase();
      if (editingCategory) {
        const { error } = await client.from('categories').update(data).eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('categories').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(editingCategory ? 'تم تحديث القسم' : 'تم إضافة القسم');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabase();
      const { error } = await client.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('تم حذف القسم');
    },
    onError: () => toast.error('لا يمكن حذف القسم (قد يحتوي على منتجات)')
  });

  const resetForm = () => {
    setFormData({ name: '', name_ar: '', slug: '', icon: '' });
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, name_ar: category.name_ar, slug: category.slug, icon: category.icon || '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.name_ar || !formData.slug) {
      toast.error('جميع الحقول مطلوبة');
      return;
    }
    saveMutation.mutate(formData);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="إدارة الأقسام" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">الأقسام</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 ml-2" />
                إضافة قسم
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">الاسم بالإنجليزية</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                    }}
                    placeholder="Electronics"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الاسم بالعربية</label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="إلكترونيات"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الرابط (Slug)</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="electronics"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الأيقونة (اختياري)</label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🛒 أو رابط صورة"
                  />
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
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-6 animate-pulse h-20" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid gap-4">
            {categories.map(category => (
              <div key={category.id} className="bg-card rounded-xl p-6 border border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                    {category.icon || <FolderOpen className="w-6 h-6 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{category.name_ar}</h3>
                    <p className="text-sm text-muted-foreground">{category.name} • /{category.slug}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEdit(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-12 text-center">
            <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">لا توجد أقسام</h2>
            <p className="text-muted-foreground">ابدأ بإضافة أقسام لتنظيم منتجاتك</p>
          </div>
        )}
      </div>
    </div>
  );
}
