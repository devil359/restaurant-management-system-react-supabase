
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  notes?: string;
}

const AddCustomerDialog = ({ open, onOpenChange, onSuccess }: AddCustomerDialogProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();

      if (!userProfile?.restaurant_id) {
        throw new Error("No restaurant found for user");
      }

      // Check if customer already exists
      const { data: existingCustomer } = await supabase
        .from("customer_insights")
        .select("*")
        .eq("customer_name", data.name)
        .eq("restaurant_id", userProfile.restaurant_id)
        .maybeSingle();

      if (existingCustomer) {
        toast({
          title: "Customer already exists",
          description: "A customer with this name already exists.",
          variant: "destructive"
        });
        return;
      }

      // Create new customer
      const now = new Date().toISOString();
      
      const customerData = {
        id: crypto.randomUUID(),
        customer_name: data.name,
        restaurant_id: userProfile.restaurant_id,
        visit_count: 0,
        total_spent: 0,
        average_order_value: 0,
        first_visit: now,
        last_visit: now
      };
      
      const { error } = await supabase
        .from("customer_insights")
        .insert([customerData]);

      if (error) throw error;

      toast({
        title: "Customer added",
        description: "Customer has been successfully added."
      });

      // Reset form and refresh data
      reset();
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onSuccess();
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Customer Name <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                {...register("name", { required: "Customer name is required" })} 
                placeholder="Enter customer name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                {...register("phone")} 
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                {...register("email", { 
                  pattern: { 
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                    message: "Invalid email address" 
                  } 
                })} 
                placeholder="Enter email address"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input 
                id="birthday" 
                type="date" 
                {...register("birthday")} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              {...register("address")} 
              placeholder="Enter address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              {...register("notes")} 
              placeholder="Enter any notes about this customer"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;
