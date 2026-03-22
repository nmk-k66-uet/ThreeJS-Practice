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

init();
setupStudio();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    // Khởi tạo Ambient Light cơ bản để cảnh không bị tối đen hoàn toàn
    ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    const aspect = window.innerWidth / window.innerHeight;
    povLabel = document.getElementById('pov-label');

    // 1. Camera POV (Gắn vào khớp cuối cùng của robot)
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

    // 1. Base (Đế di chuyển trên trục X)
    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 9, 2.5), metalMat);
    group.add(base);

    // 2. Arm Pan Joint (±176°)
    const panJoint = new THREE.Group();
    panJoint.position.y = 4.7;
    base.add(panJoint);
    const panVisual = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 32), jointMat);
    panJoint.add(panVisual);

    // 3. Arm 1: Lower Lift (+90° / -19°)
    const lowerLiftJoint = new THREE.Group();
    lowerLiftJoint.position.y = 0.2;
    panJoint.add(lowerLiftJoint);

    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 16), metalMat);
    arm1.position.y = 2.5; 
    lowerLiftJoint.add(arm1);

    // 4. Arm 2: Upper Lift (±62°)
    const upperLiftJoint = new THREE.Group();
    upperLiftJoint.position.y = 2.5; // Đỉnh arm1
    arm1.add(upperLiftJoint);

    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 16), metalMat);
    arm2.position.y = 2;
    upperLiftJoint.add(arm2);

    // 5. Arm 3: Arm Roll/Tilt (±170°) - Ngắn hơn
    const armRollJoint = new THREE.Group();
    armRollJoint.position.y = 2; // Đỉnh arm2
    arm2.add(armRollJoint);

    const arm3 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 16), metalMat);
    arm3.position.y = 1;
    armRollJoint.add(arm3);

    // 6. Camera Head: Tilt (±116°)
    const camTiltJoint = new THREE.Group();
    camTiltJoint.position.y = 1; // Đỉnh arm3
    arm3.add(camTiltJoint);

    // 7. Camera Head: Pan (±300°)
    const camPanJoint = new THREE.Group();
    camTiltJoint.add(camPanJoint);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), new THREE.MeshStandardMaterial({color: 0x000000}));
    camPanJoint.add(head);

    // --- GẮN CAMERA POV VÀO ĐẦU CAMERA ---
    head.add(cameraPOV);
    cameraPOV.position.set(0, 0, 0); 
    cameraPOV.rotation.set(0, 0, 0);

    // Lưu tham chiếu để điều khiển
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

    // Mặt phẳng nền
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            roughness: 0.6, 
            metalness: 0.1 
        })
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
    
    // --- ĐIỀU KHIỂN ROBOT ---
    const robotFolder = gui.addFolder('Robot Rig Controller');
    const degToRad = THREE.MathUtils.degToRad;

    const robotParams = {
        trackX: 0,
        pan: 0,
        lowerLift: 0,
        upperLift: 0,
        roll: 0,
        camTilt: 0,
        camPan: 0
    };

    robotFolder.add(robotParams, 'trackX', -10, 10).name('Track (X Axis)').onChange(v => robotRig.position.x = v);
    robotFolder.add(robotParams, 'pan', -176, 176).name('Arm Pan (±176°)').onChange(v => { robotArm.pan.rotation.y = degToRad(v); });
    robotFolder.add(robotParams, 'lowerLift', -90, 19).name('Lower Lift (-90°/+19°)').onChange(v => { robotArm.lowerLift.rotation.x = degToRad(v); });
    robotFolder.add(robotParams, 'upperLift', -62, 62).name('Upper Lift (±62°)').onChange(v => { robotArm.upperLift.rotation.x = degToRad(v); });
    robotFolder.add(robotParams, 'roll', -90, 90).name('Arm Roll/Tilt (±90°)').onChange(v => { robotArm.roll.rotation.x = degToRad(v); });
    robotFolder.add(robotParams, 'camTilt', -36, 116).name('Camera Tilt (-36°/+116°)').onChange(v => { robotArm.camTilt.rotation.x = degToRad(v); });
    robotFolder.add(robotParams, 'camPan', -300, 300).name('Camera Pan (±300°)').onChange(v => { robotArm.camPan.rotation.y = degToRad(v); });

    robotFolder.open();

    // Lighting Controller
    const lightManager = {
        addHemisphere: () => createDynamicLight('hemisphere'),
        addDirectional: () => createDynamicLight('directional'),
        addPoint: () => createDynamicLight('point'),
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
    manageFolder.add(lightManager, 'addHemisphere').name('Add Hemisphere Light');
    manageFolder.add(lightManager, 'addDirectional').name('Add Directional Light');
    manageFolder.add(lightManager, 'addPoint').name('Add Point Light');
    manageFolder.add(lightManager, 'addSpot').name('Add Spot Light');
    manageFolder.add(lightManager, 'removeAll').name('Remove All Lights');

    gui.add(helperGroup, 'visible').name('Show Light Helpers');
    
    // Mặc định tạo một đèn Directional ban đầu thay vì Hemisphere
    createDynamicLight('directional', { intensity: 30, x: 0, y: 30, z: 0 });
}

