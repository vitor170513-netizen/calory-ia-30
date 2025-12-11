
import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { getText } from '../utils/i18n';
import { LanguageCode } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: LanguageCode;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, lang = 'pt' as LanguageCode }) => {
  const text = getText(lang);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', content: text.chat.greeting }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
        const historyForApi = newMessages.map(m => ({ role: m.role, content: m.content }));
        
        const response = await sendChatMessage(historyForApi, userMsg);
        
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: response }]);
    } catch (error) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: "Erro ao conectar. Tente novamente." }]);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>

      <div className="bg-white dark:bg-gray-900 w-full sm:w-[400px] sm:h-[600px] h-[80vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col pointer-events-auto transform transition-transform animate-fade-in-up border border-gray-200 dark:border-gray-800 overflow-hidden">
        
        <div className="p-4 bg-gradient-to-r from-pink-600 to-purple-600 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                <svg className="w-6 h-6 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
             </div>
             <div>
                <h3 className="font-bold text-lg leading-none">{text.chat.title}</h3>
                <p className="text-xs text-white/80">{text.chat.subtitle}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/20 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               {msg.role === 'model' && (
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shadow-sm flex-shrink-0">IA</div>
               )}
               <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                   msg.role === 'user' 
                   ? 'bg-purple-600 text-white rounded-tr-none' 
                   : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
               }`}>
                  {msg.content}
               </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 mr-2"></div>
                <div className="bg-gray-200 dark:bg-gray-800 h-10 w-32 rounded-2xl flex items-center px-4 text-xs text-gray-500">
                    {text.chat.thinking}
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
           <input 
             ref={inputRef}
             type="text" 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder={text.chat.placeholder}
             className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all dark:text-white"
           />
           <button 
             type="submit" 
             disabled={!input.trim() || isLoading}
             className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-pink-500/20"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
           </button>
        </form>

      </div>
    </div>
  );
};
