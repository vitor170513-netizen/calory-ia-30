
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { AuthGate } from './components/AuthGate';
import { Toast } from './components/Toast';
import { AppStep, AnalysisResult, Plan, UserProfile, LanguageCode, MeasurementEntry, WorkoutEntry } from './types';
import { analyzeImage, generatePlan, fileToGenerativePart } from './services/geminiService';
import { getText } from './utils/i18n';
import { secureLoad, secureSave, secureClear } from './utils/storage';
import { supabase, isSupabaseConfigured } from './utils/supabaseClient';
import { saveUserProfile, getUserProfile, savePlan, getActivePlan, saveMeasurement, saveWorkoutLog, getHistory } from './services/dbService';
import { getFriendlyErrorMessage } from './utils/errorMapper';
import { LegalModal } from './components/LegalModal';

// IMPORTS DIRETOS (SEM DUPLICIDADE)
import { UploadSection } from './components/UploadSection';
import { ResultView } from './components/ResultView';
import { PlanView } from './components/PlanView';
import { ProgressView } from './components/ProgressView';
import { OnboardingForm } from './components/OnboardingForm';
import { PaymentGate } from './components/PaymentGate';

const LOCAL_STORAGE_KEY = 'caloryia_local_cache';

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.Home);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentLang, setCurrentLang] = useState<LanguageCode>('pt');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutEntry[]>([]);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy' | null>(null);

  const text = getText(currentLang);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'info') => setToast({ msg, type });
  const openLegal = (type: 'terms' | 'privacy') => { setLegalType(type); setLegalModalOpen(true); };

  useEffect(() => {
    const init = async () => {
        if (isGuest || !isSupabaseConfigured()) {
            setCheckingSession(false);
            return;
        }
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            setSession(session);
            if (session) {
                setIsLoading(true);
                setLoadingMessage("Sincronizando...");
                const [profile, activePlan, history] = await Promise.all([
                    getUserProfile().catch(() => null),
                    getActivePlan().catch(() => null),
                    getHistory().catch(() => ({ measurements: [], workouts: [] }))
                ]);

                if (profile) {
                    const params = new URLSearchParams(window.location.search);
                    const paymentStatus = params.get('status') || params.get('collection_status');
                    if ((paymentStatus === 'approved' || paymentStatus === 'success') && !profile.hasPaid) {
                        profile.hasPaid = true;
                        await saveUserProfile(profile);
                        showToast("Pagamento Confirmado!", "success");
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                    setUserProfile(profile);
                    if (activePlan) { setPlan(activePlan); setStep(AppStep.Plan); }
                    else if (profile.hasPaid) { setStep(AppStep.Upload); }
                    else { setStep(AppStep.Payment); }
                } else {
                    setStep(AppStep.Onboarding);
                }
                if (history) {
                    setMeasurements(history.measurements);
                    setWorkoutLogs(history.workouts);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            setCheckingSession(false);
        }
    };
    init();
    if (isSupabaseConfigured()) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setSession(session);
            if(!session && !isGuest) {
                setStep(AppStep.Home);
                setUserProfile(null);
            }
        });
        return () => subscription.unsubscribe();
    }
  }, [isGuest]);

  useEffect(() => {
    secureSave(LOCAL_STORAGE_KEY, { step, userProfile, plan, measurements, workoutLogs });
  }, [step, userProfile, plan, measurements, workoutLogs]);

  const handleStart = () => {
    if (session || isGuest) {
        if (userProfile) {
            if (plan) setStep(AppStep.Plan);
            else if (userProfile.hasPaid) setStep(AppStep.Upload);
            else setStep(AppStep.Payment);
        } else setStep(AppStep.Onboarding);
    } else setStep(AppStep.Auth);
  };

  const handleAuthSuccess = () => {
      window.location.reload();
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.reload();
  }

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    if (session && !isGuest && isSupabaseConfigured()) {
        await saveUserProfile(profile).catch(console.error);
    }
    setStep(AppStep.Payment);
  };

  const handlePaymentSuccess = async () => {
    const updated = { ...userProfile!, hasPaid: true, paymentDate: new Date().toISOString() };
    setUserProfile(updated);
    if (session && !isGuest) await saveUserProfile(updated).catch(console.error);
    setStep(AppStep.Upload);
  };

  const handleImageSelected = async (file: File) => {
    setIsLoading(true);
    setLoadingMessage("Analisando...");
    try {
      const parts = await fileToGenerativePart(file);
      const result = await analyzeImage(parts.inlineData.data, file.type);
      setAnalysis(result);
      setStep(AppStep.Results);
    } catch (error) {
      showToast("Erro na análise.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!analysis || !userProfile) return;
    setIsLoading(true);
    setLoadingMessage("Criando plano...");
    try {
      const result = await generatePlan(analysis, userProfile);
      setPlan(result);
      if (session && !isGuest) await savePlan(result).catch(console.error);
      setStep(AppStep.Plan);
    } catch (error) {
      showToast("Erro ao gerar.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div></div>;

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-gray-900 dark:text-gray-50">
      <div className="fixed inset-0 -z-20 bg-[size:400%_400%] animate-flow bg-gradient-to-br from-pink-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"></div>
      <div className="absolute inset-0 bg-noise opacity-40 fixed -z-10"></div>
      
      <Header currentStep={step} setStep={setStep} lang={currentLang} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} userEmail={session?.user?.email} onLogout={handleLogout} />
      <LegalModal isOpen={legalModalOpen} onClose={() => setLegalModalOpen(false)} type={legalType} lang={currentLang} />

      <main className="relative flex-grow z-10 mb-10">
            {step === AppStep.Home && <Hero onStart={handleStart} lang={currentLang} />}
            {step === AppStep.Auth && <AuthGate onAuthSuccess={handleAuthSuccess} />}
            {step === AppStep.Onboarding && <OnboardingForm onComplete={handleOnboardingComplete} initialEmail={session?.user?.email} />}
            {step === AppStep.Payment && <div className="pt-32 pb-20"><PaymentGate onSuccess={handlePaymentSuccess} lang={currentLang} country={userProfile?.country} userProfile={userProfile} /></div>}
            {step === AppStep.Upload && <div className="pt-32 pb-20"><UploadSection onImageSelected={handleImageSelected} isLoading={isLoading} lang={currentLang} /></div>}
            {step === AppStep.Results && analysis && <ResultView analysis={analysis} onContinue={handleGeneratePlan} lang={currentLang} isDarkMode={isDarkMode} />}
            {step === AppStep.Plan && plan && userProfile && <PlanView plan={plan} userProfile={userProfile} lang={currentLang} onLogWeight={() => {}} onLogWorkout={() => {}} onUpdatePlan={() => {}} />}
            {step === AppStep.Progress && <ProgressView measurements={measurements} workoutLogs={workoutLogs} lang={currentLang} isDarkMode={isDarkMode} />}
        
        {isLoading && (
            <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pink-500 mb-4"></div>
                <h3 className="text-xl font-bold">{loadingMessage}</h3>
            </div>
        )}
      </main>

      <footer className="py-12 border-t border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-950/30 backdrop-blur-lg mt-auto text-center relative z-10">
         <div className="flex justify-center gap-6 mb-4 text-sm text-gray-500">
             <button onClick={() => openLegal('terms')}>Termos</button>
             <button onClick={() => openLegal('privacy')}>Privacidade</button>
         </div>
         <p className="text-xs text-gray-400">© 2024 CaloryIA.</p>
      </footer>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
