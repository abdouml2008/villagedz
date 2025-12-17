import { Link } from 'react-router-dom';
import { StoreLayout } from '@/components/store/StoreLayout';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">سلة التسوق فارغة</h1>
          <p className="text-muted-foreground mb-8">أضف بعض المنتجات لتبدأ التسوق</p>
          <Link to="/">
            <Button className="gradient-primary text-primary-foreground">تصفح المنتجات</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">سلة التسوق</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="bg-card rounded-xl p-4 shadow-village-sm border border-border flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">لا صورة</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product.name}</h3>
                  <p className="text-primary font-bold">{item.product.price} دج</p>
                  {item.size && <p className="text-sm text-muted-foreground">المقاس: {item.size}</p>}
                  {item.color && <p className="text-sm text-muted-foreground">اللون: {item.color}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.color)} className="p-1 rounded border border-border hover:bg-secondary">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.color)} className="p-1 rounded border border-border hover:bg-secondary">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button onClick={() => removeItem(item.product.id, item.size, item.color)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg h-fit">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl p-6 shadow-village-md border border-border h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4">ملخص الطلب</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{totalPrice} دج</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">التوصيل</span>
                <span>يحدد لاحقاً</span>
              </div>
            </div>
            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>الإجمالي</span>
                <span className="text-primary">{totalPrice} دج</span>
              </div>
            </div>
            <Link to="/checkout">
              <Button className="w-full gradient-primary text-primary-foreground text-lg py-6">إتمام الطلب</Button>
            </Link>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
