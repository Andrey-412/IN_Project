/// глобальные переменные
var camera, scene, renderer;
var projector, raycaster, mouse;
var container, stats, cameraControl, keyboard = new THREEx.KeyboardState();
/// 1. начальный угол вращения , вычисляется от текущей позиции камеры
/// 2. фиксированный угол для вращения по оси Y и диагонали треугольника
/// 3. радиус вычисляется ( для вращения ) по принципу гипотенузы в треугольнике образованным координатами
var theta = 0, thetafixed, radius, isCtrlDown = false, isAltDown = false;
var initialX, initialZ,initialRadius,finalradius;

var GUI, GUIParams,
    SelectionTypes = { NONE: -1, Triangle: 0, Quad: 1, Point: 2, PointFree: 3}, // тип выделения
    currentSelectionType = SelectionTypes.Quad, // начальный тип выделения
    SelectionColor = new THREE.Color(0xff8800); // цвет выделения

/// текущий выделенный объект (floor)
var INTERSECTED;

/// Массив всех операций/заданий, которые будут в программе
var Tasks = { NONE: -1, GridPainting: 0, WallCreating: 1 };
/// предварительно выбранное задание, но оно не осуществляется
var currentSelectedTask = Tasks.NONE;
/// Текущее задание, которое осуществляется
var currentTask = Tasks.NONE;


/// глобальные Meshs
var GridFloor, // cам floor
    FloorSelectionLine, //линия выделения для floor
    gridXZ, //сетка floor
    GridPoint; // точка на floor (выделение)

/// СТЕНЫ
var GridPointLastPosition = new THREE.Vector3(); // используется при строительстве стен, чтобы не обновлять кучу раз, а лиш когда позиция изменилась
var WallNeedsUpdate = false; // используется чтобы не обновлять стену кучу раз, а лишь тогда когда позиция GridPoint внутри HighLight_PointOnIndices()
var firstWallPoint; // начальная точка - откуда строится стена , вторая варьируется мышью
var wallBuilded = false; // стена создана при нажатии кнопки( чтобы не создавать кучу дупликатов), теперь ее можно изменять
var wallAdded = false; //стена которая добавляется в общий buffergeometry, который был создан при вызове первой стены
var WallWidth = 4, WallHeight = 150, WallSegments = 5;


var selectionZ = -1, // поднятие выделения над floor
    gridXZHeight = 0.5; // поднятие сетки над floor
    
init_Main();
init_Events();
init_Geometry();
init_Helpers();
init_GUI();

animate();

function init_Main() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.set(0, 150, 400);
    //camera.lookAt(scene.position);
    //camera.rotation.order = 'YXZ';
       

    projector = new THREE.Projector();
    raycaster = new THREE.Raycaster();

    mouse = new THREE.Vector2();    

    ///********************
    /// RENDERER & CONTROLS
    ///********************

    renderer = new THREE.WebGLRenderer({ antialias: true }); //logarithmicDepthBuffer: true
    renderer.setSize(window.innerWidth, window.innerHeight);

    cameraControl = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControl.userPanSpeed = 7.0;
    cameraControl.minDistance = 100;
    cameraControl.maxDistance = 800;

    container = document.getElementById('WebGLContainer');
    container.appendChild(renderer.domElement); 

    /// LIGHT
    scene.add(new THREE.AmbientLight(0x727272));
}
function init_Events()
{
    ////////////
    // EVENTS //
    ////////////

    THREEx.WindowResize(renderer, camera); // automatically resize renderer   
    THREEx.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) }); // toggle full-screen on given key press

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);

}
function init_Geometry()
{
    /// SKYBOX
    var skyBoxGeometry = new THREE.CubeGeometry(20000, 20000, 20000);
    // BackSide: render faces from inside of the cube, instead of from outside (default).
    var skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x9999ff, side: THREE.BackSide });
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    skyBox.name = "skybox";
    scene.add(skyBox);

    /// FLOOR
    var material = new THREE.MeshPhongMaterial(
        {
            side: THREE.OneSide, vertexColors: THREE.VertexColors
        });
    GridFloor = new THREE.Mesh(makeFloor(50, 50, 50, new THREE.Color(0xd5d5d5)), material);
    GridFloor.rotation.x = Math.PI / 2;
    //GridFloor.geometry.dynamic = true;
    //GridFloor.geometry.__dirtyColors = true;
    //GridFloor.receiveShadow = true;
    scene.add(GridFloor);


    /// FloorSelectionLine
    var geometry = new THREE.BufferGeometry();

    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(5 * 3), 3));
    var material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true });
    FloorSelectionLine = new THREE.Line(geometry, material);
    scene.add(FloorSelectionLine);

    /// Point
    var material = new THREE.MeshBasicMaterial({
        color: 0x0000ff
    });
    var circleGeometry = new THREE.CircleGeometry(5, 8);
    GridPoint = new THREE.Mesh(circleGeometry, material);
    GridPoint.rotation.x = -Math.PI / 2;
    scene.add(GridPoint);    
}
function init_GUI()
{
    GUI = new dat.GUI();
    GUIParams = {
        GridSelectionType: "Quad",
        GridSelectionColor: "#ff8800",
        GridVisible: true,
        Painting: false,
        Building: false,
        wallWidth: 4, wallHeight: 150, wallSegments: 5
    };

    var folder = GUI.addFolder('Стены');
    var wallWidth = folder.add(GUIParams, 'wallWidth').min(2).max(50).step(2).listen(); wallWidth.onChange(function (value)
    { WallWidth = value; });
    var wallHeight = folder.add(GUIParams, 'wallHeight').min(50).max(250).step(50).listen(); wallHeight.onChange(function (value)
    { WallHeight = value; });
    var wallSegments = folder.add(GUIParams, 'wallSegments').min(5).max(10).step(5).listen(); wallSegments.onChange(function (value)
    { WallSegments = value; });
    

    var selectionTypeList = GUI.add(GUIParams, 'GridSelectionType', ["None", "Triangle", "Quad", "Point", "PointFree"]).name('Тип выделения').listen();
    selectionTypeList.onChange(function (value)
    {
        switch(value)
        {
            case "None": currentSelectionType = SelectionTypes.NONE; break;
            case "Triangle": currentSelectionType = SelectionTypes.Triangle; break;
            case "Quad": currentSelectionType = SelectionTypes.Quad; break;
            case "Point": currentSelectionType = SelectionTypes.Point; break;
            case "PointFree": currentSelectionType = SelectionTypes.PointFree; break;
        }
    });

    var selectionColor = GUI.addColor(GUIParams, 'GridSelectionColor').name('Цвет выделения').listen();
    selectionColor.onChange(function (value)
    { SelectionColor = new THREE.Color(value); });

    var gridVisible = GUI.add(GUIParams, 'GridVisible').name('Сетка').listen();
    gridVisible.onChange(function (value)
    { gridXZ.visible = value; });

    var gridPainting = GUI.add(GUIParams, 'Painting').name('Красить').listen();
    gridPainting.onChange(function (value)
    {
        if (value == true) { currentSelectedTask = Tasks.GridPainting; GUIParams.Building = false; }
        else 
            if (GUIParams.Building == true) currentSelectedTask = Tasks.WallCreating;
            else currentSelectedTask = Tasks.NONE;
    });

    var WallsBuilding = GUI.add(GUIParams, 'Building').name('Cтроить').listen();
    WallsBuilding.onChange(function (value)
    {
        if (value == true) { currentSelectedTask = Tasks.WallCreating; GUIParams.Painting = false; }
        else
            if (GUIParams.Painting == true) currentSelectedTask = Tasks.GridPainting;
            else currentSelectedTask = Tasks.NONE;
        
    });


    GUI.open();
    GUI.domElement.style.zIndex = 100;
}
function init_Helpers()
{
    /// FPS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    container.appendChild(stats.domElement);

    // X,Y,Z  world axes
    var axes = new THREE.AxisHelper(100);
    scene.add(axes);

    /// линии мерцали т.к. происходило наложение на поверхность, стоит поднять по высоте(y) на 0.1 и все ок.
    gridXZ = new THREE.GridHelper(1250, 50);
    gridXZ.setColors(new THREE.Color(0x006600), new THREE.Color(0x006600));
    gridXZ.position.set(0, gridXZHeight, 0);
    scene.add(gridXZ);
}


