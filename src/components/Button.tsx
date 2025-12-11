import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  isLoading = false,
  className = '',
  type = 'button',
  onClick,
  ...props 
}) => {
  // Base: Pill shape (rounded-full), Bold font, Smooth transition
  const baseStyles = "px-8 py-4 rounded-full font-black tracking-wide transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm uppercase shadow-lg select-none relative overflow-hidden group";
  
  const variants = {
    // Cyber Gradient: Pink to Purple with Glow
    primary: "bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] border border-white/10",
    
    // Clean Glass: White/Dark with blur
    secondary: "bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
    
    // Outline Neon
    outline: "bg-transparent border-2 border-pink-500 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10",
    
    // Ghost
    ghost: "bg-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/10"
  };

  const handleHapticClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (navigator.vibrate) navigator.vibrate(15);
    if (onClick) onClick(e);
  };

  return (
    <button 
      type={type}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className} ${isLoading ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
      disabled={isLoading || props.disabled}
      onClick={handleHapticClick}
      {...props}
    >
      {/* Shimmer Effect on Hover for Primary */}
      {variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
      )}

      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span className="relative z-20 flex items-center gap-2">{children}</span>
    </button>
  );
};