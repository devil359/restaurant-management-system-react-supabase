
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface LoyaltyPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manualPointsAmount: number;
  manualPointsNote: string;
  onManualPointsAmountChange: (amount: number) => void;
  onManualPointsNoteChange: (note: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

const LoyaltyPointsDialog = ({
  open,
  onOpenChange,
  manualPointsAmount,
  manualPointsNote,
  onManualPointsAmountChange,
  onManualPointsNoteChange,
  onSubmit,
  loading
}: LoyaltyPointsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Loyalty Points</DialogTitle>
          <DialogDescription>
            Add or remove loyalty points. Use negative values to deduct points.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="font-medium">Points Amount</div>
            <Input
              type="number"
              placeholder="Enter points amount"
              value={manualPointsAmount === 0 ? '' : manualPointsAmount}
              onChange={(e) => onManualPointsAmountChange(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <div className="font-medium">Note</div>
            <Textarea
              placeholder="Reason for adjustment"
              value={manualPointsNote}
              onChange={(e) => onManualPointsNoteChange(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={onSubmit} 
            disabled={manualPointsAmount === 0 || loading}
          >
            {loading ? "Updating..." : "Update Points"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoyaltyPointsDialog;
