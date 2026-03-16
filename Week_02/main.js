import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- BIẾN TOÀN CỤC ---
let scene, camera, renderer, controls, gui, ground, lightHelpers;
let adaptiveLight, adaptiveHelper;
let currentTab = 'materials';
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const materialState = {
    lowPolyMode: false
};

init();
setupMaterials(); 
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onDocumentClick);
    
    window.addEventListener('mousemove', onMouseMove);

    document.getElementById('btn-materials').addEventListener('click', () => switchTab('materials'));
    document.getElementById('btn-lights').addEventListener('click', () => switchTab('lights'));
}

function makeTextSprite(message, parameters = {}) {
    const fontface = parameters.fontface || "Arial";
    const fontsize = parameters.fontsize || 32;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = "Bold " + fontsize + "px " + fontface;

    const metrics = context.measureText(message);
    const textWidth = metrics.width;

    canvas.width = textWidth + 20;
    canvas.height = fontsize * 1.5;

    context.font = "Bold " + fontsize + "px " + fontface;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(255, 255, 255, 1.0)";
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.scale.set(canvas.width / 100, canvas.height / 100, 1.0);
    return sprite;
}

function createCheckerboardTexture(repeatCount = 10) {
    const canvas = document.createElement('canvas');
    canvas.width = 2; canvas.height = 2;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, 1, 1); context.fillRect(1, 1, 1, 1);
    context.fillStyle = '#999999'; context.fillRect(1, 0, 1, 1); context.fillRect(0, 1, 1, 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatCount, repeatCount);
    return texture;
}

