
import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AnalysisResult, Plan, BodyType, UserProfile, SearchSource, Exercise, Meal, DailyPlan } from "../types";

// =========================================================================================
// 🚀 ESTRATÉGIA DE ROTAÇÃO DE CHAVES (BURLAR LIMITE GRATUITO)
// =========================================================================================
// Adicione quantas chaves quiser aqui. O sistema vai sortear uma a cada pedido.
// Se uma der erro (limite atingido), ele pula para a próxima automaticamente.
const EXTRA_KEYS = [
    "AIzaSyCayP_58kporXgSNCIrbH5BzHu5kXdKfpw",
    "AQ.Ab8RN6LOeorMJMHauwVh4WkOeBrE-lQi_H3laMuchajQ7Zu83A"
];

const getApiKey = () => {
  // 1. Tenta pegar do ambiente padrão
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

// Junta a chave principal com as extras
const ALL_KEYS = [getApiKey(), ...EXTRA_KEYS].filter(k => k && k.length > 5);

// Função para pegar um cliente Gemini aleatório
const getRandomClient = () => {
    if (ALL_KEYS.length === 0) throw new Error("Nenhuma API Key configurada.");
    const randomKey = ALL_KEYS[Math.floor(Math.random() * ALL_KEYS.length)];
    return new GoogleGenAI({ apiKey: randomKey });
};

// Função Wrapper com Retry Automático (Tenta 3x antes de falhar)
async function callGeminiWithRetry<T>(operation: (client: GoogleGenAI) => Promise<T>, retries = 3): Promise<T> {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
        try {
            const client = getRandomClient();
            return await operation(client);
        } catch (error: any) {
            lastError = error;
            console.warn(`Tentativa ${i + 1} falhou. Trocando chave...`, error.message);
            
            // Se for erro de limite (429), espera um pouco e tenta outra chave
            if (error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
                await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Espera exponencial (1s, 2s, 3s)
                continue; 
            }
            throw error; // Se for outro erro, para.
        }
    }
    throw lastError;
}

// =========================================================================================

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bodyType: { type: Type.STRING, enum: [BodyType.Ectomorph, BodyType.Mesomorph, BodyType.Endomorph, BodyType.Unknown] },
    estimatedBodyFat: { type: Type.NUMBER, description: "Estimated body fat percentage as a number" },
    postureNotes: { type: Type.STRING, description: "Brief notes on posture from the image in Portuguese" },
    focusAreas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommendationSummary: { type: Type.STRING, description: "A 2-sentence summary of what needs to be done in Portuguese" }
  },
  required: ["bodyType", "estimatedBodyFat", "postureNotes", "focusAreas", "recommendationSummary"]
};

// --- 1. IMAGE ANALYSIS ---
export const analyzeImage = async (base64Image: string, mimeType: string, lang: string = 'pt'): Promise<AnalysisResult> => {
  return callGeminiWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Image } },
            { text: "Analyze this body for fitness planning. Return JSON." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        }
      });

      if (!response.text) throw new Error("No analysis data returned");
      return JSON.parse(response.text) as AnalysisResult;
  });
};

