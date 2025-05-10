
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, ArrowLeft } from "lucide-react";
import type { StaffMember } from "@/types/staff";

interface StaffHeaderProps {
  staff: StaffMember;
  onBack: () => void;
  onEdit: (staff: StaffMember) => void;
  onActivateDeactivate: () => void;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({
  staff,
  onBack,
  onEdit,
  onActivateDeactivate,
}) => {
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

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Avatar className="h-16 w-16 border-2 border-primary/10">
          <AvatarImage src={staff.photo_url || ''} alt={`${staff.first_name} ${staff.last_name}`} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
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
          className="flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
        >
          <Edit className="h-4 w-4" /> Edit Profile
        </Button>
        
        <Button 
          variant={staff.status === "inactive" ? "outline" : "destructive"} 
          className={
            staff.status === "inactive" 
              ? "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200" 
              : "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
          }
          onClick={onActivateDeactivate}
        >
          {staff.status === "inactive" ? "Activate" : "Deactivate"}
        </Button>
      </div>
    </div>
  );
};
