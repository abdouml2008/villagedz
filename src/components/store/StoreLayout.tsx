import { ReactNode } from 'react';
import { StoreHeader } from './StoreHeader';
import { StoreFooter } from './StoreFooter';

interface StoreLayoutProps {
  children: ReactNode;
}

export function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
