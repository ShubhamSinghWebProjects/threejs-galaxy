import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'


/** DOCUMENTATION:
Polar Coordinates: https://math.libretexts.org/Bookshelves/Calculus/Calculus_(OpenStax)/11%3A_Parametric_Equations_and_Polar_Coordinates/11.03%3A_Polar_Coordinates#:~:text=However%2C%20if%20we%20use%20polar,spiral%20emanates%20from%20the%20origin.

Parameters to consider when creating a galaxy:

1. Number of particles: The number of particles will significantly affect the performance of your code. 
 A large number of particles can make the rendering slow, particularly if the rendering is done on a machine with low computing resources. 
 Hence, it is crucial to find a balance.

2. Particle distribution: Galaxies, especially spiral ones, have a unique distribution of stars. 
They are dense at the center and less so as we move outwards, with a spiral pattern.

3. Particle color and size: Typically, stars have different colors and sizes. We can use randomization to simulate these differences.

Now, to create the spiral shape of a galaxy, we'll need to utilize some mathematical equations. 
A spiral can be modeled using a logarithmic spiral (also known as a growth spiral or equiangular spiral), defined by the polar equation:

r = a * e^(b * theta)

Where:
- r is the distance from the center of the spiral,
- a and b are real numbers that determine the shape of the spiral,
- theta is the angle formed by the radius vector with a fixed line.
 
The parameter a determines the size of the spiral, while b determines the tightness of the spiral.



 */


const BASE_PATH = "/threejs-galaxy"

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


/**
 * Galaxy
 */

const parameters = {
    count: 1000, // Number of stars
    size: 0.01, // Size of stars
    radius: 5, // The radius of the galaxy
    branches: 3, // Number of branches in the spiral
    spin: 1, // Amount of spin in the galaxy
    randomness: 0.2, // The dispersion of stars along the spiral
    randomnessPower: 3, // The power factor for randomness
    insideColor: '#ff6030', // Inner galaxy color
    outsideColor: '#1b3984', // Outer galaxy color
    shape: "spiral", // "spiral", "circle", or "ellipse"
    thetaScale: 1, // scaling factor for theta
    distribution: "uniform", // "uniform", "gaussian", "exponential", "weibull", "lognormal", or "pareto"
}

let geometry = null
let material = null
let points = null

const createGalaxy = () => {
    /**
     * Geometry
     */
    const positions = new Float32Array(parameters.count * 3) // Multiply by 3 because each position is composed of 3 values (x, y, z)
    const colors = new Float32Array(parameters.count * 3)

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)

    for(let i = 0; i < parameters.count; i++)
    {
        const i3 = i * 3

        // Position
        let  radius;

        switch(parameters.distribution) {
            case "uniform":
                radius = Math.random() * parameters.radius;
                break;
            case "gaussian":
                radius = randomGaussian() * parameters.radius;
                break;
            case "exponential":
                radius = randomExponential() * parameters.radius;
                break;
            case "weibull":
                radius = randomWeibull() * parameters.radius;
                break;
            case "lognormal":
                radius = randomLogNormal() * parameters.radius;
                break;
            case "pareto":
                radius = randomPareto() * parameters.radius;
                break;
            default:
                console.error("Invalid distribution parameter")
                return;
        }

        const spinAngle = radius * parameters.spin
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)

        let x = 0, z = 0;

        // Compute x and z based on the shape
        switch(parameters.shape) {
            case "spiral":
                x = Math.cos(branchAngle + spinAngle) * radius + randomX
                z = Math.sin(branchAngle + spinAngle) * radius + randomZ
                break;
            case "circle":
                x = Math.cos(branchAngle) * radius + randomX
                z = Math.sin(branchAngle) * radius + randomZ
                break;
            case "ellipse":
                x = Math.cos(branchAngle) * radius * parameters.thetaScale + randomX
                z = Math.sin(branchAngle) * radius + randomZ
                break;
            default:
                console.error("Invalid shape parameter")
                return;
        }

        positions[i3] = x
        positions[i3 + 1] = randomY
        positions[i3 + 2] = z

        // Color
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / parameters.radius)

        colors[i3]     = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b
    }

    geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    

    /**
     * Material
     */
    material = new THREE.PointsMaterial({
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        transparent: true,
        alphaMap: new THREE.TextureLoader().load(`${BASE_PATH}/textures/particles/8.png`)
    })


    /**
     * Points
     */
    points = new THREE.Points(geometry, material)
    scene.add(points)
}

function generateGalaxy() {
    if(points !== null){
        // Remove the old galaxy
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }
    
    // Create a new galaxy
    createGalaxy()
}

gui.add(parameters, 'distribution', ['uniform', 'gaussian', 'exponential', 'weibull', 'lognormal', 'pareto']).onFinishChange(generateGalaxy)
gui.add(parameters, 'count').min(1000).max(10000).step(500).onFinishChange(generateGalaxy)
gui.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
gui.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomness').min(0).max(2).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)
gui.add(parameters, 'shape', ['spiral', 'circle', 'ellipse']).onFinishChange(generateGalaxy)
gui.add(parameters, 'thetaScale').min(0.1).max(10).step(0.1).onFinishChange(generateGalaxy)

generateGalaxy()

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
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 3
camera.position.y = 3
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const rotateGalaxy = (elapsedTime) => {
    if(points !== null){
        points.rotation.y = elapsedTime*0.1
    }
}


const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Rotate the galaxy
    rotateGalaxy(elapsedTime)
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()


function randomGaussian(mean = 0.5, stdDev = 0.15) {
    // Use the polar form of the Box-Muller transform to get a Gaussian-distributed random number
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    // Scale by desired mean and standard deviation
    const scaledNum = num * stdDev + mean;

    // Clamp within [0, 1]
    return Math.min(Math.max(scaledNum, 0), 1);
}


function randomExponential(lambda = 1) {
    /**
     * Exponential distribution: We can generate exponentially distributed random numbers using the 
     * inverse transform sampling method, which involves applying the inverse of the cumulative distribution function (CDF) 
     * to a uniform random variable.
     */
    return -Math.log(1 - Math.random()) / lambda;
}

//Weibull distribution: Similarly, we can use the inverse transform sampling method for Weibull distribution:

function randomWeibull(shape = 1, scale = 1) {
    return scale * Math.pow(-Math.log(1 - Math.random()), 1 / shape);
}

// Log-normal distribution: We can generate a log-normal distribution using the Box-Muller transform on normally distributed numbers.
function randomLogNormal(mean = 0, stdDev = 1) {
    const normalRandom = randomGaussian(mean, stdDev);
    return Math.exp(normalRandom);
}

// Pareto distribution: The Pareto distribution can be also generated using the inverse transform method:
function randomPareto(alpha = 1, xm = 1) {
    return xm / Math.pow(1 - Math.random(), 1 / alpha);
}
