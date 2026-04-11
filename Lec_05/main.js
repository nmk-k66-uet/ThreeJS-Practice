import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let fireParticles, fireLight;
let particleCount = 1000;
let particleData = []; // Lưu trữ dữ liệu vật lý của từng hạt (tốc độ, tuổi thọ)
const clock = new THREE.Clock();

init();
animate();

function init() {
    // 1. Tạo Scene VÀ camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    // Thêm sương mù
    scene.fog = new THREE.FogExp2(0x050505, 0.02);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 8, 15);

    // 2. Tạo Renderer & Bật đổ bóng
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // Bật SHADOW MAP
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 2, 0);

    // 3. Xây dựng môi trường (Sàn nhà + Cột đá) để tạo bóng đổ và nhận bóng
    createEnvironment();

    // 4. Tạo hệ thống hạt lửa (Particles) với texture gradient để tạo hiệu ứng lửa
    createFireParticles();

    // 5. Tạo nguồn sáng (PointLight) ẩn giữa đám lửa để tạo bóng
    createFireLight();

    window.addEventListener('resize', onWindowResize);
}

function createFireTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 200, 0, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 50, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
}

function createFireParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount); 

    for (let i = 0; i < particleCount; i++) {
        // Khởi tạo vị trí gốc tọa độ cho mỗi hạt (phân bố ngẫu nhiên trong một vùng nhỏ xung quanh gốc tọa độ)
        positions[i * 3] = (Math.random() - 0.5) * 1.5;     // X
        positions[i * 3 + 1] = Math.random() * 2;           // Y 
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5; // Z

        // Lưu dữ liệu chuyển động (Vector vận tốc và thời gian sống)
        particleData.push({
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 3 + 1, // Tốc độ bốc lên
                (Math.random() - 0.5) * 0.5
            ),
            life: Math.random() * 100,
            maxLife: 50 + Math.random() * 50
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        size: 1.5,
        map: createFireTexture(),
        blending: THREE.AdditiveBlending, // Giúp các hạt sáng rực lên khi đè lên nhau
        depthWrite: false, // Ngăn hiện tượng viền đen do texture chồng chéo
        transparent: true,
        opacity: 0.6,
        color: 0xffddaa
    });

    fireParticles = new THREE.Points(geometry, material);
    scene.add(fireParticles);
}

function createFireLight() {
    const ambient = new THREE.AmbientLight(0x222233, 3.0);
    scene.add(ambient);

    fireLight = new THREE.PointLight(0xff6600, 500, 30); 
    fireLight.position.set(0, 1.5, 0); // Đặt vị trí đèn vào giữa ngọn lửa
    
    // Bật castShadow cho đèn
    fireLight.castShadow = true;
    
    // Tối ưu hóa chất lượng bóng đổ của đèn
    fireLight.shadow.mapSize.width = 1024;
    fireLight.shadow.mapSize.height = 1024;
    fireLight.shadow.bias = -0.002;

    scene.add(fireLight);

    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    fireLight.add(bulb);
}

function createEnvironment() {
    //Sàn nhà (Nhận bóng đổ)
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.8, 
        metalness: 0.2 
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(50, 50, 0x444444, 0x111111);
    scene.add(grid);

    // Các cây cột đá (Tạo bóng & Nhận bóng)
    const boxGeo = new THREE.BoxGeometry(1, 4, 1);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    
    const positions = [
        [3, 2, 3], [-3, 2, 3], [3, 2, -3], [-3, 2, -3],
        [5, 2, 0], [-5, 2, 0], [0, 2, -5]
    ];

    positions.forEach(pos => {
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(pos[0], pos[1], pos[2]);
        // Thiết lập tạo bóng và nhận bóng
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Vòng lặp Animation

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    controls.update();

    // 1. ANIMATION CHO HỆ THỐNG HẠT LỬA
    const positions = fireParticles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        let pd = particleData[i];
        pd.life += delta * 60; // Tăng tuổi thọ

        // Lấy chỉ số trong mảng float32 (mỗi hạt có 3 giá trị x, y, z)
        let idx = i * 3; 

        // Di chuyển hạt lên trên
        positions[idx] += pd.velocity.x * delta;
        positions[idx + 1] += pd.velocity.y * delta;
        positions[idx + 2] += pd.velocity.z * delta;

        // Các hạt có xu hướng chụm vào giữa khi lên cao
        positions[idx] -= positions[idx] * delta * 0.5;
        positions[idx + 2] -= positions[idx + 2] * delta * 0.5;

        // Khi hạt sống hết vòng đời, reset nó về gốc
        if (pd.life >= pd.maxLife || positions[idx + 1] > 4) {
            pd.life = 0;
            positions[idx] = (Math.random() - 0.5) * 1.5;
            positions[idx + 1] = Math.random() * 0.5; // Reset về đáy ngọn lửa
            positions[idx + 2] = (Math.random() - 0.5) * 1.5;
        }
    }

    // Báo cho GPU biết mảng vị trí đã bị thay đổi để vẽ lại
    fireParticles.geometry.attributes.position.needsUpdate = true;

    // 2. ANIMATION CHO NGUỒN SÁNG
    const baseIntensity = 500;
    const noise = Math.sin(elapsedTime * 20) * Math.random() * 150;
    fireLight.intensity = baseIntensity + noise;

    // Di chuyển nhẹ vị trí đèn để bóng đổ có hiệu ứng chuyển động theo
    fireLight.position.x = Math.sin(elapsedTime * 15) * 0.1;
    fireLight.position.z = Math.cos(elapsedTime * 10) * 0.1;

    renderer.render(scene, camera);
}