import React from 'react';

interface AudioControlsProps {
  isPlaying: boolean;
  hasAudioLoaded: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePlayback: () => void;
}

const PANEL_STYLE: React.CSSProperties = {
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
  fontFamily: 'monospace',
};

const TITLE_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#ff00ff',
};

const BUTTON_STYLE: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: 'rgba(0, 255, 255, 0.1)',
  border: '1px solid #00ffff',
  borderRadius: '4px',
  cursor: 'pointer',
  textAlign: 'center',
  fontSize: '12px',
  transition: 'all 0.3s',
};

const STATUS_STYLE: React.CSSProperties = {
  fontSize: '10px',
  marginTop: '10px',
  opacity: 0.7,
};

/**
 * Audio control panel component
 * Handles file upload and playback controls
 */
export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  hasAudioLoaded,
  onFileUpload,
  onTogglePlayback,
}) => {
  const getPlaybackButtonStyle = (): React.CSSProperties => ({
    ...BUTTON_STYLE,
    backgroundColor: isPlaying ? 'rgba(255, 0, 255, 0.2)' : 'rgba(0, 255, 255, 0.2)',
    border: `1px solid ${isPlaying ? '#ff00ff' : '#00ffff'}`,
    color: isPlaying ? '#ff00ff' : '#00ffff',
    fontWeight: 'bold',
  });

  return (
    <div style={PANEL_STYLE}>
      <h3 style={TITLE_STYLE}>AUDIO REACTOR</h3>

      <label htmlFor="audio-upload" style={BUTTON_STYLE}>
        LOAD AUDIO FILE
        <input
          id="audio-upload"
          type="file"
          accept="audio/*"
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />
      </label>

      {hasAudioLoaded && (
        <>
          <button onClick={onTogglePlayback} style={getPlaybackButtonStyle()}>
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </button>

          <div style={STATUS_STYLE}>Audio reactivo activo ✓</div>
        </>
      )}
    </div>
  );
};
