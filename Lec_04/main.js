import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Khởi tạo Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Thêm ánh sáng
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// 2. Biến toàn cục cho Raycaster và Mô hình
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let interactableObjects = []; // Danh sách các lưới (mesh) có thể chọn
let hoveredObject = null;

const statusText = document.getElementById('status');

// 3. Tải mô hình GLTF
const loader = new GLTFLoader();
const modelUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf'; 

loader.load(
    modelUrl,
    function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        
        // Duyệt qua các thành phần của mô hình để thêm vào mảng tương tác
        model.traverse((child) => {
            if (child.isMesh) {
                interactableObjects.push(child);
                // Lưu màu gốc để khôi phục lại sau khi hover
                child.userData.originalColor = child.material.color.getHex();
            }
        });
        statusText.innerText = "Trạng thái: Đã tải xong! Hãy di chuột hoặc click.";
    },
    undefined, 
    function (error) {
        console.error('Lỗi tải mô hình:', error);
        statusText.innerText = "Lỗi: Không thể tải mô hình.";
    }
);

// 4. Xử lý Raycaster
function updatePointer(event) {
    // Chuyển đổi tọa độ chuột sang Tọa độ thiết bị chuẩn hóa (NDC)
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('pointermove', (event) => {
    updatePointer(event);
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactableObjects, false);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        if (hoveredObject !== object) {
            if (hoveredObject) hoveredObject.material.color.setHex(hoveredObject.userData.originalColor);
            hoveredObject = object;
            hoveredObject.material.color.setHex(0xff0000); // Đổi sang màu đỏ
            document.body.style.cursor = 'pointer';
        }
    } else {
        if (hoveredObject) {
            hoveredObject.material.color.setHex(hoveredObject.userData.originalColor);
            hoveredObject = null;
            document.body.style.cursor = 'default';
        }
    }
});

window.addEventListener('click', () => {
    if (hoveredObject) {
        hoveredObject.scale.multiplyScalar(1.2);
        statusText.innerText = `Đã click vào mesh: ${hoveredObject.name || 'Không tên'}`;
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 5. Vòng lặp render
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();