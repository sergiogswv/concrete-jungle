import { useState, useRef, useEffect } from 'react';
import type { SceneConfig, PostProcessingConfig } from '../types/scene.types';

interface UseSceneConfigReturn {
  sceneConfig: SceneConfig;
  postProcessingConfig: PostProcessingConfig;
  sceneConfigRefs: {
    infiniteScroll: React.MutableRefObject<boolean>;
    scrollSpeed: React.MutableRefObject<number>;
    smoothingFactor: React.MutableRefObject<number>;
  };
  postProcessingRefs: {
    bloomStrength: React.MutableRefObject<number>;
    emissiveIntensity: React.MutableRefObject<number>;
  };
  updateSceneConfig: (updates: Partial<SceneConfig>) => void;
  updatePostProcessing: (updates: Partial<PostProcessingConfig>) => void;
}

/**
 * Custom hook to manage scene and post-processing configuration
 * Uses refs to prevent unnecessary re-renders during animation loop
 */
export function useSceneConfig(): UseSceneConfigReturn {
  // Scene configuration state
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>({
    cityGridSize: 20,
    infiniteScroll: true,
    scrollSpeed: 0.3,
    smoothingFactor: 0.15,
  });

  // Post-processing configuration state
  const [postProcessingConfig, setPostProcessingConfig] = useState<PostProcessingConfig>({
    bloomStrength: 1.8,
    bloomThreshold: 0.6,
    bloomRadius: 0.5,
    emissiveIntensity: 1.0,
  });

  // Refs for animation loop (prevent re-renders)
  const infiniteScrollRef = useRef(sceneConfig.infiniteScroll);
  const scrollSpeedRef = useRef(sceneConfig.scrollSpeed);
  const smoothingFactorRef = useRef(sceneConfig.smoothingFactor);
  const bloomStrengthRef = useRef(postProcessingConfig.bloomStrength);
  const emissiveIntensityRef = useRef(postProcessingConfig.emissiveIntensity);

  // Sync refs with state
  useEffect(() => {
    infiniteScrollRef.current = sceneConfig.infiniteScroll;
  }, [sceneConfig.infiniteScroll]);

  useEffect(() => {
    scrollSpeedRef.current = sceneConfig.scrollSpeed;
  }, [sceneConfig.scrollSpeed]);

  useEffect(() => {
    smoothingFactorRef.current = sceneConfig.smoothingFactor;
  }, [sceneConfig.smoothingFactor]);

  useEffect(() => {
    bloomStrengthRef.current = postProcessingConfig.bloomStrength;
  }, [postProcessingConfig.bloomStrength]);

  useEffect(() => {
    emissiveIntensityRef.current = postProcessingConfig.emissiveIntensity;
  }, [postProcessingConfig.emissiveIntensity]);

  // Update functions
  const updateSceneConfig = (updates: Partial<SceneConfig>) => {
    setSceneConfig((prev) => ({ ...prev, ...updates }));
  };

  const updatePostProcessing = (updates: Partial<PostProcessingConfig>) => {
    setPostProcessingConfig((prev) => ({ ...prev, ...updates }));
  };

  return {
    sceneConfig,
    postProcessingConfig,
    sceneConfigRefs: {
      infiniteScroll: infiniteScrollRef,
      scrollSpeed: scrollSpeedRef,
      smoothingFactor: smoothingFactorRef,
    },
    postProcessingRefs: {
      bloomStrength: bloomStrengthRef,
      emissiveIntensity: emissiveIntensityRef,
    },
    updateSceneConfig,
    updatePostProcessing,
  };
}