function switchTab(tab) {
    if (currentTab === tab) return;
    currentTab = tab;
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${tab}`).classList.add('active');
    clearScene();
    if (gui) gui.destroy();
    if (tab === 'materials') setupMaterials(); else setupLights();
}

function clearScene() {
    while(scene.children.length > 0){ scene.remove(scene.children[0]); }
    lightHelpers = null;
    adaptiveLight = null;
    adaptiveHelper = null;
}

// --- CẤU HÌNH TAB VẬT LIỆU ---
function setupMaterials() {
    scene.background = new THREE.Color(0x111111);
    camera.position.set(0, 3, 10);
    controls.target.set(0, 0, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(hemi);

    adaptiveLight = new THREE.PointLight(0x00ffff, 50, 20);
    adaptiveLight.position.set(2, 2, 2);
    scene.add(adaptiveLight);

    adaptiveHelper = new THREE.PointLightHelper(adaptiveLight, 0.5);
    scene.add(adaptiveHelper);

    ground = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshStandardMaterial({ map: createCheckerboardTexture(15), roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    scene.add(ground);

    const updateGeometries = () => {
        const segments = materialState.lowPolyMode ? 6 : 32;
        const sphereGeo = new THREE.SphereGeometry(1, segments, segments);
        
        scene.children.forEach(child => {
            if (child.isMesh && child.userData.isMaterialSphere) {
                child.geometry.dispose();
                child.geometry = sphereGeo;
                child.material.flatShading = materialState.lowPolyMode;
                child.material.needsUpdate = true;
            }
        });
    };

    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const mats = [
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
        new THREE.MeshLambertMaterial({ color: 0xff0000 }),
        new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 100 }),
        new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.5, roughness: 0.5 }),
        new THREE.MeshPhysicalMaterial({ color: 0xff00ff, metalness: 0.5, roughness: 0.1, clearcoat: 1.0 })
    ];

    const labelNames = ['Basic', 'Lambert', 'Phong', 'Standard', 'Physical'];

    mats.forEach((mat, i) => {
        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.position.x = (i - 2) * 2.8;
        mesh.userData.isMaterialSphere = true;
        scene.add(mesh);

        // Thêm nhãn tên phía trên quả cầu
        const label = makeTextSprite(labelNames[i]);
        label.position.set(mesh.position.x, 1.5, 0);
        scene.add(label);
    });

    gui = new GUI();
    
    const compFolder = gui.addFolder('Comparison Options');
    compFolder.add(materialState, 'lowPolyMode').name('Low Poly Mode').onChange(updateGeometries);

    const pLightFolder = gui.addFolder('Interactive Point Light');
    pLightFolder.add(adaptiveLight, 'visible').name('On/Off').onChange(v => adaptiveHelper.visible = v);
    pLightFolder.addColor(adaptiveLight, 'color').name('Color');
    pLightFolder.add(adaptiveLight, 'intensity', 0, 200).name('Intensity');
    pLightFolder.add(adaptiveLight, 'distance', 0, 50).name('Distance');
    
    const pPos = pLightFolder.addFolder('Position');
    pPos.add(adaptiveLight.position, 'x', -10, 10).onChange(() => adaptiveHelper.update());
    pPos.add(adaptiveLight.position, 'y', 0, 10).onChange(() => adaptiveHelper.update());
    pPos.add(adaptiveLight.position, 'z', -10, 10).onChange(() => adaptiveHelper.update());

    const pMatFolder = gui.addFolder('Phong Material');
    pMatFolder.add(mats[2], 'shininess', 0, 200);
    const sFolder = gui.addFolder('Standard Material');
    sFolder.add(mats[3], 'metalness', 0, 1); 
    sFolder.add(mats[3], 'roughness', 0, 1);

    const phFolder = gui.addFolder('Physical Material');
    phFolder.add(mats[4], 'clearcoat', 0, 1).name('Clearcoat');
    phFolder.add(mats[4], 'clearcoatRoughness', 0, 1).name('Clearcoat Roughness');
}

function setupLights() {
    scene.background = new THREE.Color(0x050505);
    camera.position.set(0, 5, 12);
    controls.target.set(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xeeeeff, 0x442222, 0.5);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    scene.add(dir);
    scene.add(dir.target);

    const point = new THREE.PointLight(0xffffff, 50);
    point.position.set(-5, 3, 2);
    scene.add(point);

    const spot = new THREE.SpotLight(0xffffff, 100);
    spot.position.set(0, 8, 0);
    spot.angle = Math.PI / 6;
    spot.penumbra = 0.3;
    spot.castShadow = true;
    scene.add(spot);
    scene.add(spot.target);

    const dirHelper = new THREE.DirectionalLightHelper(dir, 1);
    const pointHelper = new THREE.PointLightHelper(point, 0.5);
    const spotHelper = new THREE.SpotLightHelper(spot);
    const helperGroup = new THREE.Group();
    helperGroup.add(dirHelper, pointHelper, spotHelper);
    scene.add(helperGroup);

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.5 })
    );
    sphere.castShadow = true;
    scene.add(sphere);

    ground = new THREE.Mesh(
        new THREE.PlaneGeometry(25, 25),
        new THREE.MeshStandardMaterial({ map: createCheckerboardTexture(10), roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    ground.receiveShadow = true;
    scene.add(ground);

    gui = new GUI();
    const sync = () => {
        if (helperGroup.visible) {
            dirHelper.visible = dir.visible;
            pointHelper.visible = point.visible;
            spotHelper.visible = spot.visible;
        }
        dirHelper.update();
        spotHelper.update();
    };

    const aFolder = gui.addFolder('Ambient Light');
    aFolder.addColor(ambient, 'color');
    aFolder.add(ambient, 'intensity', 0, 2);
    aFolder.add(ambient, 'visible');

    const hFolder = gui.addFolder('Hemisphere Light');
    hFolder.addColor(hemi, 'color').name('skyColor');
    hFolder.addColor(hemi, 'groundColor');
    hFolder.add(hemi, 'intensity', 0, 2);
    hFolder.add(hemi, 'visible');

    const dFolder = gui.addFolder('Directional Light');
    dFolder.addColor(dir, 'color').onChange(sync);
    dFolder.add(dir, 'intensity', 0, 10).onChange(sync);
    const dPos = dFolder.addFolder('Position');
    dPos.add(dir.position, 'x', -15, 15).onChange(sync);
    dPos.add(dir.position, 'y', 0, 20).onChange(sync);
    dPos.add(dir.position, 'z', -15, 15).onChange(sync);
    const dTarget = dFolder.addFolder('Target');
    dTarget.add(dir.target.position, 'x', -10, 10).onChange(sync);
    dTarget.add(dir.target.position, 'y', -5, 5).onChange(sync);
    dTarget.add(dir.target.position, 'z', -10, 10).onChange(sync);

    const pFolder = gui.addFolder('Point Light');
    pFolder.addColor(point, 'color').onChange(sync);
    pFolder.add(point, 'intensity', 0, 500).onChange(sync);
    pFolder.add(point, 'distance', 0, 50).onChange(sync);
    const pPos = pFolder.addFolder('Position');
    pPos.add(point.position, 'x', -15, 15).onChange(sync);
    pPos.add(point.position, 'y', 0, 20).onChange(sync);
    pPos.add(point.position, 'z', -15, 15).onChange(sync);

    const sFolder = gui.addFolder('Spot Light');
    sFolder.addColor(spot, 'color').onChange(sync);
    sFolder.add(spot, 'intensity', 0, 1000).onChange(sync);
    sFolder.add(spot, 'distance', 0, 50).onChange(sync);
    sFolder.add(spot, 'angle', 0, Math.PI / 2).onChange(sync);
    sFolder.add(spot, 'penumbra', 0, 1).onChange(sync);
    const sPos = sFolder.addFolder('Position');
    sPos.add(spot.position, 'x', -15, 15).onChange(sync);
    sPos.add(spot.position, 'y', 0, 20).onChange(sync);
    sPos.add(spot.position, 'z', -15, 15).onChange(sync);
    const sTarget = sFolder.addFolder('Target');
    sTarget.add(spot.target.position, 'x', -10, 10).onChange(sync);
    sTarget.add(spot.target.position, 'y', -5, 5).onChange(sync);
    sTarget.add(spot.target.position, 'z', -10, 10).onChange(sync);

    gui.add(helperGroup, 'visible').name('Show Light Helpers').onChange(sync);
    sync();
    lightHelpers = { dirHelper, spotHelper, dir, spot, helperGroup };
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    if (currentTab === 'lights' && lightHelpers && lightHelpers.helperGroup.visible) {
        if (lightHelpers.dir.visible) lightHelpers.dirHelper.update();
        if (lightHelpers.spot.visible) lightHelpers.spotHelper.update();
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0 && ground && intersects[0].object !== ground) {
        const obj = intersects[0].object;
        if (obj.material) obj.material.color.set(Math.random() * 0xffffff);
    }
}