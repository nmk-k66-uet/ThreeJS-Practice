import * as THREE from "three";

const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(-6,6,6,-6,1,1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);


// materials
const bodyMat = new THREE.MeshBasicMaterial({color:0xf6b26b});
const white = new THREE.MeshBasicMaterial({color:0xffffff});
const blue = new THREE.MeshBasicMaterial({color:0x7fd6ff});
const black = new THREE.LineBasicMaterial({color:0x000000});


let tail;
let leftPupil,rightPupil;
let leftEye,rightEye;
let cat;


// mouse tracking
const mouse = {x:0,y:0};

window.addEventListener("mousemove",(e)=>{

mouse.x = (e.clientX/window.innerWidth)*2-1;
mouse.y = -(e.clientY/window.innerHeight)*2+1;

});


// create cat
function createCat(){

cat = new THREE.Group();


// BODY
const body = new THREE.Mesh(
new THREE.CircleGeometry(2.3,40),
bodyMat
);

body.scale.y = 1.2;

cat.add(body);


// EARS
function ear(x){

const shape = new THREE.Shape();

shape.moveTo(0,0);
shape.lineTo(0.7,1.2);
shape.lineTo(1.4,0);
shape.lineTo(0,0);

const ear = new THREE.Mesh(
new THREE.ShapeGeometry(shape),
bodyMat
);

ear.position.set(x,2.2,0);

return ear;

}

cat.add(ear(-1.4));
cat.add(ear(0));


// EYES
function eye(x){

const g = new THREE.Group();

const eyeball = new THREE.Mesh(
new THREE.CircleGeometry(0.55,32),
white
);

const iris = new THREE.Mesh(
new THREE.CircleGeometry(0.35,32),
blue
);

const pupil = new THREE.Mesh(
new THREE.CircleGeometry(0.15,32),
new THREE.MeshBasicMaterial({color:0x000000})
);

iris.position.z=0.01;
pupil.position.z=0.02;

g.add(eyeball);
g.add(iris);
g.add(pupil);

g.position.set(x,0.8,0);

if(x<0){
leftPupil = pupil;
leftEye = g;
}
else{
rightPupil = pupil;
rightEye = g;
}

return g;

}

cat.add(eye(-0.8));
cat.add(eye(0.8));


// MOUTH
const mouthShape = new THREE.Shape();

mouthShape.moveTo(-0.2,0);
mouthShape.quadraticCurveTo(0,-0.4,0.2,0);

const mouth = new THREE.Line(
new THREE.BufferGeometry().setFromPoints(
mouthShape.getPoints(20)
),
black
);

mouth.position.y = 0.1;

cat.add(mouth);


// WHISKERS
function whisker(x,y,dx){

const pts=[
new THREE.Vector3(x,y,0),
new THREE.Vector3(x+dx,y,0)
];

return new THREE.Line(
new THREE.BufferGeometry().setFromPoints(pts),
black
);

}

cat.add(whisker(-0.3,0.5,-1));
cat.add(whisker(-0.3,0.2,-1));
cat.add(whisker(-0.3,-0.1,-1));

cat.add(whisker(0.3,0.5,1));
cat.add(whisker(0.3,0.2,1));
cat.add(whisker(0.3,-0.1,1));


// LEGS
function leg(x){

const shape = new THREE.Shape();

shape.moveTo(0,0);
shape.quadraticCurveTo(0.2,-0.6,0.4,0);

const line = new THREE.Line(
new THREE.BufferGeometry().setFromPoints(shape.getPoints()),
black
);

line.position.set(x,-1.7,0);

return line;

}

cat.add(leg(-0.6));
cat.add(leg(0.2));


// TAIL
const curve = new THREE.CatmullRomCurve3([
new THREE.Vector3(2,-1.5,0),
new THREE.Vector3(3,-1,0),
new THREE.Vector3(2.6,1,0)
]);

tail = new THREE.Mesh(
new THREE.TubeGeometry(curve,20,0.25,8,false),
bodyMat
);

cat.add(tail);

return cat;

}

scene.add(createCat());


// animation
let t=0;

function animate(){

requestAnimationFrame(animate);

t += 0.05;


// tail wag
tail.rotation.z = Math.sin(t)*0.4;


// blink
const blink = Math.abs(Math.sin(t*0.5));

leftEye.scale.y = blink;
rightEye.scale.y = blink;


// idle bounce
cat.position.y = Math.sin(t)*0.15;


// eye tracking (with limit)
let px = mouse.x * 0.25;
let py = mouse.y * 0.15;

const limit = 0.18;

px = Math.max(-limit, Math.min(limit, px));
py = Math.max(-limit, Math.min(limit, py));

leftPupil.position.set(px,py,0.02);
rightPupil.position.set(px,py,0.02);


renderer.render(scene,camera);

}

animate();