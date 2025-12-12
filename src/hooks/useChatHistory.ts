import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useChatHistory = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load all sessions for the user
  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new session
  const createSession = useCallback(async (firstMessage?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const title = firstMessage 
        ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
        : 'New Chat';

      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSessionId(data.id);
      setSessions(prev => [data, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }, [user]);

  // Load messages for a session
  const loadSessionMessages = useCallback(async (sessionId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }, []);

  // Save a message to the current session
  const saveMessage = useCallback(async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    try {
      const { error } = await supabase
        .from('ai_chat_messages')
        .insert({ session_id: sessionId, role, content });

      if (error) throw error;

      // Update session title if it's the first user message
      if (role === 'user') {
        await supabase
          .from('ai_chat_sessions')
          .update({ 
            title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [currentSessionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    loading,
    loadSessions,
    createSession,
    loadSessionMessages,
    saveMessage,
    deleteSession,
  };
};
