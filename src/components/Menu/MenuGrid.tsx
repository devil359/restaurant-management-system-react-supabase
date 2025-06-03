import { useState, useEffect, useCallback, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, CakeSlice, Coffee, Pizza, Beef, Soup, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import AddMenuItemForm from "./AddMenuItemForm";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  is_available: boolean;
  created_at: string;
  is_veg?: boolean;
  is_special?: boolean;
}

// Memoized MenuItem component with enhanced design
const MenuItemCard = memo(({ 
  item, 
  onEdit, 
  onDelete, 
  getCategoryIcon 
}: { 
  item: MenuItem, 
  onEdit: (item: MenuItem) => void, 
  onDelete: (id: string) => void, 
  getCategoryIcon: (category: string) => JSX.Element 
}) => (
  <Card key={item.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-[1.02]">
    <div className="relative h-52">
      <img
        src={item.image_url || "/placeholder.svg"}
        alt={item.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      
      {/* Category Icon */}
      <div className="absolute top-3 right-3">
        <div className="p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
          {getCategoryIcon(item.category)}
        </div>
      </div>
      
      {/* Veg/Non-Veg Badge */}
      <div className="absolute top-3 left-3">
        {item.is_veg ? (
          <div className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
            Veg
          </div>
        ) : (
          <div className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
            Non-Veg
          </div>
        )}
      </div>
      
      {/* Special Badge */}
      {item.is_special && (
        <div className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
          ⭐ Special
        </div>
      )}
      
      {/* Price Overlay */}
      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full">
        <span className="font-bold text-lg">₹{item.price}</span>
      </div>
    </div>
    
    <div className="p-5">
      <div className="mb-4">
        <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">{item.name}</h3>
        <p className="text-sm text-purple-600 font-medium mb-2">{item.category}</p>
        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
      </div>
      
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors"
          onClick={() => onEdit(item)}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  </Card>
));

const MenuGrid = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      console.log('Fetching menu items...');
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching menu items:', error);
        throw error;
      }

      console.log('Fetched menu items:', data);
      return data as MenuItem[];
    },
    staleTime: 60000, // 1 minute cache
    refetchOnWindowFocus: false, // Prevent refetch on window focus to avoid loading flashes
  });

  // Delete menu item mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    },
  });

  const getCategoryIcon = useCallback((category: string) => {
    switch (category?.toLowerCase()) {
      case 'desserts':
        return <CakeSlice className="h-5 w-5 text-pink-500" />;
      case 'beverages':
        return <Coffee className="h-5 w-5 text-brown-500" />;
      case 'main course':
        return <Pizza className="h-5 w-5 text-orange-500" />;
      case 'non-veg':
        return <Beef className="h-5 w-5 text-red-500" />;
      default:
        return <Soup className="h-5 w-5 text-purple-600" />;
    }
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      deleteMenuItemMutation.mutate(id);
    }
  }, [deleteMenuItemMutation]);

  // Handle edit
  const handleEdit = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setShowAddForm(true);
  }, []);

  // Handle close form
  const handleCloseForm = useCallback(() => {
    setShowAddForm(false);
    setEditingItem(null);
  }, []);

  // Filter menu items based on search query and active category
  const filteredMenuItems = menuItems?.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === "all") {
      return matchesSearch;
    } else if (activeCategory === "veg") {
      return matchesSearch && item.is_veg === true;
    } else if (activeCategory === "non-veg") {
      return matchesSearch && item.is_veg === false;
    } else if (activeCategory === "special") {
      return matchesSearch && item.is_special === true;
    } else {
      return matchesSearch && item.category === activeCategory;
    }
  });

  // Group items by category (memoize this operation)
  const groupedItems = useCallback(() => {
    if (!menuItems) return {};
    
    return menuItems.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menuItems]);

  const groupedItemsData = groupedItems();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Menu Items</h2>
          <p className="text-gray-600 mt-1">Manage your restaurant's delicious offerings</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => {
            setEditingItem(null);
            setShowAddForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Enhanced Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          placeholder="Search menu items by name, description, or category..."
          className="pl-12 h-12 text-base border-gray-200 focus:border-purple-400 focus:ring-purple-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Enhanced Category Tabs */}
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1 bg-gray-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">All Items</TabsTrigger>
          <TabsTrigger value="veg" className="text-green-600 data-[state=active]:bg-green-600 data-[state=active]:text-white">Vegetarian</TabsTrigger>
          <TabsTrigger value="non-veg" className="text-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white">Non-Veg</TabsTrigger>
          <TabsTrigger value="special" className="text-purple-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">Specials</TabsTrigger>
          {Object.keys(groupedItemsData).slice(0, 3).map((category) => (
            <TabsTrigger key={category} value={category} className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Category Statistics */}
        {activeCategory === "all" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {Object.entries(groupedItemsData).map(([category, items]) => (
              <Card key={category} className="flex items-center gap-3 p-4 bg-gradient-to-br from-white to-gray-50 border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                {getCategoryIcon(category)}
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm">{category}</h3>
                  <p className="text-xs text-gray-500">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Tabs>

      {/* Enhanced Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredMenuItems?.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center border-2 border-dashed border-gray-200">
              <div className="text-gray-400 mb-4">
                <Soup className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No menu items found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or category filter</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
              >
                Clear Filters
              </Button>
            </Card>
          </div>
        ) : (
          filteredMenuItems?.map((item) => (
            <MenuItemCard 
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getCategoryIcon={getCategoryIcon}
            />
          ))
        )}
      </div>

      {showAddForm && (
        <AddMenuItemForm
          onClose={handleCloseForm}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['menuItems'] })}
          editingItem={editingItem}
        />
      )}
    </div>
  );
};

export default MenuGrid;
