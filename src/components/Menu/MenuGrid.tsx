import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2 } from "lucide-react";

const MenuGrid = () => {
  const menuItems = [
    {
      id: 1,
      name: "Margherita Pizza",
      price: 14.99,
      category: "Pizza",
      image: "/placeholder.svg",
    },
    {
      id: 2,
      name: "Caesar Salad",
      price: 9.99,
      category: "Salads",
      image: "/placeholder.svg",
    },
    {
      id: 3,
      name: "Spaghetti Carbonara",
      price: 16.99,
      category: "Pasta",
      image: "/placeholder.svg",
    },
    {
      id: 4,
      name: "Grilled Salmon",
      price: 24.99,
      category: "Main Course",
      image: "/placeholder.svg",
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Items</h2>
        <Button className="bg-accent hover:bg-accent/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
                <p className="font-bold">${item.price}</p>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Item
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MenuGrid;