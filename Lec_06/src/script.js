import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Pane } from "tweakpane";
import Stats  from "three/examples/jsm/libs/stats.module.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { step } from "three/tsl";

// 1. KHỞI TẠO CƠ BẢN
const pane = new Pane({ title: 'Hệ Mặt Trời' });
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const simConfig = {
    timeScale: 1.0, 
    shadows: true,
    showLabels: true,
    bloomStrength: 0.1,
    meteorFreq: 0.01
};
pane.addBinding(simConfig, 'timeScale', { min: -5, max: 5, step: 0.1, label: 'Tốc độ (Time Scale)' });

const graphicsFolder = pane.addFolder({ title: 'Cấu hình Đồ họa' });
graphicsFolder.addBinding(simConfig, 'shadows', { label: 'Bật/Tắt Bóng' }).on('change', (ev) => {
    renderer.shadowMap.enabled = ev.value;
    scene.traverse((child) => { if (child.material) child.material.needsUpdate = true; });
});
graphicsFolder.addBinding(simConfig, 'showLabels', { label: 'Hiển thị Tên' }).on('change', (ev) => {
    bodies.forEach(body => { if(body.label) body.label.element.style.visibility = ev.value ? 'visible' : 'hidden'; });
});


// A. BẦU TRỜI SAO
const createStarfield = () => {
    const starCount = 15000; 
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
        const radius = 200 + Math.random() * 300; 
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);     
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta); 
        positions[i + 2] = radius * Math.cos(phi);                   
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.8});
    scene.add(new THREE.Points(geometry, material));
};
createStarfield();


// ==========================================
// 2. CLASS CELESTIAL BODY - NÂNG CẤP VẬT LÝ ELIP & ĐỘ NGHIÊNG
// ==========================================
class CelestialBody {
  constructor({ name, radius, semiMajorAxis, eccentricity = 0, tilt = 0, speed, texturePath, parent, isLightSource = false }) {
    this.name = name;
    this.speed = speed;
    
    // Toán học quỹ đạo Elip
    this.a = semiMajorAxis; // Bán trục lớn
    this.e = eccentricity;  // Độ lệch tâm
    this.b = this.a * Math.sqrt(1 - this.e * this.e); // Bán trục nhỏ
    this.c = this.a * this.e; // Khoảng cách từ tâm Elip đến Tiêu điểm (Mặt trời)
    this.currentAngle = Math.random() * Math.PI * 2; // Góc khởi tạo ngẫu nhiên

    // Cấu trúc Scene Graph mới: Orbit -> Tilt -> Mesh
    this.orbitGroup = new THREE.Group(); 
    this.tiltGroup = new THREE.Group(); 
    
    if (parent) parent.mesh.add(this.orbitGroup);
    else scene.add(this.orbitGroup);

    const texture = textureLoader.load(texturePath);
    texture.colorSpace = THREE.SRGBColorSpace;

    let material = isLightSource 
      ? new THREE.MeshStandardMaterial({ map: texture, emissive: new THREE.Color(0xffffff), emissiveMap: texture, emissiveIntensity: 2.0 })
      : new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 });

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    this.mesh = new THREE.Mesh(geometry, material);
    
    if (!isLightSource) {
      this.mesh.castShadow = true;   
      this.mesh.receiveShadow = true;
    }

    // Áp dụng độ nghiêng trục (Axial Tilt)
    this.tiltGroup.rotation.z = tilt * (Math.PI / 180);
    this.tiltGroup.add(this.mesh);
    this.orbitGroup.add(this.tiltGroup);

    // Gắn thẻ tên
    const div = document.createElement('div');
    div.className = 'planet-label'; div.textContent = name;
    this.label = new CSS2DObject(div);
    this.label.position.set(0, radius + 0.5, 0); 
    this.mesh.add(this.label);

    if (this.a > 0) this.createEllipticalOrbit();
  }

  createEllipticalOrbit() {
    // Vẽ đường Elip
    const curve = new THREE.EllipseCurve(
        -this.c, 0,           // Tâm của Elip bị lùi lại một đoạn c so với Mặt trời
        this.a, this.b,       // Bán kính X và Y
        0, 2 * Math.PI, false, 0
    );
    const points = curve.getPoints(128);
    // Chuyển tọa độ 2D của EllipseCurve sang 3D (X, 0, Z)
    const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, 0, p.y))
    );
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const orbitLine = new THREE.Line(geometry, material);
    
    // Đường quỹ đạo nằm trong orbitGroup gốc (đứng im)
    this.orbitGroup.add(orbitLine);
  }

  addRing(innerRadius, outerRadius, colorHex) {
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.castShadow = true; ringMesh.receiveShadow = true;
    ringMesh.rotation.x = Math.PI / 2;
    // Vòng nhẫn gắn vào mesh để nghiêng theo hành tinh
    this.mesh.add(ringMesh);
  }

  update(timeFactor) {
    // Tự xoay quanh trục (đã bị nghiêng)
    this.mesh.rotation.y += 0.01 * timeFactor;
    
    if (this.a > 0) {
        // Cập nhật vị trí trên quỹ đạo Elip
        this.currentAngle += this.speed * timeFactor;
        
        // Phương trình tham số Elip (đặt Mặt trời ở tọa độ 0,0)
        this.tiltGroup.position.x = -this.c + this.a * Math.cos(this.currentAngle);
        this.tiltGroup.position.z = this.b * Math.sin(this.currentAngle);
    }
  }
}

