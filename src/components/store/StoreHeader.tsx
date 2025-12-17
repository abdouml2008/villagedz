import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Settings, LogIn } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { Logo } from './Logo';

export function StoreHeader() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { hasRole } = useHasAnyRole();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-village-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/category/men" className="text-foreground hover:text-primary transition-colors font-medium">
              رجالي
            </Link>
            <Link to="/category/women" className="text-foreground hover:text-primary transition-colors font-medium">
              نسائي
            </Link>
            <Link to="/category/kids" className="text-foreground hover:text-primary transition-colors font-medium">
              أطفال
            </Link>
            <Link to="/category/other" className="text-foreground hover:text-primary transition-colors font-medium">
              أخرى
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link 
              to={hasRole ? "/admin/dashboard" : "/admin"} 
              className="p-2 hover:bg-secondary rounded-full transition-colors"
              title={hasRole ? "لوحة التحكم" : "تسجيل الدخول"}
            >
              {hasRole ? <Settings className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </Link>
            <Link to="/cart" className="relative p-2 hover:bg-secondary rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-4 border-t border-border pt-4">
            <Link to="/category/men" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setMenuOpen(false)}>
              رجالي
            </Link>
            <Link to="/category/women" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setMenuOpen(false)}>
              نسائي
            </Link>
            <Link to="/category/kids" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setMenuOpen(false)}>
              أطفال
            </Link>
            <Link to="/category/other" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setMenuOpen(false)}>
              أخرى
            </Link>
            <Link 
              to={hasRole ? "/admin/dashboard" : "/admin"} 
              className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              {hasRole ? <Settings className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              {hasRole ? "لوحة التحكم" : "تسجيل الدخول"}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
