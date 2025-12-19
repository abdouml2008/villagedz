import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { AlertTriangle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LowStockAlertProps {
  threshold?: number;
}

export function LowStockAlert({ threshold = 5 }: LowStockAlertProps) {
  const { data: lowStockProducts } = useQuery({
    queryKey: ['low-stock-products', threshold],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('products')
        .select('id, name, stock, image_url')
        .eq('is_active', true)
        .lte('stock', threshold)
        .order('stock', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  if (!lowStockProducts || lowStockProducts.length === 0) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-destructive">تنبيه المخزون المنخفض</h3>
          <p className="text-sm text-muted-foreground">{lowStockProducts.length} منتجات بمخزون منخفض</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {lowStockProducts.map((product) => (
          <Link
            key={product.id}
            to="/admin/products"
            className="flex items-center gap-3 bg-background/50 rounded-lg p-3 hover:bg-background transition-colors"
          >
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
              product.stock === 0 ? 'bg-destructive text-destructive-foreground' : 'bg-yellow-500/20 text-yellow-600'
            }`}>
              {product.stock === 0 ? 'نفد' : `${product.stock} متبقي`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
