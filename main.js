import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

// =========================
// SETUP DASAR SCENE
// =========================
const scene = new THREE.Scene();

// Skybox (langit malam Bali)
const skyColor = new THREE.Color(0x1a1a3e);
scene.background = skyColor;
scene.fog = new THREE.FogExp2(0x1a1a3e, 0.008);

// Kamera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 20);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Pointer Lock Controls untuk FPS-style movement
const controls = new PointerLockControls(camera, document.body);

// =========================
// LIGHTING - SUASANA MALAM NYEPI
// =========================

// Ambient light (terang)
const ambientLight = new THREE.AmbientLight(0x6688bb, 1.2);
scene.add(ambientLight);

// Hemisphere light
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
scene.add(hemiLight);

// Moonlight (terang)
const moonLight = new THREE.DirectionalLight(0xffffff, 1.5);
moonLight.position.set(50, 100, 50);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 500;
moonLight.shadow.camera.left = -100;
moonLight.shadow.camera.right = 100;
moonLight.shadow.camera.top = 100;
moonLight.shadow.camera.bottom = -100;
scene.add(moonLight);

// Torch lights (obor) - akan ditambahkan di sekitar ogoh-ogoh
function createTorchLight(x, y, z) {
  const torchLight = new THREE.PointLight(0xff6600, 2, 15);
  torchLight.position.set(x, y, z);
  torchLight.castShadow = false; // Disabled untuk performance
  scene.add(torchLight);

  // Visual obor
  const torchGeom = new THREE.CylinderGeometry(0.1, 0.15, 1.5, 8);
  const torchMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
  const torch = new THREE.Mesh(torchGeom, torchMat);
  torch.position.set(x, y - 0.75, z);
  scene.add(torch);

  // Api (particles sederhana)
  const fireGeom = new THREE.SphereGeometry(0.2, 8, 8);
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
  const fire = new THREE.Mesh(fireGeom, fireMat);
  fire.position.set(x, y + 0.3, z);
  fire.userData.isFlame = true;
  scene.add(fire);
  flameObjects.push(fire); // Track untuk animasi

  return { light: torchLight, fire };
}

// =========================
// TERRAIN - OPEN WORLD
// =========================

// Ground - tanah luas
const groundGeom = new THREE.PlaneGeometry(200, 200, 50, 50);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x4a8a3c,
  roughness: 0.8,
});
const ground = new THREE.Mesh(groundGeom, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Jalan setapak
function createPath() {
  const pathGeom = new THREE.PlaneGeometry(4, 100);
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    roughness: 1,
  });
  const path = new THREE.Mesh(pathGeom, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.01;
  path.receiveShadow = true; // Enable shadow di jalan
  scene.add(path);

  // Path horizontal
  const path2 = path.clone();
  path2.rotation.z = Math.PI / 2;
  path2.receiveShadow = true; // Enable shadow di jalan
  scene.add(path2);
}
createPath();

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
// PLAYER MOVEMENT SYSTEM
// =========================

const playerState = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  canJump: true,
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  speed: 15,
  jumpHeight: 8,
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

const flameObjects = []; // Track flame objects

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
});

// =========================
// ANIMATION LOOP
// =========================

const clock = new THREE.Clock();
let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;
  prevTime = time;

  if (controls.isLocked) {
    // Show UI elements
    hud.style.display = "block";
    crosshair.style.display = "block";
    minimap.style.display = "block";
    musicBtn.style.display = "block";

    // Player movement with gravity
    playerState.velocity.y -= 20 * delta; // Gravity

    playerState.direction.z =
      Number(playerState.moveForward) - Number(playerState.moveBackward);
    playerState.direction.x =
      Number(playerState.moveRight) - Number(playerState.moveLeft);
    playerState.direction.normalize();

    if (playerState.moveForward || playerState.moveBackward) {
      playerState.velocity.z = -playerState.direction.z * playerState.speed;
    } else {
      playerState.velocity.z = 0;
    }

    if (playerState.moveLeft || playerState.moveRight) {
      playerState.velocity.x = -playerState.direction.x * playerState.speed;
    } else {
      playerState.velocity.x = 0;
    }

    controls.moveRight(-playerState.velocity.x * delta);
    controls.moveForward(-playerState.velocity.z * delta);

    camera.position.y += playerState.velocity.y * delta;

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

  // Animate flames (optimized)
  flameObjects.forEach((flame) => {
    flame.scale.setScalar(1 + Math.sin(time * 0.01) * 0.3);
  });

  renderer.render(scene, camera);
}

animate();
