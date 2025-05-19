
import React, { useState, useEffect } from 'react';
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'blog_article' | 'comment_reply';
  link: string | null;
  is_read: boolean;
  created_at: string;
  user_email: string;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to fetch notifications');
        toast.error('Failed to fetch notifications');
        return;
      }

      if (!data) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const typedData = data.map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type as 'blog_article' | 'comment_reply',
        link: item.link,
        is_read: item.is_read,
        created_at: item.created_at,
        user_email: item.user_email
      }));
      
      setNotifications(typedData);
      
      // Count unread notifications
      const unreadNotifications = typedData.filter(n => !n.is_read);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    fetchNotifications();
    
    // Subscribe to new notifications
    let channel;
    let updateChannel;
    
    try {
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_email=eq.${user.email}`,
          },
          (payload) => {
            const newNotification = payload.new as any;
            if (!newNotification || newNotification.user_email !== user.email) {
              return;
            }
            
            const typedNotification: Notification = {
              id: newNotification.id,
              title: newNotification.title,
              message: newNotification.message,
              type: newNotification.type as 'blog_article' | 'comment_reply',
              link: newNotification.link,
              is_read: newNotification.is_read,
              created_at: newNotification.created_at,
              user_email: newNotification.user_email
            };
            
            setNotifications(prev => [typedNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            toast.info(typedNotification.title, {
              description: typedNotification.message,
              action: {
                label: 'View',
                onClick: () => {
                  markNotificationAsRead(typedNotification.id);
                  navigate(typedNotification.link || '/blog');
                }
              }
            });
          }
        )
        .subscribe();

      // Subscribe to notification updates (read status changes)
      updateChannel = supabase
        .channel('notification_updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_email=eq.${user.email}`,
          },
          (payload) => {
            const updatedNotification = payload.new as any;
            if (!updatedNotification || updatedNotification.user_email !== user.email) {
              return;
            }
            
            setNotifications(prev => 
              prev.map(n => 
                n.id === updatedNotification.id 
                  ? { ...n, is_read: updatedNotification.is_read } 
                  : n
              )
            );
            
            // Recalculate unread count
            setNotifications(prevNotifications => {
              const newUnreadCount = prevNotifications.filter(n => !n.is_read).length;
              setUnreadCount(newUnreadCount);
              return prevNotifications;
            });
          }
        )
        .subscribe();
    } catch (subError) {
      console.error('Error setting up notification subscriptions:', subError);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (updateChannel) supabase.removeChannel(updateChannel);
    };
  }, [user, navigate]);

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      // Update in the database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_email', user.email);

      if (error) {
        console.error('Error marking notification as read:', error);
        toast.error('Failed to update notification status');
        return;
      }

      // Update the local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      // Recalculate unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Unexpected error marking notification as read:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative" size="icon">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-red-500">
            {error}
          </div>
        ) : notifications.length > 0 ? (
          <>
            <div className="px-2 py-1.5 text-sm font-semibold">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'No unread notifications'}
            </div>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex flex-col items-start p-3 ${
                  !notification.is_read ? 'bg-muted/50' : ''
                }`}
              >
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-muted-foreground">{notification.message}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDate(notification.created_at)}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
