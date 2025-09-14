<script lang='ts' setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { onWatcherCleanup, ref, shallowRef, watch, watchEffect } from 'vue'
import { useElementBounding, useEventListener, useRafFn } from '@vueuse/core'
import { Door } from '@/door/Door.ts'
import { defaultDoorSize } from '@/door/constants.ts'
import { initLights } from '@/scene/initLights.ts'


const threeContainer = ref<HTMLCanvasElement | undefined>()
const renderer = shallowRef<THREE.WebGLRenderer | undefined>()
const controls = shallowRef<OrbitControls | undefined>()

const controllerWidthValue = ref(defaultDoorSize.width)
const controllerHeightValue = ref(defaultDoorSize.height)

const scene = new THREE.Scene()
const { height, width } = useElementBounding(threeContainer)
const camera = new THREE.PerspectiveCamera(75, width.value / window.innerHeight, 0.1,  1000)
camera.position.set( 150, 50, 160)
initLights(scene)

const door = new Door()
scene.add(door.group)


watch([controllerWidthValue, controllerHeightValue], ([newWidth, newHeight]) => {
  door.setDoorSize(Number(newWidth), Number(newHeight))
}, { immediate: true })

watch(threeContainer, () => {
  onWatcherCleanup(() => {
    renderer.value?.dispose()
    controls.value?.dispose()
  })

  if (!threeContainer.value) return

  renderer.value = new THREE.WebGLRenderer({ canvas: threeContainer.value })
  renderer.value.setSize(window.innerWidth, window.innerHeight)
  renderer.value.shadowMap.enabled = true

  controls.value = new OrbitControls(camera, threeContainer.value)
  controls.value.enableDamping = true
  controls.value.dampingFactor = 0.05
}, {immediate: true})

watchEffect(() => {
  if (!renderer.value) return
  renderer.value.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.value.toneMappingExposure = 1
  const pmremGenerator = new THREE.PMREMGenerator(renderer.value)
  pmremGenerator.compileEquirectangularShader()
  new RGBELoader().load('skyes.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    const envMap = pmremGenerator.fromEquirectangular(texture).texture
    scene.background = envMap
    scene.environment = envMap
    texture.dispose()
    pmremGenerator.dispose()
  })
})

watch([width, height], () => {
  if (!renderer.value) return
  camera.aspect = width.value / height.value
  camera.updateProjectionMatrix()
  renderer.value.setSize(width.value, height.value, false)
}, { immediate: true })

useRafFn(() => {
  if (controls.value) controls.value.update()
  if (renderer.value) renderer.value.render(scene, camera)
})
</script>

<template>
  <div class='controllers'>
    <div class='controller width'>
      <label class='controller-label'>width:</label>
      <input
          type='range'
          v-model='controllerWidthValue'
          min='60'
          max='120'
          step='1'
      />
      <span class='value-display'>{{ controllerWidthValue }} cm</span>
    </div>
    <div class='controller height'>
      <label class='controller-label'>height:</label>
      <input
          type='range'
          v-model='controllerHeightValue'
          min='120'
          max='250'
          step='1'
      />
      <span class='value-display'>{{ controllerHeightValue }} cm</span>
    </div>
  </div>
  <canvas id='scene' ref='threeContainer'></canvas>
</template>

<style scoped>
#scene {
  width: 100%;
  height: 100%;
}
label {
  font-family: Arial;
  width: 40px;
}
.controllers {
  position: absolute;
  top: 20px;
  left: 20px;
}

.controller {
  display: flex;
  flex-direction: row;
  gap: 10px;
}
</style>