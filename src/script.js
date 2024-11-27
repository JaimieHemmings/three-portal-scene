import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import FirefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import FirefliesVertexShader from './shaders/fireflies/vertex.glsl'
import PortalFragmentShader from './shaders/portal/fragment.glsl'
import PortalVertexShader from './shaders/portal/vertex.glsl'
import { gsap } from 'gsap'

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new GUI({
    width: 400
})
gui.hide()
// Toggle GUI when press h
document.addEventListener('keydown', (event) =>
{
    if (event.key === 'h')
    {
        gui.isVisible ? gui.hide() : gui.show()
        gui.isVisible = !gui.isVisible
    }
})

// Canvas and scene
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

/**
 * Overlay
 */

const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha; 
        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `,
    transparent: true,
    uniforms: {
        uAlpha: { value: 1.0 }
    }
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

/**
 * Loaders
 */

const loadingBarElement = document.querySelector('.loading-bar')

const LoadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        window.setTimeout(() => {
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 })
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
            // dispose of the overlay after the animation
            overlayMaterial.dispose()
            overlayGeometry.dispose()
            scene.remove(overlay)
        }, 500)
    },
    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal
        loadingBarElement.style.transform = `scaleX(${progress})`
    }
)
const textureLoader = new THREE.TextureLoader(LoadingManager)
const gltfLoader = new GLTFLoader(LoadingManager)

/**
 * bakedTextures
 */
const bakedTexture = textureLoader.load('baked.webp')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

/**
 * Materials
 */
// Debug parameters
debugObject.portalColorStart = '#FF1493'
debugObject.portalColorEnd = '#FFFFFF'
gui.addColor(debugObject, 'portalColorStart').onChange(() =>
    {
        portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
    }
)
gui.addColor(debugObject, 'portalColorEnd').onChange(() =>
    {
        portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
    }
)

const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture
})
const poleLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffe5
})
const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
        uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
    },
    side: THREE.DoubleSide,
    vertexShader: PortalVertexShader,
    fragmentShader: PortalFragmentShader,
})

// debug parameters
/**
 * Load model
 */

gltfLoader.load(
    'portal.glb',
    (gltf) =>
    {
        const bakedMesh = gltf.scene.children.find(child => child.name === 'baked')
        const portalLightMesh = gltf.scene.children.find(child => child.name === 'portalLight')
        const poleLightAMesh = gltf.scene.children.find(child => child.name === 'poleLightA')
        const poleLightBMesh = gltf.scene.children.find(child => child.name === 'poleLightB')
        bakedMesh.material = bakedMaterial
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial
        portalLightMesh.material = portalLightMaterial
        scene.add(gltf.scene)
    }
)

/**
 * Fireflies
 */
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 100;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
    positionArray[i * 3 + 1] = Math.random() * 1.5;
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

    scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));

const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 100 }
    },
    vertexShader: FirefliesVertexShader,
    fragmentShader: FirefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('firefliesSize');

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// debug parameters
debugObject.clearColor = '#639c9c'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange(() =>
{
    renderer.setClearColor(debugObject.clearColor)
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update materials
    portalLightMaterial.uniforms.uTime.value = elapsedTime
    firefliesMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()