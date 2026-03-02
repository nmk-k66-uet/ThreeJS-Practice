import * as THREE from 'three';

// A. Khởi tạo scene cơ bản
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, // Field of view 
    window.innerWidth / window.innerHeight, // Aspect ratio 
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
camera.position.set(0, 1, 8); // Đặt camera ở vị trí (x, y, z)

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// B. Thử nghiệm với các khối nguyên thủy

// Mỗi khối sẽ được tạo với một hình học (geometry) và một vật liệu (material), sau đó kết hợp thành một mesh để thêm vào scene.

// 1. Hình lập phương
// BoxGeometry: (width, height, depth)

const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const cubeMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(cubeGeo, cubeMat);

// Inline construction
// const cube = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 1, 1),
//     new THREE.MeshBasicMaterial({color: 0x00ff00})
// )

cube.position.x = -6
scene.add(cube);

// 2. Hình cầu
// SphereGeometry: (radius, widthSegments, heightSegments)
// Segments càng cao thì hình cầu càng min, nhưng tốn tài nguyên xử lý
const sphereGeo = new THREE.SphereGeometry(0.7, 32, 32);
const sphereMat = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.position.x = -4
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
specialCube.position.x = -2;
scene.add(specialCube)

// 4. Hình trụ
// CylinderGeometry: (radiusTop, radiusBottom, height, radialSegments)
const cylinderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
const cylinderMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
cylinder.position.x = 0;
scene.add(cylinder);

// 5. Hình bánh xe
// TorusGeometry: (radius, tubeThickness, radialSegments, tubularSegments, arc)
// Tham số 'arc' quyết định cung tròn (ví dụ Math.PI là nửa vòng tròn)
const torusGeo = new THREE.TorusGeometry(0.5, 0.1, 16, 100, Math.PI);
const torusMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const torus = new THREE.Mesh(torusGeo, torusMat);
torus.position.x = 2;
scene.add(torus);

// 6. Hình nón
// ConeGeometry: (radius, height, radialSegments)
const coneGeo = new THREE.ConeGeometry(0.4, 0.8, 32);
const coneMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
const cone = new THREE.Mesh(coneGeo, coneMat);
cone.position.x = 4;
scene.add(cone);

// 7. CapsuleGeometry: (radius, length, capSegments, radialSegments)
const capsule = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.2, 1, 4, 8),
    new THREE.MeshBasicMaterial({ color: 0x888888 })
);
capsule.position.x = 6;
scene.add(capsule);

// 8. Mặt phẳng - Làm nền phía dưới
const planeGeo = new THREE.PlaneGeometry(12, 4);
const planeMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = Math.PI / 2; // Xoay ngang mặt phẳng
plane.position.y = -1.5;
scene.add(plane);

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

    // Xoay nón và capsule
    cone.rotation.x = t * 0.5;
    capsule.rotation.x = t * 0.5;

    // Render cảnh
    renderer.render(scene, camera);
}

// Bắt đầu vòng lặp
renderer.setAnimationLoop(animate);

// D. Grouping & Hierarchy - Tạo một con mèo đơn giản bằng cách kết hợp nhiều khối nguyên thủy

