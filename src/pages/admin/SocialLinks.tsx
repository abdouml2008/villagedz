import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { getSupabase } from '@/hooks/useSupabase';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, GripVertical, Instagram, Facebook, Youtube, Send, MessageCircle, Twitter, Camera, Music2, Phone, Globe, Mail } from 'lucide-react';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'Instagram' },
  { id: 'facebook', name: 'Facebook', icon: 'Facebook' },
  { id: 'tiktok', name: 'TikTok', icon: 'Music2' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'MessageCircle' },
  { id: 'telegram', name: 'Telegram', icon: 'Send' },
  { id: 'youtube', name: 'YouTube', icon: 'Youtube' },
  { id: 'twitter', name: 'Twitter / X', icon: 'Twitter' },
  { id: 'snapchat', name: 'Snapchat', icon: 'Camera' },
  { id: 'phone', name: 'الهاتف', icon: 'Phone' },
  { id: 'email', name: 'البريد الإلكتروني', icon: 'Mail' },
  { id: 'website', name: 'موقع الويب', icon: 'Globe' },
];

const getIconComponent = (iconName: string | null) => {
  switch (iconName) {
    case 'Instagram': return Instagram;
    case 'Facebook': return Facebook;
    case 'Music2': return Music2;
    case 'MessageCircle': return MessageCircle;
    case 'Send': return Send;
    case 'Youtube': return Youtube;
    case 'Twitter': return Twitter;
    case 'Camera': return Camera;
    case 'Phone': return Phone;
    case 'Mail': return Mail;
    case 'Globe': return Globe;
    default: return Globe;
  }
};

export default function AdminSocialLinks() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLink, setEditLink] = useState<SocialLink | null>(null);
  
  const [newPlatform, setNewPlatform] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Redirect if not authenticated
  if (!loading && !roleLoading && (!user || !hasRole)) {
    navigate('/admin');
    return null;
  }

  // Fetch social links
  const { data: socialLinks = [], isLoading } = useQuery({
    queryKey: ['admin-social-links'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('social_links')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as SocialLink[];
    },
    enabled: !!user && hasRole,
  });

  const createMutation = useMutation({
    mutationFn: async ({ platform, url }: { platform: string; url: string }) => {
      const client = await getSupabase();
      const platformInfo = PLATFORMS.find(p => p.id === platform);
      const maxOrder = socialLinks.length > 0 ? Math.max(...socialLinks.map(l => l.sort_order)) : 0;
      
      const { error } = await client.from('social_links').insert({
        platform,
        url,
        icon: platformInfo?.icon || 'Globe',
        sort_order: maxOrder + 1,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      setIsCreateDialogOpen(false);
      setNewPlatform('');
      setNewUrl('');
      toast.success('تم إضافة وسيلة التواصل بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, url, is_active }: { id: string; url: string; is_active: boolean }) => {
      const client = await getSupabase();
      const { error } = await client
        .from('social_links')
        .update({ url, is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      setIsEditDialogOpen(false);
      setEditLink(null);
      toast.success('تم تحديث وسيلة التواصل بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabase();
      const { error } = await client.from('social_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast.success('تم حذف وسيلة التواصل بنجاح');
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!newPlatform || !newUrl) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    createMutation.mutate({ platform: newPlatform, url: newUrl });
  };

  const handleUpdate = () => {
    if (!editLink || !editUrl) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    updateMutation.mutate({ id: editLink.id, url: editUrl, is_active: editIsActive });
  };

  const openEditDialog = (link: SocialLink) => {
    setEditLink(link);
    setEditUrl(link.url);
    setEditIsActive(link.is_active);
    setIsEditDialogOpen(true);
  };

  if (loading || roleLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="وسائل التواصل الاجتماعي" />

      {/* Header Actions */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary">
                <Plus className="size-4 ml-2" />
                إضافة وسيلة تواصل
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة وسيلة تواصل جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>المنصة</Label>
                  <Select value={newPlatform} onValueChange={setNewPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنصة" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((platform) => {
                        const IconComp = getIconComponent(platform.icon);
                        return (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center gap-2">
                              <IconComp className="size-4" />
                              {platform.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الرابط</Label>
                  <Input 
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending}
                  className="w-full gradient-primary"
                >
                  {createMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل وسيلة التواصل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>المنصة</Label>
              <Input 
                value={PLATFORMS.find(p => p.id === editLink?.platform)?.name || editLink?.platform || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label>الرابط</Label>
              <Input 
                value={editUrl}
                onChange={e => setEditUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>نشط</Label>
              <Switch 
                checked={editIsActive} 
                onCheckedChange={setEditIsActive}
              />
            </div>
            <Button 
              onClick={handleUpdate} 
              disabled={updateMutation.isPending}
              className="w-full gradient-primary"
            >
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {socialLinks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>لا توجد وسائل تواصل مضافة</p>
            <p className="text-sm">اضغط على "إضافة وسيلة تواصل" للبدء</p>
          </div>
        ) : (
          <div className="space-y-3">
            {socialLinks.map((link) => {
              const IconComp = getIconComponent(link.icon);
              const platformInfo = PLATFORMS.find(p => p.id === link.platform);
              
              return (
                <div 
                  key={link.id}
                  className={`bg-card rounded-xl p-4 border border-border flex items-center justify-between ${!link.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <IconComp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{platformInfo?.name || link.platform}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-[300px]">{link.url}</p>
                    </div>
                    {!link.is_active && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">غير نشط</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(link)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف وسيلة التواصل؟')) {
                          deleteMutation.mutate(link.id);
                        }
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