function createDynamicLight(type, config = {}) {
    let light, helper, target;
    const id = lightList.length + 1;
    const color = config.color || 0xffffff;
    const intensity = config.intensity !== undefined ? config.intensity : 1;

    const sync = () => {
        if (helper && helper.update) helper.update();
    };

    switch(type) {
        case 'hemisphere':
            light = new THREE.HemisphereLight(color, 0x442222, intensity);
            helper = new THREE.Group(); 
            break;
        case 'directional':
            light = new THREE.DirectionalLight(color, intensity);
            light.castShadow = true;
            // Cấu hình Shadow cho đèn Directional
            light.shadow.camera.left = -20;
            light.shadow.camera.right = 20;
            light.shadow.camera.top = 20;
            light.shadow.camera.bottom = -20;
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
    }

    if (type !== 'hemisphere') {
        light.position.set(config.x || 0, config.y || 10, config.z || 0);
    }
    
    scene.add(light);
    helperGroup.add(helper);

    const folderName = `${type.charAt(0).toUpperCase() + type.slice(1)} #${id}`;
    const folder = gui.addFolder(folderName);

    if (type === 'hemisphere') {
        folder.addColor(light, 'color').name('skyColor');
        folder.addColor(light, 'groundColor');
        folder.add(light, 'intensity', 0, 2);
        folder.add(light, 'visible');
    } else if (type === 'directional') {
        folder.addColor(light, 'color').onChange(sync);
        folder.add(light, 'intensity', 0, 100).onChange(sync);
        folder.add(light, 'visible').name('Enable').onChange(v => { helper.visible = v; sync(); });
        
        const dPos = folder.addFolder('Position');
        dPos.add(light.position, 'x', -15, 15).onChange(sync);
        dPos.add(light.position, 'y', 0, 20).onChange(sync);
        dPos.add(light.position, 'z', -15, 15).onChange(sync);
        
        const dTarget = folder.addFolder('Target');
        dTarget.add(target.position, 'x', -10, 10).onChange(sync);
        dTarget.add(target.position, 'y', -5, 5).onChange(sync);
        dTarget.add(target.position, 'z', -10, 10).onChange(sync);
    } else if (type === 'point') {
        folder.addColor(light, 'color').onChange(sync);
        folder.add(light, 'intensity', 0, 500).onChange(sync);
        folder.add(light, 'distance', 0, 50).onChange(sync);
        folder.add(light, 'visible').name('Enable').onChange(v => { helper.visible = v; sync(); });

        const pPos = folder.addFolder('Position');
        pPos.add(light.position, 'x', -15, 15).onChange(sync);
        pPos.add(light.position, 'y', 0, 20).onChange(sync);
        pPos.add(light.position, 'z', -15, 15).onChange(sync);
    } else if (type === 'spot') {
        folder.addColor(light, 'color').onChange(sync);
        folder.add(light, 'intensity', 0, 1000).onChange(sync);
        folder.add(light, 'distance', 0, 50).onChange(sync);
        folder.add(light, 'angle', 0, Math.PI / 2).onChange(sync);
        folder.add(light, 'penumbra', 0, 1).onChange(sync);
        folder.add(light, 'visible').name('Enable').onChange(v => { helper.visible = v; sync(); });

        const sPos = folder.addFolder('Position');
        sPos.add(light.position, 'x', -15, 15).onChange(sync);
        sPos.add(light.position, 'y', 0, 20).onChange(sync);
        sPos.add(light.position, 'z', -15, 15).onChange(sync);
        
        const sTarget = folder.addFolder('Target');
        sTarget.add(target.position, 'x', -10, 10).onChange(sync);
        sTarget.add(target.position, 'y', -5, 5).onChange(sync);
        sTarget.add(target.position, 'z', -10, 10).onChange(sync);
    }

    folder.add({ delete: () => {
        scene.remove(light);
        helperGroup.remove(helper);
        if(target) scene.remove(target);
        folder.destroy();
        lightList = lightList.filter(l => l.light !== light);
    }}, 'delete').name('🗑️ Delete Light');

    lightList.push({ light, helper, folder, target });
    sync();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (targetObject) targetObject.rotation.y += 0.005;
    
    lightList.forEach(l => { 
        if (l.helper && l.helper.visible && l.helper.update) l.helper.update(); 
    });

    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.clear();
    renderer.render(scene, camera3P);

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