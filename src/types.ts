export enum BodyType {
  Ectomorph = 'Ectomorph',
  Mesomorph = 'Mesomorph',
  Endomorph = 'Endomorph',
  Unknown = 'Unknown'
}

export interface Meal {
  name: string;
  items: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
}

export interface DailyPlan {
  day: number;
  workoutFocus: string;
  durationMin: number;
  exercises: Exercise[];
  meals: Meal[];
  totalCalories: number;
}

export interface WeeklySummary {
  week: number;
  summary: string;
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface Plan {
  id: string;
  goal: string;
  goals: string[];
  durationDays: number;
  summary: string;
  weeklySummaries?: WeeklySummary[];
  dailyPlans: DailyPlan[];
  searchSources?: SearchSource[];
}

export interface AnalysisResult {
  bodyType: BodyType;
  estimatedBodyFat: number;
  postureNotes: string;
  focusAreas: string[];
  recommendationSummary: string;
}

export type LanguageCode = 'pt';

export interface UserProfile {
  name: string;
  email: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  medicalConditions: string; 
  dietaryRestrictions: string;
  country: string; 
  state: string; 
  language: LanguageCode;
  hasPaid?: boolean;
  paymentDate?: string;
}

export interface MeasurementEntry {
  date: string;
  weight: number;
}

export interface WorkoutEntry {
  date: string;
  dayNumber: number;
  caloriesBurned: number;
  durationMinutes: number;
}

export enum AppStep {
  Home = 'HOME',
  Auth = 'AUTH',
  Onboarding = 'ONBOARDING',
  Payment = 'PAYMENT',
  Upload = 'UPLOAD',
  Analyzing = 'ANALYZING',
  Results = 'RESULTS',
  Plan = 'PLAN',
  Progress = 'PROGRESS'
}