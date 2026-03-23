import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, ambient, cameraPOV, camera3P, renderer, controls, gui;
let robotRig, robotArm = {};
let targetObject, helperGroup, lightList = [];
let povLabel;

// --- QUẢN LÝ SEQUENCE ---
let sequences = { "Sequence 01": [] };
let activeSeqName = "Sequence 01";
let isPlaying = false;
let useInterpolation = true;
let currentKeyframeIndex = 0;
let progressInFrame = 0;
const frameDuration = 3000;
let lastTime = 0;
let kfFolder; 

// --- GHI HÌNH ---
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
const recordingCanvas = document.createElement('canvas');
const recordingContext = recordingCanvas.getContext('2d');

const robotParams = {
    trackX: 0, pan: 0, lowerLift: 0, upperLift: 0, roll: 0, camTilt: 0, camPan: 0
};

init();
setupStudio();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    const aspect = window.innerWidth / window.innerHeight;
    povLabel = document.getElementById('pov-label');

    cameraPOV = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera3P = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera3P.position.set(15, 12, 15);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        preserveDrawingBuffer: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.autoClear = false; 
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera3P, renderer.domElement);
    controls.enableDamping = true;

    window.addEventListener('resize', onWindowResize);
}

function createRobotArm() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.1 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 1, roughness: 0.1 });

    const track = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 2), new THREE.MeshStandardMaterial({color: 0x222222}));
    track.position.z = 15;
    scene.add(track);

    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 9, 2.5), metalMat);
    group.add(base);

    const panJoint = new THREE.Group();
    panJoint.position.y = 4.7;
    base.add(panJoint);
    const panVisual = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 32), jointMat);
    panJoint.add(panVisual);

    const lowerLiftJoint = new THREE.Group();
    lowerLiftJoint.position.y = 0.2;
    panJoint.add(lowerLiftJoint);

    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 16), metalMat);
    arm1.position.y = 2.5; 
    lowerLiftJoint.add(arm1);

    const upperLiftJoint = new THREE.Group();
    upperLiftJoint.position.y = 2.5; 
    arm1.add(upperLiftJoint);

    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 16), metalMat);
    arm2.position.y = 2;
    upperLiftJoint.add(arm2);

    const armRollJoint = new THREE.Group();
    armRollJoint.position.y = 2; 
    arm2.add(armRollJoint);

    const arm3 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 16), metalMat);
    arm3.position.y = 1;
    armRollJoint.add(arm3);

    const camTiltJoint = new THREE.Group();
    camTiltJoint.position.y = 1; 
    arm3.add(camTiltJoint);

    const camPanJoint = new THREE.Group();
    camTiltJoint.add(camPanJoint);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), new THREE.MeshStandardMaterial({color: 0x000000}));
    camPanJoint.add(head);

    head.add(cameraPOV);
    cameraPOV.position.set(0, 0, 0); 
    cameraPOV.rotation.set(0, 0, 0);

    robotArm = { base, pan: panJoint, lowerLift: lowerLiftJoint, upperLift: upperLiftJoint, roll: armRollJoint, camTilt: camTiltJoint, camPan: camPanJoint };
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
    
    const robotFolder = gui.addFolder('Robot Rig Controller');
    robotFolder.add(robotParams, 'trackX', -15, 15).name('Track (X)').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'pan', -176, 176).name('Arm Pan').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'lowerLift', -90, 19).name('Lower Lift').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'upperLift', -62, 62).name('Upper Lift').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'roll', -90, 90).name('Arm Roll').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'camTilt', -36, 116).name('Cam Tilt').onChange(applyRobotParams);
    robotFolder.add(robotParams, 'camPan', -300, 300).name('Cam Pan').onChange(applyRobotParams);
    robotFolder.add({ reset: resetRobot }, 'reset').name('Reset All Parameters');

    const seqFolder = gui.addFolder('Sequence Manager');
    const seqControls = {
        active: activeSeqName,
        new: () => {
            const name = prompt("New Sequence Name:", `Sequence ${Object.keys(sequences).length + 1}`);
            if (name) { sequences[name] = []; updateSeqDropdown(); }
        },
        rename: () => {
            const name = prompt("New Name:", activeSeqName);
            if (name && name !== activeSeqName) {
                sequences[name] = sequences[activeSeqName];
                delete sequences[activeSeqName];
                activeSeqName = name;
                updateSeqDropdown();
            }
        },
        delete: () => {
            if (Object.keys(sequences).length > 1) {
                delete sequences[activeSeqName];
                activeSeqName = Object.keys(sequences)[0];
                updateSeqDropdown();
            }
        },
        addKey: () => {
            sequences[activeSeqName].push({ ...robotParams });
            updateStatus(`Keys: ${sequences[activeSeqName].length}`);
            refreshKeyframeUI();
        },
        clearKeys: () => { 
            sequences[activeSeqName] = []; 
            refreshKeyframeUI();
        },
        export: () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sequences));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "studio_setup.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },
        import: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.readAsText(file, 'UTF-8');
                reader.onload = re => {
                    try {
                        const importedData = JSON.parse(re.target.result);
                        Object.assign(sequences, importedData);
                        const firstImportedKey = Object.keys(importedData)[0];
                        if (firstImportedKey) activeSeqName = firstImportedKey;
                        updateSeqDropdown();
                        refreshKeyframeUI();
                        updateStatus("Imported and Merged Successfully");
                    } catch (err) {
                        updateStatus("Error: Invalid JSON file");
                    }
                }
            };
            input.click();
        }
    };

    let seqDropdown = seqFolder.add(seqControls, 'active', Object.keys(sequences)).name('Active Seq').onChange(v => { 
        activeSeqName = v; 
        refreshKeyframeUI();
    });

    function updateSeqDropdown() {
        seqDropdown.destroy();
        seqDropdown = seqFolder.add(seqControls, 'active', Object.keys(sequences)).name('Active Seq').onChange(v => { 
            activeSeqName = v; 
            refreshKeyframeUI();
        }).listen();
    }

    seqFolder.add(seqControls, 'new').name('New Sequence');
    seqFolder.add(seqControls, 'rename').name('Rename');
    seqFolder.add(seqControls, 'delete').name('Delete');
    seqFolder.add(seqControls, 'addKey').name('Add Keyframe');
    seqFolder.add(seqControls, 'clearKeys').name('Clear Keyframes');
    seqFolder.add(seqControls, 'export').name('💾 Export JSON');
    seqFolder.add(seqControls, 'import').name('📂 Import JSON');

    kfFolder = seqFolder.addFolder('Keyframe List');
    refreshKeyframeUI();

    const playFolder = gui.addFolder('Playback & Render');
    const playControls = {
        playPreview: () => {
            if (sequences[activeSeqName].length < 2) return updateStatus("Need 2 keys!");
            isPlaying = !isPlaying;
            if (isPlaying) {
                currentKeyframeIndex = 0;
                progressInFrame = 0;
            }
            updateStatus(isPlaying ? "▶️ Previewing..." : "⏸️ Paused");
        },
        runAndRecord: () => {
            if (sequences[activeSeqName].length < 2) return updateStatus("Need 2 keys!");
            startRecording();
        },
        interp: true
    };
    playFolder.add(playControls, 'playPreview').name('Play/Pause Preview');
    playFolder.add(playControls, 'runAndRecord').name('🔴 RUN & RECORD POV');
    playFolder.add(playControls, 'interp').name('Use Interpolation').onChange(v => useInterpolation = v);

    const lightManager = {
        addPoint: () => createDynamicLight('point'),
        addSpot: () => createDynamicLight('spot'),
        addAmbient: () => createDynamicLight('ambient')
    };
    const manageFolder = gui.addFolder('Lighting Controller');
    manageFolder.add(lightManager, 'addPoint').name('Add Point');
    manageFolder.add(lightManager, 'addSpot').name('Add Spot');
    manageFolder.add(lightManager, 'addAmbient').name('Add Ambient');
    
    gui.add(helperGroup, 'visible').name('Show Light Helpers');
    createDynamicLight('directional', { intensity: 30, x: 0, y: 30, z: 0 });
}

