
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NotificationsCenter = () => {
  const [isNewNotificationOpen, setIsNewNotificationOpen] = useState(false);
  const [notification, setNotification] = useState({
    title: "",
    message: "",
    type: "info",
    recipient: "all"
  });
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      title: "System Maintenance", 
      message: "The system will be down for maintenance on Saturday night.",
      type: "warning",
      sent: "2023-05-15", 
      recipients: "All Users"
    },
    { 
      id: 2, 
      title: "New Feature Released", 
      message: "Check out our new analytics dashboard!",
      type: "info",
      sent: "2023-05-12", 
      recipients: "Admins"
    }
  ]);

  const handleSendNotification = async () => {
    try {
      if (!notification.title || !notification.message) {
        toast.error("Title and message are required");
        return;
      }

      // Example logic for sending to all users
      if (notification.recipient === 'all') {
        // In a real implementation, you might query all users and create notifications for each
        const { data: users, error: userError } = await supabase
          .from('user_profiles')
          .select('email');
        
        if (userError) throw new Error(userError.message);
        
        if (users && users.length > 0) {
          // For demo purposes, we're just handling this conceptually
          toast.success(`Notification would be sent to ${users.length} users`);
        }
      } else {
        // Send to specific user type (admin, educators)
        toast.success(`Notification would be sent to ${notification.recipient} users`);
      }
      
      // Add the notification to our local state for demo purposes
      setNotifications([
        {
          id: Date.now(),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          sent: new Date().toISOString().split('T')[0],
          recipients: notification.recipient === 'all' ? 'All Users' : 
                     notification.recipient === 'admin' ? 'Admins' : 'Educators'
        },
        ...notifications
      ]);
      
      setIsNewNotificationOpen(false);
      setNotification({
        title: "",
        message: "",
        type: "info",
        recipient: "all"
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
        <Button onClick={() => setIsNewNotificationOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Notification
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>System Messages</CardTitle>
            <CardDescription>Automated messages from the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between">
                  <Badge className="mb-2">System</Badge>
                  <span className="text-xs text-muted-foreground">1 day ago</span>
                </div>
                <h4 className="font-medium">Database Backup Complete</h4>
                <p className="text-sm text-muted-foreground">
                  Weekly database backup has completed successfully.
                </p>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between">
                  <Badge className="mb-2">System</Badge>
                  <span className="text-xs text-muted-foreground">3 days ago</span>
                </div>
                <h4 className="font-medium">Storage Alert</h4>
                <p className="text-sm text-muted-foreground">
                  Storage usage has reached 80% of allocated capacity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact Forms</CardTitle>
            <CardDescription>Messages from the contact form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium">Sarah Johnson</span>
                  <span className="text-xs text-muted-foreground">2 days ago</span>
                </div>
                <span className="text-xs text-muted-foreground block mb-2">sarah@example.com</span>
                <p className="text-sm">
                  I'm having trouble accessing my account. Can you help?
                </p>
                <div className="mt-2">
                  <Button size="sm" variant="secondary">Reply</Button>
                </div>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium">Michael Chen</span>
                  <span className="text-xs text-muted-foreground">5 days ago</span>
                </div>
                <span className="text-xs text-muted-foreground block mb-2">michael@example.com</span>
                <p className="text-sm">
                  When will the new programming tutorials be available?
                </p>
                <div className="mt-2">
                  <Button size="sm" variant="secondary">Reply</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common notification tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => setIsNewNotificationOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Send New Message
            </Button>
            <Button className="w-full" variant="outline">
              Export Messages
            </Button>
            <Button className="w-full" variant="outline">
              Configure Templates
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>
            Previously sent notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium">{note.title}</TableCell>
                  <TableCell>
                    <Badge variant={
                      note.type === 'warning' ? 'destructive' :
                      note.type === 'info' ? 'default' :
                      'outline'
                    }>
                      {note.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{note.message}</TableCell>
                  <TableCell>{note.recipients}</TableCell>
                  <TableCell>{note.sent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isNewNotificationOpen} onOpenChange={setIsNewNotificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Notification</DialogTitle>
            <DialogDescription>
              Send a notification to users of the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={notification.title}
                onChange={(e) => setNotification({...notification, title: e.target.value})}
                placeholder="Notification title" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={notification.type}
                onValueChange={(value) => setNotification({...notification, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipients</Label>
              <Select
                value={notification.recipient}
                onValueChange={(value) => setNotification({...notification, recipient: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                  <SelectItem value="educator">Educators Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={notification.message}
                onChange={(e) => setNotification({...notification, message: e.target.value})}
                placeholder="Notification content"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewNotificationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification}>
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationsCenter;
