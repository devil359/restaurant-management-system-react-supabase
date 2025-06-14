
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModernDialogProps {
  children: React.ReactNode;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Modern dialog component with glassmorphism effects
 */
export const ModernDialog: React.FC<ModernDialogProps> = ({
  children,
  trigger,
  title,
  description,
  open,
  onOpenChange,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent 
        className={cn(
          'bg-white/95 backdrop-blur-xl border border-white/20',
          'rounded-3xl shadow-2xl',
          'transform transition-all duration-300',
          sizeClasses[size],
          'mx-4 p-0 overflow-hidden',
          className
        )}
      >
        <div className="p-8">
          {(title || description) && (
            <DialogHeader className="mb-6">
              {title && (
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {title}
                </DialogTitle>
              )}
              {description && (
                <DialogDescription className="text-gray-600 mt-2">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          )}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};
