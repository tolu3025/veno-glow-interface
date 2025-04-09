
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase connection constants
const SUPABASE_URL = "https://oavauprgngpftanumlzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdmF1cHJnbmdwZnRhbnVtbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NjAwNzcsImV4cCI6MjA1MDIzNjA3N30.KSCyROzMVdoW0_lrknnbx6TmabgZTEdsDNVZ67zuKyg";

// Maximum number of retries for operations
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

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

// Function to update the database schema (check and add necessary columns)
export const updateDatabaseSchema = async () => {
  if (!isOnline()) return { success: false, message: "Device is offline" };
  
  try {
    // Check if user_tests table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .rpc('check_if_table_exists', { table_name: 'user_tests' });
    
    if (tableCheckError) {
      console.error("Error checking table:", tableCheckError);
      return { success: false, error: tableCheckError };
    }
    
    if (tableExists) {
      // Instead of using add_column_if_not_exists, use a raw SQL query
      // with proper error handling for column existence
      const { error: alterTableError } = await supabase
        .from('user_tests')
        .select('is_draft')
        .limit(1)
        .catch(async (err) => {
          // If the column doesn't exist (indicated by error), try to add it
          if (err.message && err.message.includes('column "is_draft" does not exist')) {
            const { error } = await supabase.rpc('execute_sql', {
              sql_query: 'ALTER TABLE public.user_tests ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false'
            }).catch(e => ({ error: e }));
            return { error };
          }
          return { error: err };
        });
      
      // Check for draft_data column similarly
      const { error: draft_dataError } = await supabase
        .from('user_tests')
        .select('draft_data')
        .limit(1)
        .catch(async (err) => {
          // If the column doesn't exist, try to add it
          if (err.message && err.message.includes('column "draft_data" does not exist')) {
            const { error } = await supabase.rpc('execute_sql', {
              sql_query: 'ALTER TABLE public.user_tests ADD COLUMN IF NOT EXISTS draft_data JSONB DEFAULT NULL'
            }).catch(e => ({ error: e }));
            return { error };
          }
          return { error: err };
        });
      
      if (alterTableError || draft_dataError) {
        console.error("Error updating schema:", alterTableError || draft_dataError);
        return { success: false, error: alterTableError || draft_dataError };
      }
      
      return { success: true };
    }
    
    return { success: false, message: "Table not found" };
  } catch (error) {
    console.error("Error updating schema:", error);
    return { success: false, error };
  }
};

// Create a function to check if we're online
export const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Enhanced connection testing function with retries
export const testSupabaseConnection = async (retries = 3, delayMs = 1000) => {
  let attemptCount = 0;
  
  while (attemptCount < retries) {
    try {
      if (!isOnline()) {
        console.log('Device is offline, skipping connection test');
        return {
          success: false,
          error: 'Device is offline',
          latency: 0,
          attempts: attemptCount + 1
        };
      }

      const start = Date.now();
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .limit(1)
        .maybeSingle();

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
          await new Promise(resolve => setTimeout(resolve, delayMs * (attemptCount + 1))); // Exponential backoff
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
        dataReceived: data ? 1 : 0,
        attempts: attemptCount + 1
      });

      return {
        success: true,
        latency,
        data: data || null,
        attempts: attemptCount + 1
      };
    } catch (err) {
      console.error(`Unexpected Supabase Connection Error (attempt ${attemptCount + 1}/${retries}):`, err);
      
      // If not on final attempt, wait and retry
      if (attemptCount < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attemptCount + 1))); // Exponential backoff
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

// Create a wrapper function for retryable operations
export const retryOperation = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = MAX_RETRIES, 
  initialBackoff: number = INITIAL_BACKOFF_MS
): Promise<T> => {
  let retries = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (!isOnline()) {
        console.error('Connection retry failed: Device is offline');
        throw new Error('No internet connection');
      }
      
      if (retries >= maxRetries) {
        console.error(`Operation failed after ${maxRetries} retries:`, error);
        throw error;
      }
      
      const backoff = initialBackoff * Math.pow(2, retries);
      console.log(`Operation failed, retrying in ${backoff}ms...`, { retries: retries + 1, maxRetries });
      
      await new Promise(resolve => setTimeout(resolve, backoff));
      retries++;
    }
  }
};

// Enhanced query function with retry and offline detection
export const querySafe = async <T>(
  queryFn: () => Promise<{ data: T | null, error: any }>,
  fallbackData: T | null = null
): Promise<{ data: T | null, error: any, offline: boolean }> => {
  if (!isOnline()) {
    return { data: fallbackData, error: new Error('Device is offline'), offline: true };
  }
  
  try {
    const result = await retryOperation(queryFn);
    return { ...result, offline: false };
  } catch (error) {
    return { data: fallbackData, error, offline: !isOnline() };
  }
};

// For backward compatibility - rename the function but keep the old name exported
export const testConnection = testSupabaseConnection;

// Export the existing auth methods
export const { auth } = supabase;
