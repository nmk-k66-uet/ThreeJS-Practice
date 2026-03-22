import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- BIẾN TOÀN CỤC ---
let scene, ambient, cameraPOV, camera3P, renderer, controls, gui;
let robotRig; 
let robotArm = {}; // Chứa tham chiếu đến các khớp
let targetObject;
let helperGroup; 
let lightList = []; 
let povLabel;

// Biến quản lý chuyển động tự động (Sequence Management)
let sequence = [];
let isPlaying = false;
let currentKeyframeIndex = 0;
let progressInFrame = 0; // 0 đến 1
const frameDuration = 3000; // Thời gian di chuyển giữa 2 keyframes (ms)
let lastTime = 0;

// Tham số trạng thái của Robot (để đồng bộ GUI và Animation)
const robotParams = {
    trackX: 0,
    pan: 0,
    lowerLift: 0,
    upperLift: 0,
    roll: 0,
    camTilt: 0,
    camPan: 0
};

init();
setupStudio();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    // Khởi tạo Ambient Light cơ bản
    ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    const aspect = window.innerWidth / window.innerHeight;
    povLabel = document.getElementById('pov-label');

    // 1. Camera POV (Gắn vào đầu robot)
    cameraPOV = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    
    // 2. Camera 3rd Person
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

// --- HỆ THỐNG CAMERA RIG 6-DOF TRÊN TRACK ---
function createRobotArm() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.1 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 1, roughness: 0.1 });

    // 0. Track (Đường ray mô phỏng)
    const track = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 2), new THREE.MeshStandardMaterial({color: 0x222222}));
    track.position.z = 15;
    scene.add(track);

    // 1. Base (Đế di chuyển trên trục X) - Cao 9m như thiết kế
    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 9, 2.5), metalMat);
    group.add(base);

    // 2. Arm Pan Joint (±176°)
    const panJoint = new THREE.Group();
    panJoint.position.y = 4.7;
    base.add(panJoint);
    const panVisual = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 32), jointMat);
    panJoint.add(panVisual);

    // 3. Arm 1: Lower Lift (-90° / +19°)
    const lowerLiftJoint = new THREE.Group();
    lowerLiftJoint.position.y = 0.2;
    panJoint.add(lowerLiftJoint);

    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 16), metalMat);
    arm1.position.y = 2.5; 
    lowerLiftJoint.add(arm1);

    // 4. Arm 2: Upper Lift (±62°)
    const upperLiftJoint = new THREE.Group();
    upperLiftJoint.position.y = 2.5; 
    arm1.add(upperLiftJoint);

    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 16), metalMat);
    arm2.position.y = 2;
    upperLiftJoint.add(arm2);

    // 5. Arm 3: Arm Roll/Tilt (±90°)
    const armRollJoint = new THREE.Group();
    armRollJoint.position.y = 2; 
    arm2.add(armRollJoint);

    const arm3 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 16), metalMat);
    arm3.position.y = 1;
    armRollJoint.add(arm3);

    // 6. Camera Head: Tilt (-36° / +116°)
    const camTiltJoint = new THREE.Group();
    camTiltJoint.position.y = 1; 
    arm3.add(camTiltJoint);

    // 7. Camera Head: Pan (±300°)
    const camPanJoint = new THREE.Group();
    camTiltJoint.add(camPanJoint);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), new THREE.MeshStandardMaterial({color: 0x000000}));
    camPanJoint.add(head);

    // GẮN CAMERA POV
    head.add(cameraPOV);
    cameraPOV.position.set(0, 0, 0); 
    cameraPOV.rotation.set(0, 0, 0);

    robotArm = { 
        base, 
        pan: panJoint, 
        lowerLift: lowerLiftJoint, 
        upperLift: upperLiftJoint, 
        roll: armRollJoint,
        camTilt: camTiltJoint,
        camPan: camPanJoint
    };
    
    return group;
}

