import type * as THREE from 'three';
import type { BuildingData, ScrollConfig } from '../types/scene.types';

/**
 * Linear interpolation function for smooth transitions
 * @param current - Current value
 * @param target - Target value
 * @param factor - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(current: number, target: number, factor: number): number {
  if (factor < 0 || factor > 1) {
    throw new Error('Lerp factor must be between 0 and 1');
  }
  return current + (target - current) * factor;
}

/**
 * Calculate building scale multiplier based on audio and time
 */
export function calculateBuildingScale(
  bassScale: number,
  time: number,
  index: number,
  isSpecial: boolean
): number {
  const timeMultiplier = isSpecial ? 1.5 : 1;
  const indexMultiplier = isSpecial ? 0.2 : 0.1;
  const amplitude = isSpecial ? 0.08 : 0.05;

  return bassScale + Math.sin(time * timeMultiplier + index * indexMultiplier) * amplitude;
}

/**
 * Handle infinite scroll teleportation for buildings
 */
export function handleInfiniteScroll(
  building: BuildingData,
  scrollSpeed: number,
  config: ScrollConfig
): void {
  building.z += scrollSpeed;

  if (building.z > config.distanceThreshold) {
    building.z -= config.respawnDistance;
  }
}

/**
 * Update building instance matrix
 */
export function updateBuildingMatrix(
  mesh: THREE.InstancedMesh,
  index: number,
  building: BuildingData,
  newHeight: number,
  matrix: THREE.Matrix4,
  position: THREE.Vector3,
  quaternion: THREE.Quaternion,
  scale: THREE.Vector3
): void {
  position.set(building.x, newHeight / 2, building.z);
  scale.set(building.width, newHeight, building.depth);
  matrix.compose(position, quaternion, scale);
  mesh.setMatrixAt(index, matrix);
}

/**
 * Calculate camera position for circular movement
 */
export function calculateCircularCameraPosition(
  time: number,
  radius: number,
  speed: number,
  heightOffset: number
): THREE.Vector3 {
  const angle = time * speed;

  return new THREE.Vector3(
    Math.cos(angle) * radius,
    heightOffset + Math.sin(time * 0.3) * 5,
    Math.sin(angle) * radius
  );
}

/**
 * Calculate camera position for infinite scroll mode
 */
export function calculateScrollCameraPosition(
  time: number,
  swayAmplitude: number = 2
): THREE.Vector3 {
  return new THREE.Vector3(
    Math.sin(time * 0.2) * swayAmplitude,
    15,
    5
  );
}

/**
 * Validate building data
 */
export function validateBuildingData(building: BuildingData): boolean {
  return (
    typeof building.x === 'number' &&
    typeof building.y === 'number' &&
    typeof building.z === 'number' &&
    typeof building.width === 'number' &&
    typeof building.height === 'number' &&
    typeof building.depth === 'number' &&
    building.width > 0 &&
    building.height > 0 &&
    building.depth > 0
  );
}
