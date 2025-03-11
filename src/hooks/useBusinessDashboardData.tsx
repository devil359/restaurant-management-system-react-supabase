import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, addDays } from "date-fns";

export const useBusinessDashboardData = () => {
  return useQuery({
    queryKey: ["business-dashboard-data"],
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

      const restaurantId = userProfile.restaurant_id;

      // Fetch expense data from orders and inventory_items
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(100);

      const { data: inventoryData } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("restaurant_id", restaurantId);

      // Fetch staffing data
      const { data: staffData } = await supabase
        .from("staff")
        .select("*")
        .eq("restaurant_id", restaurantId);

      // Calculate expense breakdown based on real data
      const totalOrderRevenue = orderData?.reduce((sum, order) => sum + order.total, 0) || 0;
      
      // Calculate ingredient costs (from inventory)
      const ingredientsCost = inventoryData?.reduce((sum, item) => {
        return item.category.toLowerCase().includes("ingredient") ? 
          sum + (item.cost_per_unit || 0) * (item.quantity || 0) : sum;
      }, 0) || 0;

      // Utilities cost estimation (20% of total revenue)
      const utilitiesCost = totalOrderRevenue * 0.12;
      
      // Staff cost calculation
      const staffCost = staffData?.length ? staffData.length * 12000 : 25000; // Avg salary per staff
      
      // Rent cost estimation (15% of revenue)
      const rentCost = totalOrderRevenue * 0.10;
      
      // Other costs
      const otherCost = totalOrderRevenue * 0.04;
      
      // Total operational costs
      const totalOperationalCost = ingredientsCost + utilitiesCost + staffCost + rentCost + otherCost;

      // Format expense data for charts
      const expenseData = [
        { 
          name: "Ingredients", 
          value: Math.round(ingredientsCost), 
          percentage: Math.round((ingredientsCost / totalOperationalCost) * 100) 
        },
        { 
          name: "Utilities", 
          value: Math.round(utilitiesCost), 
          percentage: Math.round((utilitiesCost / totalOperationalCost) * 100) 
        },
        { 
          name: "Staff", 
          value: Math.round(staffCost), 
          percentage: Math.round((staffCost / totalOperationalCost) * 100) 
        },
        { 
          name: "Rent", 
          value: Math.round(rentCost), 
          percentage: Math.round((rentCost / totalOperationalCost) * 100) 
        },
        { 
          name: "Other", 
          value: Math.round(otherCost), 
          percentage: Math.round((otherCost / totalOperationalCost) * 100) 
        }
      ];

      // Calculate peak hours data based on order timestamps
      const hourCounts = {};
      
      // Initialize all hours with 0
      for (let i = 9; i <= 22; i++) {
        const hourLabel = i <= 12 ? `${i} AM` : `${i-12} PM`;
        hourCounts[hourLabel] = 0;
      }
      
      // Count orders by hour
      if (orderData) {
        orderData.forEach(order => {
          const orderDate = new Date(order.created_at);
          const hour = orderDate.getHours();
          
          // Only count business hours (9 AM to 10 PM)
          if (hour >= 9 && hour <= 22) {
            const hourLabel = hour <= 12 ? `${hour} AM` : `${hour-12} PM`;
            hourCounts[hourLabel] = (hourCounts[hourLabel] || 0) + 1;
          }
        });
      }
      
      // Convert to array format for chart
      const peakHoursData = Object.entries(hourCounts).map(([hour, customers]) => ({
        hour,
        customers: customers as number
      }));

      // Calculate promotional opportunities based on peak hours
      const lowTrafficHours = peakHoursData
        .filter(d => d.customers < (Math.max(...peakHoursData.map(h => h.customers)) * 0.5))
        .map(d => d.hour);
      
      // Get day of week distribution
      const dayOfWeekCounts = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
      
      if (orderData) {
        orderData.forEach(order => {
          const orderDate = new Date(order.created_at);
          const dayOfWeek = format(orderDate, 'EEE');
          dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
        });
      }
      
      // Find the slowest weekday
      const slowestWeekday = Object.entries(dayOfWeekCounts)
        .filter(([day]) => !['Sat', 'Sun'].includes(day))
        .sort((a, b) => a[1] - b[1])[0]?.[0] || 'Mon';

      // Create promotional suggestions based on data analysis
      const promotionalData = [
        { 
          id: 1, 
          name: "Happy Hour", 
          timePeriod: "5 PM - 7 PM", 
          potentialIncrease: "25%", 
          status: peakHoursData.find(d => d.hour === "5 PM")?.customers < 
                 (Math.max(...peakHoursData.map(h => h.customers)) * 0.7) ? "suggested" : "active" 
        },
        { 
          id: 2, 
          name: "Weekend Brunch", 
          timePeriod: "Sat-Sun, 9 AM - 2 PM", 
          potentialIncrease: "35%", 
          status: dayOfWeekCounts['Sat'] > dayOfWeekCounts['Sun'] * 1.5 ? "active" : "suggested" 
        },
        { 
          id: 3, 
          name: `${slowestWeekday} Special`, 
          timePeriod: `Every ${slowestWeekday}`, 
          potentialIncrease: "20%", 
          status: "suggested" 
        },
        { 
          id: 4, 
          name: "Corporate Lunch", 
          timePeriod: "Weekdays, 12 PM - 2 PM", 
          potentialIncrease: "30%", 
          status: lowTrafficHours.includes("12 PM") ? "suggested" : "active" 
        },
        { 
          id: 5, 
          name: "Seasonal Menu", 
          timePeriod: format(new Date(), 'MMM - ') + format(addDays(new Date(), 90), 'MMM'), 
          potentialIncrease: "40%", 
          status: "suggested" 
        }
      ];

      // For document analysis, use actual order data
      // Recent orders converted to "documents" for analysis
      const documents = orderData ? orderData.slice(0, 3).map(order => {
        return {
          name: `Order_${order.id.slice(0, 8)}.xlsx`,
          type: "Excel",
          date: format(new Date(order.created_at), 'yyyy-MM-dd'),
          insights: `Order total: ₹${order.total} with ${order.items.length} items`
        };
      }) : [];

      // Create business insights based on data analysis
      const insights = [];
      
      // Low inventory insights
      const lowStockItems = inventoryData?.filter(item => 
        item.quantity <= (item.reorder_level || 0)
      ) || [];
      
      if (lowStockItems.length > 0) {
        insights.push({
          type: "inventory",
          title: "Inventory Alert",
          message: `${lowStockItems.length} items are below reorder level and need attention.`
        });
      }
      
      // Revenue insights
      if (orderData && orderData.length > 0) {
        const last30DaysOrders = orderData.filter(order => 
          new Date(order.created_at) >= subDays(new Date(), 30)
        );
        
        if (last30DaysOrders.length > 0) {
          const averageOrderValue = last30DaysOrders.reduce((sum, order) => sum + order.total, 0) / last30DaysOrders.length;
          
          if (averageOrderValue > 0) {
            insights.push({
              type: "revenue",
              title: "Revenue Opportunity",
              message: `Your average order value is ₹${averageOrderValue.toFixed(0)}. Consider upselling strategies to increase it by 15%.`
            });
          }
        }
      }
      
      // Seasonal opportunity based on current month
      const currentMonth = format(new Date(), 'MMMM');
      insights.push({
        type: "seasonal",
        title: "Seasonal Opportunity",
        message: `${currentMonth} is approaching. Prepare special promotions to increase traffic based on previous year's data.`
      });

      return {
        expenseData,
        peakHoursData,
        promotionalData,
        documents,
        insights,
        totalOperationalCost,
        staffData: staffData || []
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
