
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";

interface CustomerTagsProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

const CustomerTags = ({ tags, onAddTag, onRemoveTag }: CustomerTagsProps) => {
  const [newTag, setNewTag] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Customer Tags</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button 
                    className="ml-1 h-4 w-4 rounded-full hover:bg-primary/20 inline-flex items-center justify-center" 
                    onClick={() => onRemoveTag(tag)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No tags added yet</div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={newTag} 
            onChange={(e) => setNewTag(e.target.value)} 
            placeholder="Add a tag" 
            className="flex-1"
          />
          <Button type="submit" size="sm" variant="outline" disabled={!newTag}>
            <Tag className="h-4 w-4 mr-2" />
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CustomerTags;
