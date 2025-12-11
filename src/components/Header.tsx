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
  const isAppArea = [AppStep.Plan, AppStep.Progress, AppStep.Results, AppStep.Upload, AppStep.Payment].includes(currentStep);

  const handleLogoutClick = async () => {
      if(onLogout) onLogout();
      else {
          await supabase.auth.signOut();
          window.location.reload();
      }
  };

  // Botão da TabBar Inferior
  const TabButton = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative group ${isActive ? 'text-pink-500' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
    >
      <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    </button>
  );

  return (
    <>
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} lang={lang} />

      {/* --- TOP HEADER (Glass Capsule) --- */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="glass-panel pointer-events-auto rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl shadow-2xl border-white/20 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl">
          
          {/* Logo */}
          <button className="flex items-center gap-3 group outline-none" onClick={() => setStep(AppStep.Home)}>
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
               <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-600"></div>
               <svg className="absolute inset-0 w-full h-full p-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white flex items-center">
              Calory<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">IA</span>
            </span>
          </button>
          
          <nav className="flex items-center gap-3">
            {/* Botão de Dúvidas (IA) */}
            <button onClick={() => setIsChatOpen(true)} className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 