function createCat() {
    // Create a group for the cat
    const catGroup = new THREE.Group();

    // --- Materials ---
    const orangeMat = new THREE.MeshBasicMaterial({ color: 0xF4A460 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // --- 1. Body ---
    const bodyGeo = new THREE.CylinderGeometry(0.6, 1.2, 2.8, 32);
    const body = new THREE.Mesh(bodyGeo, orangeMat);
    body.scale.z = 0.1;
    catGroup.add(body);

    // --- 2. Tail ---
    const tailGeo = new THREE.CapsuleGeometry(0.3, 1.2, 16, 32);
    const tail = new THREE.Mesh(tailGeo, orangeMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(1.2, -1.1, 0);
    catGroup.add(tail);

    // --- 3. Ears ---
    const earGeo = new THREE.ConeGeometry(0.2, 0.3, 32);
    const leftEar = new THREE.Mesh(earGeo, orangeMat);
    leftEar.position.set(-0.7, 1.33, 0);
    leftEar.rotation.z = 0.9;
    catGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, orangeMat);
    rightEar.position.set(0.6, 1.4, 0);
    rightEar.rotation.z = -0.65;
    catGroup.add(rightEar);

    // --- 4. Eyes ---
    const eyeWhiteGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const eyePupilGeo = new THREE.SphereGeometry(0.15, 32, 32);

    // Left Eye
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    leftEyeWhite.position.set(-0.4, 0.6, 0.1);
    leftEyeWhite.scale.z = 0.1;
    catGroup.add(leftEyeWhite);

    const leftEyePupil = new THREE.Mesh(eyePupilGeo, blackMat);
    leftEyePupil.position.set(-0.3, 0.6, 0.15);
    leftEyePupil.scale.z = 0.1;
    catGroup.add(leftEyePupil);

    // Right Eye
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    rightEyeWhite.position.set(0.4, 0.6, 0.1);
    rightEyeWhite.scale.z = 0.1;
    catGroup.add(rightEyeWhite);

    const rightEyePupil = new THREE.Mesh(eyePupilGeo, blackMat);
    rightEyePupil.position.set(0.5, 0.6, 0.15);
    rightEyePupil.scale.z = 0.1;
    catGroup.add(rightEyePupil);

    // --- 5. Mouth & Arms ---
    const lineGeo = new THREE.TorusGeometry(0.2, 0.02, 16, 100, Math.PI);
    const mouth = new THREE.Mesh(lineGeo, blackMat);
    mouth.position.set(0, 0.15, 0.1);
    mouth.rotation.z = Math.PI;
    catGroup.add(mouth);

    function createUArm() {
        const armGroup = new THREE.Group();
        const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const arcGeo = new THREE.TorusGeometry(0.15, 0.02, 16, 100, Math.PI);
        const arc = new THREE.Mesh(arcGeo, blackMat);
        arc.rotation.z = Math.PI; 
        armGroup.add(arc);

        const lineGeo = new THREE.CapsuleGeometry(0.02, 0.2, 4, 8);
        
        const leftLine = new THREE.Mesh(lineGeo, blackMat);
        leftLine.position.set(-0.15, 0.1, 0);
        armGroup.add(leftLine);

        const rightLine = new THREE.Mesh(lineGeo, blackMat);
        rightLine.position.set(0.15, 0.1, 0);
        armGroup.add(rightLine);

        return armGroup;
    }

    const leftArm = createUArm();
    leftArm.position.set(-0.4, -0.5, 0.15);
    leftArm.rotation.z = Math.PI / 8;
    catGroup.add(leftArm);

    const rightArm = createUArm();
    rightArm.position.set(0.4, -0.5, 0.15);
    rightArm.rotation.z = -Math.PI / 8;
    catGroup.add(rightArm);

    // --- 6. Whiskers ---
    function createWhiskers(isLeft) {
        const group = new THREE.Group();
        const whiskerGeo = new THREE.CapsuleGeometry(0.01, 0.4, 4, 8);
        const sideFactor = isLeft ? -1 : 1;

        for (let i = 0; i < 3; i++) {
            const whisker = new THREE.Mesh(whiskerGeo, blackMat);
            
            whisker.rotation.z = (Math.PI / 2) + (sideFactor * (i - 1) * 0.25);
            
            whisker.position.y = (1 - i) * 0.12;
            
            whisker.position.x = sideFactor * 0.2; 

            group.add(whisker);
        }
        return group;
    }

    const leftWhiskers = createWhiskers(true);
    leftWhiskers.position.set(0.65, 0.1, 0.1); 
    catGroup.add(leftWhiskers);

    const rightWhiskers = createWhiskers(false);
    rightWhiskers.position.set(-0.65, 0.1, 0.1); 
    catGroup.add(rightWhiskers);

    return catGroup;
}

const myCat = createCat();
myCat.position.set(0, 3, 0);
scene.add(myCat);

// Responsive
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    if (window.innerWidth < window.innerHeight) {
        camera.fov = 90;
    } else {
        camera.fov = 75;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});