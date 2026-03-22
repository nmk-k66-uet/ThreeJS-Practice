import * as THREE from 'three';
import { Wireframe } from 'three/examples/jsm/Addons.js';
import { color } from 'three/tsl';

const scene = new THREE.Scene();
scene.background= new THREE.Color(0xffffff)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

//dau
const headgeo= new THREE.SphereGeometry(3,100,100);
const headmat= new THREE.MeshBasicMaterial( {color: 0x000000 });
const head = new THREE.Mesh( headgeo , headmat );
scene.add(head);

//mat
const eyegeo = new THREE.SphereGeometry(1.8,100,100);
const eyemat= new THREE.MeshBasicMaterial({color:0x00ffff });
const eye2mat= new THREE.MeshBasicMaterial({color:0xffd700});

const eye1= new THREE.Mesh( eyegeo, eyemat);
eye1.position.x=0.68;
eye1.position.z=1.2;
scene.add(eye1);

const eye2= new THREE.Mesh( eyegeo, eye2mat);
eye2.position.x=-0.68;
eye2.position.z=1.2;
scene.add(eye2);

const ineyegeo = new THREE.SphereGeometry(1.615,100,100);
const ineyemat = new THREE.MeshBasicMaterial({color: 0x000000 });

const ineye1= new THREE.Mesh(ineyegeo, ineyemat);
ineye1.position.x=.76;
ineye1.position.z=1.4;
scene.add(ineye1);

const ineye2= new THREE.Mesh(ineyegeo, ineyemat);
ineye2.position.x=-.76;
ineye2.position.z=1.4;
scene.add(ineye2);

//tai
const eargeo = new THREE.ConeGeometry(1.2,2.5,100);
const earmat = new THREE.MeshBasicMaterial({color:0x000000});

const ear1 = new THREE.Mesh(eargeo,earmat);
ear1.position.y=3;
ear1.position.x=-2.3;
ear1.rotation.z= Math.PI / 6;
scene.add(ear1);

const ear2 = new THREE.Mesh(eargeo,earmat);
ear2.position.y=3;
ear2.position.x=2.3;
ear2.rotation.z= -Math.PI / 6;
scene.add(ear2);

const ineargeo = new THREE.ConeGeometry(1.1,2.2,100);
const inearmat = new THREE.MeshBasicMaterial({color:0x404040});

const inear1 = new THREE.Mesh(ineargeo,inearmat);
inear1.position.y=2.96;
inear1.position.x=-2.3;
inear1.position.z=.09;
inear1.rotation.z= Math.PI / 6;
scene.add(inear1);

const inear2 = new THREE.Mesh(ineargeo,inearmat);
inear2.position.y=2.96;
inear2.position.x=2.3;
inear2.position.z=.09;
inear2.rotation.z= -Math.PI / 6;
scene.add(inear2);

//body
const points = [];
for ( let i = 0; i < 10; ++ i ) {

	points.push( new THREE.Vector2( Math.sin( (9-i) * 0.2 ) * 1.5 + 1.5, ( i - 5 ) * .4 ) );

}
const bodygeo = new THREE.LatheGeometry(points, 1000, Math.PI*2, Math.PI*2);
const bodymat = new THREE.MeshBasicMaterial({color: 0x000000 });
const body = new THREE.Mesh(bodygeo,bodymat);
body.position.y=-4;
scene.add(body);

const bottomgeo = new THREE.CircleGeometry(2.96,100);
const bottommat = new THREE.MeshBasicMaterial({color: 0x000000});
const bottom = new THREE.Mesh(bottomgeo,bottommat);
bottom.rotation.x=Math.PI/2;
bottom.position.y=-5.95;
scene.add(bottom);

//rau
const raugeo= new THREE.CylinderGeometry(.05,.01,3,100);
const raumat= new THREE.MeshBasicMaterial({color:0x404040 });

const rau1 = new THREE.Mesh(raugeo,raumat);
rau1.position.set(3,-1.1,2);
rau1.rotation.z= Math.PI/1.7;
scene.add(rau1);

const rau2 = new THREE.Mesh(raugeo,raumat);
rau2.position.set(3,-1.5,2);
rau2.rotation.z= Math.PI/2;
scene.add(rau2);

const rau3 = new THREE.Mesh(raugeo,raumat);
rau3.position.set(3,-1.85,2);
rau3.rotation.z= Math.PI/2.3;
scene.add(rau3);

const rau4 = new THREE.Mesh(raugeo,raumat);
rau4.position.set(-3,-1.1,2);
rau4.rotation.z= -Math.PI/1.7;
scene.add(rau4);

const rau5 = new THREE.Mesh(raugeo,raumat);
rau5.position.set(-3,-1.5,2);
rau5.rotation.z= -Math.PI/2;
scene.add(rau5);

const rau6 = new THREE.Mesh(raugeo,raumat);
rau6.position.set(-3,-1.85,2);
rau6.rotation.z= -Math.PI/2.3;
scene.add(rau6);

//duoi
const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2,-5.5,0),
  new THREE.Vector3(-5,-4,0),
  new THREE.Vector3(-4.5,-1,-1),
  new THREE.Vector3(-5.5,0,0),
  new THREE.Vector3(-7,-1,0),
  new THREE.Vector3(-6,-2,0),
]);
const tailgeo = new THREE.TubeGeometry(path, 100,0.5,100);
const tailmat = new THREE.MeshBasicMaterial({color:0x000000 });
const tail = new THREE.Mesh(tailgeo,tailmat);
scene.add(tail);

const ftailgeo = new THREE.SphereGeometry(0.5,100,100);
const ftailmat = new THREE.MeshBasicMaterial({color: 0x000000});
const ftail = new THREE.Mesh(ftailgeo,ftailmat);
ftail.position.set(-6,-2,0);
scene.add(ftail);

//mieng
const mousegeo = new THREE.SphereGeometry(0.5,100,100);
const mousemat = new THREE.MeshBasicMaterial({color: 0x404040});

const mouse1 = new THREE.Mesh(mousegeo,mousemat);
mouse1.position.set(-0.25,-1.4,2.2);
scene.add(mouse1);


const mouse2 = new THREE.Mesh(mousegeo,mousemat);
mouse2.position.set(0.25,-1.4,2.2);
scene.add(mouse2);

const mouse3geo = new THREE.SphereGeometry(0.25,100,100);
const mouse3mat = new THREE.MeshBasicMaterial({color: 0x222222 });
const mouse3 = new THREE.Mesh(mouse3geo,mouse3mat);
mouse3.position.set(0,-1.76,2.2);
scene.add(mouse3);

const inmousgeo = new THREE.SphereGeometry(0.2,100,100);
const inmousmat = new THREE.MeshBasicMaterial({color:0xff6b81 });
const inmous = new THREE.Mesh(inmousgeo, inmousmat);
inmous.position.set(0,-1.76,2.3);
scene.add(inmous);

//chitruoc1
const path1 = new THREE.CatmullRomCurve3([
  new THREE.Vector3(1.5,-3.6,1),
  new THREE.Vector3(1.5,-5.95,3),
]);
const leg1geo = new THREE.TubeGeometry(path1, 100,0.5,100);
const leg1mat = new THREE.MeshBasicMaterial({color:0x000000});
const leg1 = new THREE.Mesh(leg1geo,leg1mat);
scene.add(leg1);

const fleg1geo = new THREE.SphereGeometry(0.5,100,100);
const fleg1 = new THREE.Mesh(fleg1geo,leg1mat);
fleg1.position.set(1.5,-5.95,3);
scene.add(fleg1);

const bleg1 = new THREE.Mesh(fleg1geo,leg1mat);
bleg1.position.set(1.5,-3.6,1);
scene.add(bleg1);

//chitruoc2
const path2 = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.5,-3.6,1),
  new THREE.Vector3(-1.5,-5.95,3),
]);
const leg2geo = new THREE.TubeGeometry(path2, 100,0.5,100);
const leg2mat = new THREE.MeshBasicMaterial({color:0x000000});
const leg2 = new THREE.Mesh(leg2geo,leg2mat);
scene.add(leg2);

const fleg2geo = new THREE.SphereGeometry(0.5,100,100);
const fleg2 = new THREE.Mesh(fleg2geo,leg2mat);
fleg2.position.set(-1.5,-5.95,3);
scene.add(fleg2);

const bleg2 = new THREE.Mesh(fleg2geo,leg2mat);
bleg2.position.set(-1.5,-3.6,1);
scene.add(bleg2);

//chisau1
const path3 = new THREE.CatmullRomCurve3([
  new THREE.Vector3(2.5,-5.45,0),
  new THREE.Vector3(3,-5.45,3),
]);
const leg3geo = new THREE.TubeGeometry(path3, 100,0.5,100);
const leg3mat = new THREE.MeshBasicMaterial({color:0x000000});
const leg3 = new THREE.Mesh(leg3geo,leg3mat);
scene.add(leg3);

const fleg3geo = new THREE.SphereGeometry(0.5,100,100);
const fleg3 = new THREE.Mesh(fleg3geo,leg3mat);
fleg3.position.set(3,-5.45,3);
scene.add(fleg3);

//chisau4
const path4 = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.5,-5.45,0),
  new THREE.Vector3(-3,-5.45,3),
]);
const leg4geo = new THREE.TubeGeometry(path4, 100,0.5,100);
const leg4mat = new THREE.MeshBasicMaterial({color:0x000000});
const leg4 = new THREE.Mesh(leg4geo,leg4mat);
scene.add(leg4);

const fleg4geo = new THREE.SphereGeometry(0.5,100,100);
const fleg4 = new THREE.Mesh(fleg4geo,leg4mat);
fleg4.position.set(-3,-5.45,3);
scene.add(fleg4);

camera.position.z = 14;
camera.position.y=-1;
camera.position.x=0;

function animate( time ) {
  scene.rotation.x=0;
  scene.rotation.y=time/500;
  renderer.render( scene, camera );
}