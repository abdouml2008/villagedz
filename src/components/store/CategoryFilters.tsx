import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export interface FilterState {
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'name';
}

interface CategoryFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  productCount: number;
}

export function CategoryFilters({ filters, onFiltersChange, productCount }: CategoryFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [tempMinPrice, setTempMinPrice] = useState(filters.minPrice?.toString() || '');
  const [tempMaxPrice, setTempMaxPrice] = useState(filters.maxPrice?.toString() || '');
  const { t } = useTranslation();
  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.inStock;

  const applyPriceFilter = () => onFiltersChange({ ...filters, minPrice: tempMinPrice ? Number(tempMinPrice) : null, maxPrice: tempMaxPrice ? Number(tempMaxPrice) : null });
  const clearFilters = () => { setTempMinPrice(''); setTempMaxPrice(''); onFiltersChange({ minPrice: null, maxPrice: null, inStock: false, sortBy: 'newest' }); };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            {t.filters.sortBy}
            {hasActiveFilters && <span className="w-5 h-5 bg-primary-foreground text-primary rounded-full text-xs flex items-center justify-center">!</span>}
          </Button>
          <span className="text-sm text-muted-foreground">{productCount} {t.filters.productsCount}</span>
        </div>
        <Select value={filters.sortBy} onValueChange={(value: FilterState['sortBy']) => onFiltersChange({ ...filters, sortBy: value })}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t.filters.sortBy} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t.filters.newest}</SelectItem>
            <SelectItem value="price_asc">{t.filters.priceAsc}</SelectItem>
            <SelectItem value="price_desc">{t.filters.priceDesc}</SelectItem>
            <SelectItem value="name">{t.filters.name}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {showFilters && (
        <div className="bg-card rounded-xl p-4 border border-border mb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t.filters.minPrice} - {t.filters.maxPrice}</label>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder={t.filters.minPrice} value={tempMinPrice} onChange={(e) => setTempMinPrice(e.target.value)} className="flex-1" dir="ltr" />
                <span className="text-muted-foreground">-</span>
                <Input type="number" placeholder={t.filters.maxPrice} value={tempMaxPrice} onChange={(e) => setTempMaxPrice(e.target.value)} className="flex-1" dir="ltr" />
                <Button size="sm" onClick={applyPriceFilter}>{t.common.apply}</Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t.common.available}</label>
              <Button variant={filters.inStock ? 'default' : 'outline'} size="sm" onClick={() => onFiltersChange({ ...filters, inStock: !filters.inStock })} className="w-full">{t.filters.inStockOnly}</Button>
            </div>
            {hasActiveFilters && <div className="flex items-end"><Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive gap-2"><X className="w-4 h-4" />{t.common.remove}</Button></div>}
          </div>
        </div>
      )}
    </div>
  );
}
