import React from 'react';

interface TipItemProps {
  text: string;
}

export const TipItem: React.FC<TipItemProps> = ({ text }) => {
  return (
    <li className="flex gap-3 items-center bg-white dark:bg-gray-700/60 p-3 rounded-xl border border-gray-100 dark:border-gray-600 transition-colors">
      <span className="w-2 h-2 bg-pink-400 rounded-full flex-shrink-0"></span>
      <span className="text-gray-600 dark:text-gray-300 text-sm">{text}</span>
    </li>
  );
};