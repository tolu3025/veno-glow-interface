
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, User, Search, Shield, Mail, Calendar, Loader } from 'lucide-react';

type UserProfile = {
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
  activities?: any;
  updated_at?: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users from admin_user_view...');
      
      const { data: usersData, error: usersError } = await supabase
        .from('admin_user_view')
        .select('*');
      
      if (usersError) {
        console.error('Error fetching from admin_user_view:', usersError);
        throw usersError;
      }

      console.log('Admin users data:', usersData);
      
      const typedUsers = (usersData || []).map(user => ({
        id: user.id || '',
        user_id: user.user_id || '',
        email: user.email || '',
        points: user.points || 0,
        created_at: user.created_at || new Date().toISOString(),
        is_verified: user.is_verified || false,
        role: user.role || 'user',
        is_banned: (user as any).is_banned || false,
        ban_reason: (user as any).ban_reason || undefined,
        ban_expires_at: (user as any).ban_expires_at || undefined,
        activities: user.activities || null,
        updated_at: user.updated_at || new Date().toISOString()
      })) as UserProfile[];
      
      setUsers(typedUsers);
      
      if (typedUsers.length === 0) {
        toast.info('No users found in the database');
      } else {
        toast.success(`Loaded ${typedUsers.length} users`);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(`Failed to fetch users: ${error.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleViewDetails = (userId: string) => {
    console.log('Navigating to user details for:', userId);
    navigate(`/admin/users/${userId}`);
  };

  const filteredUsers = users
    .filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role && user.role?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const fieldA = a[sortField as keyof UserProfile];
      const fieldB = b[sortField as keyof UserProfile];
      
      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc" 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      if (typeof fieldA === "number" && typeof fieldB === "number") {
        return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
      }
      
      return 0;
    });

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage user accounts
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>User Accounts</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="w-60 pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => fetchUsers()} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh List"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
                <div 
                  className="flex cursor-pointer items-center"
                  onClick={() => handleSort("email")}
                >
                  <Mail className="mr-2 h-4 w-4" /> Email 
                  <SortIcon field="email" />
                </div>
                <div 
                  className="flex cursor-pointer items-center"
                  onClick={() => handleSort("role")}
                >
                  <Shield className="mr-2 h-4 w-4" /> Role
                  <SortIcon field="role" />
                </div>
                <div 
                  className="flex cursor-pointer items-center"
                  onClick={() => handleSort("points")}
                >
                  <User className="mr-2 h-4 w-4" /> Points
                  <SortIcon field="points" />
                </div>
                <div 
                  className="flex cursor-pointer items-center"
                  onClick={() => handleSort("created_at")}
                >
                  <Calendar className="mr-2 h-4 w-4" /> Joined
                  <SortIcon field="created_at" />
                </div>
                <div>Verification</div>
                <div>Ban Status</div>
                <div>Actions</div>
              </div>
              
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {users.length === 0 ? 'No users found in database' : 'No users match your search'}
                </div>
              ) : (
                <div>
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="grid grid-cols-7 border-t p-3 text-sm">
                      <div className="truncate">{user.email}</div>
                      <div>
                        {user.role === 'admin' || user.role === 'superadmin' ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            <Shield className="mr-1 h-3 w-3" /> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            <User className="mr-1 h-3 w-3" /> {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                          </span>
                        )}
                      </div>
                      <div>{user.points || 0}</div>
                      <div>
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        {user.is_verified ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                            Pending
                          </span>
                        )}
                      </div>
                      <div>
                        {user.is_banned ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(user.user_id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
