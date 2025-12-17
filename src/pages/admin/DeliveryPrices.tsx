import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase, getSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Save, Search } from 'lucide-react';
import type { Wilaya } from '@/types/store';

export default function AdminDeliveryPrices() {
  const { user, loading } = useAuth();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { hasRole, loading: roleLoading } = useHasAnyRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editedPrices, setEditedPrices] = useState<Record<number, { home: number; office: number }>>({});

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user || !hasRole) {
        navigate('/admin');
      }
    }
  }, [user, loading, hasRole, roleLoading, navigate]);

  const { data: wilayas, isLoading: wilayasLoading } = useQuery({
    queryKey: ['admin-wilayas'],
    enabled: !!user && !!supabase && hasRole,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('wilayas')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data as Wilaya[];
    }
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, homePrice, officePrice }: { id: number; homePrice: number; officePrice: number }) => {
      const client = await getSupabase();
      const { error } = await client
        .from('wilayas')
        .update({ 
          home_delivery_price: homePrice, 
          office_delivery_price: officePrice 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wilayas'] });
      toast.success('تم تحديث الأسعار بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث الأسعار');
    }
  });

  const handlePriceChange = (wilayaId: number, type: 'home' | 'office', value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedPrices(prev => ({
      ...prev,
      [wilayaId]: {
        home: type === 'home' ? numValue : (prev[wilayaId]?.home ?? wilayas?.find(w => w.id === wilayaId)?.home_delivery_price ?? 0),
        office: type === 'office' ? numValue : (prev[wilayaId]?.office ?? wilayas?.find(w => w.id === wilayaId)?.office_delivery_price ?? 0)
      }
    }));
  };

  const handleSave = (wilaya: Wilaya) => {
    const edited = editedPrices[wilaya.id];
    const homePrice = edited?.home ?? wilaya.home_delivery_price;
    const officePrice = edited?.office ?? wilaya.office_delivery_price;
    
    updatePriceMutation.mutate({
      id: wilaya.id,
      homePrice,
      officePrice
    });
    
    // Clear edited state for this wilaya
    setEditedPrices(prev => {
      const newState = { ...prev };
      delete newState[wilaya.id];
      return newState;
    });
  };

  const filteredWilayas = wilayas?.filter(wilaya => 
    wilaya.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wilaya.name_ar.includes(searchTerm) ||
    wilaya.code.includes(searchTerm)
  );

  const hasChanges = (wilayaId: number) => {
    return editedPrices[wilayaId] !== undefined;
  };

  if (loading || supabaseLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user || !hasRole) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="إدارة أسعار التوصيل" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">أسعار التوصيل حسب الولاية</h1>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="البحث عن ولاية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {wilayasLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-village-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right w-20">الرقم</TableHead>
                    <TableHead className="text-right">الولاية</TableHead>
                    <TableHead className="text-right">الاسم بالعربية</TableHead>
                    <TableHead className="text-right w-40">التوصيل للمنزل (دج)</TableHead>
                    <TableHead className="text-right w-40">التوصيل للمكتب (دج)</TableHead>
                    <TableHead className="text-right w-24">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWilayas?.map((wilaya) => {
                    const edited = editedPrices[wilaya.id];
                    const currentHome = edited?.home ?? wilaya.home_delivery_price;
                    const currentOffice = edited?.office ?? wilaya.office_delivery_price;
                    
                    return (
                      <TableRow key={wilaya.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-muted-foreground">
                          {wilaya.code}
                        </TableCell>
                        <TableCell>{wilaya.name}</TableCell>
                        <TableCell>{wilaya.name_ar}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={currentHome}
                            onChange={(e) => handlePriceChange(wilaya.id, 'home', e.target.value)}
                            className="w-28"
                            min={0}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={currentOffice}
                            onChange={(e) => handlePriceChange(wilaya.id, 'office', e.target.value)}
                            className="w-28"
                            min={0}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleSave(wilaya)}
                            disabled={!hasChanges(wilaya.id) || updatePriceMutation.isPending}
                            className="gap-1"
                          >
                            <Save className="w-4 h-4" />
                            حفظ
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
