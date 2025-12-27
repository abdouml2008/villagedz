import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSupabase } from './useSupabase';
import { useHasAnyRole } from './useHasAnyRole';
import { logger } from '@/lib/logger';

export const ADMIN_SECTIONS = [
  { id: 'products', name: 'إدارة المنتجات', nameEn: 'Products' },
  { id: 'orders', name: 'إدارة الطلبات', nameEn: 'Orders' },
  { id: 'delivery-prices', name: 'أسعار التوصيل', nameEn: 'Delivery Prices' },
  { id: 'analytics', name: 'التحليلات', nameEn: 'Analytics' },
  { id: 'coupons', name: 'كوبونات الخصم', nameEn: 'Coupons' },
  { id: 'categories', name: 'إدارة الأقسام', nameEn: 'Categories' },
  { id: 'banners', name: 'البانرات الترويجية', nameEn: 'Banners' },
  { id: 'reviews', name: 'إدارة التقييمات', nameEn: 'Reviews' },
  { id: 'social-links', name: 'وسائل التواصل', nameEn: 'Social Links' },
  { id: 'tracking-pixels', name: 'بيكسلات التتبع', nameEn: 'Tracking Pixels' },
] as const;

export type AdminSection = typeof ADMIN_SECTIONS[number]['id'];

export function useUserPermissions(section?: AdminSection) {
  const { user, loading: authLoading } = useAuth();
  const { supabase, loading: supabaseLoading } = useSupabase();
  const { isAdmin, loading: roleLoading } = useHasAnyRole();
  const [hasAccess, setHasAccess] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermissions() {
      if (!user || !supabase) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Admins have full access
      if (isAdmin) {
        setHasAccess(true);
        const allPermissions: Record<string, boolean> = {};
        ADMIN_SECTIONS.forEach(s => {
          allPermissions[s.id] = true;
        });
        setPermissions(allPermissions);
        setLoading(false);
        return;
      }

      try {
        // Fetch user permissions
        const { data, error } = await supabase
          .from('user_permissions')
          .select('section, has_access')
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error fetching permissions:', error);
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const permMap: Record<string, boolean> = {};
        data?.forEach(p => {
          permMap[p.section] = p.has_access;
        });
        setPermissions(permMap);

        // Check specific section access
        if (section) {
          setHasAccess(permMap[section] === true);
        }
      } catch (err) {
        logger.error('Error checking permissions:', err);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && !supabaseLoading && !roleLoading) {
      checkPermissions();
    }
  }, [user, authLoading, supabase, supabaseLoading, isAdmin, roleLoading, section]);

  return { 
    hasAccess, 
    permissions, 
    loading: loading || authLoading || supabaseLoading || roleLoading,
    isAdmin 
  };
}
