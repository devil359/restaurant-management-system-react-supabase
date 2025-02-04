import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Package, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorder_level: number | null;
  cost_per_unit: number | null;
  restaurant_id: string;
}

const Inventory = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const { data: items = [], refetch } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
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

      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("restaurant_id", userProfile.restaurant_id)
        .order("name");

      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData = {
      name: formData.get("name") as string,
      quantity: parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      reorder_level: formData.get("reorderLevel") ? parseFloat(formData.get("reorderLevel") as string) : null,
      cost_per_unit: formData.get("costPerUnit") ? parseFloat(formData.get("costPerUnit") as string) : null,
    };

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

      if (editingItem) {
        const { error } = await supabase
          .from("inventory_items")
          .update({ ...itemData })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Inventory item updated successfully" });
      } else {
        const { error } = await supabase
          .from("inventory_items")
          .insert([{ ...itemData, restaurant_id: userProfile.restaurant_id }]);

        if (error) throw error;
        toast({ title: "Inventory item added successfully" });
      }

      refetch();
      setIsAddDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Inventory item deleted successfully" });
      refetch();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const commonUnits = ["kg", "g", "l", "ml", "units", "pieces", "boxes", "packs"];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your restaurant's inventory items
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)}>
              <Plus className="mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingItem?.name}
                  required
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  defaultValue={editingItem?.quantity}
                  required
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select name="unit" defaultValue={editingItem?.unit || commonUnits[0]}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  name="reorderLevel"
                  type="number"
                  step="0.01"
                  defaultValue={editingItem?.reorder_level || ""}
                  placeholder="Enter reorder level"
                />
              </div>
              <div>
                <Label htmlFor="costPerUnit">Cost per Unit</Label>
                <Input
                  id="costPerUnit"
                  name="costPerUnit"
                  type="number"
                  step="0.01"
                  defaultValue={editingItem?.cost_per_unit || ""}
                  placeholder="Enter cost per unit"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? "Update" : "Add"} Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit}
                  </p>
                  {item.reorder_level && item.quantity <= item.reorder_level && (
                    <div className="flex items-center gap-1 mt-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <Badge variant="destructive" className="text-xs">
                        Low Stock
                      </Badge>
                    </div>
                  )}
                  {item.cost_per_unit && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Cost: ${item.cost_per_unit}/{item.unit}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingItem(item);
                    setIsAddDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Inventory;