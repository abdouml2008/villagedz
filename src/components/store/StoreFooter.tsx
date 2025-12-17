import { Link } from 'react-router-dom';

export function StoreFooter() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-gradient mb-4">Village</h3>
            <p className="text-muted-foreground">متجركم المفضل للتسوق عبر الإنترنت في الجزائر</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">الأقسام</h4>
            <div className="flex flex-col gap-2">
              <Link to="/category/men" className="text-muted-foreground hover:text-primary transition-colors">ملابس رجالية</Link>
              <Link to="/category/women" className="text-muted-foreground hover:text-primary transition-colors">ملابس نسائية</Link>
              <Link to="/category/kids" className="text-muted-foreground hover:text-primary transition-colors">ملابس أطفال</Link>
              <Link to="/category/other" className="text-muted-foreground hover:text-primary transition-colors">أغراض أخرى</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">تواصل معنا</h4>
            <p className="text-muted-foreground">الجزائر</p>
            <p className="text-muted-foreground">info@village.dz</p>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>© 2024 Village. جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}
