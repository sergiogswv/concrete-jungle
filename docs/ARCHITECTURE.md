# 🏗️ Arquitectura del Sistema - Concrete Jungle

## 📐 Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│                     (React Components)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          ThreeScene.refactored.tsx                   │  │
│  │          (Orchestration Component)                   │  │
│  │                                                       │  │
│  │  - Coordina hooks                                    │  │
│  │  - Gestiona ciclo de vida                            │  │
│  │  - Renderiza UI                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│          ┌──────────────┼──────────────┐                    │
│          ▼              ▼               ▼                    │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐     │
│  │   Audio     │ │    Post     │ │   Container      │     │
│  │  Controls   │ │ Processing  │ │   (Canvas)       │     │
│  │             │ │  Controls   │ │                  │     │
│  └─────────────┘ └─────────────┘ └──────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                    │
│                       (Custom Hooks)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    useAudio  │  │   useAudio   │  │   useScene   │      │
│  │   Analyzer   │  │  Smoothing   │  │    Config    │      │
│  │              │  │              │  │              │      │
│  │ - loadFile   │  │ - lerp       │  │ - state mgmt │      │
│  │ - play/pause │  │ - smooth     │  │ - refs sync  │      │
│  │ - FreqData   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       UTILITY LAYER                          │
│                    (Pure Functions)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐      ┌─────────────────────┐       │
│  │  animationHelpers   │      │    sceneSetup       │       │
│  │                     │      │                     │       │
│  │  - lerp()           │      │  - createScene()    │       │
│  │  - calcScale()      │      │  - createCamera()   │       │
│  │  - handleScroll()   │      │  - createLighting() │       │
│  │  - updateMatrix()   │      │  - createGround()   │       │
│  │  - calcCameraPos()  │      │  - cleanupScene()   │       │
│  │                     │      │                     │       │
│  └─────────────────────┘      └─────────────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                           │
│                    (Business Objects)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐      ┌─────────────────────┐       │
│  │   AudioAnalyzer     │      │   CityGenerator     │       │
│  │                     │      │                     │       │
│  │  - FFT Analysis     │      │  - Procedural Gen   │       │
│  │  - Freq Extraction  │      │  - InstancedMesh    │       │
│  │  - Normalization    │      │  - Building Data    │       │
│  │                     │      │                     │       │
│  └─────────────────────┘      └─────────────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      EXTERNAL LAYER                          │
│                  (Third-Party Libraries)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │ Three.js │    │   React  │    │   Web    │             │
│   │          │    │          │    │   Audio  │             │
│   │ - Scene  │    │ - Hooks  │    │   API    │             │
│   │ - Mesh   │    │ - State  │    │          │             │
│   │ - Camera │    │ - Effects│    │          │             │
│   └──────────┘    └──────────┘    └──────────┘             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

### 1. Inicialización

```
User Action (Load Audio)
    ↓
AudioControls.onFileUpload()
    ↓
ThreeScene.handleFileUpload()
    ↓
useAudioAnalyzer.loadAudioFile()
    ↓
AudioAnalyzer.loadAudioFile()
    ↓
Web Audio API (setup AnalyserNode)
    ↓
audioDataRef.current = null → FrequencyData
```

### 2. Animation Loop (60 FPS)

```
requestAnimationFrame()
    ↓
1. Get Raw Audio Data
   audioDataRef.current → { bass, mid, treble, overall }
    ↓
2. Apply Smoothing
   useAudioSmoothing.applySmoothingToAudio()
   → lerp() for each frequency band
    ↓
3. Calculate Scales
   calculateBuildingScale(bassScale, time, index, isSpecial)
    ↓
4. Update Buildings
   handleInfiniteScroll() → building.z += speed
   updateBuildingMatrix() → mesh.setMatrixAt()
    ↓
5. Update Materials
   specialMaterials.cyan.emissiveIntensity = base + mid * 2
   specialMaterials.magenta.emissiveIntensity = base + treble * 2
    ↓
6. Update Camera
   if (infiniteScroll)
     → calculateScrollCameraPosition()
   else
     → calculateCircularCameraPosition()
    ↓
7. Render Frame
   composer.render()
```

### 3. Configuration Update

```
User Adjusts Slider
    ↓
PostProcessingControls.onChange()
    ↓
useSceneConfig.updateSceneConfig() / updatePostProcessing()
    ↓
State Update → Triggers useEffect
    ↓
Ref Update (scrollSpeedRef.current = newValue)
    ↓
Animation Loop uses updated ref
```

---

## 🎯 Dependency Graph

```
ThreeScene.refactored.tsx
├─── useAudioAnalyzer
│    └─── AudioAnalyzer
│         └─── Web Audio API
├─── useAudioSmoothing
│    └─── animationHelpers.lerp()
├─── useSceneConfig
├─── AudioControls (component)
├─── PostProcessingControls (component)
├─── sceneSetup utilities
│    ├─── createScene()
│    ├─── createCamera()
│    ├─── createRenderer()
│    ├─── createLighting()
│    ├─── createGround()
│    ├─── createPostProcessing()
│    └─── cleanupScene()
├─── animationHelpers utilities
│    ├─── lerp()
│    ├─── calculateBuildingScale()
│    ├─── handleInfiniteScroll()
│    ├─── updateBuildingMatrix()
│    ├─── calculateCircularCameraPosition()
│    └─── calculateScrollCameraPosition()
└─── CityGenerator
     └─── materials (createNormalBuildingMaterial, etc.)
```

---

## 📦 Módulos y Responsabilidades

### Components (Presentación)

