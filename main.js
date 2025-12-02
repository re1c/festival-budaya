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
function createTorchLight(x, y, z) {
  // PointLight untuk pencahayaan sekitar
  const torchLight = new THREE.PointLight(0xff5500, 50, 25, 2); // High intensity for bloom
  torchLight.position.set(x, y + 0.5, z);
  torchLight.castShadow = true; // Enable shadow untuk realisme dramatis
  torchLight.shadow.bias = -0.0001;
  scene.add(torchLight);

  // Visual obor
  const torchGeom = new THREE.CylinderGeometry(0.05, 0.08, 1.5, 8);
  const torchMat = new THREE.MeshStandardMaterial({ 
    color: 0x2a1a0a,
    roughness: 0.9 
  });
  const torch = new THREE.Mesh(torchGeom, torchMat);
  torch.position.set(x, y - 0.75, z);
  torch.castShadow = true;
  scene.add(torch);

  // Api (Core - Putih panas)
  const fireCoreGeom = new THREE.SphereGeometry(0.15, 8, 8);
  const fireCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Putih untuk pusat panas
  const fireCore = new THREE.Mesh(fireCoreGeom, fireCoreMat);
  fireCore.position.set(x, y + 0.2, z);
  scene.add(fireCore);

  // Api (Outer - Orange Glow)
  const fireGeom = new THREE.SphereGeometry(0.25, 8, 8);
  const fireMat = new THREE.MeshBasicMaterial({ 
    color: 0xff4400,
    transparent: true,
    opacity: 0.8
  });
  const fire = new THREE.Mesh(fireGeom, fireMat);
  fire.position.set(x, y + 0.3, z);
  fire.userData.isFlame = true;
  
  // Randomize phase biar gak sinkron semua
  fire.userData.phase = Math.random() * Math.PI * 2;
  
  scene.add(fire);
  flameObjects.push(fire); 

  return { light: torchLight, fire };
}

// =========================
// TERRAIN - OPEN WORLD (IMPROVED)
// =========================

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Procedural Grid Texture untuk tanah (biar tidak polos)
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const context = canvas.getContext('2d');
context.fillStyle = '#1a2a1a'; // Base dark green
context.fillRect(0, 0, 512, 512);
// Add noise
for(let i=0; i<50000; i++) {
    context.fillStyle = Math.random() > 0.5 ? '#2a3a2a' : '#152015';
    context.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
}
const groundTexture = new THREE.CanvasTexture(canvas);
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50);

// Ground - tanah luas
const groundGeom = new THREE.PlaneGeometry(200, 200, 128, 128); // Lebih detail vertices
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
    
    if (minDist < pathWidth + blendWidth) {
        const factor = Math.max(0, (minDist - pathWidth) / blendWidth); // 0 at path, 1 at outside
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

// Jalan setapak (Improved Visuals)
function createPath() {
  // Texture untuk jalan (Dirt Road)
  const pathCanvas = document.createElement('canvas');
  pathCanvas.width = 512;
  pathCanvas.height = 512;
  const pCtx = pathCanvas.getContext('2d');
  
  // Base dirt color
  pCtx.fillStyle = '#3e2b1f'; 
  pCtx.fillRect(0, 0, 512, 512);
  
  // Add noise/pebbles
  for(let i=0; i<10000; i++) {
      pCtx.fillStyle = Math.random() > 0.5 ? '#4a3728' : '#2a1a0a';
      const s = Math.random() * 3;
      pCtx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
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
  
  const path = new THREE.Mesh(pathGeom, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.06; // Sedikit di atas tanah yang sudah di-flatten (0.05)
  path.receiveShadow = true;
  scene.add(path);

  // Path horizontal
  const path2 = path.clone();
  path2.rotation.z = Math.PI / 2;
  path2.receiveShadow = true;
  scene.add(path2);
}
createPath();

// INSTANCED GRASS (High Performance Vegetation)
function createGrass() {
    const grassCount = 10000;
    const dummy = new THREE.Object3D();
    
    // Simple blade geometry
    const geometry = new THREE.ConeGeometry(0.05, 0.5, 2);
    geometry.translate(0, 0.25, 0); // Pivot at bottom
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x2a4a2a,
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    
    const grassMesh = new THREE.InstancedMesh(geometry, material, grassCount);
    grassMesh.receiveShadow = true;
    
    for(let i=0; i<grassCount; i++) {
        const x = (Math.random() - 0.5) * 180;
        const z = (Math.random() - 0.5) * 180;
        
        // Avoid road area (simple check)
        if(Math.abs(x) < 4 || Math.abs(z) < 4) continue; // Lebarkan area bebas rumput

        dummy.position.set(x, 0, z);
        
        // Adjust height based on terrain (approximate)
        // Harus sama dengan rumus terrain di atas
        let terrainHeight = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5 + Math.random() * 0.2;
        
        // Flatten logic for grass placement (biar gak melayang di pinggir jalan)
        const distToX = Math.abs(z);
        const distToY = Math.abs(x);
        const minDist = Math.min(distToX, distToY);
        const pathWidth = 3.0;
        const blendWidth = 4.0;
        
        if (minDist < pathWidth + blendWidth) {
             const factor = Math.max(0, (minDist - pathWidth) / blendWidth);
             const smoothFactor = factor * factor * (3 - 2 * factor);
             terrainHeight = THREE.MathUtils.lerp(0.05, terrainHeight, smoothFactor);
        }

        dummy.position.y = terrainHeight;
        
        dummy.rotation.y = Math.random() * Math.PI;
        
        // Random scale
        const s = 0.5 + Math.random() * 0.5;
        dummy.scale.set(s, s * (1 + Math.random()), s);
        
        dummy.updateMatrix();
        grassMesh.setMatrixAt(i, dummy.matrix);
    }
    
    scene.add(grassMesh);
}
createGrass();

// Pohon sederhana
function createTree(x, z) {
  const trunkGeom = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.set(x, 1.5, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leavesGeom = new THREE.SphereGeometry(2, 8, 8);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1a4a1a });
  const leaves = new THREE.Mesh(leavesGeom, leavesMat);
  leaves.position.set(x, 4, z);
  leaves.castShadow = true;
  scene.add(leaves);
}

// Spawn pohon random
for (let i = 0; i < 30; i++) {
  const x = (Math.random() - 0.5) * 150;
  const z = (Math.random() - 0.5) * 150;
  // Hindari area tengah (jalan) - expanded exclusion zone
  if (Math.abs(x) > 15 && Math.abs(z) > 15) {
    createTree(x, z);
  }
}

// Batu dekorasi
function createRock(x, z, scale = 1) {
  const rockGeom = new THREE.DodecahedronGeometry(scale, 0);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.9,
  });
  const rock = new THREE.Mesh(rockGeom, rockMat);
  rock.position.set(x, scale * 0.5, z);
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  scene.add(rock);
}

