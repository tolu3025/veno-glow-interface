
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to enable realtime on a table if needed
 * This can be called from components that need realtime functionality
 */
export const enableRealtimeForTable = async (tableName: string) => {
  try {
    const { data, error } = await supabase.rpc('get_realtime_status', { table_name: tableName });
    
    if (error) {
      console.error(`Error checking realtime status for ${tableName}:`, error);
      return false;
    }
    
    // If realtime is not enabled, we need to enable it
    if (!data) {
      // This would typically be done via SQL, but for client-side we can just inform the user
      console.log(`Realtime not enabled for ${tableName}. This should be done via SQL.`);
      return false;
    }
    
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
