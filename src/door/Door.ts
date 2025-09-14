import * as THREE from 'three'
import { EdgeSide, type DoorMap, FrameSide } from '@/door/types.ts'
import { defaultDoorSize } from '@/door/constants.ts'

export class Door {
  public group: THREE.Group = new THREE.Group()

  public setDoorSize(w: number, h: number, applyRatio: boolean = true) {
    const width = applyRatio ? this.getTranslatedWidth(w) : w
    const height = applyRatio ? this.getTranslatedHeight(h) : h
    this.setBodySize(width, height)
    this.setFrameSize(width, height)
  }

  constructor() {
    this.group.name = 'doorGroup'
    this.createDoor()
  }
  private doorMap: DoorMap = {
    body: new THREE.Mesh(),
    frame: {
      [FrameSide.down]: {
        edge: new THREE.Mesh(),
        angles: {
          [EdgeSide.left]: new THREE.Mesh(),
          [EdgeSide.right]: new THREE.Mesh()
        }
      },
      [FrameSide.left]: {
        edge: new THREE.Mesh(),
        angles: {
          [EdgeSide.left]: new THREE.Mesh(),
          [EdgeSide.right]: new THREE.Mesh()
        }
      },
      [FrameSide.up]: {
        edge: new THREE.Mesh(),
        angles: {
          [EdgeSide.left]: new THREE.Mesh(),
          [EdgeSide.right]: new THREE.Mesh()
        }
      },
      [FrameSide.right]: {
        edge: new THREE.Mesh(),
        angles: {
          [EdgeSide.left]: new THREE.Mesh(),
          [EdgeSide.right]: new THREE.Mesh()
        }
      }
    }
  }

  private baseSize = 4

  private bodyMaterial = new THREE.MeshPhysicalMaterial({
    metalness: 0.5,
    roughness: 0.5,
    flatShading: true
  })
  private frameMaterial = new THREE.MeshPhysicalMaterial({
    color: '#E7E7E7',
    metalness: 0.4,
    roughness: 0.25,
    flatShading: true
  })

