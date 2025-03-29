
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export async function appendActivityAndUpdatePoints(userId: string, activity: any, pointsChange: number = 0): Promise<boolean> {
  try {
    // First, get the current profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('points, activities')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    // Make sure activities is an array
    const currentActivities = Array.isArray(data.activities) ? data.activities : [];
    const currentPoints = data.points || 0;
    
    // Append the new activity
    const updatedActivities = [...currentActivities, activity];
    
    // Update the database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        points: currentPoints + pointsChange,
        activities: updatedActivities
      })
      .eq('user_id', userId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error("Error in appendActivityAndUpdatePoints:", error);
    return false;
  }
}
