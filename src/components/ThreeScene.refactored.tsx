import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useAudioSmoothing } from '../hooks/useAudioSmoothing';
import { useSceneConfig } from '../hooks/useSceneConfig';
import { CityGenerator } from '../city/CityGenerator';
import { createNormalBuildingMaterial, createAlternatingSpecialMaterials } from '../city/materials';
import { AudioControls } from './AudioControls';
import { PostProcessingControls } from './PostProcessingControls';
import {
  createScene,
  createCamera,
  createRenderer,
  createLighting,
  createGround,
  createPostProcessing,
  createResizeHandler,
  cleanupScene,
} from '../utils/sceneSetup';
import {
  calculateBuildingScale,
  handleInfiniteScroll,
  updateBuildingMatrix,
  calculateCircularCameraPosition,
  calculateScrollCameraPosition,
} from '../utils/animationHelpers';
import type { FrequencyData } from '../audio/AudioAnalyzer';
import type {
  SceneRefs,
  BuildingMeshRefs,
  BuildingData,
  AnimationState,
  ScrollConfig,
} from '../types/scene.types';

/**
 * Main ThreeJS scene component
 * Refactored following SOLID principles
 */
const ThreeScene = () => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<SceneRefs>({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    bloomPass: null,
  });

  const buildingMeshRefs = useRef<BuildingMeshRefs>({
    normal: null,
    cyan: null,
    magenta: null,
  });

  const buildingsDataRef = useRef<BuildingData[]>([]);
  const cyanBuildingsDataRef = useRef<BuildingData[]>([]);
  const magentaBuildingsDataRef = useRef<BuildingData[]>([]);
  const specialMaterialsRef = useRef<ReturnType<typeof createAlternatingSpecialMaterials> | null>(
    null
  );

  const animationStateRef = useRef<AnimationState>({
    time: 0,
    animationFrameId: null,
  });

  // Custom hooks
  const audioDataRef = useRef<FrequencyData | null>(null);
  const { loadAudioFile, isPlaying, toggle } = useAudioAnalyzer({
    frequencyDataRef: audioDataRef,
  });

  const { smoothedAudioRef, applySmoothingToAudio } = useAudioSmoothing();

  const {
    sceneConfig,
    postProcessingConfig,
    sceneConfigRefs,
    postProcessingRefs,
    updateSceneConfig,
    updatePostProcessing,
  } = useSceneConfig();

  /**
   * Handle file upload with error handling
   */
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        await loadAudioFile(file);
      } catch (error) {
        console.error('Error loading audio file:', error);
        alert('Error al cargar el archivo de audio. Por favor, intenta con otro archivo.');
      }
    },
    [loadAudioFile]
  );

  /**
   * Initialize building matrices to prevent visual glitches
   */
  const initializeBuildingMatrices = useCallback(() => {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    // Initialize normal buildings
    if (buildingMeshRefs.current.normal && buildingsDataRef.current.length > 0) {
      const normalBuildings = buildingsDataRef.current.filter((b) => !b.isSpecial);
      normalBuildings.forEach((building, index) => {
        const initialScale = 1.0 + Math.sin(index * 0.1) * 0.05;
        const newHeight = building.height * initialScale;
        updateBuildingMatrix(
          buildingMeshRefs.current.normal!,
          index,
          building,
          newHeight,
          matrix,
          position,
          quaternion,
          scale
        );
      });
      buildingMeshRefs.current.normal.instanceMatrix.needsUpdate = true;
    }

    // Initialize cyan buildings
    if (buildingMeshRefs.current.cyan && cyanBuildingsDataRef.current.length > 0) {
      cyanBuildingsDataRef.current.forEach((building, index) => {
        const initialScale = 1.0 + Math.sin(index * 0.2) * 0.08;
        const newHeight = building.height * initialScale;
        updateBuildingMatrix(
          buildingMeshRefs.current.cyan!,
          index,
          building,
          newHeight,
          matrix,
          position,
          quaternion,
          scale
        );
      });
      buildingMeshRefs.current.cyan.instanceMatrix.needsUpdate = true;
    }

    // Initialize magenta buildings
    if (buildingMeshRefs.current.magenta && magentaBuildingsDataRef.current.length > 0) {
      magentaBuildingsDataRef.current.forEach((building, index) => {
        const initialScale = 1.0 + Math.sin(index * 0.2) * 0.08;
        const newHeight = building.height * initialScale;
        updateBuildingMatrix(
          buildingMeshRefs.current.magenta!,
          index,
          building,
          newHeight,
          matrix,
          position,
          quaternion,
          scale
        );
      });
      buildingMeshRefs.current.magenta.instanceMatrix.needsUpdate = true;
    }
  }, []);

  /**
   * Create animation loop
   */
  const createAnimationLoop = useCallback(() => {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    const scrollConfig: ScrollConfig = {
      distanceThreshold: 40,
      respawnDistance: sceneConfig.cityGridSize * 4,
    };

    const animate = () => {
      animationStateRef.current.animationFrameId = requestAnimationFrame(animate);
      animationStateRef.current.time += 0.01;

      const time = animationStateRef.current.time;

      // Get and smooth audio data
      const rawAudioData = audioDataRef.current;

      if (!rawAudioData) {
        return renderFrame();
      }

      const smoothedAudio = applySmoothingToAudio(
        rawAudioData,
        sceneConfigRefs.smoothingFactor.current
      );

      const { bass, mid, treble, overall } = smoothedAudio;
      const bassScale = 1 + bass * 0.3;

      // Update normal buildings
      updateBuildingsAnimation(
        buildingMeshRefs.current.normal,
        buildingsDataRef.current.filter((b) => !b.isSpecial),
        bassScale,
        time,
        false,
        matrix,
        position,
        quaternion,
        scale,
        scrollConfig
      );

      // Update cyan buildings
      updateBuildingsAnimation(
        buildingMeshRefs.current.cyan,
        cyanBuildingsDataRef.current,
        bassScale,
        time,
        true,
        matrix,
        position,
        quaternion,
        scale,
        scrollConfig
      );

      // Update magenta buildings
      updateBuildingsAnimation(
        buildingMeshRefs.current.magenta,
        magentaBuildingsDataRef.current,
        bassScale,
        time,
        true,
        matrix,
        position,
        quaternion,
        scale,
        scrollConfig
      );

      // Update material emissive intensity
      updateMaterialEmissiveIntensity(mid, treble);

      // Update bloom pass
      updateBloomIntensity(overall);

      // Update camera position
      updateCameraPosition(time);

      renderFrame();
    };

    const updateBuildingsAnimation = (
      mesh: THREE.InstancedMesh | null,
      buildings: BuildingData[],
      bassScale: number,
      time: number,
      isSpecial: boolean,
      matrix: THREE.Matrix4,
      position: THREE.Vector3,
      quaternion: THREE.Quaternion,
      scale: THREE.Vector3,
      scrollConfig: ScrollConfig
    ) => {
      if (!mesh || buildings.length === 0) {
        return;
      }

      buildings.forEach((building, index) => {
        // Handle infinite scroll
        if (sceneConfigRefs.infiniteScroll.current) {
          handleInfiniteScroll(building, sceneConfigRefs.scrollSpeed.current, scrollConfig);
        }

        // Calculate scale
        const scaleMultiplier = calculateBuildingScale(bassScale, time, index, isSpecial);
        const newHeight = building.height * scaleMultiplier;

        // Update matrix
        updateBuildingMatrix(mesh, index, building, newHeight, matrix, position, quaternion, scale);
      });

      mesh.instanceMatrix.needsUpdate = true;
    };

    const updateMaterialEmissiveIntensity = (mid: number, treble: number) => {
      if (!specialMaterialsRef.current) {
        return;
      }

      const baseEmissive = postProcessingRefs.emissiveIntensity.current;
      specialMaterialsRef.current.cyan.emissiveIntensity = baseEmissive + mid * 2.0;
      specialMaterialsRef.current.magenta.emissiveIntensity = baseEmissive + treble * 2.0;
    };

    const updateBloomIntensity = (overall: number) => {
      if (!sceneRefs.current.bloomPass) {
        return;
      }

      const baseStrength = postProcessingRefs.bloomStrength.current;
      sceneRefs.current.bloomPass.strength = baseStrength + overall * 1.2;
    };

    const updateCameraPosition = (time: number) => {
      if (!sceneRefs.current.camera) {
        return;
      }

      if (sceneConfigRefs.infiniteScroll.current) {
        const position = calculateScrollCameraPosition(time);
        sceneRefs.current.camera.position.copy(position);
        sceneRefs.current.camera.lookAt(0, 10, -50);
      } else {
        const position = calculateCircularCameraPosition(time, 60, 0.05, 25);
        sceneRefs.current.camera.position.copy(position);
        sceneRefs.current.camera.lookAt(0, 10, 0);
      }
    };

    const renderFrame = () => {
      if (sceneRefs.current.composer) {
        sceneRefs.current.composer.render();
      }
    };

    return animate;
  }, [
    sceneConfig.cityGridSize,
    sceneConfigRefs,
    postProcessingRefs,
    applySmoothingToAudio,
  ]);

  /**
   * Initialize Three.js scene
   */
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    try {
      // Create scene components
      const scene = createScene();
      const camera = createCamera();
      const renderer = createRenderer(containerRef.current);
      const lights = createLighting();
      const ground = createGround();

      // Add to scene
      lights.forEach((light) => scene.add(light));
      scene.add(ground);

      // Create post-processing
      const { composer, bloomPass } = createPostProcessing(
        renderer,
        scene,
        camera,
        postProcessingConfig
      );

      // Store refs
      sceneRefs.current = { scene, camera, renderer, composer, bloomPass };

      // Generate city
      const cityGenerator = new CityGenerator({
        gridSize: sceneConfig.cityGridSize,
        spacing: 4,
        minHeight: 3,
        maxHeight: 30,
        buildingVariation: 0.3,
        specialBuildingRatio: 0.25,
      });

      const normalMaterial = createNormalBuildingMaterial();
      const specialMaterials = createAlternatingSpecialMaterials();
      specialMaterialsRef.current = specialMaterials;

      // Create buildings
      const normalBuildings = cityGenerator.createNormalBuildings(normalMaterial);
      buildingMeshRefs.current.normal = normalBuildings;
      scene.add(normalBuildings);

      buildingsDataRef.current = cityGenerator.getBuildingData();

      const specialBuildingsData = cityGenerator.getSpecialBuildings();
      const cyanBuildings = specialBuildingsData.filter((_, i) => i % 2 === 0);
      const magentaBuildings = specialBuildingsData.filter((_, i) => i % 2 !== 0);

      cyanBuildingsDataRef.current = cyanBuildings;
      magentaBuildingsDataRef.current = magentaBuildings;

      // Create cyan mesh
      if (cyanBuildings.length > 0) {
        const cyanGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cyanMesh = new THREE.InstancedMesh(
          cyanGeometry,
          specialMaterials.cyan,
          cyanBuildings.length
        );

        const matrix = new THREE.Matrix4();
        cyanBuildings.forEach((building, index) => {
          matrix.compose(
            new THREE.Vector3(building.x, building.y, building.z),
            new THREE.Quaternion(),
            new THREE.Vector3(building.width, building.height, building.depth)
          );
          cyanMesh.setMatrixAt(index, matrix);
        });
        cyanMesh.instanceMatrix.needsUpdate = true;
        buildingMeshRefs.current.cyan = cyanMesh;
        scene.add(cyanMesh);
      }

      // Create magenta mesh
      if (magentaBuildings.length > 0) {
        const magentaGeometry = new THREE.BoxGeometry(1, 1, 1);
        const magentaMesh = new THREE.InstancedMesh(
          magentaGeometry,
          specialMaterials.magenta,
          magentaBuildings.length
        );

        const matrix = new THREE.Matrix4();
        magentaBuildings.forEach((building, index) => {
          matrix.compose(
            new THREE.Vector3(building.x, building.y, building.z),
            new THREE.Quaternion(),
            new THREE.Vector3(building.width, building.height, building.depth)
          );
          magentaMesh.setMatrixAt(index, matrix);
        });
        magentaMesh.instanceMatrix.needsUpdate = true;
        buildingMeshRefs.current.magenta = magentaMesh;
        scene.add(magentaMesh);
      }

      // Initialize matrices
      initializeBuildingMatrices();

      // Setup resize handler
      const handleResize = createResizeHandler(camera, renderer, composer);
      window.addEventListener('resize', handleResize);

      // Start animation loop
      const animate = createAnimationLoop();
      animate();

      // Cleanup
      return () => {
        if (animationStateRef.current.animationFrameId) {
          cancelAnimationFrame(animationStateRef.current.animationFrameId);
        }

        window.removeEventListener('resize', handleResize);

        if (containerRef.current && sceneRefs.current.scene && sceneRefs.current.renderer) {
          cleanupScene(sceneRefs.current.scene, sceneRefs.current.renderer, containerRef.current);
        }

        buildingMeshRefs.current = { normal: null, cyan: null, magenta: null };
      };
    } catch (error) {
      console.error('Error initializing Three.js scene:', error);
    }
  }, [
    sceneConfig.cityGridSize,
    postProcessingConfig,
    initializeBuildingMatrices,
    createAnimationLoop,
  ]);

  // Update bloom pass parameters dynamically
  useEffect(() => {
    if (sceneRefs.current.bloomPass) {
      sceneRefs.current.bloomPass.threshold = postProcessingConfig.bloomThreshold;
      sceneRefs.current.bloomPass.radius = postProcessingConfig.bloomRadius;
    }
  }, [postProcessingConfig.bloomThreshold, postProcessingConfig.bloomRadius]);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
        }}
      />

      <AudioControls
        isPlaying={isPlaying}
        hasAudioLoaded={audioDataRef.current !== null}
        onFileUpload={handleFileUpload}
        onTogglePlayback={toggle}
      />

      <PostProcessingControls
        sceneConfig={sceneConfig}
        postProcessingConfig={postProcessingConfig}
        onSceneConfigChange={updateSceneConfig}
        onPostProcessingChange={updatePostProcessing}
      />
    </>
  );
};

export default ThreeScene;
