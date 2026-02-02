import * as THREE from 'three';

export interface BuildingData {
  x: number;
  y: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  isSpecial: boolean; // Edificio con neón
  instanceId: number;
}

export interface CityConfig {
  gridSize: number;        // Tamaño de la cuadrícula (ej: 20 = 20x20 edificios)
  spacing: number;         // Espacio entre edificios
  minHeight: number;       // Altura mínima de edificios
  maxHeight: number;       // Altura máxima de edificios
  buildingVariation: number; // Variación de posición (0-1)
  specialBuildingRatio: number; // % de edificios especiales (0-1)
}

export class CityGenerator {
  private buildings: BuildingData[] = [];
  private config: CityConfig;

  constructor(config: Partial<CityConfig> = {}) {
    // Configuración por defecto
    this.config = {
      gridSize: 20,
      spacing: 4,
      minHeight: 3,
      maxHeight: 30,
      buildingVariation: 0.3,
      specialBuildingRatio: 0.1,
      ...config
    };
  }

  /**
   * Genera los datos de los edificios
   */
  private generateBuildingData(): BuildingData[] {
    const buildings: BuildingData[] = [];
    const { gridSize, spacing, minHeight, maxHeight, buildingVariation, specialBuildingRatio } = this.config;

    const halfGrid = (gridSize * spacing) / 2;
    let instanceId = 0;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Posición base en la cuadrícula
        const baseX = i * spacing - halfGrid;
        const baseZ = j * spacing - halfGrid;

        // Variación aleatoria en posición
        const variationX = (Math.random() - 0.5) * spacing * buildingVariation;
        const variationZ = (Math.random() - 0.5) * spacing * buildingVariation;

        // Altura aleatoria
        const height = minHeight + Math.random() * (maxHeight - minHeight);

        // Variación en ancho y profundidad (mantener aspecto brutalista)
        const baseSize = 1.5;
        const width = baseSize + Math.random() * 0.5;
        const depth = baseSize + Math.random() * 0.5;

        // Determinar si es un edificio especial (con neón)
        const isSpecial = Math.random() < specialBuildingRatio;

        buildings.push({
          x: baseX + variationX,
          y: height / 2, // Centro del edificio
          z: baseZ + variationZ,
          height,
          width,
          depth,
          isSpecial,
          instanceId: instanceId++
        });
      }
    }

    return buildings;
  }

  /**
   * Crea el InstancedMesh para edificios normales
   */
  createNormalBuildings(material: THREE.Material): THREE.InstancedMesh {
    this.buildings = this.generateBuildingData();
    const normalBuildings = this.buildings.filter(b => !b.isSpecial);

    // Geometría base (cubo unitario que escalaremos con matrices)
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // InstancedMesh
    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      normalBuildings.length
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Matriz temporal para transformaciones
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();

    // Configurar cada instancia
    normalBuildings.forEach((building, index) => {
      position.set(building.x, building.y, building.z);
      scale.set(building.width, building.height, building.depth);

      matrix.compose(
        position,
        new THREE.Quaternion(), // Sin rotación
        scale
      );

      mesh.setMatrixAt(index, matrix);
    });

    // Actualizar el mesh
    mesh.instanceMatrix.needsUpdate = true;

    return mesh;
  }

  /**
   * Crea el InstancedMesh para edificios especiales (con neón)
   */
  createSpecialBuildings(material: THREE.Material): THREE.InstancedMesh | null {
    const specialBuildings = this.buildings.filter(b => b.isSpecial);

    if (specialBuildings.length === 0) {
      return null;
    }

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      specialBuildings.length
    );
    mesh.castShadow = true;
    mesh.receiveShadow = false; // Los emisivos no reciben sombras bien

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();

    specialBuildings.forEach((building, index) => {
      position.set(building.x, building.y, building.z);
      scale.set(building.width, building.height, building.depth);

      matrix.compose(
        position,
        new THREE.Quaternion(),
        scale
      );

      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;

    return mesh;
  }

  /**
   * Obtiene los datos de todos los edificios
   */
  getBuildingData(): BuildingData[] {
    return this.buildings;
  }

  /**
   * Obtiene un edificio específico por su ID de instancia
   */
  getBuilding(instanceId: number): BuildingData | undefined {
    return this.buildings.find(b => b.instanceId === instanceId);
  }

  /**
   * Obtiene edificios normales
   */
  getNormalBuildings(): BuildingData[] {
    return this.buildings.filter(b => !b.isSpecial);
  }

  /**
   * Obtiene edificios especiales
   */
  getSpecialBuildings(): BuildingData[] {
    return this.buildings.filter(b => b.isSpecial);
  }
}
