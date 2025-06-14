
/**
 * Modern Design tokens for premium UI/UX across the application
 * Use these tokens to maintain visual consistency with contemporary design
 */

export const designTokens = {
  // Enhanced Color palette with modern gradients
  colors: {
    primary: {
      50: '#f8faff',
      100: '#f0f4ff',
      200: '#e0e7ff',
      300: '#c7d2fe',
      400: '#a5b4fc',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    }
  },

  // Modern Typography scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      display: ['Playfair Display', 'Georgia', 'serif'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    }
  },

  // Enhanced spacing with golden ratio
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },

  // Modern border radius
  borderRadius: {
    none: '0',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },

  // Enhanced shadows with depth
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    glow: '0 0 0 1px rgb(139 92 246 / 0.3), 0 0 32px rgb(139 92 246 / 0.15)',
  }
};

// Modern component variants with glassmorphism and neumorphism
export const componentVariants = {
  // Enhanced Button variants
  button: {
    primary: `
      bg-gradient-to-r from-purple-600 to-purple-700 
      hover:from-purple-700 hover:to-purple-800 
      text-white font-semibold px-6 py-3 rounded-xl 
      shadow-lg hover:shadow-xl 
      transform hover:scale-[1.02] active:scale-[0.98]
      transition-all duration-200 
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      border border-purple-500/20
    `,
    secondary: `
      bg-white/80 backdrop-blur-sm border border-gray-200/50 
      hover:bg-white/90 hover:border-gray-300/50
      text-gray-700 font-semibold px-6 py-3 rounded-xl 
      shadow-md hover:shadow-lg 
      transform hover:scale-[1.02] active:scale-[0.98]
      transition-all duration-200
    `,
    success: `
      bg-gradient-to-r from-green-500 to-green-600 
      hover:from-green-600 hover:to-green-700 
      text-white font-semibold px-6 py-3 rounded-xl 
      shadow-lg hover:shadow-xl 
      transform hover:scale-[1.02] active:scale-[0.98]
      transition-all duration-200
      border border-green-400/20
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 
      hover:from-red-600 hover:to-red-700 
      text-white font-semibold px-6 py-3 rounded-xl 
      shadow-lg hover:shadow-xl 
      transform hover:scale-[1.02] active:scale-[0.98]
      transition-all duration-200
      border border-red-400/20
    `,
    ghost: `
      hover:bg-gray-100/80 backdrop-blur-sm
      text-gray-700 font-medium px-4 py-2 rounded-lg 
      transition-all duration-200
      hover:shadow-md
    `
  },

  // Enhanced Card variants with glassmorphism
  card: {
    default: `
      bg-white/90 backdrop-blur-sm border border-gray-200/50 
      rounded-2xl shadow-lg hover:shadow-xl 
      transition-all duration-300
      hover:transform hover:scale-[1.01]
    `,
    elevated: `
      bg-white/95 backdrop-blur-md border border-gray-200/30 
      rounded-2xl shadow-2xl hover:shadow-3xl 
      transition-all duration-300
      hover:transform hover:scale-[1.01]
    `,
    glass: `
      bg-white/60 backdrop-blur-xl border border-white/30 
      rounded-2xl shadow-2xl 
      transition-all duration-300
      hover:bg-white/70 hover:border-white/40
      hover:transform hover:scale-[1.01]
    `,
    neumorphic: `
      bg-gradient-to-br from-gray-50 to-gray-100
      rounded-2xl
      shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff]
      hover:shadow-[12px_12px_24px_#d1d5db,-12px_-12px_24px_#ffffff]
      transition-all duration-300
      border border-gray-200/50
    `
  },

  // Enhanced Input variants
  input: {
    default: `
      w-full px-4 py-3 border border-gray-300/60 
      rounded-xl focus:ring-2 focus:ring-purple-500/50 
      focus:border-purple-500 bg-white/80 backdrop-blur-sm
      transition-all duration-200
      placeholder:text-gray-400
    `,
    error: `
      w-full px-4 py-3 border border-red-300/60 
      rounded-xl focus:ring-2 focus:ring-red-500/50 
      focus:border-red-500 bg-white/80 backdrop-blur-sm
      transition-all duration-200
    `
  },

  // Modern Dialog/Modal variants
  dialog: {
    overlay: `
      bg-black/40 backdrop-blur-sm
      transition-all duration-300
    `,
    content: `
      bg-white/95 backdrop-blur-xl 
      rounded-3xl shadow-2xl border border-white/20
      transform transition-all duration-300
      max-w-lg w-full mx-4
    `
  }
};

// Layout constants with modern spacing
export const layout = {
  sidebar: {
    width: '280px',
    collapsedWidth: '80px',
  },
  header: {
    height: '72px',
  },
  container: {
    maxWidth: '1400px',
    padding: '2rem',
  }
};

// Modern animation presets
export const animations = {
  spring: 'transition-all duration-300 ease-out',
  bounce: 'transition-all duration-200 ease-in-out',
  smooth: 'transition-all duration-150 ease-in-out',
  slide: 'transition-transform duration-300 ease-out',
};
