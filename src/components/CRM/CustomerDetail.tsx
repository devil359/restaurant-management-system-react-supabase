
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Edit, Mail, Phone, MapPin, Calendar, Settings, 
  Tag, Plus, Trash2, Send, MessageSquare, FileText, 
  AlertCircle, Clock, BarChart3, Coffee, User
} from "lucide-react";
import { formatDate, formatCurrency, calculateDaysSince } from "@/utils/formatters";
import { Customer, CustomerOrder, CustomerNote, CustomerActivity } from "@/types/customer";
import LoyaltyBadge from "@/components/Customers/LoyaltyBadge";

interface CustomerDetailProps {
  customer: Customer | null;
  orders: CustomerOrder[];
  notes: CustomerNote[];
  activities: CustomerActivity[];
  loading: boolean;
  onEditCustomer: (customer: Customer) => void;
  onAddNote: (customerId: string, note: string) => void;
  onAddTag: (customerId: string, tag: string) => void;
  onRemoveTag: (customerId: string, tag: string) => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customer,
  orders = [],
  notes = [],
  activities = [],
  loading,
  onEditCustomer,
  onAddNote,
  onAddTag,
  onRemoveTag,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-8">
        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
          <User className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium">No Customer Selected</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
          Select a customer from the list to view their details, or add a new customer to get started.
        </p>
      </div>
    );
  }

  // Organize customer stats
  const stats = [
    { label: 'Total Spent', value: formatCurrency(customer.total_spent), icon: <BarChart3 className="h-4 w-4" /> },
    { label: 'Visits', value: customer.visit_count.toString(), icon: <Coffee className="h-4 w-4" /> },
    { label: 'Avg. Order', value: formatCurrency(customer.average_order_value), icon: <FileText className="h-4 w-4" /> },
    { 
      label: 'Last Visit', 
      value: customer.last_visit_date 
        ? `${calculateDaysSince(customer.last_visit_date)} days ago` 
        : 'Never', 
      icon: <Clock className="h-4 w-4" /> 
    },
  ];

  return (
    <div className="h-full overflow-auto">
      {/* Header with actions */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold">{customer.name}</h2>
          <div className="flex items-center gap-2">
            <LoyaltyBadge tier={customer.loyalty_tier} />
            {customer.last_visit_date && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last visit: {formatDate(customer.last_visit_date)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditCustomer(customer)}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Send className="h-4 w-4 mr-1" /> Message
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="p-4"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md flex items-center">
                <div className="flex-1">Contact Information</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8"
                  onClick={() => onEditCustomer(customer)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer.birthday && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{formatDate(customer.birthday)}</span>
                </div>
              )}
              {!customer.email && !customer.phone && !customer.address && !customer.birthday && (
                <div className="text-gray-500 text-center py-2">
                  No contact information available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats and Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Customer Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-2">
                      {stat.icon}
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</div>
                    <div className="text-lg font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Loyalty Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Loyalty Program</CardTitle>
              {customer.loyalty_tier !== 'None' && (
                <CardDescription>
                  Current tier: <LoyaltyBadge tier={customer.loyalty_tier} /> with {customer.loyalty_points} points
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {customer.loyalty_tier === 'None' ? (
                <div className="text-center py-3">
                  <p className="text-gray-500">Not enrolled in loyalty program</p>
                  <Button variant="link" className="mt-2">
                    Enroll customer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div 
                          className="h-2 bg-purple-500 rounded-full" 
                          style={{ width: `${Math.min(100, customer.loyalty_points / 10)}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-medium">{customer.loyalty_points} pts</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Next reward at 1000 pts</span>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      <Settings className="h-3 w-3 mr-1" /> Loyalty Settings
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags and Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Tags & Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">Customer Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags?.length > 0 ? (
                      customer.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="flex items-center gap-1 px-2 py-1"
                        >
                          {tag}
                          <button 
                            onClick={() => onRemoveTag(customer.id, tag)}
                            className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No tags</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => onAddTag(customer.id, 'New Tag')} // This would open a dialog
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="text-sm font-medium mb-2">Customer Preferences</div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                    {customer.preferences ? (
                      <p className="text-sm">{customer.preferences}</p>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No preferences recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-md">Recent Orders</CardTitle>
                <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab('orders')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 3).map(order => (
                    <div 
                      key={order.id}
                      className="flex justify-between items-center p-2 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <div className="font-medium">{formatDate(order.date)}</div>
                        <div className="text-xs text-gray-500">Order #{order.order_id.substring(0, 8)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(order.amount)}</div>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-gray-500">
                  No orders found for this customer
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                Showing all orders for {customer.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map(order => (
                    <div 
                      key={order.id}
                      className="flex justify-between items-center p-3 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{formatDate(order.date)}</div>
                        <div className="text-xs text-gray-500">Order #{order.order_id.substring(0, 8)}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(order.amount)}</div>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No orders found for this customer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Customer Notes</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAddNote(customer.id, '')} // This would open a dialog
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map(note => (
                    <div 
                      key={note.id}
                      className="p-3 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <p className="text-sm mb-2">{note.content}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>By: {note.created_by}</span>
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No notes found for this customer</p>
                  <Button 
                    variant="link" 
                    onClick={() => onAddNote(customer.id, '')}
                  >
                    Add your first note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent activities and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="relative pl-6 border-l border-gray-200 dark:border-gray-700">
                  {activities.map((activity, index) => (
                    <div 
                      key={activity.id}
                      className={`relative pb-6 ${index === activities.length - 1 ? '' : ''}`}
                    >
                      <div className="absolute -left-[20px] w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        {activity.activity_type === 'note_added' && <MessageSquare className="h-2.5 w-2.5" />}
                        {activity.activity_type === 'email_sent' && <Mail className="h-2.5 w-2.5" />}
                        {activity.activity_type === 'order_placed' && <FileText className="h-2.5 w-2.5" />}
                        {activity.activity_type === 'tag_added' && <Tag className="h-2.5 w-2.5" />}
                        {activity.activity_type === 'promotion_sent' && <Send className="h-2.5 w-2.5" />}
                      </div>
                      <div>
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No activity recorded for this customer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetail;
