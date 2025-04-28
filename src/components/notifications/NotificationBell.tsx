
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
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to fetch notifications');
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
      toast.error('An unexpected error occurred');
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
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
    const updateChannel = supabase
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
          
          setNotifications(prev => 
            prev.map(n => 
              n.id === updatedNotification.id 
                ? { ...n, is_read: updatedNotification.is_read } 
                : n
            )
          );
          
          // Recalculate unread count from the updated notifications array
          setUnreadCount(prev => {
            const newCount = notifications
              .map(n => n.id === updatedNotification.id ? {...n, is_read: updatedNotification.is_read} : n)
              .filter(n => !n.is_read)
              .length;
            return newCount;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(updateChannel);
    };
  }, [user, navigate]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Update in the database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        toast.error('Failed to update notification status');
        return;
      }

      // Update the local state immediately rather than waiting for the subscription
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      // Recalculate unread count directly from the updated state
      setUnreadCount(prev => {
        return prev > 0 ? prev - 1 : 0;
      });
      
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
        {notifications.length > 0 ? (
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
          <DropdownMenuItem disabled className="text-center">
            No notifications
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
