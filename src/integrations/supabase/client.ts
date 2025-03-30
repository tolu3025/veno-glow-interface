
// This file initializes the Supabase client
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
      fetch: customFetch,
      headers: {
        'x-client-info': 'veno-app',
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      timeout: 30000, // increase timeout to 30 seconds
    }
  }
);

// Custom fetch implementation with timeout and retry logic
async function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
  
  const fetchWithRetry = async (retries: number): Promise<Response> => {
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        keepalive: true, // Keep connection alive for improved reliability
        cache: 'no-cache', // Avoid stale cache issues
      });
      
      if (!response.ok && retries > 0 && response.status >= 500) {
        // Only retry server errors (5xx)
        console.log(`Retrying fetch, ${retries} attempts left. Status: ${response.status}`);
        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second between retries
        return fetchWithRetry(retries - 1);
      }
      
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Fetch request timed out');
      }
      
      if (retries > 0 && error.name !== 'AbortError') {
        console.log(`Retrying fetch after error, ${retries} attempts left. Error: ${error.message}`);
        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second between retries
        return fetchWithRetry(retries - 1);
      }
      
      throw error;
    }
  };

  try {
    const response = await fetchWithRetry(2); // Up to 3 attempts (initial + 2 retries)
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test database connection and report status
export const testConnection = async (): Promise<boolean> => {
  try {
    const start = Date.now();
    const { error } = await supabase.from('questions').select('count').limit(1);
    const latency = Date.now() - start;
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log(`Database connection successful. Latency: ${latency}ms`);
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
};

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

// Export specifically typed versions of the client for different purposes
export const auth = supabase.auth;
