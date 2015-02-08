// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
// custom global variables
var cube;

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

    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
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
    //var light = new THREE.PointLight(0xffffff);
    //light.position.set(0,250,0);
    //scene.add(light);

    // SKYBOX/FOG
    var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
    var skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x9999ff, side: THREE.BackSide });
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    // scene.add(skyBox);
    scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);

    ////////////
    // CUSTOM //
    ////////////

    // must enable shadows on the renderer 
    renderer.shadowMapEnabled = true;

    // "shadow cameras" show the light source and direction

    // spotlight #1 -- yellow, dark shadow
    var spotlight = new THREE.SpotLight(0xffff00);
    spotlight.position.set(-60, 150, -30);
    //spotlight.shadowCameraVisible = true;
    spotlight.shadowDarkness = 0.95;
    spotlight.intensity = 2;
    // must enable shadow casting ability for the light
    spotlight.castShadow = true;
    scene.add(spotlight);

    // spotlight #2 -- red, light shadow
    var spotlight2 = new THREE.SpotLight(0xff0000);
    spotlight2.position.set(60, 150, -60);
    scene.add(spotlight2);
    //spotlight2.shadowCameraVisible = true;
    spotlight2.shadowDarkness = 0.70;
    spotlight2.intensity = 2;
    spotlight2.castShadow = true;

    // spotlight #3
    var spotlight3 = new THREE.SpotLight(0x0000ff);
    spotlight3.position.set(150, 80, -100);
    //spotlight3.shadowCameraVisible = true;
    spotlight3.shadowDarkness = 0.95;
    spotlight3.intensity = 2;
    spotlight3.castShadow = true;
    scene.add(spotlight3);
    // change the direction this spotlight is facing
    var lightTarget = new THREE.Object3D();
    lightTarget.position.set(150, 10, -100);
    scene.add(lightTarget);
    spotlight3.target = lightTarget;

    // cube: mesh to cast shadows
    var cubeGeometry = new THREE.CubeGeometry(50, 50, 50);
    var cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 50, 0);
    // Note that the mesh is flagged to cast shadows
    cube.castShadow = true;
    scene.add(cube);

    // floor: mesh to receive shadows
    var floorTexture = new THREE.ImageUtils.loadTexture('/App_Constructor/Assets/GridNormal.png');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 10);
    // Note the change to Lambert material.
    var floorMaterial = new THREE.MeshLambertMaterial({ map: floorTexture, side: THREE.DoubleSide });
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    // Note the mesh is flagged to receive shadows
    floor.receiveShadow = true;
    scene.add(floor);

    // create "light-ball" meshes
    var sphereGeometry = new THREE.SphereGeometry(10, 16, 8);
    var darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    var wireframeMaterial = new THREE.MeshBasicMaterial(
		{ color: 0xffff00, wireframe: true, transparent: true });
    var shape = THREE.SceneUtils.createMultiMaterialObject(
		sphereGeometry, [darkMaterial, wireframeMaterial]);
    shape.position = spotlight.position;
    scene.add(shape);

    var wireframeMaterial = new THREE.MeshBasicMaterial(
		{ color: 0xff0000, wireframe: true, transparent: true });
    var shape = THREE.SceneUtils.createMultiMaterialObject(
		sphereGeometry, [darkMaterial, wireframeMaterial]);
    shape.position = spotlight2.position;
    scene.add(shape);

    var wireframeMaterial = new THREE.MeshBasicMaterial(
		{ color: 0x0000ff, wireframe: true, transparent: true });
    var shape = THREE.SceneUtils.createMultiMaterialObject(
		sphereGeometry, [darkMaterial, wireframeMaterial]);
    shape.position = spotlight3.position;
    scene.add(shape);

}

function animate() {
    requestAnimationFrame(animate);
    render();
    update();
}

