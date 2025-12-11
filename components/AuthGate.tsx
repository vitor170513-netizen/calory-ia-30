
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { Button } from './Button';
import { getFriendlyErrorMessage } from '../utils/errorMapper';

interface AuthGateProps {
  onAuthSuccess: (isGuest?: boolean) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Verificação de Segurança
  if (!isSupabaseConfigured()) {
      return (
          <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
              <div className="glass-panel max-w-md w-full p-8 rounded-[2.5rem] text-center border-red-200 bg-red-50/50">
                  <h3 className="text-xl font-bold text-red-700 mb-2">Erro de Configuração</h3>
                  <p className="text-sm text-red-600 mb-6">
                      O banco de dados não está conectado. Entre em contato com o suporte.
                  </p>
              </div>
          </div>
      );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error && error.message.includes("already registered")) {
            setSuccessMsg("Conta já existe. Entrando...");
            const login = await supabase.auth.signInWithPassword({ email, password });
            if (login.error) throw login.error;
            if (login.data.session) {
                setTimeout(() => onAuthSuccess(), 1500);
                return;
            }
        } else if (error) {
            throw error;
        }
        
        if (data.user) {
            setSuccessMsg("Conta segura criada! Redirecionando...");
            if (data.session) {
                setTimeout(() => {
                    onAuthSuccess();
                }, 2000);
            } else {
                // Tenta forçar login se o Supabase permitir sign-in imediato
                const loginForce = await supabase.auth.signInWithPassword({ email, password });
                if (loginForce.data.session) {
                     setTimeout(() => {
                        onAuthSuccess();
                    }, 2000);
                } else {
                    setSuccessMsg("Conta criada! Verifique seu e-mail.");
                }
            }
        }

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.session) {
            setSuccessMsg("Conexão segura estabelecida!");
            setTimeout(() => {
                onAuthSuccess();
            }, 1000);
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err && Object.keys(err).length === 0) {
          setError("Erro de Conexão. Verifique sua internet.");
      } else {
          setError(getFriendlyErrorMessage(err));
      }
    } finally {
      if (!successMsg) {
          setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10 animate-fade-in">
      <div className="glass-panel max-w-md w-full p-8 rounded-[2.5rem] relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg mb-4">
              C
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              {isSignUp ? 'Criar Conta Segura' : 'Acesso ao Portal'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isSignUp ? 'Seus dados serão criptografados e salvos na nuvem.' : 'Ambiente monitorado por IA.'}
            </p>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm flex items-start gap-2 animate-fade-in font-bold">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2 animate-pulse">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-pink-500 outline-none transition-all dark:text-white"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Senha</label>
              <input 
                type="password" 
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-pink-500 outline-none transition-all dark:text-white"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" fullWidth isLoading={loading} className="py-4 text-lg shadow-xl shadow-pink-500/20">
              {isSignUp ? 'Criar Conta Grátis' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              <button 
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMsg(null); }}
                className="text-pink-600 dark:text-pink-400 font-bold hover:underline"
              >
                {isSignUp ? 'Já tenho conta' : 'Criar nova conta'}
              </button>
            </p>
            
            {/* Secure Footer Badges */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-center gap-6 opacity-60">
                <div className="flex flex-col items-center">
                    <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Criptografado</span>
                </div>
                <div className="flex flex-col items-center">
                    <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Salvo na Nuvem</span>
                </div>
                <div className="flex flex-col items-center">
                    <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Verificado</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
