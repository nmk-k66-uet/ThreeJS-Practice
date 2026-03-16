import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    window.innerWidth / window.innerHeight,
);
camera.position.set(0, 1, 8);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function animate(time) {
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

function createCat() {
    // Create a group for the cat
    const catGroup = new THREE.Group();

    // --- Materials ---
    const orangeMat = new THREE.MeshBasicMaterial({ color: 0xF4A460 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // --- 1. Body ---
    // Your code for the body goes here
    // catGroup.add(body); # Uncomment this line after creating the body mesh

    // --- 2. Tail ---
    // Your code for the tail goes here
    // catGroup.add(tail); # Uncomment this line after creating the tail mesh

    // --- 3. Ears ---
    // Your code for the ears goes here
    // catGroup.add(leftEar); # Uncomment this line after creating the left ear mesh
    // catGroup.add(rightEar); # Uncomment this line after creating the right ear mesh

    // --- 4. Eyes ---
    //  Your code for the eyes goes here
    // You should create both the white and pupil meshes for each eye and add them to the catGroup
    // catGroup.add(leftEyeWhite);
    // catGroup.add(leftEyePupil);
    // catGroup.add(rightEyeWhite);
    // catGroup.add(rightEyePupil);

    // --- 5. Mouth & Arms ---
    // Your code for the mouth goes here
    // catGroup.add(mouth);

    // Create arms using a helper function to avoid code duplication
    function createArm() {
        const armGroup = new THREE.Group();
        const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        // Your code for the arm goes here

        return armGroup;
    }

    const leftArm = createArm();
    // Set the position and rotation for the left arm
    catGroup.add(leftArm);

    const rightArm = createArm();
    // Set the position and rotation for the right arm
    catGroup.add(rightArm);

    // --- 6. Whiskers ---
    // Create whiskers using a helper function to avoid code duplication
    function createWhiskers(isLeft) {
        const group = new THREE.Group();
        // Your code for the whiskers goes here
        return group;
    }

    const leftWhiskers = createWhiskers(true);
    // Set the position for the left whiskers
    catGroup.add(leftWhiskers);

    const rightWhiskers = createWhiskers(false);
    // Set the position for the right whiskers
    catGroup.add(rightWhiskers);

    return catGroup;
}

const myCat = createCat();
// Set the position for the entire cat group if needed
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