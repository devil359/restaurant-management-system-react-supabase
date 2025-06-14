
import React from "react";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { ModernPageHeader } from "@/components/Layout/ModernPageHeader";
import { ModernCard } from "@/components/ui/modern-card";
import { ModernButton } from "@/components/ui/modern-button";
import { 
  BarChart3, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp,
  Plus,
  Eye,
  Settings,
  Coffee,
  Bed,
  Shield,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Stats from "@/components/Dashboard/Stats";
import WeeklySalesChart from "@/components/Dashboard/WeeklySalesChart";

const Index = () => {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "New Order",
      description: "Create a new order",
      icon: <Plus className="h-5 w-5" />,
      onClick: () => navigate('/orders'),
      variant: 'primary' as const,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: "View Menu",
      description: "Manage menu items",
      icon: <Coffee className="h-5 w-5" />,
      onClick: () => navigate('/menu'),
      variant: 'secondary' as const,
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      title: "Room Status",
      description: "Check room availability",
      icon: <Bed className="h-5 w-5" />,
      onClick: () => navigate('/rooms'),
      variant: 'secondary' as const,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: "Analytics",
      description: "View business insights",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => navigate('/analytics'),
      variant: 'secondary' as const,
      gradient: 'from-green-500 to-green-600'
    }
  ];

  return (
    <div className="space-y-8">
      <ModernPageHeader
        title={`Welcome back${user?.email ? `, ${user.email.split('@')[0]}` : ''}!`}
        description="Here's an overview of your restaurant and hotel operations"
      />

      {/* Welcome Section */}
      <ModernCard variant="glass" className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20" glow>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-2xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Welcome to your Dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You have full access to all restaurant management features.
              </p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-purple-200/50">
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center">
              <Sparkles className="h-4 w-4 mr-1" />
              Active User
            </span>
          </div>
        </div>
      </ModernCard>

      {/* Quick Actions */}
      <ModernCard variant="elevated">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-gray-100">
          <Settings className="h-6 w-6 mr-3 text-purple-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <div 
              key={index} 
              className="group relative overflow-hidden bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:bg-white/80 hover:border-purple-300/50 transition-all duration-300 hover:shadow-xl hover:transform hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`bg-gradient-to-r ${action.gradient} p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  {React.cloneElement(action.icon, { className: "h-5 w-5 text-white" })}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-lg">
                {action.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                {action.description}
              </p>
              <ModernButton
                variant={action.variant}
                size="sm"
                onClick={action.onClick}
                className="w-full"
              >
                {action.title}
              </ModernButton>
            </div>
          ))}
        </div>
      </ModernCard>

      {/* Stats Section */}
      <Stats />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ModernCard variant="glass">
          <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-gray-100">
            <TrendingUp className="h-6 w-6 mr-3 text-purple-600" />
            Sales Overview
          </h2>
          <WeeklySalesChart />
        </ModernCard>
        
        <ModernCard variant="glass">
          <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-gray-100">
            <BarChart3 className="h-6 w-6 mr-3 text-purple-600" />
            Performance Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl shadow-sm border border-green-200/50">
              <span className="font-semibold text-green-800 dark:text-green-200">
                Customer Satisfaction
              </span>
              <span className="text-2xl font-bold text-green-600">96%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-sm border border-blue-200/50">
              <span className="font-semibold text-blue-800 dark:text-blue-200">
                Table Turnover Rate
              </span>
              <span className="text-2xl font-bold text-blue-600">2.3x</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-sm border border-purple-200/50">
              <span className="font-semibold text-purple-800 dark:text-purple-200">
                Room Occupancy
              </span>
              <span className="text-2xl font-bold text-purple-600">78%</span>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );
};

export default Index;
