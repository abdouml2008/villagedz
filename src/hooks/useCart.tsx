import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '@/types/store';
import { toast } from 'sonner';

// Helper function to calculate item price with quantity discount
export function getItemPrice(item: CartItem): { originalPrice: number; discountedPrice: number; hasDiscount: boolean; discountPercentage: number } {
  const { product, quantity } = item;
  const originalPrice = product.price * quantity;
  
  if (product.discount_quantity && product.discount_percentage && quantity >= product.discount_quantity) {
    const discountedPrice = originalPrice * (1 - product.discount_percentage / 100);
    return { originalPrice, discountedPrice, hasDiscount: true, discountPercentage: product.discount_percentage };
  }
  
  return { originalPrice, discountedPrice: originalPrice, hasDiscount: false, discountPercentage: 0 };
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalDiscount: number;
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
    const stock = product.stock;
    
    // Check stock availability
    if (stock === 0) {
      toast.error('هذا المنتج غير متوفر حالياً');
      return;
    }
    
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.size === size && item.color === color
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        let newQuantity = updated[existingIndex].quantity + quantity;
        
        // Check against stock
        if (newQuantity > stock) {
          newQuantity = stock;
          toast.error(`الكمية المتوفرة هي ${stock} فقط`);
        } else if (maxQty && newQuantity > maxQty) {
          newQuantity = maxQty;
          toast.error(`الحد الأقصى للكمية هو ${maxQty}`);
        } else {
          toast.success('تم تحديث الكمية');
        }
        
        updated[existingIndex].quantity = newQuantity;
        return updated;
      }

      // Check if requested quantity exceeds stock
      let finalQuantity = Math.max(minQty, quantity);
      if (finalQuantity > stock) {
        finalQuantity = stock;
        toast.error(`الكمية المتوفرة هي ${stock} فقط`);
      }
      
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
    const stock = item.product.stock;
    
    if (quantity < minQty) {
      removeItem(productId, size, color);
      return;
    }
    
    // Check against stock
    if (quantity > stock) {
      toast.error(`الكمية المتوفرة هي ${stock} فقط`);
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
  
  const { totalPrice, totalDiscount } = items.reduce((acc, item) => {
    const { originalPrice, discountedPrice } = getItemPrice(item);
    return {
      totalPrice: acc.totalPrice + discountedPrice,
      totalDiscount: acc.totalDiscount + (originalPrice - discountedPrice)
    };
  }, { totalPrice: 0, totalDiscount: 0 });

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, totalDiscount }}>
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
