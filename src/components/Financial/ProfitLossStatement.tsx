
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

interface ProfitLossStatementProps {
  dateRange?: any;
}

const ProfitLossStatement: React.FC<ProfitLossStatementProps> = ({ dateRange }) => {
  // Mock data - replace with real data based on dateRange
  const plData = {
    revenue: {
      foodSales: 125000,
      beverageSales: 35000,
      roomRevenue: 85000,
      otherRevenue: 5000,
      total: 250000
    },
    expenses: {
      costOfGoods: 87500,
      laborCosts: 62500,
      utilities: 15000,
      rent: 25000,
      marketing: 8000,
      otherExpenses: 12000,
      total: 210000
    }
  };

  const netProfit = plData.revenue.total - plData.expenses.total;
  const profitMargin = (netProfit / plData.revenue.total) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Profit & Loss Statement</h2>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Food Sales</span>
              <span>₹{plData.revenue.foodSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Beverage Sales</span>
              <span>₹{plData.revenue.beverageSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Room Revenue</span>
              <span>₹{plData.revenue.roomRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Revenue</span>
              <span>₹{plData.revenue.otherRevenue.toLocaleString()}</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Revenue</span>
              <span className="text-green-600">₹{plData.revenue.total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Expenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Cost of Goods Sold</span>
              <span>₹{plData.expenses.costOfGoods.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Labor Costs</span>
              <span>₹{plData.expenses.laborCosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilities</span>
              <span>₹{plData.expenses.utilities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Rent</span>
              <span>₹{plData.expenses.rent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Marketing</span>
              <span>₹{plData.expenses.marketing.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Expenses</span>
              <span>₹{plData.expenses.otherExpenses.toLocaleString()}</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Expenses</span>
              <span className="text-red-600">₹{plData.expenses.total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Profit Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">Net Profit Summary</h3>
            <div className="flex justify-center items-center space-x-4">
              <div className="text-3xl font-bold">
                ₹{netProfit.toLocaleString()}
              </div>
              <div className={`flex items-center ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfit > 0 ? <TrendingUp className="w-6 h-6 mr-2" /> : <TrendingDown className="w-6 h-6 mr-2" />}
                <span>{profitMargin.toFixed(1)}% margin</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitLossStatement;
