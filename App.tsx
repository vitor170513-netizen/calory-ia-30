
import React, { useState, useEffect, Suspense } from 'react';
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

// Lazy Load Heavy Components
const UploadSection = React.lazy(() => import('./components/UploadSection').then(module => ({ default: module.UploadSection })));
const ResultView = React.lazy(() => import('./components/ResultView').then(module => ({ default: module.ResultView })));
const PlanView = React.lazy(() => import('./components/PlanView').then(module => ({ default: module.PlanView })));
const ProgressView = React.lazy(() => import('./components/ProgressView').then(module => ({ default: module.ProgressView })));
const OnboardingForm = React.lazy(() => import('./components/OnboardingForm').then(module => ({ default: module.OnboardingForm })));
const PaymentGate = React.lazy(() => import('./components/PaymentGate').then(module => ({ default: module.PaymentGate })));

const LOCAL_STORAGE_KEY = 'caloryia_local_cache';

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.Home);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Default language setting - FORCE PT
  const [currentLang, setCurrentLang] = useState<LanguageCode>('pt');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Data States
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutEntry[]>([]);

  // Legal Modal State
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy' | null>(null);

  const text = getText(currentLang);

  // Apply Theme Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Helper for Toast
  const showToast = (msg: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ msg, type });
  };

  const openLegal = (type: 'terms' | 'privacy') => {
      setLegalType(type);
      setLegalModalOpen(true);
  };

  // 1. AUTH & INITIAL DATA LOAD
  useEffect(() => {
    const init = async () => {
        // If explicitly set to guest, skip db checks
        if (isGuest) {
            setCheckingSession(false);
            return;
        }

        // If keys are missing, stop checking and let UI decide (AuthGate will show)
        if (!isSupabaseConfigured()) {
            setCheckingSession(false);
            return;
        }

        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            setSession(session);
            
            if (session) {
                // User Logged In: Fetch Data from DB
                // This is the CRITICAL STEP for update safety.
                // We always pull fresh from DB to override any potentially broken local cache.
                setIsLoading(true);
                setLoadingMessage("Sincronizando dados...");
                
                const [profile, activePlan, history] = await Promise.all([
                    getUserProfile().catch(() => null),
                    getActivePlan().catch(() => null),
                    getHistory().catch(() => ({ measurements: [], workouts: [] }))
                ]);

                if (profile) {
                    // --- AUTO-DETECT PAYMENT SUCCESS FROM URL ---
                    const params = new URLSearchParams(window.location.search);
                    const paymentStatus = params.get('status') || params.get('collection_status');
                    
                    if ((paymentStatus === 'approved' || paymentStatus === 'success') && !profile.hasPaid) {
                        console.log("Pagamento detectado via URL!");
                        profile.hasPaid = true;
                        profile.paymentDate = new Date().toISOString();
                        await saveUserProfile(profile);
                        showToast("Pagamento Confirmado! Acesso Liberado.", "success");
                        // Clean URL to prevent re-triggering
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                    // ---------------------------------------------

                    setUserProfile(profile);
                    setCurrentLang('pt'); // Force PT
                    
                    // Logic to determine where to go
                    if (activePlan) {
                        setPlan(activePlan);
                        setStep(AppStep.Plan);
                    } else if (profile.hasPaid) {
                        setStep(AppStep.Upload);
                    } else {
                        setStep(AppStep.Payment);
                    }
                } else {
                    // No profile yet? Go to Onboarding
                    setStep(AppStep.Onboarding);
                }

                if (history) {
                    setMeasurements(history.measurements);
                    setWorkoutLogs(history.workouts);
                }
            }
        } catch (e) {
            console.error("Data sync error or no session:", e);
            // Even if error, we stop checking so UI renders
        } finally {
            setIsLoading(false);
            setCheckingSession(false);
        }
    };

    init();

    // Listen for auth changes
    if (isSupabaseConfigured()) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            // If logged out
            if(!session && !isGuest) {
                setStep(AppStep.Home);
                setUserProfile(null);
                setPlan(null);
                setAnalysis(null);
            }
        });
        return () => subscription.unsubscribe();
    }
  }, [isGuest]);

  // 2. LOCAL STORAGE BACKUP (Always active for reliability/Guest Mode)
  useEffect(() => {
    secureSave(LOCAL_STORAGE_KEY, { step, userProfile, plan, measurements, workoutLogs });
  }, [step, userProfile, plan, measurements, workoutLogs]);


  // Flow Handlers
  const handleStart = () => {
    if (session || isGuest) {
        // Already logged in or guest
        if (userProfile) {
            if (plan) setStep(AppStep.Plan);
            else if (userProfile.hasPaid) setStep(AppStep.Upload);
            else setStep(AppStep.Payment);
        }
        else setStep(AppStep.Onboarding);
    } else {
        setStep(AppStep.Auth);
    }
  };

  const handleAuthSuccess = async (guestMode = false) => {
      if (guestMode) {
          setIsGuest(true);
          setSession({ user: { email: 'convidado@calory.ia' } }); 
          
          // Try to restore guest data from local storage
          const localData = secureLoad<any>(LOCAL_STORAGE_KEY);
          if (localData) {
              if (localData.userProfile) setUserProfile(localData.userProfile);
              if (localData.plan) setPlan(localData.plan);
              if (localData.measurements) setMeasurements(localData.measurements);
              if (localData.workoutLogs) setWorkoutLogs(localData.workoutLogs);
              
              // Decide step
              if (localData.plan) setStep(AppStep.Plan);
              else if (localData.userProfile) {
                  if (localData.userProfile.hasPaid) setStep(AppStep.Upload);
                  else setStep(AppStep.Payment);
              } else {
                  setStep(AppStep.Onboarding);
              }
          } else {
              setStep(AppStep.Onboarding);
          }
          
          setCheckingSession(false);
      } else {
          // Regular Supabase Login
          setIsLoading(true);
          setLoadingMessage("Iniciando sessão...");
          try {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            
            // FORCE FETCH FROM DB ON LOGIN
            const profile = await getUserProfile();
            const activePlan = await getActivePlan();
            
            if (profile) {
                setUserProfile(profile);
                if (activePlan) {
                    setPlan(activePlan);
                    setStep(AppStep.Plan);
                } else if (profile.hasPaid) {
                    setStep(AppStep.Upload);
                } else {
                    setStep(AppStep.Payment);
                }
            } else {
                setStep(AppStep.Onboarding);
            }
          } catch (e) {
             console.error("Login redirect error:", e);
             setStep(AppStep.Onboarding); // Fallback safest
          } finally {
            setIsLoading(false);
            setCheckingSession(false);
          }
      }
  };

  const handleLogout = async () => {
      if (session && !isGuest && isSupabaseConfigured()) {
          await supabase.auth.signOut();
      }
      
      // Reset State
      setIsGuest(false);
      setSession(null);
      setUserProfile(null);
      setPlan(null);
      setAnalysis(null);
      setMeasurements([]);
      setWorkoutLogs([]);
      secureClear(LOCAL_STORAGE_KEY);
      
      setStep(AppStep.Home);
  }

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentLang('pt');
    
    // SAFETY WRAPPER: Try to save to DB, but don't block progress if it fails
    // This fixes the "Button doesn't work" issue if DB is unreachable
    try {
        if (session && !isGuest && isSupabaseConfigured()) {
            await saveUserProfile(profile);
            await saveMeasurement({ date: new Date().toISOString(), weight: profile.weight });
        }
    } catch (error) {
        // FIXED: Use getFriendlyErrorMessage to show real error instead of [object Object]
        const errMsg = getFriendlyErrorMessage(error);
        console.error("Warning: Failed to save onboarding data to cloud. Proceeding locally.", errMsg);
        if (errMsg.includes('relation') || errMsg.includes('exist')) {
             console.warn("DICA: Parece que você não rodou o código SQL no Supabase. Vá no README.md e siga a seção 'Configuração do Supabase'.");
        }
    }
    
    setMeasurements([{
      date: new Date().toISOString(),
      weight: profile.weight
    }]);

    // Force Step Change
    setStep(AppStep.Payment);
  };

  const handlePaymentSuccess = async () => {
    // 1. Update Profile State
    const updatedProfile = { 
        ...userProfile!, 
        hasPaid: true, 
        paymentDate: new Date().toISOString() 
    };
    setUserProfile(updatedProfile);

    // 2. Persist
    if (session && !isGuest && isSupabaseConfigured()) {
        try {
            await saveUserProfile(updatedProfile);
        } catch (e) {
            console.error("Failed to save payment status to DB", e);
        }
    } else {
        const currentData = secureLoad<any>(LOCAL_STORAGE_KEY) || {};
        secureSave(LOCAL_STORAGE_KEY, { ...currentData, userProfile: updatedProfile });
    }

    setStep(AppStep.Upload);
    showToast("Pagamento Aprovado!", 'success');
  };

  const simulateLoadingSteps = (messages: string[]) => {
    let i = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) {
        setLoadingMessage(messages[i]);
      } else {
        clearInterval(interval);
      }
    }, 2500);
    return interval;
  };

  const handleImageSelected = async (file: File) => {
    setIsLoading(true);
    const msgs = ["Criptografando...", "Analisando biometria...", "Detectando somatotipo..."];
    const interval = simulateLoadingSteps(msgs);

    try {
      const base64 = await fileToGenerativePart(file);
      const result = await analyzeImage(base64, file.type, 'pt');
      setAnalysis(result);
      setStep(AppStep.Results);
    } catch (error) {
      console.error(error);
      showToast("Falha na análise.", 'error');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!analysis || !userProfile) return;
    
    setIsLoading(true);
    const msgs = ["Calculando macros...", "Consultando culinária local...", "Gerando plano de 50 dias..."];
    const interval = simulateLoadingSteps(msgs);

    try {
      const generatedPlan = await generatePlan(analysis, userProfile);
      setPlan(generatedPlan);
      
      if (session && !isGuest && isSupabaseConfigured()) {
          await savePlan(generatedPlan);
      }

      setStep(AppStep.Plan);
    } catch (error) {
      console.error(error);
      showToast("Erro ao gerar plano.", 'error');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleLogWeight = async (weight: number) => {
    const entry = { date: new Date().toISOString(), weight };
    setMeasurements(prev => [...prev, entry]);
    
    if (session && !isGuest && isSupabaseConfigured()) {
        await saveMeasurement(entry);
    }
    showToast("Peso salvo!", 'success');
  };

  const handleLogWorkout = async (dayNumber: number, duration: number, calories: number) => {
    const entry = {
      date: new Date().toISOString(),
      dayNumber,
      durationMinutes: duration,
      caloriesBurned: calories
    };
    setWorkoutLogs(prev => [...prev, entry]);
    
    if (session && !isGuest && isSupabaseConfigured()) {
        await saveWorkoutLog(entry);
    }
    showToast("Treino salvo!", 'success');
  };

  const handleUpdatePlan = async (newPlan: Plan) => {
      setPlan(newPlan);
      if (session && !isGuest && isSupabaseConfigured()) {
          await savePlan(newPlan);
      }
  };

  if (checkingSession) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-pink-500"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div></div>;
  }

  // Loading Fallback Component
  const PageLoader = () => (
    <div className="pt-32 pb-20 flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-x-hidden text-gray-900 dark:text-gray-50 transition-colors duration-300">
      
      <div className="fixed inset-0 -z-20 bg-[size:400%_400%] animate-flow bg-gradient-to-br from-pink-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-500"></div>
      <div className="absolute inset-0 bg-noise opacity-40 fixed -z-10"></div>

      <Header 
        currentStep={step} 
        setStep={setStep} 
        lang={currentLang} 
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        userEmail={session?.user?.email}
        // @ts-ignore
        onLogout={handleLogout}
      />

      <LegalModal 
        isOpen={legalModalOpen} 
        onClose={() => setLegalModalOpen(false)} 
        type={legalType} 
        lang={currentLang} 
      />

      <main className="relative flex-grow z-10 mb-10">
        <Suspense fallback={<PageLoader />}>
            {step === AppStep.Home && (
            <Hero onStart={handleStart} lang={currentLang} />
            )}

            {step === AppStep.Auth && (
                <AuthGate onAuthSuccess={handleAuthSuccess} />
            )}

            {step === AppStep.Onboarding && (
            <OnboardingForm onComplete={handleOnboardingComplete} initialEmail={session?.user?.email} />
            )}

            {step === AppStep.Payment && (
            <div className="pt-32 pb-20">
                <PaymentGate onSuccess={handlePaymentSuccess} lang={currentLang} country={userProfile?.country} userProfile={userProfile} />
            </div>
            )}

            {step === AppStep.Upload && (
            <div className="pt-32 pb-20">
                <UploadSection onImageSelected={handleImageSelected} isLoading={isLoading} lang={currentLang} />
            </div>
            )}

            {step === AppStep.Results && analysis && (
            <ResultView analysis={analysis} onContinue={handleGeneratePlan} lang={currentLang} isDarkMode={isDarkMode} />
            )}

            {step === AppStep.Plan && plan && userProfile && (
                <PlanView 
                plan={plan} 
                userProfile={userProfile}
                lang={currentLang} 
                onLogWeight={handleLogWeight}
                onLogWorkout={handleLogWorkout}
                onUpdatePlan={handleUpdatePlan}
                />
            )}
            
            {step === AppStep.Progress && (
                <ProgressView 
                measurements={measurements} 
                workoutLogs={workoutLogs} 
                lang={currentLang} 
                isDarkMode={isDarkMode}
                />
            )}
        </Suspense>
        
        {isLoading && (
            <div className="fixed inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl z-[100] flex flex-col items-center justify-center px-4 text-center animate-fade-in">
                <div className="relative w-40 h-40 mb-8">
                    <div className="absolute inset-0 bg-pink-400/20 rounded-full blur-2xl animate-pulse-slow"></div>
                    <div className="absolute inset-0 border-2 border-white/50 dark:border-gray-700/50 rounded-full"></div>
                    <div className="absolute inset-0 border-t-2 border-pink-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner">
                        <span className="text-5xl animate-bounce">☁️</span>
                    </div>
                </div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-3 tracking-tight">
                   {loadingMessage}
                </h3>
            </div>
        )}
      </main>

      {/* PRO FOOTER */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-950/30 backdrop-blur-lg relative z-10 mt-auto transition-colors">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Logo Area */}
            <div className="flex flex-col items-center md:items-start">
               <span className="font-bold text-lg tracking-tight text-[#2D1B4E] dark:text-white flex items-center gap-1 mb-2">
                   Calory<span className="text-pink-500">IA</span>
               </span>
               <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs text-center md:text-left">
                  {text.footer.rights} © {new Date().getFullYear()} CaloryIA Corp.
               </p>
            </div>

            {/* Links Area */}
            <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
               <button onClick={() => openLegal('terms')} className="hover:text-pink-500 transition-colors">{text.footer.terms}</button>
               <button onClick={() => openLegal('privacy')} className="hover:text-pink-500 transition-colors">{text.footer.privacy}</button>
               <button onClick={() => alert("suporte@calory.ia")} className="hover:text-pink-500 transition-colors">{text.footer.contact}</button>
            </div>

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 backdrop-blur-md rounded-full border shadow-sm cursor-help ${isGuest || !isSupabaseConfigured() ? 'bg-orange-50/50 border-orange-200 text-orange-800 dark:text-orange-300' : 'bg-green-50/50 border-green-200 text-green-800 dark:text-green-300'}`}>
               <div className={`w-2 h-2 rounded-full ${isGuest || !isSupabaseConfigured() ? 'bg-orange-500' : 'bg-green-500 animate-pulse'}`}></div>
               <span className="text-[10px] font-bold uppercase tracking-wider">
                   {isGuest || !isSupabaseConfigured() ? text.security.status_guest : text.security.status_cloud}
               </span>
            </div>
        </div>
      </footer>

      {toast && (
        <Toast 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
