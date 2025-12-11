import React from 'react';
import { LanguageCode, MeasurementEntry, WorkoutEntry } from '../types';
import { getText } from '../utils/i18n';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { StatCard } from './StatCard';

interface ProgressViewProps {
  measurements: MeasurementEntry[];
  workoutLogs: WorkoutEntry[];
  lang?: LanguageCode;
  isDarkMode?: boolean;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ measurements, workoutLogs, lang = 'pt' as LanguageCode, isDarkMode = false }) => {
  const text = getText(lang);

  const startWeight = measurements.length > 0 ? measurements[0].weight : 0;
  const currentWeight = measurements.length > 0 ? measurements[measurements.length - 1].weight : 0;
  const weightDiff = currentWeight - startWeight;
  const totalCalories = workoutLogs.reduce((acc, log) => acc + log.caloriesBurned, 0);

  // Dark Mode Styles for Charts
  const chartTextColor = isDarkMode ? '#9CA3AF' : '#9CA3AF'; // Gray-400
  const chartGridColor = isDarkMode ? '#374151' : '#e5e7eb'; // Gray-700 vs Gray-200
  const tooltipStyle = isDarkMode 
    ? { borderRadius: '12px', border: '1px solid #374151', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', background: '#111827', color: '#f3f4f6' }
    : { borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.9)', color: '#111' };
  const tooltipItemStyle = isDarkMode ? { color: '#f3f4f6' } : { color: '#111' };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-24 pb-12 animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 transition-colors">{text.progress.title}</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          label={text.progress.currentWeight}
          value={currentWeight}
          unit="kg"
          subtext={`${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg (${text.progress.weightLost})`}
          subtextColor={weightDiff <= 0 ? 'text-green-500' : 'text-orange-500'}
        />

        <StatCard 
          label={text.progress.totalWorkouts}
          value={workoutLogs.length}
          unit={text.progress.workouts}
          subtext={text.progress.keepGoing}
          valueColor="text-pink-600 dark:text-pink-500"
        />

        <StatCard 
          label={text.progress.totalCalories}
          value={totalCalories}
          unit="kcal"
          subtext={text.progress.burnedTotal}
          valueColor="text-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weight Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 transition-colors">{text.progress.weightHistory}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={measurements}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis 
                  dataKey="date" 
                  tick={{fill: chartTextColor, fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(str) => new Date(str).getDate().toString()}
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']} 
                  tick={{fill: chartTextColor, fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#FF4B8B" 
                  strokeWidth={3} 
                  dot={{ fill: '#FF4B8B', strokeWidth: 2, r: 4, stroke: isDarkMode ? '#1f2937' : '#fff' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 transition-colors">{text.progress.activity}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutLogs}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                 <XAxis 
                    dataKey="date" 
                    tick={{fill: chartTextColor, fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(str) => new Date(str).getDate().toString()}
                 />
                 <YAxis 
                    tick={{fill: chartTextColor, fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false}
                 />
                 <Tooltip 
                   cursor={{fill: isDarkMode ? '#374151' : '#f3f4f6'}}
                   contentStyle={tooltipStyle}
                   itemStyle={tooltipItemStyle}
                 />
                 <Bar dataKey="durationMinutes" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};