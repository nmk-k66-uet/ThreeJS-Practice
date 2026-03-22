import * as THREE from 'three';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000
);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 6;


// ===== GROUP CAT =====
const cat = new THREE.Group();
scene.add(cat);


// ===== BODY =====
const bodyGeo = new THREE.BoxGeometry(2.2, 2.8, 0.6);
const bodyMat = new THREE.MeshBasicMaterial({color:0xf2c38b});
const body = new THREE.Mesh(bodyGeo, bodyMat);

body.position.y = -0.2;

cat.add(body);


// ===== TAIL =====
const tailGeo = new THREE.CylinderGeometry(0.3,0.3,2.4,32);
const tail = new THREE.Mesh(tailGeo, bodyMat);

tail.rotation.z = Math.PI/2;
tail.position.set(2,-1.1,0);

cat.add(tail);


// ===== EARS =====
const earGeo = new THREE.ConeGeometry(0.35,0.7,4);

const ear1 = new THREE.Mesh(earGeo, bodyMat);
ear1.position.set(-0.7,1.7,0);
ear1.rotation.z = -0.3;

const ear2 = new THREE.Mesh(earGeo, bodyMat);
ear2.position.set(0.7,1.7,0);
ear2.rotation.z = 0.3;

cat.add(ear1);
cat.add(ear2);


// ===== EYES =====
const eyeGeo = new THREE.CircleGeometry(0.35,32);
const eyeMat = new THREE.MeshBasicMaterial({color:0xffffff});

const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
eye1.position.set(-0.6,0.7,0.31);

const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
eye2.position.set(0.6,0.7,0.31);

cat.add(eye1);
cat.add(eye2);


// ===== PUPILS =====
const pupilGeo = new THREE.CircleGeometry(0.15,32);
const pupilMat = new THREE.MeshBasicMaterial({color:0x000000});

const pupil1 = new THREE.Mesh(pupilGeo, pupilMat);
pupil1.position.set(-0.6,0.7,0.32);

const pupil2 = new THREE.Mesh(pupilGeo, pupilMat);
pupil2.position.set(0.6,0.7,0.32);

cat.add(pupil1);
cat.add(pupil2);


// ===== MOUTH =====
const mouthPoints = [
new THREE.Vector3(-0.15,0.2,0.35),
new THREE.Vector3(0,-0.05,0.35),
new THREE.Vector3(0.15,0.2,0.35)
];

const mouthGeo = new THREE.BufferGeometry().setFromPoints(mouthPoints);
const mouthMat = new THREE.LineBasicMaterial({color:0x000000});
const mouth = new THREE.Line(mouthGeo,mouthMat);

cat.add(mouth);


// ===== WHISKERS =====
function createWhisker(x,y){

const points = [
new THREE.Vector3(x,y,0.35),
new THREE.Vector3(x+(x>0?0.7:-0.7),y,0.35)
];

const geo = new THREE.BufferGeometry().setFromPoints(points);

return new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x000000}));

}

cat.add(createWhisker(-0.3,0.25));
cat.add(createWhisker(-0.3,0.1));
cat.add(createWhisker(0.3,0.25));
cat.add(createWhisker(0.3,0.1));


// ===== PAWS =====
function createPaw(x){

const points = [
new THREE.Vector3(x,-0.7,0.35),
new THREE.Vector3(x,-1.2,0.35)
];

const geo = new THREE.BufferGeometry().setFromPoints(points);

return new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x000000}));

}

cat.add(createPaw(-0.5));
cat.add(createPaw(0.5));


// ===== ANIMATE =====
function animate(){

requestAnimationFrame(animate);

// mèo lắc nhẹ
cat.rotation.y = Math.sin(Date.now()*0.001)*0.2;

// đuôi vẫy
tail.rotation.y = Math.sin(Date.now()*0.003)*0.5;

renderer.render(scene,camera);

}

animate();