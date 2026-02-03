import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import type { CameraConfig, LightingConfig, PostProcessingConfig } from '../types/scene.types';

const FOG_COLOR = new THREE.Color(0x0a0a15);
const GROUND_COLOR = 0x0a0a12;

/**
 * Create and configure the main scene
 */
export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG_COLOR, 10, 100);
  scene.background = FOG_COLOR;
  return scene;
}

/**
 * Create and configure the camera
 */
export function createCamera(config?: Partial<CameraConfig>): THREE.PerspectiveCamera {
  const defaultConfig: CameraConfig = {
    position: new THREE.Vector3(0, 25, 50),
    lookAt: new THREE.Vector3(0, 5, 0),
    fov: 75,
    near: 0.1,
    far: 1000,
  };

  const finalConfig = { ...defaultConfig, ...config };

  const camera = new THREE.PerspectiveCamera(
    finalConfig.fov,
    window.innerWidth / window.innerHeight,
    finalConfig.near,
    finalConfig.far
  );

  camera.position.copy(finalConfig.position);
  camera.lookAt(finalConfig.lookAt);

  return camera;
}

/**
 * Create and configure the WebGL renderer
 */
export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);

  return renderer;
}

/**
 * Create lighting setup for the scene
 */
export function createLighting(config?: Partial<LightingConfig>): THREE.Light[] {
  const defaultConfig: LightingConfig = {
    ambient: {
      color: 0x4444ff,
      intensity: 0.3,
    },
    directional: {
      color: 0xff00ff,
      intensity: 0.5,
      position: new THREE.Vector3(30, 50, 30),
    },
    point: {
      color: 0x00ffff,
      intensity: 1,
      position: new THREE.Vector3(-10, 5, -10),
      distance: 50,
    },
  };

  const finalConfig = { ...defaultConfig, ...config };

  // Ambient light
  const ambientLight = new THREE.AmbientLight(
    finalConfig.ambient.color,
    finalConfig.ambient.intensity
  );

  // Directional light with shadows
  const directionalLight = new THREE.DirectionalLight(
    finalConfig.directional.color,
    finalConfig.directional.intensity
  );
  directionalLight.position.copy(finalConfig.directional.position);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  directionalLight.shadow.camera.far = 150;

  // Point light
  const pointLight = new THREE.PointLight(
    finalConfig.point.color,
    finalConfig.point.intensity,
    finalConfig.point.distance
  );
  pointLight.position.copy(finalConfig.point.position);

  return [ambientLight, directionalLight, pointLight];
}

/**
 * Create ground plane
 */
export function createGround(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(200, 200);
  const material = new THREE.MeshStandardMaterial({
    color: GROUND_COLOR,
    metalness: 0.6,
    roughness: 0.3,
    envMapIntensity: 1.0,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;

  return ground;
}

/**
 * Create post-processing composer with effects
 */
export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  config: PostProcessingConfig
): { composer: EffectComposer; bloomPass: UnrealBloomPass } {
  const composer = new EffectComposer(renderer);

  // Render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom pass
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    config.bloomStrength,
    config.bloomRadius,
    config.bloomThreshold
  );
  composer.addPass(bloomPass);

  // Film pass
  const filmPass = new FilmPass(
    0.35,  // noise intensity
    0.025, // scanline intensity
    648,   // scanline count
    false  // grayscale
  );
  composer.addPass(filmPass);

  return { composer, bloomPass };
}

/**
 * Handle window resize
 */
export function createResizeHandler(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer
): () => void {
  return () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  };
}

/**
 * Cleanup scene resources
 */
export function cleanupScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer, container: HTMLElement): void {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    }
  });

  scene.clear();

  if (container.contains(renderer.domElement)) {
    container.removeChild(renderer.domElement);
  }

  renderer.dispose();
}