function refreshKeyframeUI() {
    if (!kfFolder) return;
    [...kfFolder.controllers].forEach(c => c.destroy());
    const currentList = sequences[activeSeqName];
    if (currentList.length === 0) {
        kfFolder.add({ msg: "No Keyframes" }, 'msg').name('Empty').disable();
    } else {
        currentList.forEach((kf, index) => {
            const obj = {};
            const keyName = `Jump to Key #${index + 1}`;
            obj[keyName] = () => {
                if (isPlaying || isRecording) return;
                Object.assign(robotParams, kf);
                updateRobotVisuals(robotParams);
                gui.controllers.forEach(c => { if (c.property in robotParams) c.updateDisplay(); });
            };
            kfFolder.add(obj, keyName);
        });
    }
}

function resetRobot() {
    if (isPlaying || isRecording) return;
    Object.keys(robotParams).forEach(k => robotParams[k] = 0);
    updateRobotVisuals(robotParams);
    gui.controllers.forEach(c => { if (c.property in robotParams) c.updateDisplay(); });
    updateStatus("Reset to Zero");
}

function applyRobotParams() {
    if (isPlaying || isRecording) return;
    updateRobotVisuals(robotParams);
}

function updateRobotVisuals(params) {
    const degToRad = THREE.MathUtils.degToRad;
    robotRig.position.x = params.trackX;
    robotArm.pan.rotation.y = degToRad(params.pan);
    robotArm.lowerLift.rotation.x = degToRad(params.lowerLift);
    robotArm.upperLift.rotation.x = degToRad(params.upperLift);
    robotArm.roll.rotation.x = degToRad(params.roll);
    robotArm.camTilt.rotation.x = degToRad(params.camTilt);
    robotArm.camPan.rotation.y = degToRad(params.camPan);
}

