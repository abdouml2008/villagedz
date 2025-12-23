import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Settings, LogIn, Search } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useHasAnyRole } from '@/hooks/useHasAnyRole';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { SearchDialog } from './SearchDialog';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryConfig } from '@/lib/queryConfig';

export function StoreHeader() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { hasRole } = useHasAnyRole();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data;
    },
    ...queryConfig.static,
  });

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-village-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo />

            <nav className="hidden md:flex items-center gap-8">
              {categories.map((category) => (
                <Link 
                  key={category.id}
                  to={`/category/${category.slug}`} 
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {language === 'ar' ? category.name_ar : category.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-secondary"
                onClick={() => setSearchOpen(true)}
                title={t.header.search}
              >
                <Search className="w-5 h-5" />
              </Button>
              <LanguageSwitcher />
              <ThemeToggle />
              <Link 
                to={hasRole ? "/admin/dashboard" : "/admin"} 
                className="p-2 hover:bg-secondary rounded-full transition-colors"
                title={hasRole ? t.header.adminPanel : t.header.login}
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
            {categories.map((category) => (
              <Link 
                key={category.id}
                to={`/category/${category.slug}`} 
                className="text-foreground hover:text-primary transition-colors font-medium" 
                onClick={() => setMenuOpen(false)}
              >
                {language === 'ar' ? category.name_ar : category.name}
              </Link>
            ))}
            <Link 
              to={hasRole ? "/admin/dashboard" : "/admin"} 
              className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              {hasRole ? <Settings className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              {hasRole ? t.header.adminPanel : t.header.login}
            </Link>
          </nav>
        )}
        </div>
      </header>
      
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
