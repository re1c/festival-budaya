import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// =========================
// SETUP DASAR SCENE
// =========================
const scene = new THREE.Scene();
const flameObjects = []; // Global array untuk animasi api

// Skybox (langit malam Bali yang lebih dalam)
const skyColor = new THREE.Color(0x050510); // Lebih gelap untuk kontras malam
scene.background = skyColor;
scene.fog = new THREE.FogExp2(0x050510, 0.002); // Fog dikurangi agar bintang terlihat

// STARFIELD (Realistic Stars)
function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 5000;
    const posArray = new Float32Array(starsCount * 3);
    const sizeArray = new Float32Array(starsCount);

    for(let i = 0; i < starsCount * 3; i+=3) {
        // Sphere distribution
        const r = 400 + Math.random() * 400; // Jauh di angkasa
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        posArray[i] = r * Math.sin(phi) * Math.cos(theta);
        posArray[i+1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)); // Hemisphere atas dominan
        posArray[i+2] = r * Math.cos(phi);

        sizeArray[i/3] = 0.5 + Math.random() * 2.0; // Variasi ukuran lebih besar
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

    // Simple shader material for twinkling stars
    const starsMaterial = new THREE.PointsMaterial({
        size: 1.0, // Base size diperbesar
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        sizeAttenuation: true,
        fog: false // PENTING: Bintang tidak tertutup kabut
    });

    const starField = new THREE.Points(starsGeometry, starsMaterial);
    starField.name = "starField"; // Name for toggling
    scene.add(starField);
}
createStarfield();

// Kamera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 20);

// Renderer (High Quality Setup)
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio untuk performa
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Shadow lebih halus
renderer.toneMapping = THREE.ACESFilmicToneMapping; // KUNCI REALISME: Cinematic lighting
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Post-Processing (Bloom Effect)
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // strength
  0.4, // radius
  0.85 // threshold
);
bloomPass.strength = 0.8; // Intensitas glow
bloomPass.radius = 0.5; // Sebaran glow
bloomPass.threshold = 0.2; // Batas cahaya yang kena glow

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Pointer Lock Controls untuk FPS-style movement
const controls = new PointerLockControls(camera, document.body);

// =========================
// LIGHTING - SUASANA MALAM NYEPI (REALISTIC)
// =========================

// Ambient light (Sangat redup, biru malam)
const ambientLight = new THREE.AmbientLight(0x0a0a20, 0.2);
scene.add(ambientLight);

// Hemisphere light (Pantulan tanah vs langit)
const hemiLight = new THREE.HemisphereLight(0x1a1a40, 0x050510, 0.3);
scene.add(hemiLight);

// Moonlight (Key Light - Cold Blue)
const moonLight = new THREE.DirectionalLight(0xaaccff, 2.5); // Intensity tinggi untuk tone mapping
moonLight.position.set(50, 100, 50);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 4096; // High res shadow
moonLight.shadow.mapSize.height = 4096;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 500;
moonLight.shadow.camera.left = -100;
moonLight.shadow.camera.right = 100;
moonLight.shadow.camera.top = 100;
moonLight.shadow.camera.bottom = -100;
moonLight.shadow.bias = -0.0005; // Mengurangi shadow acne
scene.add(moonLight);

// Torch lights (obor) - Warm Orange
const torchLights = []; // Array untuk animasi cahaya obor
const sparkParticles = []; // Array untuk partikel percikan api

function createTorchLight(x, y, z) {
  // 1. PointLight (Cahaya Utama)
  const torchLight = new THREE.PointLight(0xff6600, 80, 20, 2); // Lebih terang & radius pas
  torchLight.position.set(x, y + 0.8, z);
  torchLight.castShadow = false; // Disable shadow to prevent shader limit errors (Invisible models)
  // torchLight.shadow.bias = -0.0001;
  // torchLight.shadow.mapSize.width = 1024; // Optimasi shadow map
  // torchLight.shadow.mapSize.height = 1024;
  scene.add(torchLight);
  
  // Simpan untuk animasi flicker
  torchLight.userData = { baseIntensity: 80, phase: Math.random() * Math.PI * 2 };
  torchLights.push(torchLight);

  // 2. Visual Obor (Batang Kayu)
  const torchGeom = new THREE.CylinderGeometry(0.05, 0.08, 1.5, 8);
  const torchMat = new THREE.MeshStandardMaterial({ 
    color: 0x2a1a0a,
    roughness: 1.0 
  });
  const torch = new THREE.Mesh(torchGeom, torchMat);
  torch.position.set(x, y - 0.75, z);
  torch.castShadow = true;
  scene.add(torch);

  // 3. Visual Api (Volumetric Layered Mesh)
  const flameGroup = new THREE.Group();
  flameGroup.position.set(x, y + 0.2, z);
  
  // Layer 1: Core (Putih Panas)
  const coreGeom = new THREE.OctahedronGeometry(0.1, 2);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const core = new THREE.Mesh(coreGeom, coreMat);
  flameGroup.add(core);

  // Layer 2: Inner Flame (Kuning/Oranye Terang)
  const innerGeom = new THREE.OctahedronGeometry(0.2, 1);
  const innerMat = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00, 
      transparent: true, 
      opacity: 0.8,
      blending: THREE.AdditiveBlending // Glowing effect
  });
  const inner = new THREE.Mesh(innerGeom, innerMat);
  flameGroup.add(inner);

  // Layer 3: Outer Flame (Merah/Oranye Gelap)
  const outerGeom = new THREE.OctahedronGeometry(0.35, 0); // Low poly look for outer
  const outerMat = new THREE.MeshBasicMaterial({ 
      color: 0xff4400, 
      transparent: true, 
      opacity: 0.4,
      blending: THREE.AdditiveBlending
  });
  const outer = new THREE.Mesh(outerGeom, outerMat);
  flameGroup.add(outer);

  scene.add(flameGroup);

  // Simpan flame group untuk animasi
  flameGroup.userData = { phase: Math.random() * Math.PI * 2 };
  flameObjects.push({ group: flameGroup, core: core, inner: inner, outer: outer });

  // 4. Spark System (Percikan Api Sederhana)
  // Kita buat beberapa partikel kecil yang akan bergerak ke atas
  for(let i=0; i<5; i++) {
      const sparkGeom = new THREE.PlaneGeometry(0.05, 0.05);
      const sparkMat = new THREE.MeshBasicMaterial({ 
          color: 0xffaa00, 
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1
      });
      const spark = new THREE.Mesh(sparkGeom, sparkMat);
      
      // Random start position near flame
      resetSpark(spark, x, y, z);
      
      scene.add(spark);
      sparkParticles.push({ mesh: spark, baseX: x, baseY: y, baseZ: z, speed: 0.5 + Math.random() * 1.0 });
  }

  return { light: torchLight, flameGroup };
}

function resetSpark(spark, x, y, z) {
    spark.position.set(
        x + (Math.random() - 0.5) * 0.3,
        y + 0.2 + Math.random() * 0.5,
        z + (Math.random() - 0.5) * 0.3
    );
    spark.scale.setScalar(1);
    spark.material.opacity = 1;
}

// =========================
// TERRAIN - OPEN WORLD (IMPROVED)
// =========================

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Procedural Grid Texture untuk tanah (Seamless & Natural)
const canvas = document.createElement('canvas');
canvas.width = 2048; // Increased resolution
canvas.height = 2048;
const context = canvas.getContext('2d');

// 1. Base Layer (Dark Soil)
context.fillStyle = '#1a1510'; 
context.fillRect(0, 0, 2048, 2048);

// Helper for seamless drawing
function drawSeamlessSpot(x, y, radius, color) {
    const draw = (cx, cy) => {
        const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, color); 
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.fill();
    };
    
    // Draw center and wrapped versions
    draw(x, y);
    draw(x + 2048, y);
    draw(x - 2048, y);
    draw(x, y + 2048);
    draw(x, y - 2048);
    draw(x + 2048, y + 2048);
    draw(x - 2048, y - 2048);
    draw(x + 2048, y - 2048);
    draw(x - 2048, y + 2048);
}

// 2. Large Noise Patches (Grass/Moss) - Seamless
for(let i=0; i<150; i++) { 
    const x = Math.random() * 2048;
    const y = Math.random() * 2048;
    const radius = 150 + Math.random() * 200; 
    drawSeamlessSpot(x, y, radius, 'rgba(30, 50, 30, 0.3)'); // Dark Green
}

