import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StandardizedCard } from "@/components/ui/standardized-card";
import { StandardizedButton } from "@/components/ui/standardized-button";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Download, DollarSign, ShoppingCart, Users, Loader2 } from "lucide-react";
import { useRestaurantId } from "@/hooks/useRestaurantId";
import { subDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurantId();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["analytics-data", restaurantId, dateRange],
    queryFn: async () => {
      if (!restaurantId || !dateRange?.from || !dateRange?.to) return null;

      const { data, error } = await supabase.rpc("get_analytics_data", {
        p_restaurant_id: restaurantId,
        p_start_date: format(dateRange.from, "yyyy-MM-dd"),
        p_end_date: format(dateRange.to, "yyyy-MM-dd"),
      });

      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId && !!dateRange?.from && !!dateRange?.to,
  });

  const handleExportPDF = async () => {
    const reportElement = document.getElementById("report-content-area");
    if (!reportElement) return;

    setIsExporting(true);
    toast({ title: "Generating PDF...", description: "Please wait" });

    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvasHeight / ratio;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`RMS_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast({ title: "PDF exported successfully!" });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({ 
        title: "Export failed", 
        description: "There was an error generating the PDF",
        variant: "destructive" 
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = analyticsData?.kpis || {};
  const charts = analyticsData?.charts || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advanced Analytics & Reporting</h2>
        <div className="flex gap-2">
          <StandardizedButton 
            variant="secondary" 
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </StandardizedButton>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DatePickerWithRange onDateRangeChange={setDateRange} />
      </div>

      <div id="report-content-area" className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StandardizedCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{Number(kpis.totalRevenue || 0).toFixed(2)}</p>
              </div>
            </div>
          </StandardizedCard>

          <StandardizedCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{kpis.totalOrders || 0}</p>
              </div>
            </div>
          </StandardizedCard>

          <StandardizedCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">₹{Number(kpis.avgOrderValue || 0).toFixed(2)}</p>
              </div>
            </div>
          </StandardizedCard>

          <StandardizedCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Customers</p>
                <p className="text-2xl font-bold">{kpis.newCustomers || 0}</p>
              </div>
            </div>
          </StandardizedCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue Chart */}
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.dailyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </StandardizedCard>

          {/* Sales by Category */}
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.salesByCategory || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ₹${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(charts.salesByCategory || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </StandardizedCard>
        </div>

        {/* Top Products */}
        <StandardizedCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.topProducts || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </StandardizedCard>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
