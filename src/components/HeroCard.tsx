
import React from 'react';

interface HeroCardProps {
  rotation?: string;
  translateY?: string;
  children: React.ReactNode;
  className?: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({ 
  rotation = 'rotate-0', 
  translateY = '', 
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/60 dark:border-gray-700 shadow-2xl transform ${rotation} ${translateY} hover:rotate-0 transition-all duration-500 ${className}`}>
      {children}
    </div>
  );
};
