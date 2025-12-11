import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AnalysisResult,
  Plan,
  BodyType,
  UserProfile,
  Exercise,
  Meal,
} from "../types";

// ============================================================================
// 🔑 1. API KEYS
// ============================================================================
const EXTRA_KEYS = [
  "AIzaSyCayP_58kporXgSNCIrbH5BzHu5kXdKfpw",
  "AQ.Ab8RN6LOeorMJMHauwVh4WkOeBrE-lQi_H3laMuchajQ7Zu83A",
];

const getApiKey = () => {
  // Node / Vercel
  // @ts-ignore
  if (typeof process !== "undefined" && process.env && process.env.API_KEY) {
    // @ts-ignore
    return process.env.API_KEY;
  }

  // Vite / Browser
  // @ts-ignore
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_KEY
  ) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }

  return "";
};

const ALL_KEYS = [getApiKey(), ...EXTRA_KEYS].filter(
  (k) => k && k.length > 5
);

const getRandomClient = () => {
  if (ALL_KEYS.length === 0)
    throw new Error("Nenhuma API KEY configurada.");
  const random = ALL_KEYS[Math.floor(Math.random() * ALL_KEYS.length)];
  return new GoogleGenerativeAI(random);
};

// ============================================================================
// 🔁 Retry automático
// ============================================================================
async function callGeminiWithRetry<T>(
  operation: (ai: GoogleGenerativeAI) => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      const ai = getRandomClient();
      return await operation(ai);
    } catch (err: any) {
      lastError = err;
      console.warn("Tentativa falhou →", err?.message);

      if (
        err?.message?.includes("429") ||
        err?.message?.includes("503") ||
        err?.status === 429 ||
        err?.status === 503
      ) {
        await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

// ============================================================================
// 🔧 Helper — File → base64 inlineData
// ============================================================================
export const fileToGenerativePart = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve({
        inlineData: { data: base64, mimeType: file.type },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// 🧠 2. Análise de Imagem
// ============================================================================
export const analyzeImage = async (
  base64Data: string,
  mimeType: string,
  lang: string = "pt"
): Promise<AnalysisResult> => {
  return callGeminiWithRetry(async (ai) => {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

  const response = await model.generateContent({
  contents: [
    {
      role: "user",
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Analyze this body and return clean JSON." }
      ]
    }
  ]
});

    const clean = response.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    return JSON.parse(clean);
  });
};

// ============================================================================
// 📝 3. Geração de Plano
// ============================================================================
export const generatePlan = async (
  analysis: AnalysisResult,
  user: UserProfile
): Promise<Plan> => {
  const birthYear = parseInt(user.birthDate.split("/")[2] || "1990");
  const age = new Date().getFullYear() - birthYear;

  // BMR
  const bmr =
    user.gender === "male"
      ? 88.362 +
        13.397 * user.weight +
        4.799 * user.height -
        5.677 * age
      : 447.593 +
        9.247 * user.weight +
        3.098 * user.height -
        4.33 * age;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };

  const tdee = Math.round(bmr * (multipliers[user.activityLevel] || 1.2));
  const targetCalories =
    analysis.estimatedBodyFat > 20 ? tdee - 500 : tdee + 300;

  const prompt = `
Você é um treinador profissional.
Objetivo diário: ${targetCalories} calorias.
Gênero: ${user.gender}, Peso: ${user.weight}, Altura: ${user.height}.
Idade: ${age}.
Local: ${user.state}, ${user.country}.
Restrições: ${user.dietaryRestrictions || "Nenhuma"}.
Retorne somente JSON válido seguindo o tipo "Plan".`;

  return callGeminiWithRetry(async (ai) => {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const clean = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    return JSON.parse(clean);
  });
};

// ============================================================================
// 💬 4. Chat
// ============================================================================
export const sendChatMessage = async (
  history: { role: string; content: string }[],
  newMessage: string
) => {
  return callGeminiWithRetry(async (ai) => {
    const chat = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result = await chat.generateContent({
      contents: [
        ...history.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: newMessage }] },
      ],
    });

    return result.response.text() || "Sem resposta.";
  });
};

// ============================================================================
// 🔄 5. Troca de Exercício
// ============================================================================
export const swapExercise = async (
  currentExercise: Exercise,
  profile: UserProfile,
  focus: string
): Promise<Exercise> => {
  const prompt = `
Troque o exercício: ${currentExercise.name}
Nível: ${profile.activityLevel}
Retorne apenas JSON seguindo o tipo Exercise.`;

  return callGeminiWithRetry(async (ai) => {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const response = await model.generateContent(prompt);

    const clean = response.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    return JSON.parse(clean);
  });
};

// ============================================================================
// 🖼️ 6. Visual de Exercício (placeholder)
// ============================================================================
export const generateExerciseVisual = async (exerciseName: string) => {
  return `https://source.unsplash.com/800x600/?gym,${encodeURIComponent(
    exerciseName
  )}`;
};

// ============================================================================
// 🍽️ 7. Regerar Refeição
// ============================================================================
export const regenerateMeal = async (
  currentMeal: Meal,
  profile: UserProfile
): Promise<Meal> => {
  const prompt = `
Substitua a refeição: ${currentMeal.name}
Mantenha calorias semelhantes.
Retorne apenas JSON (tipo Meal).`;

  return callGeminiWithRetry(async (ai) => {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const clean = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    return JSON.parse(clean);
  });
};

// ============================================================================
// 💪 8. Regerar Todo o Treino
// ============================================================================
export const regenerateWorkout = async (
  currentExercises: Exercise[],
  profile: UserProfile,
  focus: string
): Promise<Exercise[]> => {
  const prompt = `
Gere um treino COMPLETO NOVO.
Foco: ${focus}.
Nível: ${profile.activityLevel}.
Retorne SOMENTE JSON no formato:
[
  { "name": "...", "sets": 0, "reps": "10-12", "notes": "" }
]`;

  return callGeminiWithRetry(async (ai) => {
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const clean = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    return JSON.parse(clean);
  });
};
