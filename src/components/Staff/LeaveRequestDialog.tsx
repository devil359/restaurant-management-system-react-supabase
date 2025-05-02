
import React, { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { StaffMember, StaffLeaveRequest } from "@/types/staff";

interface LeaveRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staffId?: string;
  restaurantId: string | null;
  leaveRequest?: StaffLeaveRequest;
  onSuccess: () => void;
}

const LeaveRequestDialog: React.FC<LeaveRequestDialogProps> = ({
  isOpen,
  onClose,
  staffId,
  restaurantId,
  leaveRequest,
  onSuccess,
}) => {
  const isEditMode = !!leaveRequest;
  const { toast } = useToast();
  
  // Form state
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [leaveType, setLeaveType] = useState<string>("annual");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [durationDays, setDurationDays] = useState<number>(0);

  // Fetch staff list
  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff-for-leave", restaurantId],
    enabled: !!restaurantId && !staffId, // Only fetch if no staffId is provided
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name, position")
        .eq("restaurant_id", restaurantId)
        .eq("status", "active");

      if (error) throw error;
      return data as StaffMember[];
    },
  });

  // Calculate duration when dates change
  useEffect(() => {
    if (startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = differenceInDays(end, start) + 1; // +1 to include both start and end date
        setDurationDays(days > 0 ? days : 0);
      } catch (e) {
        setDurationDays(0);
      }
    } else {
      setDurationDays(0);
    }
  }, [startDate, endDate]);

  // Set form values when editing
  useEffect(() => {
    if (leaveRequest) {
      setSelectedStaffId(leaveRequest.staff_id);
      setLeaveType(leaveRequest.leave_type || "annual");
      setStartDate(leaveRequest.start_date ? leaveRequest.start_date.split('T')[0] : "");
      setEndDate(leaveRequest.end_date ? leaveRequest.end_date.split('T')[0] : "");
      setReason(leaveRequest.reason || "");
    } else {
      resetForm();
      
      // If staffId is provided (from staff detail page), use it
      if (staffId) {
        setSelectedStaffId(staffId);
      }
    }
  }, [leaveRequest, staffId]);

  const resetForm = () => {
    if (!staffId) {
      setSelectedStaffId("");
    }
    setLeaveType("annual");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  // Submit leave request mutation
  const submitLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditMode && leaveRequest) {
        // Update existing request
        const { error } = await supabase
          .from("staff_leave_requests")
          .update(data)
          .eq("id", leaveRequest.id);
        
        if (error) throw error;
      } else {
        // Create new request
        const { error } = await supabase
          .from("staff_leave_requests")
          .insert([{ ...data, restaurant_id: restaurantId }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Leave request updated" : "Leave request submitted",
        description: isEditMode 
          ? "The leave request has been updated successfully."
          : "A new leave request has been submitted successfully.",
      });
      resetForm();
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "submit"} leave request: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedStaffId) {
      toast({
        title: "Staff required",
        description: "Please select a staff member.",
        variant: "destructive",
      });
      return;
    }
    
    if (!startDate || !endDate) {
      toast({
        title: "Dates required",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid date range",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }
    
    const leaveData = {
      staff_id: selectedStaffId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: isEditMode ? leaveRequest?.status : "pending",
    };
    
    submitLeaveMutation.mutate(leaveData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Leave Request" : "Request Staff Leave"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the leave request details below."
              : "Fill in the details below to request time off."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Staff Selection (only if staffId not provided) */}
          {!staffId && (
            <div>
              <Label htmlFor="staff">Staff Member</Label>
              <Select 
                value={selectedStaffId} 
                onValueChange={setSelectedStaffId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} - {member.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Leave Type */}
          <div>
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="personal">Personal Leave</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || format(new Date(), "yyyy-MM-dd")}
              />
            </div>
          </div>
          
          {/* Duration */}
          {durationDays > 0 && (
            <div>
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2 py-1">
                  {durationDays} {durationDays === 1 ? "day" : "days"}
                </Badge>
              </div>
            </div>
          )}
          
          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for leave"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitLeaveMutation.isPending}>
              {submitLeaveMutation.isPending ? (
                <>
                  <span className="animate-spin mr-1">●</span> Submitting...
                </>
              ) : (
                isEditMode ? "Update Request" : "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveRequestDialog;
