import React from 'react';
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  loading: boolean;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  sessions,
  currentSessionId,
  loading,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  return (
    <div className="w-64 border-r border-border bg-card/50 flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No chat history yet
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  currentSessionId === session.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(session.updated_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatHistorySidebar;
