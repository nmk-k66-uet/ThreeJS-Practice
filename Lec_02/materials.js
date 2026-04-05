import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- 1. SETUP SCENE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 10); // Đẩy camera lên cao và xa để thấy đủ 5 khối

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- 2. ÁNH SÁNG (Bắt buộc cho Lambert, Phong, Standard, Physical) ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(hemiLight);

const pointLight = new THREE.PointLight(0xffffff, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);
scene.add(new THREE.PointLightHelper(pointLight, 0.5));

// --- 3. TẠO 5 VẬT LIỆU SO SÁNH ---
const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
const materials = [];
const labels = ['Basic', 'Lambert', 'Phong', 'Standard', 'Physical'];

// 1. MeshBasicMaterial: Không cần ánh sáng, không có bóng đổ.
materials.push(new THREE.MeshBasicMaterial({ color: 0x00ff00 }));

// 2. MeshLambertMaterial: Phản xạ khuếch tán (matte), tính toán nhanh, không có điểm sáng (specular).
materials.push(new THREE.MeshLambertMaterial({ color: 0xff0000 }));

// 3. MeshPhongMaterial: Bề mặt bóng (glossy), có điểm sáng rõ rệt nhờ thuật toán Blinn-Phong.
materials.push(new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100, specular: 0x444444 }));

// 4. MeshStandardMaterial: Dựa trên vật lý (PBR), cân bằng giữa hiệu năng và độ chân thực.
materials.push(new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.5, roughness: 0.5 }));

// 5. MeshPhysicalMaterial: Bản nâng cao của Standard, hỗ trợ Clearcoat (lớp phủ bóng như sơn xe).
materials.push(new THREE.MeshPhysicalMaterial({ color: 0xff00ff, metalness: 0.5, roughness: 0.1, clearcoat: 1.0 }));

// Sắp xếp các khối thành một hàng
materials.forEach((mat, i) => {
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.x = (i - 2) * 2.8; // Giữ khoảng cách đều nhau
    scene.add(mesh);
});

// --- 4. GROUND (Bàn cờ) ---
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.5;
scene.add(ground);

// --- 5. GUI ĐIỀU CHỈNH ---
const gui = new GUI();

// Folder cho Phong (Đặc trưng: Shininess)
const phongFolder = gui.addFolder('Phong Material');
phongFolder.add(materials[2], 'shininess', 0, 200);

// Folder cho Standard (Đặc trưng: Metalness/Roughness)
const standardFolder = gui.addFolder('Standard Material');
standardFolder.add(materials[3], 'metalness', 0, 1);
standardFolder.add(materials[3], 'roughness', 0, 1);

// Folder cho Physical (Đặc trưng: Clearcoat)
const physicalFolder = gui.addFolder('Physical Material');
physicalFolder.add(materials[4], 'clearcoat', 0, 1);
physicalFolder.add(materials[4], 'clearcoatRoughness', 0, 1);

// --- 6. RAYCASTER (Click đổi màu trừ Ground) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0 && intersects[0].object !== ground) {
        intersects[0].object.material.color.set(Math.random() * 0xffffff);
    }
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();