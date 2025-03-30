
// This file initializes the Supabase client with optimal configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase connection constants
const SUPABASE_URL = "https://oavauprgngpftanumlzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdmF1cHJnbmdwZnRhbnVtbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NjAwNzcsImV4cCI6MjA1MDIzNjA3N30.KSCyROzMVdoW0_lrknnbx6TmabgZTEdsDNVZ67zuKyg";

// Define types for connection testing
export interface ConnectionTestResult {
  connected: boolean;
  latency: number;
  error?: any;
}

// Create a standard client
const client = createClient<Database>(
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
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      timeout: 60000
    }
  }
);

// Export the client with our custom methods
export const supabase = Object.assign(client, {
  // Add a connection test method to check if Supabase is reachable
  testConnection: async function(): Promise<ConnectionTestResult> {
    try {
      const startTime = Date.now();
      const response = await client.from('questions').select('count', { count: 'exact', head: true });
      const endTime = Date.now();
      
      const connectionInfo = {
        connected: !response.error,
        latency: endTime - startTime,
        error: response.error
      };
      
      console.log('Supabase connection test:', connectionInfo);
      return connectionInfo;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return { connected: false, latency: -1, error };
    }
  }
});

// Enable realtime subscriptions for tables we'll use
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

// Call the function to enable realtime
enableRealtimeForTables();

// Test connection on load
setTimeout(() => {
  supabase.testConnection();
}, 1000);
