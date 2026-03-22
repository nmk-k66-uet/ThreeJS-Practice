import * as THREE from "three";

// ===== SCENE =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// ===== CAMERA =====
const camera = new THREE.OrthographicCamera(-8,8,6,-6,0.1,100);
camera.position.z = 10;

// ===== RENDERER =====
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// ===== HÀM TẠO MÈO =====
function createCat(){

    const cat = new THREE.Group();
    const pink = 0xff99cc;

    // BODY
    const body = new THREE.Mesh(
        new THREE.CircleGeometry(3,40),
        new THREE.MeshBasicMaterial({color:pink})
    );
    body.position.y = -1;
    cat.add(body);

    // HEAD
    const head = new THREE.Mesh(
        new THREE.CircleGeometry(2.2,40),
        new THREE.MeshBasicMaterial({color:pink})
    );
    head.position.y = 2.5;
    cat.add(head);

    // EARS
    function ear(x){
        const shape = new THREE.Shape();
        shape.moveTo(0,0);
        shape.lineTo(1,2);
        shape.lineTo(2,0);
        shape.lineTo(0,0);

        const mesh = new THREE.Mesh(
            new THREE.ShapeGeometry(shape),
            new THREE.MeshBasicMaterial({color:pink})
        );
        mesh.position.set(x,4,0);
        return mesh;
    }
    cat.add(ear(-1.5));
    cat.add(ear(-0.2));

    // EYES
    function eye(x){
        const g = new THREE.Group();

        const white = new THREE.Mesh(
            new THREE.CircleGeometry(0.6,32),
            new THREE.MeshBasicMaterial({color:0xffffff})
        );

        const pupil = new THREE.Mesh(
            new THREE.CircleGeometry(0.25,32),
            new THREE.MeshBasicMaterial({color:0x000000})
        );
        pupil.position.x = 0.15;

        g.add(white);
        g.add(pupil);
        g.position.set(x,2.6,0);

        return g;
    }
    cat.add(eye(-0.8));
    cat.add(eye(0.8));

    // NOSE
    const nose = new THREE.Mesh(
        new THREE.CircleGeometry(0.25,32),
        new THREE.MeshBasicMaterial({color:0xff3366})
    );
    nose.position.set(0,2.2,0);
    cat.add(nose);

    // MOUTH
    const mouth = new THREE.Mesh(
        new THREE.TorusGeometry(0.5,0.05,16,50,Math.PI),
        new THREE.MeshBasicMaterial({color:0x000000})
    );
    mouth.rotation.z = Math.PI;
    mouth.position.set(0,1.9,0);
    cat.add(mouth);

    // WHISKERS
    function whisker(x,y){
        const w = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5,0.05),
            new THREE.MeshBasicMaterial({color:0x000000})
        );
        w.position.set(x,y,0);
        return w;
    }

    cat.add(whisker(-1.6,2.2));
    cat.add(whisker(-1.6,2.0));
    cat.add(whisker(-1.6,1.8));

    cat.add(whisker(1.6,2.2));
    cat.add(whisker(1.6,2.0));
    cat.add(whisker(1.6,1.8));

    // ARMS
    function arm(x){
        const arm = new THREE.Mesh(
            new THREE.CircleGeometry(0.8,32,0,Math.PI),
            new THREE.MeshBasicMaterial({color:pink})
        );
        arm.position.set(x,-0.5,0);
        return arm;
    }
    cat.add(arm(-2));
    cat.add(arm(2));

    // LEGS
    function leg(x){
        const leg = new THREE.Mesh(
            new THREE.CircleGeometry(0.9,32),
            new THREE.MeshBasicMaterial({color:pink})
        );
        leg.scale.y = 0.6;
        leg.position.set(x,-3,0);
        return leg;
    }
    cat.add(leg(-1));
    cat.add(leg(1));

    // TAIL
    const tail = new THREE.Mesh(
        new THREE.TorusGeometry(2,0.25,16,50,Math.PI*1.2),
        new THREE.MeshBasicMaterial({color:pink})
    );
    tail.position.set(3,-1,0);
    tail.rotation.z = -0.8;
    cat.add(tail);

    return cat;
}


// ===== GỌI HÀM =====
const cat = createCat();
scene.add(cat);


// ===== RENDER LOOP =====
renderer.setAnimationLoop(()=>{
    renderer.render(scene, camera);
});