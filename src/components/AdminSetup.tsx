
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export const AdminSetup = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    const setupAdmin = async () => {
      // Check if williamsbenjaminacc@gmail.com exists and has admin role
      const { data: existingUser, error: emailError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', 'williamsbenjaminacc@gmail.com')
        .maybeSingle();
      
      if (emailError || !existingUser) {
        console.log('Admin user not found in profiles');
        return;
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
          console.error('Error assigning admin role:', insertError);
        } else {
          console.log('Admin role assigned to williamsbenjaminacc@gmail.com');
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
