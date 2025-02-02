import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign 
} from "lucide-react";

const Stats = () => {
  const stats = [
    {
      title: "Total Sales",
      value: "$2,345",
      icon: DollarSign,
      trend: "+12.5%",
    },
    {
      title: "Active Orders",
      value: "12",
      icon: ShoppingBag,
      trend: "+3",
    },
    {
      title: "Customers",
      value: "48",
      icon: Users,
      trend: "+5",
    },
    {
      title: "Revenue",
      value: "$890",
      icon: TrendingUp,
      trend: "+8.2%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              <p className="text-sm text-green-500 mt-1">{stat.trend}</p>
            </div>
            <div className="bg-secondary p-3 rounded-full">
              <stat.icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Stats;