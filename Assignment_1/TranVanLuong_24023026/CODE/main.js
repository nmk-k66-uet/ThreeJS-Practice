import * as THREE from 'three';


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8; 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


function createCat() {
    const catGroup = new THREE.Group();
    const orangeMaterial = new THREE.MeshBasicMaterial({ color: 0x3a7bff });
    const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });


    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-2, -2);
    bodyShape.lineTo(2, -2);
    bodyShape.lineTo(5, -2);
    bodyShape.absarc(5, -1.5, 0.5, -Math.PI/2, Math.PI/2, false);
    bodyShape.lineTo(2, -1);
    bodyShape.lineTo(1.2, 2); 
    bodyShape.lineTo(-1.2, 2);
    bodyShape.lineTo(-2, -2);

    const bodyGeom = new THREE.ShapeGeometry(bodyShape);
    const body = new THREE.Mesh(bodyGeom, orangeMaterial);
    catGroup.add(body);


    const earShape = new THREE.Shape();
    earShape.moveTo(-0.4, 0);   
    earShape.lineTo(0, 0.8);    
    earShape.lineTo(0.4, 0);
    earShape.lineTo(-0.4, 0);

    const earGeom = new THREE.ShapeGeometry(earShape);
    
 
    const leftEar = new THREE.Mesh(earGeom, orangeMaterial);
    leftEar.position.set(-0.8, 2, -0.01);
    leftEar.rotation.z = 0; 
    catGroup.add(leftEar);


    const rightEar = new THREE.Mesh(earGeom, orangeMaterial);
    rightEar.position.set(0.8, 1.99, -0.01);
    rightEar.rotation.z = -0.;
    catGroup.add(rightEar);



    const eyeWhiteGeom = new THREE.CircleGeometry(0.45, 32);
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeom, whiteMaterial);
    leftEyeWhite.position.set(-0.6, 0.8, 0.1);
    catGroup.add(leftEyeWhite);

    const rightEyeWhite = leftEyeWhite.clone();
    rightEyeWhite.position.set(0.6, 0.8, 0.1);
    catGroup.add(rightEyeWhite);

    const pupilGeom = new THREE.CircleGeometry(0.15, 32);
    const leftPupil = new THREE.Mesh(pupilGeom, blackMaterial);
    leftPupil.position.set(-0.45, 0.85, 0.2);
    catGroup.add(leftPupil);

    const rightPupil = leftPupil.clone();
    rightPupil.position.set(0.75, 0.85, 0.2);
    catGroup.add(rightPupil);


    const noseGeom = new THREE.CircleGeometry(0.1, 32);
    const nose = new THREE.Mesh(noseGeom, blackMaterial);
    nose.position.set(0, 0.35, 0.1);
    catGroup.add(nose);



    const mouthCurve = new THREE.EllipseCurve(0, 0, 0.3, 0.2, Math.PI, 0, false);
    const mouthPoints = mouthCurve.getPoints(50);
    const mouthGeom = new THREE.BufferGeometry().setFromPoints(mouthPoints);
    const mouth = new THREE.Line(mouthGeom, lineMat);
    mouth.position.set(0, 0.2, 0.1);
    catGroup.add(mouth);


    const createWhisker = (x, y, rotation) => {
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.7, 0, 0)];
        const whiskerGeom = new THREE.BufferGeometry().setFromPoints(points);
        const whisker = new THREE.Line(whiskerGeom, lineMat);
        whisker.position.set(x, y, 0.1);
        whisker.rotation.z = rotation;
        return whisker;
    };

   
    catGroup.add(createWhisker(0.7, 0.3, 0.2));
    catGroup.add(createWhisker(0.7, 0.1, 0));
    catGroup.add(createWhisker(0.7, -0.1, -0.2));
    catGroup.add(createWhisker(-0.7, 0.3, Math.PI - 0.2));
    catGroup.add(createWhisker(-0.7, 0.1, Math.PI));
    catGroup.add(createWhisker(-0.7, -0.1, Math.PI + 0.2));


  
    const armCurve = new THREE.EllipseCurve(0, 0, 0.25, 0.35, Math.PI, 0, true);
    const armPoints = armCurve.getPoints(50);
    const armGeom = new THREE.BufferGeometry().setFromPoints(armPoints);
    
    const leftArm = new THREE.Line(armGeom, lineMat);
    leftArm.position.set(-0.8, -0.5, 0.1);
    catGroup.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.set(0.8, -0.5, 0.1);
    catGroup.add(rightArm);

    return catGroup;
}

const myCat = createCat();
scene.add(myCat);


const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();