function animate() {

    requestAnimationFrame(animate);

    render();
    update();

    stats.update();
}
function render() {
    renderer.render(scene, camera);
}
function update() {
    //var time = Date.now() * 0.001;

    //GridFloor.rotation.x = time * 0.15;
    //GridFloor.rotation.y = time * 0.25;

    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    projector.unprojectVector(vector, camera);
    raycaster.set(camera.position, vector.sub(camera.position).normalize());

    IsGridFloorHovered(raycaster);

    IsKeyboardPressed();

    cameraControl.update();
}


function onDocumentMouseMove(event) {

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    switch (currentTask)
    {
        case Tasks.GridPainting: paintGrid(); break;
        case Tasks.WallCreating: updateWall(); break;
    }
    
}
function onDocumentMouseDown(event)
{
    if (event.target.localName != "canvas") return;
    switch (event.which) {
        case 1: currentTask = currentSelectedTask; break;
        case 2: 
            //Middle Mouse button pressed.
            break;
        case 3: //SetPoint(GridPoint.position.x, GridPoint.position.z);
            //Right Mouse button pressed.
            break;
        default:
            //You have a strange Mouse!
    }

    /// Выполнить действие единожды (по простому клику)
    /// Например без этого не работает выделение по единждопу клику, без зажатия клавишы.
    switch(currentTask)
    {
        case Tasks.GridPainting: paintGrid(); break;
        case Tasks.WallCreating: updateWall(); break;
    }
}
function onDocumentMouseUp(event)
{
    switch (currentTask) {

        case Tasks.WallCreating: wallAdded = false; checkWallNotNull(); break;
    }
    
    currentTask = Tasks.NONE;
    //wallBuilded = false;
}


var rotateTriangle = false;
function paintGrid() {
    /// подсвечен элемент, можно красить
    if (FloorSelectionLine.visible) {
        /// треугольная кисть
        if ( currentSelectionType == SelectionTypes.Triangle) {
            var colors = GridFloor.geometry.attributes.color.array;
            for (var i = 0; i < 4; i++) {

                var index = INTERSECTED.indices[i % 3] * 3;

                colors[index] = SelectionColor.r;
                colors[index + 1] = SelectionColor.g;
                colors[index + 2] = SelectionColor.b;
            }
        }

        /// квадратная кисть
        if ( currentSelectionType == SelectionTypes.Quad) {
            var colors = GridFloor.geometry.attributes.color.array;
            var positions = GridFloor.geometry.attributes.position.array;

            if (positions[INTERSECTED.indices[0] * 3] < positions[(INTERSECTED.indices[0] + 4) * 3]
            && positions[INTERSECTED.indices[1] * 3] == positions[(INTERSECTED.indices[0] + 5) * 3]) {
                for (var i = 0; i < 6; i++) {

                    var index = INTERSECTED.indices[i % 3] * 3;
                    if (i == 3) index = (INTERSECTED.indices[0] + 3) * 3;
                    if (i == 4) index = (INTERSECTED.indices[0] + 4) * 3;
                    if (i == 5) index = (INTERSECTED.indices[0] + 5) * 3;

                    colors[index] = SelectionColor.r;
                    colors[index + 1] = SelectionColor.g;
                    colors[index + 2] = SelectionColor.b;
                }

            } else {
                for (var i = 0; i < 6; i++) {

                    var index = INTERSECTED.indices[i % 3] * 3;
                    if (i == 3) index = (INTERSECTED.indices[0] - 3) * 3;
                    if (i == 4) index = (INTERSECTED.indices[0] - 2) * 3;
                    if (i == 5) index = (INTERSECTED.indices[0] - 1) * 3;

                    colors[index] = SelectionColor.r;
                    colors[index + 1] = SelectionColor.g;
                    colors[index + 2] = SelectionColor.b;
                }
            }
        }

        GridFloor.geometry.attributes.color.needsUpdate = true;
    }
}

function IsGridFloorHovered(raycaster) {

    var intersects = raycaster.intersectObject(GridFloor);

    if (intersects.length > 0) {

        var intersect = intersects[0];

        INTERSECTED = intersects[0]; // запоминаем глобально чтобы взаимодействовать по клику

        var object = intersect.object;

        var positions = object.geometry.attributes.position.array;

        switch(currentSelectionType)
        {           
            case SelectionTypes.Triangle: Highlight_Triangle(intersect, positions); SelectionLineUpdate(); break;
            case SelectionTypes.Quad: Highlight_Quad(intersect, positions); SelectionLineUpdate(); break;
            case SelectionTypes.Point: HighLight_PointOnIndices(intersect, positions); FloorSelectionLine.visible = false; break;
            case SelectionTypes.PointFree: HighLight_PointFree(intersect, positions); FloorSelectionLine.visible = false; break;
        }        

    } else {

        FloorSelectionLine.visible = false;
        GridPoint.visible = false;
    }

}

