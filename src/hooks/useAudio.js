// src/hooks/useAudio.js
import { useState, useEffect, useCallback } from 'react';

// Path to your sound file in the public folder
const SOUND_FILE = '/sounds/pop.mp3';

/**
 * A custom hook to play a sound effect using Web Audio API.
 * Ensures AudioContext is resumed on user interaction.
 */
export const useAudio = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize AudioContext and load sound buffer
  useEffect(() => {
    const initAudio = async () => {
      if (typeof window.AudioContext === 'undefined') {
        console.warn('Web Audio API is not supported in this browser.');
        return;
      }

      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);

      try {
        const response = await fetch(SOUND_FILE);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        setBuffer(audioBuffer);
        setIsReady(true);
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    initAudio();

    // Ensure AudioContext is resumed on user interaction
    const resumeContext = () => {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('AudioContext resumed!');
        });
      }
    };

    document.addEventListener('click', resumeContext);
    document.addEventListener('keydown', resumeContext);

    return () => {
      document.removeEventListener('click', resumeContext);
      document.removeEventListener('keydown', resumeContext);
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []); // Only run once on mount

  const playSound = useCallback(() => {
    if (isReady && audioContext && buffer) {
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          // Play after resume
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
        });
      } else {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
      }
    }
  }, [audioContext, buffer, isReady]);

  return playSound;
};
