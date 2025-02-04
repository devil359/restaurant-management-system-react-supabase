import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddOrderForm = ({ onSuccess, onCancel }: AddOrderFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      customerName: "",
      items: "",
      total: "",
      status: "pending",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }

      const { error } = await supabase.from("orders").insert({
        customer_name: values.customerName,
        items: values.items.split(",").map((item: string) => item.trim()),
        total: parseFloat(values.total),
        status: values.status,
        restaurant_id: profile.restaurant_id,
      });

      if (error) throw error;
      
      onSuccess();
    } catch (error) {
      console.error("Error adding order:", error);
      toast({
        title: "Error",
        description: "Failed to add order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter customer name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="items"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Items (comma-separated)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Item 1, Item 2, Item 3" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="Enter total amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Order
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default AddOrderForm;