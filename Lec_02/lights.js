import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- 1. SETUP CƠ BẢN ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505); // Nền rất tối để thấy rõ hiệu ứng đèn

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Kích hoạt bóng đổ
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- 2. HỆ THỐNG ÁNH SÁNG (5 LOẠI) ---

// 1. AmbientLight: Ánh sáng môi trường
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// 2. HemisphereLight: Ánh sáng bầu trời/mặt đất
const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x442222, 0.5);
scene.add(hemiLight);

// 3. DirectionalLight: Ánh sáng song song (Mặt trời)
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// 4. PointLight: Ánh sáng điểm (Bóng đèn)
const pointLight = new THREE.PointLight(0xffffff, 50);
pointLight.position.set(-5, 3, 2);
scene.add(pointLight);

// 5. SpotLight: Ánh sáng hình nón (Đèn sân khấu)
const spotLight = new THREE.SpotLight(0xffffff, 100);
spotLight.position.set(0, 8, 0);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.3;
spotLight.castShadow = true;
scene.add(spotLight);

// --- 3. QUẢN LÝ LIGHT HELPERS ---
const dirHelper = new THREE.DirectionalLightHelper(dirLight, 1);
const pointHelper = new THREE.PointLightHelper(pointLight, 0.5);
const spotHelper = new THREE.SpotLightHelper(spotLight);

const helpers = new THREE.Group();
helpers.add(dirHelper, pointHelper, spotHelper);
scene.add(helpers);
helpers.visible = true; // Trạng thái bật/tắt tổng cho Helpers

// Hàm đồng bộ: Chỉ hiện Helper nếu đèn đang bật VÀ Show Helpers đang bật
const syncHelpers = () => {
    if (helpers.visible) {
        dirHelper.visible = dirLight.visible;
        pointHelper.visible = pointLight.visible;
        spotHelper.visible = spotLight.visible;
    }
};

// Gọi lần đầu để thiết lập trạng thái ban đầu
syncHelpers();

// --- 4. VẬT THỂ & NỀN ---
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(25, 25),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.5;
ground.receiveShadow = true;
scene.add(ground);

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.5 })
);
sphere.castShadow = true;
scene.add(sphere);

// --- 5. ĐIỀU KHIỂN GUI ---
const gui = new GUI();

const ambientFolder = gui.addFolder('Ambient Light');
ambientFolder.add(ambientLight, 'visible');
ambientFolder.add(ambientLight, 'intensity', 0, 2);

const hemiFolder = gui.addFolder('Hemisphere Light');
hemiFolder.add(hemiLight, 'visible');
hemiFolder.add(hemiLight, 'intensity', 0, 2);

const dirFolder = gui.addFolder('Directional Light');
dirFolder.add(dirLight, 'visible').onChange(syncHelpers);
dirFolder.add(dirLight, 'intensity', 0, 5);
dirFolder.add(dirLight.position, 'x', -10, 10);

const pointFolder = gui.addFolder('Point Light');
pointFolder.add(pointLight, 'visible').onChange(syncHelpers);
pointFolder.add(pointLight, 'intensity', 0, 200);

const spotFolder = gui.addFolder('Spot Light');
spotFolder.add(spotLight, 'visible').onChange(syncHelpers);
spotFolder.add(spotLight, 'intensity', 0, 500);
spotFolder.add(spotLight, 'angle', 0, Math.PI / 2);

gui.add(helpers, 'visible').name('Show Light Helpers').onChange(syncHelpers);

// --- 6. ANIMATION ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Cập nhật hướng cho các Helper nếu đèn di chuyển hoặc thông số thay đổi
    if (helpers.visible) {
        if (dirLight.visible) dirHelper.update();
        if (spotLight.visible) spotHelper.update();
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});