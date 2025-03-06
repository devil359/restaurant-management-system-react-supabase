
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { useTheme } from "@/hooks/useTheme";

interface RevenueChartProps {
  data: {
    date: string;
    total_revenue: number;
    order_count: number;
    average_order_value: number;
  }[];
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const chartData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      date: format(new Date(item.date), 'dd MMM'),
      revenue: Number(item.total_revenue),
      orders: item.order_count,
      average: Number(item.average_order_value),
    }));

  // Theme-aware colors
  const textColor = isDarkMode ? '#e2e8f0' : '#333333';
  const gridColor = isDarkMode ? '#383e4a' : '#E5E7EB';
  const backgroundColor = isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const tooltipBackgroundColor = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipBorderColor = isDarkMode ? '#475569' : '#E5E7EB';

  return (
    <Card variant="glass" className="col-span-4 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Revenue Trends Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" stroke={gridColor} />
              <XAxis 
                dataKey="date"
                tick={{ fill: textColor }}
                axisLine={{ stroke: gridColor }}
              />
              <YAxis 
                tick={{ fill: textColor }}
                axisLine={{ stroke: gridColor }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                formatter={(value) => [`₹${value}`, '']}
                labelFormatter={(value) => `Date: ${value}`}
                contentStyle={{ 
                  backgroundColor: tooltipBackgroundColor,
                  border: `1px solid ${tooltipBorderColor}`,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  color: textColor
                }}
                cursor={{ stroke: '#9B87F5', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue" 
                stroke="#9B87F5" 
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: '#5B21B6', strokeWidth: 2, fill: '#9B87F5' }}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                name="Orders" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: '#066950', strokeWidth: 2, fill: '#10B981' }}
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                name="Avg Order Value" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: '#B45309', strokeWidth: 2, fill: '#F59E0B' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
