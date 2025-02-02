import OrderList from "@/components/Orders/OrderList";

const Orders = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Orders</h1>
      <OrderList />
    </div>
  );
};

export default Orders;