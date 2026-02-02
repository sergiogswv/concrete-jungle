# 🌃 Concrete Jungle - Cyberpunk Audio Visualizer

Un visualizador de audio reactivo en 3D con estética cyberpunk brutalista, construido con Three.js, React y TypeScript.

![Cyberpunk City](https://img.shields.io/badge/Style-Cyberpunk-ff00ff?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)

## ✨ Características

- 🏙️ **Ciudad Procedural**: Generación de ciudad con InstancedMesh (hasta 10,000 edificios)
- 🎵 **Audio Reactivo**: Web Audio API con análisis de frecuencias (bass, mid, treble)
- 💫 **Post-Processing**: Bloom neón, efectos de film y grano cinematográfico
- 🔄 **Infinite Scroll**: Sistema de teleportación para movimiento continuo
- 🎛️ **Controles en Tiempo Real**: Ajustes de bloom, emisión, suavizado y velocidad
- ⚡ **Optimizado**: 3 draw calls para miles de edificios usando InstancedMesh
- 🎨 **Materiales Emissivos**: Edificios con neón cyan y magenta reactivos al audio
- 🌫️ **Atmósfera Cyberpunk**: Niebla volumétrica y colores oscuros

## 🎮 Controles

### Panel Izquierdo - Audio Reactor
- **LOAD AUDIO FILE**: Carga tu archivo de audio (MP3, WAV, etc.)
- **PLAY/PAUSE**: Control de reproducción

### Panel Derecho - Post-Processing
- **CITY SIZE**: Tamaño de la ciudad (10x10 a 100x100 edificios)
- **BLOOM STRENGTH**: Intensidad del efecto de brillo neón (0-5)
- **BLOOM THRESHOLD**: Umbral para activar el bloom (0-1)
- **BLOOM RADIUS**: Radio de difusión del bloom (0-1.5)
- **EMISSIVE INTENSITY**: Intensidad base de emisión de edificios especiales (0-3)
- **AUDIO SMOOTHING**: Factor de suavizado de datos de audio (0.01-1)
  - Menor = transiciones más suaves
  - Mayor = respuesta más reactiva
- **INFINITE SCROLL**: Activa/desactiva movimiento infinito
- **SPEED**: Velocidad del scroll infinito (0.1-2)

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd concrete-jungle

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build
```

## 📦 Tecnologías

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Three.js** - Motor de renderizado 3D
- **Web Audio API** - Análisis de audio en tiempo real
- **Vite** - Build tool y dev server
- **InstancedMesh** - Renderizado optimizado de geometría

## 🏗️ Estructura del Proyecto

```
concrete-jungle/
├── src/
│   ├── components/
│   │   └── ThreeScene.tsx          # Componente principal de la escena 3D
│   ├── audio/
│   │   └── AudioAnalyzer.ts        # Clase para análisis de frecuencias
│   ├── hooks/
│   │   └── useAudioAnalyzer.ts     # Hook personalizado para audio
│   ├── city/
│   │   ├── CityGenerator.ts        # Generador procedural de ciudad
│   │   └── materials.ts            # Materiales brutalistas y neón
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
└── README.md
```

## 🎨 Cómo Funciona

### 1. **Generación de Ciudad (CityGenerator)**
```typescript
- Grid procedural con spacing configurable
- Alturas aleatorias (minHeight a maxHeight)
- 25% edificios especiales con neón (cyan/magenta)
- Variación de posición para aspecto orgánico
```

### 2. **Análisis de Audio (AudioAnalyzer)**
```typescript
- AnalyserNode con FFT de 2048
- Rangos de frecuencia:
  - Bass: 20-150 Hz (kicks, bajos)
  - Mid: 150-4000 Hz (guitarras, voces)
  - Treble: 4000-20000 Hz (platillos, hi-hats)
- Normalización: 0-255 → 0-1
```

### 3. **Smoothing con Lerp**
```typescript
smoothed = current + (target - current) * smoothingFactor

- Elimina saltos bruscos en datos de audio
- Factor configurable (0.01-1.0)
- Transiciones fluidas entre estados
```

### 4. **Reactividad Visual**
- **Bass** → Escala de altura de edificios (1.0 a 1.3x)
- **Mid** → Intensidad emissiva de edificios cyan
- **Treble** → Intensidad emissiva de edificios magenta
- **Overall** → Intensidad de bloom y luces puntuales

### 5. **Post-Processing Pipeline**
```typescript
EffectComposer
  ├── RenderPass (escena base)
  ├── UnrealBloomPass (brillo neón)
  └── FilmPass (grano + scanlines)
```

## ⚡ Optimizaciones de Performance

### InstancedMesh
- **1 InstancedMesh** para edificios normales
- **1 InstancedMesh** para edificios cyan
- **1 InstancedMesh** para edificios magenta
- **Total: 3 draw calls** independientemente del número de edificios

### Refs sobre State
- `audioDataRef` - Actualización sin re-renders (60 FPS)
- `smoothedAudioRef` - Valores suavizados
- `bloomStrengthRef`, `emissiveIntensityRef` - Controles en tiempo real
- `scrollSpeedRef`, `infiniteScrollRef` - Movimiento sin deps

### Cleanup Apropiado
- `cancelAnimationFrame` al desmontar
- Dispose de geometrías y materiales
- Limpieza de event listeners

## 🎯 Características Técnicas Destacadas

### Infinite Scroll
```typescript
// Sistema de teleportación
if (building.z > distanceThreshold) {
  building.z -= respawnDistance;
}
```

### Audio Smoothing
```typescript
// Lerp para transiciones fluidas
const lerp = (current, target, factor) =>
  current + (target - current) * factor;
```

### Matrix Composition
```typescript
// Transformaciones eficientes con Matrix4
matrix.compose(position, quaternion, scale);
mesh.setMatrixAt(index, matrix);
```

## 🎨 Paleta de Colores

- **Background/Fog**: `#0a0a15` - Azul muy oscuro
- **Edificios normales**: `#1a1a24` - Gris brutalista
- **Neón Cyan**: `#00ffff` - Edificios especiales
- **Neón Magenta**: `#ff00ff` - Edificios especiales
- **Suelo**: `#0a0a12` - Pavimento mojado

## 🔮 Posibles Mejoras Futuras

- [ ] Selector de presets (Chill, EDM, Rock, etc.)
- [ ] Exportar video de la visualización
- [ ] Múltiples formas de edificios (cilindros, pirámides)
- [ ] Partículas reactivas al audio
- [ ] Visualización de espectro de frecuencias (barras)
- [ ] Modo VR con WebXR
- [ ] Conexión con streaming (Spotify, SoundCloud)
- [ ] Editor de ciudades personalizado
- [ ] Reflejo en tiempo real del suelo (SSR)
- [ ] Sistema de clima (lluvia, niebla dinámica)

## 🎵 Géneros Recomendados

Este visualizador funciona especialmente bien con:
- **Synthwave** / Retrowave
- **Cyberpunk** / Darksynth
- **Electronic** / EDM
- **Drum & Bass**
- **Lo-fi Hip Hop**
- **Industrial** / EBM

## 📝 Notas de Desarrollo

### ¿Por qué no React.StrictMode?
StrictMode causa doble montaje en desarrollo, lo que creaba ciudades duplicadas. Se removió para evitar este comportamiento.

### ¿Por qué refs en lugar de state para audio?
El análisis de audio ocurre a 60 FPS. Usar `useState` causaría 60 re-renders por segundo, impactando severamente el performance. Las refs permiten actualizar valores sin triggear re-renders.

### ¿Por qué no useEffect dependencies para smoothing/scroll?
Los valores de smoothing y scroll se usan dentro del loop de animación que se ejecuta cada frame. Agregar estas dependencias al useEffect recrearía toda la escena innecesariamente. Las refs sincronizan los valores sin recrear la escena.

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto para aprender o crear tus propias visualizaciones.

## 🙏 Agradecimientos

- [Three.js](https://threejs.org/) - Motor 3D increíble
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Por hacer posible el análisis de audio
- Inspiración: Blade Runner, Cyberpunk 2077, y la estética synthwave

---

**Hecho con 💜 y ☕ por un amante del cyberpunk**

¿Encontraste un bug? ¿Tienes ideas? ¡Abre un issue o PR!
