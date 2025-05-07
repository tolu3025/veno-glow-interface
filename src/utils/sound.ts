
// Sound utility for playing notification sounds
class SoundSystem {
  private enabled: boolean = true;
  private audioElements: Record<string, HTMLAudioElement> = {};
  
  constructor() {
    // Initialize with user preference from localStorage if available
    const savedPreference = localStorage.getItem('veno-sound-enabled');
    if (savedPreference !== null) {
      this.enabled = savedPreference === 'true';
    }
    
    // Pre-load common sounds
    this.preloadSound('success', '/sounds/success.mp3');
    this.preloadSound('error', '/sounds/error.mp3');
    this.preloadSound('notification', '/sounds/notification.mp3');
    this.preloadSound('complete', '/sounds/complete.mp3');
  }
  
  private preloadSound(name: string, path: string): void {
    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.audioElements[name] = audio;
    } catch (error) {
      console.error(`Failed to preload sound: ${name}`, error);
    }
  }
  
  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('veno-sound-enabled', String(this.enabled));
    return this.enabled;
  }
  
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  public play(sound: 'success' | 'error' | 'notification' | 'complete'): void {
    if (!this.enabled) return;
    
    try {
      // If the sound doesn't exist in our cache, create it
      if (!this.audioElements[sound]) {
        this.preloadSound(sound, `/sounds/${sound}.mp3`);
      }
      
      const audio = this.audioElements[sound];
      if (audio) {
        // Reset the audio to the beginning if it's already playing
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error(`Error playing sound: ${sound}`, error);
        });
      }
    } catch (error) {
      console.error(`Failed to play sound: ${sound}`, error);
    }
  }
}

// Create a singleton instance
export const soundSystem = new SoundSystem();
