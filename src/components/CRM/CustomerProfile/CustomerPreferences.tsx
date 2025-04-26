
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PenSquare } from "lucide-react";

interface CustomerPreferencesProps {
  preferences: string;
  isEditing: boolean;
  onStartEditing: () => void;
  onPreferencesChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const CustomerPreferences = ({
  preferences,
  isEditing,
  onStartEditing,
  onPreferencesChange,
  onSave,
  onCancel
}: CustomerPreferencesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Preferences</span>
          {!isEditing && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={onStartEditing}
            >
              <PenSquare className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea 
              value={preferences} 
              onChange={(e) => onPreferencesChange(e.target.value)} 
              placeholder="Customer preferences, dietary restrictions, etc."
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={onSave}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm">
            {preferences || "No preferences added yet."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerPreferences;
