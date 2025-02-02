import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

const OrderList = () => {
  const orders = [
    {
      id: "#1234",
      customer: "John Doe",
      items: ["Margherita Pizza", "Caesar Salad"],
      total: 24.98,
      status: "In Progress",
      time: "10 min ago",
    },
    {
      id: "#1235",
      customer: "Jane Smith",
      items: ["Spaghetti Carbonara", "Grilled Salmon"],
      total: 41.98,
      status: "Ready",
      time: "15 min ago",
    },
    {
      id: "#1236",
      customer: "Mike Johnson",
      items: ["Caesar Salad"],
      total: 9.99,
      status: "Completed",
      time: "25 min ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-yellow-500";
      case "Ready":
        return "bg-green-500";
      case "Completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold">Active Orders</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{order.id}</h3>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <User className="w-4 h-4 mr-1" />
                  {order.customer}
                </div>
                <div className="mt-2">
                  {order.items.map((item, index) => (
                    <p key={index} className="text-sm">
                      • {item}
                    </p>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">${order.total}</p>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {order.time}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrderList;