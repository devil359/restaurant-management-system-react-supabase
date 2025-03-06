
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/hooks/useTheme";

interface StatDetailsProps {
  title: string | null;
  data: any;
  type: "sales" | "orders" | "customers" | "revenue";
  onClose: () => void;
}

const StatDetails = ({ title, data, type, onClose }: StatDetailsProps) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

  // Theme-aware colors
  const textColor = isDarkMode ? '#e2e8f0' : '#666666';
  const gridColor = isDarkMode ? '#383e4a' : '#e5e7eb';
  const tooltipBg = isDarkMode ? '#1e293b' : 'white';
  const tooltipBorder = isDarkMode ? '#475569' : '#e5e7eb';
  
  // Line colors based on stat type
  const getLineColor = () => {
    if (type === "sales") return isDarkMode ? "#6366f1" : "#4C51BF";
    if (type === "revenue") return isDarkMode ? "#f97316" : "#ED8936";
    return "#9b87f5";
  };

  const renderContent = () => {
    switch (type) {
      case "sales":
      case "revenue":
        return (
          <div className="h-[400px] w-full chart-container rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  dataKey={type === "sales" ? "date" : "time"} 
                  tick={{ fill: textColor }}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis 
                  tickFormatter={formatCurrency} 
                  tick={{ fill: textColor }}
                  axisLine={{ stroke: gridColor }}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), "Amount"]} 
                  contentStyle={{ 
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    color: isDarkMode ? '#e2e8f0' : '#333'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke={getLineColor()}
                  strokeWidth={2}
                  dot={{ strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "orders":
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
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>{order.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "customers":
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
                  <TableCell>{formatCurrency(customer.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={!!title} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl card-glass">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default StatDetails;
