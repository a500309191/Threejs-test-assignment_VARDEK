import * as THREE from 'three'


export enum FrameSide {
  down = 0,
  left = 1,
  up = 2,
  right = 3,
}

export enum EdgeSide {
  left = 0,
  right = 1,
}

export type DoorMap = {
  body: THREE.Mesh
  frame: {
    [key in FrameSide]: {
      edge: THREE.Mesh
      angles: {
        [key in EdgeSide]: THREE.Mesh
      }
    }
  }
}