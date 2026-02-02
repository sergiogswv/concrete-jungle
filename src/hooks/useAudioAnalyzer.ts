import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioAnalyzer } from '../audio/AudioAnalyzer';
import type { FrequencyData } from '../audio/AudioAnalyzer';

interface UseAudioAnalyzerReturn {
  analyzer: AudioAnalyzer | null;
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
  loadAudioFile: (file: File) => Promise<void>;
  loadAudioURL: (url: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

interface UseAudioAnalyzerParams {
  frequencyDataRef?: React.MutableRefObject<FrequencyData | null>;
}

export const useAudioAnalyzer = (params?: UseAudioAnalyzerParams): UseAudioAnalyzerReturn => {
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>();

  // Inicializar el analizador
  useEffect(() => {
    analyzerRef.current = new AudioAnalyzer();

    return () => {
      // Cleanup: detener animación y liberar recursos
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      analyzerRef.current?.dispose();
    };
  }, []);

  // Loop de actualización de datos de frecuencia
  const updateFrequencyData = useCallback(() => {
    if (!analyzerRef.current) return;

    const data = analyzerRef.current.getFrequencyData();
    if (data && params?.frequencyDataRef) {
      // Actualizar la ref directamente sin causar re-render
      params.frequencyDataRef.current = data;
    }

    // Continuar el loop
    animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
  }, [params]);

  // Iniciar/detener el loop cuando cambia isPlaying
  useEffect(() => {
    if (isPlaying) {
      updateFrequencyData();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateFrequencyData]);

  // Cargar archivo de audio
  const loadAudioFile = useCallback(async (file: File) => {
    if (!analyzerRef.current) return;

    try {
      const audio = await analyzerRef.current.loadAudioFile(file);
      setAudioElement(audio);

      // Eventos del audio
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));

      // Reproducir automáticamente
      await audio.play();
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }, []);

  // Cargar audio desde URL
  const loadAudioURL = useCallback(async (url: string) => {
    if (!analyzerRef.current) return;

    try {
      const audio = await analyzerRef.current.loadAudioURL(url);
      setAudioElement(audio);

      // Eventos del audio
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));

      // Reproducir automáticamente
      await audio.play();
    } catch (error) {
      console.error('Error loading audio URL:', error);
      throw error;
    }
  }, []);

  // Control de reproducción
  const play = useCallback(() => {
    analyzerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    analyzerRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  return {
    analyzer: analyzerRef.current,
    isPlaying,
    audioElement,
    loadAudioFile,
    loadAudioURL,
    play,
    pause,
    toggle
  };
};
