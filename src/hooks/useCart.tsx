import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/types/store';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('village-cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('village-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1, size?: string, color?: string) => {
    const minQty = product.min_quantity || 1;
    const maxQty = product.max_quantity;
    
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.size === size && item.color === color
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        let newQuantity = updated[existingIndex].quantity + quantity;
        
        if (maxQty && newQuantity > maxQty) {
          newQuantity = maxQty;
          toast.error(`الحد الأقصى للكمية هو ${maxQty}`);
        } else {
          toast.success('تم تحديث الكمية');
        }
        
        updated[existingIndex].quantity = newQuantity;
        return updated;
      }

      const finalQuantity = Math.max(minQty, quantity);
      toast.success('تمت الإضافة إلى السلة');
      return [...prev, { product, quantity: finalQuantity, size, color }];
    });
  };

  const removeItem = (productId: string, size?: string, color?: string) => {
    setItems(prev => prev.filter(
      item => !(item.product.id === productId && item.size === size && item.color === color)
    ));
    toast.success('تم الحذف من السلة');
  };

  const updateQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    const item = items.find(i => i.product.id === productId && i.size === size && i.color === color);
    if (!item) return;
    
    const minQty = item.product.min_quantity || 1;
    const maxQty = item.product.max_quantity;
    
    if (quantity < minQty) {
      removeItem(productId, size, color);
      return;
    }
    
    if (maxQty && quantity > maxQty) {
      toast.error(`الحد الأقصى للكمية هو ${maxQty}`);
      return;
    }
    
    setItems(prev => prev.map(item => 
      item.product.id === productId && item.size === size && item.color === color
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('village-cart');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
