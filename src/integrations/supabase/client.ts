
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
    },
    db: {
      schema: 'public'
    },
    // Add retries for network issues
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  }
);

// Enhanced connection testing function with retries
export const testSupabaseConnection = async (retries = 3, delayMs = 1000) => {
  let attemptCount = 0;
  
  while (attemptCount < retries) {
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .limit(1);

      const latency = Date.now() - start;

      if (error) {
        console.error(`Supabase Connection Error (attempt ${attemptCount + 1}/${retries}):`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // If not on final attempt, wait and retry
        if (attemptCount < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          attemptCount++;
          continue;
        }
        
        return {
          success: false,
          error: error.message,
          latency,
          attempts: attemptCount + 1
        };
      }

      console.log('Supabase Connection Successful', {
        latency: `${latency}ms`,
        dataReceived: data?.length || 0,
        attempts: attemptCount + 1
      });

      return {
        success: true,
        latency,
        data: data || [],
        attempts: attemptCount + 1
      };
    } catch (err) {
      console.error(`Unexpected Supabase Connection Error (attempt ${attemptCount + 1}/${retries}):`, err);
      
      // If not on final attempt, wait and retry
      if (attemptCount < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attemptCount++;
        continue;
      }
      
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        latency: 0,
        attempts: attemptCount + 1
      };
    }
  }
  
  // This shouldn't be reached due to the while loop, but TypeScript requires a return
  return {
    success: false,
    error: 'Maximum retry attempts exceeded',
    latency: 0,
    attempts: attemptCount
  };
};

// For backward compatibility - rename the function but keep the old name exported
export const testConnection = testSupabaseConnection;

// Export the existing auth methods
export const { auth } = supabase;
