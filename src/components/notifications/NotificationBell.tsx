
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
              onClick: () => navigate(typedNotification.link || '/blog')
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
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
    setUnreadCount(typedData.filter(n => !n.is_read).length);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      }
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
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
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