// 3. Medium Noise (Dry Earth)
for(let i=0; i<200; i++) { 
    const x = Math.random() * 2048;
    const y = Math.random() * 2048;
    const radius = 50 + Math.random() * 100; 
    drawSeamlessSpot(x, y, radius, 'rgba(60, 40, 30, 0.2)'); // Brownish
}

// 4. Small Noise (Dirt Detail/Pebbles)
for(let i=0; i<300000; i++) {
    context.fillStyle = Math.random() > 0.5 ? '#2a2015' : '#0f0a05';
    const s = Math.random() * 3;
    context.fillRect(Math.random() * 2048, Math.random() * 2048, s, s);
}

const groundTexture = new THREE.CanvasTexture(canvas);
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(8, 8); // Adjusted repeat for larger texture

// Ground - tanah luas
const groundGeom = new THREE.PlaneGeometry(200, 200, 256, 256); // Lebih detail vertices (256x256)
// Modifikasi vertices untuk uneven terrain (sedikit bergelombang)
const posAttribute = groundGeom.attributes.position;
for ( let i = 0; i < posAttribute.count; i ++ ) {
    const x = posAttribute.getX( i );
    const y = posAttribute.getY( i ); // This is actually Z in world space because of rotation later
    
    // Calculate distance to path center (Cross shape)
    // Path width is 4, so half width is 2. Let's give some buffer for blending.
    const distToX = Math.abs(y); // Distance to X axis (horizontal path)
    const distToY = Math.abs(x); // Distance to Y axis (vertical path in geometry, Z in world)
    
    const pathWidth = 3.0;
    const blendWidth = 4.0;
    
    let height = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + Math.random() * 0.2;
    
    // Flatten logic
    const minDist = Math.min(distToX, distToY);
    
    // Check additional paths
    // NOTE: y in PlaneGeometry (rotated -90 x) corresponds to -z in world space.
    // So if path is at z=40, we need y=-40. |y - (-40)| = |y + 40|.
    const distToZ40 = Math.abs(y + 40); // Horizontal path at Z=40
    const distToXMin40 = Math.abs(x + 40); // Vertical path at X=-40
    
    const finalMinDist = Math.min(minDist, distToZ40, distToXMin40);

    if (finalMinDist < pathWidth + blendWidth) {
        const factor = Math.max(0, (finalMinDist - pathWidth) / blendWidth); // 0 at path, 1 at outside
        // Smoothstep for better blending
        const smoothFactor = factor * factor * (3 - 2 * factor);
        
        height = THREE.MathUtils.lerp(0.05, height, smoothFactor);
    }
    
    posAttribute.setZ( i, height );
}
groundGeom.computeVertexNormals();

const groundMat = new THREE.MeshStandardMaterial({
  map: groundTexture,
  roughness: 0.9,
  metalness: 0.1,
});
const ground = new THREE.Mesh(groundGeom, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Jalan setapak (Improved Visuals - Stone Path)
function createPath() {
  // Texture untuk jalan (Stone Paving)
  const pathCanvas = document.createElement('canvas');
  pathCanvas.width = 1024;
  pathCanvas.height = 1024;
  const pCtx = pathCanvas.getContext('2d');
  
  // Base dirt/grout color
  pCtx.fillStyle = '#2b2b2b'; 
  pCtx.fillRect(0, 0, 1024, 1024);
  
  // Draw Stones
  const stoneCount = 300;
  for(let i=0; i<stoneCount; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const w = 40 + Math.random() * 60;
      const h = 40 + Math.random() * 60;
      
      // Stone color variation
      const shade = 50 + Math.floor(Math.random() * 50);
      pCtx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      
      // Draw rounded rect (stone)
      pCtx.beginPath();
      pCtx.roundRect(x, y, w, h, 10);
      pCtx.fill();
      
      // Add texture to stone
      pCtx.fillStyle = 'rgba(0,0,0,0.1)';
      for(let j=0; j<5; j++) {
          pCtx.fillRect(x + Math.random()*w, y + Math.random()*h, 2, 2);
      }
  }
  
  // Add noise overlay
  for(let i=0; i<50000; i++) {
      pCtx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)';
      pCtx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
  }
  
  const pathTexture = new THREE.CanvasTexture(pathCanvas);
  pathTexture.wrapS = THREE.RepeatWrapping;
  pathTexture.wrapT = THREE.RepeatWrapping;
  pathTexture.repeat.set(1, 20); // Repeat along length

  const pathGeom = new THREE.PlaneGeometry(6, 200); // Sedikit lebih lebar dari area flat
  const pathMat = new THREE.MeshStandardMaterial({
    map: pathTexture,
    roughness: 1,
    bumpMap: pathTexture, // Sedikit tekstur kasar
    bumpScale: 0.05,
    transparent: true,
    opacity: 0.9, // Blend sedikit dengan tanah bawahnya
    polygonOffset: true,
    polygonOffsetFactor: -1 // Mencegah z-fighting
  });
  
  // Main Cross (0,0)
  const pathZ = new THREE.Mesh(pathGeom, pathMat);
  pathZ.rotation.x = -Math.PI / 2;
  pathZ.position.y = 0.06;
  pathZ.receiveShadow = true;
  scene.add(pathZ);

  const pathX = pathZ.clone();
  pathX.rotation.z = Math.PI / 2;
  pathX.position.y = 0.07; // Sedikit lebih tinggi untuk menghindari Z-fighting di persimpangan
  scene.add(pathX);

  // Additional Roads for other statues
  // Road at Z=40 (Horizontal)
  const pathZ40 = pathX.clone();
  pathZ40.position.z = 40;
  pathZ40.position.y = 0.07; // Sedikit lebih tinggi
  scene.add(pathZ40);

  // Road at X=-40 (Vertical)
  const pathXMin40 = pathZ.clone();
  pathXMin40.position.x = -40;
  pathXMin40.position.y = 0.06; // Sama dengan pathZ (vertikal)
  scene.add(pathXMin40);
}
createPath();

// INSTANCED GRASS (High Performance Vegetation with Wind Animation)
let grassMaterial; // Global variable for animation