function Highlight_Triangle(intersect, positions)
{
    var array = FloorSelectionLine.geometry.attributes.position.array;
    if (rotateTriangle == false) {
        for (var i = 0, j = 0; i < 4; i++, j += 3) {
            var index = intersect.indices[i % 3] * 3;

            array[j] = positions[index];
            array[j + 1] = positions[index + 1];
            array[j + 2] = positions[index + 2] + selectionZ;
        }
    }
    else {
        /// определяем какой выбран треугольник , левый или правый
        if (positions[intersect.indices[0] * 3] < positions[(intersect.indices[0] + 4) * 3]
                && positions[intersect.indices[1] * 3] == positions[(intersect.indices[0] + 5) * 3]) {
            for (var i = 0, j = 0; i < 4; i++, j += 3) {
                var index = intersect.indices[i % 3] * 3;

                if (i == 2) index = (intersect.indices[0] + 4) * 3;

                array[j] = positions[index];
                array[j + 1] = positions[index + 1];
                array[j + 2] = positions[index + 2] + selectionZ;
            }

        } else {
            for (var i = 0, j = 0; i < 4; i++, j += 3) {
                var index = intersect.indices[i - 1 % 3] * 3;

                if (i == 0 || i == 3) index = (intersect.indices[0] - 2) * 3;
                array[j] = positions[index];
                array[j + 1] = positions[index + 1];
                array[j + 2] = positions[index + 2] + selectionZ;
            }
        }
    }
    //замыкаем линию в начальной точке, если этого не сделать то появится дополнительная линия
    array[12] = array[0];
    array[13] = array[1];
    array[14] = array[2];

}
function Highlight_Quad(intersect, positions)
{
    var array = FloorSelectionLine.geometry.attributes.position.array;
    /// определяем какой выбран треугольник , левый или правый
    if (positions[intersect.indices[0] * 3] < positions[(intersect.indices[0] + 4) * 3]
            && positions[intersect.indices[1] * 3] == positions[(intersect.indices[0] + 5) * 3]) {
        for (var i = 0, j = 0; i < 5; i++, j += 3) {

            var index = intersect.indices[i % 3] * 3;
            if (i == 3) index = (intersect.indices[0] + 4) * 3; // перешагиваем через 1 координату равную конечной в первом треугольнике
            if (i == 4) index = intersect.indices[0] * 3; // берем координаты 1ой вершины 1ого треугольника, т.к. они равны с последними координатами 2ого

            array[j] = positions[index];
            array[j + 1] = positions[index + 1];
            array[j + 2] = positions[index + 2] + selectionZ;
        }

    } else {
        for (var i = 0, j = 0; i < 5; i++, j += 3) {

            var index = intersect.indices[i % 3] * 3;
            if (i == 3) index = (intersect.indices[0] - 2) * 3;
            if (i == 4) index = intersect.indices[0] * 3;

            array[j] = positions[index];
            array[j + 1] = positions[index + 1];
            array[j + 2] = positions[index + 2] + selectionZ;
        }
    }
}
function SelectionLineUpdate()
{
    //All objects by default automatically update their matrices.
    //However, if you know object will be static, you can disable this and update transform matrix manually just when needed.
    //object.matrixAutoUpdate = false;
    //GridFloor.updateMatrix();

    /// под вопросом, но вроде как используется для того чтобы задать нужную координатную систему, 
    /// для объектов повернутых на разные углы
    FloorSelectionLine.geometry.applyMatrix(GridFloor.matrix);

    FloorSelectionLine.visible = true;
}
function HighLight_PointFree(intersect, positions) {

    var distance, finaldistance, closest_indice;
    var point = new THREE.Vector3(intersect.point.x, intersect.point.z, 0);
    for (var i = 0, j = 0; i < 4; i++, j += 3) {

        var index = intersect.indices[i % 3] * 3;

        var cornerPoint = new THREE.Vector3(positions[index], positions[index + 1], positions[index + 2]);
        distance = cornerPoint.distanceTo(point);
        if (i == 0) { finaldistance = distance; closest_indice = index; }
        if (distance < finaldistance) { finaldistance = distance; closest_indice = index; }
    }

    var side1 = positions[closest_indice] - point.x;
    var side2 = positions[closest_indice + 1] - point.y;
    var side1abs = Math.abs(side1);
    var side2abs = Math.abs(side2);
    if (side1abs > side2abs) GridPoint.position.set(positions[closest_indice] - side1, 1, positions[closest_indice + 1]);
    else GridPoint.position.set(positions[closest_indice], 1, positions[closest_indice + 1] - side2 );

    GridPoint.visible = true;

    if (GridPointLastPosition.distanceTo(GridPoint.position) > 0) {
        WallNeedsUpdate = true;
        GridPointLastPosition.copy(GridPoint.position);
    }
    //document.getElementById('InfoText').innerHTML = 'x' + (positions[closest_indice] - side1) + "<br />" +
    //'z' + (positions[closest_indice + 1]) + "<br />" + 
    //'x' + (positions[closest_indice]) + "<br />" +
    //'z' + (positions[closest_indice + 1] - side2) + "<br />";

}
function HighLight_PointOnIndices(intersect, positions)
{
    var distance, finaldistance, closest_indice;
    var point = new THREE.Vector3(intersect.point.x, intersect.point.z, 0);
    for (var i = 0, j = 0; i < 4; i++, j += 3) {

        var index = intersect.indices[i % 3] * 3;

        var cornerPoint = new THREE.Vector3(positions[index], positions[index + 1], positions[index + 2]);
        distance = cornerPoint.distanceTo(point);
        if (i == 0) { finaldistance = distance; closest_indice = index; }
        if (distance < finaldistance) { finaldistance = distance; closest_indice = index; }
    }
    GridPoint.position.set(positions[closest_indice], 1, positions[closest_indice + 1]);
    GridPoint.visible = true;

    if(GridPointLastPosition.distanceTo(GridPoint.position) > 0)
    {
        WallNeedsUpdate = true;
        GridPointLastPosition.copy(GridPoint.position);
    }
}


