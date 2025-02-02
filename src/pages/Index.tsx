import Stats from "@/components/Dashboard/Stats";
import OrderList from "@/components/Orders/OrderList";

const Index = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <Stats />
      <OrderList />
    </div>
  );
};

export default Index;