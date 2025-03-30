
import React from 'react';
import { Button } from '@/components/ui/button';
import { WifiOff, Loader2, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  connectionStatus: 'unknown' | 'connected' | 'disconnected';
  isRetrying: boolean;
  onRetry: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  isRetrying,
  onRetry
}) => {
  if (connectionStatus !== 'disconnected') {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
      <div className="flex items-center">
        <WifiOff className="h-5 w-5 text-yellow-500 mr-2" />
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          {navigator.onLine ? 
            "Connected to internet but can't reach our servers. Using offline data." :
            "No internet connection. Using offline data."}
        </p>
      </div>
      <div className="flex justify-end mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry} 
          disabled={isRetrying}
          className="border-yellow-300 dark:border-yellow-700"
        >
          {isRetrying ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" /> Connecting...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" /> Try Again
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConnectionStatus;
