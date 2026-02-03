import type * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import type { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export interface SceneRefs {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  composer: EffectComposer | null;
  bloomPass: UnrealBloomPass | null;
}

export interface BuildingMeshRefs {
  normal: THREE.InstancedMesh | null;
  cyan: THREE.InstancedMesh | null;
  magenta: THREE.InstancedMesh | null;
}

export interface BuildingData {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  isSpecial?: boolean;
}

export interface AudioSmoothingConfig {
  bass: number;
  mid: number;
  treble: number;
  overall: number;
}

export interface PostProcessingConfig {
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  emissiveIntensity: number;
}

export interface SceneConfig {
  cityGridSize: number;
  infiniteScroll: boolean;
  scrollSpeed: number;
  smoothingFactor: number;
}

export interface AnimationState {
  time: number;
  animationFrameId: number | null;
}

export interface CameraConfig {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
  near: number;
  far: number;
}

export interface LightingConfig {
  ambient: {
    color: number;
    intensity: number;
  };
  directional: {
    color: number;
    intensity: number;
    position: THREE.Vector3;
  };
  point: {
    color: number;
    intensity: number;
    position: THREE.Vector3;
    distance: number;
  };
}

export interface ScrollConfig {
  distanceThreshold: number;
  respawnDistance: number;
}
