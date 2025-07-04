
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ban, MessageSquare, Search, Loader, UserCheck, Clock } from 'lucide-react';

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
  // Add these fields to match the updated view
  activities?: any;
  updated_at?: string;
};

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Ban form state
  const [banForm, setBanForm] = useState({
    reason: '',
    expires_at: ''
  });

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'admin_message'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: usersData, error } = await supabase
        .from('admin_user_view')
        .select('*');
      
      if (error) throw error;

      const typedUsers = (usersData || []).map(user => ({
        id: user.id || '',
        user_id: user.user_id || '',
        email: user.email || '',
        points: user.points || 0,
        created_at: user.created_at || new Date().toISOString(),
        is_verified: user.is_verified || false,
        role: user.role || 'user',
        is_banned: user.is_banned || false,
        ban_reason: user.ban_reason || undefined,
        ban_expires_at: user.ban_expires_at || undefined,
        activities: user.activities || null,
        updated_at: user.updated_at || new Date().toISOString()
      })) as UserProfile[];

      setUsers(typedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banForm.reason.trim()) {
      toast.error('Please provide a reason for the ban');
      return;
    }

    try {
      const expiresAt = banForm.expires_at ? new Date(banForm.expires_at).toISOString() : null;
      
      const { error } = await supabase.rpc('ban_user', {
        target_user_id: selectedUser.user_id,
        reason: banForm.reason,
        expires_at: expiresAt
      });

      if (error) throw error;

      toast.success('User banned successfully');
      setIsBanDialogOpen(false);
      setBanForm({ reason: '', expires_at: '' });
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unban this user?')) return;

    try {
      const { error } = await supabase.rpc('unban_user', {
        target_user_id: userId
      });

      if (error) throw error;

      toast.success('User unbanned successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    }
  };

  const handleSendNotification = async () => {
    if (!selectedUser || !notificationForm.title.trim() || !notificationForm.message.trim()) {
      toast.error('Please fill in all notification fields');
      return;
    }

    try {
      const { error } = await supabase.rpc('send_admin_notification', {
        target_user_email: selectedUser.email,
        notification_title: notificationForm.title,
        notification_message: notificationForm.message,
        notification_type: notificationForm.type
      });

      if (error) throw error;

      toast.success('Notification sent successfully');
      setIsNotificationDialogOpen(false);
      setNotificationForm({ title: '', message: '', type: 'admin_message' });
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role && user.role?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, bans, and send notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>
            View and manage user accounts with administrative actions
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.points || 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {user.is_banned ? (
                          <Badge variant="destructive" className="w-fit">
                            <Ban className="mr-1 h-3 w-3" />
                            Banned
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit">
                            <UserCheck className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        )}
                        {user.ban_expires_at && user.is_banned && (
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Expires: {new Date(user.ban_expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {user.is_banned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanUser(user.user_id)}
                          >
                            <UserCheck className="mr-1 h-4 w-4" />
                            Unban
                          </Button>
                        ) : (
                          <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Ban className="mr-1 h-4 w-4" />
                                Ban
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ban User</DialogTitle>
                                <DialogDescription>
                                  Ban {selectedUser?.email} from the platform
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="reason">Reason for Ban</Label>
                                  <Textarea
                                    id="reason"
                                    value={banForm.reason}
                                    onChange={(e) => setBanForm(prev => ({...prev, reason: e.target.value}))}
                                    placeholder="Explain why this user is being banned"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="expires">Expires At (Optional)</Label>
                                  <Input
                                    id="expires"
                                    type="datetime-local"
                                    value={banForm.expires_at}
                                    onChange={(e) => setBanForm(prev => ({...prev, expires_at: e.target.value}))}
                                  />
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Leave empty for permanent ban
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleBanUser}>
                                  Ban User
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Notification</DialogTitle>
                              <DialogDescription>
                                Send a notification to {selectedUser?.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                  id="title"
                                  value={notificationForm.title}
                                  onChange={(e) => setNotificationForm(prev => ({...prev, title: e.target.value}))}
                                  placeholder="Notification title"
                                />
                              </div>
                              <div>
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                  id="message"
                                  value={notificationForm.message}
                                  onChange={(e) => setNotificationForm(prev => ({...prev, message: e.target.value}))}
                                  placeholder="Notification message"
                                  rows={4}
                                />
                              </div>
                              <div>
                                <Label htmlFor="type">Type</Label>
                                <select
                                  id="type"
                                  value={notificationForm.type}
                                  onChange={(e) => setNotificationForm(prev => ({...prev, type: e.target.value}))}
                                  className="w-full px-3 py-2 border border-input rounded-md"
                                >
                                  <option value="admin_message">Admin Message</option>
                                  <option value="warning">Warning</option>
                                  <option value="info">Information</option>
                                  <option value="achievement">Achievement</option>
                                </select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsNotificationDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSendNotification}>
                                Send Notification
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;
