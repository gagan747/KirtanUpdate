import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hiddenButtonRef = useRef<HTMLButtonElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    const hiddenButton = hiddenButtonRef.current;
    if (!audio || !hiddenButton) return;

    // Mute audio initially to allow autoplay
    audio.muted = true;
    // Set audio properties for continuous background play
    audio.loop = true;
    audio.volume = 0.3; // Set to 30% volume by default
    
    let isPlaying = false;
    let autoClickAttempted = false;
    
    // Function to start audio
    const startAudio = async () => {
      if (isPlaying) return;
      
      try {
        await audio.play();
        isPlaying = true;
        console.log('🎵 Background music started successfully!');
        return true;
      } catch (error) {
        console.log('⏸️ Autoplay blocked - trying programmatic click trick...');
        return false;
      }
    };

    // Handle user interaction to start audio
    const handleUserInteraction = async (event?: Event) => {
      if (!isPlaying) {
        try {
          await audio.play();
          isPlaying = true;
          console.log('🎵 Background music started after interaction!');
          
          // Remove all event listeners once music starts
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('keydown', handleUserInteraction);
          document.removeEventListener('touchstart', handleUserInteraction);
          document.removeEventListener('scroll', handleUserInteraction);
          document.removeEventListener('mousemove', handleUserInteraction);
        } catch (err) {
          console.log('❌ Failed to start audio:', err);
        }
      }
    };

    // Programmatic click trick to bypass autoplay restrictions
    const triggerProgrammaticClick = () => {
      if (autoClickAttempted || isPlaying) return;
      autoClickAttempted = true;
      
      // Create a synthetic click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: 1,
        clientY: 1
      });
      
      // Add a one-time click handler to the hidden button
      const handleHiddenClick = async () => {
        try {
          await audio.play();
          isPlaying = true;
          console.log('🎵 Background music started via programmatic click!');
        } catch (err) {
          console.log('❌ Programmatic click failed, waiting for real user interaction');
          // Add back event listeners if trick fails
          document.addEventListener('click', handleUserInteraction, { passive: true });
          document.addEventListener('keydown', handleUserInteraction, { passive: true });
          document.addEventListener('touchstart', handleUserInteraction, { passive: true });
          document.addEventListener('scroll', handleUserInteraction, { passive: true });
          document.addEventListener('mousemove', handleUserInteraction, { passive: true });
        }
        hiddenButton.removeEventListener('click', handleHiddenClick);
      };
      
      hiddenButton.addEventListener('click', handleHiddenClick);
      
      // Trigger the click after a very short delay
      setTimeout(() => {
        hiddenButton.dispatchEvent(clickEvent);
      }, 500);
    };

    // Try to start immediately
    startAudio().then((success) => {
      if (!success) {
        // If immediate start fails, try the programmatic click trick
        triggerProgrammaticClick();
      }
    });

    // Add fallback event listeners in case everything else fails
    setTimeout(() => {
      if (!isPlaying) {
        document.addEventListener('click', handleUserInteraction, { passive: true });
        document.addEventListener('keydown', handleUserInteraction, { passive: true });
        document.addEventListener('touchstart', handleUserInteraction, { passive: true });
        document.addEventListener('scroll', handleUserInteraction, { passive: true });
        document.addEventListener('mousemove', handleUserInteraction, { passive: true });
      }
    }, 1000);
   
    return () => {
      // Cleanup
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      document.removeEventListener('mousemove', handleUserInteraction);
      
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
   
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
      console.log('🔊 Background music unmuted');
    } else {
      audio.muted = true;
      setIsMuted(true);
      console.log('🔇 Background music muted');
    }
  };

  return (
    <>
      <audio ref={audioRef} preload="auto" loop>
        <source src="/logo.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Volume control button */}
      <button
        onClick={toggleMute}
        className="fixed bottom-4 right-4 z-50 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title={isMuted ? "Unmute background music" : "Mute background music"}
      >
        {isMuted ? (
          <VolumeX className="w-6 h-6" />
        ) : (
          <Volume2 className="w-6 h-6" />
        )}
      </button>
      
      {/* Hidden button for programmatic click trick */}
      <button 
        ref={hiddenButtonRef}
        style={{ 
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
        tabIndex={-1}
      >
        Hidden Audio Trigger
      </button>
    </>
  );
}