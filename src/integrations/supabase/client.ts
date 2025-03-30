
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase connection constants
const SUPABASE_URL = "https://oavauprgngpftanumlzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdmF1cHJnbmdwZnRhbnVtbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NjAwNzcsImV4cCI6MjA1MDIzNjA3N30.KSCyROzMVdoW0_lrknnbx6TmabgZTEdsDNVZ67zuKyg";

// Create a standard client with enhanced configuration
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-info': 'veno-app',
      }
    }
  }
);

// Enhanced connection testing function
export const testSupabaseConnection = async () => {
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .limit(1)
      .timeout(10000); // 10-second timeout

    const latency = Date.now() - start;

    if (error) {
      console.error('Supabase Connection Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return {
        success: false,
        error: error.message,
        latency
      };
    }

    console.log('Supabase Connection Successful', {
      latency: `${latency}ms`,
      dataReceived: data?.length || 0
    });

    return {
      success: true,
      latency,
      data: data || []
    };
  } catch (err) {
    console.error('Unexpected Supabase Connection Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      latency: 0
    };
  }
};

// Export the existing auth methods
export const { auth } = supabase;
