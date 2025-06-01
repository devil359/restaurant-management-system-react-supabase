
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Plus
} from "lucide-react";

interface CashFlowManagementProps {
  dateRange?: any;
}

const CashFlowManagement: React.FC<CashFlowManagementProps> = ({ dateRange }) => {
  // Mock cash flow data
  const cashFlowData = {
    openingBalance: 50000,
    closingBalance: 67500,
    totalInflow: 125000,
    totalOutflow: 107500,
    netCashFlow: 17500
  };

  const cashFlowItems = [
    {
      id: 1,
      date: "2024-01-20",
      description: "Food Sales - Daily Revenue",
      type: "inflow",
      amount: 15000,
      category: "Revenue"
    },
    {
      id: 2,
      date: "2024-01-20",
      description: "Room Booking Payment",
      type: "inflow",
      amount: 8500,
      category: "Revenue"
    },
    {
      id: 3,
      date: "2024-01-20",
      description: "Supplier Payment - Fresh Produce",
      type: "outflow",
      amount: 5000,
      category: "Inventory"
    },
    {
      id: 4,
      date: "2024-01-20",
      description: "Staff Salaries",
      type: "outflow",
      amount: 12000,
      category: "Payroll"
    },
    {
      id: 5,
      date: "2024-01-19",
      description: "Utility Bills",
      type: "outflow",
      amount: 3500,
      category: "Operating Expenses"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cash Flow Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Opening Balance</div>
              <div className="text-xl font-bold">₹{cashFlowData.openingBalance.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Inflow</div>
              <div className="text-xl font-bold text-green-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                ₹{cashFlowData.totalInflow.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Outflow</div>
              <div className="text-xl font-bold text-red-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 mr-1" />
                ₹{cashFlowData.totalOutflow.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Net Cash Flow</div>
              <div className={`text-xl font-bold ${cashFlowData.netCashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{cashFlowData.netCashFlow.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Closing Balance</div>
              <div className="text-xl font-bold">₹{cashFlowData.closingBalance.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cashFlowItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.type === 'inflow' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-gray-600">{item.date}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{item.category}</Badge>
                  <div className={`font-bold ${item.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'inflow' ? '+' : '-'}₹{item.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowManagement;
