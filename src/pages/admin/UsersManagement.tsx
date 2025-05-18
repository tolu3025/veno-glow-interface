import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Trash, Edit, MoreVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

// Define a type for the user role
type UserRole = 'admin' | 'educator' | 'user';

type User = {
  id: string;
  email: string;
  role: UserRole;
  lastActive?: string;
  createdAt?: string;
};

type NewUser = {
  email: string;
  password: string;
  role: UserRole;
};

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    password: "",
    role: "user"
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First get the users from auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw new Error(authError.message);
      
      if (!authUsers?.users) {
        setUsers([]);
        return;
      }
      
      // Then get their roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw new Error(rolesError.message);
      
      // Map users with their roles
      const roleMap = (roles || []).reduce((acc: Record<string, UserRole>, curr) => {
        // Ensure the role is one of our allowed types
        const role = curr.role as UserRole;
        acc[curr.user_id] = role;
        return acc;
      }, {});
      
      const mappedUsers = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || 'No email',
        role: roleMap[user.id] || 'user' as UserRole,
        lastActive: user.last_sign_in_at,
        createdAt: user.created_at
      }));
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.password) {
        toast.error('Email and password are required');
        return;
      }
      
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });
      
      if (error) throw new Error(error.message);
      
      if (data.user) {
        // Set their role - make sure to use the correctly typed role value
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id, 
            // Cast the role to the database expected type
            role: newUser.role as 'admin' | 'user' | 'moderator'
          });
        
        if (roleError) throw new Error(roleError.message);
        
        toast.success('User created successfully');
        setIsAddUserDialogOpen(false);
        setNewUser({ email: "", password: "", role: "user" });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        
        if (error) throw new Error(error.message);
        
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  // Filter users based on search
  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
          <TabsTrigger value="user">Users</TabsTrigger>
          <TabsTrigger value="educator">Educators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <UserTable 
            users={filteredUsers} 
            loading={loading} 
            onDelete={handleDeleteUser}
          />
        </TabsContent>
        
        <TabsContent value="admin" className="mt-4">
          <UserTable 
            users={filteredUsers.filter(user => user.role === 'admin')} 
            loading={loading} 
            onDelete={handleDeleteUser}
          />
        </TabsContent>
        
        <TabsContent value="user" className="mt-4">
          <UserTable 
            users={filteredUsers.filter(user => user.role === 'user')} 
            loading={loading} 
            onDelete={handleDeleteUser}
          />
        </TabsContent>
        
        <TabsContent value="educator" className="mt-4">
          <UserTable 
            users={filteredUsers.filter(user => user.role === 'educator')} 
            loading={loading} 
            onDelete={handleDeleteUser}
          />
        </TabsContent>
      </Tabs>
      
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They'll receive an email to set their password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                placeholder="user@example.com" 
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="educator">Educator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for the user table
const UserTable = ({ users, loading, onDelete }: { 
  users: User[], 
  loading: boolean,
  onDelete: (id: string) => void
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            No users found
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={
                    user.role === 'admin' ? 'destructive' :
                    user.role === 'educator' ? 'secondary' :
                    'default'
                  }>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </TableCell>
                <TableCell>
                  {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(user.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UsersManagement;
