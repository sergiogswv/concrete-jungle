import * as THREE from 'three';

/**
 * Material para edificios normales - aspecto brutalista oscuro
 */
export function createNormalBuildingMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x1a1a24, // Gris muy oscuro con tinte azulado
    metalness: 0.4,  // Algo metálico
    roughness: 0.8,  // Aspecto mate/concreto
    flatShading: true, // Shading plano para aspecto más geométrico/brutalista
  });
}

/**
 * Material para edificios especiales - neón cyan
 */
export function createSpecialBuildingMaterialCyan(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff, // Emisión cyan
    emissiveIntensity: 1.0, // Brillo balanceado
    metalness: 0.2,
    roughness: 0.4,
    flatShading: true,
  });
}

/**
 * Material para edificios especiales - neón magenta
 */
export function createSpecialBuildingMaterialMagenta(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff, // Emisión magenta
    emissiveIntensity: 1.0, // Brillo balanceado
    metalness: 0.2,
    roughness: 0.4,
    flatShading: true,
  });
}

/**
 * Material alternativo para edificios normales - gris más claro
 */
export function createNormalBuildingMaterialLight(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x2a2a35, // Gris ligeramente más claro
    metalness: 0.3,
    roughness: 0.9,
    flatShading: true,
  });
}

/**
 * Crea un array de materiales aleatorios para edificios normales
 * Esto añade variedad visual a la ciudad
 */
export function createVariedNormalMaterials(count: number = 3): THREE.MeshStandardMaterial[] {
  const materials: THREE.MeshStandardMaterial[] = [];

  const baseColors = [
    0x1a1a24, // Azul muy oscuro
    0x1a1a1a, // Gris muy oscuro
    0x241a24, // Magenta muy oscuro
    0x1a2424, // Cyan muy oscuro
  ];

  for (let i = 0; i < count; i++) {
    const color = baseColors[i % baseColors.length];
    materials.push(
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.3 + Math.random() * 0.2,
        roughness: 0.7 + Math.random() * 0.2,
        flatShading: true,
      })
    );
  }

  return materials;
}

/**
 * Crea materiales especiales alternando entre cyan y magenta
 */
export function createAlternatingSpecialMaterials(): {
  cyan: THREE.MeshStandardMaterial;
  magenta: THREE.MeshStandardMaterial;
} {
  return {
    cyan: createSpecialBuildingMaterialCyan(),
    magenta: createSpecialBuildingMaterialMagenta(),
  };
}
