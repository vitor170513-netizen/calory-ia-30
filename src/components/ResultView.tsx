
import React from 'react';
import { AnalysisResult, BodyType, LanguageCode } from '../types';
import { Button } from './Button';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { getText } from '../utils/i18n';

interface ResultViewProps {
  analysis: AnalysisResult;
  onContinue: () => void;
  lang?: LanguageCode;
  isDarkMode?: boolean;
}

export const ResultView: React.FC<ResultViewProps> = ({ analysis, onContinue, lang = 'pt' as LanguageCode, isDarkMode = false }) => {
  const text = getText(lang);
  
  const trackColor = isDarkMode ? '#374151' : '#F3F4F6';
  
  const data = [
    { name: text.results.fat, uv: analysis.estimatedBodyFat, fill: '#FF4B8B' },
    { name: 'Massa', uv: 100 - analysis.estimatedBodyFat, fill: trackColor }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-28 pb-12 animate-fade-in">
      <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-[#2D1B4E] dark:text-white mb-2">{text.results.title}</h2>
          <p className="text-gray-500">Baseado na análise biométrica da sua foto</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4 text-3xl shadow-sm">
                🧬
             </div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{text.results.bodyType}</p>
             <h3 className="text-4xl font-black text-[#2D1B4E] dark:text-white mb-2">{analysis.bodyType}</h3>
             <p className="text-sm text-gray-500 leading-relaxed px-4">
                {analysis.bodyType === BodyType.Endomorph && "Metabolismo mais lento. Foco em condicionamento."}
                {analysis.bodyType === BodyType.Ectomorph && "Metabolismo rápido. Foco em hipertrofia."}
                {analysis.bodyType === BodyType.Mesomorph && "Estrutura atlética. Foco em força."}
             </p>
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col items-center justify-center relative">
             <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    innerRadius="70%" 
                    outerRadius="100%" 
                    barSize={15} 
                    data={data} 
                    startAngle={90} 
                    endAngle={-270}
                  >
                    <RadialBar background={{ fill: trackColor }} cornerRadius={10} dataKey="uv" />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-[#2D1B4E] dark:text-white">{analysis.estimatedBodyFat}%</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Gordura</span>
                </div>
             </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-[2.5rem] mb-10">
          <h3 className="text-xl font-black text-[#2D1B4E] dark:text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm">★</span>
              {text.results.recommendation}
          </h3>
          
          <div className="space-y-4">
               <div className="flex gap-4 items-start">
                   <div className="mt-1 min-w-[4px] h-12 bg-purple-200 dark:bg-purple-700 rounded-full"></div>
                   <div>
                       <p className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide mb-1">Análise de Postura</p>
                       <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{analysis.postureNotes}</p>
                   </div>
               </div>
               
               <div className="flex gap-4 items-start pt-4 border-t border-gray-100 dark:border-gray-800">
                   <div className="mt-1 min-w-[4px] h-12 bg-pink-200 dark:bg-pink-700 rounded-full"></div>
                   <div>
                       <p className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide mb-1">Resumo do Plano</p>
                       <p className="text-gray-600 dark:text-gray-400 leading-relaxed">"{analysis.recommendationSummary}"</p>
                   </div>
               </div>
          </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={onContinue} className="w-full md:w-auto px-12 py-5 text-lg rounded-[1.5rem] bg-[#2D1B4E] text-white shadow-xl hover:scale-105 transition-transform">
            {text.results.cta}
        </Button>
      </div>
    </div>
  );
};
