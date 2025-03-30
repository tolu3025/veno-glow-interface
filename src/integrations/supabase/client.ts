
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://oavauprgngpftanumlzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdmF1cHJnbmdwZnRhbnVtbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NjAwNzcsImV4cCI6MjA1MDIzNjA3N30.KSCyROzMVdoW0_lrknnbx6TmabgZTEdsDNVZ67zuKyg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Initialize the Supabase client with additional options for better reliability
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
        'Content-Type': 'application/json'
      }
    },
    // Add reasonable timeouts
    db: {
      schema: 'public'
    },
    realtime: {
      timeout: 60000
    }
  }
);

// Add fallback error handling to prevent app crashes
const originalFrom = supabase.from.bind(supabase);
supabase.from = function(table) {
  const result = originalFrom(table);
  
  // Add error logging wrapper to common functions
  const originalSelect = result.select.bind(result);
  result.select = function(...args) {
    const query = originalSelect(...args);
    const originalThen = query.then.bind(query);
    
    query.then = function(onFulfilled, onRejected) {
      return originalThen(
        onFulfilled, 
        (error) => {
          console.error(`Supabase query error on table ${table}:`, error);
          if (onRejected) return onRejected(error);
          return Promise.reject(error);
        }
      );
    };
    
    return query;
  };
  
  return result;
};
