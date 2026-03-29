// Three.js - Picking - RayCaster w/Transparency & GPU Picking
import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // 1. Import OrbitControls

function main() {
    const canvas = document.querySelector('#c');
    const infoElem = document.querySelector('#info');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

    const fov = 60;
    const aspect = 2;
    const near = 0.1;
    const far = 200;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    
    // Position the camera directly in the world
    camera.position.set(0, 0, 30); 

    // 2. Initialize OrbitControls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; // Adds smooth inertia to the manual camera movement
    controls.dampingFactor = 0.05;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('white');
    const pickingScene = new THREE.Scene();
    pickingScene.background = new THREE.Color(0);

    // Note: cameraPole has been completely removed to let OrbitControls do its job!

    {
        const color = 0xFFFFFF;
        const intensity = 3;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        // Add the light to the scene instead of the camera so it stays fixed in the world
        scene.add(light); 
    }

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    function rand(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return min + (max - min) * Math.random();
    }

    function randomColor() {
        return `hsl(${rand(360) | 0}, ${rand(50, 100) | 0}%, 50%)`;
    }

    const loader = new THREE.TextureLoader();
    const texture = loader.load('https://threejs.org/manual/examples/resources/images/frame.png');

    const idToObject = {};
    const cubes = []; 
    const numObjects = 100;

    for (let i = 0; i < numObjects; ++i) {
        const id = i + 1;
        const baseColor = randomColor();

        const hollowMat = new THREE.MeshPhongMaterial({
            color: baseColor,
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5,
        });

        const solidMat = new THREE.MeshPhongMaterial({
            color: baseColor,
        });

        const cube = new THREE.Mesh(geometry, solidMat); 
        
        cube.userData = {
            id: id,
            hollowMat: hollowMat,
            solidMat: solidMat
        };

        scene.add(cube);
        cubes.push(cube);
        idToObject[id] = cube;

        cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
        cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
        cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));

        const pickingMaterial = new THREE.MeshPhongMaterial({
            emissive: new THREE.Color().setHex(id, THREE.NoColorSpace),
            color: new THREE.Color(0, 0, 0),
            specular: new THREE.Color(0, 0, 0),
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5,
            blending: THREE.NoBlending,
        });
        const pickingCube = new THREE.Mesh(geometry, pickingMaterial);
        pickingScene.add(pickingCube);
        pickingCube.position.copy(cube.position);
        pickingCube.rotation.copy(cube.rotation);
        pickingCube.scale.copy(cube.scale);
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    class GPUPickHelper {
        constructor() {
            this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
            this.pixelBuffer = new Uint8Array(4);
            this.pickedObject = null;
            this.pickedObjectSavedColor = 0;
        }

        clearPick() {
            if (this.pickedObject) {
                this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
                this.pickedObject = null;
            }
        }

        pick(cssPosition, scene, camera, time) {
            this.clearPick();

            const pixelRatio = renderer.getPixelRatio();
            camera.setViewOffset(
                renderer.getContext().drawingBufferWidth,
                renderer.getContext().drawingBufferHeight,
                cssPosition.x * pixelRatio | 0,
                cssPosition.y * pixelRatio | 0,
                1,
                1,
            );

            renderer.setRenderTarget(this.pickingTexture);
            renderer.render(scene, camera);
            renderer.setRenderTarget(null);
            camera.clearViewOffset();

            renderer.readRenderTargetPixels(this.pickingTexture, 0, 0, 1, 1, this.pixelBuffer);

            const id = (this.pixelBuffer[0] << 16) | (this.pixelBuffer[1] << 8) | (this.pixelBuffer[2]);
            const intersectedObject = idToObject[id];

            if (intersectedObject) {
                this.pickedObject = intersectedObject;
                this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
                this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
            }
        }
    }

    class RaycastPickHelper {
        constructor() {
            this.raycaster = new THREE.Raycaster();
            this.pickedObject = null;
            this.pickedObjectSavedColor = 0;
        }

        clearPick() {
            if (this.pickedObject) {
                this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
                this.pickedObject = null;
            }
        }

        pick(normalizedPosition, scene, camera, time, objects) {
            this.clearPick();
            this.raycaster.setFromCamera(normalizedPosition, camera);
            const intersectedObjects = this.raycaster.intersectObjects(objects);

            if (intersectedObjects.length) {
                this.pickedObject = intersectedObjects[0].object;
                this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
                this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
            }
        }
    }

    const cssPickPosition = { x: 0, y: 0 };
    const ndcPickPosition = { x: -100000, y: -100000 };
    const gpuPickHelper = new GPUPickHelper();
    const raycastPickHelper = new RaycastPickHelper();
    
    const params = {
        mode: 'Solid + Raycaster'
    };

    const gui = new GUI();
    gui.add(params, 'mode', [
        'Solid + Raycaster',
        'Hollow + Raycaster',
        'Hollow + GPU Picking'
    ]).onChange(updateSceneMode);

    function updateSceneMode() {
        gpuPickHelper.clearPick();
        raycastPickHelper.clearPick();

        const isSolid = params.mode === 'Solid + Raycaster';

        cubes.forEach(cube => {
            if (isSolid) {
                cube.material = cube.userData.solidMat;
            } else {
                cube.material = cube.userData.hollowMat;
            }
        });
    }

    updateSceneMode();
    clearPickPosition();

    function render(time) {
        time *= 0.001; 

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        // 3. Update the controls every frame (required because enableDamping is true)
        controls.update(); 

        let activePickedObject = null;

        if (params.mode === 'Hollow + GPU Picking') {
            raycastPickHelper.clearPick();
            gpuPickHelper.pick(cssPickPosition, pickingScene, camera, time);
            activePickedObject = gpuPickHelper.pickedObject;
        } else {
            gpuPickHelper.clearPick();
            raycastPickHelper.pick(ndcPickPosition, scene, camera, time, cubes);
            activePickedObject = raycastPickHelper.pickedObject;
        }

        if (cssPickPosition.x >= 0) {
            const hoveredId = activePickedObject ? `Cube ID: ${activePickedObject.userData.id}` : "None";
            
            const ndcXMath = `(${cssPickPosition.x.toFixed(0)} / ${canvas.clientWidth}) * 2 - 1`;
            const ndcYMath = `-(${cssPickPosition.y.toFixed(0)} / ${canvas.clientHeight}) * 2 + 1`;
            
            infoElem.innerHTML = `
<b>Hovered Object:</b> ${hoveredId}
<b>CSS Mouse Coord:</b> X: ${cssPickPosition.x.toFixed(0)}, Y: ${cssPickPosition.y.toFixed(0)}

<b>--- Conversion Math (CSS to NDC) ---</b>
<b>NDC X:</b> ${ndcXMath} = ${ndcPickPosition.x.toFixed(3)}
<b>NDC Y:</b> ${ndcYMath} = ${ndcPickPosition.y.toFixed(3)}

<b>--- 3D World Projection ---</b>
Vector3(NDC_X, NDC_Y, 0.5).unproject(camera)
            `.trim();
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    function getCanvasRelativePosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height,
        };
    }

    function setPickPosition(event) {
        const pos = getCanvasRelativePosition(event);
        
        cssPickPosition.x = pos.x;
        cssPickPosition.y = pos.y;

        ndcPickPosition.x = (pos.x / canvas.width) * 2 - 1;
        ndcPickPosition.y = (pos.y / canvas.height) * -2 + 1;
    }

    function clearPickPosition() {
        cssPickPosition.x = -100000;
        cssPickPosition.y = -100000;
        ndcPickPosition.x = -100000;
        ndcPickPosition.y = -100000;
        infoElem.innerHTML = "Hover over an object";
    }

    window.addEventListener('mousemove', setPickPosition);
    window.addEventListener('mouseout', clearPickPosition);
    window.addEventListener('mouseleave', clearPickPosition);

    window.addEventListener('touchstart', (event) => {
        event.preventDefault();
        setPickPosition(event.touches[0]);
    }, { passive: false });

    window.addEventListener('touchmove', (event) => {
        setPickPosition(event.touches[0]);
    });

    window.addEventListener('touchend', clearPickPosition);
}

main();