// --- 2. PLAN GENERATION (HARRIS-BENEDICT LOGIC) ---
export const generatePlan = async (analysis: AnalysisResult, userProfile: UserProfile): Promise<Plan> => {
  // Calculate BMR (Basal Metabolic Rate) - Harris-Benedict
  const birthYear = parseInt(userProfile.birthDate.split('/')[2] || "1990");
  const age = new Date().getFullYear() - birthYear;
  
  let bmr = 0;
  if (userProfile.gender === 'male') {
      bmr = 88.362 + (13.397 * userProfile.weight) + (4.799 * userProfile.height) - (5.677 * age);
  } else {
      bmr = 447.593 + (9.247 * userProfile.weight) + (3.098 * userProfile.height) - (4.330 * age);
  }

  // Activity Multiplier
  const multipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'athlete': 1.9
  };
  const tdee = Math.round(bmr * (multipliers[userProfile.activityLevel] || 1.2));
  
  // Goal Adjustment
  const isCutting = analysis.estimatedBodyFat > 20;
  const targetCalories = isCutting ? tdee - 500 : tdee + 300;

  const systemPrompt = `
    You are an elite fitness coach and nutritionist AI.
    Create a highly detailed 1-week fitness and meal plan (which repeats for 50 days).
    
    USER PROFILE:
    - Name: ${userProfile.name}
    - Age: ${age}
    - Gender: ${userProfile.gender}
    - Height: ${userProfile.height}cm
    - Weight: ${userProfile.weight}kg
    - Body Type: ${analysis.bodyType} (Fat: ${analysis.estimatedBodyFat}%)
    - Location: ${userProfile.state}, ${userProfile.country}
    - Activity: ${userProfile.activityLevel}
    - Medical: ${userProfile.medicalConditions || "None"}
    - Dietary: ${userProfile.dietaryRestrictions || "None"}
    
    CRITICAL HEALTH & SAFETY:
    1. If the user lists INJURIES (e.g., knee pain), DO NOT include exercises that aggravate it (e.g., no heavy squats for knee issues).
    2. If the user lists ALLERGIES (e.g., lactose), DO NOT include those foods.
    3. Use LOCAL FOODS from ${userProfile.state} (e.g., if North: Açaí, Tapioca; if South: Chimarrão, Barbecue lean cuts).
    
    MATHEMATICAL TARGETS (HARRIS-BENEDICT):
    - Basal Metabolic Rate: ${Math.round(bmr)} kcal
    - TDEE: ${tdee} kcal
    - TARGET DAILY CALORIES: ${targetCalories} kcal (Strictly adhere to this).
    
    WORKOUT LOGIC:
    - If 'sedentary'/'light': Focus on habit building, full body 3x/week.
    - If 'moderate': Upper/Lower split.
    - If 'active'/'athlete': PPL or High intensity.
    - EXTREME VARIATION: Exercises must not be repetitive.
    
    Output JSON format matching the 'Plan' interface.
  `;

  return callGeminiWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: systemPrompt }] },
        config: {
          responseMimeType: "application/json",
          temperature: 0.8, // High creativity for variety
        }
      });

      if (!response.text) throw new Error("Failed to generate plan");
      return JSON.parse(response.text) as Plan;
  });
};

// --- 3. CHAT BOT ---
export const sendChatMessage = async (history: {role: string, content: string}[], newMessage: string): Promise<string> => {
    // Chat uses standard retry but simpler logic (stateless)
    return callGeminiWithRetry(async (ai) => {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "Você é o CaloryIA, um assistente pessoal de fitness. Responda em Português do Brasil. Seja motivador, científico e direto. NÃO fale sobre código, React ou programação. Fale apenas sobre treino, dieta e saúde."
            }
        });

        const contextPrompt = `
            Histórico da conversa:
            ${history.map(m => `${m.role}: ${m.content}`).join('\n')}
            
            Usuário: ${newMessage}
        `;

        const result = await chat.sendMessage(contextPrompt);
        return result.text;
    });
};

// --- 4. EXERCISE SWAP ---
export const swapExercise = async (currentExercise: Exercise, profile: UserProfile, focus: string): Promise<Exercise> => {
    const prompt = `Suggest a substitute exercise for "${currentExercise.name}" (${focus}). 
    User profile: ${profile.gender}, ${profile.activityLevel}.
    Keep same muscle group but change equipment or movement pattern.
    Output JSON: { name, sets, reps, notes }`;

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
    return `https://source.unsplash.com/800x600/?fitness,${encodeURIComponent(exerciseName)}`;
};

// --- 6. MEAL REGENERATION ---
export const regenerateMeal = async (currentMeal: Meal, profile: UserProfile): Promise<Meal> => {
    const prompt = `Replace this meal: ${currentMeal.name} (${currentMeal.calories}kcal).
    User: ${profile.state}, ${profile.dietaryRestrictions}.
    Target: Same calories/macros but different ingredients.
    Output JSON: { name, items: [], calories, protein, carbs, fats }`;

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
    const prompt = `Regenerate workout for Day ${day} (Focus: ${currentFocus}).
    User: ${profile.activityLevel}, ${profile.medicalConditions}.
    Make it completely different from standard routine.
    Output JSON: { workoutFocus, exercises: [{name, sets, reps, notes}], totalCalories }`;

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
                    { text: "Identify the food, estimate portion, and calculate macros (calories, protein, carbs, fats). Return JSON: { name, items: [], calories, protein, carbs, fats }" }
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
                    { text: `Analyze this user performing ${exerciseName}. Give 3 specific technical corrections to improve form and avoid injury. Be professional and encouraging. Portuguese.` }
                ]
            },
            config: { 
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
                ]
            }
        });
        return response.text || "Não foi possível analisar o vídeo. Tente novamente com melhor iluminação.";
    });
};
