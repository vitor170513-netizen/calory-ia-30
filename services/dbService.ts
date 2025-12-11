
import { supabase } from '../utils/supabaseClient';
import { UserProfile, Plan, MeasurementEntry, WorkoutEntry } from '../types';

/**
 * Database Service
 * Handles saving/loading data from Supabase (Cloud) tables.
 * Includes "Schema Migration Protection" to ensure app updates don't break old accounts.
 */

// --- Default Structures for Merging (Safety Net) ---
const DEFAULT_PROFILE: Partial<UserProfile> = {
    hasPaid: false,
    paymentDate: '',
    country: 'Brasil',
    language: 'pt',
    medicalConditions: '',
    dietaryRestrictions: '',
    activityLevel: 'moderate'
};

// --- Profile ---

export const saveUserProfile = async (profile: UserProfile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    const { error } = await supabase
        .from('profiles')
        .upsert({ 
            id: user.id, 
            updated_at: new Date(), 
            data: profile 
        });

    if (error) throw error;
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('data')
        .eq('id', user.id)
        .single();

    if (error) return null;
    
    if (data?.data) {
        // CRITICAL: Merge DB data with Defaults.
        // This prevents the app from breaking if you add new fields in an update.
        // Old data (like payment status) is preserved. New fields get default values.
        return { ...DEFAULT_PROFILE, ...data.data } as UserProfile;
    }
    
    return null;
};

// --- Plan ---

export const savePlan = async (plan: Plan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    // Archive old plans (optional: set active=false for others)
    await supabase
        .from('plans')
        .update({ active: false })
        .eq('user_id', user.id);

    const { error } = await supabase
        .from('plans')
        .insert({
            user_id: user.id,
            active: true,
            data: plan
        });

    if (error) throw error;
};

export const getActivePlan = async (): Promise<Plan | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('plans')
        .select('data')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) return null;
    return data?.data as Plan;
};

// --- History (Measurements & Workouts) ---

export const saveMeasurement = async (entry: MeasurementEntry) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('history').insert({
        user_id: user.id,
        type: 'measurement',
        date: entry.date,
        data: entry
    });
};

export const saveWorkoutLog = async (entry: WorkoutEntry) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('history').insert({
        user_id: user.id,
        type: 'workout',
        date: entry.date,
        data: entry
    });
};

export const getHistory = async (): Promise<{ measurements: MeasurementEntry[], workouts: WorkoutEntry[] }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { measurements: [], workouts: [] };

    const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', user.id);

    if (error || !data) return { measurements: [], workouts: [] };

    const measurements = data.filter(d => d.type === 'measurement').map(d => d.data as MeasurementEntry);
    const workouts = data.filter(d => d.type === 'workout').map(d => d.data as WorkoutEntry);

    return { measurements, workouts };
};
