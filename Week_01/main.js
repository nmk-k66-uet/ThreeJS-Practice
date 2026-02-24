import * as THREE from 'three';

// A. Khởi tạo scene cơ bản
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// B. Thử nghiệm với các khối nguyên thủy

// 1. Hình lập phương
const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const cubeMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(cubeGeo, cubeMat);
cube.position.x = -4
scene.add(cube);

// 2. Hình cầu
const sphereGeo = new THREE.SphereGeometry(0.7, 32, 32);
const sphereMat = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.position.x = -2
scene.add(sphere) 

// 3. Hình hộp màu đen với cạnh trắng
// Hình hộp đen
const blackMat = new THREE.MeshBasicMaterial({color: 0x000000});
const specialCube = new THREE.Mesh(cubeGeo, blackMat);

// Các cạnh trắng
const edgesGeo = new THREE.EdgesGeometry(cubeGeo)
const edgesMat = new THREE.LineBasicMaterial({color: 0xffffff})
const edges = new THREE.LineSegments(edgesGeo, edgesMat) // wireframe

specialCube.add(edges)
specialCube.position.x = 0;
scene.add(specialCube)

// 4. Hình trụ
const cylinderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
const cylinderMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
cylinder.position.x = 2;
scene.add(cylinder);

// 5. Hình bánh xe
const torusGeo = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
const torusMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const torus = new THREE.Mesh(torusGeo, torusMat);
torus.position.x = 4;
scene.add(torus);

// 6. Mặt phẳng - Làm nền phía dưới
const planeGeo = new THREE.PlaneGeometry(12, 4);
const planeMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = Math.PI / 2; // Xoay ngang mặt phẳng
plane.position.y = -1.5;
scene.add(plane);

camera.position.z = 7;
camera.position.y = 1

