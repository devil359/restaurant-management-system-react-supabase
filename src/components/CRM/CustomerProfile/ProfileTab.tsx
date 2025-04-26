
import React from "react";
import CustomerInformation from "./CustomerInformation";
import CustomerLoyaltyCard from "../CustomerLoyalty/CustomerLoyaltyCard";
import CustomerTags from "./CustomerTags";
import CustomerPreferences from "./CustomerPreferences";
import CustomerStats from "./CustomerStats";
import { Customer } from "@/types/customer";

interface ProfileTabProps {
  customer: Customer;
  nextTierInfo: { nextTier: string; pointsNeeded: number; progress: number } | null;
  preferences: string;
  isEditingPreferences: boolean;
  onStartEditingPreferences: () => void;
  onPreferencesChange: (value: string) => void;
  onSavePreferences: () => void;
  onCancelPreferences: () => void;
  onAdjustPoints: () => void;
  onViewPointsHistory: () => void;
  onUnenroll: () => void;
  onEnroll: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  isLoading: boolean;
}

const ProfileTab = ({
  customer,
  nextTierInfo,
  preferences,
  isEditingPreferences,
  onStartEditingPreferences,
  onPreferencesChange,
  onSavePreferences,
  onCancelPreferences,
  onAdjustPoints,
  onViewPointsHistory,
  onUnenroll,
  onEnroll,
  onAddTag,
  onRemoveTag,
  isLoading
}: ProfileTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomerInformation customer={customer} />
        <CustomerLoyaltyCard
          customer={customer}
          nextTierInfo={nextTierInfo}
          onAdjustPoints={onAdjustPoints}
          onViewHistory={onViewPointsHistory}
          onUnenroll={onUnenroll}
          onEnroll={onEnroll}
          isLoading={isLoading}
        />
      </div>
      
      <CustomerTags
        tags={customer.tags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />
      
      <CustomerPreferences
        preferences={preferences}
        isEditing={isEditingPreferences}
        onStartEditing={onStartEditingPreferences}
        onPreferencesChange={onPreferencesChange}
        onSave={onSavePreferences}
        onCancel={onCancelPreferences}
      />
      
      <CustomerStats customer={customer} />
    </div>
  );
};

export default ProfileTab;