function makeFloor(width, height, squaresOneSide, GridColor)
{
    var squares = squaresOneSide;
    var geometry = new THREE.BufferGeometry();

    // атрибуты BufferGeometry
    var faces = [];
    var positions = new Float32Array(squares * squares * 2 * 3 * 3);
    var colors = new Float32Array(squares * squares * 2 * 3 * 3);
    var uvs = [];

    // 1 segment                     // 2 segment
    var pA = new THREE.Vector3();   var pA2 = new THREE.Vector3();
    var pB = new THREE.Vector3();   var pB2 = new THREE.Vector3();
    var pC = new THREE.Vector3();   var pC2 = new THREE.Vector3();

    var cb = new THREE.Vector3();   var cb2 = new THREE.Vector3();
    var ab = new THREE.Vector3();   var ab2 = new THREE.Vector3();

    var Xdirection = width;
    var Zdirection = height;
    var startX = -(squares / 2 * width);  // координата верхнего левого угла(A) По оси X
    var startY = -(squares / 2 * height); // координата верхнего левого угла(A) По оси Y
    var normal = new THREE.Vector3(0, 0, 1); // построение по осям X,Y если сменять на X & Z, то нужно (0,1,0)
    var i = 0;

    //                  ____
    //  A°\          C °\   |° B
    //   | \             \  |
    //   |  \     +       \ | 
    //   |___\             \|
    //  B°   °C             ° A

    for (var currRow = 0; currRow < squares; currRow++)
    {      
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
            positions[i] = ax;              positions[i + 9] = ax2;
            positions[i + 1] = ay;          positions[i + 10] = ay2;
            positions[i + 2] = az;          positions[i + 11] = az2;

            positions[i + 3] = bx;          positions[i + 12] = bx2;
            positions[i + 4] = by;          positions[i + 13] = by2;
            positions[i + 5] = bz;          positions[i + 14] = bz2;

            positions[i + 6] = cx;          positions[i + 15] = cx2;
            positions[i + 7] = cy;          positions[i + 16] = cy2;
            positions[i + 8] = cz;          positions[i + 17] = cz2;

            pA.set(ax, ay, az);             pA2.set(ax2, ay2, az2);
            pB.set(bx, by, bz);             pB2.set(bx2, by2, bz2);
            pC.set(cx, cy, cz);             pC2.set(cx2, cy2, cz2);

            // поверхности 
            var face1 = new THREE.Face3(pA, pB, pC);
            var face2 = new THREE.Face3(pA2, pB2, pC2);
            face1.normal.copy(normal);
            face2.normal.copy(normal);
            face1.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
            face2.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
            faces.push(face1, face2);

            // colors
            var color = GridColor;
            //if (j%2==0) color = newColor;

            // 1 segment color          // 2 segment color
            colors[i] = color.r;        colors[i + 9] = color.r;
            colors[i + 1] = color.g;    colors[i + 10] = color.g;
            colors[i + 2] = color.b;    colors[i + 11] = color.b;

            colors[i + 3] = color.r;    colors[i + 12] = color.r;
            colors[i + 4] = color.g;    colors[i + 13] = color.g;
            colors[i + 5] = color.b;    colors[i + 14] = color.b;

            colors[i + 6] = color.r;    colors[i + 15] = color.r;
            colors[i + 7] = color.g;    colors[i + 16] = color.g;
            colors[i + 8] = color.b;    colors[i + 17] = color.b;

            var uva = new THREE.Vector2(j / width, 1 - currRow / height);
            var uvb = new THREE.Vector2(j / width, 1 - (currRow + 1) / height);
            var uvc = new THREE.Vector2((j + 1) / width, 1 - (currRow + 1) / height);
            var uvd = new THREE.Vector2((j + 1) / width, 1 - currRow / height);
            
            uvs.push([uva, uvb, uvd]);
            uvs.push([uvb.clone(), uvc, uvd.clone()]);
        }
    }


    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('faces', new THREE.BufferAttribute(faces, 2));
    geometry.addAttribute('uvs', new THREE.BufferAttribute(uvs, 2));

    //geometry.vertexPositionBuffer = positions;
    //geometry.vertexColorBuffer = colors;
    //geometry.vertexUvBuffer = uvs;
    //geometry.vertexUvBuffer
    //geometry.vertexNormalBuffer

    geometry.computeBoundingSphere();

    return geometry;
}

var Wall;

