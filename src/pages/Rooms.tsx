
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { format, addHours, isAfter, parseISO } from "date-fns";
import { Plus, Calendar as CalendarIcon, Clock, Edit, Trash2, Users, DoorOpen, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  capacity: number;
  status: string;
}

interface Reservation {
  id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  status: string;
}

const timeOptions = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    timeOptions.push(`${formattedHour}:${formattedMinute}`);
  }
}

const Rooms = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isAddReservationOpen, setIsAddReservationOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [deletingReservationId, setDeletingReservationId] = useState<string | null>(null);
  
  // Date and time state for reservation
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("12:00");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: ""
  });

  // Get restaurant ID
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

  // Fetch rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name");

      if (error) throw error;
      return data as Room[];
    },
  });

  // Fetch reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ["reservations", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as Reservation[];
    },
  });

  // Mutations
  const addRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      const { data, error } = await supabase
        .from("rooms")
        .insert([{ ...roomData, restaurant_id: restaurantId }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setIsAddRoomOpen(false);
      toast({
        title: "Success",
        description: "Room added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add room",
        variant: "destructive",
      });
      console.error("Error adding room:", error);
    },
  });

  const addReservationMutation = useMutation({
    mutationFn: async (reservationData: any) => {
      const { data, error } = await supabase
        .from("reservations")
        .insert([{ ...reservationData, restaurant_id: restaurantId }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      resetReservationForm();
      setIsAddReservationOpen(false);
      toast({
        title: "Success",
        description: "Reservation added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add reservation",
        variant: "destructive",
      });
      console.error("Error adding reservation:", error);
    },
  });

  const updateReservationMutation = useMutation({
    mutationFn: async (reservationData: any) => {
      const { id, ...updateData } = reservationData;
      const { data, error } = await supabase
        .from("reservations")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      resetReservationForm();
      setIsAddReservationOpen(false);
      toast({
        title: "Success",
        description: "Reservation updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update reservation",
        variant: "destructive",
      });
      console.error("Error updating reservation:", error);
    },
  });

  const deleteReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setIsConfirmDeleteOpen(false);
      toast({
        title: "Success",
        description: "Reservation deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete reservation",
        variant: "destructive",
      });
      console.error("Error deleting reservation:", error);
    },
  });

  // Handle room submission
  const handleRoomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const roomName = formData.get("roomName") as string;
    const roomCapacity = parseInt(formData.get("roomCapacity") as string);

    addRoomMutation.mutate({
      name: roomName,
      capacity: roomCapacity,
      status: "available",
    });
  };

  // Validate time selection
  const validateTimeSelection = (): boolean => {
    if (!date) {
      setTimeError("Please select a date");
      return false;
    }

    // Create date objects for start and end times
    const startTimeHours = parseInt(startTime.split(":")[0]);
    const startTimeMinutes = parseInt(startTime.split(":")[1]);
    
    const endTimeHours = parseInt(endTime.split(":")[0]);
    const endTimeMinutes = parseInt(endTime.split(":")[1]);
    
    const startDateTime = new Date(date);
    startDateTime.setHours(startTimeHours, startTimeMinutes);
    
    const endDateTime = new Date(date);
    endDateTime.setHours(endTimeHours, endTimeMinutes);
    
    // Check if end time is after start time
    if (!isAfter(endDateTime, startDateTime)) {
      setTimeError("End time must be after start time");
      return false;
    }
    
    setTimeError(null);
    return true;
  };

  // Handle reservation submission
  const handleReservationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateTimeSelection()) {
      return;
    }
    
    if (!selectedRoomId) {
      toast({
        title: "Error",
        description: "Please select a room",
        variant: "destructive",
      });
      return;
    }

    // Create date objects for start and end times
    const startDateTime = new Date(date!);
    const startHours = parseInt(startTime.split(":")[0]);
    const startMinutes = parseInt(startTime.split(":")[1]);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(date!);
    const endHours = parseInt(endTime.split(":")[0]);
    const endMinutes = parseInt(endTime.split(":")[1]);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    const reservationData = {
      room_id: selectedRoomId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      customer_name: formData.customerName,
      customer_email: formData.customerEmail || null,
      customer_phone: formData.customerPhone || null,
      notes: formData.notes || null,
      status: "confirmed",
    };

    if (editingReservation) {
      updateReservationMutation.mutate({
        id: editingReservation.id,
        ...reservationData,
      });
    } else {
      addReservationMutation.mutate(reservationData);
    }
  };

  // Edit reservation
  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    
    // Parse date and time
    const startDate = new Date(reservation.start_time);
    const startHours = startDate.getHours().toString().padStart(2, '0');
    const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
    
    const endDate = new Date(reservation.end_time);
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    // Set form state
    setDate(startDate);
    setStartTime(`${startHours}:${startMinutes}`);
    setEndTime(`${endHours}:${endMinutes}`);
    setSelectedRoomId(reservation.room_id);
    setFormData({
      customerName: reservation.customer_name,
      customerEmail: reservation.customer_email || "",
      customerPhone: reservation.customer_phone || "",
      notes: reservation.notes || ""
    });
    
    setIsAddReservationOpen(true);
  };

  // Handle delete reservation
  const handleDeleteReservation = (id: string) => {
    setDeletingReservationId(id);
    setIsConfirmDeleteOpen(true);
  };

  // Confirm delete reservation
  const confirmDeleteReservation = () => {
    if (deletingReservationId) {
      deleteReservationMutation.mutate(deletingReservationId);
    }
  };

  // Reset reservation form
  const resetReservationForm = () => {
    setDate(new Date());
    setStartTime("10:00");
    setEndTime("12:00");
    setSelectedRoomId(null);
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: ""
    });
    setEditingReservation(null);
    setTimeError(null);
  };

  // Open Add Reservation dialog
  const openAddReservation = (roomId?: string) => {
    resetReservationForm();
    if (roomId) {
      setSelectedRoomId(roomId);
    }
    setIsAddReservationOpen(true);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filter upcoming reservations
  const upcomingReservations = reservations.filter(
    reservation => new Date(reservation.start_time) >= new Date()
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Filter past reservations
  const pastReservations = reservations.filter(
    reservation => new Date(reservation.start_time) < new Date()
  ).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  // Get room name by ID
  const getRoomName = (roomId: string) => {
    const room = rooms.find(room => room.id === roomId);
    return room ? room.name : 'Unknown Room';
  };

  if (roomsLoading || reservationsLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Room Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your rooms and reservations
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddReservationOpen} onOpenChange={setIsAddReservationOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => openAddReservation()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                New Reservation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingReservation ? "Edit Reservation" : "Add New Reservation"}</DialogTitle>
                <DialogDescription>
                  {editingReservation 
                    ? "Update the reservation details below" 
                    : "Fill in the details to create a new reservation"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleReservationSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <select
                    id="room"
                    value={selectedRoomId || ""}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} (Capacity: {room.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {startTime}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2 h-60 overflow-y-auto">
                        <div className="space-y-1">
                          {timeOptions.map((time) => (
                            <Button
                              key={time}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start font-normal",
                                startTime === time && "bg-accent text-accent-foreground"
                              )}
                              onClick={() => {
                                setStartTime(time);
                                validateTimeSelection();
                              }}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {endTime}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2 h-60 overflow-y-auto">
                        <div className="space-y-1">
                          {timeOptions.map((time) => (
                            <Button
                              key={time}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start font-normal",
                                endTime === time && "bg-accent text-accent-foreground"
                              )}
                              onClick={() => {
                                setEndTime(time);
                                validateTimeSelection();
                              }}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {timeError && (
                  <div className="text-red-500 text-sm">{timeError}</div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email (Optional)</Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone (Optional)</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="min-h-[80px]"
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddReservationOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingReservation ? "Update Reservation" : "Add Reservation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogDescription>
                  Fill in the room details below
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRoomSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input id="roomName" name="roomName" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomCapacity">Capacity</Label>
                  <Input
                    id="roomCapacity"
                    name="roomCapacity"
                    type="number"
                    min="1"
                    required
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddRoomOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Add Room
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">{room.name}</CardTitle>
                <Badge
                  variant={room.status === "available" ? "outline" : "destructive"}
                  className={`${
                    room.status === "available"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {room.status === "available" ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <X className="h-3 w-3 mr-1" />
                  )}
                  {room.status === "available" ? "Available" : "Occupied"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Capacity: {room.capacity}</span>
              </div>
              <Button
                onClick={() => openAddReservation(room.id)}
                className="w-full"
                variant="outline"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Make Reservation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="upcoming" className="w-full mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" className="flex gap-2 items-center">
            <CalendarIcon className="h-4 w-4" />
            Upcoming Reservations
          </TabsTrigger>
          <TabsTrigger value="past" className="flex gap-2 items-center">
            <Clock className="h-4 w-4" />
            Past Reservations
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex gap-2 items-center">
            <DoorOpen className="h-4 w-4" />
            All Rooms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingReservations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">
                          {getRoomName(reservation.room_id)}
                        </TableCell>
                        <TableCell>{reservation.customer_name}</TableCell>
                        <TableCell>
                          <div>
                            {format(new Date(reservation.start_time), "MMM dd, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(reservation.start_time), "h:mm a")} -{" "}
                            {format(new Date(reservation.end_time), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {reservation.customer_email && (
                            <div className="text-sm">{reservation.customer_email}</div>
                          )}
                          {reservation.customer_phone && (
                            <div className="text-sm">{reservation.customer_phone}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              reservation.status === "confirmed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {reservation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReservation(reservation)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReservation(reservation.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming reservations found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              {pastReservations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">
                          {getRoomName(reservation.room_id)}
                        </TableCell>
                        <TableCell>{reservation.customer_name}</TableCell>
                        <TableCell>
                          <div>
                            {format(new Date(reservation.start_time), "MMM dd, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(reservation.start_time), "h:mm a")} -{" "}
                            {format(new Date(reservation.end_time), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {reservation.customer_email && (
                            <div className="text-sm">{reservation.customer_email}</div>
                          )}
                          {reservation.customer_phone && (
                            <div className="text-sm">{reservation.customer_phone}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              reservation.status === "confirmed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {reservation.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No past reservations found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>All Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>
                        <Badge
                          variant={room.status === "available" ? "outline" : "destructive"}
                          className={`${
                            room.status === "available"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {room.status === "available" ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {room.status === "available" ? "Available" : "Occupied"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => openAddReservation(room.id)}
                          variant="outline"
                          size="sm"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Reserve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Deleting Reservation */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reservation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteReservation}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rooms;
