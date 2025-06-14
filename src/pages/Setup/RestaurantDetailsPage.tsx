import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form'; // Added Controller import
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth'; // Changed from useSimpleAuth

const restaurantDetailsSchema = z.object({
  name: z.string().min(2, { message: "Restaurant name must be at least 2 characters." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  currency: z.string().min(3, { message: "Currency code must be 3 characters (e.g., USD)." }),
});

type RestaurantDetailsFormData = z.infer<typeof restaurantDetailsSchema>;

const commonCurrencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "INR", name: "Indian Rupee" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
];

const RestaurantDetailsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: isLoadingUser } = useAuth(); // Use user from useAuth, and its loading state
  const restaurantId = user?.restaurant_id;

  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });

  const { register, handleSubmit, formState: { errors }, reset, control, setValue } = useForm<RestaurantDetailsFormData>({
    resolver: zodResolver(restaurantDetailsSchema),
  });

  useEffect(() => {
    if (restaurant) {
      setValue('name', restaurant.name || '');
      setValue('address', restaurant.address || '');
      setValue('currency', restaurant.currency || '');
    }
  }, [restaurant, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: RestaurantDetailsFormData) => {
      if (!restaurantId) throw new Error("Restaurant ID not found.");
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          name: data.name,
          address: data.address,
          currency: data.currency,
         })
        .eq('id', restaurantId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Restaurant Details Saved!",
        description: "Your restaurant information has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurantSetupStatus', restaurantId] });
      navigate('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Details",
        description: error.message || "Could not save restaurant details.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RestaurantDetailsFormData) => {
    mutation.mutate(data);
  };

  if (isLoadingUser || (restaurantId && isLoadingRestaurant && !restaurant)) {
    return <div className="flex justify-center items-center h-screen">Loading restaurant data...</div>;
  }
  
  if (!isLoadingUser && !user) {
     // This case should ideally be handled by ProtectedRoute redirecting to /auth
     return <div className="flex justify-center items-center h-screen">User not authenticated. Redirecting...</div>;
  }
  
  if (!isLoadingUser && user && !restaurantId) {
    // User is loaded and authenticated, but no restaurant_id associated.
    // This is an account setup issue.
    return <div className="flex justify-center items-center h-screen text-red-500">Error: No restaurant associated with this account. Please contact support or check your profile.</div>;
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Restaurant Setup</CardTitle>
          <CardDescription className="text-center">
            Let's start by setting up your restaurant's basic information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Restaurant Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., The Grand Eatery" />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} placeholder="e.g., 123 Main St, Foodville" />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonCurrencies.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>}
            </div>
            
            <Button type="submit" className="w-full" disabled={mutation.isPending || isLoadingUser}>
              {mutation.isPending ? 'Saving...' : 'Save and Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantDetailsPage;
