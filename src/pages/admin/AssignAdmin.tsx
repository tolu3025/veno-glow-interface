
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

const AssignAdmin = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleAssignAdmin = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    
    setLoading(true);
    try {
      // First, get the user ID from the email using the user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      
      if (profileError || !profileData) {
        toast.error(`User not found with email: ${email}`);
        setLoading(false);
        return;
      }
      
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', profileData.user_id)
        .eq('role', 'admin')
        .maybeSingle();
        
      if (existingRole) {
        toast.info(`User ${email} is already an admin`);
        setLoading(false);
        return;
      }
      
      // Assign admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profileData.user_id,
          role: 'admin'
        });
        
      if (insertError) {
        toast.error('Failed to assign admin role');
        console.error('Error assigning admin role:', insertError);
      } else {
        toast.success(`Admin role assigned to ${email}`);
        setEmail('');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error in admin assignment:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Assign Admin Role</CardTitle>
        <CardDescription>
          Enter a user's email to assign them admin privileges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAssignAdmin} 
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? "Assigning..." : "Assign Admin Role"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AssignAdmin;
