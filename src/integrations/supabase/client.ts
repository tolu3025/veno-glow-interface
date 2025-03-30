
// This file initializes the Supabase client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase connection constants
const SUPABASE_URL = "https://oavauprgngpftanumlzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdmF1cHJnbmdwZnRhbnVtbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NjAwNzcsImV4cCI6MjA1MDIzNjA3N30.KSCyROzMVdoW0_lrknnbx6TmabgZTEdsDNVZ67zuKyg";

// Create a standard client with minimal configuration
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Enable realtime subscriptions for essential tables
const enableRealtimeForTables = async () => {
  try {
    await supabase.channel('table-db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_tests' 
      }, () => {})
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'test_attempts' 
      }, () => {})
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_test_questions'
      }, () => {})
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'questions'
      }, () => {})
      .subscribe();
  } catch (error) {
    console.error('Failed to enable realtime subscriptions:', error);
  }
};

// Initialize realtime subscriptions
enableRealtimeForTables();
