import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Users, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OnlineUser } from '@/hooks/useOnlineUsers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface OnlineUsersListProps {
  users: OnlineUser[];
  isConnected: boolean;
  onChallengeUser: (userId: string, username: string) => void;
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  users,
  isConnected,
  onChallengeUser,
}) => {
  return (
    <Card className="veno-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-veno-primary" />
          Online Players
          {isConnected && (
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Wifi className="w-5 h-5 mr-2 animate-pulse" />
            Connecting...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No other players online</p>
            <p className="text-sm mt-1">Invite friends to challenge!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user, index) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-veno-primary/20 text-veno-primary font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">Online now</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onChallengeUser(user.user_id, user.username)}
                  className="bg-veno-primary hover:bg-veno-primary/90"
                >
                  <Swords className="w-4 h-4 mr-1" />
                  Challenge
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
