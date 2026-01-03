import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AntiCheatOptions {
  sessionId: string;
  maxViolations: number;
  onViolation?: (type: string, count: number) => void;
  onDisqualify?: () => void;
  enabled?: boolean;
}

export function useAntiCheat({
  sessionId,
  maxViolations,
  onViolation,
  onDisqualify,
  enabled = true,
}: AntiCheatOptions) {
  const violationCount = useRef(0);
  const isFullscreen = useRef(false);

  const logViolation = useCallback(async (eventType: string, eventData?: Record<string, any>) => {
    if (!enabled || !sessionId) return;

    try {
      await supabase.from('anti_cheat_logs').insert({
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData || {},
      });

      violationCount.current += 1;

      // Update session violation count
      await supabase
        .from('organization_exam_sessions')
        .update({ violation_count: violationCount.current })
        .eq('id', sessionId);

      onViolation?.(eventType, violationCount.current);

      if (violationCount.current >= maxViolations) {
        onDisqualify?.();
      }
    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  }, [sessionId, maxViolations, onViolation, onDisqualify, enabled]);

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    if (!enabled) return;
    
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        isFullscreen.current = true;
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, [enabled]);

  // Exit fullscreen
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
    isFullscreen.current = false;
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    // Visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('tab_switch', { timestamp: new Date().toISOString() });
      }
    };

    // Fullscreen change
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen.current) {
        logViolation('fullscreen_exit', { timestamp: new Date().toISOString() });
        // Try to re-enter fullscreen
        setTimeout(requestFullscreen, 100);
      }
      isFullscreen.current = !!document.fullscreenElement;
    };

    // Right-click prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation('right_click', { timestamp: new Date().toISOString() });
    };

    // Copy/Cut/Paste prevention
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation(`${e.type}_attempt`, { timestamp: new Date().toISOString() });
    };

    // Keyboard shortcuts prevention
    const handleKeydown = (e: KeyboardEvent) => {
      // Prevent common shortcuts
      if (
        (e.ctrlKey || e.metaKey) && 
        ['c', 'v', 'x', 'a', 'p', 's', 'u', 'f12'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        logViolation('keyboard_shortcut', { 
          key: e.key, 
          ctrl: e.ctrlKey,
          meta: e.metaKey,
          timestamp: new Date().toISOString() 
        });
      }
      
      // Prevent F12 and other function keys
      if (['F12', 'F5', 'F11'].includes(e.key)) {
        e.preventDefault();
        logViolation('function_key', { key: e.key, timestamp: new Date().toISOString() });
      }

      // Prevent PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        logViolation('print_screen', { timestamp: new Date().toISOString() });
      }
    };

    // Window blur (losing focus)
    const handleBlur = () => {
      logViolation('window_blur', { timestamp: new Date().toISOString() });
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('blur', handleBlur);

    // Disable text selection
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('blur', handleBlur);
      
      // Restore text selection
      document.body.style.userSelect = '';
    };
  }, [enabled, sessionId, logViolation, requestFullscreen]);

  return {
    violationCount: violationCount.current,
    requestFullscreen,
    exitFullscreen,
    logViolation,
  };
}
