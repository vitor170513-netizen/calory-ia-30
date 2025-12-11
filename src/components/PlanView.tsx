
import React, { useState, useEffect, useRef } from 'react';
import { Plan, LanguageCode, UserProfile, Meal } from '../types';
import { getText } from '../utils/i18n';
import { generateExerciseVisual, regenerateMeal, regenerateWorkout, swapExercise, analyzeFoodImage, analyzeWorkoutVideo, fileToGenerativePart } from '../services/geminiService';
import { getExerciseVideoUrl } from '../utils/videoMapper';

interface PlanViewProps {
  plan: Plan;
  userProfile: UserProfile;
  lang?: LanguageCode;
  onLogWeight: (weight: number) => void;
  onLogWorkout: (dayNumber: number, duration: number, calories: number) => void;
  onUpdatePlan: (plan: Plan) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({ plan, userProfile, lang = 'pt' as LanguageCode, onLogWeight, onLogWorkout, onUpdatePlan }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [completedGoals, setCompletedGoals] = useState<Record<string, boolean>>({});
  const [isDayCompletedAnimation, setIsDayCompletedAnimation] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);
  const dailyWaterGoal = 3000;
  const [customGoal, setCustomGoal] = useState('');
  const [userGoals, setUserGoals] = useState<string[]>([]);
  const [expandedVisual, setExpandedVisual] = useState<string | null>(null);
  const [visualCache, setVisualCache] = useState<Record<string, string>>({});
  const [loadingVisual, setLoadingVisual] = useState<string | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});
  const [analyzingMealIndex, setAnalyzingMealIndex] = useState<number | null>(null);
  const [mealAnalysisResult, setMealAnalysisResult] = useState<{index: number, result: Meal} | null>(null);
  const fileInputRefMeal = useRef<HTMLInputElement>(null);
  const [analyzingVideo, setAnalyzingVideo] = useState(false);
  const [videoFeedback, setVideoFeedback] = useState<string | null>(null);
  const fileInputRefVideo = useRef<HTMLInputElement>(null);
  const text = getText(lang);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMealAnalysisResult(null);
    setVideoFeedback(null);
  }, [activeDayIndex]);

  const toggleComplete = (id: string) => {
    setCompleted(prev => ({...prev, [id]: !prev[id]}));
  };

  const toggleGoal = (goalIndex: number, isUserGoal: boolean) => {
      const key = `goal-${activeDayIndex}-${isUserGoal ? 'u' : 's'}-${goalIndex}`;
      setCompletedGoals(prev => ({...prev, [key]: !prev[key]}));
  };

  const handleAddWater = () => setWaterIntake(prev => prev + 250);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (customGoal.trim()) {
      setUserGoals(prev => [...prev, customGoal]);
      setCustomGoal('');
    }
  };

  const removeUserGoal = (idx: number) => setUserGoals(prev => prev.filter((_, i) => i !== idx));

  const toggleVisual = async (id: string, exerciseName: string) => {
    if (expandedVisual === id) {
      setExpandedVisual(null);
      return;
    }
    setExpandedVisual(id);
    if (!visualCache[id]) {
      setLoadingVisual(id);
      try {
        const imageUrl = await generateExerciseVisual(exerciseName);
        setVisualCache(prev => ({ ...prev, [id]: imageUrl }));
      } catch (error) {
        console.error("Failed to generate visual", error);
      } finally {
        setLoadingVisual(null);
      }
    }
  };

  const handleFinishDay = () => {
      setIsDayCompletedAnimation(true);
      onLogWorkout(day.day, day.durationMin, day.totalCalories);
      setTimeout(() => {
          setIsDayCompletedAnimation(false);
          if (activeDayIndex < plan.dailyPlans.length - 1) {
              setActiveDayIndex(prev => prev + 1);
          }
      }, 2000);
  };

  const handleSwapExercise = async (exerciseIndex: number) => {
      const id = `swap-ex-${activeDayIndex}-${exerciseIndex}`;
      setUpdatingItems(prev => ({...prev, [id]: true}));
      try {
          const day = plan.dailyPlans[activeDayIndex];
          const exercise = day.exercises[exerciseIndex];
          const newExercise = await swapExercise(exercise, userProfile, day.workoutFocus);
          const newPlan = JSON.parse(JSON.stringify(plan));
          newPlan.dailyPlans[activeDayIndex].exercises[exerciseIndex] = newExercise;
          onUpdatePlan(newPlan);
          const visualKey = `d${day.day}-ex${exerciseIndex}`;
          if (visualCache[visualKey]) {
             const newCache = {...visualCache};
             delete newCache[visualKey];
             setVisualCache(newCache);
          }
      } catch (error) {
          alert("Erro ao trocar exercício.");
      } finally {
          setUpdatingItems(prev => ({...prev, [id]: false}));
      }
  };

  const handleRegenerateMeal = async (mealIndex: number) => {
      const id = `regen-meal-${activeDayIndex}-${mealIndex}`;
      setUpdatingItems(prev => ({...prev, [id]: true}));
      try {
          const day = plan.dailyPlans[activeDayIndex];
          const meal = day.meals[mealIndex];
          const newMeal = await regenerateMeal(meal, userProfile);
           const newPlan = JSON.parse(JSON.stringify(plan));
           newPlan.dailyPlans[activeDayIndex].meals[mealIndex] = newMeal;
           onUpdatePlan(newPlan);
      } catch (error) {
          alert("Erro ao atualizar refeição.");
      } finally {
          setUpdatingItems(prev => ({...prev, [id]: false}));
      }
  };

  const handleRegenerateWorkout = async () => {
      const id = `regen-workout-${activeDayIndex}`;
      setUpdatingItems(prev => ({...prev, [id]: true}));
      try {
          const day = plan.dailyPlans[activeDayIndex];
          const result = await regenerateWorkout(day.day, day.workoutFocus, userProfile);
           const newPlan = JSON.parse(JSON.stringify(plan));
           newPlan.dailyPlans[activeDayIndex].exercises = result.exercises;
           newPlan.dailyPlans[activeDayIndex].totalCalories = result.totalCalories;
           newPlan.dailyPlans[activeDayIndex].workoutFocus = result.workoutFocus;
           onUpdatePlan(newPlan);
           setVisualCache(prev => {
               const newCache = {...prev};
               day.exercises.forEach((_, i) => delete newCache[`d${day.day}-ex${i}`]);
               return newCache;
           });
      } catch (error) {
          alert("Erro ao atualizar treino.");
      } finally {
          setUpdatingItems(prev => ({...prev, [id]: false}));
      }
  };

  const triggerMealUpload = (index: number) => {
      setAnalyzingMealIndex(index);
      fileInputRefMeal.current?.click();
  };

  const handleMealPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || analyzingMealIndex === null) return;
      const id = `meal-photo-${analyzingMealIndex}`;
      setUpdatingItems(prev => ({...prev, [id]: true}));
      try {
          const parts = await fileToGenerativePart(file);
          const result = await analyzeFoodImage(parts.inlineData.data, file.type);
          setMealAnalysisResult({ index: analyzingMealIndex, result });
      } catch (error) {
          alert("Erro na análise da foto.");
      } finally {
          setUpdatingItems(prev => ({...prev, [id]: false}));
          e.target.value = '';
      }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
        alert("Vídeo muito grande (Max 20MB).");
        e.target.value = '';
        return;
    }
    setAnalyzingVideo(true);
    setVideoFeedback(null);
    try {
        const parts = await fileToGenerativePart(file);
        const feedback = await analyzeWorkoutVideo(parts.inlineData.data, file.type, day.workoutFocus);
        setVideoFeedback(feedback);
    } catch (error) {
        alert("Erro na análise do vídeo.");
    } finally {
        setAnalyzingVideo(false);
        e.target.value = '';
    }
  };

  const day = plan.dailyPlans[activeDayIndex] || plan.dailyPlans[0];
  const currentWeekNum = Math.ceil(day.day / 7);
  const waterPercent = Math.min((waterIntake / dailyWaterGoal) * 100, 100);
  const shoppingListItems = Array.from(new Set(day.meals.flatMap(m => m.items)));
  const hasNext = activeDayIndex < plan.dailyPlans.length - 1;
  const hasPrev = activeDayIndex > 0;

  if (!day) return <div className="p-20 text-center animate-pulse text-gray-500 font-medium">Carregando dados do plano...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-40 animate-fade-in relative">
      <input type="file" ref={fileInputRefMeal} onChange={handleMealPhotoUpload} accept="image/*" className="hidden" />
      <input type="file" ref={fileInputRefVideo} onChange={handleVideoUpload} accept="video/*" className="hidden" />

      {isDayCompletedAnimation && (
          <div className="fixed inset-0 z-[200] bg-green-900/90 backdrop-blur-xl flex items-center justify-center animate-fade-in">
              <div className="text-center text-white p-10 rounded-3xl bg-white/10 border border-white/20 shadow-2xl">
                  <div className="text-8xl mb-4 animate-bounce">🏆</div>
                  <h2 className="text-5xl font-black mb-2">{text.plan.dayCompleted}</h2>
                  <p className="text-xl opacity-90">Você é imparável.</p>
              </div>
          </div>
      )}

      {showShoppingList && (
          <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up border border-gray-100 dark:border-gray-800">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">🛒 {text.plan.shoppingList}</h3>
                    <button onClick={() => setShowShoppingList(false)} className="bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm hover:scale-105">✕</button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <ul className="space-y-3">
                        {shoppingListItems.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <input type="checkbox" className="w-5 h-5 rounded-md text-pink-500 focus:ring-pink-500 border-gray-300" />
                                <span className="text-gray-700 dark:text-gray-200 font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
             </div>
          </div>
      )}

      <div className="flex items-center justify-between mb-10">
         <button onClick={() => setActiveDayIndex(prev => prev - 1)} disabled={!hasPrev} className={`p-4 rounded-full border transition-all ${!hasPrev ? 'opacity-0' : 'bg-white dark:bg-gray-800 border-gray-200 shadow-sm'}`}>
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
         </button>
         <div className="text-center">
             <h2 className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest mb-2 bg-pink-50 dark:bg-pink-900/20 px-3 py-1 rounded-full">{currentWeekNum}ª {text.plan.week}</h2>
             <h1 className="text-6xl font-black text-gray-900 dark:text-white flex items-baseline gap-2 justify-center">
                 <span className="text-2xl text-gray-400 dark:text-gray-500 uppercase">{text.plan.day}</span>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">{day.day}</span>
             </h1>
         </div>
         <button onClick={() => setActiveDayIndex(prev => prev + 1)} disabled={!hasNext} className={`p-4 rounded-full border transition-all ${!hasNext ? 'opacity-20 cursor-not-allowed' : 'bg-white dark:bg-gray-800 border-gray-200 shadow-sm'}`}>
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="glass-panel p-6 rounded-[2rem]">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4">🎯 {text.plan.goalsTitle}</h3>
            <ul className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {(plan.goals || []).map((g, i) => {
                    const key = `goal-${activeDayIndex}-s-${i}`;
                    const isChecked = completedGoals[key];
                    return (
                        <li key={key} className={`flex items-center gap-3 bg-white/50 dark:bg-gray-700/60 p-3 rounded-xl border transition-all cursor-pointer ${isChecked ? 'border-green-300 opacity-60' : 'border-gray-100 hover:scale-[1.02]'}`} onClick={() => toggleGoal(i, false)}>
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                                {isChecked && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-sm font-bold ${isChecked ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{g}</span>
                        </li>
                    )
                })}
                {userGoals.map((g, i) => {
                    const key = `goal-${activeDayIndex}-u-${i}`;
                    const isChecked = completedGoals[key];
                    return (
                        <li key={key} className={`flex items-center gap-3 bg-white/50 dark:bg-gray-700/60 p-3 rounded-xl border transition-all cursor-pointer ${isChecked ? 'border-green-300 opacity-60' : 'border-gray-100 hover:scale-[1.02]'}`} onClick={() => toggleGoal(i, true)}>
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                                {isChecked && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`text-sm font-bold ${isChecked ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{g}</span>
                            <button onClick={(e) => { e.stopPropagation(); removeUserGoal(i); }} className="ml-auto text-gray-400 hover:text-red-500">×</button>
                        </li>
                    )
                })}
            </ul>
            <form onSubmit={handleAddGoal} className="relative">
                <input type="text" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} placeholder={text.plan.addGoal} className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 dark:text-white" />
                <button type="submit" className="absolute right-2 top-2 text-pink-500 hover:bg-pink-50 p-1 rounded-lg">➕</button>
            </form>
        </div>

        <div className="bg-blue-500 dark:bg-blue-600 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl">
            <div className="absolute bottom-0 left-0 right-0 bg-blue-400 transition-all duration-700" style={{height: `${waterPercent}%`, opacity: 0.5}}></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between">
                    <h3 className="text-lg font-black flex items-center gap-2">💧 {text.plan.waterTitle}</h3>
                    <div className="text-3xl font-black">{Math.round(waterPercent)}%</div>
                </div>
                <div className="text-center my-4 text-4xl font-black">{waterIntake}<span className="text-base font-bold opacity-70">ml</span></div>
                <button onClick={handleAddWater} className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl shadow-lg hover:bg-blue-50 transition-all">{text.plan.addWater}</button>
            </div>
        </div>
      </div>

      <div className="bg-gray-900 dark:bg-black rounded-[2.5rem] p-10 text-white shadow-2xl mb-12 relative overflow-hidden">
           <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
               <div className="flex gap-2">
                    <span className="px-4 py-1.5 rounded-full bg-white/10 text-xs font-bold uppercase">{day.workoutFocus}</span>
                    <span className="px-4 py-1.5 rounded-full bg-white/10 text-xs font-bold uppercase">{day.durationMin} MIN</span>
               </div>
               <button onClick={handleRegenerateWorkout} disabled={updatingItems[`regen-workout-${activeDayIndex}`]} className="text-xs font-bold uppercase hover:text-pink-400 transition-colors flex items-center gap-1">
                   {updatingItems[`regen-workout-${activeDayIndex}`] ? '↻' : text.plan.regenerate}
               </button>
           </div>
           <h2 className="text-4xl md:text-5xl font-black leading-tight mb-8 relative z-10">{text.plan.section_workout}</h2>
      </div>

      <div className="space-y-12">
          <section>
              <div className="mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-3xl">
                   <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">📹</div>
                       <div className="flex-grow">
                           <h4 className="font-bold text-gray-900 dark:text-white mb-1">{text.plan.video_upload_title}</h4>
                           <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{text.plan.video_upload_hint}</p>
                           <button onClick={() => fileInputRefVideo.current?.click()} disabled={analyzingVideo} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
                               {analyzingVideo ? text.plan.analyzing_video : text.plan.video_upload_btn}
                           </button>
                           {videoFeedback && (
                               <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 text-sm whitespace-pre-line text-gray-800 dark:text-gray-200">
                                   <strong>{text.plan.video_feedback_title}:</strong><br/>{videoFeedback}
                               </div>
                           )}
                       </div>
                   </div>
              </div>

              <div className="space-y-5">
                {day.exercises.map((ex, i) => {
                    const id = `d${day.day}-ex${i}`;
                    const isExpanded = expandedVisual === id;
                    const isChecked = !!completed[id];
                    return (
                        <div key={i} className={`glass-panel rounded-3xl overflow-hidden transition-all duration-500 ${isChecked ? 'opacity-60 grayscale' : 'hover:shadow-xl'}`}>
                            <div className="p-6 md:p-8 flex items-start gap-6">
                                <div onClick={() => toggleComplete(id)} className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>✓</div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`text-xl font-bold text-gray-900 dark:text-white ${isChecked ? 'line-through' : ''}`}>{ex.name}</h4>
                                        <button onClick={() => handleSwapExercise(i)} className="text-gray-400 hover:text-pink-500">↻</button>
                                    </div>
                                    <div className="flex gap-3 mb-4">
                                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-gray-600">{ex.sets} Sets</span>
                                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-gray-600">{ex.reps} Reps</span>
                                    </div>
                                    {ex.notes && <div className="bg-blue-50 p-3 rounded-xl mb-4 text-sm text-blue-800 italic">{ex.notes}</div>}
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => toggleVisual(id, ex.name)} className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${isExpanded ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'}`}>👁️ {text.plan.visual_label}</button>
                                        <a href={getExerciseVideoUrl(ex.name)} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2">▶️ YouTube</a>
                                    </div>
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="border-t border-gray-200 bg-gray-50 p-6">
                                    {loadingVisual === id ? <div className="text-center py-10 animate-pulse">{text.plan.visual_loading}</div> : 
                                     visualCache[id] ? <img src={visualCache[id]} alt={ex.name} className="w-full rounded-xl shadow-lg" /> : 
                                     <div className="text-center py-10">{text.plan.visual_unavailable}</div>}
                                </div>
                            )}
                        </div>
                    );
                })}
              </div>
          </section>

          <section>
              <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">🥗 {text.plan.section_meals}</h3>
                  <button onClick={() => setShowShoppingList(true)} className="text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl">🛒 Lista</button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                  {day.meals.map((meal, i) => {
                      const hasResult = mealAnalysisResult?.index === i;
                      const displayMeal = hasResult ? mealAnalysisResult.result : meal;
                      return (
                        <div key={i} className={`glass-panel rounded-3xl p-8 relative ${hasResult ? 'ring-2 ring-green-400' : ''}`}>
                             <div className="flex justify-between items-start mb-4">
                                <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{displayMeal.name}</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => triggerMealUpload(i)} className="text-xs font-bold uppercase text-gray-500 hover:text-blue-600 border border-gray-300 rounded-lg px-2 py-1">📷 {text.plan.analyze_meal}</button>
                                    <button onClick={() => handleRegenerateMeal(i)} className="text-xs font-bold uppercase text-gray-500 hover:text-green-600 border border-gray-300 rounded-lg px-2 py-1">↻ {text.plan.new_meal_option}</button>
                                </div>
                             </div>
                             <ul className="space-y-3 mb-6">
                                 {displayMeal.items.map((item, idx) => <li key={idx} className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{item}</li>)}
                             </ul>
                             <div className="flex gap-4 border-t border-gray-200 pt-4 text-gray-900 dark:text-white">
                                 <div><span className="text-[10px] uppercase text-gray-400 block">Kcal</span><span className="font-bold">{displayMeal.calories}</span></div>
                                 <div><span className="text-[10px] uppercase text-gray-400 block">Prot</span><span className="font-bold">{displayMeal.protein}g</span></div>
                                 <div><span className="text-[10px] uppercase text-gray-400 block">Carb</span><span className="font-bold">{displayMeal.carbs}g</span></div>
                             </div>
                        </div>
                      );
                  })}
              </div>
          </section>
          
          <div className="pt-8 pb-12">
              <button onClick={handleFinishDay} className="w-full py-6 rounded-3xl bg-green-600 text-white font-black text-2xl shadow-xl hover:scale-[1.02] transition-all">
                  {text.plan.finishDay}
              </button>
          </div>
      </div>
    </div>
  );
};
