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
  type = 'button', // Default to button to prevent form submission
  onClick,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-[1.2rem] font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm tracking-wide select-none";
  
  const variants = {
    primary: "bg-[#2D1B4E] text-white shadow-lg shadow-purple-900/10 hover:shadow-purple-900/20 hover:bg-[#3E2A6E]",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm",
    outline: "border-2 border-pink-500 text-pink-500 hover:bg-pink-50",
    ghost: "bg-transparent text-gray-400 hover:text-gray-900"
  };

  const handleHapticClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Taptic Engine feel
    if (navigator.vibrate) {
      navigator.vibrate(10); 
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      type={type}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      disabled={isLoading || props.disabled}
      onClick={handleHapticClick}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};