| Componente | Responsabilidad | Props In | Props Out |
|------------|----------------|----------|-----------|
| `ThreeScene` | Orquestación | - | - |
| `AudioControls` | UI de audio | 4 props | 2 callbacks |
| `PostProcessingControls` | UI de efectos | 4 props | 2 callbacks |

### Hooks (Lógica de Negocio)

| Hook | Responsabilidad | Input | Output |
|------|----------------|-------|--------|
| `useAudioAnalyzer` | Web Audio API | params | { loadFile, play, pause, toggle, isPlaying } |
| `useAudioSmoothing` | Smoothing con lerp | - | { smoothedAudioRef, applySmoothingToAudio } |
| `useSceneConfig` | Config management | - | { config, refs, update functions } |

### Utils (Funciones Puras)

| Utilidad | Responsabilidad | Funciones |
|----------|----------------|-----------|
| `animationHelpers` | Cálculos de animación | 8 funciones puras |
| `sceneSetup` | Setup de Three.js | 7 funciones de factory |

### Domain (Objetos de Negocio)

| Clase | Responsabilidad | Métodos |
|-------|----------------|---------|
| `AudioAnalyzer` | FFT Analysis | getFrequencyData, loadAudioFile, play, pause |
| `CityGenerator` | Procedural Generation | createNormalBuildings, getSpecialBuildings |

---

## 🔐 Principios de Diseño

### 1. Separation of Concerns

```
UI Layer (Components)
  ↕ Props/Callbacks
Business Logic (Hooks)
  ↕ Function Calls
Utilities (Pure Functions)
  ↕ Data Transforms
Domain (Classes)
  ↕ Methods
External APIs (Three.js, Web Audio)
```

### 2. Unidirectional Data Flow

```
User Input → State Update → Ref Sync → Animation Loop → Render
                ↓
           Side Effects
           (Audio, Scene Setup)
```

### 3. Dependency Injection

```typescript
// ✅ BIEN: Dependencias inyectadas
<AudioControls
  onFileUpload={handleFileUpload}
  onTogglePlayback={toggle}
/>

// ❌ MAL: Dependencias hardcodeadas
function AudioControls() {
  const audioAnalyzer = new AudioAnalyzer();
}
```

### 4. Immutability

```typescript
// ✅ BIEN: Nuevo objeto, no mutación
setSceneConfig(prev => ({ ...prev, cityGridSize: 50 }));

// ❌ MAL: Mutación directa
sceneConfig.cityGridSize = 50;
```

---

## 🎨 Patrones de Diseño Aplicados

### 1. Factory Pattern
```typescript
export function createScene(): THREE.Scene { }
export function createCamera(): THREE.PerspectiveCamera { }
```

### 2. Strategy Pattern
```typescript
// Diferentes estrategias de movimiento de cámara
if (infiniteScroll) {
  calculateScrollCameraPosition();
} else {
  calculateCircularCameraPosition();
}
```

### 3. Observer Pattern
```typescript
// Refs observan cambios sin causar re-renders
useEffect(() => {
  scrollSpeedRef.current = scrollSpeed;
}, [scrollSpeed]);
```

### 4. Custom Hook Pattern
```typescript
const { smoothedAudioRef, applySmoothingToAudio } = useAudioSmoothing();
```

### 5. Dependency Injection
```typescript
<PostProcessingControls
  sceneConfig={sceneConfig}
  onSceneConfigChange={updateSceneConfig}
/>
```

---

## 📊 Performance Optimizations

### 1. InstancedMesh
- **Before**: N meshes → N draw calls
- **After**: 1 mesh → 1 draw call
- **Result**: 10,000 edificios = 3 draw calls

### 2. Refs over State
- **Before**: State updates → 60 re-renders/second
- **After**: Ref updates → 0 re-renders
- **Result**: Smooth 60 FPS

### 3. Memoization
```typescript
const handleFileUpload = useCallback(async (event) => {
  // No recreated on every render
}, [loadAudioFile]);
```

### 4. Early Returns
```typescript
if (!mesh || buildings.length === 0) {
  return; // Exit early, no unnecessary work
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Utils)
```typescript
// Test pure functions
describe('lerp', () => {
  it('should interpolate correctly', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});
```

### Integration Tests (Hooks)
```typescript
// Test hooks
describe('useAudioSmoothing', () => {
  it('should smooth audio data', () => {
    const { result } = renderHook(() => useAudioSmoothing());
    // Test smoothing logic
  });
});
```

### Component Tests
```typescript
// Test components
describe('AudioControls', () => {
  it('should render audio controls', () => {
    render(<AudioControls {...props} />);
    // Test UI
  });
});
```

---

## 🚀 Escalabilidad

### Agregar Nueva Feature: "Particles System"

#### 1. Crear Utilidad
```typescript
// utils/particleHelpers.ts
export function updateParticlePositions(
  particles: ParticleData[],
  audioData: AudioSmoothingConfig
): void { }
```

#### 2. Crear Hook (si necesario)
```typescript
// hooks/useParticleSystem.ts
export function useParticleSystem() {
  // Lógica de partículas
}
```

#### 3. Integrar en ThreeScene
```typescript
// ThreeScene.refactored.tsx
const { particles, updateParticles } = useParticleSystem();

// En animation loop:
updateParticles(smoothedAudio);
```

**Sin modificar código existente** ✅ (Open/Closed Principle)

---

## 📚 Referencias de Arquitectura

- **Clean Architecture** - Robert C. Martin
- **SOLID Principles** - Robert C. Martin
- **Presentational and Container Components** - Dan Abramov
- **Custom Hooks Best Practices** - React Team
- **Performance Optimization** - Three.js Docs

---

**Documentado por**: Arquitectura de Software
**Última actualización**: 2026-02-02
**Versión**: 1.0.0
