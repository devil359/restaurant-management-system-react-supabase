import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AddMenuItemFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
};

const AddMenuItemForm = ({ onClose, onSuccess }: AddMenuItemFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's restaurant_id from their profile
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (!profile?.restaurant_id) throw new Error('No restaurant assigned');

      console.log('Fetched user profile:', profile);
      return profile;
    },
  });

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      image_url: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting menu item:", data);

      if (!userProfile?.restaurant_id) {
        throw new Error('No restaurant assigned to user');
      }

      const { error } = await supabase.from("menu_items").insert([
        {
          name: data.name,
          description: data.description,
          price: parseFloat(data.price),
          category: data.category,
          image_url: data.image_url,
          restaurant_id: userProfile.restaurant_id,
          is_available: true,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item added successfully",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding menu item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add menu item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg w-full max-w-md relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold mb-4">Add New Menu Item</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Item description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Item category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Image URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddMenuItemForm;