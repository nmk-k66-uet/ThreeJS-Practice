// ==========================================
// DEPENDENCIES
// ==========================================
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Pane } from "tweakpane"; // Thư viện tạo giao diện điều khiển, có thể sử dụng Lil-gui (chức năng tương đương)
import Stats  from "three/examples/jsm/libs/stats.module.js"; // Thư viện hiển thị FPS và hiệu suất render
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js"; // Renderer cho phép hiển thị thẻ HTML (chữ) trong không gian 3D

// Các module hậu kỳ (Post-processing)
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

// Các module tự định nghĩa (Internal Modules)
import { simConfig, planetConfigs } from "./config.js";
import CelestialBody from "./CelestialBody.js";
import { createStarfield, createAsteroidBelt, MeteorSystem } from "./Environment.js";

// ==========================================
// 1. Thiết lập không gian hiển thị
// ==========================================
const scene = new THREE.Scene(); // Tạo scene chính để chứa tất cả các đối tượng 3D
const stats = new Stats(); // Khởi tạo bộ đếm FPS
document.body.appendChild(stats.dom); // Gắn đồ thị FPS vào góc trái màn hình

// ==========================================
// 2. Thiết lập giao diện điều khiển
// ==========================================
const pane = new Pane({ title: 'Cấu hình Mô phỏng' });

// Liên kết các biến trong simConfig với thanh trượt trên UI
pane.addBinding(simConfig, 'timeScale', { min: -5, max: 5, step: 0.1, label: 'Tốc độ (Time Scale)' });
pane.addBinding(simConfig, 'meteorFreq', { min: 0, max: 0.1, step: 0.001, label: 'Tần suất Sao băng' });
pane.addBinding(simConfig, 'bloomStrength', { min: 0, max: 0.5, step: 0.01, label: 'Độ sáng Mặt trời' }).on('change', (ev) => bloomPass.strength = ev.value);

// Gom nhóm các cài đặt liên quan đến đồ họa vào một thư mục (Folder)
const graphicsFolder = pane.addFolder({ title: 'Cấu hình Đồ họa' });

// Tùy chọn Bật/Tắt đổ bóng
graphicsFolder.addBinding(simConfig, 'shadows', { label: 'Bật/Tắt Bóng' }).on('change', (ev) => {
    renderer.shadowMap.enabled = ev.value; // Cập nhật cài đặt đổ bóng của renderer
    scene.traverse((child) => { if (child.material) child.material.needsUpdate = true; }); // Duyệt qua toàn bộ vật thể trong scene, ép các vật liệu (material) phải biên dịch lại để áp dụng thay đổi đổ bóng
});

// Tùy chọn Hiển thị tên các hành tinh
graphicsFolder.addBinding(simConfig, 'showLabels', { label: 'Hiển thị Tên' }).on('change', (ev) => {
    bodies.forEach(body => { if(body.label) body.label.element.style.visibility = ev.value ? 'visible' : 'hidden'; }); // Duyệt qua danh sách các hành tinh và ẩn/hiện element CSS2D gắn trên chúng
});

// ==========================================
// 3. Khởi tạo môi trường và các vật thể trong hệ mặt trời
// ==========================================
createStarfield(scene); // Khởi tạo bầu trời sao
const asteroidBelt = createAsteroidBelt(scene); // Khởi tạo vành đai tiểu hành tinh, trả về InstancedMesh
const meteorSystem = new MeteorSystem(scene); // Khởi tạo hệ thống sao băng

const bodies = [];
const planets = {};

// Khởi tạo Mặt trời (tâm của hệ)
// Truyền isLightSource: true để Mặt trời dùng vật liệu tự phát sáng và không nhận bóng từ vật khác
const sun = new CelestialBody({ scene, name: "Sun", radius: 3, semiMajorAxis: 0, speed: 0, texturePath: "/textures/2k_sun.jpg", isLightSource: true });
bodies.push(sun);

// Duyệt qua mảng dữ liệu cấu hình để tự động sinh ra các hành tinh
planetConfigs.forEach(config => {
    const planet = new CelestialBody({ scene, ...config, texturePath: config.texture });
    planets[config.name] = planet;
    bodies.push(planet);
});

// Khởi tạo Mặt trăng & Vòng nhẫn
// Mặt trăng được truyền biến 'parent: planets["Earth"]' để hệ tọa độ của nó gắn liền (xoay quanh) Trái đất, đồng thời tự quay quanh trục của nó (tốc độ riêng) và quay quanh Trái đất (tốc độ riêng).
const earthMoon = new CelestialBody({ scene, name: "Moon", radius: 0.2, semiMajorAxis: 2, eccentricity: 0.054, tilt: 1.5, speed: 0.03, texturePath: "/textures/2k_moon.jpg", parent: planets["Earth"] });
bodies.push(earthMoon);

// Gắn vòng nhẫn 3D vào hình cầu của Sao Thổ và Sao Thiên Vương
planets["Saturn"].addRing(2.2, 4.0, 0xcca370); 
planets["Uranus"].addRing(1.5, 2.0, 0x8ab8c6);

// ==========================================
// 4. Thiết lập ánh sáng
// ==========================================
scene.add(new THREE.AmbientLight(0xffffff, 0.05)); 

// Nguồn sáng dạng điểm (PointLight) đặt tại gốc tọa độ (0,0,0) để mô phỏng Mặt Trời
const pointLight = new THREE.PointLight(0xffffff, 3000); 
pointLight.castShadow = simConfig.shadows; 
pointLight.shadow.mapSize.width = 2048; pointLight.shadow.mapSize.height = 2048;
pointLight.shadow.camera.near = 3.1; pointLight.shadow.camera.far = 100;      
pointLight.shadow.bias = -0.001;         
scene.add(pointLight);

// ==========================================
// 5. Thiết lập camera, renderer và post-processing
// ==========================================
// Camera: Góc nhìn 45 độ, tỷ lệ khung hình theo cửa sổ trình duyệt, tầm nhìn từ 0.1 đến 1000 đơn vị
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const defaultCameraPos = new THREE.Vector3(0, 40, 60);
camera.position.copy(defaultCameraPos);

// Canvas Renderer: Bộ dựng hình WebGL chính
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); // antialias: Khử răng cưa
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Tối ưu hiển thị cho màn hình độ phân giải cao
renderer.shadowMap.enabled = simConfig.shadows; // Bật tính năng vẽ bóng
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Thuật toán làm mềm viền bóng đổ

// Orbit Controls: Trình điều khiển camera
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; // Bật quán tính khi buông chuột để camera di chuyển mượt hơn

// Text Renderer cho Labels: Dựng các thẻ <div> HTML đè lên trên khung hình 3D để hiển thị tên các hành tinh
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute'; // Đặt vị trí tuyệt đối để nó nằm trên cùng của canvas WebGL
labelRenderer.domElement.style.top = '0px'; 
labelRenderer.domElement.style.pointerEvents = 'none'; // QUAN TRỌNG: Cho phép click chuột xuyên qua lớp HTML để tác động xuống Canvas 3D
document.body.appendChild(labelRenderer.domElement);

// Post-Processing (Hậu kỳ): Thiết lập các filter hình ảnh
// 1. Vẽ cảnh thô không hiệu ứng
const renderScene = new RenderPass(scene, camera);
// 2. Bloom Filter (Tạo hiệu ứng giống Mist Filter). Cấu hình: (Kích thước màn hình, cường độ sáng, bán kính nhòe, ngưỡng sáng để phát quang là 0.9)
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), simConfig.bloomStrength, 0.5, 0.9);
// 3. Lớp điều phối các filter
const composer = new EffectComposer(renderer);
composer.addPass(renderScene); 
composer.addPass(bloomPass);
// 3. Điều chỉnh không gian màu cuối cùng trước khi xuất ra màn hình
composer.addPass(new OutputPass());

// ==========================================
// 6. Thiết lập cơ chế tương tác bám theo vật thể khi click chuột sử dụng Raycaster
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetBody = null; 

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(bodies.map(b => b.mesh));
    targetBody = intersects.length > 0 ? bodies.find(b => b.mesh === intersects[0].object) : null; 
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight); labelRenderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 7. Vòng lặp render chính (Animation Loop)
// ==========================================
const clock = new THREE.Clock(); // Đồng hồ đếm thời gian trôi qua giữa các khung hình (Delta Time)

const animation_loop = () => {
    stats.begin(); // Bắt đầu tính thời gian render khung hình để tính FPS
    // Tính toán thời gian Delta Time kết hợp với hệ số timeScale từ UI để đồng bộ tốc độ chuyển động trên mọi cấu hình máy và mọi tốc độ mô phỏng.
    const timeFactor = clock.getDelta() * 60 * simConfig.timeScale;

    // Xác suất ngẫu nhiên để sinh ra sao băng ở khung hình hiện tại
    if (Math.random() < simConfig.meteorFreq * timeFactor) meteorSystem.spawn();

    // Cập nhật vị trí logic của sao băng, các thiên thể và vành đai tiểu hành tinh
    meteorSystem.update(timeFactor);
    bodies.forEach(body => body.update(timeFactor));
    asteroidBelt.rotation.y += 0.0005 * timeFactor;

    // Camera Tracking (Bám theo hành tinh)
    if (targetBody) {
        // Nếu có hành tinh đang được theo dõi, lấy tọa độ tuyệt đối của nó trong không gian 3D
        const targetPosition = new THREE.Vector3();
        targetBody.mesh.getWorldPosition(targetPosition);

        // Nội suy tuyến tính (Lerp) để di chuyển mượt mà điểm nhìn của Camera về phía trung tâm hành tinh đó (tốc độ nội suy mặc định là 0.05)
        controls.target.lerp(targetPosition, 0.05); 
    }

    controls.update(); // OrbitControls tính toán lại góc quay

    // Xuất hình ảnh ra trình duyệt
    composer.render(); // Sử dụng composer thay vì renderer.render() để áp dụng lớp hậu kỳ
    labelRenderer.render(scene, camera); // Render lớp chữ HTML đè lên trên Canvas
    
    stats.end(); // Kết thúc tính thời gian render khung hình
    window.requestAnimationFrame(renderloop); // Yêu cầu trình duyệt tiếp tục gọi hàm này ở khung hình tiếp theo (tạo thành vòng lặp vô hạn)
};

// Khởi chạy hệ thống vòng lặp
animation_loop();