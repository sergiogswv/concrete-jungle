import { useRef, useCallback } from 'react';
import type { FrequencyData } from '../audio/AudioAnalyzer';
import type { AudioSmoothingConfig } from '../types/scene.types';
import { lerp } from '../utils/animationHelpers';

interface UseAudioSmoothingReturn {
  smoothedAudioRef: React.MutableRefObject<AudioSmoothingConfig>;
  applySmoothingToAudio: (rawAudio: FrequencyData, smoothingFactor: number) => AudioSmoothingConfig;
}

/**
 * Custom hook for audio data smoothing using linear interpolation
 * Prevents jarring visual changes from noisy audio data
 */
export function useAudioSmoothing(): UseAudioSmoothingReturn {
  const smoothedAudioRef = useRef<AudioSmoothingConfig>({
    bass: 0,
    mid: 0,
    treble: 0,
    overall: 0,
  });

  /**
   * Apply lerp smoothing to all audio frequency bands
   */
  const applySmoothingToAudio = useCallback(
    (rawAudio: FrequencyData, smoothingFactor: number): AudioSmoothingConfig => {
      // Validate smoothing factor
      if (smoothingFactor < 0 || smoothingFactor > 1) {
        console.warn('Smoothing factor should be between 0 and 1. Clamping value.');
        smoothingFactor = Math.max(0, Math.min(1, smoothingFactor));
      }

      // Apply smoothing to each frequency band
      smoothedAudioRef.current.bass = lerp(
        smoothedAudioRef.current.bass,
        rawAudio.bass,
        smoothingFactor
      );

      smoothedAudioRef.current.mid = lerp(
        smoothedAudioRef.current.mid,
        rawAudio.mid,
        smoothingFactor
      );

      smoothedAudioRef.current.treble = lerp(
        smoothedAudioRef.current.treble,
        rawAudio.treble,
        smoothingFactor
      );

      smoothedAudioRef.current.overall = lerp(
        smoothedAudioRef.current.overall,
        rawAudio.overall,
        smoothingFactor
      );

      return smoothedAudioRef.current;
    },
    []
  );

  return {
    smoothedAudioRef,
    applySmoothingToAudio,
  };
}
