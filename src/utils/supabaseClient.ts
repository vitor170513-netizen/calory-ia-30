
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vaxmictmnjgzpuourmso.supabase.co'.trim();
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheG1pY3RtbmpnenB1b3VybXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTY2MzUsImV4cCI6MjA4MDA3MjYzNX0.fpDXqJ6jvVrYP9iJMJRvMt8L-7i2HvDZImDCvIHCTj0'.trim();

const options = {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    }
};

export const isSupabaseConfigured = () => {
    return supabaseUrl.length > 0 && supabaseKey.length > 0 && (supabaseKey as string) !== 'placeholder';
};

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder', 
    options
);
