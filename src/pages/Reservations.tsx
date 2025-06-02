
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GuestCheckIn from "@/components/GuestExperience/GuestCheckIn";
import { StandardizedCard } from "@/components/ui/standardized-card";
import { Calendar, Users, QrCode, MessageSquare } from "lucide-react";

const Reservations = () => {
  return (
    <div className="container mx-auto py-4 md:py-8 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Guest Experience Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage guest check-ins, reservations, and digital services
        </p>
      </div>

      <Tabs defaultValue="checkin" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="checkin" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Check-In Kiosk
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reservations
          </TabsTrigger>
          <TabsTrigger value="digital-menu" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Digital Menu
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Guest Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="mt-6">
          <GuestCheckIn />
        </TabsContent>

        <TabsContent value="reservations" className="mt-6">
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Reservation Management</h3>
            <p className="text-gray-600">
              Advanced reservation management features will be implemented here, including:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Online reservation system with real-time availability</li>
              <li>• Automated email/SMS confirmations</li>
              <li>• Waitlist management</li>
              <li>• Table optimization algorithms</li>
              <li>• Guest preference tracking</li>
            </ul>
          </StandardizedCard>
        </TabsContent>

        <TabsContent value="digital-menu" className="mt-6">
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Digital Menu with QR Codes</h3>
            <p className="text-gray-600">
              QR code menu system features:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Generate unique QR codes for each table</li>
              <li>• Mobile-optimized menu interface</li>
              <li>• Real-time menu updates and availability</li>
              <li>• Multi-language support</li>
              <li>• Direct ordering from mobile devices</li>
              <li>• Dietary restriction filters</li>
            </ul>
          </StandardizedCard>
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Guest Feedback System</h3>
            <p className="text-gray-600">
              Comprehensive guest feedback management:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Digital feedback forms accessible via QR codes</li>
              <li>• Rating system for food, service, and ambiance</li>
              <li>• Complaint tracking and resolution workflow</li>
              <li>• Integration with review platforms (Google, TripAdvisor)</li>
              <li>• Automated follow-up emails</li>
              <li>• Sentiment analysis and reporting</li>
            </ul>
          </StandardizedCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reservations;
