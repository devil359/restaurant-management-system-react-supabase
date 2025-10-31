
import { useState } from "react";
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";
import { useStatsData } from "@/hooks/useStatsData";
import { formatIndianCurrency } from "@/utils/formatters";
import StatCard from "./StatCard";
import StatDetails from "./StatDetails";

const Stats = () => {
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const { data: statsData } = useStatsData();

  // Get all revenue sources
  const allRevenueSources = statsData?.allRevenueSources || [];
  const orders = statsData?.orders || [];

  // Calculate stats from ALL revenue sources - only count completed/paid for revenue
  const completedRevenue = allRevenueSources.filter(item => 
    item.status === 'completed' || item.status === 'paid'
  );
  const totalSales = completedRevenue.reduce((sum, item) => sum + (item.total || 0), 0);
  
  // Active orders should only include pending, preparing, and ready status (from POS orders only)
  const activeOrders = orders.filter(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  ).length || 0;
  
  const uniqueCustomers = orders.length > 0 
    ? new Set(orders.map(order => order.customer_name).filter(Boolean)).size 
    : 0;
  
  // Today's revenue - completed orders + paid room billings from today
  const today = new Date().toDateString();
  const todaysRevenue = completedRevenue
    .filter(item => new Date(item.created_at).toDateString() === today)
    .reduce((sum, item) => sum + (item.total || 0), 0);

  const stats = [
    {
      title: "Total Sales",
      value: formatIndianCurrency(totalSales).formatted,
      icon: DollarSign,
      trend: "+12.5%",
      color: "text-green-600 dark:text-green-400",
      type: "sales" as const,
      chart: completedRevenue.map(item => ({
        date: new Date(item.created_at).toLocaleDateString(),
        amount: item.total
      }))
    },
    {
      title: "Active Orders",
      value: activeOrders.toString(),
      icon: ShoppingBag,
      trend: "+3",
      color: "text-blue-600 dark:text-blue-400",
      type: "orders" as const,
      data: orders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status))
    },
    {
      title: "Customers",
      value: uniqueCustomers.toString(),
      icon: Users,
      trend: "+5",
      color: "text-purple-600 dark:text-purple-400",
      type: "customers" as const,
      data: orders.map(order => ({
        name: order.customer_name,
        orders: 1,
        total: order.total
      }))
    },
    {
      title: "Today's Revenue",
      value: formatIndianCurrency(todaysRevenue).formatted,
      icon: TrendingUp,
      trend: "+8.2%",
      color: "text-orange-600 dark:text-orange-400",
      type: "revenue" as const,
      chart: completedRevenue
        .filter(item => new Date(item.created_at).toDateString() === today)
        .map(item => ({
          time: new Date(item.created_at).toLocaleTimeString(),
          amount: item.total
        }))
    },
  ];

  // Find the selected stat data
  const selectedStatData = selectedStat ? stats.find(stat => stat.title === selectedStat) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            color={stat.color}
            onClick={() => setSelectedStat(stat.title)}
          />
        ))}
      </div>

      {selectedStatData && (
        <StatDetails
          title={selectedStat}
          data={selectedStatData}
          type={selectedStatData.type}
          onClose={() => setSelectedStat(null)}
        />
      )}
    </div>
  );
};

export default Stats;
