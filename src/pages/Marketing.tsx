
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoyaltyManager from "@/components/Marketing/LoyaltyManager";
import { StandardizedCard } from "@/components/ui/standardized-card";
import { Star, Mail, Share2, MessageCircle, Users, Gift } from "lucide-react";

const Marketing = () => {
  return (
    <div className="container mx-auto py-4 md:py-8 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Marketing & Loyalty Programs
        </h1>
        <p className="text-muted-foreground mt-1">
          Drive customer engagement and loyalty through targeted campaigns
        </p>
      </div>

      <Tabs defaultValue="loyalty" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Loyalty Program
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Marketing
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Review Management
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Referral Program
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loyalty" className="mt-6">
          <LoyaltyManager />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Email Marketing Automation</h3>
            <p className="text-gray-600">
              Automated email marketing features:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Welcome email sequences for new customers</li>
              <li>• Birthday and anniversary promotions</li>
              <li>• Re-engagement campaigns for inactive customers</li>
              <li>• Post-visit feedback requests</li>
              <li>• Seasonal promotion announcements</li>
              <li>• Loyalty milestone celebrations</li>
              <li>• Abandoned reservation reminders</li>
            </ul>
          </StandardizedCard>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Social Media Integration</h3>
            <p className="text-gray-600">
              Social media management tools:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Automated posting of daily specials and events</li>
              <li>• Social media contest management</li>
              <li>• User-generated content campaigns</li>
              <li>• Instagram and Facebook integration</li>
              <li>• Social media analytics and reporting</li>
              <li>• Influencer collaboration tracking</li>
            </ul>
          </StandardizedCard>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Review Management</h3>
            <p className="text-gray-600">
              Comprehensive review monitoring and management:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Google Business and TripAdvisor integration</li>
              <li>• Automated review request campaigns</li>
              <li>• Review response templates and automation</li>
              <li>• Sentiment analysis and alert system</li>
              <li>• Review performance tracking</li>
              <li>• Competitive review monitoring</li>
            </ul>
          </StandardizedCard>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Referral Programs</h3>
            <p className="text-gray-600">
              Word-of-mouth marketing amplification:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Customizable referral reward structures</li>
              <li>• Digital referral links and codes</li>
              <li>• Social sharing incentives</li>
              <li>• Referral tracking and attribution</li>
              <li>• Automated reward distribution</li>
              <li>• Referral performance analytics</li>
            </ul>
          </StandardizedCard>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <StandardizedCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Marketing Campaigns</h3>
            <p className="text-gray-600">
              Advanced campaign management features:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Multi-channel campaign orchestration</li>
              <li>• A/B testing for promotional content</li>
              <li>• Customer segmentation and targeting</li>
              <li>• Campaign performance analytics</li>
              <li>• ROI tracking and optimization</li>
              <li>• Automated campaign triggers based on behavior</li>
            </ul>
          </StandardizedCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marketing;
