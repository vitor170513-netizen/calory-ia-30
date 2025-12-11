
import React from 'react';
import { Button } from './Button';

interface PremiumModalProps {
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="h-32 bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Calory<span className="text-yellow-300">IA</span>+</h2>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Desbloqueie Seu Potencial</h3>
            <p className="text-gray-500 mt-2">Junte-se a 10.000+ membros transformando suas vidas.</p>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              'Scans de IA Ilimitados',
              'Guias de Exercícios em Vídeo HD',
              'Gerador de Lista de Compras',
              'Suporte Prioritário com Treinadores'
            ].map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                {feat}
              </li>
            ))}
          </ul>

          <Button fullWidth className="mb-3 text-lg shadow-xl shadow-orange-200">
            Testar Grátis por 7 Dias
          </Button>
          <p className="text-center text-xs text-gray-400">Depois R$ 29,90/mês. Cancele quando quiser.</p>
        </div>
      </div>
    </div>
  );
};