function setupStudio() {
    targetObject = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2, 0), 
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.1, clearcoat: 1 })
    );
    targetObject.position.y = 2.5;
    targetObject.castShadow = true;
    scene.add(targetObject);

    scene.add(new THREE.GridHelper(50, 50, 0x444444, 0x222222));

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    robotRig = createRobotArm();
    robotRig.position.set(0, 0, 15); 
    scene.add(robotRig);

    helperGroup = new THREE.Group();
    scene.add(helperGroup);

    gui = new GUI({ title: 'Studio Manager' });
    
    // --- ROBOT CONTROLLER ---
    const robotFolder = gui.addFolder('Robot Rig Controller');
    
    robotFolder.add(robotParams, 'trackX', -10, 10).name('Track (X Axis)').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'pan', -176, 176).name('Arm Pan (±176°)').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'lowerLift', -90, 19).name('Lower Lift (-90°/+19°)').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'upperLift', -62, 62).name('Upper Lift (±62°)').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'roll', -90, 90).name('Arm Roll (±90°)').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'camTilt', -36, 116).name('Camera Tilt (-36°/+116°)').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'camPan', -300, 300).name('Camera Pan (±300°)').onChange(applyRobotParams);
    robotFolder.open();

    // --- SEQUENCE CONTROLLER ---
    const seqFolder = gui.addFolder('🎬 Auto Motion Sequence');
    const seqActions = {
        addKeyframe: () => {
            sequence.push({ ...robotParams });
            updateStatus(`Keyframes: ${sequence.length}`);
        },
        clearSequence: () => {
            sequence = [];
            isPlaying = false;
            updateStatus('Sequence Cleared');
        },
        play: () => {
            if (sequence.length < 2) {
                updateStatus('Need at least 2 keyframes');
                return;
            }
            isPlaying = !isPlaying;
            updateStatus(isPlaying ? '▶️ Playing Sequence...' : '⏸️ Paused');
        }
    };
    seqFolder.add(seqActions, 'addKeyframe').name('Add Current as Keyframe');
    seqFolder.add(seqActions, 'play').name('Play/Pause Sequence');
    seqFolder.add(seqActions, 'clearSequence').name('Clear All');
    seqFolder.open();

    // Lighting Controller
    const lightManager = {
        addPoint: () => createDynamicLight('point'),
        addSpot: () => createDynamicLight('spot'),
        addAmbient: () => createDynamicLight('ambient'),
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
    manageFolder.add(lightManager, 'addSpot').name('Add Spot Light');
    manageFolder.add(lightManager, 'addAmbient').name('Add Ambient Light');
    manageFolder.add(lightManager, 'removeAll').name('Remove All Lights');

    gui.add(helperGroup, 'visible').name('Show Light Helpers');
    
    createDynamicLight('directional', { intensity: 30, x: 0, y: 30, z: 0 });
}

// Hàm áp dụng thông số từ robotParams lên các mesh 3D
function applyRobotParams() {
    if (isPlaying) return; // Chặn chỉnh tay khi đang chạy sequence
    const degToRad = THREE.MathUtils.degToRad;
    robotRig.position.x = robotParams.trackX;
    robotArm.pan.rotation.y = degToRad(robotParams.pan);
    robotArm.lowerLift.rotation.x = degToRad(robotParams.lowerLift);
    robotArm.upperLift.rotation.x = degToRad(robotParams.upperLift);
    robotArm.roll.rotation.x = degToRad(robotParams.roll);
    robotArm.camTilt.rotation.x = degToRad(robotParams.camTilt);
    robotArm.camPan.rotation.y = degToRad(robotParams.camPan);
}

