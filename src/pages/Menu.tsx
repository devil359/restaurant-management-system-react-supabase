
import { Suspense, lazy } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the MenuGrid component
const MenuGrid = lazy(() => import("@/components/Menu/MenuGrid"));

const Menu = () => {
  return (
    <div className="space-y-6 animate-fade-in bg-background min-h-full">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Restaurant Menu
        </h1>
        <p className="text-purple-100 text-lg">
          Manage your restaurant's menu items efficiently
        </p>
      </div>

      {/* Main Content */}
      <Card className="p-6 rounded-xl bg-white border border-border/50 shadow-sm">
        <Suspense fallback={
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg" />
              ))}
            </div>
          </div>
        }>
          <MenuGrid />
        </Suspense>
      </Card>
    </div>
  );
};

export default Menu;
