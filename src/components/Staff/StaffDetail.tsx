
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, UserCheck, FileText, Clock, Settings, Edit, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  StaffMember,
  StaffShift,
  StaffLeaveBalance,
  StaffTimeClockEntry,
  StaffRole,
} from "@/types/staff";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface StaffDetailProps {
  staffId: string;
  restaurantId: string | null;
  onEdit: (staff: StaffMember) => void;
  onBack: () => void;
}

const StaffDetail: React.FC<StaffDetailProps> = ({
  staffId,
  restaurantId,
  onEdit,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch staff details
  const {
    data: staff,
    isLoading: isLoadingStaff,
    refetch: refetchStaff,
  } = useQuery({
    queryKey: ["staff-detail", staffId],
    enabled: !!staffId && !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("id", staffId)
        .single();

      if (error) throw error;
      return data as StaffMember;
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!staffId) return;

    const channel = supabase
      .channel('staff-detail-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff',
          filter: `id=eq.${staffId}`,
        },
        () => {
          refetchStaff();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [staffId, refetchStaff]);

  // Fetch staff roles
  const { data: roles = [] } = useQuery<StaffRole[]>({
    queryKey: ["staff-roles-all", restaurantId],
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

  // Fetch upcoming shifts
  const { data: upcomingShifts = [] } = useQuery<StaffShift[]>({
    queryKey: ["staff-shifts", staffId],
    enabled: !!staffId && !!restaurantId,
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("staff_shifts")
        .select("*")
        .eq("staff_id", staffId)
        .gte("start_time", now)
        .order("start_time", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as StaffShift[];
    },
  });

  // Fetch leave balances
  const { data: leaveBalances = [] } = useQuery<StaffLeaveBalance[]>({
    queryKey: ["staff-leave-balances", staffId],
    enabled: !!staffId && !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_leave_balances")
        .select("*")
        .eq("staff_id", staffId);

      if (error) throw error;
      return data as StaffLeaveBalance[];
    },
  });

  // Fetch upcoming leave
  const { data: upcomingLeave = [] } = useQuery<StaffLeaveRequest[]>({
    queryKey: ["staff-upcoming-leave", staffId],
    enabled: !!staffId && !!restaurantId,
    queryFn: async () => {
      const now = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
      
      // First check the modern table
      const { data: requestsData, error: requestsError } = await supabase
        .from("staff_leave_requests")
        .select("*")
        .eq("staff_id", staffId)
        .eq("status", "approved")
        .gte("end_date", now)
        .order("start_date", { ascending: true });

      if (requestsError) throw requestsError;
      
      // If no data in new table, check the legacy table
      if (requestsData.length === 0) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("staff_leaves")
          .select("*")
          .eq("staff_id", staffId)
          .eq("status", "approved")
          .gte("end_date", now)
          .order("start_date", { ascending: true });
          
        if (legacyError) throw legacyError;
        return legacyData as any[];
      }
      
      return requestsData as StaffLeaveRequest[];
    },
  });

  // Fetch recent time clock entries
  const { data: timeClockEntries = [] } = useQuery<StaffTimeClockEntry[]>({
    queryKey: ["staff-time-clock", staffId],
    enabled: !!staffId && !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_time_clock")
        .select("*")
        .eq("staff_id", staffId)
        .order("clock_in", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as StaffTimeClockEntry[];
    },
  });

  // Deactivate staff member mutation
  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("staff")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-detail"] });
      queryClient.invalidateQueries({ queryKey: ["enhanced-staff"] });
      toast({
        title: "Staff status updated",
        description: "The staff member's status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  if (isLoadingStaff) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!staff) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff not found</CardTitle>
          <CardDescription>The staff member you are looking for does not exist.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onBack}>Back to staff list</Button>
        </CardFooter>
      </Card>
    );
  }

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'on_leave':
        return <Badge className="bg-amber-100 text-amber-800">On Leave</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "";
    try {
      return format(parseISO(dateTimeString), "MMM dd, yyyy h:mm a");
    } catch (error) {
      return dateTimeString;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      if (dateString.includes('T')) {
        return format(parseISO(dateString), "MMM dd, yyyy");
      }
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const calculateDuration = (startDateStr: string, endDateStr: string) => {
    try {
      // Handle both date-only and datetime strings
      const startDate = startDateStr.includes('T') ? parseISO(startDateStr) : new Date(startDateStr);
      const endDate = endDateStr.includes('T') ? parseISO(endDateStr) : new Date(endDateStr);
      
      return differenceInDays(endDate, startDate) + 1; // +1 to include both start and end days
    } catch (error) {
      return 0;
    }
  };

  const handleChangeStatus = (status: string) => {
    changeStatusMutation.mutate({ id: staffId, status });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              Back
            </Button>
            <Avatar className="h-16 w-16">
              <AvatarImage src={staff.photo_url || ''} alt={`${staff.first_name} ${staff.last_name}`} />
              <AvatarFallback className="text-lg">
                {getInitials(staff.first_name, staff.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">
                {staff.first_name} {staff.last_name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{staff.position || "No position"}</span>
                {getStatusBadge(staff.status)}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onEdit(staff)}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" /> Edit Profile
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant={staff.status === "inactive" ? "outline" : "destructive"} 
                  className={
                    staff.status === "inactive" 
                      ? "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200" 
                      : ""
                  }
                >
                  {staff.status === "inactive" ? "Activate" : "Deactivate"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {staff.status === "inactive" ? "Activate Staff Member" : "Deactivate Staff Member"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {staff.status === "inactive" 
                      ? "This will make the staff member active again. They will appear in all active staff lists."
                      : "This will deactivate the staff member. They will no longer appear in active staff lists."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleChangeStatus(staff.status === "inactive" ? "active" : "inactive")}
                    className={staff.status === "inactive" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {staff.status === "inactive" ? "Activate" : "Deactivate"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2 rounded-none">
            <UserCheck className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2 rounded-none">
            <Calendar className="h-4 w-4" /> Schedule
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2 rounded-none">
            <FileText className="h-4 w-4" /> Leave
          </TabsTrigger>
          <TabsTrigger value="timeclock" className="flex items-center gap-2 rounded-none">
            <Clock className="h-4 w-4" /> Time Clock
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2 rounded-none">
            <Settings className="h-4 w-4" /> Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Staff Profile</CardTitle>
              <CardDescription>
                View and manage information about this staff member.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Contact Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <div className="text-sm font-medium">{staff.email || "Not provided"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <div className="text-sm font-medium">{staff.phone || "Not provided"}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Emergency Contact</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <div className="text-sm font-medium">{staff.emergency_contact_name || "Not provided"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <div className="text-sm font-medium">{staff.emergency_contact_phone || "Not provided"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-lg">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Position</Label>
                      <div className="text-sm font-medium">{staff.position || "Not specified"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="text-sm font-medium flex items-center gap-2">
                        {getStatusBadge(staff.status)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start Date</Label>
                      <div className="text-sm font-medium">{staff.start_date ? formatDate(staff.start_date) : "Not specified"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Shift</Label>
                      <div className="text-sm font-medium">{staff.Shift || "Not assigned"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-lg">Availability & Notes</h3>
                <div className="p-3 bg-muted/50 rounded-md">
                  {staff.availability_notes || "No availability notes provided"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Staff Schedule</CardTitle>
              <CardDescription>Upcoming shifts and schedule information.</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingShifts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No upcoming shifts</h3>
                  <p className="text-muted-foreground">
                    This staff member doesn't have any upcoming shifts scheduled.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">
                          {formatDate(shift.start_time)}
                        </TableCell>
                        <TableCell>{format(parseISO(shift.start_time), "h:mm a")}</TableCell>
                        <TableCell>{format(parseISO(shift.end_time), "h:mm a")}</TableCell>
                        <TableCell>{shift.location || "Main"}</TableCell>
                        <TableCell>
                          {format(parseISO(shift.end_time).getTime() - parseISO(shift.start_time).getTime(), "H")} hrs
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-0">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Leave Management</CardTitle>
                <CardDescription>Leave balances and requests.</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Request Leave</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Leave request form will be implemented here.</p>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Submit Request</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Leave Balances</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {leaveBalances.length === 0 ? (
                    <Card className="col-span-full">
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">No leave balances available</p>
                      </CardContent>
                    </Card>
                  ) : (
                    leaveBalances.map((balance) => (
                      <Card key={balance.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base capitalize">{balance.leave_type} Leave</CardTitle>
                          <CardDescription className="text-xs">
                            Updated {format(parseISO(balance.updated_at), "MMM dd, yyyy")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {balance.total_days - balance.used_days} <span className="text-sm font-normal text-muted-foreground">/ {balance.total_days} days</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {balance.used_days} days used
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Upcoming Leave</h3>
                {upcomingLeave.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">No upcoming leave</h3>
                    <p className="text-muted-foreground">
                      This staff member doesn't have any upcoming approved leave.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingLeave.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium capitalize">
                            {leave.leave_type || "Regular"}
                          </TableCell>
                          <TableCell>{formatDate(leave.start_date)}</TableCell>
                          <TableCell>{formatDate(leave.end_date)}</TableCell>
                          <TableCell>
                            {calculateDuration(leave.start_date, leave.end_date)} days
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={leave.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : leave.status === 'denied'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'}
                            >
                              {leave.status || "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeclock" className="mt-0">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Time Clock</CardTitle>
                <CardDescription>Recent clock in/out records.</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Clock In/Out</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Time Clock Entry</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Time clock form will be implemented here.</p>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Submit</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {timeClockEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No time clock entries</h3>
                  <p className="text-muted-foreground">
                    This staff member doesn't have any recorded time clock entries.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeClockEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {formatDate(entry.clock_in)}
                        </TableCell>
                        <TableCell>{format(parseISO(entry.clock_in), "h:mm a")}</TableCell>
                        <TableCell>
                          {entry.clock_out 
                            ? format(parseISO(entry.clock_out), "h:mm a") 
                            : <Badge variant="outline" className="text-amber-600">Active</Badge>}
                        </TableCell>
                        <TableCell>
                          {entry.clock_out 
                            ? (() => {
                                const durationMs = parseISO(entry.clock_out).getTime() - parseISO(entry.clock_in).getTime();
                                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                                return `${hours}h ${minutes}m`;
                              })()
                            : "—"
                          }
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Permissions & Roles</CardTitle>
              <CardDescription>
                Manage staff roles and system permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-4">Assigned Roles</h3>
                  {roles.length === 0 ? (
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">No roles defined</h3>
                      <p className="text-muted-foreground">
                        No roles have been created for your restaurant yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {roles.map((role) => (
                        <Card key={role.id}>
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{role.name}</CardTitle>
                              <Button variant="ghost" size="sm">
                                Assign
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3">
                            <div className="text-sm text-muted-foreground">
                              {role.permissions?.length > 0 
                                ? `${role.permissions.length} permissions assigned` 
                                : "No permissions assigned"}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffDetail;
