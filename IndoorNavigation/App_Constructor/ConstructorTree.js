
//////////
// MAIN //
/////////

// global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// mouse hovering
var projector, mouse = { x: 0, y: 0 }, INTERSECTED;

// initialization
Initialize();

// animation loop / game loop
animate();


function Initialize()
{
    scene = new THREE.Scene();

    ////////////
    // CAMERA //
    ////////////
    
    var Screen_Width = window.innerWidth, Screen_Height = window.innerHeight;
    var View_Angle = 45, Aspect = Screen_Width / Screen_Height, Near = 0.1, Far = 20000;
    camera = new THREE.PerspectiveCamera(View_Angle,Aspect,Near,Far);
    
    // add the camera to the scene
    scene.add(camera);

    // the camera defaults to position (0,0,0)
    // so pull it back (z = 400) and up (y = 100) and set the angle towards the scene origin
    camera.position.set(0, 150, 400);
    camera.lookAt(scene.position);


    //////////////
    // RENDERER //
    //////////////

    renderer = new THREE.WebGLRenderer({ antialias: true }); //Сглаживание включено 
    renderer.setSize(Screen_Width, Screen_Height);

    /// перемещаем canvas в body
    container = document.getElementById('WebGLContainer');
    container.appendChild(renderer.domElement);
    //scene.getCanvas().style.border = "1px solid black";

    ////////////
    // EVENTS //
    ////////////

    // automatically resize renderer
    THREEx.WindowResize(renderer, camera);
    // toggle full-screen on given key press
    THREEx.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) });

    //////////////
    // CONTROLS //
    //////////////

    // move mouse and: left   click to rotate, 
    //                 middle click to zoom, 
    //                 right  click to pan
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    

    ///////////
    // STATS //
    ///////////

    // displays current and past frames per second attained by scene
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);

    ///////////
    // LIGHT //
    ///////////

    // create a light
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0, 250, 0);
    scene.add(light);
    var ambientLight = new THREE.AmbientLight(0x111111);
    // scene.add(ambientLight);

    //////////////
    // GEOMETRY //
    //////////////

    // most objects displayed are a "mesh":
    //  a collection of points ("geometry") and
    //  a set of surface parameters ("material")	

    // Sphere parameters: radius, segments along width, segments along height
    var sphereGeometry = new THREE.SphereGeometry(50, 32, 16);
    // use a "lambert" material rather than "basic" for realistic lighting.
    //   (don't forget to add (at least one) light!)
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x8888ff });
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(100, 50, -50);
    scene.add(sphere);


    // create a set of coordinate axes to help orient user
    //    specify length in pixels in each direction
    var axes = new THREE.AxisHelper(100);
    scene.add(axes);

    ///////////
    // FLOOR //
    ///////////

    
    // DoubleSide: render texture on both sides of mesh  
    var floorGeometry = new THREE.PlaneGeometry(50, 50, 10, 10);
    var i = 0;
    var increment = 0;
    do {
        //для каждого объекта нужен новый материал, иначе выделение будет всех сразу, а не по отдельности
        var floorMaterial = new THREE.MeshBasicMaterial({
            map: NormalGridTexture,
            side: THREE.OneSide,
            vertexColors: THREE.VertexColors
            //wireframe: true, color: 0x00ee00
        });

        var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.name = "floor";
        floor.position.y = -0.5;
        floor.position.x = increment;

        increment += 50;
        i++;

        //переворот грида
        floor.rotation.x = Math.PI * 1.5;
        scene.add(floor);
    } while (i < 10)


    /////////
    // SKY //
    /////////

    // recommend either a skybox or fog effect (can't use both at the same time) 
    // without one of these, the scene's background color is determined by webpage background

    // make sure the camera's "far" value is large enough so that it will render the skyBox!
    var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
    // BackSide: render faces from inside of the cube, instead of from outside (default).
    var skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x9999ff, side: THREE.BackSide });
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    skyBox.name = "skybox";
    scene.add(skyBox);

    // fog must be added to scene before first render
    scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);

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
    //document.getElementById('InfoText').innerHTML = "x" + mouse.x + "y" + mouse.y;
}


function animate() {
    requestAnimationFrame(animate);
    render();
    update();
}

function update() {
    // delta = change in time since last call (in seconds)
    var delta = clock.getDelta();

    // functionality provided by THREEx.KeyboardState.js
    if (keyboard.pressed("1"))
        document.getElementById('InfoText').innerHTML = ' Have a nice day! - 1';
    if (keyboard.pressed("2"))
        document.getElementById('InfoText').innerHTML = ' Have a nice day! - 2 ';

    ObjectHover();
    controls.update();
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

// find intersections
function ObjectHover() {
 
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
            if (INTERSECTED) {
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
                //восстанавливаем первоначальную текстуру
                if (INTERSECTED.name == "floor") {
                    INTERSECTED.material.map = NormalGridTexture;
                }
                //if (INTERSECTED.name == "floor") {

                //    INTERSECTED.geometry.faces[15].color.setHex(0xffffff);
                //    INTERSECTED.geometry.colorsNeedUpdate = true;
                //}
            }
            // store reference to closest object as current intersection object
            INTERSECTED = intersects[0].object;

            

            // store color of closest object (for later restoration)
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            // set a new color for closest object
            if (INTERSECTED.name != "skybox" && INTERSECTED.name != "floor")
                INTERSECTED.material.color.setHex(0xffff00);
            if (INTERSECTED.name == "floor")
            {
                ///INTERSECTED.geometry.faces[15].color.setHex(0xffff00);
                //INTERSECTED.geometry.colorsNeedUpdate = true;
                INTERSECTED.material.map = HoveredGridTexture;
            }
                
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
}
