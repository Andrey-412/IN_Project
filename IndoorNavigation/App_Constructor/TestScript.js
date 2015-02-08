﻿// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var cube;
var projector, mouse = { x: 0, y: 0 }, INTERSECTED;

init();
animate();

// FUNCTIONS 		
function init() {
    // SCENE
    scene = new THREE.Scene();
    // CAMERA
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0, 150, 400);
    camera.lookAt(scene.position);
    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    /// перемещаем canvas в body
    container = document.getElementById('WebGLContainer');
    container.appendChild(renderer.domElement);
    // EVENTS
    THREEx.WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) });
    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // STATS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);
    // LIGHT
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0, 250, 0);
    scene.add(light);
    // FLOOR
    var floorTexture = new THREE.ImageUtils.loadTexture('images/checkerboard.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 10);
    var floorMaterial = new THREE.MeshBasicMaterial({ color: 0x848184, side: THREE.DoubleSide });
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
    // SKYBOX/FOG
    var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
    var skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x9999ff, side: THREE.BackSide });
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    skyBox.name = "skybox";
    scene.add(skyBox);

    ////////////
    // CUSTOM //
    ////////////
    var cubeGeometry = new THREE.CubeGeometry(50, 50, 50);
    var cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000088 });
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 26, 0);
    scene.add(cube);

    // initialize object to perform world/screen calculations
    projector = new THREE.Projector();

    // when the mouse moves, call the given function
    document.addEventListener('mousemove', onDocumentMouseMove, false);

}

function onDocumentMouseMove(event) {
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();

    // update the mouse variable
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    render();
    update();
}

function update() {
    // find intersections

    // create a Ray with origin at the mouse position
    //   and direction into the scene (camera direction)
    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    projector.unprojectVector(vector, camera);
    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    // create an array containing all objects in the scene with which the ray intersects
    var intersects = ray.intersectObjects(scene.children);

    // INTERSECTED = the object in the scene currently closest to the camera 
    //		and intersected by the Ray projected from the mouse position 	

    // if there is one (or more) intersections
    if (intersects.length > 0) {
        // if the closest object intersected is not the currently stored intersection object
        if (intersects[0].object != INTERSECTED) {
            // restore previous intersection object (if it exists) to its original color
            if (INTERSECTED)
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
            // store reference to closest object as current intersection object
            INTERSECTED = intersects[0].object;
            // store color of closest object (for later restoration)
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            // set a new color for closest object
            if (INTERSECTED.name != "skybox")
            INTERSECTED.material.color.setHex(0xffff00);
        }
    }
    else // there are no intersections
    {
        // restore previous intersection object (if it exists) to its original color
        if (INTERSECTED)
            INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
        // remove previous intersection object reference
        //     by setting current intersection object to "nothing"
        INTERSECTED = null;
    }


    if (keyboard.pressed("z")) {
        // do something
    }

    controls.update();
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

//You need to look at PlaneGeometry.js and understand how the UVs are set. Then you will be able to figure out how to reset them. This should work -- there are two triangles per "face".

//for(var i = 0; i < geometry.faces.length / 2; i++) {

//    geometry.faceVertexUvs[ 0 ].push(
//    [
//        new THREE.Vector2( 0, 0 ),
//        new THREE.Vector2( 0, 1 ),
//        new THREE.Vector2( 1, 0 ),    
//    ] );

//    geometry.faces[ 2 * i ].materialIndex = i;

//    geometry.faceVertexUvs[ 0 ].push(
//    [
//        new THREE.Vector2( 0, 1 ),
//        new THREE.Vector2( 1, 1 ),
//        new THREE.Vector2( 1, 0 ),    
//    ] );

//    geometry.faces[ 2 * i + 1 ].materialIndex = i;

//    materials.push( createTexture( i ) );

//}    


/// выделение FACE у PlaneGeometry ... Лучше моего в том что texture + тени...
var floorMaterial = new THREE.MeshBasicMaterial({ map: NormalGridTexture, side: THREE.DoubleSide, vertexColors: THREE.FaceColors });
var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
for (var i = 0; i < floorGeometry.faces.length; i++) {
    face = floorGeometry.faces[i];
    face.color.setRGB(0, 0, 0.8 * Math.random() + 0.2);
}
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.set(0, 150, 0);
scene.add(floor);

function onDocumentMouseDown(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // find intersections

    // create a Ray with origin at the mouse position
    //   and direction into the scene (camera direction)
    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    projector.unprojectVector(vector, camera);
    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    // create an array containing all objects in the scene with which the ray intersects
    var intersects = ray.intersectObjects(scene.children);

    // if there is one (or more) intersections
    if (intersects.length > 0) {
        console.log("Hit @ " + toString(intersects[0].point));
        // change the color of the closest face.
        intersects[0].face.color.setRGB(0.8 * Math.random() + 0.2, 0, 0);
        intersects[0].object.geometry.colorsNeedUpdate = true;
    }
}