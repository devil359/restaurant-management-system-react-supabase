
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurantId } from '@/hooks/useRestaurantId';

const RealtimeCustomers = () => {
  const queryClient = useQueryClient();
  const { restaurantId } = useRestaurantId();
  
  useEffect(() => {
    if (!restaurantId) return;
    
    // Enable real-time updates for customers table
    const customersChannel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'customers',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          // Invalidate and refetch customers data
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
      )
      .subscribe();
      
    // Enable real-time updates for customer notes
    const notesChannel = supabase
      .channel('customer-notes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_notes' },
        (payload) => {
          // Invalidate specific customer notes
          if (payload.new && payload.new.customer_id) {
            queryClient.invalidateQueries({ 
              queryKey: ['customer-notes', payload.new.customer_id] 
            });
          }
        }
      )
      .subscribe();
      
    // Enable real-time updates for customer activities
    const activitiesChannel = supabase
      .channel('customer-activities-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_activities' },
        (payload) => {
          // Invalidate specific customer activities
          if (payload.new && payload.new.customer_id) {
            queryClient.invalidateQueries({ 
              queryKey: ['customer-activities', payload.new.customer_id] 
            });
          }
        }
      )
      .subscribe();
    
    // Cleanup on unmount
    return () => {
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, [queryClient, restaurantId]);
  
  // This is a utility component that doesn't render anything
  return null;
};

export default RealtimeCustomers;
