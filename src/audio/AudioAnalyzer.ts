export interface FrequencyData {
  bass: number;      // 0-1 (frecuencias bajas: 20-200 Hz)
  mid: number;       // 0-1 (frecuencias medias: 200-2000 Hz)
  treble: number;    // 0-1 (frecuencias altas: 2000-20000 Hz)
  overall: number;   // 0-1 (promedio general)
  raw: Uint8Array;   // Array completo de frecuencias (0-255)
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private audioElement: HTMLAudioElement | null = null;

  // Configuración del analizador
  private fftSize = 2048; // Más alto = más precisión pero más costo computacional
  private smoothingTimeConstant = 0.8; // 0-1, mayor valor = más suavizado

  constructor() {
    // Inicialización lazy - se crea cuando se necesita
  }

  /**
   * Inicializa el AudioContext y el AnalyserNode
   */
  private initAudioContext(): void {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyserNode = this.audioContext.createAnalyser();

    // Configuración del analizador
    this.analyserNode.fftSize = this.fftSize;
    this.analyserNode.smoothingTimeConstant = this.smoothingTimeConstant;

    // Buffer para almacenar los datos de frecuencia
    const bufferLength = this.analyserNode.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  /**
   * Carga y conecta un archivo de audio
   */
  async loadAudioFile(file: File): Promise<HTMLAudioElement> {
    this.initAudioContext();
    if (!this.audioContext || !this.analyserNode) {
      throw new Error('AudioContext not initialized');
    }

    // Crear elemento de audio
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.crossOrigin = 'anonymous';

    this.audioElement = audio;

    // Conectar el audio al analizador
    if (!this.sourceNode) {
      this.sourceNode = this.audioContext.createMediaElementSource(audio);
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
    }

    return audio;
  }

  /**
   * Carga audio desde una URL
   */
  async loadAudioURL(url: string): Promise<HTMLAudioElement> {
    this.initAudioContext();
    if (!this.audioContext || !this.analyserNode) {
      throw new Error('AudioContext not initialized');
    }

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    this.audioElement = audio;

    if (!this.sourceNode) {
      this.sourceNode = this.audioContext.createMediaElementSource(audio);
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
    }

    return audio;
  }

  /**
   * Obtiene los datos de frecuencia actuales y los normaliza
   */
  getFrequencyData(): FrequencyData | null {
    if (!this.analyserNode || !this.dataArray) {
      return null;
    }

    // Obtener datos de frecuencia (0-255)
    this.analyserNode.getByteFrequencyData(this.dataArray);

    const bufferLength = this.dataArray.length;

    // Dividir el espectro en bandas (bass, mid, treble)
    // El espectro va de 0 Hz a sampleRate/2 (típicamente 22050 Hz)
    const bassEnd = Math.floor(bufferLength * 0.1); // ~10% del espectro para bass
    const midEnd = Math.floor(bufferLength * 0.5);  // ~40% para mid

    // Calcular promedios para cada banda y normalizar (0-255 -> 0-1)
    const bass = this.normalizeFrequencyRange(0, bassEnd);
    const mid = this.normalizeFrequencyRange(bassEnd, midEnd);
    const treble = this.normalizeFrequencyRange(midEnd, bufferLength);
    const overall = this.normalizeFrequencyRange(0, bufferLength);

    return {
      bass,
      mid,
      treble,
      overall,
      raw: new Uint8Array(this.dataArray) // Copia del array completo
    };
  }

  /**
   * Calcula el promedio de un rango de frecuencias y lo normaliza a 0-1
   */
  private normalizeFrequencyRange(start: number, end: number): number {
    if (!this.dataArray) return 0;

    let sum = 0;
    let count = 0;

    for (let i = start; i < end; i++) {
      sum += this.dataArray[i];
      count++;
    }

    const average = count > 0 ? sum / count : 0;

    // Normalizar de 0-255 a 0-1
    return average / 255;
  }

  /**
   * Resume el AudioContext (necesario después de interacción del usuario)
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Obtiene el estado del AudioContext
   */
  getState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  /**
   * Reproduce el audio
   */
  play(): void {
    this.audioElement?.play();
    this.resume();
  }

  /**
   * Pausa el audio
   */
  pause(): void {
    this.audioElement?.pause();
  }

  /**
   * Detiene y limpia los recursos
   */
  dispose(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyserNode = null;
    this.dataArray = null;
  }

  /**
   * Obtiene el elemento de audio actual
   */
  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }
}
