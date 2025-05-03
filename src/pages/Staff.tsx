import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffList from "@/components/Staff/StaffList";
import StaffDetail from "@/components/Staff/StaffDetail";
import StaffDialog from "@/components/Staff/StaffDialog";
import StaffLeaveManager from "@/components/Staff/StaffLeaveManager";
import TimeClockDialog from "@/components/Staff/TimeClockDialog";
import type { StaffMember, StaffRole } from "@/types/staff";
import { Button } from "@/components/ui/button";
import { UserPlus, ClockIcon } from "lucide-react";

const Staff = () => {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [isTimeClockDialogOpen, setIsTimeClockDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Get active tab from URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'leaves' ? 'leaves' : 'staff');

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab === 'staff') {
      navigate('/staff', { replace: true });
    } else {
      navigate('/staff?tab=leaves', { replace: true });
    }
  }, [activeTab, navigate]);

  const { data: restaurantId } = useQuery({
    queryKey: ["restaurant-id"],
    queryFn: async () => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error("No user found");

      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", profile.user.id)
        .single();

      return userProfile?.restaurant_id;
    },
  });

  // Fetch staff roles
  const { data: roles = [] } = useQuery<StaffRole[]>({
    queryKey: ["staff-roles", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_roles")
        .select("*")
        .eq("restaurant_id", restaurantId);

      if (error) throw error;
      return data as StaffRole[];
    },
  });

  const handleAddStaff = () => {
    setEditingStaff(null);
    setIsStaffDialogOpen(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setIsStaffDialogOpen(true);
  };

  const handleStaffDialogSuccess = () => {
    // If we were editing the currently selected staff, update it
    if (editingStaff && selectedStaff && editingStaff.id === selectedStaff.id) {
      // Will be refreshed by the realtime subscription
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your restaurant's staff and leave requests
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsTimeClockDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ClockIcon className="h-4 w-4" />
            Clock In/Out
          </Button>
          <Button 
            onClick={handleAddStaff}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="staff">Staff List</TabsTrigger>
          <TabsTrigger value="leaves">Leave Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="staff">
          {selectedStaff ? (
            <StaffDetail 
              staffId={selectedStaff.id}
              restaurantId={restaurantId}
              onEdit={handleEditStaff}
              onBack={() => setSelectedStaff(null)}
            />
          ) : (
            <StaffList
              selectedStaffId={selectedStaff?.id || null}
              onSelectStaff={setSelectedStaff}
              restaurantId={restaurantId}
              onAddStaff={handleAddStaff}
            />
          )}
        </TabsContent>
        
        <TabsContent value="leaves">
          <StaffLeaveManager />
        </TabsContent>
      </Tabs>

      <StaffDialog
        isOpen={isStaffDialogOpen}
        onClose={() => setIsStaffDialogOpen(false)}
        staff={editingStaff || undefined}
        restaurantId={restaurantId}
        onSuccess={handleStaffDialogSuccess}
        roles={roles}
      />

      <TimeClockDialog
        isOpen={isTimeClockDialogOpen}
        onClose={() => setIsTimeClockDialogOpen(false)}
        restaurantId={restaurantId}
        onSuccess={() => {
          toast({
            title: "Time clock entry saved",
            description: "Your time clock entry has been recorded successfully.",
          });
        }}
      />
    </div>
  );
};

export default Staff;
