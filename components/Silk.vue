<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Color, PlaneGeometry, ShaderMaterial, Mesh, OrthographicCamera, Scene, WebGLRenderer } from 'three'

interface Props {
  speed?: number
  scale?: number
  color?: string
  noiseIntensity?: number
  rotation?: number
}

const props = withDefaults(defineProps<Props>(), {
  speed: 5,
  scale: 1,
  color: '#7B7481',
  noiseIntensity: 1.5,
  rotation: 0
})

const containerRef = ref<HTMLDivElement | null>(null)
let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: OrthographicCamera | null = null
let mesh: Mesh | null = null
let animationId: number | null = null
let startTime = 0

const hexToNormalizedRGB = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b]
}

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`

const init = (): void => {
  if (!containerRef.value) return

  const width = window.innerWidth
  const height = window.innerHeight

  // Scene
  scene = new Scene()

  // Orthographic Camera - ensures plane fills entire viewport
  camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.z = 1

  // Renderer
  renderer = new WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000)
  containerRef.value.appendChild(renderer.domElement)

  // Geometry - 2x2 plane centered at origin fills orthographic view
  const geometry = new PlaneGeometry(2, 2)
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: props.speed },
      uScale: { value: props.scale },
      uNoiseIntensity: { value: props.noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(props.color)) },
      uRotation: { value: props.rotation }
    }
  })

  mesh = new Mesh(geometry, material)
  scene.add(mesh)

  startTime = performance.now()
  animate()
}

const animate = (): void => {
  if (!renderer || !scene || !camera || !mesh) return

  const material = mesh.material as ShaderMaterial
  material.uniforms.uTime.value = (performance.now() - startTime) * 0.001

  renderer.render(scene, camera)
  animationId = requestAnimationFrame(animate)
}

const handleResize = (): void => {
  if (!renderer || !camera) return

  const width = window.innerWidth
  const height = window.innerHeight

  renderer.setSize(width, height)
}

onMounted(() => {
  init()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div ref="containerRef" class="silk-container silk-dark" />
</template>

<style scoped>
.silk-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.silk-dark {
  background-color: #000000;
}

.silk-container :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