function createGrass() {
    const grassCount = 15000; // Increased density
    const dummy = new THREE.Object3D();
    
    // Geometry: 2 planes intersecting for better volume from all angles
    // Or simple cone. Cone is good for low poly. Let's stick to Cone but thinner.
    const geometry = new THREE.ConeGeometry(0.05, 0.6, 3); // Slightly taller
    geometry.translate(0, 0.3, 0); // Pivot at bottom
    
    grassMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a5a3a, // Slightly fresher green
        roughness: 0.8,
        side: THREE.DoubleSide,
        onBeforeCompile: (shader) => {
            shader.uniforms.time = { value: 0 };
            
            shader.vertexShader = `
                uniform float time;
            ` + shader.vertexShader;
            
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                
                // Wind Animation
                float windFreq = 1.5;
                float windAmp = 0.15;
                float windWave = sin(time * windFreq + position.x * 0.5 + position.z * 0.3);
                
                // Bend factor increases with height (y)
                float bend = max(0.0, position.y); 
                
                transformed.x += windWave * windAmp * bend;
                transformed.z += windWave * windAmp * bend * 0.5;
                `
            );
            
            grassMaterial.userData.shader = shader;
        }
    });
    
    const grassMesh = new THREE.InstancedMesh(geometry, grassMaterial, grassCount);
    grassMesh.receiveShadow = true;
    grassMesh.castShadow = true; // Grass casting shadow adds depth
    
    for(let i=0; i<grassCount; i++) {
        const x = (Math.random() - 0.5) * 190;
        const z = (Math.random() - 0.5) * 190;
        
        // Avoid road area
        // Main Cross
        if(Math.abs(x) < 4 || Math.abs(z) < 4) continue;
        // Path at Z=40
        if(Math.abs(z - 40) < 4) continue;
        // Path at X=-40
        if(Math.abs(x + 40) < 4) continue;

        dummy.position.set(x, 0, z);
        
        // Adjust height based on terrain
        let terrainHeight = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5 + Math.random() * 0.2;
        
        // Flatten logic
        const distToX = Math.abs(z);
        const distToY = Math.abs(x);
        const minDist = Math.min(distToX, distToY);
        
        // Check additional paths
        const distToZ40 = Math.abs(z - 40); // Horizontal path at Z=40
        const distToXMin40 = Math.abs(x + 40); // Vertical path at X=-40
        
        const finalMinDist = Math.min(minDist, distToZ40, distToXMin40);

        const pathWidth = 3.0;
        const blendWidth = 4.0;
        
        if (finalMinDist < pathWidth + blendWidth) {
             const factor = Math.max(0, (finalMinDist - pathWidth) / blendWidth);
             const smoothFactor = factor * factor * (3 - 2 * factor);
             terrainHeight = THREE.MathUtils.lerp(0.05, terrainHeight, smoothFactor);
        }

        dummy.position.y = terrainHeight;
        
        dummy.rotation.y = Math.random() * Math.PI;
        
        // Random scale variation
        const s = 0.6 + Math.random() * 0.6;
        dummy.scale.set(s, s * (0.8 + Math.random() * 0.5), s);
        
        dummy.updateMatrix();
        grassMesh.setMatrixAt(i, dummy.matrix);
    }
    
    scene.add(grassMesh);
}
createGrass();

// Pohon sederhana (Improved Procedural Tree with Bark Texture)
// Generate Bark Texture (High Res & Realistic)
const barkCanvas = document.createElement('canvas');
barkCanvas.width = 1024;
barkCanvas.height = 1024;
const bCtx = barkCanvas.getContext('2d');

// 1. Base Noise (Organic Brown)
bCtx.fillStyle = '#3e2723';
bCtx.fillRect(0,0,1024,1024);

// Helper for noise
function noise(ctx, width, height, density, color, sizeMin, sizeMax) {
    ctx.fillStyle = color;
    for(let i=0; i<density; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const w = sizeMin + Math.random() * (sizeMax - sizeMin);
        const h = sizeMin + Math.random() * (sizeMax - sizeMin);
        ctx.fillRect(x, y, w, h);
    }
}

// 2. Deep Grooves (Vertical Striations)
for(let i=0; i<5000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const w = 2 + Math.random() * 4;
    const h = 50 + Math.random() * 200;
    
    // Gradient for depth
    const grad = bCtx.createLinearGradient(x, y, x+w, y);
    grad.addColorStop(0, '#1a100c'); // Shadow
    grad.addColorStop(0.5, '#2d1b15');
    grad.addColorStop(1, '#1a100c');
    
    bCtx.fillStyle = grad;
    bCtx.fillRect(x, y, w, h);
}

// 3. Moss & Lichen (Greenish Patches)
for(let i=0; i<200; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 20 + Math.random() * 60;
    
    const grad = bCtx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(60, 80, 40, 0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    
    bCtx.fillStyle = grad;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI*2);
    bCtx.fill();
}

// 4. Horizontal Cracks
for(let i=0; i<1000; i++) {
    bCtx.fillStyle = '#0f0805';
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const w = 10 + Math.random() * 30;
    const h = 2 + Math.random() * 3;
    bCtx.fillRect(x, y, w, h);
}

const barkTexture = new THREE.CanvasTexture(barkCanvas);
barkTexture.wrapS = THREE.RepeatWrapping;
barkTexture.wrapT = THREE.RepeatWrapping;
barkTexture.repeat.set(2, 4); // Tiling agar detail terlihat tajam

// Generate Leaf Texture (High Res Foliage)
const leafCanvas = document.createElement('canvas');
leafCanvas.width = 512;
leafCanvas.height = 512;
const lCtx = leafCanvas.getContext('2d');

// 1. Base Dark Background (Deep Shadow)
lCtx.fillStyle = '#051005';
lCtx.fillRect(0, 0, 512, 512);

// 2. Draw Thousands of Leaves
for(let i=0; i<3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = 8 + Math.random() * 12;
    const angle = Math.random() * Math.PI * 2;
    
    lCtx.save();
    lCtx.translate(x, y);
    lCtx.rotate(angle);
    
    // Leaf Shape (Ellipse)
    lCtx.beginPath();
    lCtx.ellipse(0, 0, size, size * 0.4, 0, 0, Math.PI*2);
    
    // Color Variation (Rich Greens)
    const type = Math.random();
    let color;
    if (type < 0.6) {
        // Main Green
        const g = 60 + Math.floor(Math.random() * 60);
        color = `rgba(20, ${g}, 20, 0.9)`;
    } else if (type < 0.9) {
        // Darker/Older
        const g = 30 + Math.floor(Math.random() * 30);
        color = `rgba(10, ${g}, 10, 0.9)`;
    } else {
        // Fresh/Highlight
        const g = 100 + Math.floor(Math.random() * 50);
        color = `rgba(50, ${g}, 30, 0.9)`;
    }
    
    lCtx.fillStyle = color;
    lCtx.fill();
    
    // Leaf Vein (Detail)
    lCtx.beginPath();
    lCtx.moveTo(-size, 0);
    lCtx.lineTo(size, 0);
    lCtx.strokeStyle = 'rgba(0,0,0,0.3)';
    lCtx.lineWidth = 1;
    lCtx.stroke();
    
    lCtx.restore();
}

const leafTexture = new THREE.CanvasTexture(leafCanvas);
leafTexture.wrapS = THREE.RepeatWrapping;
leafTexture.wrapT = THREE.RepeatWrapping;

// Shared Materials (Optimization)
const sharedTrunkMat = new THREE.MeshStandardMaterial({ 
    color: 0x6d4c41, 
    map: barkTexture,
    roughness: 0.9, 
    bumpMap: barkTexture,
    bumpScale: 0.3,
    metalness: 0.1
});

const sharedLeavesMat = new THREE.MeshStandardMaterial({ 
    map: leafTexture,
    color: 0xbbbbbb, // Tint base texture slightly
    roughness: 0.8,
    bumpMap: leafTexture, // Use texture for depth
    bumpScale: 0.5, // Deep texture
    side: THREE.DoubleSide,
    alphaTest: 0.3 // Cutout for sharper edges if we had alpha, but keeps it solid here
});

// Pohon Beringin (Banyan Tree) - Realistic Procedural
function createTree(x, z) {
  const treeGroup = new THREE.Group();
  treeGroup.position.set(x, 0, z);

  // Randomize size
  const scale = 1.5 + Math.random() * 1.0; // Lebih besar dan megah
  treeGroup.scale.set(scale, scale, scale);

  // 1. Main Trunk (Fused Roots System)
  const trunkHeight = 3.5 + Math.random();
  const trunkRadius = 0.6 + Math.random() * 0.4;
  
  // Central core (invisible or inner support)
  const coreGeom = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8);
  const core = new THREE.Mesh(coreGeom, sharedTrunkMat);
  core.position.y = trunkHeight / 2;
  core.castShadow = true;
  core.receiveShadow = true;
  treeGroup.add(core);

  // Surrounding roots (Strangler effect - Batang berotot)
  const rootCount = 5 + Math.floor(Math.random() * 4);
  for(let i=0; i<rootCount; i++) {
      const r = 0.15 + Math.random() * 0.2;
      const h = trunkHeight * (0.9 + Math.random() * 0.2);
      const rootGeom = new THREE.CylinderGeometry(r, r + 0.15, h, 5);
      
      // Wiggle the root vertices for organic look
      const posAttribute = rootGeom.attributes.position;
      for(let v=0; v<posAttribute.count; v++){
          const y = posAttribute.getY(v);
          const wiggleX = Math.sin(y * 3) * 0.1;
          const wiggleZ = Math.cos(y * 2) * 0.1;
          posAttribute.setX(v, posAttribute.getX(v) + wiggleX);
          posAttribute.setZ(v, posAttribute.getZ(v) + wiggleZ);
      }
      rootGeom.computeVertexNormals();

      const root = new THREE.Mesh(rootGeom, sharedTrunkMat);
      
      const angle = (i / rootCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = trunkRadius * (0.7 + Math.random() * 0.3);
      
      root.position.set(Math.cos(angle) * dist, h/2, Math.sin(angle) * dist);
      
      // Random tilt
      root.rotation.set(
          (Math.random()-0.5)*0.15, 
          Math.random()*Math.PI, 
          (Math.random()-0.5)*0.15
      );

      root.castShadow = true;
      treeGroup.add(root);
  }

  // 2. Branches (Spreading wide)
  const branchCount = 5 + Math.floor(Math.random() * 3);
  const branchGroup = new THREE.Group();
  branchGroup.position.y = trunkHeight * 0.85;
  treeGroup.add(branchGroup);

  for(let i=0; i<branchCount; i++) {
      const angle = (i / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const length = 4 + Math.random() * 3;
      const thickness = 0.35;
      
      // Branch Geometry
      const branchGeom = new THREE.CylinderGeometry(0.08, thickness, length, 5);
      branchGeom.translate(0, length/2, 0);
      branchGeom.rotateX(Math.PI / 2); // Point along Z
      
      const branch = new THREE.Mesh(branchGeom, sharedTrunkMat);
      branch.rotation.y = angle;
      const liftAngle = -0.1 - Math.random() * 0.3; // Lift up slightly
      branch.rotation.x = liftAngle; 
      
      branch.castShadow = true;
      branchGroup.add(branch);

      // 3. Leaf Clusters (Foliage)
      // Add multiple clumps along the branch
      const clumps = 4 + Math.floor(Math.random() * 3);
      for(let j=0; j<clumps; j++) {
          const t = 0.3 + (j/clumps) * 0.7; // Distribute along outer part
          const clumpSize = 1.0 + Math.random() * 0.8;
          
          // Use Dodecahedron for leafy look
          const leafGeom = new THREE.DodecahedronGeometry(clumpSize, 0);
          const leaf = new THREE.Mesh(leafGeom, sharedLeavesMat);
          
          // Position relative to branch (Local Z is length)
          leaf.position.set(
              (Math.random()-0.5)*1.5, 
              (Math.random()-0.5)*1.0 + 0.5, // Slightly above branch
              length * t
          );
          
          // Random rotation
          leaf.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
          
          leaf.castShadow = true;
          leaf.receiveShadow = true;
          branch.add(leaf);
      }
      
      // 4. Aerial Roots (Hanging from branches to ground)
      // SMART CHECK: Only spawn if not blocking path
      const rootDrops = 1 + Math.floor(Math.random() * 3);
      for(let r=0; r<rootDrops; r++) {
          const t = 0.4 + Math.random() * 0.5;
          const dist = length * t;
          
          // Calculate world position of the drop point
          // Horizontal distance from center
          const hDist = dist * Math.cos(liftAngle);
          
          const rX_local = Math.sin(angle) * hDist;
          const rZ_local = Math.cos(angle) * hDist;
          
          // World Pos
          const worldX = x + rX_local * scale;
          const worldZ = z + rZ_local * scale;
          
          // PATH COLLISION CHECK
          const onMainCross = Math.abs(worldX) < 5 || Math.abs(worldZ) < 5;
          const onPathZ40 = Math.abs(worldZ - 40) < 5;
          const onPathXMin40 = Math.abs(worldX + 40) < 5;
          
          if (onMainCross || onPathZ40 || onPathXMin40) {
              continue; // SKIP this root if it lands on path
          }

          // Height at that point
          const rY = (trunkHeight * 0.85) + (dist * Math.sin(-liftAngle)); 
          
          // Create root
          const rootH = rY; // Reach ground
          if (rootH > 0.5) {
              const aGeom = new THREE.CylinderGeometry(0.03, 0.05, rootH, 3);
              aGeom.translate(0, rootH/2, 0); // Pivot at bottom (ground)
              const aRoot = new THREE.Mesh(aGeom, sharedTrunkMat);
              
              // Add some randomness to position
              aRoot.position.set(
                  rX_local + (Math.random()-0.5)*0.5, 
                  0, 
                  rZ_local + (Math.random()-0.5)*0.5
              );
              
              aRoot.castShadow = true;
              treeGroup.add(aRoot);
          }
      }
  }
  
  // Top Canopy (Cover the center hole)
  const topGeom = new THREE.DodecahedronGeometry(2.5, 0);
  const top = new THREE.Mesh(topGeom, sharedLeavesMat);
  top.position.y = trunkHeight + 1;
  top.castShadow = true;
  treeGroup.add(top);

  scene.add(treeGroup);
}

// Store tree positions for falling leaves
const treePositions = [];

// Spawn pohon random
for (let i = 0; i < 40; i++) { // Tambah jumlah pohon
  const x = (Math.random() - 0.5) * 160;
  const z = (Math.random() - 0.5) * 160;
  
  // Hindari area tengah (jalan) - expanded exclusion zone
  // Tree radius can be up to ~10 units with branches
  const safeZone = 12; 
  
  // Check main cross
  const onMainCross = Math.abs(x) < safeZone || Math.abs(z) < safeZone;
  // Check additional paths
  const onPathZ40 = Math.abs(z - 40) < safeZone;
  const onPathXMin40 = Math.abs(x + 40) < safeZone;
  
  if (!onMainCross && !onPathZ40 && !onPathXMin40) {
    createTree(x, z);
    treePositions.push({x, z});
  }
}

// Batu dekorasi (Improved Rock Material)
// Texture noise untuk batu
const rockCanvas = document.createElement('canvas');
rockCanvas.width = 256;
rockCanvas.height = 256;
const rCtx = rockCanvas.getContext('2d');
rCtx.fillStyle = '#808080';
rCtx.fillRect(0,0,256,256);
for(let i=0; i<5000; i++) {
    rCtx.fillStyle = Math.random() > 0.5 ? '#606060' : '#a0a0a0';
    rCtx.fillRect(Math.random()*256, Math.random()*256, 2, 2);
}
const rockTexture = new THREE.CanvasTexture(rockCanvas);

function createRock(x, z, scale = 1) {
  // Ganti ke IcosahedronGeometry dengan detail 0 untuk bentuk batu yang lebih tajam/natural
  // Hapus deformasi vertex manual yang menyebabkan mesh berlubang (tembus pandang)
  const rockGeom = new THREE.IcosahedronGeometry(scale, 0); 

  const rockMat = new THREE.MeshStandardMaterial({
    map: rockTexture,
    roughness: 1.0, // Batu sangat kasar
    bumpMap: rockTexture,
    bumpScale: 0.2, // Tekstur lebih dalam
    color: 0x777777
  });
  
  const rock = new THREE.Mesh(rockGeom, rockMat);
  
  // Gunakan Non-Uniform Scaling untuk variasi bentuk
  rock.scale.set(
      1 + (Math.random() * 0.5), // Agak lonjong
      0.6 + (Math.random() * 0.4), // Agak gepeng
      1 + (Math.random() * 0.5)
  );
  
  rock.position.set(x, scale * 0.3, z); // Tertanam di tanah
  rock.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
  
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

for (let i = 0; i < 30; i++) { // Tambah jumlah batu
  const x = (Math.random() - 0.5) * 120;
  const z = (Math.random() - 0.5) * 120;
  
  // Hindari area tengah (jalan)
  // Check main cross
  const onMainCross = Math.abs(x) < 6 || Math.abs(z) < 6;
  // Check additional paths
  const onPathZ40 = Math.abs(z - 40) < 6;
  const onPathXMin40 = Math.abs(x + 40) < 6;
  
  if (!onMainCross && !onPathZ40 && !onPathXMin40) {
    createRock(x, z, 0.5 + Math.random() * 1.0);
  }
}

// =========================
// PUING-PUING CANDI (TEMPLE RUINS) - PROCEDURAL
// =========================

// Texture untuk reruntuhan (Ancient Stone with Moss)
const ruinCanvas = document.createElement('canvas');
ruinCanvas.width = 512;
ruinCanvas.height = 512;
const ruCtx = ruinCanvas.getContext('2d');

// Base stone color
ruCtx.fillStyle = '#5a5a5a';
ruCtx.fillRect(0, 0, 512, 512);

// Noise texture
for(let i=0; i<10000; i++) {
    ruCtx.fillStyle = Math.random() > 0.5 ? '#4a4a4a' : '#6a6a6a';
    ruCtx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
}

// Moss patches (Greenish overlay)
for(let i=0; i<50; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 20 + Math.random() * 40;
    
    const grad = ruCtx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(60, 80, 40, 0.6)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    
    ruCtx.fillStyle = grad;
    ruCtx.beginPath();
    ruCtx.arc(x, y, r, 0, Math.PI*2);
    ruCtx.fill();
}

const ruinTexture = new THREE.CanvasTexture(ruinCanvas);
const ruinMat = new THREE.MeshStandardMaterial({
    map: ruinTexture,
    roughness: 0.9,
    bumpMap: ruinTexture,
    bumpScale: 0.15,
    color: 0x888888
});

function createTempleRuins(x, z) {
    const group = new THREE.Group();
    
    // 1. Hitung ketinggian tanah di posisi ini agar tidak melayang
    // Rumus terrain dari groundGeom:
    // height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5 + noise...
    // Kita ambil estimasi kasar atau tanamkan sedikit
    const terrainHeightEstimate = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
    
    group.position.set(x, terrainHeightEstimate - 0.2, z); // Tanamkan 0.2 unit ke bawah
    
    const type = Math.floor(Math.random() * 3); // 0: Pillar, 1: Wall, 2: Rubble
    
    if (type === 0) { // Broken Pillar
        // Base (Pondasi)
        const baseGeom = new THREE.BoxGeometry(1.2, 0.5, 1.2); // Sedikit lebih tinggi untuk kompensasi tanam
        const base = new THREE.Mesh(baseGeom, ruinMat);
        base.position.y = 0.25;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Pillar
        const height = 1.0 + Math.random() * 2.0;
        const pillarGeom = new THREE.CylinderGeometry(0.4, 0.4, height, 16);
        const pillar = new THREE.Mesh(pillarGeom, ruinMat);
        pillar.position.y = 0.5 + height / 2; // Tepat di atas base (0.5)
        
        // Tilt slightly if it's short (broken)
        if (Math.random() > 0.5) {
            pillar.rotation.z = (Math.random() - 0.5) * 0.2;
            pillar.rotation.x = (Math.random() - 0.5) * 0.2;
        }
        
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        group.add(pillar);
        
        // Top debris (if broken)
        if (Math.random() > 0.3) {
             const debrisGeom = new THREE.DodecahedronGeometry(0.3, 0);
             const debris = new THREE.Mesh(debrisGeom, ruinMat);
             debris.position.set(0.5, 0.2, 0.5); // Di tanah
             debris.castShadow = true;
             debris.receiveShadow = true;
             group.add(debris);
        }
        
    } else if (type === 1) { // Collapsed Wall (FIXED STACKING)
        const blockCount = 3 + Math.floor(Math.random() * 4);
        let currentY = 0; // Pelacak ketinggian tumpukan

        for(let i=0; i<blockCount; i++) {
            const w = 0.8 + Math.random() * 0.4;
            const h = 0.4 + Math.random() * 0.3; // Variasi tinggi
            const d = 0.4 + Math.random() * 0.2;
            
            const block = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ruinMat);
            
            // Posisi Y adalah currentY + setengah tinggi blok ini
            // Dikurangi sedikit (0.05) untuk overlap agar terlihat menyatu/berat
            const yPos = currentY + (h / 2) - (i > 0 ? 0.05 : 0); 
            
            block.position.set(
                (Math.random() - 0.5) * 0.3, // Sedikit geser horizontal (tidak rata)
                yPos, 
                (Math.random() - 0.5) * 0.1
            );
            
            // Update currentY untuk blok berikutnya (tinggi penuh dikurangi overlap)
            currentY += h - (i > 0 ? 0.05 : 0);
            
            // Rotasi acak sedikit agar terlihat tua/miring
            block.rotation.y = (Math.random() - 0.5) * 0.2;
            block.rotation.z = (Math.random() - 0.5) * 0.1; // Miring kiri/kanan
            
            block.castShadow = true;
            block.receiveShadow = true;
            group.add(block);
        }
        
        // Fallen blocks di sekitar tembok
        const fallenCount = 2;
        for(let i=0; i<fallenCount; i++) {
             const block = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), ruinMat);
             block.position.set(
                 0.8 + Math.random() * 0.5,
                 0.15, // Di tanah
                 (Math.random() - 0.5) * 1.0
             );
             block.rotation.set(Math.random(), Math.random(), Math.random());
             block.castShadow = true;
             block.receiveShadow = true;
             group.add(block);
        }

    } else { // Rubble Pile (FIXED FLOATING)
        const count = 6 + Math.floor(Math.random() * 6);
        for(let i=0; i<count; i++) {
            const size = 0.2 + Math.random() * 0.4;
            const geom = Math.random() > 0.5 ? 
                new THREE.DodecahedronGeometry(size, 0) : 
                new THREE.BoxGeometry(size, size, size);
            
            const mesh = new THREE.Mesh(geom, ruinMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 1.2;
            
            // Pastikan menyentuh tanah atau tertumpuk
            // Base height random kecil
            const yBase = size * 0.4; 
            
            mesh.position.set(
                Math.cos(angle) * dist,
                yBase,
                Math.sin(angle) * dist
            );
            
            mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
    }
    
    // Random rotation for the whole group
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
}

// Spawn Ruins Randomly
for (let i = 0; i < 20; i++) {
  const x = (Math.random() - 0.5) * 140;
  const z = (Math.random() - 0.5) * 140;
  
  // Hindari area tengah (jalan)
  const onMainCross = Math.abs(x) < 6 || Math.abs(z) < 6;
  const onPathZ40 = Math.abs(z - 40) < 6;
  const onPathXMin40 = Math.abs(x + 40) < 6;
  
  if (!onMainCross && !onPathZ40 && !onPathXMin40) {
    createTempleRuins(x, z);
  }
}

// Spawn Ruins Around Models (Contextual Placement)
function spawnRuinsAround(centerX, centerZ, count, radius) {
    for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Distance: min 8 (outside path), max radius
        const dist = 8 + Math.random() * (radius - 8); 
        const x = centerX + Math.cos(angle) * dist;
        const z = centerZ + Math.sin(angle) * dist;
        
        // Safety check for paths
        const onMainCross = Math.abs(x) < 5 || Math.abs(z) < 5;
        const onPathZ40 = Math.abs(z - 40) < 5;
        const onPathXMin40 = Math.abs(x + 40) < 5;

        if (!onMainCross && !onPathZ40 && !onPathXMin40) {
             createTempleRuins(x, z);
        }
    }
}

// Add ruins near specific statues to create "ancient site" feel
spawnRuinsAround(0, 0, 8, 25);    // Bhuta Kala (Center)
spawnRuinsAround(0, 40, 6, 20);   // Kuwera Punia
spawnRuinsAround(-40, 0, 6, 20);  // Reog Ponorogo

// MOON MESH (Visual Representation of Light Source)
const moonGeom = new THREE.SphereGeometry(5, 32, 32);
const moonMat = new THREE.MeshBasicMaterial({ color: 0xaaccff }); // Emissive look
const moonMesh = new THREE.Mesh(moonGeom, moonMat);
// Posisikan sama dengan directional light tapi lebih jauh agar terlihat di langit
moonMesh.position.copy(moonLight.position).normalize().multiplyScalar(400); 
scene.add(moonMesh);

// =========================
// OGOH-OGOH SYSTEM
// =========================

const loader = new GLTFLoader();
const ogohOgohList = [];
const mixers = []; // Array untuk menyimpan animation mixer

// 1. Load Bhuta Kala (Ogoh-ogoh Utama)
function loadBhutaKala() {
    const x = 0;
    const z = 0;
    const yPos = 3;
    
    // Create Torches
    createTorchLight(x + 8, 1, z + 8);
    createTorchLight(x - 8, 1, z - 8);
    createTorchLight(x + 8, 1, z - 8);
    createTorchLight(x - 8, 1, z + 8);

    loader.load('ogoh.glb', (gltf) => {
        const model = gltf.scene;
        model.position.set(x, yPos, z);
        model.scale.set(5, 5, 5);
        model.rotation.y = 3 * Math.PI / 2; // Diputar 180 derajat dari posisi sebelumnya (90 -> 270)
        
        // Check & Play Animation
        if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
            mixers.push(mixer);
            console.log("Animation found for Bhuta Kala");
        }

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Fix Lighting
                if (child.material) {
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.8;
                    child.material.needsUpdate = true;
                }
            }
        });
        
        model.userData = {
            name: "Bhuta Kala",
            description: "Raksasa penguasa waktu dan kematian",
            originalY: yPos
        };
        
        scene.add(model);
        ogohOgohList.push(model);
        console.log("Bhuta Kala loaded");
    }, undefined, (err) => console.error("Error loading Bhuta Kala:", err));
}

// 2. Load Kuwera Punia
function loadKuwera() {
    const x = 0;
    const z = 40;
    const yPos = 0; // Adjust based on model
    
    // Create Torches
    createTorchLight(x + 5, 1, z + 5);
    createTorchLight(x - 5, 1, z - 5);
    createTorchLight(x + 5, 1, z - 5);
    createTorchLight(x - 5, 1, z + 5);

    loader.load('kuwera_punia.glb', (gltf) => {
        const model = gltf.scene;
        model.position.set(x, yPos, z);
        model.scale.set(3, 3, 3); // Diperbesar dari 0.03 ke 5
        model.rotation.y = Math.PI; // Putar 180 derajat
        
        // Check & Play Animation
        if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
            mixers.push(mixer);
            console.log("Animation found for Kuwera");
        }

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Fix Lighting
                if (child.material) {
                    child.material.metalness = 0.0;
                    child.material.roughness = 0.8;
                    
                    // Brighten base color (Reset to white to ensure full texture brightness)
                    if (child.material.color) child.material.color.setHex(0xffffff);
                    
                    // Reduce Ambient Occlusion if it's making it dirty/dark
                    child.material.aoMapIntensity = 0.2;
                    
                    child.material.needsUpdate = true;
                }
            }
        });
        
        model.userData = {
            name: "Kuwera Punia",
            description: "Simbol kemakmuran dan kesejahteraan",
            originalY: yPos
        };
        
        scene.add(model);
        ogohOgohList.push(model);
        console.log("Kuwera loaded");
    }, undefined, (err) => console.error("Error loading Kuwera:", err));
}

// 3. Load Reog (Ex-Barongsai)
function loadReog() {
    const x = -40;
    const z = 0;
    const yPos = 5; // Dinaikkan agar tidak tenggelam (karena scale besar)
    
    // Create Torches
    createTorchLight(x + 5, 1, z + 5);
    createTorchLight(x - 5, 1, z - 5);
    createTorchLight(x + 5, 1, z - 5);
    createTorchLight(x - 5, 1, z + 5);

    loader.load('reog.glb', (gltf) => {
        const model = gltf.scene;
        model.position.set(x, yPos, z);
        model.scale.set(10, 10, 10); // Diperbesar dari 3 ke 10
        
        // Check & Play Animation
        if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
            mixers.push(mixer);
            console.log("Animation found for Reog");
        }

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Fix Lighting
                if (child.material) {
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.8;
                    child.material.needsUpdate = true;
                }
            }
        });
        
        model.userData = {
            name: "Reog Ponorogo",
            description: "Semangat pelindung dan keberuntungan",
            originalY: yPos
        };
        
        scene.add(model);
        ogohOgohList.push(model);
        console.log("Reog loaded");
    }, undefined, (err) => console.error("Error loading Reog:", err));
}

// Execute Loaders
loadBhutaKala();
loadKuwera();
loadReog();

// =========================
// PLAYER MOVEMENT SYSTEM (IMPROVED)
// =========================

const playerState = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  isSprinting: false, // Status lari
  canJump: true,
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  speed: 12, // Kecepatan jalan normal
  sprintSpeed: 25, // Kecepatan lari
  jumpHeight: 10,
  bobTimer: 0, // Untuk head bobbing
  defaultCameraY: 2 // Tinggi mata default
};

// Keyboard controls
document.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "KeyW":
    case "ArrowUp":
      playerState.moveForward = true;
      break;
    case "KeyS":
    case "ArrowDown":
      playerState.moveBackward = true;
      break;
    case "KeyA":
    case "ArrowLeft":
      playerState.moveLeft = true;
      break;
    case "KeyD":
    case "ArrowRight":
      playerState.moveRight = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      playerState.isSprinting = true;
      break;
    case "Space":
      if (playerState.canJump) {
        playerState.velocity.y = playerState.jumpHeight;
        playerState.canJump = false;
      }
      break;
    case "Digit1": // Toggle Music
      toggleMusic();
      break;
    case "Digit2": // Toggle Day/Night
      isNight = !isNight;
      toggleDayNight();
      break;
  }
});

document.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "KeyW":
    case "ArrowUp":
      playerState.moveForward = false;
      break;
    case "KeyS":
    case "ArrowDown":
      playerState.moveBackward = false;
      break;
    case "KeyA":
    case "ArrowLeft":
      playerState.moveLeft = false;
      break;
    case "KeyD":
    case "ArrowRight":
      playerState.moveRight = false;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      playerState.isSprinting = false;
      break;
  }
});

// =========================
// UI SYSTEM
// =========================

// Overlay untuk pointer lock
const blocker = document.createElement("div");
blocker.id = "blocker";
blocker.style.cssText =
  "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1000; font-family: Segoe UI, sans-serif; color: white;";

blocker.innerHTML =
  '<h1 style="font-size: 48px; margin-bottom: 10px; color: #ff6b35;">FESTIVAL BUDAYA NYEPI</h1><p id="modeText" style="font-size: 18px; color: #aaa; margin-bottom: 30px;">Jelajahi Keindahan Budaya & Ogoh-ogoh</p><button id="playBtn" style="padding: 15px 40px; font-size: 20px; background: linear-gradient(45deg, #ff6b35, #f7931e); border: none; border-radius: 10px; color: white; cursor: pointer; font-weight: bold;">MULAI JELAJAH</button><div style="margin-top: 40px; text-align: center; color: #888;"><p>WASD atau Arrow Keys - Bergerak</p><p>Shift - Lari (Sprint)</p><p>Mouse - Melihat sekeliling</p><p>Space - Lompat</p><p>[1] Musik | [2] Siang/Malam</p><p>Dekati Objek Budaya untuk melihat info</p></div>';
document.body.appendChild(blocker);

document.getElementById("playBtn").addEventListener("click", () => {
  controls.lock();
});

controls.addEventListener("lock", () => {
  blocker.style.display = "none";
});

controls.addEventListener("unlock", () => {
  blocker.style.display = "flex";
});

// HUD
const hud = document.createElement("div");
hud.style.cssText =
  "position: fixed; top: 20px; left: 20px; padding: 15px 20px; background: rgba(0, 0, 0, 0.7); color: white; font-family: Segoe UI, sans-serif; border-radius: 10px; border-left: 4px solid #ff6b35; z-index: 100; display: none;";
hud.innerHTML =
  '<div style="font-size: 14px; color: #ff6b35; font-weight: bold;">FESTIVAL NYEPI</div><div id="playerPos" style="font-size: 12px; margin-top: 5px; color: #aaa;">Posisi: 0, 0</div><div id="nearestOgoh" style="font-size: 12px; margin-top: 5px; color: #aaa;">Dekati Objek Budaya...</div>';
document.body.appendChild(hud);

// Crosshair
const crosshair = document.createElement("div");
crosshair.style.cssText =
  "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.5); border-radius: 50%; z-index: 100; pointer-events: none; display: none;";
document.body.appendChild(crosshair);

// Info panel untuk Ogoh-ogoh
const infoPanel = document.createElement("div");
infoPanel.id = "ogohInfo";
infoPanel.style.cssText =
  "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); padding: 20px 30px; background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(30,10,10,0.95) 100%); color: white; font-family: Segoe UI, sans-serif; border-radius: 15px; border: 2px solid #ff6b35; z-index: 100; display: none; text-align: center; max-width: 400px;";
document.body.appendChild(infoPanel);

// Minimap
const minimap = document.createElement("canvas");
minimap.width = 150;
minimap.height = 150;
minimap.style.cssText =
  "position: fixed; bottom: 20px; right: 20px; border: 2px solid #ff6b35; border-radius: 10px; background: rgba(0, 0, 0, 0.7); z-index: 100; display: none;";
document.body.appendChild(minimap);
const minimapCtx = minimap.getContext("2d");

function updateMinimap() {
  minimapCtx.clearRect(0, 0, 150, 150);
  minimapCtx.fillStyle = "rgba(30, 50, 30, 0.8)";
  minimapCtx.fillRect(0, 0, 150, 150);

  // Player position
  const px = 75 + (camera.position.x / 100) * 75;
  const pz = 75 + (camera.position.z / 100) * 75;
  minimapCtx.fillStyle = "#00ff00";
  minimapCtx.beginPath();
  minimapCtx.arc(px, pz, 5, 0, Math.PI * 2);
  minimapCtx.fill();

  // Ogoh-ogoh positions
  minimapCtx.fillStyle = "#ff6b35";
  ogohOgohList.forEach((ogoh) => {
    const ox = 75 + (ogoh.position.x / 100) * 75;
    const oz = 75 + (ogoh.position.z / 100) * 75;
    minimapCtx.beginPath();
    minimapCtx.arc(ox, oz, 4, 0, Math.PI * 2);
    minimapCtx.fill();
  });
}

// =========================
// AUDIO SYSTEM
// =========================

const listener = new THREE.AudioListener();
camera.add(listener);

const bgMusic = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load("/reog-music.mp3", (buffer) => {
  bgMusic.setBuffer(buffer);
  bgMusic.setLoop(true);
  bgMusic.setVolume(0.3);
});

// Music toggle button
const musicBtn = document.createElement("button");
musicBtn.innerText = "[1] Musik: OFF";
musicBtn.style.cssText =
  "position: fixed; top: 20px; right: 20px; padding: 10px 15px; background: rgba(0, 0, 0, 0.7); color: white; border: 2px solid #ff6b35; border-radius: 8px; cursor: pointer; font-size: 14px; z-index: 100; display: none;";

function toggleMusic() {
  if (bgMusic.isPlaying) {
    bgMusic.pause();
    musicBtn.innerText = "[1] Musik: OFF";
  } else {
    bgMusic.play();
    musicBtn.innerText = "[1] Musik: ON";
  }
}

musicBtn.onclick = toggleMusic;
document.body.appendChild(musicBtn);

// Day/Night Toggle
let isNight = true;
const dayNightBtn = document.createElement("button");
dayNightBtn.innerText = "[2] Mode: Malam";
dayNightBtn.style.cssText =
  "position: fixed; top: 70px; right: 20px; padding: 10px 15px; background: rgba(0, 0, 0, 0.7); color: white; border: 2px solid #ff6b35; border-radius: 8px; cursor: pointer; font-size: 14px; z-index: 100; display: none;";

dayNightBtn.onclick = () => {
  isNight = !isNight;
  toggleDayNight();
};
document.body.appendChild(dayNightBtn);

function toggleDayNight() {
    const starField = scene.getObjectByName("starField");
    // const fireParticles = scene.getObjectByName("fireParticles"); // Removed
    const fireflies = scene.getObjectByName("fireflies"); // Kunang-kunang
    const modeText = document.getElementById("modeText");

    if (isNight) {
        // Switch to Night
        dayNightBtn.innerText = "[2] Mode: Malam";
        scene.background = new THREE.Color(0x050510);
        scene.fog.color.setHex(0x050510);
        scene.fog.density = 0.002;
        
        // Lighting (Night) - Improved for visibility
        ambientLight.color.setHex(0x1a1a30); // Sedikit lebih terang dari sebelumnya (Blue tint)
        ambientLight.intensity = 0.4; // Naikkan agar tidak terlalu gelap gulita
        
        hemiLight.color.setHex(0x2a2a50); // Langit malam biru
        hemiLight.groundColor.setHex(0x050510); // Tanah gelap
        hemiLight.intensity = 0.4;

        // Moon settings (Cold Blue)
        moonLight.color.setHex(0xaaccff);
        moonLight.intensity = 2.0; // Balance dengan ambient yang naik
        moonLight.position.set(50, 100, 100); // Cahaya dari depan-atas-kanan
        
        // Update Moon Mesh Appearance
        if(moonMesh) {
            moonMesh.material.color.setHex(0xaaccff); // Pale Blue Moon
            moonMesh.position.copy(moonLight.position).normalize().multiplyScalar(400);
            moonMesh.scale.set(1, 1, 1); // Normal size
        }

        // Stars visible
        if(starField) starField.visible = true;
        // if(fireParticles) fireParticles.visible = true;
        if(fireflies) fireflies.visible = true;
        
        // Torches visible
        torchLights.forEach(l => l.visible = true);
        flameObjects.forEach(f => f.group.visible = true);
        sparkParticles.forEach(p => p.mesh.visible = true);
        
        // Bloom strong
        bloomPass.strength = 0.8;
        bloomPass.threshold = 0.2;

        // Text
        if(modeText) modeText.innerText = "Jelajahi Keindahan Budaya saat malam Nyepi";
        
    } else {
        // Switch to Day
        dayNightBtn.innerText = "[2] Mode: Siang";
        scene.background = new THREE.Color(0x87CEEB); // Sky Blue
        scene.fog.color.setHex(0x87CEEB);
        scene.fog.density = 0.0008; // Kabut sangat tipis
        
        // Lighting (Day) - Bright & Clear
        ambientLight.color.setHex(0xffffff);
        ambientLight.intensity = 0.9; // Hampir penuh agar bayangan tidak hitam
        
        hemiLight.color.setHex(0xffffff); // Langit putih/biru cerah
        hemiLight.groundColor.setHex(0x5d4037); // Pantulan tanah coklat
        hemiLight.intensity = 0.8;

        // Sun settings (Warm White)
        moonLight.color.setHex(0xffffee); 
        moonLight.intensity = 3.5; // Matahari terang
        // Posisi matahari optimal untuk menerangi objek
        moonLight.position.set(30, 100, 80); 
        
        // Update Sun Mesh Appearance
        if(moonMesh) {
            moonMesh.material.color.setHex(0xffaa00); // Bright Orange/Yellow Sun
            moonMesh.position.copy(moonLight.position).normalize().multiplyScalar(400);
            moonMesh.scale.set(1.5, 1.5, 1.5); // Bigger Sun
        }

        // Stars invisible
        if(starField) starField.visible = false;
        // if(fireParticles) fireParticles.visible = false;
        if(fireflies) fireflies.visible = false;
        
        // Torches invisible
        torchLights.forEach(l => l.visible = false);
        flameObjects.forEach(f => f.group.visible = false);
        sparkParticles.forEach(p => p.mesh.visible = false);
        
        // Bloom weak but present for sun glare
        bloomPass.strength = 0.15;
        bloomPass.threshold = 0.9;

        // Text
        if(modeText) modeText.innerText = "Jelajahi Keindahan Budaya saat hari Nyepi";
    }
}

// =========================
// PROXIMITY INTERACTION
// =========================

let currentNearestOgoh = null;

function checkProximity() {
  let nearest = null;
  let nearestDist = Infinity;

  ogohOgohList.forEach((ogoh) => {
    const dist = camera.position.distanceTo(ogoh.position);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = ogoh;
    }
  });

  const nearestInfo = document.getElementById("nearestOgoh");

  if (nearest && nearestDist < 20) {
    currentNearestOgoh = nearest;
    nearestInfo.innerHTML =
      '<span style="color: #ff6b35;">' +
      nearest.userData.name +
      "</span> (" +
      nearestDist.toFixed(1) +
      "m)";

    // Show info panel
    infoPanel.style.display = "block";
    infoPanel.innerHTML =
      '<div style="font-size: 24px; color: #ff6b35; margin-bottom: 10px;">' +
      nearest.userData.name +
      '</div><div style="font-size: 14px; color: #ccc;">' +
      nearest.userData.description +
      '</div><div style="font-size: 11px; color: #666; margin-top: 10px;">Jarak: ' +
      nearestDist.toFixed(1) +
      " meter</div>";

    // Animate ogoh-ogoh when near
    nearest.position.y =
      nearest.userData.originalY + Math.sin(Date.now() * 0.003) * 0.2;
  } else {
    currentNearestOgoh = null;
    nearestInfo.innerHTML = "Dekati Objek Budaya...";
    infoPanel.style.display = "none";
  }
}

// =========================
// PARTICLE SYSTEM - KUNANG-KUNANG
// =========================

// Kunang-kunang (Fireflies)
function createFireflies() {
    const count = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count); // Untuk kedip-kedip

    for(let i=0; i<count; i++) {
        positions[i*3] = (Math.random() - 0.5) * 180;
        positions[i*3+1] = 1 + Math.random() * 8; // Terbang rendah
        positions[i*3+2] = (Math.random() - 0.5) * 180;
        phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.PointsMaterial({
        color: 0xccff00, // Kuning kehijauan
        size: 0.4,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const fireflies = new THREE.Points(geometry, material);
    fireflies.name = "fireflies";
    fireflies.visible = false; // Default hidden (Day mode)
    scene.add(fireflies);
}
createFireflies();

// Daun Gugur (Falling Leaves)
function createFallingLeaves() {
    const count = 200; // Increased count for better effect under trees
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for(let i=0; i<count; i++) {
        // Pick random tree
        const tree = treePositions[Math.floor(Math.random() * treePositions.length)];
        const r = Math.random() * 4; // Radius around tree (canopy size)
        const theta = Math.random() * Math.PI * 2;

        positions[i*3] = tree.x + Math.cos(theta) * r;
        positions[i*3+1] = 5 + Math.random() * 5; // Start height
        positions[i*3+2] = tree.z + Math.sin(theta) * r;
        speeds[i] = 0.5 + Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.PointsMaterial({
        color: 0x2e7d32, // Hijau daun
        size: 0.3,
        transparent: true,
        opacity: 0.8
    });

    const leaves = new THREE.Points(geometry, material);
    leaves.name = "fallingLeaves";
    scene.add(leaves);
}
createFallingLeaves();

// =========================
// RESPONSIVE
// =========================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// =========================
// ANIMATION LOOP (PHYSICS BASED)
// =========================

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // Use Three.js clock for stable delta
  const time = clock.getElapsedTime();

  // Update Mixers (Animations)
  mixers.forEach(mixer => mixer.update(delta));

  if (controls.isLocked) {
    // Show UI elements
    hud.style.display = "block";
    crosshair.style.display = "block";
    minimap.style.display = "block";
    musicBtn.style.display = "block";
    dayNightBtn.style.display = "block";

    // --- PHYSICS MOVEMENT ---
    
    // Damping (Inertia) - Slow down when not pressing keys
    playerState.velocity.x -= playerState.velocity.x * 10.0 * delta;
    playerState.velocity.z -= playerState.velocity.z * 10.0 * delta;
    playerState.velocity.y -= 9.8 * 2.0 * delta; // Gravity (Mass 2.0)

    playerState.direction.z = Number(playerState.moveForward) - Number(playerState.moveBackward);
    playerState.direction.x = Number(playerState.moveRight) - Number(playerState.moveLeft);
    playerState.direction.normalize();

    // Acceleration
    if (playerState.moveForward || playerState.moveBackward) {
      playerState.velocity.z -= playerState.direction.z * 400.0 * delta; // Force based
    }
    if (playerState.moveLeft || playerState.moveRight) {
      playerState.velocity.x -= playerState.direction.x * 400.0 * delta;
    }

    // Terminal Velocity Cap
    const maxSpeed = playerState.isSprinting ? playerState.sprintSpeed : playerState.speed;
    const currentSpeed = Math.sqrt(playerState.velocity.x**2 + playerState.velocity.z**2);
    if (currentSpeed > maxSpeed) {
        const ratio = maxSpeed / currentSpeed;
        playerState.velocity.x *= ratio;
        playerState.velocity.z *= ratio;
    }

    // Apply movement
    controls.moveRight(-playerState.velocity.x * delta);
    controls.moveForward(-playerState.velocity.z * delta);

    // Gravity
    playerState.velocity.y -= 9.8 * 2.0 * delta; // Gravity
    camera.position.y += playerState.velocity.y * delta;

    // Floor collision (Simple flat ground)
    const groundHeight = 2;
    if (camera.position.y < groundHeight) {
      playerState.velocity.y = 0;
      camera.position.y = groundHeight;
      playerState.canJump = true;
    }

    // --- HEAD BOBBING ---
    if (playerState.canJump) {
        if (currentSpeed > 0.5) {
            // Walking Bobbing
            playerState.bobTimer += delta * 15; 
            const bobOffset = Math.sin(playerState.bobTimer) * 0.1;
            camera.position.y = groundHeight + Math.abs(bobOffset); 
        } else {
            // Idle - Reset height
            playerState.bobTimer = 0;
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, groundHeight, delta * 10);
        }
    }

    // Boundary check
    camera.position.x = Math.max(-95, Math.min(95, camera.position.x));
    camera.position.z = Math.max(-95, Math.min(95, camera.position.z));

    // Update HUD
    document.getElementById("playerPos").textContent =
      "Posisi: " +
      camera.position.x.toFixed(0) +
      ", " +
      camera.position.z.toFixed(0);

    // Check proximity to Ogoh-ogoh
    checkProximity();

    // Update minimap
    updateMinimap();
  } else {
    hud.style.display = "none";
    crosshair.style.display = "none";
    minimap.style.display = "none";
    musicBtn.style.display = "none";
    dayNightBtn.style.display = "none";
  }

  // Animate Fireflies (Kunang-kunang)
  const fireflies = scene.getObjectByName("fireflies");
  if (fireflies && fireflies.visible) {
      const positions = fireflies.geometry.attributes.position.array;
      const phases = fireflies.geometry.attributes.phase.array;
      
      for(let i=0; i<phases.length; i++) {
          // Gerakan naik turun & random
          positions[i*3+1] += Math.sin(time * 2 + phases[i]) * 0.02;
          positions[i*3] += Math.cos(time * 0.5 + phases[i]) * 0.02;
          positions[i*3+2] += Math.sin(time * 0.5 + phases[i]) * 0.02;
          
          // Kedip-kedip (Opacity hack via scale or color if shader, but here simple movement)
      }
      fireflies.geometry.attributes.position.needsUpdate = true;
  }

  // Animate Falling Leaves
  const leaves = scene.getObjectByName("fallingLeaves");
  if (leaves) {
      const positions = leaves.geometry.attributes.position.array;
      const speeds = leaves.geometry.attributes.speed.array;
      
      for(let i=0; i<speeds.length; i++) {
          positions[i*3+1] -= speeds[i] * delta; // Jatuh ke bawah
          positions[i*3] += Math.sin(time + i) * 0.02; // Goyang kiri kanan
          
          // Reset jika sudah di tanah
          if(positions[i*3+1] < 0) {
              // Respawn at random tree
              const tree = treePositions[Math.floor(Math.random() * treePositions.length)];
              const r = Math.random() * 4;
              const theta = Math.random() * Math.PI * 2;

              positions[i*3] = tree.x + Math.cos(theta) * r;
              positions[i*3+1] = 8 + Math.random() * 4; // Reset height
              positions[i*3+2] = tree.z + Math.sin(theta) * r;
          }
      }
      leaves.geometry.attributes.position.needsUpdate = true;
  }

  // Animate flames (Realistic Flicker & Sparks)
  
  // 1. Light Intensity Flicker
  torchLights.forEach(light => {
      const flicker = Math.sin(time * 20 + light.userData.phase) * 0.1 + Math.random() * 0.1;
      light.intensity = light.userData.baseIntensity * (0.8 + flicker);
  });

  // 2. Flame Mesh Animation
  flameObjects.forEach((obj) => {
    const phase = obj.group.userData.phase;
    
    // Core: Stabil, sedikit berdenyut
    const coreScale = 1.0 + Math.sin(time * 15 + phase) * 0.1;
    obj.core.scale.setScalar(coreScale);

    // Inner: Lebih liar
    const innerScale = 1.0 + Math.sin(time * 20 + phase) * 0.2 + Math.cos(time * 10) * 0.1;
    obj.inner.scale.set(innerScale, innerScale * 1.2, innerScale);
    obj.inner.rotation.y += delta * 2;

    // Outer: Paling liar dan transparan
    const outerScale = 1.0 + Math.sin(time * 25 + phase) * 0.3;
    obj.outer.scale.set(outerScale, outerScale * 1.5, outerScale);
    obj.outer.rotation.y -= delta * 1.5;
    obj.outer.material.opacity = 0.3 + Math.sin(time * 10) * 0.1;
  });

  // 3. Spark Particles Animation
  sparkParticles.forEach(p => {
      p.mesh.position.y += delta * p.speed;
      p.mesh.rotation.z += delta * 2;
      p.mesh.material.opacity -= delta * 0.8; // Fade out faster

      // Reset if too high or invisible
      if(p.mesh.position.y > p.baseY + 1.5 || p.mesh.material.opacity <= 0) {
          resetSpark(p.mesh, p.baseX, p.baseY, p.baseZ);
      }
  });

  // 4. Grass Wind Animation
  if (grassMaterial && grassMaterial.userData.shader) {
      grassMaterial.userData.shader.uniforms.time.value = time;
  }

  // RENDER DENGAN POST-PROCESSING
  composer.render();
}

// Initialize Day/Night State
toggleDayNight();

animate();
