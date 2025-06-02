import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StandardizedCard } from "@/components/ui/standardized-card";
import { StandardizedButton } from "@/components/ui/standardized-button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Plus, CheckCircle, Play } from "lucide-react";
import { useRestaurantId } from "@/hooks/useRestaurantId";

interface CleaningSchedule {
  id: string;
  room_id: string;
  assigned_staff_id: string;
  scheduled_date: string;
  scheduled_time: string;
  cleaning_type: string;
  status: string;
  estimated_duration: number;
  notes: string;
  rooms: { name: string };
  staff: { first_name: string; last_name: string };
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  skipped: "bg-red-100 text-red-800",
};

const CleaningSchedules = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { restaurantId } = useRestaurantId();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["cleaning-schedules", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from("room_cleaning_schedules")
        .select(`
          *,
          rooms(name),
          staff(first_name, last_name)
        `)
        .eq("restaurant_id", restaurantId)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data as CleaningSchedule[];
    },
    enabled: !!restaurantId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("restaurant_id", restaurantId);

      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name")
        .eq("restaurant_id", restaurantId)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!restaurantId,
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const { error } = await supabase
        .from("room_cleaning_schedules")
        .insert([{ ...scheduleData, restaurant_id: restaurantId }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-schedules"] });
      setIsDialogOpen(false);
      toast({ title: "Cleaning schedule created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error creating schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      
      if (status === 'in_progress') {
        updateData.actual_start_time = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.actual_end_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from("room_cleaning_schedules")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-schedules"] });
      toast({ title: "Schedule status updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const scheduleData = {
      room_id: formData.get("room_id"),
      assigned_staff_id: formData.get("assigned_staff_id"),
      scheduled_date: formData.get("scheduled_date"),
      scheduled_time: formData.get("scheduled_time"),
      cleaning_type: formData.get("cleaning_type"),
      estimated_duration: parseInt(formData.get("estimated_duration") as string),
      notes: formData.get("notes"),
    };

    createScheduleMutation.mutate(scheduleData);
  };

  if (isLoading) {
    return <div>Loading cleaning schedules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Room Cleaning Schedules</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <StandardizedButton>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Cleaning
            </StandardizedButton>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Room Cleaning</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="room_id">Room</Label>
                <Select name="room_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assigned_staff_id">Assigned Staff</Label>
                <Select name="assigned_staff_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Date</Label>
                  <Input
                    id="scheduled_date"
                    name="scheduled_date"
                    type="date"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled_time">Time</Label>
                  <Input
                    id="scheduled_time"
                    name="scheduled_time"
                    type="time"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cleaning_type">Type</Label>
                  <Select name="cleaning_type" defaultValue="standard">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="deep">Deep Clean</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimated_duration">Duration (minutes)</Label>
                  <Input
                    id="estimated_duration"
                    name="estimated_duration"
                    type="number"
                    defaultValue="30"
                    min="15"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Special instructions or notes"
                />
              </div>
              <StandardizedButton type="submit" className="w-full">
                Schedule Cleaning
              </StandardizedButton>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map((schedule) => (
          <StandardizedCard key={schedule.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{schedule.rooms?.name}</h3>
                <p className="text-sm text-gray-600">
                  {schedule.staff?.first_name} {schedule.staff?.last_name}
                </p>
              </div>
              <Badge className={statusColors[schedule.status as keyof typeof statusColors]}>
                {schedule.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{new Date(schedule.scheduled_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{schedule.scheduled_time} ({schedule.estimated_duration}min)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="capitalize">{schedule.cleaning_type} cleaning</span>
              </div>
            </div>

            {schedule.notes && (
              <p className="text-sm text-gray-600 mt-2 italic">{schedule.notes}</p>
            )}

            <div className="flex gap-2 mt-4">
              {schedule.status === 'pending' && (
                <StandardizedButton
                  size="sm"
                  variant="secondary"
                  onClick={() => updateStatusMutation.mutate({ id: schedule.id, status: 'in_progress' })}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Start
                </StandardizedButton>
              )}
              {schedule.status === 'in_progress' && (
                <StandardizedButton
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: schedule.id, status: 'completed' })}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </StandardizedButton>
              )}
            </div>
          </StandardizedCard>
        ))}
      </div>
    </div>
  );
};

export default CleaningSchedules;