for (let i = 0; i < 20; i++) {
  const x = (Math.random() - 0.5) * 100;
  const z = (Math.random() - 0.5) * 100;
  // Hindari area tengah (jalan)
  if (Math.abs(x) > 15 && Math.abs(z) > 15) {
    createRock(x, z, 0.5 + Math.random() * 1);
  }
}

// =========================
// OGOH-OGOH SYSTEM
// =========================

const loader = new GLTFLoader();
const ogohOgohList = [];

// Lokasi spawn Ogoh-ogoh (hanya 1 untuk optimasi)
const ogohLocations = [
  {
    x: 0,
    z: 0,
    scale: 5,
    name: "Bhuta Kala",
    desc: "Raksasa penguasa waktu dan kematian",
  },
];

function loadOgohOgoh(location, index) {
  const yPos = 3; // Posisi Y lebih tinggi

  loader.load(
    "/ogoh.glb",
    (gltf) => {
      const ogoh = gltf.scene;
      ogoh.position.set(location.x, yPos, location.z);
      ogoh.scale.set(location.scale, location.scale, location.scale);

      // Random rotation
      ogoh.rotation.y = Math.random() * Math.PI * 2;

      ogoh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(ogoh);

      // Data untuk interaksi
      ogoh.userData = {
        name: location.name,
        description: location.desc,
        index: index,
        originalY: yPos,
      };

      ogohOgohList.push(ogoh);

      // Tambah obor di sekitar (lowered to ground level, away from road)
      createTorchLight(location.x + 8, 1, location.z + 8);
      createTorchLight(location.x - 8, 1, location.z - 8);
      createTorchLight(location.x + 8, 1, location.z - 8);
      createTorchLight(location.x - 8, 1, location.z + 8);

      console.log("Ogoh-ogoh loaded:", location.name);
    },
    undefined,
    (err) => console.error("Failed to load Ogoh-ogoh:", err)
  );
}

// Load semua Ogoh-ogoh
ogohLocations.forEach((loc, i) => loadOgohOgoh(loc, i));

// =========================
// PLAYER MOVEMENT SYSTEM (IMPROVED)
// =========================