function makeWall(height, width, segments, startPoint, endPoint, wallColor, bottomColor)
{
    var material = new THREE.MeshPhongMaterial({
            side: THREE.OneSide, vertexColors: THREE.VertexColors
        });
    var WallGeometry = new THREE.BufferGeometry();    
    
    var segmentHeight = height / segments;
    
    /// направление вектора
    var direction = new THREE.Vector3();
    direction.subVectors(startPoint, endPoint);

    /// векторы перпендикулярные направлению
    var leftVector = new THREE.Vector3();
    var rightVector = new THREE.Vector3();
    leftVector.crossVectors(direction, new THREE.Vector3(startPoint.x, 1, startPoint.z));
    rightVector.crossVectors(new THREE.Vector3(startPoint.x, 1, startPoint.z), direction);

    /// cross- product задает вектор высотой в 10000, что ломает координаты при нормализации => 
    /// нельзя умножить единичный вектор на радиус и получить точки отступа. зададим y = -1 , чтобы все было ок
    leftVector.y = -1;
    rightVector.y = -1;

    leftVector.normalize(); 
    rightVector.normalize();

    /// без округления будет более точнее...Пока оставим так
    var leftScalar = new THREE.Vector3().copy(leftVector).multiplyScalar(width / 2);//.round();
    var rightScalar = new THREE.Vector3().copy(rightVector).multiplyScalar(width / 2);//.round();

    var startPointLeftcorner = new THREE.Vector3();
    var startPointRightcorner = new THREE.Vector3();
    startPointLeftcorner.add(startPoint, leftScalar);
    startPointRightcorner.add(startPoint, rightScalar);

    var endPointLeftcorner = new THREE.Vector3();
    var endPointRightcorner = new THREE.Vector3();
    endPointLeftcorner.add(endPoint, leftScalar);
    endPointRightcorner.add(endPoint, rightScalar);

  
    ///  поверхности верхняя + днище + сегментов на 4 стороны
    var positions = new Float32Array(1000000);//new Float32Array(36 + segments * 4 * 2 * 3 * 3); // 
    var colors = new Float32Array(1000000);//new Float32Array(36 + segments * 4 * 2 * 3 * 3);
    var normals = new Float32Array(1000000);//new Float32Array(36 + segments * 4 * 2 * 3 * 3);
    var wallsNum = new Float32Array(1); wallsNum[0] = 1;
    var StartEndPoints = new Float32Array(100000);


    // 1 треугольник                // 2 треугольник
    var pA = new THREE.Vector3();   var pA2 = new THREE.Vector3();
    var pB = new THREE.Vector3();   var pB2 = new THREE.Vector3();
    var pC = new THREE.Vector3();   var pC2 = new THREE.Vector3();

    var cb = new THREE.Vector3();   var cb2 = new THREE.Vector3();
    var ab = new THREE.Vector3();   var ab2 = new THREE.Vector3();

    var i = 0;
    var pointsArray = [startPointLeftcorner, startPointRightcorner, endPointRightcorner, endPointLeftcorner, startPointLeftcorner];

    // сегменты
    for ( var row = 0; row < segments; row++ )
    {
        // 4 стороны
        for( var j = 0; j < 4; j++ , i+= 18 )
        {
            var ax = pointsArray[j].x, az = pointsArray[j].z, ay = segmentHeight * (row + 1);
            var ax2 = pointsArray[j + 1].x, az2 = pointsArray[j + 1].z, ay2 = segmentHeight * row;

            var bx = pointsArray[j].x, bz = pointsArray[j].z, by = segmentHeight * row;
            var bx2 = pointsArray[j + 1].x, bz2 = pointsArray[j + 1].z, by2 = segmentHeight * (row + 1);

            var cx = pointsArray[j + 1].x, cz = pointsArray[j + 1].z, cy = segmentHeight * row;
            var cx2 = pointsArray[j].x, cz2 = pointsArray[j].z, cy2 = segmentHeight * (row + 1);

            // 1 сегмент - треугольник      // 2 сегмент - треугольник
            positions[i] = ax;              positions[i + 9] = ax2;
            positions[i + 1] = ay;          positions[i + 10] = ay2;
            positions[i + 2] = az;          positions[i + 11] = az2;

            positions[i + 3] = bx;          positions[i + 12] = bx2;
            positions[i + 4] = by;          positions[i + 13] = by2;
            positions[i + 5] = bz;          positions[i + 14] = bz2;

            positions[i + 6] = cx;          positions[i + 15] = cx2;
            positions[i + 7] = cy;          positions[i + 16] = cy2;
            positions[i + 8] = cz;          positions[i + 17] = cz2;

            pA.set(ax, ay, az);             pA2.set(ax2, ay2, az2);
            pB.set(bx, by, bz);             pB2.set(bx2, by2, bz2);
            pC.set(cx, cy, cz);             pC2.set(cx2, cy2, cz2);

            cb.subVectors(pC, pB);          cb2.subVectors(pC2, pB2);
            ab.subVectors(pA, pB);          ab2.subVectors(pA2, pB2);
            cb.cross(ab);                   cb2.cross(ab2);

            cb.normalize();                 cb2.normalize();

            var nx = cb.x;                  var nx2 = cb2.x;
            var ny = cb.y;                  var ny2 = cb2.x;
            var nz = cb.z;                  var nz2 = cb2.x;

            normals[i] = nx;                normals[i + 9] = nx2;
            normals[i + 1] = ny;            normals[i + 10] = ny2;
            normals[i + 2] = nz;            normals[i + 11] = nz2;

            normals[i + 3] = nx;            normals[i + 12] = nx2;
            normals[i + 4] = ny;            normals[i + 13] = ny2;
            normals[i + 5] = nz;            normals[i + 14] = nz2;

            normals[i + 6] = nx;            normals[i + 15] = nx2;
            normals[i + 7] = ny;            normals[i + 16] = ny2;
            normals[i + 8] = nz;            normals[i + 17] = nz2;

            var color = row == 0 ? bottomColor : wallColor;

            // 1 segment color          // 2 segment color
            colors[i] = color.r;        colors[i + 9] = color.r;
            colors[i + 1] = color.g;    colors[i + 10] = color.g;
            colors[i + 2] = color.b;    colors[i + 11] = color.b;

            colors[i + 3] = color.r;    colors[i + 12] = color.r;
            colors[i + 4] = color.g;    colors[i + 13] = color.g;
            colors[i + 5] = color.b;    colors[i + 14] = color.b;

            colors[i + 6] = color.r;    colors[i + 15] = color.r;
            colors[i + 7] = color.g;    colors[i + 16] = color.g;
            colors[i + 8] = color.b;    colors[i + 17] = color.b;
        }

        // днище и поверхность верхняя
        if ( row == segments - 1)
        {
            var j = 0; // днище
            var p = 0; // top
            for (var k = 0; k < 2; k++, i += 18)
            {
                var ax = pointsArray[j + p].x, az = pointsArray[j + p].z, ay = height * k;
                var ax2 = pointsArray[j + 2 - p/3].x, az2 = pointsArray[j + 2 - p/3].z, ay2 = height * k;

                var bx = pointsArray[j + 3 - p].x, bz = pointsArray[j + 3 - p].z, by = height * k;
                var bx2 = pointsArray[j + 1 + p/3].x, bz2 = pointsArray[j + 1 + p/3].z, by2 = height * k;

                var cx = pointsArray[j + 2 - p/3].x, cz = pointsArray[j + 2 - p/3].z, cy = height * k;
                var cx2 = pointsArray[j + p].x, cz2 = pointsArray[j + p].z, cy2 = height * k;

                // 1 сегмент - треугольник      // 2 сегмент - треугольник
                positions[i] = ax;              positions[i + 9] = ax2;
                positions[i + 1] = ay;          positions[i + 10] = ay2;
                positions[i + 2] = az;          positions[i + 11] = az2;

                positions[i + 3] = bx;          positions[i + 12] = bx2;
                positions[i + 4] = by;          positions[i + 13] = by2;
                positions[i + 5] = bz;          positions[i + 14] = bz2;

                positions[i + 6] = cx;          positions[i + 15] = cx2;
                positions[i + 7] = cy;          positions[i + 16] = cy2;
                positions[i + 8] = cz;          positions[i + 17] = cz2;

                pA.set(ax, ay, az);             pA2.set(ax2, ay2, az2);
                pB.set(bx, by, bz);             pB2.set(bx2, by2, bz2);
                pC.set(cx, cy, cz);             pC2.set(cx2, cy2, cz2);

                cb.subVectors(pC, pB);          cb2.subVectors(pC2, pB2);
                ab.subVectors(pA, pB);          ab2.subVectors(pA2, pB2);
                cb.cross(ab);                   cb2.cross(ab2);

                cb.normalize();                 cb2.normalize();

                var nx = cb.x;                  var nx2 = cb2.x;
                var ny = cb.y;                  var ny2 = cb2.y;
                var nz = cb.z;                  var nz2 = cb2.z;

                normals[i] = nx;                normals[i + 9] = nx2;
                normals[i + 1] = ny;            normals[i + 10] = ny2;
                normals[i + 2] = nz;            normals[i + 11] = nz2;

                normals[i + 3] = nx;            normals[i + 12] = nx2;
                normals[i + 4] = ny;            normals[i + 13] = ny2;
                normals[i + 5] = nz;            normals[i + 14] = nz2;

                normals[i + 6] = nx;            normals[i + 15] = nx2;
                normals[i + 7] = ny;            normals[i + 16] = ny2;
                normals[i + 8] = nz;            normals[i + 17] = nz2;

                var color = new THREE.Color(0x78699b);

                // 1 segment color              // 2 segment color
                colors[i] = color.r;            colors[i + 9] = color.r;
                colors[i + 1] = color.g;        colors[i + 10] = color.g;
                colors[i + 2] = color.b;        colors[i + 11] = color.b;

                colors[i + 3] = color.r;        colors[i + 12] = color.r;
                colors[i + 4] = color.g;        colors[i + 13] = color.g;
                colors[i + 5] = color.b;        colors[i + 14] = color.b;

                colors[i + 6] = color.r;        colors[i + 15] = color.r;
                colors[i + 7] = color.g;        colors[i + 16] = color.g;
                colors[i + 8] = color.b;        colors[i + 17] = color.b;

                /// первый проход рисуем днище p = 0
                /// второй проход рисуем верх p = 3
                p = 3;
            }
        }
    }

    WallGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    WallGeometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    WallGeometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));

    WallGeometry.addAttribute('StartEndPoints', new THREE.BufferAttribute(StartEndPoints, 6));
    WallGeometry.addAttribute('wallsNum', new THREE.BufferAttribute(wallsNum));

    Wall = new THREE.Mesh(WallGeometry, material);
    Wall.frustumCulled = false;
    scene.add(Wall);
  
}
function addWall(height, width, segments, startPoint, endPoint, wallColor, bottomColor)
{
    ///Function: добавляет стену к уже существующей стене BufferGeometry

    var segmentHeight = height / segments;

    /// направление вектора
    var direction = new THREE.Vector3();
    direction.subVectors(startPoint, endPoint);

    /// векторы перпендикулярные направлению
    var leftVector = new THREE.Vector3();
    var rightVector = new THREE.Vector3();
    leftVector.crossVectors(direction, new THREE.Vector3(startPoint.x, 1, startPoint.z));
    rightVector.crossVectors(new THREE.Vector3(startPoint.x, 1, startPoint.z), direction);

    /// cross- product задает вектор высотой в 10000, что ломает координаты при нормализации => 
    /// нельзя умножить единичный вектор на радиус и получить точки отступа. зададим y = -1 , чтобы все было ок
    leftVector.y = -1;
    rightVector.y = -1;

    leftVector.normalize();
    rightVector.normalize();

    /// без округления будет более точнее...Пока оставим так
    var leftScalar = new THREE.Vector3().copy(leftVector).multiplyScalar(width / 2);//.round();
    var rightScalar = new THREE.Vector3().copy(rightVector).multiplyScalar(width / 2);//.round();

    var startPointLeftcorner = new THREE.Vector3();
    var startPointRightcorner = new THREE.Vector3();
    startPointLeftcorner.add(startPoint, leftScalar);
    startPointRightcorner.add(startPoint, rightScalar);

    var endPointLeftcorner = new THREE.Vector3();
    var endPointRightcorner = new THREE.Vector3();
    endPointLeftcorner.add(endPoint, leftScalar);
    endPointRightcorner.add(endPoint, rightScalar);


    ///  поверхности верхняя + днище + сегментов на 4 стороны
    var positions = Wall.geometry.attributes.position.array;
    var colors = Wall.geometry.attributes.color.array;
    var normals = Wall.geometry.attributes.normal.array;

    // 1 треугольник                // 2 треугольник
    var pA = new THREE.Vector3(); var pA2 = new THREE.Vector3();
    var pB = new THREE.Vector3(); var pB2 = new THREE.Vector3();
    var pC = new THREE.Vector3(); var pC2 = new THREE.Vector3();

    var cb = new THREE.Vector3(); var cb2 = new THREE.Vector3();
    var ab = new THREE.Vector3(); var ab2 = new THREE.Vector3();

    var i = Wall.geometry.attributes.wallsNum.array[0] * 396;
    var pointsArray = [startPointLeftcorner, startPointRightcorner, endPointRightcorner, endPointLeftcorner, startPointLeftcorner];

    // сегменты
    for (var row = 0; row < segments; row++) {
        // 4 стороны
        for (var j = 0; j < 4; j++, i += 18) {
            var ax = pointsArray[j].x, az = pointsArray[j].z, ay = segmentHeight * (row + 1);
            var ax2 = pointsArray[j + 1].x, az2 = pointsArray[j + 1].z, ay2 = segmentHeight * row;

            var bx = pointsArray[j].x, bz = pointsArray[j].z, by = segmentHeight * row;
            var bx2 = pointsArray[j + 1].x, bz2 = pointsArray[j + 1].z, by2 = segmentHeight * (row + 1);

            var cx = pointsArray[j + 1].x, cz = pointsArray[j + 1].z, cy = segmentHeight * row;
            var cx2 = pointsArray[j].x, cz2 = pointsArray[j].z, cy2 = segmentHeight * (row + 1);

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

            pA.set(ax, ay, az); pA2.set(ax2, ay2, az2);
            pB.set(bx, by, bz); pB2.set(bx2, by2, bz2);
            pC.set(cx, cy, cz); pC2.set(cx2, cy2, cz2);

            cb.subVectors(pC, pB); cb2.subVectors(pC2, pB2);
            ab.subVectors(pA, pB); ab2.subVectors(pA2, pB2);
            cb.cross(ab); cb2.cross(ab2);

            cb.normalize(); cb2.normalize();

            var nx = cb.x; var nx2 = cb2.x;
            var ny = cb.y; var ny2 = cb2.x;
            var nz = cb.z; var nz2 = cb2.x;

            normals[i] = nx; normals[i + 9] = nx2;
            normals[i + 1] = ny; normals[i + 10] = ny2;
            normals[i + 2] = nz; normals[i + 11] = nz2;

            normals[i + 3] = nx; normals[i + 12] = nx2;
            normals[i + 4] = ny; normals[i + 13] = ny2;
            normals[i + 5] = nz; normals[i + 14] = nz2;

            normals[i + 6] = nx; normals[i + 15] = nx2;
            normals[i + 7] = ny; normals[i + 16] = ny2;
            normals[i + 8] = nz; normals[i + 17] = nz2;

            var color = row == 0 ? bottomColor : wallColor;

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

        // днище и поверхность верхняя
        if (row == segments - 1) {
            var j = 0; // днище
            var p = 0; // top
            for (var k = 0; k < 2; k++, i += 18) {
                var ax = pointsArray[j + p].x, az = pointsArray[j + p].z, ay = height * k;
                var ax2 = pointsArray[j + 2 - p / 3].x, az2 = pointsArray[j + 2 - p / 3].z, ay2 = height * k;

                var bx = pointsArray[j + 3 - p].x, bz = pointsArray[j + 3 - p].z, by = height * k;
                var bx2 = pointsArray[j + 1 + p / 3].x, bz2 = pointsArray[j + 1 + p / 3].z, by2 = height * k;

                var cx = pointsArray[j + 2 - p / 3].x, cz = pointsArray[j + 2 - p / 3].z, cy = height * k;
                var cx2 = pointsArray[j + p].x, cz2 = pointsArray[j + p].z, cy2 = height * k;

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

                pA.set(ax, ay, az); pA2.set(ax2, ay2, az2);
                pB.set(bx, by, bz); pB2.set(bx2, by2, bz2);
                pC.set(cx, cy, cz); pC2.set(cx2, cy2, cz2);

                cb.subVectors(pC, pB); cb2.subVectors(pC2, pB2);
                ab.subVectors(pA, pB); ab2.subVectors(pA2, pB2);
                cb.cross(ab); cb2.cross(ab2);

                cb.normalize(); cb2.normalize();

                var nx = cb.x; var nx2 = cb2.x;
                var ny = cb.y; var ny2 = cb2.y;
                var nz = cb.z; var nz2 = cb2.z;

                normals[i] = nx; normals[i + 9] = nx2;
                normals[i + 1] = ny; normals[i + 10] = ny2;
                normals[i + 2] = nz; normals[i + 11] = nz2;

                normals[i + 3] = nx; normals[i + 12] = nx2;
                normals[i + 4] = ny; normals[i + 13] = ny2;
                normals[i + 5] = nz; normals[i + 14] = nz2;

                normals[i + 6] = nx; normals[i + 15] = nx2;
                normals[i + 7] = ny; normals[i + 16] = ny2;
                normals[i + 8] = nz; normals[i + 17] = nz2;

                var color = new THREE.Color(0x78699b);

                // 1 segment color              // 2 segment color
                colors[i] = color.r; colors[i + 9] = color.r;
                colors[i + 1] = color.g; colors[i + 10] = color.g;
                colors[i + 2] = color.b; colors[i + 11] = color.b;

                colors[i + 3] = color.r; colors[i + 12] = color.r;
                colors[i + 4] = color.g; colors[i + 13] = color.g;
                colors[i + 5] = color.b; colors[i + 14] = color.b;

                colors[i + 6] = color.r; colors[i + 15] = color.r;
                colors[i + 7] = color.g; colors[i + 16] = color.g;
                colors[i + 8] = color.b; colors[i + 17] = color.b;

                /// первый проход рисуем днище p = 0
                /// второй проход рисуем верх p = 3
                p = 3;
            }
        }
    }

    Wall.geometry.attributes.wallsNum.array[0]++;
    Wall.geometry.attributes.position.needsUpdate = true;
    Wall.geometry.attributes.color.needsUpdate = true;
    Wall.geometry.attributes.normal.needsUpdate = true;
}
function changeWall(height, width, segments, startPoint, endPoint)
{
    ///Function: изменяет координаты конечной точки( растягивание стены )
    var positions = Wall.geometry.attributes.position.array;
    var startEndPoints = Wall.geometry.attributes.StartEndPoints.array;
    startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 6] = startPoint.x;
    startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 5] = startPoint.y;
    startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 4] = startPoint.z;
    startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 3] = endPoint.x;
    startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 2] = endPoint.y;
    startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 2 - 1] = endPoint.z;

    var segmentHeight = height / segments;

    /// направление вектора
    var direction = new THREE.Vector3().subVectors(startPoint, endPoint);

    /// векторы перпендикулярные направлению
    var leftVector = new THREE.Vector3();
    var rightVector = new THREE.Vector3();
    leftVector.crossVectors(direction, new THREE.Vector3(startPoint.x, 1, startPoint.z));
    rightVector.crossVectors(new THREE.Vector3(startPoint.x, 1, startPoint.z), direction);

    /// cross- product задает вектор высотой в 10000, что ломает координаты при нормализации => 
    /// нельзя умножить единичный вектор на радиус и получить точки отступа. зададим y = -1 , чтобы все было ок
    leftVector.y = -1;
    rightVector.y = -1;

    leftVector.normalize();
    rightVector.normalize();

    /// без округления будет более точнее...Пока оставим так
    var leftScalar = new THREE.Vector3().copy(leftVector).multiplyScalar(width / 2);//.round();
    var rightScalar = new THREE.Vector3().copy(rightVector).multiplyScalar(width / 2);//.round();

    var startPointLeftcorner = new THREE.Vector3();
    var startPointRightcorner = new THREE.Vector3();
    startPointLeftcorner.add(startPoint, leftScalar);
    startPointRightcorner.add(startPoint, rightScalar);

    var endPointLeftcorner = new THREE.Vector3();
    var endPointRightcorner = new THREE.Vector3();
    endPointLeftcorner.add(endPoint, leftScalar);
    endPointRightcorner.add(endPoint, rightScalar);

    // 1 треугольник                // 2 треугольник
    var pA = new THREE.Vector3();   var pA2 = new THREE.Vector3();
    var pB = new THREE.Vector3();   var pB2 = new THREE.Vector3();
    var pC = new THREE.Vector3();   var pC2 = new THREE.Vector3();

    var i = (Wall.geometry.attributes.wallsNum.array[0] - 1) * 396;
    var pointsArray = [startPointLeftcorner, startPointRightcorner, endPointRightcorner, endPointLeftcorner, startPointLeftcorner];

    // сегменты
    for (var row = 0; row < segments; row++) {
        // 4 стороны
        for (var j = 0; j < 4; j++, i += 18) {
            var ax = pointsArray[j].x, az = pointsArray[j].z, ay = segmentHeight * (row + 1);
            var ax2 = pointsArray[j + 1].x, az2 = pointsArray[j + 1].z, ay2 = segmentHeight * row;

            var bx = pointsArray[j].x, bz = pointsArray[j].z, by = segmentHeight * row;
            var bx2 = pointsArray[j + 1].x, bz2 = pointsArray[j + 1].z, by2 = segmentHeight * (row + 1);

            var cx = pointsArray[j + 1].x, cz = pointsArray[j + 1].z, cy = segmentHeight * row;
            var cx2 = pointsArray[j].x, cz2 = pointsArray[j].z, cy2 = segmentHeight * (row + 1);

            // 1 сегмент - треугольник      // 2 сегмент - треугольник
            positions[i] = ax;              positions[i + 9] = ax2;
            positions[i + 1] = ay;          positions[i + 10] = ay2;
            positions[i + 2] = az;          positions[i + 11] = az2;

            positions[i + 3] = bx;          positions[i + 12] = bx2;
            positions[i + 4] = by;          positions[i + 13] = by2;
            positions[i + 5] = bz;          positions[i + 14] = bz2;

            positions[i + 6] = cx;          positions[i + 15] = cx2;
            positions[i + 7] = cy;          positions[i + 16] = cy2;
            positions[i + 8] = cz;          positions[i + 17] = cz2;

        }

        // днище и поверхность верхняя
        if (row == segments - 1) {
            var j = 0; // днище
            var p = 0; // top
            for (var k = 0; k < 2; k++, i += 18) {
                var ax = pointsArray[j + p].x, az = pointsArray[j + p].z, ay = height * k;
                var ax2 = pointsArray[j + 2 - p / 3].x, az2 = pointsArray[j + 2 - p / 3].z, ay2 = height * k;

                var bx = pointsArray[j + 3 - p].x, bz = pointsArray[j + 3 - p].z, by = height * k;
                var bx2 = pointsArray[j + 1 + p / 3].x, bz2 = pointsArray[j + 1 + p / 3].z, by2 = height * k;

                var cx = pointsArray[j + 2 - p / 3].x, cz = pointsArray[j + 2 - p / 3].z, cy = height * k;
                var cx2 = pointsArray[j + p].x, cz2 = pointsArray[j + p].z, cy2 = height * k;

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

                /// первый проход рисуем днище p = 0
                /// второй проход рисуем верх p = 3
                p = 3;
            }
        }
    }

    Wall.geometry.attributes.position.needsUpdate = true;
}
function checkWallNotNull()
{
    ///Function: проверяет протянули ли мы стену хотябы на 1 клетку? если нет удаляем кол-во стен и используем координаты заного
    var startEndPoints = Wall.geometry.attributes.StartEndPoints.array;
    var startPoint = new THREE.Vector3(startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 6],
        startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 5],
        startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 4]);
    var endPoint = new THREE.Vector3(startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 3],
        startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 2],
        startEndPoints[Wall.geometry.attributes.wallsNum.array[0] * 6 - 1]);

    if (startPoint.distanceTo(endPoint) == 0) {
        Wall.geometry.attributes.wallsNum.array[0]--;
        console.log("Wall wasnt edited and deleted");
    }
    //var text;
    //for (var i = 0 ; i < startEndPoints.length; i++)
    //{
    //    text += startEndPoints[i].x + "/" + startEndPoints[i].z + "<br />";
    //}
    
    //document.getElementById('InfoText').innerHTML = text;
}
function updateWall()
{
    /// изменяем координаты в buffergeometry
    if (wallBuilded)
        if (!wallAdded) {
            wallAdded = true;
            firstWallPoint = new THREE.Vector3().copy(GridPoint.position);
            addWall(WallHeight, WallWidth, WallSegments, firstWallPoint, GridPoint.position,
                new THREE.Color(0x2084ea), new THREE.Color(0x9ba63b));
        }

    ///самая первая стенка создана, buffergeometry создан, после этого в нем лишь будем изменять координаты
    if (!wallBuilded) {
        wallBuilded = true;
        wallAdded = true;
        firstWallPoint = new THREE.Vector3().copy(GridPoint.position);
        makeWall(WallHeight, WallWidth, WallSegments, firstWallPoint, GridPoint.position,
            new THREE.Color(0x2084ea),new THREE.Color(0x9ba63b));
    }
    
    if (firstWallPoint != GridPoint.position && WallNeedsUpdate == true) {
        changeWall(WallHeight, WallWidth, WallSegments, firstWallPoint, GridPoint.position);
        WallNeedsUpdate = false;
        //checkCollision(firstWallPoint, GridPoint.position);
    }
}


