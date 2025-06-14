
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
}

/**
 * Modern button component with contemporary styling and effects
 */
export const ModernButton: React.FC<ModernButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  glow = false,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
    xl: 'px-10 py-5 text-xl rounded-2xl'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border border-purple-500/20',
    secondary: 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 hover:border-gray-300/50 text-gray-700',
    success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border border-green-400/20',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border border-red-400/20',
    ghost: 'hover:bg-gray-100/80 backdrop-blur-sm text-gray-700 hover:shadow-md',
    glass: 'bg-white/60 backdrop-blur-xl border border-white/30 text-gray-700 hover:bg-white/70'
  };

  return (
    <Button
      className={cn(
        'font-semibold shadow-lg hover:shadow-xl',
        'transform hover:scale-[1.02] active:scale-[0.98]',
        'transition-all duration-200',
        sizeClasses[size],
        variantClasses[variant],
        loading && 'opacity-75 cursor-not-allowed',
        glow && 'hover:shadow-[0_0_32px_rgba(139,92,246,0.15)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </Button>
  );
};
