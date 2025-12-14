import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { History, Trash2, Mic, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface VoiceChatSession {
  id: string;
  subject: string | null;
  topic: string | null;
  transcript: TranscriptEntry[];
  created_at: string;
  updated_at: string;
}

interface VoiceChatHistorySidebarProps {
  sessions: VoiceChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  loading: boolean;
}

const VoiceChatHistorySidebar: React.FC<VoiceChatHistorySidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  loading
}) => {
  const getSessionTitle = (session: VoiceChatSession) => {
    if (session.subject) {
      return session.topic 
        ? `${session.subject} - ${session.topic}`
        : session.subject;
    }
    // Get first message as title
    const firstMessage = session.transcript[0];
    if (firstMessage) {
      return firstMessage.text.slice(0, 40) + (firstMessage.text.length > 40 ? '...' : '');
    }
    return 'Voice Session';
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <History className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">History</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-80 p-3 sm:p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            Voice Chat History
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)] mt-3 sm:mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 sm:py-8 text-muted-foreground text-sm">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-muted-foreground text-center">
              <Mic className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-20" />
              <p className="text-xs sm:text-sm">No voice sessions yet</p>
              <p className="text-[10px] sm:text-xs mt-1">Start a voice session to see history</p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2 pr-2 sm:pr-4">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors group ${
                    currentSessionId === session.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted border-border'
                  }`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">
                        {getSessionTitle(session)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {format(new Date(session.created_at), 'MMM d, yyyy')}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        {session.transcript.length} messages
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 sm:w-8 sm:h-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default VoiceChatHistorySidebar;
