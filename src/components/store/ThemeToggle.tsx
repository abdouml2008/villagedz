import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full hover:bg-secondary"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      title={resolvedTheme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  );
}