// Logic nội suy chuyển động tự động
function updateAutoMotion(delta) {
    if (!isPlaying || sequence.length < 2) return;

    progressInFrame += delta / frameDuration;

    if (progressInFrame >= 1) {
        progressInFrame = 0;
        currentKeyframeIndex = (currentKeyframeIndex + 1) % (sequence.length - 1);
    }

    const start = sequence[currentKeyframeIndex];
    const end = sequence[currentKeyframeIndex + 1];

    const lerp = (a, b, t) => a + (b - a) * t;

    // Nội suy tất cả các thông số
    robotParams.trackX = lerp(start.trackX, end.trackX, progressInFrame);
    robotParams.pan = lerp(start.pan, end.pan, progressInFrame);
    robotParams.lowerLift = lerp(start.lowerLift, end.lowerLift, progressInFrame);
    robotParams.upperLift = lerp(start.upperLift, end.upperLift, progressInFrame);
    robotParams.roll = lerp(start.roll, end.roll, progressInFrame);
    robotParams.camTilt = lerp(start.camTilt, end.camTilt, progressInFrame);
    robotParams.camPan = lerp(start.camPan, end.camPan, progressInFrame);

    // Áp dụng vào mô hình thực tế
    const degToRad = THREE.MathUtils.degToRad;
    robotRig.position.x = robotParams.trackX;
    robotArm.pan.rotation.y = degToRad(robotParams.pan);
    robotArm.lowerLift.rotation.x = degToRad(robotParams.lowerLift);
    robotArm.upperLift.rotation.x = degToRad(robotParams.upperLift);
    robotArm.roll.rotation.x = degToRad(robotParams.roll);
    robotArm.camTilt.rotation.x = degToRad(robotParams.camTilt);
    robotArm.camPan.rotation.y = degToRad(robotParams.camPan);

    // Cập nhật hiển thị GUI để các thanh trượt tự di chuyển
    gui.controllers.forEach(c => {
        if (c.property in robotParams) c.updateDisplay();
    });
}

function updateStatus(msg) {
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.innerText = `STATUS: ${msg}`;
}

function createDynamicLight(type, config = {}) {
    let light, helper, target;
    const id = lightList.length + 1;
    const color = config.color || 0xffffff;
    const intensity = config.intensity !== undefined ? config.intensity : 1;
    const sync = () => { if (helper && helper.update) helper.update(); };

    switch(type) {
        case 'directional':
            light = new THREE.DirectionalLight(color, intensity);
            light.castShadow = true;
            target = light.target;
            scene.add(target);
            helper = new THREE.DirectionalLightHelper(light, 1);
            break;
        case 'point':
            light = new THREE.PointLight(color, intensity);
            helper = new THREE.PointLightHelper(light, 0.5);
            break;
        case 'spot':
            light = new THREE.SpotLight(color, intensity);
            light.castShadow = true;
            light.angle = Math.PI / 6;
            target = light.target;
            scene.add(target);
            helper = new THREE.SpotLightHelper(light);
            break;
        case 'ambient':
            light = new THREE.AmbientLight(color, intensity);
            helper = new THREE.Group(); 
            break;
    }

    if (type !== 'ambient') light.position.set(config.x || 0, config.y || 10, config.z || 0);
    scene.add(light);
    helperGroup.add(helper);

    const folder = gui.addFolder(`${type.toUpperCase()} #${id}`);
    folder.addColor(light, 'color').onChange(sync);
    folder.add(light, 'intensity', 0, 100);
    if (type !== 'ambient') {
        const posF = folder.addFolder('Position');
        posF.add(light.position, 'x', -20, 20).onChange(sync);
        posF.add(light.position, 'y', 0, 30).onChange(sync);
        posF.add(light.position, 'z', -20, 20).onChange(sync);
    }
    lightList.push({ light, helper, folder, target });
    sync();
}

function animate(time) {
    requestAnimationFrame(animate);
    const delta = time - lastTime;
    lastTime = time;

    controls.update();
    if (targetObject) targetObject.rotation.y += 0.005;
    
    // Cập nhật logic chuyển động tự động
    updateAutoMotion(delta);

    lightList.forEach(l => { 
        if (l.helper && l.helper.visible && l.helper.update) l.helper.update(); 
    });

    // RENDER LẦN 1: GÓC NHÌN THỨ 3
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.clear();
    renderer.render(scene, camera3P);

    // RENDER LẦN 2: POV ROBOT
    const scale = 0.25; 
    const povWidth = window.innerWidth * scale;
    const povHeight = window.innerHeight * scale;
    const margin = 20;

    renderer.setViewport(window.innerWidth - povWidth - margin, margin, povWidth, povHeight);
    renderer.setScissor(window.innerWidth - povWidth - margin, margin, povWidth, povHeight);
    renderer.setScissorTest(true);
    renderer.clearDepth();
    renderer.render(scene, cameraPOV);
    
    if (povLabel) { povLabel.style.bottom = (povHeight + margin + 5) + "px"; }
    renderer.setScissorTest(false);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera3P.aspect = aspect; camera3P.updateProjectionMatrix();
    cameraPOV.aspect = aspect; cameraPOV.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}