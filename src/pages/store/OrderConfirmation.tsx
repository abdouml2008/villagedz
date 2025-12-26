import { Link } from 'react-router-dom';
import { CheckCircle, Home, Facebook, Instagram, Phone, Youtube, Send, MessageCircle, Twitter, Camera, Music2, Globe, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { queryConfig } from '@/lib/queryConfig';

const getIconComponent = (iconName: string | null) => {
  switch (iconName) {
    case 'Instagram': return Instagram;
    case 'Facebook': return Facebook;
    case 'Music2': return Music2;
    case 'MessageCircle': return MessageCircle;
    case 'Send': return Send;
    case 'Youtube': return Youtube;
    case 'Twitter': return Twitter;
    case 'Camera': return Camera;
    case 'Phone': return Phone;
    case 'Mail': return Mail;
    case 'Globe': return Globe;
    default: return Globe;
  }
};

export default function OrderConfirmation() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const { data: socialLinks = [] } = useQuery({
    queryKey: ['social-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    ...queryConfig.social,
  });

  const socialMediaLinks = socialLinks.filter(link => link.platform !== 'phone' && link.platform !== 'email');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce-slow">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Thank You Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? 'شكراً لك على طلبك!' : 'Thank you for your order!'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isRTL 
              ? 'سنتواصل معكم قريباً لتأكيد الطلب وترتيب التوصيل.' 
              : 'We will contact you shortly to confirm your order and arrange delivery.'}
          </p>
        </div>

        {/* Back to Home Button */}
        <div className="pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto px-8">
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              {isRTL ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
            </Link>
          </Button>
        </div>

        {/* Social Media Links */}
        <div className="pt-8 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            {isRTL ? 'تابعونا على وسائل التواصل' : 'Follow us on social media'}
          </h3>
          <div className="flex justify-center gap-4 flex-wrap">
            {socialMediaLinks.length > 0 ? (
              socialMediaLinks.map((link) => {
                const IconComp = getIconComponent(link.icon);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                  >
                    <IconComp className="w-5 h-5" />
                  </a>
                );
              })
            ) : (
              <>
                <a href="#" className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110">
                  <Instagram className="w-5 h-5" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
