
import React from "react";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CustomerNote } from "@/types/customer";

interface NotesTabProps {
  notes: CustomerNote[];
  loading: boolean;
  newNote: string;
  onNewNoteChange: (note: string) => void;
  onAddNote: () => void;
}

const NotesTab = ({ 
  notes, 
  loading, 
  newNote, 
  onNewNoteChange, 
  onAddNote 
}: NotesTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Notes</CardTitle>
        <CardDescription>Add private notes about this customer</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <Textarea 
            placeholder="Add a note about this customer..."
            value={newNote}
            onChange={(e) => onNewNoteChange(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={onAddNote} 
              disabled={!newNote.trim()}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {loading ? (
          <div className="flex justify-center py-6">
            <svg className="animate-spin h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium">No Notes</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There are no notes for this customer yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <p className="whitespace-pre-wrap">{note.content}</p>
                    <div className="text-xs text-muted-foreground">
                      By {note.created_by} • {format(new Date(note.created_at), 'MMMM d, yyyy • h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotesTab;