// ==========================================
// 3. KHỞI TẠO VẬT THỂ (Với số liệu Thực tế)
// ==========================================
const bodies = [];

const sun = new CelestialBody({
    name: "Sun", radius: 3, semiMajorAxis: 0, speed: 0, texturePath: "/textures/2k_sun.jpg", isLightSource: true
});
bodies.push(sun);

// Thông số cập nhật: semiMajorAxis (khoảng cách), eccentricity (độ lệch tâm), tilt (độ nghiêng)
const planetConfigs = [
    { name: "Mercury", radius: 0.4, semiMajorAxis: 6, eccentricity: 0.205, tilt: 0.03, speed: 0.02, texture: "/textures/2k_mercury.jpg" },
    { name: "Venus", radius: 0.7, semiMajorAxis: 9, eccentricity: 0.006, tilt: 177.3, speed: 0.015, texture: "/textures/2k_venus_surface.jpg" },
    { name: "Earth", radius: 0.9, semiMajorAxis: 13, eccentricity: 0.016, tilt: 23.4, speed: 0.01, texture: "/textures/2k_earth_daymap.jpg" },
    { name: "Mars", radius: 0.5, semiMajorAxis: 17, eccentricity: 0.093, tilt: 25.1, speed: 0.008, texture: "/textures/2k_mars.jpg" },
    { name: "Ceres", radius: 0.25, semiMajorAxis: 21, eccentricity: 0.075, tilt: 4, speed: 0.006, texture: "/textures/2k_ceres_fictional.jpg" },
    { name: "Jupiter", radius: 2.2, semiMajorAxis: 28, eccentricity: 0.048, tilt: 3.1, speed: 0.004, texture: "/textures/2k_jupiter.jpg" },
    { name: "Saturn", radius: 1.8, semiMajorAxis: 38, eccentricity: 0.056, tilt: 26.7, speed: 0.002, texture: "/textures/2k_saturn.jpg" },
    { name: "Uranus", radius: 1.2, semiMajorAxis: 48, eccentricity: 0.046, tilt: 97.7, speed: 0.0015, texture: "/textures/2k_uranus.jpg" },
    { name: "Neptune", radius: 1.1, semiMajorAxis: 56, eccentricity: 0.009, tilt: 28.3, speed: 0.001, texture: "/textures/2k_neptune.jpg" },
    { name: "Pluto", radius: 0.3, semiMajorAxis: 66, eccentricity: 0.248, tilt: 122.5, speed: 0.0008, texture: "/textures/2k_makemake_fictional.jpg" }, // Quỹ đạo Pluto cực kỳ Elip
    { name: "Haumea", radius: 0.35, semiMajorAxis: 74, eccentricity: 0.195, tilt: 28.2, speed: 0.0007, texture: "/textures/2k_haumea_fictional.jpg" },
    { name: "Makemake", radius: 0.4, semiMajorAxis: 82, eccentricity: 0.155, tilt: 29, speed: 0.0006, texture: "/textures/2k_makemake_fictional.jpg" },
    { name: "Eris", radius: 0.45, semiMajorAxis: 90, eccentricity: 0.441, tilt: 44, speed: 0.0005, texture: "/textures/2k_eris_fictional.jpg" }
];

const planets = {};
planetConfigs.forEach(config => {
    const planet = new CelestialBody({ ...config, texturePath: config.texture });
    planets[config.name] = planet;
    bodies.push(planet);
});

