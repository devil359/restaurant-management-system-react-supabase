
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign 
} from "lucide-react";

const Stats = () => {
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  // Fetch orders data
  const { data: ordersData } = useQuery({
    queryKey: ["dashboard-orders"],
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
        .from("orders")
        .select("*")
        .eq("restaurant_id", userProfile.restaurant_id);

      if (error) throw error;
      return data;
    },
  });

  // Calculate stats from orders
  const totalSales = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;
  const activeOrders = ordersData?.filter(order => order.status === "pending").length || 0;
  const uniqueCustomers = ordersData ? new Set(ordersData.map(order => order.customer_name)).size : 0;
  const todaysOrders = ordersData?.filter(order => {
    const orderDate = new Date(order.created_at).toDateString();
    const today = new Date().toDateString();
    return orderDate === today;
  }) || [];
  const todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);

  const stats = [
    {
      title: "Total Sales",
      value: `$${totalSales.toFixed(2)}`,
      icon: DollarSign,
      trend: "+12.5%",
      color: "text-green-600",
      chart: ordersData?.map(order => ({
        date: new Date(order.created_at).toLocaleDateString(),
        amount: order.total
      })) || []
    },
    {
      title: "Active Orders",
      value: activeOrders.toString(),
      icon: ShoppingBag,
      trend: "+3",
      color: "text-blue-600",
      data: ordersData?.filter(order => order.status === "pending") || []
    },
    {
      title: "Customers",
      value: uniqueCustomers.toString(),
      icon: Users,
      trend: "+5",
      color: "text-purple-600",
      data: ordersData?.map(order => ({
        name: order.customer_name,
        orders: 1,
        total: order.total
      })) || []
    },
    {
      title: "Today's Revenue",
      value: `$${todaysRevenue.toFixed(2)}`,
      icon: TrendingUp,
      trend: "+8.2%",
      color: "text-orange-600",
      chart: todaysOrders.map(order => ({
        time: new Date(order.created_at).toLocaleTimeString(),
        amount: order.total
      }))
    },
  ];

  const renderDetailView = (title: string, data: any) => {
    switch (title) {
      case "Total Sales":
        return (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#4C51BF" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "Active Orders":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.items.join(", ")}</TableCell>
                  <TableCell>${order.total}</TableCell>
                  <TableCell>{order.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "Customers":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((customer: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.orders}</TableCell>
                  <TableCell>${customer.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "Today's Revenue":
        return (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#ED8936" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedStat(stat.title)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="bg-secondary p-3 rounded-full">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-500 mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedStat} onOpenChange={() => setSelectedStat(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedStat}</DialogTitle>
          </DialogHeader>
          {selectedStat && renderDetailView(
            selectedStat,
            stats.find(stat => stat.title === selectedStat)
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Stats;
