import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

export const useVoiceChatHistory = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<VoiceChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load all sessions for the user
  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('voice_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Parse transcript JSON
      const parsedSessions = (data || []).map(session => ({
        ...session,
        transcript: Array.isArray(session.transcript) 
          ? session.transcript as unknown as TranscriptEntry[]
          : []
      }));
      
      setSessions(parsedSessions);
    } catch (error) {
      console.error('Error loading voice sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new session
  const createSession = useCallback(async (subject?: string, topic?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('voice_chat_sessions')
        .insert({ 
          user_id: user.id, 
          subject: subject || null,
          topic: topic || null,
          transcript: []
        })
        .select()
        .single();

      if (error) throw error;
      
      const newSession = {
        ...data,
        transcript: [] as TranscriptEntry[]
      };
      
      setCurrentSessionId(data.id);
      setSessions(prev => [newSession, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error creating voice session:', error);
      return null;
    }
  }, [user]);

  // Update session transcript
  const updateTranscript = useCallback(async (sessionId: string, transcript: TranscriptEntry[]) => {
    try {
      const { error } = await supabase
        .from('voice_chat_sessions')
        .update({ 
          transcript: transcript as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      // Update local state
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, transcript, updated_at: new Date().toISOString() }
          : s
      ));
    } catch (error) {
      console.error('Error updating transcript:', error);
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('voice_chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Error deleting voice session:', error);
    }
  }, [currentSessionId]);

  // Load session transcript
  const loadSessionTranscript = useCallback(async (sessionId: string): Promise<TranscriptEntry[]> => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      return session.transcript;
    }
    
    try {
      const { data, error } = await supabase
        .from('voice_chat_sessions')
        .select('transcript')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return Array.isArray(data?.transcript) ? data.transcript as unknown as TranscriptEntry[] : [];
    } catch (error) {
      console.error('Error loading session transcript:', error);
      return [];
    }
  }, [sessions]);

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
    updateTranscript,
    deleteSession,
    loadSessionTranscript,
  };
};
