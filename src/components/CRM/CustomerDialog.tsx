
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Customer } from "@/types/customer";
import { useForm, Controller } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Partial<Customer> | null;
  onSave: (customer: Partial<Customer>) => void;
  isLoading?: boolean;
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({
  open,
  onOpenChange,
  customer,
  onSave,
  isLoading = false
}) => {
  const isEditing = !!customer?.id;
  
  const { control, handleSubmit, formState: { errors } } = useForm<Partial<Customer>>({
    defaultValues: customer || {
      name: '',
      email: '',
      phone: '',
      address: '',
      birthday: '',
      preferences: '',
      tags: []
    }
  });

  const onSubmit = (data: Partial<Customer>) => {
    onSave({
      ...customer,
      ...data
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update customer information in your database.'
                : 'Add a new customer to your restaurant management system.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Customer name is required" }}
                render={({ field }) => (
                  <Input id="name" placeholder="Customer name" {...field} />
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  }}
                  render={({ field }) => (
                    <Input 
                      id="email" 
                      placeholder="customer@example.com" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  )}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="phone" 
                      placeholder="Phone number" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  )}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="address" 
                    placeholder="Customer address" 
                    {...field} 
                    value={field.value || ''} 
                  />
                )}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Controller
                name="birthday"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="birthday" 
                    type="date" 
                    {...field} 
                    value={field.value?.split('T')[0] || ''} 
                  />
                )}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="preferences">Preferences & Notes</Label>
              <Controller
                name="preferences"
                control={control}
                render={({ field }) => (
                  <Textarea 
                    id="preferences" 
                    placeholder="Allergies, table preferences, etc." 
                    {...field} 
                    value={field.value || ''} 
                    className="min-h-[100px]" 
                  />
                )}
              />
            </div>
          </div>
          
          {errors.root && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