  private setMaterialTexture() {
    const texture = new THREE.TextureLoader().load('./WoodFine03.jpg')
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 1)
    texture.colorSpace = THREE.SRGBColorSpace
    this.bodyMaterial.map = texture
  }

  private createDoor() {
    this.createBody()
    this.createFrame()
    this.setAspectRatio()
    this.setMaterialTexture()
  }

  private createBody(height: number = 1, width: number = 1) {
    const position = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      1, 1, 0,
      0, 1, 0,

      0, 0, 0.1,
      1, 0, 0.1,
      1, 1, 0.1,
      0, 1, 0.1,
    ])
    const indices = new Uint16Array([
      0, 2, 1,
      0, 3, 2,

      4, 5, 6,
      4, 6, 7,
    ])
    const uv = new Float32Array([
      0, 0,
      1, 0,
      1, 1,
      0, 1,
      0, 0,
      1, 0,
      1, 1,
      0, 1,
    ])
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry.center()

    this.doorMap.body.geometry = geometry
    this.doorMap.body.material = this.bodyMaterial
    this.doorMap.body.name = 'doorBody'
    this.doorMap.body.scale.multiply(new THREE.Vector3(width, height, 1))
    this.group.add(this.doorMap.body)
  }

  private createFrame(height: number = 1, width: number = 1) {
    const frameGroup = new THREE.Group()
    frameGroup.name = 'frameGroup'

    for (let sideIndex = 0; sideIndex < 4; sideIndex++) {
      const horizontal = (sideIndex + 1) % 2 === 0
      const scale = horizontal ? width : height
      const revScale = horizontal ? height : width
      const angleDeg = sideIndex * 90
      const angleRad = THREE.MathUtils.degToRad(angleDeg)

      const frameSideGroup = new THREE.Group()
      frameSideGroup.name = `frameSideGroup-${sideIndex}`

      const edge = this.createEdge(sideIndex)
      edge.scale.multiply(new THREE.Vector3(scale, 1, 1))
      frameSideGroup.add(edge)

      const edgeBbox = new THREE.Box3()
      edgeBbox.setFromObject(edge)
      const edgeSize = new THREE.Vector3()
      edgeBbox.getSize(edgeSize)

      for (let edgeIndex = 0; edgeIndex < 2; edgeIndex++) {
        const left = edgeIndex === 0
        const edgeAngle = this.createEdgeAngle(sideIndex, edgeIndex)
        edgeAngle.name = `${edge.name}_sideAngle-${edgeIndex}`

        const sideAngleBbox = new THREE.Box3()
        sideAngleBbox.setFromObject(edgeAngle)
        const sideAngleSize = new THREE.Vector3()
        sideAngleBbox.getSize(sideAngleSize)

        const gap = new THREE.Vector3(edgeSize.x / 2 + sideAngleSize.x / 2, 0, 0)
        edgeAngle.position.copy(edge.position)
        edgeAngle.setRotationFromEuler(new THREE.Euler(0, 0, -Math.PI / 2))
        if (left) {
          edgeAngle.position.add(gap)
        } else {
          edgeAngle.scale.multiply(new THREE.Vector3(1, -1, 1))
          edgeAngle.position.sub(gap)
        }

        frameSideGroup.add(edgeAngle)
      }

      frameSideGroup.setRotationFromEuler(new THREE.Euler(0, 0, angleRad - (Math.PI / 2)))
      frameSideGroup.position.copy(new THREE.Vector3(
        Math.cos(angleRad) * (edgeSize.y / 2 + revScale / 2),
        Math.sin(angleRad) * (edgeSize.y / 2 + revScale / 2),
        0
      ))

      frameGroup.add(frameSideGroup)
    }
    frameGroup.scale.multiply(new THREE.Vector3(1, 1, 1.5))
    this.group.add(frameGroup)
  }

  private createEdge(frameSideIndex: FrameSide) {
    const position = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      1, 1, 0,
      0, 1, 0,

      0, 0, 0.1,
      1, 0, 0.1,
      1, 1, 0.1,
      0, 1, 0.1,
    ])
    const indices = new Uint16Array([
      0, 2, 1,
      0, 3, 2,

      4, 5, 6,
      4, 6, 7,

      0, 5, 4,
      0, 1, 5,

      3, 7, 6,
      3, 6, 2,
    ])

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry.center()

    const { edge } = this.doorMap.frame[frameSideIndex]
    edge.geometry = geometry
    edge.material = this.frameMaterial
    edge.name = `doorEdge-${frameSideIndex}`

    return edge
  }

  private createEdgeAngle(frameSideIndex: FrameSide, edgeSideIndex: EdgeSide) {
    const position = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,

      0, 0, 0.1,
      1, 0, 0.1,
      0, 1, 0.1,
    ])
    const indices = new Uint16Array([
      0, 2, 1,
      3, 4, 5,

      0, 3, 5,
      0, 5, 2,
    ])

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry.center()

    const angle = this.doorMap.frame[frameSideIndex].angles[edgeSideIndex]

    angle.geometry = geometry
    angle.material = this.frameMaterial
    angle.name = `doorEdge-${frameSideIndex}_angle-${edgeSideIndex}`

    return angle
  }

  private setBodySize(width: number, height: number) {
    this.doorMap.body.scale.copy(new THREE.Vector3(width, height, 1))
  }

  private setFrameSize(width: number, height: number) {
    Object.keys(this.doorMap.frame).forEach(side => {
      // @ts-ignore
      const frameSide = side as FrameSide
      const horizontal = frameSide == FrameSide.left || frameSide == FrameSide.right
      const size = horizontal ? width : height
      const revSize = horizontal ? height : width
      this.setEdgeSize(frameSide, size, revSize, horizontal)
      this.setAnglePosition(frameSide, size, revSize)
    })
  }

  private setEdgeSize(side: FrameSide, size: number, revSize: number, horizontal: boolean) {
    const { edge } = this.doorMap.frame[side]
    edge.scale.copy(new THREE.Vector3(size, 1, 1))
    edge.position.copy(new THREE.Vector3(0, revSize / 2 - 0.5, 0))
  }

  private setAnglePosition(side: FrameSide, size: number, revSize: number) {
    const { edge } = this.doorMap.frame[side]
    const { angles } = this.doorMap.frame[side]
    Object.entries(angles).forEach(([edgeSide, angle], index) => {
      angle.position.copy(edge.position)
      const left = index === 0
      if (left) {
        angle.position.add(new THREE.Vector3(size / 2 + 0.5, 0, 0))
      } else {
        angle.position.sub(new THREE.Vector3(size / 2 + 0.5, 0, 0))
      }
    })
  }

  private setAspectRatio() {
    const { width, height } = defaultDoorSize
    const aspectRatio = height / width
    this.setDoorSize(this.baseSize, this.baseSize * aspectRatio, false)
    const scale = width / this.baseSize
    this.group.scale.multiplyScalar(scale)
  }

  private getTranslatedWidth(w: number) {
    const widthRatio = w / defaultDoorSize.width
    return widthRatio * this.baseSize
  }

  private getTranslatedHeight(h: number) {
    const defaultHeightRatio = defaultDoorSize.height / defaultDoorSize.width
    const heightRatio = h / defaultDoorSize.height

    return heightRatio * this.baseSize * defaultHeightRatio
  }
}



