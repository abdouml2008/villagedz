import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Facebook, Music2 } from 'lucide-react';
import { toast } from 'sonner';

interface TrackingPixel {
  id: string;
  platform: string;
  pixel_id: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminTrackingPixels() {
  const { user, loading } = useAuth();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [platform, setPlatform] = useState<string>('meta');
  const [pixelId, setPixelId] = useState('');

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) {
        navigate('/admin');
      }
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const { data: pixels, isLoading } = useQuery({
    queryKey: ['admin-tracking-pixels'],
    enabled: !!user && !!supabase && hasRole,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('tracking_pixels')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TrackingPixel[];
    }
  });

  const addPixelMutation = useMutation({
    mutationFn: async () => {
      const client = await getSupabase();
      const { error } = await client
        .from('tracking_pixels')
        .insert({ platform, pixel_id: pixelId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracking-pixels'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-pixels'] });
      toast.success('تم إضافة البيكسل بنجاح');
      setIsDialogOpen(false);
      setPlatform('meta');
      setPixelId('');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة البيكسل');
    }
  });

  const togglePixelMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const client = await getSupabase();
      const { error } = await client
        .from('tracking_pixels')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracking-pixels'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-pixels'] });
      toast.success('تم تحديث الحالة');
    }
  });

  const deletePixelMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabase();
      const { error } = await client
        .from('tracking_pixels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracking-pixels'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-pixels'] });
      toast.success('تم حذف البيكسل');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixelId.trim()) {
      toast.error('يرجى إدخال معرف البيكسل');
      return;
    }
    addPixelMutation.mutate();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'meta':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'tiktok':
        return <Music2 className="w-5 h-5 text-foreground" />;
      default:
        return null;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'meta':
        return 'Meta (Facebook)';
      case 'tiktok':
        return 'TikTok';
      default:
        return platform;
    }
  };

  if (loading || supabaseLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  }

  if (!user || !hasRole) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="إدارة البيكسلات" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">بيكسلات التتبع</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة بيكسل
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة بيكسل جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>المنصة</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meta">Meta (Facebook)</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>معرف البيكسل (Pixel ID)</Label>
                  <Input
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    placeholder="أدخل معرف البيكسل"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addPixelMutation.isPending}>
                  {addPixelMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : pixels && pixels.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنصة</TableHead>
                  <TableHead>معرف البيكسل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pixels.map((pixel) => (
                  <TableRow key={pixel.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(pixel.platform)}
                        <span>{getPlatformName(pixel.platform)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{pixel.pixel_id}</TableCell>
                    <TableCell>
                      <Switch
                        checked={pixel.is_active}
                        onCheckedChange={(checked) => 
                          togglePixelMutation.mutate({ id: pixel.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا البيكسل؟')) {
                            deletePixelMutation.mutate(pixel.id);
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground mb-4">لا توجد بيكسلات مضافة</p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة بيكسل
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
