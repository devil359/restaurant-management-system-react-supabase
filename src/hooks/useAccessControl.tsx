import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { fetchAllowedComponents } from '@/utils/subscriptionUtils';
import { supabase } from '@/integrations/supabase/client';

interface AccessControl {
  hasAccess: (component: string) => boolean;
  allowedComponents: string[];
  loading: boolean;
}

/**
 * Hook that combines role-based permissions with subscription-based component access
 */
export const useAccessControl = (): AccessControl => {
  const { user } = useAuth();
  const [allowedComponents, setAllowedComponents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllowedComponents = async () => {
      if (!user?.restaurant_id) {
        setLoading(false);
        return;
      }

      try {
        const components = await fetchAllowedComponents(user.restaurant_id);
        setAllowedComponents(components);
      } catch (error) {
        console.error('Error loading allowed components:', error);
        setAllowedComponents([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllowedComponents();
  }, [user?.restaurant_id]);

  const hasAccess = (component: string): boolean => {
    if (!user) return false;
    
    // Check if the component is in the allowed list from subscription
    return allowedComponents.includes(component);
  };

  return {
    hasAccess,
    allowedComponents,
    loading
  };
};