function updateAutoMotion(delta) {
    if ((!isPlaying && !isRecording) || sequences[activeSeqName].length < 2) return;

    progressInFrame += delta / frameDuration;

    if (progressInFrame >= 1) {
        progressInFrame = 0;
        currentKeyframeIndex++;
        
        if (currentKeyframeIndex >= sequences[activeSeqName].length - 1) {
            currentKeyframeIndex = 0;
            if (isRecording) stopRecording();
            else isPlaying = false; 
            updateStatus("Done");
            return;
        }
    }

    const start = sequences[activeSeqName][currentKeyframeIndex];
    const end = sequences[activeSeqName][currentKeyframeIndex + 1];
    const lerp = (a, b, t) => a + (b - a) * t;

    const currentFrameParams = {};
    for (let key in robotParams) {
        currentFrameParams[key] = useInterpolation ? lerp(start[key], end[key], progressInFrame) : start[key];
    }

    updateRobotVisuals(currentFrameParams);
    Object.assign(robotParams, currentFrameParams);
    if (isPlaying) {
        gui.controllers.forEach(c => { if (c.property in robotParams) c.updateDisplay(); });
    }
}

function startRecording() {
    recordedChunks = [];
    currentKeyframeIndex = 0;
    progressInFrame = 0;
    isRecording = true;
    updateStatus("🔴 RECORDING...");

    // TÍNH TOÁN KÍCH THƯỚC DỰA TRÊN ASPECT RATIO THỰC TẾ
    const scale = 0.25;
    const pixelRatio = window.devicePixelRatio;
    const povWidth = window.innerWidth * scale * pixelRatio;
    const povHeight = window.innerHeight * scale * pixelRatio;
    
    recordingCanvas.width = povWidth;
    recordingCanvas.height = povHeight;

    let mimeType = 'video/webm;codecs=vp9';
    if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
    }

    const stream = recordingCanvas.captureStream(60); 
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = exportVideo;
    mediaRecorder.start();
}

function stopRecording() {
    isRecording = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

function exportVideo() {
    const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robot_pov_${activeSeqName.replace(/\s+/g, '_')}.mp4`;
    a.click();
    updateStatus("✅ Video Saved");
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
            target = light.target; scene.add(target);
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
            target = light.target; scene.add(target);
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
    
    updateAutoMotion(delta);

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
    const povX = window.innerWidth - povWidth - margin;
    const povY = margin;

    renderer.setViewport(povX, povY, povWidth, povHeight);
    renderer.setScissor(povX, povY, povWidth, povHeight);
    renderer.setScissorTest(true);
    renderer.clearDepth();
    renderer.render(scene, cameraPOV);
    
    if (povLabel) { povLabel.style.bottom = (povHeight + margin + 5) + "px"; }

    if (isRecording) {
        const pixelRatio = window.devicePixelRatio;
        const sourceX = povX * pixelRatio;
        // WEBGL Y bắt đầu từ đáy, CANVAS Y bắt đầu từ đỉnh. 
        // sourceY trong drawImage tính từ đỉnh canvas nguồn.
        const sourceY = (window.innerHeight - povHeight - povY) * pixelRatio;
        const sourceW = povWidth * pixelRatio;
        const sourceH = povHeight * pixelRatio;

        recordingContext.drawImage(
            renderer.domElement, 
            sourceX, sourceY, sourceW, sourceH, 
            0, 0, recordingCanvas.width, recordingCanvas.height
        );
    }

    renderer.setScissorTest(false);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera3P.aspect = aspect; camera3P.updateProjectionMatrix();
    cameraPOV.aspect = aspect; cameraPOV.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}