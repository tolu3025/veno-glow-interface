
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export const AdminSetup = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    const setupAdmin = async () => {
      // Define our admin emails
      const adminEmails = ['williamsbenjaminacc@gmail.com', 'oyinaderokibat4@gmail.com'];
      
      if (!user) return;

      // Check if the current user is in the admin whitelist
      if (adminEmails.includes(user.email || '')) {
        console.log('Current user is in admin whitelist, ensuring admin role');
        
        // Check if admin role exists for this user
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        // If no admin role, assign it
        if (!existingRole) {
          console.log('No admin role found, assigning admin role to', user.email);
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'admin'
            });
            
          if (insertError) {
            console.error(`Error assigning admin role to ${user.email}:`, insertError);
          } else {
            console.log(`Admin role assigned to ${user.email}`);
          }
        } else {
          console.log('User already has admin role:', user.email);
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
