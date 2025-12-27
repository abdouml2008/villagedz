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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Facebook, Music2, Code } from 'lucide-react';
import { toast } from 'sonner';

interface TrackingPixel {
  id: string;
  platform: string;
  pixel_id: string;
  code: string | null;
  name: string | null;
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
  const [addMethod, setAddMethod] = useState<'id' | 'code'>('id');
  const [platform, setPlatform] = useState<string>('meta');
  const [pixelId, setPixelId] = useState('');
  const [pixelCode, setPixelCode] = useState('');
  const [pixelName, setPixelName] = useState('');

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
      
      const insertData: any = {
        platform,
        name: pixelName || null,
      };

      if (addMethod === 'code') {
        insertData.code = pixelCode;
        insertData.pixel_id = extractPixelIdFromCode(pixelCode, platform) || 'custom';
      } else {
        insertData.pixel_id = pixelId;
      }
      
      const { error } = await client
        .from('tracking_pixels')
        .insert(insertData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tracking-pixels'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-pixels'] });
      toast.success('تم إضافة البيكسل بنجاح');
      resetForm();
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

  const resetForm = () => {
    setIsDialogOpen(false);
    setAddMethod('id');
    setPlatform('meta');
    setPixelId('');
    setPixelCode('');
    setPixelName('');
  };

  const extractPixelIdFromCode = (code: string, platform: string): string | null => {
    if (platform === 'meta') {
      // Try to extract Meta pixel ID from fbq('init', 'PIXEL_ID')
      const match = code.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/);
      return match ? match[1] : null;
    } else if (platform === 'tiktok') {
      // Try to extract TikTok pixel ID from ttq.load('PIXEL_ID')
      const match = code.match(/ttq\.load\s*\(\s*['"]([A-Z0-9]+)['"]/);
      return match ? match[1] : null;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (addMethod === 'id' && !pixelId.trim()) {
      toast.error('يرجى إدخال معرف البيكسل');
      return;
    }
    
    if (addMethod === 'code' && !pixelCode.trim()) {
      toast.error('يرجى لصق الكود البرمجي للبيكسل');
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
        return <Code className="w-5 h-5" />;
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة بيكسل جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم البيكسل (اختياري)</Label>
                  <Input
                    value={pixelName}
                    onChange={(e) => setPixelName(e.target.value)}
                    placeholder="مثال: بيكسل الصفحة الرئيسية"
                  />
                </div>

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

                <Tabs value={addMethod} onValueChange={(v) => setAddMethod(v as 'id' | 'code')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="id">معرف البيكسل</TabsTrigger>
                    <TabsTrigger value="code">الكود البرمجي</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="id" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>معرف البيكسل (Pixel ID)</Label>
                      <Input
                        value={pixelId}
                        onChange={(e) => setPixelId(e.target.value)}
                        placeholder="أدخل معرف البيكسل"
                        dir="ltr"
                      />
                      <p className="text-sm text-muted-foreground">
                        أدخل معرف البيكسل فقط (مثال: 844565225416138)
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="code" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>الكود البرمجي للبيكسل</Label>
                      <Textarea
                        value={pixelCode}
                        onChange={(e) => setPixelCode(e.target.value)}
                        placeholder="الصق الكود البرمجي الكامل هنا..."
                        className="min-h-[200px] font-mono text-sm"
                        dir="ltr"
                      />
                      <p className="text-sm text-muted-foreground">
                        الصق الكود البرمجي الكامل الذي حصلت عليه من {platform === 'meta' ? 'Meta' : 'TikTok'} 
                        (بما في ذلك علامات {'<script>'} و {'<noscript>'})
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full" disabled={addPixelMutation.isPending}>
                  {addPixelMutation.isPending ? 'جاري الإضافة...' : 'إضافة البيكسل'}
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
                  <TableHead>الاسم</TableHead>
                  <TableHead>المنصة</TableHead>
                  <TableHead>معرف البيكسل</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pixels.map((pixel) => (
                  <TableRow key={pixel.id}>
                    <TableCell>{pixel.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(pixel.platform)}
                        <span>{getPlatformName(pixel.platform)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{pixel.pixel_id}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        pixel.code ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {pixel.code ? (
                          <>
                            <Code className="w-3 h-3" />
                            كود مخصص
                          </>
                        ) : (
                          'معرف فقط'
                        )}
                      </span>
                    </TableCell>
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
            <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">لا توجد بيكسلات مضافة</p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة بيكسل
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-muted/50 rounded-xl p-6 border border-border">
          <h3 className="font-bold mb-4">كيفية إضافة البيكسل:</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">الطريقة 1: باستخدام معرف البيكسل</h4>
              <p>أدخل معرف البيكسل فقط وسيتم إضافة الكود تلقائياً.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">الطريقة 2: لصق الكود البرمجي الكامل</h4>
              <ol className="list-decimal list-inside space-y-1 mr-4">
                <li>انسخ الكود البرمجي الكامل من Meta أو TikTok</li>
                <li>الصقه في حقل "الكود البرمجي"</li>
                <li>سيتم تثبيت الكود على جميع صفحات الموقع تلقائياً</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