function createCat() {
    // Create a group for the cat
    const catGroup = new THREE.Group();

    // --- Materials (All Basic for flat look) ---
    const orangeMat = new THREE.MeshBasicMaterial({ color: 0xF4A460 }); // Sandy brown color
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // --- 1. Body (Flattened Cylinder for trapezoid shape) ---
    // Top radius < bottom radius to create the trapezoid effect
    const bodyGeo = new THREE.CylinderGeometry(0.6, 1.2, 2.8, 32);
    const body = new THREE.Mesh(bodyGeo, orangeMat);
    body.scale.z = 0.1; // Flatten it
    catGroup.add(body);

    // --- 2. Tail (Capsule) ---
    const tailGeo = new THREE.CapsuleGeometry(0.3, 1.2, 16, 32);
    const tail = new THREE.Mesh(tailGeo, orangeMat);
    tail.rotation.z = Math.PI / 2; // Rotate horizontally
    tail.position.set(1.2, -1.1, 0); // Position at bottom right
    catGroup.add(tail);

    // --- 3. Ears (Cones) ---
    const earGeo = new THREE.ConeGeometry(0.2, 0.3, 32);
    const leftEar = new THREE.Mesh(earGeo, orangeMat);
    leftEar.position.set(-0.7, 1.33, 0);
    leftEar.rotation.z = 0.9;
    catGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, orangeMat);
    rightEar.position.set(0.6, 1.4, 0);
    rightEar.rotation.z = -0.65;
    catGroup.add(rightEar);

    // --- 4. Eyes (Flattened Spheres) ---
    const eyeWhiteGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const eyePupilGeo = new THREE.SphereGeometry(0.15, 32, 32);

    // Left Eye
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    leftEyeWhite.position.set(-0.4, 0.6, 0.1);
    leftEyeWhite.scale.z = 0.1;
    catGroup.add(leftEyeWhite);

    const leftEyePupil = new THREE.Mesh(eyePupilGeo, blackMat);
    leftEyePupil.position.set(-0.3, 0.6, 0.15); // Slightly offset
    leftEyePupil.scale.z = 0.1;
    catGroup.add(leftEyePupil);

    // Right Eye
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    rightEyeWhite.position.set(0.4, 0.6, 0.1);
    rightEyeWhite.scale.z = 0.1;
    catGroup.add(rightEyeWhite);

    const rightEyePupil = new THREE.Mesh(eyePupilGeo, blackMat);
    rightEyePupil.position.set(0.5, 0.6, 0.15); // Slightly offset
    rightEyePupil.scale.z = 0.1;
    catGroup.add(rightEyePupil);

    // --- 5. Mouth & Arms (Torus Segments) ---
    const lineGeo = new THREE.TorusGeometry(0.2, 0.02, 16, 100, Math.PI); // Half-circle
    const mouth = new THREE.Mesh(lineGeo, blackMat);
    mouth.position.set(0, 0.15, 0.1);
    mouth.rotation.z = Math.PI; // Flip to form a frown/mouth
    catGroup.add(mouth);

    function createUArm() {
        const armGroup = new THREE.Group();
        const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        // 1. The Bottom Curve (Semi-circle)
        // TorusGeometry(radius, tubeThickness, radialSegments, tubularSegments, arcLength)
        const arcGeo = new THREE.TorusGeometry(0.15, 0.02, 16, 100, Math.PI);
        const arc = new THREE.Mesh(arcGeo, blackMat);
        // Rotate so the "U" faces up in the XY plane
        arc.rotation.z = Math.PI; 
        armGroup.add(arc);

        // 2. The Straight Sides
        // CapsuleGeometry(radius, length, capSegments, radialSegments)
        const lineGeo = new THREE.CapsuleGeometry(0.02, 0.2, 4, 8);
        
        const leftLine = new THREE.Mesh(lineGeo, blackMat);
        leftLine.position.set(-0.15, 0.1, 0); // Align with left end of arc
        armGroup.add(leftLine);

        const rightLine = new THREE.Mesh(lineGeo, blackMat);
        rightLine.position.set(0.15, 0.1, 0); // Align with right end of arc
        armGroup.add(rightLine);

        return armGroup;
    }

    // Add the arms to your catGroup
    const leftArm = createUArm();
    leftArm.position.set(-0.4, -0.5, 0.15);
    leftArm.rotation.z = Math.PI / 8; // Slight tilt
    catGroup.add(leftArm);

    const rightArm = createUArm();
    rightArm.position.set(0.4, -0.5, 0.15);
    rightArm.rotation.z = -Math.PI / 8;
    catGroup.add(rightArm);

    // --- 6. Whiskers (3 on each side) ---
    function createWhiskers(isLeft) {
        const group = new THREE.Group();
        // Thin capsule (radius 0.01) creates a line effect with rounded ends
        const whiskerGeo = new THREE.CapsuleGeometry(0.01, 0.4, 4, 8);
        const sideFactor = isLeft ? -1 : 1;

        for (let i = 0; i < 3; i++) {
            const whisker = new THREE.Mesh(whiskerGeo, blackMat);
            
            // Rotation: PI/2 is horizontal. 
            // (i - 1) * 0.25 tilts the top one up, middle flat, and bottom down
            whisker.rotation.z = (Math.PI / 2) + (sideFactor * (i - 1) * 0.25);
            
            // Vertical spacing between whiskers
            whisker.position.y = (1 - i) * 0.12;
            
            // Offset the pivot so they grow outward from the face
            whisker.position.x = sideFactor * 0.2; 

            group.add(whisker);
        }
        return group;
    }

    // Position the whiskers on the cheeks
    const leftWhiskers = createWhiskers(true);
    leftWhiskers.position.set(0.65, 0.1, 0.1); 
    catGroup.add(leftWhiskers);

    const rightWhiskers = createWhiskers(false);
    rightWhiskers.position.set(-0.65, 0.1, 0.1); 
    catGroup.add(rightWhiskers);

    return catGroup;
}

// Add to scene
const myCat = createCat();
myCat.position.set(0, 3, 0);
scene.add(myCat);

// C. Vòng lặp hoạt họa (Animation Loop)

function animate(time) {
    // Chuyển đổi thời gian từ mili giây sang giây
    const t = time * 0.001;

    // Xoay hình hộp
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Xoay hình cầu quanh trục y
    sphere.rotation.y = t;

    // Khối đặc biệt xoay ngược lại
    specialCube.rotation.x = -t * 0.5;
    specialCube.rotation.y = -t * 0.5;

    // Xoay hình bánh xe quanh trục x
    torus.rotation.x = t;

    // Hiệu ứng tịnh tiến (Lên xuống) cho Cylinder
    cylinder.position.y = Math.sin(t * 2) * 0.5;

    // Render cảnh
    renderer.render(scene, camera);
}

// Bắt đầu vòng lặp
renderer.setAnimationLoop(animate);

// Responsive
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});