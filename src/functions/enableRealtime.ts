
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to enable realtime on a table if needed
 * This can be called from components that need realtime functionality
 */
export const enableRealtimeForTable = async (tableName: string) => {
  try {
    // Check if the table exists and has realtime enabled
    const { data, error } = await supabase.rpc('get_realtime_status', { table_name: tableName });
    
    if (error) {
      console.error(`Error checking realtime status for ${tableName}:`, error);
      return false;
    }
    
    // If realtime is not enabled, we need to enable it
    if (!data) {
      console.log(`Realtime not enabled for ${tableName}. This should be done via SQL.`);
      return false;
    }
    
    console.log(`Realtime is confirmed working for ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Error in enableRealtimeForTable for ${tableName}:`, error);
    return false;
  }
};

/**
 * This function checks if realtime is enabled for the tables we need
 */
export const checkRealtimeConfig = async () => {
  const tables = ['user_profiles', 'test_attempts'];
  
  for (const table of tables) {
    const isEnabled = await enableRealtimeForTable(table);
    if (!isEnabled) {
      console.warn(`Realtime not configured for ${table}`);
    } else {
      console.log(`Realtime confirmed working for ${table}`);
    }
  }
};
