
import React, { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const AdminSetup = () => {
  const { user } = useAuth();

  useEffect(() => {
    const setupAdmin = async () => {
      if (!user) return;

      console.log('Current user is in admin whitelist, ensuring admin role');
      
      // Check if user already has admin role using the new security definer function
      try {
        const { data: currentRole, error: roleError } = await supabase
          .rpc('get_current_user_role');

        if (roleError) {
          console.error('Error checking current role:', roleError);
          // If there's an error checking role, try to assign admin role
        } else if (currentRole === 'admin' || currentRole === 'superadmin') {
          console.log('User already has admin role:', currentRole);
          return;
        }

        // Assign admin role if not already present
        console.log('No admin role found, assigning admin role to', user.email);
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'admin'
          });

        if (insertError) {
          console.error('Error assigning admin role to', user.email, ':', insertError);
        } else {
          console.log('Successfully assigned admin role to', user.email);
        }
      } catch (error) {
        console.error('Unexpected error in admin setup:', error);
      }
    };

    // Only setup admin for whitelisted emails
    const adminEmails = ['williamsbenjaminacc@gmail.com', 'oyinaderokibat4@gmail.com'];
    if (user && adminEmails.includes(user.email || '')) {
      setupAdmin();
    }
  }, [user]);

  return null; // This component doesn't render anything
};

export default AdminSetup;
