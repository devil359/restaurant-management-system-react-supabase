
import React from "react";
import { format } from "date-fns";
import { Clock, MessageSquare, ShoppingCart, Tag, Award, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CustomerActivity } from "@/types/customer";

interface ActivityTabProps {
  activities: CustomerActivity[];
  loading: boolean;
}

const ActivityTab = ({ activities, loading }: ActivityTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
        <CardDescription>Recent customer activities</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <svg className="animate-spin h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium">No Activity</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No activity has been recorded yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 border-b border-border/30 pb-3 last:border-0">
                {activity.activity_type === 'note_added' && <MessageSquare className="w-5 h-5 text-blue-500" />}
                {activity.activity_type === 'order_placed' && <ShoppingCart className="w-5 h-5 text-green-500" />}
                {activity.activity_type === 'tag_added' && <Tag className="w-5 h-5 text-purple-500" />}
                {activity.activity_type === 'tag_removed' && <Tag className="w-5 h-5 text-red-500" />}
                {activity.activity_type === 'promotion_sent' && <Award className="w-5 h-5 text-amber-500" />}
                {activity.activity_type === 'email_sent' && <Mail className="w-5 h-5 text-indigo-500" />}
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.created_at), 'MMMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityTab;
