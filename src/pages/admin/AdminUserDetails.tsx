
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Calendar, Shield, Activity, Ban, CheckCircle } from 'lucide-react';

type UserDetail = {
  id: string;
  user_id: string;
  email: string;
  points: number;
  created_at: string;
  is_verified: boolean;
  role?: string;
  is_banned?: boolean;
  ban_reason?: string;
  ban_expires_at?: string;
}

const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      console.log('Fetching user details for ID:', userId);
      
      // Use the admin view to get comprehensive user data
      const { data: userData, error: userError } = await supabase
        .from('admin_users_view')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user details:', userError);
        throw userError;
      }

      console.log('User details loaded:', userData);
      setUser(userData);
      toast.success('User details loaded successfully');
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(`Failed to load user details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('ban_user', {
        target_user_id: user.user_id,
        reason: 'Banned by admin from user details page'
      });

      if (error) throw error;

      toast.success('User has been banned successfully');
      fetchUserDetails(); // Refresh user data
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error(`Failed to ban user: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('unban_user', {
        target_user_id: user.user_id
      });

      if (error) throw error;

      toast.success('User has been unbanned successfully');
      fetchUserDetails(); // Refresh user data
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error(`Failed to unban user: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
        <Button onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground">
            Detailed information for {user.email}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <div className="mt-1 font-mono text-sm">{user.user_id}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Points</label>
              <div className="mt-1 text-lg font-semibold">{user.points || 0}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Joined</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="mt-1">
                {user.role === 'admin' || user.role === 'superadmin' ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    <Shield className="mr-1 h-3 w-3" /> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    <User className="mr-1 h-3 w-3" /> {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Verification Status</label>
              <div className="mt-1">
                {user.is_verified ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    <CheckCircle className="mr-1 h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                    <Activity className="mr-1 h-3 w-3" /> Pending Verification
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Ban Status</label>
              <div className="mt-1">
                {user.is_banned ? (
                  <div className="space-y-2">
                    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                      <Ban className="mr-1 h-3 w-3" /> Banned
                    </span>
                    {user.ban_reason && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {user.ban_reason}
                      </p>
                    )}
                    {user.ban_expires_at && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Expires:</strong> {new Date(user.ban_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    <CheckCircle className="mr-1 h-3 w-3" /> Active
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>
            Manage this user's account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {user.is_banned ? (
              <Button 
                variant="outline" 
                onClick={handleUnbanUser}
                disabled={actionLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Unban User
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={handleBanUser}
                disabled={actionLoading}
              >
                <Ban className="mr-2 h-4 w-4" />
                Ban User
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserDetails;
