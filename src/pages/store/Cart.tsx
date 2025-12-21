import { Link } from 'react-router-dom';
import { StoreLayout } from '@/components/store/StoreLayout';
import { useCart, getItemPrice } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag, Tag } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function Cart() {
  const { items, removeItem, updateQuantity, totalPrice, totalDiscount } = useCart();
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">{t.cart.empty}</h1>
          <p className="text-muted-foreground mb-8">{t.cart.addProducts}</p>
          <Link to="/">
            <Button className="gradient-primary text-primary-foreground">{t.cart.browseProducts}</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t.cart.title}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => {
              const priceInfo = getItemPrice(item);
              return (
                <div key={index} className="bg-card rounded-xl p-4 shadow-village-sm border border-border flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{t.common.noImage}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <div className="flex items-center gap-2">
                      {priceInfo.hasDiscount ? (
                        <>
                          <span className="text-primary font-bold">{priceInfo.discountedPrice.toFixed(0)} {t.common.currency}</span>
                          <span className="text-muted-foreground line-through text-sm">{priceInfo.originalPrice.toFixed(0)} {t.common.currency}</span>
                          <span className="bg-green-500/10 text-green-600 text-xs px-2 py-0.5 rounded-full">-{priceInfo.discountPercentage}%</span>
                        </>
                      ) : (
                        <span className="text-primary font-bold">{priceInfo.originalPrice.toFixed(0)} {t.common.currency}</span>
                      )}
                    </div>
                    {item.product.discount_quantity && item.product.discount_percentage && !priceInfo.hasDiscount && (
                      <p className="text-xs text-green-600 mt-1">
                        <Tag className="w-3 h-3 inline ml-1" />
                        {t.product.buyDiscount.replace('{quantity}', String(item.product.discount_quantity)).replace('{percentage}', String(item.product.discount_percentage))}
                      </p>
                    )}
                    {item.size && <p className="text-sm text-muted-foreground">{t.product.size}: {item.size}</p>}
                    {item.color && <p className="text-sm text-muted-foreground">{t.product.color}: {item.color}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.color)} 
                        className="p-1 rounded border border-border hover:bg-secondary disabled:opacity-50"
                        disabled={item.quantity <= (item.product.min_quantity || 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.color)} 
                        className="p-1 rounded border border-border hover:bg-secondary disabled:opacity-50"
                        disabled={item.product.max_quantity ? item.quantity >= item.product.max_quantity : false}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.product.id, item.size, item.color)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg h-fit">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-card rounded-xl p-6 shadow-village-md border border-border h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4">{t.cart.orderSummary}</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.cart.subtotal}</span>
                <span>{(totalPrice + totalDiscount).toFixed(0)} {t.common.currency}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t.cart.discount}</span>
                  <span>-{totalDiscount.toFixed(0)} {t.common.currency}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.cart.delivery}</span>
                <span>{t.cart.toBeDetemined}</span>
              </div>
            </div>
            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>{t.cart.total}</span>
                <span className="text-primary">{totalPrice.toFixed(0)} {t.common.currency}</span>
              </div>
            </div>
            <Link to="/checkout">
              <Button className="w-full gradient-primary text-primary-foreground text-lg py-6">{t.cart.checkout}</Button>
            </Link>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