const earthMoon = new CelestialBody({
    name: "Moon", radius: 0.2, semiMajorAxis: 2, eccentricity: 0.054, tilt: 1.5, speed: 0.03, texturePath: "/textures/2k_moon.jpg", parent: planets["Earth"]
});
bodies.push(earthMoon);

planets["Saturn"].addRing(2.2, 4.0, 0xcca370); 
planets["Uranus"].addRing(1.5, 2.0, 0x8ab8c6);

// ==========================================
// C. VÀNH ĐAI TIỂU HÀNH TINH
// ==========================================
const createAsteroidBelt = () => {
    const asteroidCount = 4000; 
    const geometry = new THREE.DodecahedronGeometry(0.1, 0); 
    const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
    const instancedMesh = new THREE.InstancedMesh(geometry, material, asteroidCount);
    
    instancedMesh.castShadow = true; instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D(); 
    for (let i = 0; i < asteroidCount; i++) {
        const distance = 22 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        const yOffset = (Math.random() - 0.5) * 1.5; 

        dummy.position.set(Math.cos(angle) * distance, yOffset, Math.sin(angle) * distance);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.scale.setScalar(Math.random() * 0.8 + 0.2);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(instancedMesh);
    return instancedMesh;
};
const asteroidBelt = createAsteroidBelt();


// 4. ÁNH SÁNG & CAMERA & RENDERER
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05); 
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 3000); 
pointLight.castShadow = simConfig.shadows; 
pointLight.shadow.mapSize.width = 2048;  
pointLight.shadow.mapSize.height = 2048;
pointLight.shadow.camera.near = 3.1;     
pointLight.shadow.camera.far = 100;      
pointLight.shadow.bias = -0.001;         
scene.add(pointLight);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 40, 60);

const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = simConfig.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), simConfig.bloomStrength, 0.5, 0.9);
const outputPass = new OutputPass(); 

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

graphicsFolder.addBinding(simConfig, 'bloomStrength', { min: 0, max: 0.5, step: 0.01, label: 'Độ sáng Mặt trời' }).on('change', (ev) => {
    bloomPass.strength = ev.value;
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetBody = null; 

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const meshesToTest = bodies.map(b => b.mesh);
    const intersects = raycaster.intersectObjects(meshesToTest);

    if (intersects.length > 0) {
        targetBody = bodies.find(b => b.mesh === intersects[0].object);
    } else {
        targetBody = null; 
    }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Quản lý sao băng
const meteors = [];
const meteorMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });

const createMeteor = () => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 2) // Độ dài vệt sáng
    ]);
    const line = new THREE.Line(geometry, meteorMaterial.clone());
    
    // Vị trí xuất hiện ngẫu nhiên trong khoảng không
    line.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 200
    );
    
    // Hướng bay ngẫu nhiên
    line.lookAt(new THREE.Vector3(
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 400
    ));
    
    scene.add(line);
    meteors.push({ mesh: line, speed: 1 + Math.random() * 2, life: 1.0 });
};

// Cập nhật cấu hình GUI
pane.addBinding(simConfig, 'meteorFreq', { min: 0, max: 0.1, step: 0.001, label: 'Tần suất Sao băng' });

// 5. VÒNG LẶP RENDER
const clock = new THREE.Clock();

const renderloop = () => {
    stats.begin();
    const delta = clock.getDelta();
    const timeFactor = delta * 60 * simConfig.timeScale;

    // Ngẫu nhiên tạo sao băng dựa trên tần suất
    if (Math.random() < simConfig.meteorFreq * timeFactor) {
        createMeteor();
    }

    // Cập nhật và xóa sao băng cũ
    for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.mesh.translateZ(m.speed * timeFactor); // Bay theo hướng nhìn
        m.life -= 0.02 * timeFactor;
        m.mesh.material.opacity = m.life;
        
        if (m.life <= 0) {
            scene.remove(m.mesh);
            meteors.splice(i, 1);
        }
    }

    bodies.forEach(body => body.update(timeFactor));
    asteroidBelt.rotation.y += 0.0005 * timeFactor;

    if (targetBody) {
        const targetPosition = new THREE.Vector3();
        targetBody.mesh.getWorldPosition(targetPosition); 
        controls.target.lerp(targetPosition, 0.05);
    }

    controls.update();
    composer.render();
    labelRenderer.render(scene, camera);

    stats.end();
    window.requestAnimationFrame(renderloop);
};

renderloop();