function update() {
    if (keyboard.pressed("z")) {
        // do something
    }

    controls.update();
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

function makeGrid(width, height, squaresOneSide, GridColor) {
    var squares = squaresOneSide;
    var geometry = new THREE.BufferGeometry();

    // атрибуты BufferGeometry
    var faces = [];
    var positions = new Float32Array(squares * squares * 2 * 3 * 3);
    var colors = new Float32Array(squares * squares * 2 * 3 * 3);

    // 1 segment                     // 2 segment
    var pA = new THREE.Vector3(); var pA2 = new THREE.Vector3();
    var pB = new THREE.Vector3(); var pB2 = new THREE.Vector3();
    var pC = new THREE.Vector3(); var pC2 = new THREE.Vector3();

    var cb = new THREE.Vector3(); var cb2 = new THREE.Vector3();
    var ab = new THREE.Vector3(); var ab2 = new THREE.Vector3();

    var Xdirection = width;
    var Zdirection = height;
    var startX = -(squares / 2 * width);  // координата верхнего левого угла По оси X
    var startY = -(squares / 2 * height); // координата верхнего левого угла По оси Y
    var normal = new THREE.Vector3(0, 0, 1); // построение по осям X,Y если сменять на X & Z, то нужно (0,1,0)
    var i = 0;

    //                  ____
    //  A°\          C °\   |° B
    //   | \             \  |
    //   |  \     +       \ | 
    //   |___\             \|
    //  B°   °C             ° A

    for (var currRow = 0; currRow < squares; currRow++) {
        for (var j = 0; j < squares; i += 18, j++) {

            // если поменять местами Az + Bz + Cz с Ay + By + Cy , то грид будет построен по осям X и Z
            // как было первоначально. Сменил построение с X&Z на оси X & Y и традицинный разворот Mesh.rotation.x = Math.PI
            // посмотрим как пойдет дальше, может первый вариант будет удобней...
            var ax = startX + Xdirection * j, az = 0, ay = startY + Zdirection * currRow;
            var ax2 = startX + Xdirection * (j + 1), az2 = 0, ay2 = startY + Zdirection * (currRow + 1);

            var bx = startX + Xdirection * j, bz = 0, by = startY + Zdirection * (currRow + 1);
            var bx2 = startX + Xdirection * (j + 1), bz2 = 0, by2 = startY + Zdirection * currRow;

            var cx = startX + Xdirection * (j + 1), cz = 0, cy = startY + Zdirection * (currRow + 1);
            var cx2 = startX + Xdirection * j, cz2 = 0, cy2 = startY + Zdirection * currRow;

            // 1 сегмент - треугольник      // 2 сегмент - треугольник
            positions[i] = ax; positions[i + 9] = ax2;
            positions[i + 1] = ay; positions[i + 10] = ay2;
            positions[i + 2] = az; positions[i + 11] = az2;

            positions[i + 3] = bx; positions[i + 12] = bx2;
            positions[i + 4] = by; positions[i + 13] = by2;
            positions[i + 5] = bz; positions[i + 14] = bz2;

            positions[i + 6] = cx; positions[i + 15] = cx2;
            positions[i + 7] = cy; positions[i + 16] = cy2;
            positions[i + 8] = cz; positions[i + 17] = cz2;

            // поверхности 
            var face1 = new THREE.Face3(pA, pB, pC);
            var face2 = new THREE.Face3(pA2, pB2, pC2);
            face1.normal.copy(normal);
            face2.normal.copy(normal);
            face1.vertexNormals.push(normal.clone(),
                normal.clone(),
                normal.clone());
            face2.vertexNormals.push(normal.clone(),
                normal.clone(),
                normal.clone());
            faces.push(face1, face2);

            // colors
            var color = GridColor;

            // 1 segment color          // 2 segment color
            colors[i] = color.r; colors[i + 9] = color.r;
            colors[i + 1] = color.g; colors[i + 10] = color.g;
            colors[i + 2] = color.b; colors[i + 11] = color.b;


            colors[i + 3] = color.r; colors[i + 12] = color.r;
            colors[i + 4] = color.g; colors[i + 13] = color.g;
            colors[i + 5] = color.b; colors[i + 14] = color.b;

            colors[i + 6] = color.r; colors[i + 15] = color.r;
            colors[i + 7] = color.g; colors[i + 16] = color.g;
            colors[i + 8] = color.b; colors[i + 17] = color.b;
        }
    }


    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('faces', new THREE.BufferAttribute(faces, 2));

    geometry.computeBoundingSphere();

    return geometry;
}