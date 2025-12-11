import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Plan, BodyType, UserProfile, Exercise, Meal } from "../types";

// =========================================================================================
// 🚀 CONFIGURAÇÃO DE API
// =========================================================================================
const EXTRA_KEYS = [
    "AIzaSyCayP_58kporXgSNCIrbH5BzHu5kXdKfpw",
    "AQ.Ab8RN6LOeorMJMHauwVh4WkOeBrE-lQi_H3laMuchajQ7Zu83A"
];

const getApiKey = () => {
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    // @ts-ignore
    return process.env.API_KEY;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  return "";
};

const ALL_KEYS = [getApiKey(), ...EXTRA_KEYS].filter(k => k && k.length > 5);

const getRandomClient = () => {
    if (ALL_KEYS.length === 0) throw new Error("Nenhuma API Key configurada.");
    const randomKey = ALL_KEYS[Math.floor(Math.random() * ALL_KEYS.length)];
    return new GoogleGenAI({ apiKey: randomKey });
};

// Retry Wrapper
async function callGeminiWithRetry<T>(operation: (ai: GoogleGenAI) => Promise<T>, retries = 3): Promise<T> {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const ai = getRandomClient();
            return await operation(ai);
        } catch (error: any) {
            lastError = error;
            console.warn(`Tentativa ${i + 1} falhou.`, error.message);
            // Erros de cota (429) ou serviço indisponível (503)
            if (error.message?.includes('429') || error.message?.includes('503') || error.status === 429 || error.status === 503) {
                await new Promise(r => setTimeout(r, 1500 * (i + 1))); 
                continue; 
            }
            throw error;
        }
    }
    throw lastError;
}

// Helper para converter arquivo em Base64 puro
export const fileToGenerativePart = async (file: File): Promise<{inlineData: {data: string, mimeType: string}}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- SCHEMAS DEFINITIONS ---

const analysisResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bodyType: { type: Type.STRING, enum: [BodyType.Ectomorph, BodyType.Mesomorph, BodyType.Endomorph, BodyType.Unknown] },
    estimatedBodyFat: { type: Type.NUMBER },
    postureNotes: { type: Type.STRING },
    focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendationSummary: { type: Type.STRING }
  },
  required: ["bodyType", "estimatedBodyFat", "recommendationSummary"]
};

// --- 1. IMAGE ANALYSIS ---
export const analyzeImage = async (base64Data: string, mimeType: string, lang: string = 'pt'): Promise<AnalysisResult> => {
  return callGeminiWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Analyze this body for fitness planning. Return JSON." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisResponseSchema
        }
      });

      if (!response.text) throw new Error("Falha na análise da imagem");
      return JSON.parse(response.text) as AnalysisResult;
  });
};

// --- 2. PLAN GENERATION ---
export const generatePlan = async (analysis: AnalysisResult, userProfile: UserProfile): Promise<Plan> => {
  const birthYear = parseInt(userProfile.birthDate.split('/')[2] || "1990");
  const age = new Date().getFullYear() - birthYear;
  
  let bmr = 0;
  if (userProfile.gender === 'male') {
      bmr = 88.362 + (13.397 * userProfile.weight) + (4.799 * userProfile.height) - (5.677 * age);
  } else {
      bmr = 447.593 + (9.247 * userProfile.weight) + (3.098 * userProfile.height) - (4.330 * age);
  }
  const multipliers: Record<string, number> = { 'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55, 'active': 1.725, 'athlete': 1.9 };
  const tdee = Math.round(bmr * (multipliers[userProfile.activityLevel] || 1.2));
  const isCutting = analysis.estimatedBodyFat > 20;
  const targetCalories = isCutting ? tdee - 500 : tdee + 300;

  const prompt = `
    You are an elite fitness coach AI. Create a detailed plan.
    User: ${userProfile.gender}, ${userProfile.weight}kg, ${userProfile.height}cm, Age ${age}.
    Goal: ${targetCalories} kcal/day.
    Restrictions: ${userProfile.dietaryRestrictions || "None"}.
    Injuries: ${userProfile.medicalConditions || "None"}.
    Location: ${userProfile.state}, ${userProfile.country}.
    
    Output JSON format matching the 'Plan' interface structure exactly.
    Ensure at least 7 daily plans.
  `;

  const planResponseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      goal: { type: Type.STRING },
      goals: { type: Type.ARRAY, items: { type: Type.STRING } },
      durationDays: { type: Type.NUMBER },
      summary: { type: Type.STRING },
      dailyPlans: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.NUMBER },
            workoutFocus: { type: Type.STRING },
            durationMin: { type: Type.NUMBER },
            totalCalories: { type: Type.NUMBER },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sets: { type: Type.NUMBER },
                  reps: { type: Type.STRING },
                  notes: { type: Type.STRING, nullable: true },
                }
              }
            },
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
              }
            }
          }
        }
      }
    }
  };

  return callGeminiWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: planResponseSchema
        }
      });

      if (!response.text) throw new Error("Falha ao gerar plano");
      // Pequeno ajuste para garantir que o parse funcione mesmo se o modelo incluir markdown
      const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText) as Plan;
  });
};

// --- 3. CHAT ---
export const sendChatMessage = async (history: {role: string, content: string}[], newMessage: string): Promise<string> => {
    return callGeminiWithRetry(async (ai) => {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.content }]
            }))
        });
        
        const result = await chat.sendMessage(newMessage);
        return result.text || "Sem resposta.";
    });
};

// --- 4. EXERCISE SWAP ---
export const swapExercise = async (currentExercise: Exercise, profile: UserProfile, focus: string): Promise<Exercise> => {
    const prompt = `Substitute: ${currentExercise.name}. Profile: ${profile.activityLevel}. JSON output.`;
    return callGeminiWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text!) as Exercise;
    });
};

// --- 5. VISUAL GENERATION (TEXT ONLY FALLBACK) ---
export const generateExerciseVisual = async (exerciseName: string): Promise<string> => {
    // Fallback to Unsplash as generative image needs specific model/cost handling
    return `https://source.unsplash.com/800x600/?gym,${encodeURIComponent(exerciseName)}`;
};

// --- 6. MEAL REGENERATION ---
export const regenerateMeal = async (currentMeal: Meal, profile: UserProfile): Promise<Meal> => {
    const prompt = `New meal replacing ${currentMeal.name}. Same cals. JSON output.`;
    return callGeminiWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text!) as Meal;
    });
};

// --- 7. WORKOUT REGENERATION ---
export const regenerateWorkout = async (day: number, currentFocus: string, profile: UserProfile): Promise<{exercises: Exercise[], totalCalories: number, workoutFocus: string}> => {
    const prompt = `New workout for day ${day}. JSON output: {exercises, totalCalories, workoutFocus}`;
    return callGeminiWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text!);
    });
};

// --- 8. FOOD ANALYSIS ---
export const analyzeFoodImage = async (base64: string, mimeType: string): Promise<Meal> => {
    return callGeminiWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Analyze food macros. JSON: {name, calories, protein, carbs, fats, items[]}" }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text!) as Meal;
    });
};

// --- 9. VIDEO ANALYSIS ---
export const analyzeWorkoutVideo = async (base64: string, mimeType: string, exerciseName: string): Promise<string> => {
     return callGeminiWithRetry(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: `Analyze form for ${exerciseName}. Brief tips.` }
                ]
            }
        });
        return response.text || "Análise indisponível.";
    });
};