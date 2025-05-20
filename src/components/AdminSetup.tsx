
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export const AdminSetup = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    const setupAdmin = async () => {
      // Define our admin emails
      const adminEmails = ['williamsbenjaminacc@gmail.com', 'oyinaderokibat4@gmail.com'];
      
      for (const adminEmail of adminEmails) {
        // Check if email exists in user_profiles
        const { data: existingUser, error: emailError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('email', adminEmail)
          .maybeSingle();
        
        if (emailError || !existingUser) {
          console.log(`Admin user not found in profiles: ${adminEmail}`);
          continue; // Skip to next email
        }
        
        // Check if admin role exists for this user
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', existingUser.user_id)
          .eq('role', 'admin')
          .maybeSingle();
        
        // If no admin role, assign it
        if (!existingRole) {
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: existingUser.user_id,
              role: 'admin'
            });
            
          if (insertError) {
            console.error(`Error assigning admin role to ${adminEmail}:`, insertError);
          } else {
            console.log(`Admin role assigned to ${adminEmail}`);
          }
        }
      }
    };

    if (user) {
      setupAdmin();
    }
  }, [user]);
  
  // This component doesn't render anything
  return null;
};