const playerState = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  canJump: true,
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  speed: 12, // Sedikit lebih lambat agar terasa berat/realistis
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
    case "Space":
      if (playerState.canJump) {
        playerState.velocity.y = playerState.jumpHeight;
        playerState.canJump = false;
      }
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
  '<h1 style="font-size: 48px; margin-bottom: 10px; color: #ff6b35;">OGOH-OGOH WORLD</h1><p style="font-size: 18px; color: #aaa; margin-bottom: 30px;">Jelajahi dunia Ogoh-ogoh saat malam Nyepi</p><button id="playBtn" style="padding: 15px 40px; font-size: 20px; background: linear-gradient(45deg, #ff6b35, #f7931e); border: none; border-radius: 10px; color: white; cursor: pointer; font-weight: bold;">MULAI JELAJAH</button><div style="margin-top: 40px; text-align: center; color: #888;"><p>WASD atau Arrow Keys - Bergerak</p><p>Mouse - Melihat sekeliling</p><p>Space - Lompat</p><p>Dekati Ogoh-ogoh untuk melihat info</p></div>';
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
  '<div style="font-size: 14px; color: #ff6b35; font-weight: bold;">OGOH-OGOH WORLD</div><div id="playerPos" style="font-size: 12px; margin-top: 5px; color: #aaa;">Posisi: 0, 0</div><div id="nearestOgoh" style="font-size: 12px; margin-top: 5px; color: #aaa;">Dekati Ogoh-ogoh...</div>';
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
musicBtn.innerText = "Musik OFF";
musicBtn.style.cssText =
  "position: fixed; top: 20px; right: 20px; padding: 10px 15px; background: rgba(0, 0, 0, 0.7); color: white; border: 2px solid #ff6b35; border-radius: 8px; cursor: pointer; font-size: 14px; z-index: 100; display: none;";
musicBtn.onclick = () => {
  if (bgMusic.isPlaying) {
    bgMusic.pause();
    musicBtn.innerText = "Musik OFF";
  } else {
    bgMusic.play();
    musicBtn.innerText = "Musik ON";
  }
};
document.body.appendChild(musicBtn);

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
    nearestInfo.innerHTML = "Dekati Ogoh-ogoh...";
    infoPanel.style.display = "none";
  }
}

// =========================
// PARTICLE SYSTEM - API/ASAP
// =========================

// const flameObjects = []; // Moved to top scope

function createFireParticles() {
  const particleCount = 100; // Reduced untuk performance
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = Math.random() * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

    colors[i * 3] = 1;
    colors[i * 3 + 1] = Math.random() * 0.5;
    colors[i * 3 + 2] = 0;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
  });

  const particles = new THREE.Points(geometry, material);
  particles.name = "fireParticles";
  scene.add(particles);
}
createFireParticles();

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

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta(); // Use Three.js clock for stable delta
  const time = clock.getElapsedTime();

  if (controls.isLocked) {
    // Show UI elements
    hud.style.display = "block";
    crosshair.style.display = "block";
    minimap.style.display = "block";
    musicBtn.style.display = "block";

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
    const maxSpeed = playerState.speed;
    const currentSpeed = Math.sqrt(playerState.velocity.x**2 + playerState.velocity.z**2);
    if (currentSpeed > maxSpeed) {
        const ratio = maxSpeed / currentSpeed;
        playerState.velocity.x *= ratio;
        playerState.velocity.z *= ratio;
    }

    // Apply Movement
    controls.moveRight(-playerState.velocity.x * delta);
    controls.moveForward(-playerState.velocity.z * delta);
    camera.position.y += playerState.velocity.y * delta;

    // --- HEAD BOBBING ---
    // Hanya bobbing jika bergerak di tanah
    if (currentSpeed > 0.5 && camera.position.y <= playerState.defaultCameraY + 0.1) {
        playerState.bobTimer += delta * 15; // Speed of bob
        camera.position.y = Math.max(
            2, // Min height
            playerState.defaultCameraY + Math.sin(playerState.bobTimer) * 0.15
        );
    } else {
        playerState.bobTimer = 0;
        // Smooth return to default height
        if (camera.position.y > 2 && camera.position.y < 3) {
             camera.position.y = THREE.MathUtils.lerp(camera.position.y, playerState.defaultCameraY, delta * 5);
        }
    }

    // Ground collision
    if (camera.position.y < 2) {
      playerState.velocity.y = 0;
      camera.position.y = 2;
      playerState.canJump = true;
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
  }

  // Animate fire particles
  const fireParticles = scene.getObjectByName("fireParticles");
  if (fireParticles) {
    const positions = fireParticles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += delta * 2;
      if (positions[i + 1] > 15) {
        positions[i + 1] = 0;
      }
    }
    fireParticles.geometry.attributes.position.needsUpdate = true;
  }

  // Animate flames (Realistic Flicker)
  flameObjects.forEach((flame) => {
    // Gunakan phase unik tiap api biar gak barengan
    const flicker = Math.sin(time * 10 + (flame.userData.phase || 0)) * 0.1 + 
                    Math.cos(time * 20 + (flame.userData.phase || 0)) * 0.05;
    flame.scale.setScalar(1 + flicker);
    flame.material.opacity = 0.8 + flicker;
  });

  // RENDER DENGAN POST-PROCESSING
  composer.render();
}

animate();
