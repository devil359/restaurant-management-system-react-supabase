
import React from "react";
import { ModernCard } from "@/components/ui/modern-card";
import { PermissionGuard } from "@/components/Auth/PermissionGuard";
import { ModernButton } from "@/components/ui/modern-button";
import { Permission } from "@/types/auth";

interface ModernPageHeaderProps {
  title: string;
  description?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    permission?: Permission;
  };
  breadcrumb?: React.ReactNode;
}

/**
 * Modern page header component with glassmorphism effects
 */
export const ModernPageHeader: React.FC<ModernPageHeaderProps> = ({
  title,
  description,
  actionButton,
  breadcrumb
}) => {
  return (
    <ModernCard variant="glass" className="mb-8" glow>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex-1">
          {breadcrumb && (
            <div className="mb-3">
              {breadcrumb}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              {description}
            </p>
          )}
        </div>
        
        {actionButton && (
          <PermissionGuard permission={actionButton.permission}>
            <ModernButton
              variant={actionButton.variant || 'primary'}
              onClick={actionButton.onClick}
              icon={actionButton.icon}
              glow
            >
              {actionButton.label}
            </ModernButton>
          </PermissionGuard>
        )}
      </div>
    </ModernCard>
  );
};
