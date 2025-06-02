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
import { Wrench, Plus, AlertTriangle, Clock, DollarSign } from "lucide-react";
import { useRestaurantId } from "@/hooks/useRestaurantId";

interface MaintenanceRequest {
  id: string;
  room_id: string;
  reported_by: string;
  assigned_to: string;
  request_type: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  estimated_cost: number;
  actual_cost: number;
  scheduled_date: string;
  rooms: { name: string };
  staff: { first_name: string; last_name: string };
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const statusColors = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const MaintenanceRequests = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { restaurantId } = useRestaurantId();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["maintenance-requests", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from("room_maintenance_requests")
        .select(`
          *,
          rooms(name),
          staff!room_maintenance_requests_assigned_to_fkey(first_name, last_name)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MaintenanceRequest[];
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

  const createRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const { error } = await supabase
        .from("room_maintenance_requests")
        .insert([{ ...requestData, restaurant_id: restaurantId }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      setIsDialogOpen(false);
      toast({ title: "Maintenance request created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error creating request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      
      if (status === 'completed') {
        updateData.completed_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("room_maintenance_requests")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast({ title: "Request status updated successfully" });
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
    
    const requestData = {
      room_id: formData.get("room_id"),
      assigned_to: formData.get("assigned_to"),
      request_type: formData.get("request_type"),
      priority: formData.get("priority"),
      title: formData.get("title"),
      description: formData.get("description"),
      estimated_cost: parseFloat(formData.get("estimated_cost") as string) || 0,
      scheduled_date: formData.get("scheduled_date") || null,
    };

    createRequestMutation.mutate(requestData);
  };

  if (isLoading) {
    return <div>Loading maintenance requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Maintenance Requests</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <StandardizedButton>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </StandardizedButton>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Maintenance Request</DialogTitle>
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>
              <div>
                <Label htmlFor="request_type">Type</Label>
                <Select name="request_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="ac">Air Conditioning</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimated_cost">Estimated Cost</Label>
                  <Input
                    id="estimated_cost"
                    name="estimated_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select name="assigned_to">
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
              <div>
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="date"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detailed description of the issue"
                  required
                />
              </div>
              <StandardizedButton type="submit" className="w-full">
                Create Request
              </StandardizedButton>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((request) => (
          <StandardizedCard key={request.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{request.title}</h3>
                <p className="text-sm text-gray-600">{request.rooms?.name}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Badge className={priorityColors[request.priority as keyof typeof priorityColors]}>
                  {request.priority.toUpperCase()}
                </Badge>
                <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                  {request.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{request.request_type}</span>
              </div>
              {request.estimated_cost > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>₹{request.estimated_cost}</span>
                </div>
              )}
              {request.scheduled_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{new Date(request.scheduled_date).toLocaleDateString()}</span>
                </div>
              )}
              {request.staff && (
                <div className="text-sm text-gray-600">
                  Assigned: {request.staff.first_name} {request.staff.last_name}
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.description}</p>

            <div className="flex gap-2 mt-4">
              {request.status === 'open' && (
                <StandardizedButton
                  size="sm"
                  variant="secondary"
                  onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'in_progress' })}
                >
                  Start Work
                </StandardizedButton>
              )}
              {request.status === 'in_progress' && (
                <StandardizedButton
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'completed' })}
                >
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

export default MaintenanceRequests;
