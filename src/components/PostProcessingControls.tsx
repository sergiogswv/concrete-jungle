import React from 'react';
import type { SceneConfig, PostProcessingConfig } from '../types/scene.types';

interface PostProcessingControlsProps {
  sceneConfig: SceneConfig;
  postProcessingConfig: PostProcessingConfig;
  onSceneConfigChange: (updates: Partial<SceneConfig>) => void;
  onPostProcessingChange: (updates: Partial<PostProcessingConfig>) => void;
}

const PANEL_STYLE: React.CSSProperties = {
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
  minWidth: '250px',
};

const SLIDER_STYLE: React.CSSProperties = {
  width: '100%',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  display: 'block',
  marginBottom: '5px',
};

const SECTION_DIVIDER: React.CSSProperties = {
  borderTop: '1px solid rgba(255, 0, 255, 0.2)',
  paddingTop: '15px',
  marginTop: '15px',
};

const HINT_STYLE: React.CSSProperties = {
  fontSize: '9px',
  marginTop: '5px',
  opacity: 0.7,
};

/**
 * Post-processing controls component
 * Provides UI for adjusting visual effects and scene parameters
 */
export const PostProcessingControls: React.FC<PostProcessingControlsProps> = ({
  sceneConfig,
  postProcessingConfig,
  onSceneConfigChange,
  onPostProcessingChange,
}) => {
  return (
    <div style={PANEL_STYLE}>
      <h3 style={{ margin: 0, fontSize: '14px', color: '#00ffff' }}>POST-PROCESSING</h3>

      {/* City Size Control */}
      <div style={{ borderBottom: '1px solid rgba(255, 0, 255, 0.2)', paddingBottom: '10px' }}>
        <label style={LABEL_STYLE}>
          CITY SIZE: {sceneConfig.cityGridSize}x{sceneConfig.cityGridSize} ={' '}
          {sceneConfig.cityGridSize * sceneConfig.cityGridSize} edificios
        </label>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={sceneConfig.cityGridSize}
          onChange={(e) => onSceneConfigChange({ cityGridSize: parseInt(e.target.value) })}
          style={{ ...SLIDER_STYLE, accentColor: '#00ffff' }}
        />
        <div style={{ ...HINT_STYLE, color: '#ffaa00' }}>⚠️ Cambiar recreará la escena</div>
      </div>

      {/* Bloom Strength */}
      <SliderControl
        label="BLOOM STRENGTH"
        value={postProcessingConfig.bloomStrength}
        min={0}
        max={5}
        step={0.1}
        accentColor="#ff00ff"
        onChange={(value) => onPostProcessingChange({ bloomStrength: value })}
      />

      {/* Bloom Threshold */}
      <SliderControl
        label="BLOOM THRESHOLD"
        value={postProcessingConfig.bloomThreshold}
        min={0}
        max={1}
        step={0.05}
        accentColor="#ff00ff"
        onChange={(value) => onPostProcessingChange({ bloomThreshold: value })}
      />

      {/* Bloom Radius */}
      <SliderControl
        label="BLOOM RADIUS"
        value={postProcessingConfig.bloomRadius}
        min={0}
        max={1.5}
        step={0.05}
        accentColor="#ff00ff"
        onChange={(value) => onPostProcessingChange({ bloomRadius: value })}
      />

      {/* Emissive Intensity */}
      <SliderControl
        label="EMISSIVE INTENSITY"
        value={postProcessingConfig.emissiveIntensity}
        min={0}
        max={3}
        step={0.1}
        accentColor="#ff00ff"
        onChange={(value) => onPostProcessingChange({ emissiveIntensity: value })}
      />

      {/* Audio Smoothing */}
      <div style={{ ...SECTION_DIVIDER, borderColor: 'rgba(0, 255, 255, 0.2)' }}>
        <SliderControl
          label="AUDIO SMOOTHING"
          value={sceneConfig.smoothingFactor}
          min={0.01}
          max={1}
          step={0.01}
          accentColor="#00ffff"
          labelColor="#00ffff"
          onChange={(value) => onSceneConfigChange({ smoothingFactor: value })}
        />
        <div style={HINT_STYLE}>Menor = más suave | Mayor = más reactivo</div>
      </div>

      {/* Infinite Scroll */}
      <div style={SECTION_DIVIDER}>
        <label style={{ ...LABEL_STYLE, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={sceneConfig.infiniteScroll}
            onChange={(e) => onSceneConfigChange({ infiniteScroll: e.target.checked })}
            style={{ marginRight: '8px', accentColor: '#00ffff' }}
          />
          INFINITE SCROLL {sceneConfig.infiniteScroll ? '✓' : ''}
        </label>

        {sceneConfig.infiniteScroll && (
          <SliderControl
            label="SPEED"
            value={sceneConfig.scrollSpeed}
            min={0.1}
            max={2}
            step={0.1}
            accentColor="#00ffff"
            onChange={(value) => onSceneConfigChange({ scrollSpeed: value })}
          />
        )}
      </div>

      <div style={HINT_STYLE}>Tip: Lower threshold = more glow</div>
    </div>
  );
};

/**
 * Reusable slider control component
 */
interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  accentColor: string;
  labelColor?: string;
  onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  accentColor,
  labelColor,
  onChange,
}) => {
  return (
    <div>
      <label style={{ ...LABEL_STYLE, color: labelColor }}>
        {label}: {value.toFixed(2)}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ ...SLIDER_STYLE, accentColor }}
      />
    </div>
  );
};
