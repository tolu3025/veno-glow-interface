
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "./button";
import { useState, useEffect } from "react";
import { soundSystem } from "@/utils/sound";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export const SoundToggle = () => {
  const [enabled, setEnabled] = useState(soundSystem.isEnabled());
  
  const toggleSound = () => {
    const newState = soundSystem.toggle();
    setEnabled(newState);
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={toggleSound}
          >
            {enabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <span className="sr-only">
              {enabled ? 'Disable sounds' : 'Enable sounds'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{enabled ? 'Disable sounds' : 'Enable sounds'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
