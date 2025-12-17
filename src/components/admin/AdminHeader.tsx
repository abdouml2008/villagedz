import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowRight, Home } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  showBackButton?: boolean;
  showLogo?: boolean;
}

export function AdminHeader({ title, showBackButton = true, showLogo = false }: AdminHeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin');
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link to="/admin/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
          {showLogo ? (
            <Link to="/admin/dashboard" className="text-2xl font-bold text-gradient">Village Admin</Link>
          ) : (
            <h1 className="text-xl font-bold">{title}</h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <Home className="w-5 h-5" />
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSignOut}
            title="تسجيل الخروج"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
