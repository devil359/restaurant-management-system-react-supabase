
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StaffStatusDialogProps {
  isInactive: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const StaffStatusDialog: React.FC<StaffStatusDialogProps> = ({
  isInactive,
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isInactive ? "Activate Staff Member" : "Deactivate Staff Member"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isInactive 
              ? "This will make the staff member active again. They will appear in all active staff lists."
              : "This will deactivate the staff member. They will no longer appear in active staff lists."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isInactive ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isInactive ? "Activate" : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
