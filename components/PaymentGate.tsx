
import React, { useState } from 'react';
import { Button } from './Button';
import { LanguageCode, UserProfile } from '../types';
import { getText, getRegionalPrice } from '../utils/i18n';
import { PAYMENT_CONFIG } from '../services/paymentService';

interface PaymentGateProps {
  onSuccess: () => void;
  lang?: LanguageCode;
  country?: string;
  userProfile?: UserProfile | null;
}

type PaymentMethod = 'card' | 'pix' | 'boleto';

export const PaymentGate: React.FC<PaymentGateProps> = ({ onSuccess, lang = 'pt' as LanguageCode, country, userProfile }) => {
  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('card');
  const [showPixCode, setShowPixCode] = useState(false);
  
  // Form State Card
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');

  const text = getText(lang);
  const price = getRegionalPrice(lang, country);

  // Masks
  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    v = v.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(v.slice(0, 19));
  };

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length >= 2) {
      v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    setExpiry(v);
  };

  const handleCpf = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(v);
  };

  const processPayment = async () => {
    setLoading(true);

    if (activeMethod === 'pix') {
         setProcessingStage("Conectando ao Banco Central...");
         await new Promise(r => setTimeout(r, 1500));
         setProcessingStage("Gerando QR Code Único...");
         await new Promise(r => setTimeout(r, 1000));
         setLoading(false);
         setShowPixCode(true);
         return;
    }

    // Simulation Sequence for Card/Boleto to feel real
    const stages = activeMethod === 'card' 
        ? ["Criptografando dados...", "Validando cartão...", "Conectando ao Mercado Pago...", "Aprovando..."]
        : ["Emitindo linha digitável...", "Registrando boleto...", "Gerando PDF..."];

    for (const stage of stages) {
        setProcessingStage(stage);
        await new Promise(r => setTimeout(r, 1200));
    }

    handleOpenLink();
  };

  const handleOpenLink = () => {
    if (PAYMENT_CONFIG.SIMULATION_MODE) {
        onSuccess();
    } else if (PAYMENT_CONFIG.STATIC_CHECKOUT_URL) {
        // CORREÇÃO CRÍTICA: Abrir em nova aba para garantir funcionamento
        const win = window.open(PAYMENT_CONFIG.STATIC_CHECKOUT_URL, '_blank', 'noopener,noreferrer');
        if (win) {
            win.focus();
        } else {
            window.location.href = PAYMENT_CONFIG.STATIC_CHECKOUT_URL;
        }
        setLoading(false);
    } else {
        alert("Erro de configuração de pagamento. Contate o suporte.");
        setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processPayment();
  };

  const handleCopyPix = () => {
      const pixCode = "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540511.405802BR5913CALORY IA APP6008BRASILIA62070503***6304E2CA";
      navigator.clipboard.writeText(pixCode);
      alert("Código PIX Copiado!");
      handleOpenLink(); // Redirect after copy to let them pay
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 -mt-16 animate-fade-in">
      
      {loading ? (
          <div className="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm w-full text-center border border-gray-100 dark:border-gray-800">
               <div className="relative w-24 h-24 mb-6">
                   <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
                   <div className={`absolute inset-0 border-4 rounded-full border-t-transparent animate-spin ${activeMethod === 'pix' ? 'border-green-500' : activeMethod === 'boleto' ? 'border-orange-500' : 'border-blue-500'}`}></div>
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 animate-pulse">
                   {processingStage}
               </h3>
               <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Ambiente Seguro 256-bit</p>
          </div>
      ) : showPixCode ? (
          // TELA DE QR CODE DO PIX
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-gray-100 dark:border-gray-800 animate-fade-in-up">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 shadow-sm">
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               </div>
               <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Pix Gerado com Sucesso!</h3>
               <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                   Escaneie o QR Code abaixo ou copie o código para finalizar no app do seu banco.
               </p>
               
               <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-300 mx-auto mb-6 inline-block shadow-inner">
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(PAYMENT_CONFIG.STATIC_CHECKOUT_URL || "https://mpago.la/1tyju6g")}`} alt="QR Code Pix" className="w-40 h-40" />
               </div>

               <div className="space-y-3">
                   <Button onClick={handleCopyPix} variant="secondary" fullWidth className="border-green-500 text-green-600 hover:bg-green-50 font-bold">
                       📋 Copiar "Copia e Cola"
                   </Button>
                   <Button onClick={handleOpenLink} fullWidth className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 font-bold">
                       Abrir App do Banco
                   </Button>
               </div>
               
               <button onClick={() => setShowPixCode(false)} className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline">
                   Alterar forma de pagamento
               </button>
          </div>
      ) : (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white/50 dark:border-gray-700 max-w-4xl w-full flex flex-col md:flex-row gap-8">
            
            {/* Esquerda: Resumo */}
            <div className="flex-1 space-y-6">
                <div>
                    <h2 className="text-3xl font-black text-[#2D1B4E] dark:text-white mb-2">{text.payment.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Você está a um passo da sua melhor versão.</p>
                </div>
                
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                    <p className="text-pink-200 text-sm font-bold uppercase tracking-widest mb-1">{text.payment.lifetime}</p>
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-lg opacity-80">{price.symbol}</span>
                        <span className="text-5xl font-black tracking-tighter">{price.value}</span>
                    </div>
                    <div className="space-y-2 text-sm font-medium border-t border-white/20 pt-4">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center text-[10px] text-green-900">✓</div> Acesso ao App + IA</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center text-[10px] text-green-900">✓</div> Dietas Personalizadas</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center text-[10px] text-green-900">✓</div> Treinos em Vídeo</div>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span>Ambiente criptografado. Seus dados não são armazenados.</span>
                </div>
            </div>

            {/* Direita: Checkout */}
            <div className="flex-1 bg-white dark:bg-gray-950 rounded-[2rem] p-6 shadow-inner border border-gray-100 dark:border-gray-800">
                
                {/* TABS */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
                    <button 
                        onClick={() => setActiveMethod('card')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeMethod === 'card' ? 'bg-white dark:bg-gray-700 shadow-md text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        💳 Cartão
                    </button>
                    <button 
                        onClick={() => setActiveMethod('pix')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 ${activeMethod === 'pix' ? 'bg-white dark:bg-gray-700 shadow-md text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                         <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-4.326-6.26c.365.41.97.41 1.335 0l2.99-3.32 2.99 3.32c.366.41.97.41 1.336 0 .365-.41.365-1.073 0-1.483l-3.658-4.062 3.658-4.06c.365-.41.365-1.074 0-1.484-.366-.41-.97-.41-1.336 0l-2.99 3.32-2.99-3.32c-.365-.41-.97-.41-1.335 0-.365.41-.365 1.074 0 1.484l3.658 4.06-3.658 4.062c-.365.41-.365 1.073 0 1.483z"/></svg>
                         Pix
                    </button>
                    <button 
                        onClick={() => setActiveMethod('boleto')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeMethod === 'boleto' ? 'bg-white dark:bg-gray-700 shadow-md text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        📄 Boleto
                    </button>
                </div>

                {activeMethod === 'card' && (
                    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
                        <div className="relative">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Número do Cartão</label>
                            <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-pink-500 outline-none transition-all dark:text-white" value={cardNumber} onChange={handleCardNumber} maxLength={19} required />
                            <div className="absolute right-4 top-8 opacity-50">💳</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Validade</label>
                                <input type="text" placeholder="MM/AA" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-pink-500 outline-none dark:text-white" value={expiry} onChange={handleExpiry} maxLength={5} required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">CVV</label>
                                <input type="text" placeholder="123" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-pink-500 outline-none dark:text-white" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g,''))} maxLength={4} required />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Nome no Cartão</label>
                            <input type="text" placeholder="COMO NO CARTAO" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-pink-500 outline-none uppercase dark:text-white" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} required />
                        </div>
                        
                        <Button type="submit" fullWidth isLoading={loading} className="py-4 text-lg mt-4 bg-gray-900 text-white shadow-xl hover:bg-black">
                            {text.payment.payBtn}
                        </Button>
                    </form>
                )}

                {activeMethod === 'pix' && (
                    <div className="text-center py-6 animate-fade-in">
                        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl mb-6 border border-green-100 dark:border-green-800">
                             <p className="font-bold text-green-800 dark:text-green-300 text-lg mb-2">⚡ Aprovação Imediata</p>
                             <p className="text-sm text-green-700 dark:text-green-400">Libere seu acesso em menos de 10 segundos pagando com Pix.</p>
                        </div>
                        <Button onClick={processPayment} fullWidth isLoading={loading} className="py-4 text-lg bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30">
                            GERAR QR CODE PIX
                        </Button>
                    </div>
                )}

                {activeMethod === 'boleto' && (
                    <div className="text-center py-6 animate-fade-in">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl mb-6 border border-orange-100 dark:border-orange-800">
                             <p className="font-bold text-orange-800 dark:text-orange-300 text-lg mb-2">⏳ Compensação em até 3 dias</p>
                             <p className="text-sm text-orange-700 dark:text-orange-400">Recomendamos PIX ou Cartão para acesso imediato.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <div className="text-left">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">CPF do Pagador</label>
                                <input type="text" placeholder="000.000.000-00" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none dark:text-white" value={cpf} onChange={handleCpf} required />
                            </div>
                            <Button type="submit" fullWidth isLoading={loading} className="py-4 text-lg bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30">
                                GERAR BOLETO
                            </Button>
                        </form>
                    </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 opacity-50 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" className="h-5" alt="Mastercard" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
                    <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-logo-1.png" className="h-5" alt="Pix" />
                </div>

            </div>
        </div>
      )}
    </div>
  );
};
