
import React, { memo, useState } from 'react';
import { AppStep, LanguageCode } from '../types';
import { getText } from '../utils/i18n';
import { supabase } from '../utils/supabaseClient';
import { ChatModal } from './ChatModal';

interface HeaderProps {
  currentStep: AppStep;
  setStep: (step: AppStep) => void;
  lang?: LanguageCode;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  userEmail?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = memo(({ currentStep, setStep, lang = 'pt' as LanguageCode, isDarkMode, toggleTheme, userEmail, onLogout }) => {
  const text = getText(lang);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Define se o usuário está "dentro" da aplicação (logado/com acesso)
  const isAppArea = [AppStep.Plan, AppStep.Progress, AppStep.Results, AppStep.Upload, AppStep.Payment].includes(currentStep);

  const handleLogoutClick = async () => {
      if(onLogout) {
          onLogout();
      } else {
          await supabase.auth.signOut();
          window.location.reload();
      }
  };

  // Helper para botões da TabBar
  const TabButton = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${isActive ? 'text-pink-500 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
    >
      <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
        {label}
      </span>
      {isActive && (
        <span className="absolute bottom-0 w-12 h-1 bg-pink-500 rounded-t-full shadow-[0_0_10px_rgba(236,72,153,0.8)]"></span>
      )}
    </button>
  );

  return (
    <>
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} lang={lang} />

      {/* --- TOP HEADER (Desktop & Mobile Logo) --- */}
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        {/* Adjusted height and padding to fit labels */}
        <div className="glass-panel rounded-full px-5 py-2 min-h-[4.5rem] flex items-center justify-between w-full max-w-5xl shadow-sm border-white/40">
          
          <button 
            className="flex items-center gap-3 group mr-auto" 
            onClick={() => setStep(AppStep.Home)}
            aria-label="Go to Home"
          >
            {/* Custom Logo: Bio-AI Node */}
            <svg className="w-10 h-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-md rounded-xl" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo_g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EC4899" /> {/* Pink-500 */}
                  <stop offset="1" stopColor="#8B5CF6" /> {/* Violet-500 */}
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="10" fill="url(#logo_g)" />
              {/* Abstract Flame/Cell Shape */}
              <path d="M18 7C18 7 11 13 11 19.5C11 23.5 14 27 18 27C22 27 25 23.5 25 19.5C25 13 18 7 18 7Z" fill="white" fillOpacity="0.2" />
              {/* Neural Connection Cross */}
              <path d="M18 14V24" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M13 19H23" stroke="white" strokeWidth="2" strokeLinecap="round" />
              {/* Core Node */}
              <circle cx="18" cy="19" r="2.5" fill="white" />
              {/* Top Signal */}
              <circle cx="18" cy="7" r="1.5" fill="white" />
            </svg>

            <span className="font-bold text-lg tracking-tight text-[#2D1B4E] dark:text-white flex items-center gap-1">
              Calory<span className="text-pink-500">IA</span>
              {/* AI Sparkle Icon */}
              <svg className="w-5 h-5 text-pink-500 animate-pulse-slow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </span>
          </button>
          
          <nav className="flex items-center gap-2 md:gap-4">
            
            {/* Back to Home Button - Visible if not on Home */}
            {currentStep !== AppStep.Home && (
              <button
                onClick={() => setStep(AppStep.Home)}
                className="flex flex-col items-center gap-0.5 group"
                aria-label="Voltar ao Início"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-black/40 border border-gray-200 dark:border-gray-600 shadow-md group-hover:scale-105 active:scale-95 transition-all duration-300 group-hover:text-pink-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide group-hover:text-pink-500 transition-colors">Início</span>
              </button>
            )}

            {/* AI CHAT BUTTON (New) */}
            <button
                onClick={() => setIsChatOpen(true)}
                className="flex flex-col items-center gap-0.5 group"
                aria-label={text.header.chat_tooltip}
            >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-pink-500 to-purple-600 border border-white/20 shadow-lg shadow-pink-500/20 group-hover:scale-105 active:scale-95 transition-all duration-300">
                    <svg className="w-5 h-5 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <span className="text-[9px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 uppercase tracking-wide">Dúvidas</span>
            </button>

            {/* Larger Theme Toggle Button */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="flex flex-col items-center gap-0.5 group"
                aria-label="Toggle Theme"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-black/40 border border-gray-200 dark:border-gray-600 shadow-md group-hover:scale-105 active:scale-95 transition-all duration-300">
                    {isDarkMode ? '🌙' : '☀️'}
                </div>
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tema</span>
              </button>
            )}

            {/* Desktop Navigation (Hidden on Mobile) */}
            {isAppArea && (
              <div className="hidden md:flex gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setStep(AppStep.Plan)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentStep === AppStep.Plan ? 'bg-pink-100 text-pink-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {text.header.plan}
                </button>
                <button 
                  onClick={() => setStep(AppStep.Progress)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentStep === AppStep.Progress ? 'bg-pink-100 text-pink-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {text.header.progress}
                </button>
              </div>
            )}

            {/* User/Logout */}
            {userEmail && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">
                        {userEmail[0].toUpperCase()}
                    </div>
                    <button 
                      onClick={handleLogoutClick}
                      className="text-xs font-bold text-gray-400 hover:text-red-500 p-1"
                    >
                        ✕
                    </button>
                </div>
            )}
          </nav>
        </div>
      </header>

      {/* --- BOTTOM TAB BAR (Mobile Only) --- */}
      {isAppArea && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-20 bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-2 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-none flex justify-around items-center px-2">
          
          <TabButton 
            onClick={() => setStep(AppStep.Results)} 
            isActive={currentStep === AppStep.Results || currentStep === AppStep.Upload}
            label={text.header.home}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
          />
          
          <TabButton 
            onClick={() => setStep(AppStep.Plan)} 
            isActive={currentStep === AppStep.Plan}
            label={text.header.plan}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
          />

          <TabButton 
            onClick={() => setStep(AppStep.Progress)} 
            isActive={currentStep === AppStep.Progress}
            label={text.header.progress}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
          
        </nav>
      )}
    </>
  );
});