function checkCollision(startPoint, endPoint)
{
    if (startPoint.distanceTo(endPoint) == 0) return;

    var Points = Wall.geometry.attributes.StartEndPoints.array;

    var Spoint = new THREE.Vector2(startPoint.x, startPoint.z);
    var Spoint2 = new THREE.Vector2(endPoint.x, endPoint.z);

    for (var i = 0; i < ( Wall.geometry.attributes.wallsNum.array[0] - 1 ) * 6 ; i += 6)
    {
        var Qpoint = new THREE.Vector2(Points[i], Points[i + 2]);
        var Qpoint2 = new THREE.Vector2(Points[i + 3], Points[i + 5]);

        var intersect = doLineSegmentsIntersect(Spoint, Spoint2, Qpoint, Qpoint2);
        if ( intersect == true )
        { 
            wrongWall(new THREE.Color(0xff0024), new THREE.Color(0xff0024)); break;}
        else
            restoreWall(new THREE.Color(0x2084ea), new THREE.Color(0x9ba63b));      
    }
    Wall.geometry.attributes.color.needsUpdate = true;
}
function doLineSegmentsIntersect(p, p2, q, q2) {
    var r = subtractPoints(p2, p);
    var s = subtractPoints(q2, q);

    var uNumerator = crossProduct(subtractPoints(q, p), r);
    var denominator = crossProduct(r, s);

    if (uNumerator == 0 && denominator == 0) {
        // colinear, so do they overlap?
        return ((q.x - p.x < 0) != (q.x - p2.x < 0) != (q2.x - p.x < 0) != (q2.x - p2.x < 0)) ||
			((q.y - p.y < 0) != (q.y - p2.y < 0) != (q2.y - p.y < 0) != (q2.y - p2.y < 0));
    }

    if (denominator == 0) {
        // lines are paralell
        return false;
    }

    var u = uNumerator / denominator;
    var t = crossProduct(subtractPoints(q, p), s) / denominator;

    return (t >= 0) && (t <= 1) && (u >= 0) && (u <= 1);
}
function crossProduct(point1, point2) {
    return point1.x * point2.y - point1.y * point2.x;
}
function subtractPoints(point1, point2) {
    var result = {};
    result.x = point1.x - point2.x;
    result.y = point1.y - point2.y;

    return result;
}
function wrongWall(wallColor, bottomColor)
{
    console.log("Intersected");
    var i = (Wall.geometry.attributes.wallsNum.array[0] - 1) * 396;
    var colors = Wall.geometry.attributes.color.array;

    // сегменты
    for (var row = 0; row < 5; row++) {
        // 4 стороны
        for (var j = 0; j < 4; j++, i += 18) {

            var color = row == 0 ? bottomColor : wallColor;

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
}
function restoreWall(wallColor, bottomColor)
{
    console.log("restored");
    var i = (Wall.geometry.attributes.wallsNum.array[0] - 1) * 396;
    var colors = Wall.geometry.attributes.color.array;

    // сегменты
    for (var row = 0; row < 5; row++) {
        // 4 стороны
        for (var j = 0; j < 4; j++, i += 18) {

            var color = row == 0 ? bottomColor : wallColor;

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

}

var Points = [];

function SetPoint(Xcoord,Zcoord)
{
    var material = new THREE.MeshBasicMaterial({
        color: 0xff38ad
    });
    var circleGeometry = new THREE.CircleGeometry(5, 8);
    var Point = new THREE.Mesh(circleGeometry, material);
    Point.rotation.x = -Math.PI / 2;
    Point.position.set(Xcoord, 2, Zcoord);  
    Points.push(Point);
    scene.add(Point);
}


function IsKeyboardPressed()
{
    //if (INTERSECTED != null)
    //document.getElementById('InfoText').innerHTML = 'x' + camera.position.x + "<br />" +
    //'z' + camera.position.z + "<br />" + "angle" + theta + "<br />" +
    //    INTERSECTED.point.x;

    if (keyboard.pressed("ctrl")) {

        if (isCtrlDown == false) {
            /// расстояние до камеры ( гипотенуза треугольника )
            radius = Math.sqrt(camera.position.z * camera.position.z + camera.position.x * camera.position.x);

            /// 3 и 4 четверть  360 - theta
            if (camera.position.z < 0 && camera.position.x < 0 || camera.position.z > 0 && camera.position.x < 0) {
                theta = 360 - (Math.acos(camera.position.z / radius) * 180) / Math.PI;
            } /// 1 и 2 четверть
            else theta = (Math.acos(camera.position.z / radius) * 180) / Math.PI;
        }

        isCtrlDown = true;
        theta += mouse.x * 2.5;

        camera.position.x = radius * Math.sin(THREE.Math.degToRad(theta));
        camera.position.z = radius * Math.cos(THREE.Math.degToRad(theta));

    } else { isCtrlDown = false; }

    if (keyboard.pressed("alt")) {

        if (isAltDown == false) {
            /// расстояние до камеры ( гипотенуза треугольника )
            radius = Math.sqrt(camera.position.z * camera.position.z + camera.position.y * camera.position.y);
            /// 3 и 4 четверть  360 - theta
            if (camera.position.z < 0 && camera.position.y < 0 || camera.position.z > 0 && camera.position.y < 0) {
                theta = 360 - (Math.acos(camera.position.z / radius) * 180) / Math.PI;
            } /// 1 и 2 четверть
            else theta = (Math.acos(camera.position.z / radius) * 180) / Math.PI;

            thetafixed = theta;
        }

        isAltDown = true;
        theta += mouse.y * 2.5;

        camera.position.y = radius * Math.sin(THREE.Math.degToRad(theta));
        camera.position.z = radius * Math.cos(THREE.Math.degToRad(theta));

    } else { isAltDown = false; }

    //TODO вращение координат треугольников
    if (keyboard.pressed("r")) rotateTriangle = !rotateTriangle;
}

