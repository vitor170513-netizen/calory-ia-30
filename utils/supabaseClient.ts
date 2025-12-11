
import { createClient } from '@supabase/supabase-js';

// =================================================================================
// ⚙️ CONFIGURAÇÃO DO SUPABASE
// =================================================================================

// Credenciais fornecidas pelo usuário (com trim() para evitar erros de espaço/quebra de linha)
const supabaseUrl = 'https://vaxmictmnjgzpuourmso.supabase.co'.trim();
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheG1pY3RtbmpnenB1b3VybXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTY2MzUsImV4cCI6MjA4MDA3MjYzNX0.fpDXqJ6jvVrYP9iJMJRvMt8L-7i2HvDZImDCvIHCTj0'.trim();

const options = {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false // Alterado para false para evitar problemas de hidratação/hash em alguns navegadores
    }
};

// Verifica se as chaves existem para evitar erros de inicialização
export const isSupabaseConfigured = () => {
    return supabaseUrl.length > 0 && supabaseKey.length > 0 && (supabaseKey as string) !== 'placeholder';
};

// Cria o cliente. Se não houver chaves, cria um cliente "dummy" para não quebrar a UI antes do setup
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder', 
    options
);
