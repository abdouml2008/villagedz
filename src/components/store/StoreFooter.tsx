import { Link } from 'react-router-dom';
import { LogoMark } from './Logo';
import { Facebook, Instagram, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

export function StoreFooter() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  
  const { data: categories = [] } = useQuery({
    queryKey: ['footer-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return (
    <footer className="relative bg-card border-t border-border mt-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <LogoMark className="w-10 h-10" />
              <div>
                <h3 className="text-2xl font-bold text-gradient">{t.footer.storeName}</h3>
                <span className="text-xs text-muted-foreground">{t.footer.storeTagline}</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">{t.footer.storeDescription}</p>
            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t.footer.categories}</h4>
            <div className="flex flex-col gap-2">
              {categories.map((category) => (
                <Link 
                  key={category.id}
                  to={`/category/${category.slug}`} 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  {language === 'ar' ? category.name_ar : category.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t.footer.customerService}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/cart" className="text-muted-foreground hover:text-primary transition-colors text-sm">{t.footer.cart}</Link>
              <span className="text-muted-foreground text-sm">{t.footer.payOnDelivery}</span>
              <span className="text-muted-foreground text-sm">{t.footer.qualityGuarantee}</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t.footer.contactUs}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>📍 {t.footer.location}</p>
              <p>📧 info@village.dz</p>
              <p>📱 +213 XXX XXX XXX</p>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Village. {t.footer.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  );
}
