import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- BIẾN TOÀN CỤC ---
let scene, ambient, cameraPOV, camera3P, renderer, controls, gui;
let robotRig; 
let robotArm = { base: null, joint1: null, arm1: null, joint2: null, arm2Pivot: null, head: null };
let targetObject;
let helperGroup; 
let lightList = []; 
let povLabel;

init();
setupStudio();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    ambient = new THREE.AmbientLight(0xffffff, 50);
    scene.add(ambient);

    const aspect = window.innerWidth / window.innerHeight;
    povLabel = document.getElementById('pov-label');

    // 1. Camera POV (Gắn vào đầu robot) - Dùng aspect của window
    cameraPOV = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    
    // 2. Camera 3rd Person (Quan sát studio)
    camera3P = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera3P.position.set(15, 12, 15);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false; 
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera3P, renderer.domElement);
    controls.enableDamping = true;

    window.addEventListener('resize', onWindowResize);
}

// --- CAMERA RIG (ROBOT ARM) ---
function createRobotArm() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.1 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 1, roughness: 0.1 });

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.4, 32), metalMat);
    group.add(base);

    // Joint 1 (Pan)
    const joint1 = new THREE.Group();
    joint1.position.y = 0.2;
    base.add(joint1);

    const joint1Visual = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), jointMat);
    joint1.add(joint1Visual);

    // Arm 1
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 5, 16), metalMat);
    arm1.position.y = 2.5; 
    joint1.add(arm1);

    // Joint 2 (Tilt 1)
    const joint2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), jointMat);
    joint2.position.y = 2.5;
    arm1.add(joint2);

    // Arm 2 Pivot
    const arm2Pivot = new THREE.Group();
    joint2.add(arm2Pivot);

    // Arm 2
    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 16), metalMat);
    arm2.position.y = 2;
    arm2Pivot.add(arm2);

    // Camera Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1.5), new THREE.MeshStandardMaterial({color: 0x000000}));
    head.position.y = 2.2;
    arm2.add(head);

    // --- GẮN CAMERA POV ---
    head.add(cameraPOV);
    cameraPOV.position.set(0, 0, 0); 
    cameraPOV.rotation.set(0, 0, 0);

    robotArm = { base, joint1, joint2, arm2Pivot, head };
    return group;
}

// --- STUDIO SETUP ---
function setupStudio() {
    // Đối tượng chính
    const geometry = new THREE.IcosahedronGeometry(2, 0);
    const material = new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff, metalness: 0.5, roughness: 0.1, clearcoat: 1
    });
    targetObject = new THREE.Mesh(geometry, material);
    targetObject.position.y = 2.5;
    targetObject.castShadow = true;
    scene.add(targetObject);

    scene.add(new THREE.GridHelper(50, 50, 0x444444, 0x222222));

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    robotRig = createRobotArm();
    robotRig.position.set(0, 0, 10); 
    scene.add(robotRig);

    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    helperGroup = new THREE.Group();
    scene.add(helperGroup);

    // --- GUI CONTROL ---
    gui = new GUI({ title: 'Studio Manager' });
    
    const robotFolder = gui.addFolder('Robot Controller');
    const robotParams = { pan: 0, tilt1: 0, tilt2: Math.PI / 4, posX: 0, posZ: 10 };

    robotFolder.add(robotParams, 'posX', -15, 15).name('X-axis').onChange(v => robotRig.position.x = v);
    robotFolder.add(robotParams, 'posZ', -15, 15).name('Z-axis').onChange(v => robotRig.position.z = v);
    robotFolder.add(robotParams, 'pan', -Math.PI, Math.PI).name('Pan').onChange(v => robotArm.joint1.rotation.y = v);
    robotFolder.add(robotParams, 'tilt1', -Math.PI/3, Math.PI/3).name('Tilt 1').onChange(v => robotArm.joint1.rotation.x = v);
    robotFolder.add(robotParams, 'tilt2', -Math.PI/2, Math.PI/2).name('Tilt 2').onChange(v => robotArm.arm2Pivot.rotation.x = v);
    robotFolder.open();

    const lightManager = {
        addPoint: () => createDynamicLight('point'),
        addDirectional: () => createDynamicLight('directional'),
        addSpot: () => createDynamicLight('spot'),
        removeAll: () => {
            lightList.forEach(l => {
                scene.remove(l.light);
                helperGroup.remove(l.helper);
                if(l.target) scene.remove(l.target);
                l.folder.destroy();
            });
            lightList = [];
        }
    };

    const manageFolder = gui.addFolder('Lighting Controller');
    manageFolder.add(lightManager, 'addPoint').name('Add Point Light');
    manageFolder.add(lightManager, 'addDirectional').name('Add Directional Light');
    manageFolder.add(lightManager, 'addSpot').name('Add Spot Light');
    manageFolder.add(lightManager, 'removeAll').name('Remove All Lights');

    gui.add(helperGroup, 'visible').name('Show Light Helpers');
    createDynamicLight('spot', { x: 8, y: 12, z: 8, intensity: 150 });
}

// --- HÀM TẠO ĐÈN ĐỘNG ---
function createDynamicLight(type, config = {}) {
    let light, helper, target;
    const id = lightList.length + 1;
    const color = config.color || 0xffffff;
    const intensity = config.intensity || 50;

    switch(type) {
        case 'point':
            light = new THREE.PointLight(color, intensity);
            helper = new THREE.PointLightHelper(light, 0.5);
            break;
        case 'directional':
            light = new THREE.DirectionalLight(color, intensity / 50);
            light.castShadow = true;
            target = light.target;
            scene.add(target);
            helper = new THREE.DirectionalLightHelper(light, 1);
            break;
        case 'spot':
            light = new THREE.SpotLight(color, intensity);
            light.castShadow = true;
            light.angle = Math.PI / 6;
            target = light.target;
            scene.add(target);
            helper = new THREE.SpotLightHelper(light);
            break;
    }

    light.position.set(config.x || 0, config.y || 10, config.z || 0);
    scene.add(light);
    helperGroup.add(helper);

    const folder = gui.addFolder(`${type.toUpperCase()} #${id}`);
    folder.add(light, 'visible').name('Enable/Disable');
    folder.add(helper, 'visible').name('Show Guide');
    folder.addColor(light, 'color').name('Color');
    folder.add(light, 'intensity', 0, 1000).name('Intensity');
    
    const posF = folder.addFolder('Position');
    posF.add(light.position, 'x', -20, 20).onChange(() => helper.update());
    posF.add(light.position, 'y', 0, 30).onChange(() => helper.update());
    posF.add(light.position, 'z', -20, 20).onChange(() => helper.update());

    folder.add({ delete: () => {
        scene.remove(light); helperGroup.remove(helper);
        if(target) scene.remove(target);
        folder.destroy();
        lightList = lightList.filter(l => l.light !== light);
    }}, 'delete').name('🗑️ Xóa đèn');

    lightList.push({ light, helper, folder, target });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (targetObject) targetObject.rotation.y += 0.005;

    lightList.forEach(l => {
        if (l.helper.visible && l.helper.update) l.helper.update();
    });

    // --- DUAL RENDERING ---
    // 1. Toàn cảnh (3rd Person)
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.clear();
    renderer.render(scene, camera3P);

    // 2. POV Robot (Đồng bộ Aspect Ratio)
    const scale = 0.25; // Chiếm 25% chiều rộng màn hình
    const povWidth = window.innerWidth * scale;
    const povHeight = window.innerHeight * scale;
    const margin = 20;

    renderer.setViewport(window.innerWidth - povWidth - margin, margin, povWidth, povHeight);
    renderer.setScissor(window.innerWidth - povWidth - margin, margin, povWidth, povHeight);
    renderer.setScissorTest(true);
    renderer.clearDepth();
    renderer.render(scene, cameraPOV);
    
    // Cập nhật vị trí nhãn POV
    if (povLabel) {
        povLabel.style.bottom = (povHeight + margin + 5) + "px";
    }
    
    renderer.setScissorTest(false);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    
    camera3P.aspect = aspect;
    camera3P.updateProjectionMatrix();

    cameraPOV.aspect = aspect;
    cameraPOV.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}