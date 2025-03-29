
import { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates or updates the RPC function in the database to append an activity to a user's activity array
 * Note: This is actually a utility function that uses normal supabase queries instead of SQL's array_append
 */
export async function appendToActivities(userId: string, newActivity: any): Promise<Json | null> {
  try {
    // First, get the current activities array
    const { data, error } = await supabase
      .from('user_profiles')
      .select('activities')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    // Make sure activities is an array
    const currentActivities = Array.isArray(data.activities) ? data.activities : [];
    
    // Append the new activity
    const updatedActivities = [...currentActivities, newActivity];
    
    return updatedActivities as Json;
  } catch (error) {
    console.error("Error in appendToActivities:", error);
    return null;
  }
}

// Register the function with Supabase
supabase.functions.invoke = supabase.functions.invoke || {};
supabase.rpc = (functionName: string, params?: { [key: string]: any }) => {
  if (functionName === 'append_to_activities' && params) {
    return appendToActivities(params.user_id_param, params.new_activity);
  }
  return null;
};
