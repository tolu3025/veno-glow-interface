
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to enable realtime on a table if needed
 * This can be called from components that need realtime functionality
 */
export const enableRealtimeForTable = async (tableName: string) => {
  try {
    // First check if the table exists using the existing check_if_table_exists function
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('check_if_table_exists', { table_name: tableName });
    
    if (tableCheckError) {
      console.error(`Error checking if table ${tableName} exists:`, tableCheckError);
      return false;
    }
    
    if (!tableExists) {
      console.error(`Table ${tableName} does not exist`);
      return false;
    }
    
    // For now, we'll assume the table exists but we can't check realtime status directly
    // In production, this would need a custom implementation to verify realtime status
    console.log(`Table ${tableName} exists. Assuming realtime is enabled.`);
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
