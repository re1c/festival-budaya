# Festival Budaya Nyepi - 3D Interactive Museum

Museum 3D interaktif yang menampilkan Ogoh-ogoh dan objek budaya Indonesia untuk perayaan **Nyepi** (Hari Raya Seni dan Budaya Bali). Dibangun dengan Three.js.

> **Final Project** - Mata Kuliah Grafika Komputer, Semester 5

## ✨ Fitur

- **4 Model 3D Budaya**: Bhuta Kala, Kuwera Punia, Reog Ponorogo, dan Rangda
- **Open World 3D**: Eksplorasi bebas dengan jalan setapak, pohon Beringin, reruntuhan candi
- **Sistem Fisika Minecraft-style**: Gravity, jumping, collision detection
- **Mode Siang/Malam**: Toggle pencahayaan realistis
- **Efek Visual**: Bloom, particles (kunang-kunang, daun jatuh), animasi api obor
- **Audio Immersive**: Musik gamelan, suara langkah kaki
- **Responsive & Optimized**: Draco compression, instanced geometry, quality toggle

## 🌐 Demo

Tautan Deployment (Cloudflare Pages): [https://festival-nyepi.pages.dev](https://festival-nyepi.pages.dev)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ atau Node.js 20.19.0+ / 22.12.0+
- npm atau pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Buka `http://localhost:5173` di browser.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🎮 Kontrol

| Key                       | Fungsi                                       |
| ------------------------- | -------------------------------------------- |
| **WASD** / **Arrow Keys** | Bergerak                                     |
| **Mouse**                 | Melihat sekeliling (saat Pointer Lock aktif) |
| **Shift**                 | Sprint (lari cepat)                          |
| **Space**                 | Lompat                                       |
| **[1]**                   | Toggle musik On/Off                          |
| **[2]**                   | Toggle Mode Siang/Malam                      |
| **[3]**                   | Toggle Kualitas Grafis (Tinggi/Rendah)       |
| **Double-click**          | Info detail patung (saat di menu)            |

## 📁 Struktur Proyek

```
fp-grafkom/
├── assets/
│   ├── ogoh.glb              # Model Bhuta Kala (Draco compressed)
│   ├── kuwera_punia.glb      # Model Kuwera Punia (Draco compressed)
│   ├── reog.glb              # Model Reog Ponorogo (Draco compressed)
│   ├── patung-rangda.glb     # Model Rangda (Draco compressed)
│   ├── gamelan-bali.mp3      # Background music
│   ├── step.m4a              # Footstep sound
│   └── hit.mp3               # Collision sound
├── public/
│   └── favicon.ico
├── main.js                   # Core application logic
├── index.html                # Entry point
├── vite.config.js            # Vite configuration
└── package.json              # Dependencies & scripts
```

## 🎭 Objek Budaya

| Nama              | Deskripsi                                           | Posisi    |
| ----------------- | --------------------------------------------------- | --------- |
| **Bhuta Kala**    | Kekuatan alam semesta negatif/liar dalam Hindu Bali | (0, 0)    |
| **Kuwera Punia**  | Dewa kekayaan menyatu dengan bhutakala              | (0, 40)   |
| **Reog Ponorogo** | Seni pertunjukan tradisional Jawa Timur             | (-40, 0)  |
| **Rangda**        | Ratu para leak, simbol kekuatan negatif             | (-40, 40) |

## ⚡ Optimasi Performa

Proyek ini dioptimasi untuk performa tinggi:

- **Draco Compression**: Semua model GLB dikompresi dengan Draco (~72% lebih kecil)
- **Geometry Merging**: Pohon dan reruntuhan digabung untuk mengurangi draw calls
- **Instanced Rendering**: 8000 rumput dengan satu draw call
- **Shadow Optimization**: Shadow map resolusi rendah (1024x1024)
- **Post-Processing**: Bloom effect dengan resolusi 1/8
- **Quality Toggle**: Option untuk grafis rendah di PC kurang kencang

### Ukuran Asset (Setelah Kompresi)

| File         | Ukuran |
| ------------ | ------ |
| Total Assets | ~20MB  |
| GLB Models   | ~17MB  |
| Audio        | ~3MB   |

## 🛠️ Tech Stack

- **[Three.js](https://threejs.org/)** - WebGL 3D rendering
- **[Vite](https://vitejs.dev/)** - Build tool
- **[gltf-transform](https://gltf-transform.dev/)** - GLB optimization & Draco compression

## 📜 License

ISC

---

**Final Project** - Computer Graphics Course, Semester 5
