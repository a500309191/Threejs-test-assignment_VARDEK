import * as THREE from 'three'

export function initLights(scene: THREE.Scene) {
  // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25)
  // directionalLight.position.set(0, 3, 5);
  // directionalLight.castShadow = true;
  // scene.add(directionalLight)
  const ambLight = new THREE.AmbientLight(new THREE.Color('white'), 2)
  scene.add(ambLight)
}