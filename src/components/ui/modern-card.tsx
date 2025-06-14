
import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'neumorphic' | 'elevated';
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
}

/**
 * Modern card component with glassmorphism and contemporary styling
 */
export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'default',
  className,
  padding = 'lg',
  hover = true,
  glow = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const variantClasses = {
    default: 'bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg',
    glass: 'bg-white/60 backdrop-blur-xl border border-white/30 shadow-2xl',
    neumorphic: 'bg-gradient-to-br from-gray-50 to-gray-100 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] border border-gray-200/50',
    elevated: 'bg-white/95 backdrop-blur-md border border-gray-200/30 shadow-2xl'
  };

  return (
    <Card
      className={cn(
        'rounded-2xl transition-all duration-300',
        variantClasses[variant],
        paddingClasses[padding],
        hover && 'hover:shadow-xl hover:transform hover:scale-[1.01]',
        glow && 'hover:shadow-[0_0_32px_rgba(139,92,246,0.15)]',
        className
      )}
    >
      {children}
    </Card>
  );
};
