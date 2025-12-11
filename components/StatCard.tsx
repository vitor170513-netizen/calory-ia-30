import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: React.ReactNode;
  valueColor?: string;
  subtextColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  unit, 
  subtext, 
  valueColor = "text-gray-900 dark:text-white",
  subtextColor = "text-gray-400"
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
      <p className="text-sm text-gray-500 uppercase font-semibold">{label}</p>
      <div className="flex items-end gap-2 mt-2">
        <span className={`text-4xl font-bold transition-colors ${valueColor}`}>{value}</span>
        {unit && <span className="text-lg text-gray-500 mb-1">{unit}</span>}
      </div>
      {subtext && <div className={`text-sm mt-2 font-medium ${subtextColor}`}>{subtext}</div>}
    </div>
  );
};