
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './Button';
import { HeroCard } from './HeroCard';
import { LanguageCode } from '../types';
import { getText, getRegionalPrice } from '../utils/i18n';

interface HeroProps {
  onStart: () => void;
  lang?: LanguageCode;
  setLang?: (lang: LanguageCode) => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart, lang = 'pt' as LanguageCode, setLang }) => {
  const text = getText(lang);
  const priceData = getRegionalPrice(lang);
  const [timeLeft, setTimeLeft] = useState(23 * 60 * 60 + 45 * 60); 
  const [currentTagIndex, setCurrentTagIndex] = useState(0);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 24 * 60 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tagTimer = setInterval(() => {
        setCurrentTagIndex((prev) => (prev + 1) % text.hero.tags.length);
    }, 3500);
    return () => clearInterval(tagTimer);
  }, [text.hero.tags]);

  useEffect(() => {
    const titleTimer = setInterval(() => {
        setCurrentTitleIndex((prev) => (prev + 1) % text.hero.titles.length);
    }, 5000);
    return () => clearInterval(titleTimer);
  }, [text.hero.titles]);

  const formatTime = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      return `${h}h ${m}m ${secs}s`;
  };

  const heroContent = useMemo(() => {
      const titles = text.hero.titles;
      const subtitles = text.hero.subtitles;
      return { 
          title: titles[currentTitleIndex % titles.length], 
          subtitle: subtitles[currentTitleIndex % subtitles.length] || subtitles[0] 
      };
  }, [lang, text, currentTitleIndex]);

  const originalVal = parseFloat(priceData.original?.replace(',', '.') || '0');
  const currentVal = parseFloat(priceData.value.replace(',', '.') || '0');
  const percentageOff = Math.round(((originalVal - currentVal) / originalVal) * 100);

  return (
    <div className="relative overflow-hidden pb-24">
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <div className="absolute inset-0 bg-black/10 z-10"></div> 
          <img 
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
            alt="Background Fitness AI" 
            className="w-full h-[130vh] object-cover opacity-50 dark:opacity-40"
            style={{ objectPosition: 'center 20%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/60 to-[#FDF4FF] dark:from-gray-950/90 dark:via-gray-950/60 dark:to-gray-950 z-20"></div>
      </div>

      <div className="relative z-30 flex flex-col items-center justify-center pt-28 pb-4 animate-fade-in gap-3">
         <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-green-200 dark:border-green-900/30 px-4 py-1.5 rounded-full shadow-sm mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-600 dark:text-gray-300">
                MÉTODO VALIDADO CIENTIFICAMENTE
            </span>
         </div>

         <div className="inline-flex items-center gap-3 bg-red-50/90 dark:bg-red-900/40 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-300 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm backdrop-blur-sm">
            <span className="uppercase tracking-wide text-xs md:text-sm">{text.marketing.urgent}</span>
            <span className="font-mono text-base">{formatTime(timeLeft)}</span>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center text-center z-30 relative">
          <div className="mb-6 animate-fade-in-up min-h-[160px] flex flex-col justify-center">
              <div className="h-6 mb-4 overflow-hidden relative">
                  <span 
                    key={currentTagIndex}
                    className="text-pink-600 dark:text-pink-400 font-extrabold tracking-widest uppercase text-xs md:text-sm block animate-fade-in drop-shadow-sm"
                  >
                      {text.hero.tags[currentTagIndex]}
                  </span>
              </div>

              <h1 
                key={currentTitleIndex}
                className="text-4xl md:text-6xl lg:text-7xl font-black text-[#2D1B4E] dark:text-white tracking-tight leading-tight max-w-5xl mx-auto drop-shadow-sm animate-fade-in"
              >
                 {heroContent.title}
              </h1>
          </div>
          
          <p key={currentTitleIndex} className="text-lg md:text-xl text-gray-700 dark:text-gray-200 mb-8 leading-relaxed max-w-3xl font-medium animate-fade-in-up delay-100 drop-shadow-sm min-h-[80px]">
            {heroContent.subtitle}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in-up delay-200 max-w-4xl">
              {text.hero.benefits.map((benefit: any, i: number) => (
                  <div 
                    key={i} 
                    className={`flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-xl shadow-md text-sm font-bold transition-transform cursor-default ring-2 ring-transparent ${
                        i === 0 
                        ? 'bg-green-100/90 text-green-800 border-green-200 scale-105 shadow-green-200/50 z-10 ring-green-400/30' 
                        : 'bg-white/80 dark:bg-gray-800/80 border border-pink-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:scale-105 hover:ring-pink-200'
                    }`}
                  >
                      <svg className={`w-5 h-5 ${i===0 ? 'text-green-600' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      {benefit}
                  </div>
              ))}
          </div>
      </div>

      <div className="mt-10 max-w-6xl mx-auto px-4 relative z-30 mb-20">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-pink-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full"></div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
               <HeroCard rotation="rotate-[-3deg]" className="hover:z-20 transition-all duration-500 hover:scale-105 bg-white/60 dark:bg-gray-800/60">
                   <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] group">
                       <img 
                         src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80" 
                         alt="Training Weights" 
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                       />
                       <div className="absolute top-6 left-6 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow-xl border border-white/50 animate-fade-in">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Algoritmo</p>
                           <p className="text-lg font-black text-pink-600">Treino Inteligente</p>
                       </div>
                   </div>
                   <div className="mt-5 px-4 text-center">
                       <p className="font-bold text-[#2D1B4E] dark:text-white text-xl mb-1">Otimização Muscular</p>
                       <p className="text-sm text-gray-500 leading-snug">Menos tempo na academia, o dobro de resultado. Séries calculadas para seu tipo de fibra.</p>
                   </div>
               </HeroCard>

               <HeroCard rotation="rotate-[3deg]" translateY="translate-y-8 md:translate-y-0" className="hover:z-20 transition-all duration-500 hover:scale-105 bg-white/60 dark:bg-gray-800/60">
                   <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] bg-purple-50 flex items-center justify-center group">
                       <img 
                         src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80" 
                         alt="Healthy Food" 
                         className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
                       />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B4E] via-[#2D1B4E]/40 to-transparent flex items-end p-8">
                            <div className="text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <p className="font-bold text-2xl mb-1 flex items-center gap-2">
                                    Nutrição Precisa
                                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </p>
                                <p className="text-sm opacity-90 leading-relaxed font-light">
                                    Zero achismo. Coma exatamente o que seu metabolismo precisa para acelerar a queima.
                                </p>
                            </div>
                        </div>
                   </div>
               </HeroCard>
           </div>
      </div>

      <div className="mt-24 max-w-5xl mx-auto px-4 relative z-30 animate-fade-in-up delay-300">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-[#2D1B4E] dark:text-white mb-3">
            {text.comparison?.title || "Evolução vs Tradição"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {text.comparison?.subtitle || "Por que a CaloryIA é a escolha inteligente?"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {text.comparison?.items?.map((item: any, idx: number) => (
            <div key={idx} className="glass-panel p-6 rounded-3xl border border-white/50 dark:border-gray-700/50 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
               <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-125 transition-transform">{item.icon}</div>
               
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm">
                   {item.icon}
                 </div>
                 <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">{item.title}</h3>
                 
                 <div className="space-y-3">
                   <div className="flex items-center gap-2 text-gray-400 text-sm">
                     <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px]">✕</span>
                     <span className="line-through decoration-red-400">{item.old}</span>
                   </div>
                   <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                     <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">✓</span>
                     <span>{item.new}</span>
                   </div>
                 </div>
               </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto animate-fade-in-up delay-300">
            <Button onClick={onStart} className="w-full text-lg md:text-xl py-5 rounded-[1.5rem] shadow-2xl shadow-pink-500/40 bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:scale-[1.02] transition-transform font-black tracking-wide border-t border-white/20">
              {text.hero.cta}
              <svg className="w-6 h-6 ml-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </Button>
            
            <div className="flex items-center justify-between w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/50 dark:border-gray-700 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md">
                    ECONOMIZE {percentageOff}% HOJE
                </div>
                
                <div className="flex flex-col items-start">
                    <span className="text-gray-400 line-through text-sm decoration-red-400 font-medium">
                        {priceData.symbol} {priceData.original}
                    </span>
                    <span className="text-xs text-gray-500 uppercase font-bold">Valor Normal</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-3xl font-black text-[#2D1B4E] dark:text-white leading-none">
                        {priceData.symbol} {priceData.value}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-bold uppercase">Acesso Vitalício</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                 <div className="flex -space-x-2">
                     <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 bg-[url('https://randomuser.me/api/portraits/women/44.jpg')] bg-cover"></div>
                     <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 bg-[url('https://randomuser.me/api/portraits/men/32.jpg')] bg-cover"></div>
                     <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 bg-[url('https://randomuser.me/api/portraits/women/68.jpg')] bg-cover"></div>
                     <div className="w-8 h-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">+12k</div>
                 </div>
                 <span>Pessoas transformadas esse mês</span>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                {text.marketing.guarantee_text}
            </p>
          </div>
      </div>

      <div className="mt-24 pt-10 border-t border-gray-200/50 dark:border-gray-800/50 text-center relative z-30">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{text.marketing.trusted_by}</p>
          <div className="flex justify-center items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
             <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse delay-100"></div>
             <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse delay-200"></div>
          </div>
      </div>
    </div>
  );
};
