
/**
 * Sound utility for playing feedback sounds in the application
 */

// Define sound types available in the application
export type SoundType = 'success' | 'error' | 'complete' | 'click';

// Sound effect URLs - can be replaced with actual audio files
const soundEffects = {
  success: new Audio('/sounds/success.mp3'),
  error: new Audio('/sounds/error.mp3'),
  complete: new Audio('/sounds/complete.mp3'),
  click: new Audio('/sounds/click.mp3'),
};

// In case audio files are not available, create fallbacks using Web Audio API
const createFallbackSound = (type: SoundType): HTMLAudioElement => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    switch (type) {
      case 'success':
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        break;
      case 'error':
        oscillator.type = 'square';
        oscillator.frequency.value = 150;
        gainNode.gain.value = 0.1;
        break;
      case 'complete':
        oscillator.type = 'sine';
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.1;
        break;
      case 'click':
        oscillator.type = 'sine';
        oscillator.frequency.value = 350;
        gainNode.gain.value = 0.1;
        break;
    }
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, type === 'click' ? 100 : 500);
    
    // Return a dummy audio element since we're using Web Audio API
    return new Audio();
  } catch (error) {
    console.error('Failed to create fallback sound:', error);
    return new Audio();
  }
};

// Handle sound playback errors
const handleSoundError = (type: SoundType) => {
  console.warn(`Failed to play ${type} sound, using fallback`);
  createFallbackSound(type);
};

/**
 * Play a sound effect
 * @param type The type of sound to play
 * @param volume Optional volume level (0-1)
 */
export const playSound = (type: SoundType, volume: number = 0.5) => {
  try {
    const sound = soundEffects[type];
    
    if (!sound || sound.error) {
      handleSoundError(type);
      return;
    }
    
    // Reset the audio to start from beginning
    sound.currentTime = 0;
    sound.volume = volume;
    
    // Play the sound
    sound.play().catch(err => {
      console.warn('Sound playback error:', err);
      handleSoundError(type);
    });
  } catch (error) {
    console.error('Error playing sound:', error);
    handleSoundError(type);
  }
};
