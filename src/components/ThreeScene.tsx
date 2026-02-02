import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import type { FrequencyData } from '../audio/AudioAnalyzer';
import { CityGenerator } from '../city/CityGenerator';
import { createNormalBuildingMaterial, createAlternatingSpecialMaterials } from '../city/materials';

const ThreeScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);

  // Audio analyzer
  const { frequencyData, loadAudioFile, isPlaying, toggle } = useAudioAnalyzer();
  const audioDataRef = useRef<FrequencyData | null>(null);

  // Controles de post-procesado
  const [bloomStrength, setBloomStrength] = useState(1.8);
  const [bloomThreshold, setBloomThreshold] = useState(0.6);
  const [bloomRadius, setBloomRadius] = useState(0.5);
  const [emissiveIntensity, setEmissiveIntensity] = useState(1.0);
  const bloomStrengthRef = useRef(bloomStrength);
  const emissiveIntensityRef = useRef(emissiveIntensity);

  // Referencias para animación
  const normalBuildingsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const cyanBuildingsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const magentaBuildingsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const buildingsDataRef = useRef<any[]>([]);
  const cyanBuildingsDataRef = useRef<any[]>([]);
  const magentaBuildingsDataRef = useRef<any[]>([]);
  const specialMaterialsRef = useRef<{ cyan: THREE.MeshStandardMaterial; magenta: THREE.MeshStandardMaterial } | null>(null);

  // Actualizar ref con los datos de frecuencia para acceso en el loop de animación
  useEffect(() => {
    audioDataRef.current = frequencyData;
  }, [frequencyData]);

  // Actualizar ref de bloomStrength
  useEffect(() => {
    bloomStrengthRef.current = bloomStrength;
  }, [bloomStrength]);

  // Actualizar ref de emissiveIntensity
  useEffect(() => {
    emissiveIntensityRef.current = emissiveIntensity;
  }, [emissiveIntensity]);

  // Actualizar parámetros del bloom cuando cambien
  useEffect(() => {
    if (bloomPassRef.current) {
      bloomPassRef.current.threshold = bloomThreshold;
      bloomPassRef.current.radius = bloomRadius;
    }
  }, [bloomThreshold, bloomRadius]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Niebla cyberpunk - colores oscuros con tinte cyan/magenta
    const fogColor = new THREE.Color(0x0a0a15); // Azul muy oscuro, casi negro
    scene.fog = new THREE.Fog(fogColor, 10, 100); // Empieza a 10 unidades, completamente opaca a 100
    scene.background = fogColor;

    // Cámara en perspectiva
    const camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    );
    // Posición elevada para ver la ciudad
    camera.position.set(0, 25, 50);
    camera.lookAt(0, 5, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Post-procesado
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;

    // Render pass - renderiza la escena normalmente
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom pass - efecto de brillo neón
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloomStrength,
      bloomRadius,
      bloomThreshold
    );
    bloomPassRef.current = bloomPass;
    composer.addPass(bloomPass);

    // Film pass - grano cinematográfico
    const filmPass = new FilmPass(
      0.35,  // noise intensity
      0.025, // scanline intensity
      648,   // scanline count
      false  // grayscale
    );
    composer.addPass(filmPass);

    // Iluminación
    // Luz ambiental tenue
    const ambientLight = new THREE.AmbientLight(0x4444ff, 0.3);
    scene.add(ambientLight);

    // Luz direccional principal (simula luz de neón lejana)
    const directionalLight = new THREE.DirectionalLight(0xff00ff, 0.5);
    directionalLight.position.set(30, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    // Configurar el área de sombras para cubrir la ciudad
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.far = 150;
    scene.add(directionalLight);

    // Luz puntual cyan para acento cyberpunk
    const pointLight = new THREE.PointLight(0x00ffff, 1, 50);
    pointLight.position.set(-10, 5, -10);
    scene.add(pointLight);

    // Suelo - pavimento mojado estilo cyberpunk
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a12, // Gris muy oscuro, casi negro
      metalness: 0.6, // Algo metálico para reflejo
      roughness: 0.3, // Poca rugosidad = más reflectante (pavimento mojado)
      envMapIntensity: 1.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotar para que sea horizontal
    ground.position.y = 0;
    ground.receiveShadow = true; // Recibe sombras
    scene.add(ground);

    // Ciudad Brutalista
    const cityGenerator = new CityGenerator({
      gridSize: 20,           // 20x20 = 400 edificios
      spacing: 4,             // 4 unidades entre edificios
      minHeight: 3,           // Altura mínima
      maxHeight: 30,          // Altura máxima
      buildingVariation: 0.3, // 30% de variación en posición
      specialBuildingRatio: 0.25 // 25% de edificios con neón (más brillantes)
    });

    // Materiales
    const normalMaterial = createNormalBuildingMaterial();
    const specialMaterials = createAlternatingSpecialMaterials();
    specialMaterialsRef.current = specialMaterials;

    // Crear edificios normales (esto genera los datos internamente)
    const normalBuildings = cityGenerator.createNormalBuildings(normalMaterial);
    normalBuildingsMeshRef.current = normalBuildings;
    scene.add(normalBuildings);

    // Guardar datos de edificios para animación (DESPUÉS de crear los edificios)
    buildingsDataRef.current = cityGenerator.getBuildingData();

    // Crear edificios especiales (alternando cyan y magenta)
    const specialBuildingsData = cityGenerator.getSpecialBuildings();

    // Dividir edificios especiales en cyan y magenta
    const cyanBuildings = specialBuildingsData.filter((_, i) => i % 2 === 0);
    const magentaBuildings = specialBuildingsData.filter((_, i) => i % 2 !== 0);

    // Guardar para animación
    cyanBuildingsDataRef.current = cyanBuildings;
    magentaBuildingsDataRef.current = magentaBuildings;

    // Crear meshes para cada tipo
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
      cyanBuildingsMeshRef.current = cyanMesh;
      scene.add(cyanMesh);
    }

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
      magentaBuildingsMeshRef.current = magentaMesh;
      scene.add(magentaMesh);
    }

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !composerRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      composerRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let time = 0;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    // Inicializar matrices antes del loop para evitar duplicación visual
    // Sincronizar con el estado inicial de la animación (time=0, bass=0)
    if (normalBuildingsMeshRef.current && buildingsDataRef.current) {
      const normalBuildings = buildingsDataRef.current.filter(b => !b.isSpecial);
      normalBuildings.forEach((building, index) => {
        const newHeight = building.height * (1.0 + Math.sin(index * 0.1) * 0.05);
        position.set(building.x, newHeight / 2, building.z);
        scale.set(building.width, newHeight, building.depth);
        matrix.compose(position, quaternion, scale);
        normalBuildingsMeshRef.current!.setMatrixAt(index, matrix);
      });
      normalBuildingsMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (cyanBuildingsMeshRef.current && cyanBuildingsDataRef.current.length > 0) {
      cyanBuildingsDataRef.current.forEach((building, index) => {
        const newHeight = building.height * (1.0 + Math.sin(index * 0.2) * 0.08);
        position.set(building.x, newHeight / 2, building.z);
        scale.set(building.width, newHeight, building.depth);
        matrix.compose(position, quaternion, scale);
        cyanBuildingsMeshRef.current!.setMatrixAt(index, matrix);
      });
      cyanBuildingsMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (magentaBuildingsMeshRef.current && magentaBuildingsDataRef.current.length > 0) {
      magentaBuildingsDataRef.current.forEach((building, index) => {
        const newHeight = building.height * (1.0 + Math.sin(index * 0.2) * 0.08);
        position.set(building.x, newHeight / 2, building.z);
        scale.set(building.width, newHeight, building.depth);
        matrix.compose(position, quaternion, scale);
        magentaBuildingsMeshRef.current!.setMatrixAt(index, matrix);
      });
      magentaBuildingsMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Obtener datos de audio actualizados
      const audioData = audioDataRef.current;

      // Valores por defecto si no hay audio
      const bass = audioData?.bass || 0;
      const mid = audioData?.mid || 0;
      const treble = audioData?.treble || 0;
      const overall = audioData?.overall || 0;

      // 1. ESCALADO REACTIVO DE EDIFICIOS (BASS)
      const bassScale = 1 + bass * 0.3; // 1.0 a 1.3x escala

      // Animar edificios normales
      if (normalBuildingsMeshRef.current && buildingsDataRef.current) {
        const normalBuildings = buildingsDataRef.current.filter(b => !b.isSpecial);

        // Debug (solo una vez)
        if (time < 0.02) {
          console.log('Normal buildings count:', normalBuildings.length);
          console.log('First building data:', normalBuildings[0]);
        }

        normalBuildings.forEach((building, index) => {
          // Escala reactiva con animación sinusoidal suave
          const scaleMultiplier = bassScale + Math.sin(time + index * 0.1) * 0.05;
          const newHeight = building.height * scaleMultiplier;

          // Ajustar posición Y para que el edificio crezca desde el suelo
          position.set(building.x, newHeight / 2, building.z);
          scale.set(building.width, newHeight, building.depth);

          matrix.compose(position, quaternion, scale);
          normalBuildingsMeshRef.current!.setMatrixAt(index, matrix);
        });

        normalBuildingsMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      // Animar edificios especiales cyan
      if (cyanBuildingsMeshRef.current && cyanBuildingsDataRef.current.length > 0) {
        cyanBuildingsDataRef.current.forEach((building, index) => {
          const scaleMultiplier = bassScale + Math.sin(time * 1.5 + index * 0.2) * 0.08;
          const newHeight = building.height * scaleMultiplier;

          position.set(building.x, newHeight / 2, building.z);
          scale.set(building.width, newHeight, building.depth);

          matrix.compose(position, quaternion, scale);
          cyanBuildingsMeshRef.current!.setMatrixAt(index, matrix);
        });

        cyanBuildingsMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      // Animar edificios especiales magenta
      if (magentaBuildingsMeshRef.current && magentaBuildingsDataRef.current.length > 0) {
        magentaBuildingsDataRef.current.forEach((building, index) => {
          const scaleMultiplier = bassScale + Math.sin(time * 1.5 + index * 0.2) * 0.08;
          const newHeight = building.height * scaleMultiplier;

          position.set(building.x, newHeight / 2, building.z);
          scale.set(building.width, newHeight, building.depth);

          matrix.compose(position, quaternion, scale);
          magentaBuildingsMeshRef.current!.setMatrixAt(index, matrix);
        });

        magentaBuildingsMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      // 2. REACTIVIDAD DE COLOR (MID/TREBLE)
      if (specialMaterialsRef.current) {
        const baseEmissive = emissiveIntensityRef.current;

        // Cyan reacciona a medias (guitarras/voces)
        specialMaterialsRef.current.cyan.emissiveIntensity = baseEmissive + mid * 2.0;

        // Magenta reacciona a altas (platillos)
        specialMaterialsRef.current.magenta.emissiveIntensity = baseEmissive + treble * 2.0;
      }

      // Luz puntual reacciona al overall
      if (pointLight) {
        pointLight.intensity = 1 + overall * 2; // 1 a 3
      }

      // Bloom reactivo al audio - pulsa con la música
      if (bloomPassRef.current) {
        const baseStrength = bloomStrengthRef.current;
        bloomPassRef.current.strength = baseStrength + overall * 1.2;
      }

      // 3. MOVIMIENTO DE CÁMARA (TRAVELLING)
      if (cameraRef.current) {
        // Movimiento circular suave alrededor de la ciudad
        const radius = 60;
        const speed = 0.05;
        const angle = time * speed;

        cameraRef.current.position.x = Math.cos(angle) * radius;
        cameraRef.current.position.z = Math.sin(angle) * radius;
        cameraRef.current.position.y = 25 + Math.sin(time * 0.3) * 5; // Sube y baja suavemente

        // Siempre mirar hacia el centro de la ciudad
        cameraRef.current.lookAt(0, 10, 0);
      }

      // Renderizar con post-procesado
      if (composerRef.current) {
        composerRef.current.render();
      }
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);

      // Limpiar escena
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(mat => mat.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
        sceneRef.current.clear();
      }

      // Limpiar renderer
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      // Limpiar refs
      normalBuildingsMeshRef.current = null;
      cyanBuildingsMeshRef.current = null;
      magentaBuildingsMeshRef.current = null;
    };
  }, []);

  // Handler para cargar archivo de audio
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await loadAudioFile(file);
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          margin: 0,
          padding: 0
        }}
      />

      {/* Audio Controls UI */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'rgba(10, 10, 21, 0.8)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          color: '#00ffff',
          fontFamily: 'monospace'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', color: '#ff00ff' }}>
          AUDIO REACTOR
        </h3>

        <label
          htmlFor="audio-upload"
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            border: '1px solid #00ffff',
            borderRadius: '4px',
            cursor: 'pointer',
            textAlign: 'center',
            fontSize: '12px',
            transition: 'all 0.3s'
          }}
        >
          LOAD AUDIO FILE
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>

        {audioDataRef.current && (
          <>
            <button
              onClick={toggle}
              style={{
                padding: '8px 16px',
                backgroundColor: isPlaying
                  ? 'rgba(255, 0, 255, 0.2)'
                  : 'rgba(0, 255, 255, 0.2)',
                border: `1px solid ${isPlaying ? '#ff00ff' : '#00ffff'}`,
                borderRadius: '4px',
                color: isPlaying ? '#ff00ff' : '#00ffff',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}
            >
              {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
            </button>

            <div style={{ fontSize: '10px', marginTop: '10px' }}>
              <div>BASS: {(audioDataRef.current.bass * 100).toFixed(0)}%</div>
              <div>MID: {(audioDataRef.current.mid * 100).toFixed(0)}%</div>
              <div>TREBLE: {(audioDataRef.current.treble * 100).toFixed(0)}%</div>
            </div>
          </>
        )}
      </div>

      {/* Post-Processing Controls */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          backgroundColor: 'rgba(10, 10, 21, 0.8)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 0, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          color: '#ff00ff',
          fontFamily: 'monospace',
          minWidth: '250px'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', color: '#00ffff' }}>
          POST-PROCESSING
        </h3>

        {/* Bloom Strength */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '5px' }}>
            BLOOM STRENGTH: {bloomStrength.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={bloomStrength}
            onChange={(e) => setBloomStrength(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#ff00ff'
            }}
          />
        </div>

        {/* Bloom Threshold */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '5px' }}>
            BLOOM THRESHOLD: {bloomThreshold.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={bloomThreshold}
            onChange={(e) => setBloomThreshold(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#ff00ff'
            }}
          />
        </div>

        {/* Bloom Radius */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '5px' }}>
            BLOOM RADIUS: {bloomRadius.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={bloomRadius}
            onChange={(e) => setBloomRadius(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#ff00ff'
            }}
          />
        </div>

        {/* Emissive Intensity */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '5px' }}>
            EMISSIVE INTENSITY: {emissiveIntensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={emissiveIntensity}
            onChange={(e) => setEmissiveIntensity(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#ff00ff'
            }}
          />
        </div>

        <div style={{ fontSize: '9px', marginTop: '5px', opacity: 0.7 }}>
          Tip: Lower threshold = more glow
        </div>
      </div>
    </>
  );
};

export default ThreeScene;
