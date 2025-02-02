import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Tables = () => {
  const tables = [
    { id: 1, seats: 4, status: "Occupied" },
    { id: 2, seats: 2, status: "Available" },
    { id: 3, seats: 6, status: "Reserved" },
    { id: 4, seats: 4, status: "Available" },
    { id: 5, seats: 8, status: "Occupied" },
    { id: 6, seats: 2, status: "Available" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Occupied":
        return "bg-red-500";
      case "Available":
        return "bg-green-500";
      case "Reserved":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Tables</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {tables.map((table) => (
          <Card
            key={table.id}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Table {table.id}</h3>
                <p className="text-sm text-muted-foreground">
                  {table.seats} seats
                </p>
              </div>
              <Badge className={getStatusColor(table.status)}>
                {table.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Tables;