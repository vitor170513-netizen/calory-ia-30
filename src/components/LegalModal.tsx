
import React from 'react';
import { getText } from '../utils/i18n';
import { LanguageCode } from '../types';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy' | null;
  lang?: LanguageCode;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type, lang = 'pt' as LanguageCode }) => {
  const text = getText(lang);

  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-fade-in-up border border-gray-100 dark:border-gray-800">
        
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
          <h3 className="text-xl font-black text-gray-900 dark:text-white">
             {type === 'terms' ? text.legal.termsTitle : text.legal.privacyTitle}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 bg-white dark:bg-gray-700 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
           <div className="prose dark:prose-invert prose-sm max-w-none">
              <p className="whitespace-pre-line text-gray-600 dark:text-gray-300 leading-relaxed">
                  {text.legal.content}
              </p>
           </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
             <button 
               onClick={onClose}
               className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
             >
               Entendido
             </button>
        </div>

      </div>
    </div>
  );
};
