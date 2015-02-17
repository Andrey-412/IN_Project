var IndoorNavigation = { Version: "0.0.1" , Started: "25.09.2014", By: "NAFAW", mainScene: "undefined", Core: "undefined" };
var INTERSECTED_Furniture; //FurnitureModule
var INTERSECTED_Network; //NetworkModule
var INTERSECTED_Wall; //BuildingModule
var INTERSECTED_Marker; 

IndoorNavigation.Core = function( container , initHelpers )
{
    var scope = this;
    this.modules = [];
    this.interfaces = [];
    scope.APIfunctions = []; // для обновления функций АПИ
    this.API = new IndoorNavigation.API();
    this.Logger = new IndoorNavigation.Logger();
	
    init_Main();
    init_Events();
    init_Geometry();
    if (initHelpers) init_Helpers();

    IndoorNavigation.mainScene = scope.scene;
	IndoorNavigation.Core = scope;
	
    function init_Main() {
        scope.scene = new THREE.Scene();
        scope.scene.add(new THREE.AmbientLight(0x727272));

        scope.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 30000); //0.1, 20000
        scope.camera.position.set(0, 950, 1800);

        scope.projector = new THREE.Projector();
        scope.raycaster = new THREE.Raycaster();
        scope.mouse = new THREE.Vector2();

        scope.renderer = new THREE.WebGLRenderer({ antialias: true }); //logarithmicDepthBuffer: true
        scope.renderer.setSize(window.innerWidth, window.innerHeight);
		//scope.renderer.sortObjects = false;

        scope.cameraControl = new THREE.OrbitControls(scope.camera, scope.renderer.domElement);
        scope.cameraControl.userPanSpeed = 7.0;
        scope.cameraControl.minDistance = 100;
        scope.cameraControl.maxDistance = 4000;

        scope.container = document.getElementById(container);
        scope.container.appendChild(scope.renderer.domElement);

        scope.clock = new THREE.Clock();
    }
    function init_Events() {
        ////////////
        // EVENTS //
        ////////////

        THREEx.WindowResize(scope.renderer, scope.camera); // automatically resize renderer   
        THREEx.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) }); // toggle full-screen on given key press

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mousedown', onDocumentMouseDown, false);
        //document.addEventListener('mouseup', onDocumentMouseUp, false);

    }
    function init_Geometry() {
        /// SKYBOX
        var skyBoxGeometry = new THREE.BoxGeometry(20000, 20000, 20000);
        // BackSide: render faces from inside of the cube, instead of from outside (default).
        var skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0xb0b0b0, side: THREE.BackSide });
        var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
        skyBox.name = "skybox";
        scope.scene.add(skyBox);
    }
    function init_Helpers() {
        /// FPS
        scope.stats = new Stats();
        scope.stats.domElement.style.position = 'absolute';
        scope.stats.domElement.style.bottom = '0px';
        scope.container.appendChild(scope.stats.domElement);

        // X,Y,Z  world axes
        var axes = new THREE.AxisHelper(500);
        scope.scene.add(axes);

        /// линии мерцали т.к. происходило наложение на поверхность, стоит поднять по высоте(y) на 0.1 и все ок.
        var gridXZ = new THREE.GridHelper(1250, 50);
        gridXZ.setColors(new THREE.Color(0x006600), new THREE.Color(0x006600));
        gridXZ.position.set(0, -1, 0);
        scope.scene.add(gridXZ);
    }
	
    this.animate = function animate() {

        requestAnimationFrame(animate);

        render();
        update();
        updateModules();
        updateAPI();
        
        if (scope.MoveCamera) moveCameraSlowly();

        scope.Logger.LogSet2(scope.camera.rotation.x + "/" + scope.camera.rotation.y + "/" + scope.camera.rotation.z);
    }

    function render() {
        scope.renderer.render(scope.scene, scope.camera);
    }

    function update() {
        scope.cameraControl.update();
        scope.stats.update();
    }

	function updateModules() {
        for (var i = 0; i < scope.modules.length; i++)
        {
            if (scope.modules[i].enabled) {
                scope.modules[i].updateModule();
            }
        }
    }

	function updateAPI()
	{
	    for (var i = 0; i < scope.APIfunctions.length; i++) {
	        if (scope.APIfunctions[i].enabled) {
	            scope.APIfunctions[i].updateAPI();
	        }
	    }
	}

	function onDocumentMouseMove(event) {
		event.preventDefault();
		scope.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		scope.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; 
	}
	
	function onDocumentMouseDown(event)
	{
		event.preventDefault();
		
		switch (event.which) {
		    case 1:
		        if (INTERSECTED_Furniture) INTERSECTED_Furniture.dispatchEvent({ type: 'open' });
		        if (INTERSECTED_Marker) {
		            CreateCameraPath(scope.camera.position, INTERSECTED_Marker.matrixWorld.getPosition());//INTERSECTED_Marker.position);
		            scope.Marker = INTERSECTED_Marker;
		            //moveCameraSlowly(-1);
		            scope.MoveCamera = true;
		        }
		        break;
			case 2: 
				//Middle Mouse button pressed.
				break;
			case 3: 
				//Right Mouse button pressed.
				break;
			default:
				//You have a strange Mouse!
		}
	}

	function moveCameraSlowly()
	{
	    if (scope.i < scope.PathPoints.length - 10) {
	        scope.i++;
	        var direction = new THREE.Vector3().sub(scope.Marker.position, scope.camera.position).normalize();
	        //scope.camera.position.add(direction.multiplyScalar(10));
	        scope.camera.position.copy(scope.PathPoints[scope.i]);
	        //scope.camera.translate(new THREE.Vector3().sub(scope.PathPoints[scope.i], scope.camera.position).length(),
            //   new THREE.Vector3().sub(scope.PathPoints[scope.i], scope.camera.position));
            
	        //scope.camera.up = new THREE.Vector3(0, 1, 0);
	        //scope.camera.lookAt(scope.camera.worldToLocal(scope.Marker.matrixWorld.getPosition()));
	        scope.camera.lookAt(scope.Marker.matrixWorld.getPosition());
	        //requestAnimationFrame(function () { moveCameraSlowly(i); });
	        //scope.Logger.LogSet(scope.Marker.matrixWorld.getPosition().x + "/" + scope.Marker.matrixWorld.getPosition().y + "/" + scope.Marker.matrixWorld.getPosition().z);
	        scope.Logger.LogSet(scope.camera.rotation.x + "/" + scope.camera.rotation.y + "/" + scope.camera.rotation.z);
	    }
	    else {
	        scope.cameraControl.center.copy(scope.Marker.matrixWorld.getPosition());
	        scope.MoveCamera = false;
	    }
	        

	}

	function CreateCameraPath(pos1, pos2)
	{
	    var curve = new THREE.SplineCurve3([pos1, pos2]);
	    scope.PathPoints = curve.getPoints(50);
	    scope.i = -1;
	    var wire = new IndoorNavigation.Wire([pos1, pos2]);
	}

	
	///Helper functions
	this.makeTextSprite = function( message, parameters )
	{
		if ( parameters === undefined ) parameters = {};
		
		var fontface = parameters.hasOwnProperty("fontface") ? 
			parameters["fontface"] : "Arial";
		
		var fontsize = parameters.hasOwnProperty("fontsize") ? 
			parameters["fontsize"] : 18;
		
		var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
			parameters["borderThickness"] : 4;
		
		var borderColor = parameters.hasOwnProperty("borderColor") ?
			parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
		
		var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
			parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

		//var spriteAlignment = parameters.hasOwnProperty("alignment") ?
		//	parameters["alignment"] : THREE.SpriteAlignment.topLeft;
			

		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.font = "Bold " + fontsize + "px " + fontface;
		
		// get size data (height depends only on font size)
		var metrics = context.measureText( message );
		var textWidth = metrics.width;
		
		// background color
		context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
									  + backgroundColor.b + "," + backgroundColor.a + ")";
		// border color
		context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
									  + borderColor.b + "," + borderColor.a + ")";

		context.lineWidth = borderThickness;
		roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
		
		// text color
		context.fillStyle = "rgba(0, 0, 0, 1.0)";

		context.fillText( message, borderThickness, fontsize + borderThickness);
		
		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas) 
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.MeshBasicMaterial( 
			{ map: texture } );
		var sprite = new THREE.Sprite( spriteMaterial );
		var width = spriteMaterial.map.image.width/2;
		var height = spriteMaterial.map.image.height/2;
		sprite.scale.set(width,height,1.0);
		//return sprite;	
		
		// create a canvas element
		var canvas1 = document.createElement('canvas');
		var context1 = canvas1.getContext('2d');
		canvas1.width = textWidth;
		context1.font = "Bold 20px Arial";
		context1.fillStyle = "rgba(255,0,0,0.95)";
		context1.fillText(message, 0, 50);
		
		
		// canvas contents will be used for a texture
		var texture1 = new THREE.Texture(canvas1) 
		texture1.needsUpdate = true;
		  
		var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
		material1.transparent = true;

		var mesh1 = new THREE.Mesh(
			new THREE.PlaneGeometry(canvas1.width, canvas1.height),
			material1
		  );
		
		return mesh1;
	}

	function roundRect(ctx, x, y, w, h, r) 
	{
		ctx.beginPath();
		ctx.moveTo(x+r, y);
		ctx.lineTo(x+w-r, y);
		ctx.quadraticCurveTo(x+w, y, x+w, y+r);
		ctx.lineTo(x+w, y+h-r);
		ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
		ctx.lineTo(x+r, y+h);
		ctx.quadraticCurveTo(x, y+h, x, y+h-r);
		ctx.lineTo(x, y+r);
		ctx.quadraticCurveTo(x, y, x+r, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();   
	}

}

IndoorNavigation.Core.prototype = {

    constructor: IndoorNavigation.Core,

    addModule: function( module )
    {
        for (var i = 0; i < this.modules.length; i++)
        {
            if (this.modules[i].name == module.name) {
                console.warn(module.name + " already added!");
                return;
            }
        }
        this.modules.push(module);
    },

    deleteModule: function( module )
    {
        for (var i = 0; i < this.modules.length; i++) {
            if (this.modules[i].name == module.name) {
                this.modules.splice(i, 1);
                console.warn(module.name + " deleted!");
                break;
            }
        }
    },

	addInterface: function ( _interface )
	{
		for (var i = 0; i < this.interfaces.length; i++)
        {
            if (this.interfaces[i].name == _interface.name) {
                console.warn(_interface.name + " already added!");
                return;
            }
        }
        this.interfaces.push(_interface);
	}

}

IndoorNavigation.Logger = function ()
{
    this.LogAdd = function(text)
    {
        $("#InfoText").append("<p>" + text + "</p>");
    }

    this.LogSet = function (text) {
        //$("#InfoText").html(text);
        $("#NetworkItemInfo > div").html(text);
        if (text != "Null") IndoorNavigation.Core.API.ShowInfoBox(true);           
        else IndoorNavigation.Core.API.ShowInfoBox(false);
    }

    this.LogSet2 = function (text) {
        $("#NetworkItemInfo > p").html(text);
    }

    this.ClearLog = function()
    {
        $("#InfoText").text("");
    }
}


IndoorNavigation.Interface = function( name, version, hidden )
{
	this.name = name || "unknown interface";
    this.version = version || "unknown version"; 
    this.hidden = hidden || false;
	
	this.hideInterface = function ()
	{
		this.hidden = true;
		console.warn( "Module: " + this.name + " - enabled!");
	}
	
	this.showInterface = function ()
	{
		this.hidden = false;
		console.warn( "Module: " + this.name + " - disabled!");
	}

}

IndoorNavigation.Interface.BuildingInterface = function( BuildingModule )
{
	IndoorNavigation.Interface.call(this, "BuildingInterface", "0.0.1", false);
	
	var scope = this;
	scope.module = BuildingModule;
	
	create();
	
	function create ()
	{
		scope.GUI = new dat.GUI({ width: 400 });
		GUIParams = {
			transparentRoom: true,
			hideFloor : false,
		};
		scope.GUI.open();
		scope.GUI.domElement.style.zIndex = 100;
		
		Folders1 = {};
		Folders2 = {};
		
		GUIParams["Test Event"] = function() { };
		scope.GUI.add( GUIParams, "Test Event" )
					  .name( "Test Event")
					  .onChange( function(value)
					  {
					      scope.module.callEvent( 1, 'test');	
						  scope.module.callEvent( 2, 'test');						  
					  });
					  
				
		for( var i = 0; i < scope.module.floors.length; i ++)
		{
			console.warn( "Floor: " + scope.module.floors[i].number );
			var floor = scope.module.floors[i].FloorMesh;
			var name = "Этаж - " + scope.module.floors[i].number;
			
			
			Folders1[name] = scope.GUI.addFolder(name);
			var guiSection = Folders1[name];			
			
			GUIParams["этаж -" + scope.module.floors[i].number] = false; // чтобы менять цвет кнопки...
			GUIParams["Скрыть этаж -" + scope.module.floors[i].number] = function() { };
			
			// скрыть этаж
			guiSection.add( GUIParams, "Скрыть этаж -" + scope.module.floors[i].number )
					  .name( "Скрыть этаж " + scope.module.floors[i].number )
					  .onChange( function(value)
					  {
						  var number = parseInt(this.property.split("-").pop());
					      scope.module.hideFloor(number);
						  GUIParams["этаж -" + number] = !GUIParams["этаж -" + number];
						  if (GUIParams["этаж -" + number]) this.__li.style.backgroundColor = "grey";
						  else this.__li.style.backgroundColor = "black";						  
					  });
					  
			GUIParams["Прозрачность этажа -" + scope.module.floors[i].number] = function() { };
			
			// скрыть этаж
			guiSection.add( GUIParams, "Прозрачность этажа -" + scope.module.floors[i].number )
					  .name( "Прозрачность этажа -" + scope.module.floors[i].number )
					  .onChange( function(value)
					  {
						  var number = parseInt(this.property.split("-").pop());
					      scope.module.makeFloorTransparent(number);					  
					  });		  
			
			var currentName = "";
			for ( var j = 0; j < floor.children.length; j++)
			{
				var roomName = floor.children[j].name.split("-")[0];
				var object = floor.children[j].name.split("-")[1];
				
				if ( currentName != roomName ) // добавить уникальную папку в текущую папку этажа
				{
					// cкрыть комнату
					Folders2[roomName] = guiSection.addFolder(roomName);
					currentName = roomName;
					GUIParams[scope.module.floors[i].number + "-" + roomName] = function() { }; //скрыть комнату, номер этажа + ее название
					Folders2[roomName].add( GUIParams, scope.module.floors[i].number + "-" + roomName )
								.name( "Скрыть комнату - " + roomName )
								.onChange( function(value)
								{
									var floor = parseInt(this.property.split("-")[0]);
									var room = this.property.split("-")[1];
									scope.module.hideRoom(floor,room);
								});
					
					// сделать комнату прозрачной
					GUIParams["Прозрачность -" + scope.module.floors[i].number + "-" + roomName] = function() { };
					
					Folders2[roomName].add( GUIParams, "Прозрачность -" + scope.module.floors[i].number + "-" + roomName )
								.name( "Прозрачность - " + roomName )
								.onChange( function(value)
								{
									var floor = parseInt(this.property.split("-")[1]);
									var room = this.property.split("-")[2];
									scope.module.makeRoomTransparent( floor, room );
								});
				}
				
				console.warn( floor.children[j].name );
			}
			
		}
	}
	
}


IndoorNavigation.Module = function ( name, version, enabled )
{
    this.name = name || "unknown module";
    this.version = version || "unknown version"; 
    this.enabled = enabled || false; // if false - don`t update module

    //TODO записать все объекты модуля, чтобы их удалить по необходимости при удалении модуля...

	/// abstract method
    this.updateModule = function()
    {
        console.warn("abstract module");
    }
	
	/// turn on module update
	this.turnOnModule = function ()
	{
		this.enabled = true;
		console.warn( "Module: " + this.name + " - enabled!");
	}
	
	/// turn off module update
	this.turnOffModule = function ()
	{
		this.enabled = false;
		console.warn( "Module: " + this.name + " - disabled!");
	}

}


///////////////////////////////////////////////////////////
/////////////////// BUILDING MODULE //////////////////////
///////////////////////////////////////////////////////////

IndoorNavigation.BuildingModule = function()
{
    IndoorNavigation.Module.call(this, "BuildingModule", "0.0.1", true);

    this.floors = []; /// Этажи

    /// override
    this.updateModule = function()
    {
        //console.warn("building module");
		for( var i = 0; i < this.floors.length; i++ )
		{
			this.floors[i].updateFloor();
		}
    }

    this.addFloor = function ( floor )
    {
        for (var i = 0; i < this.floors.length; i++) {
            if (this.floors[i].number == floor.number) {
                console.warn("Этаж с номером - " + floor.number + " уже существует!");
                return;
            }
        }
        this.floors.push(floor);
    }

    this.deleteFloor = function ( floor )
    {
        for (var i = 0; i < this.floors.length; i++) {
            if (this.floors[i].number == floor.number) {
                this.floors.splice(i, 1);
                console.warn("Этаж с номером - " + floor.number + " удален!");
                break;
            }
        }
    }
	
	this.hideFloor = function ( floorNumber )
	{
		for (var i = 0; i < this.floors.length; i++) 
		{
			if (this.floors[i].number == floorNumber) {
			    this.floors[i].FloorMesh.visible = !this.floors[i].FloorMesh.visible;
			    this.floors[i].needsUpdate = !this.floors[i].needsUpdate;
				return;
			}
		}		
	}

	this.makeFloorTransparent = function ( floorNumber )
	{
        //find Floor
		for (var i = 0; i < this.floors.length; i++) 
		{
			if (this.floors[i].number == floorNumber) {
			    var objects = this.floors[i].FloorMesh.children;
			    if (!this.floors[i].FloorMesh.visible) return; //кнопка не должна быть доступна если этаж скрыт
			    this.floors[i].needsUpdate = !this.floors[i].needsUpdate; // отключить проверку стен если мы сделали этаж прозрачным
                //TODO сделать кнопку скрыть этаж недоступной? если она доступна то нужно не включать апдейт при скрытии когда стены уже прозрачны.
				break;
			}
		}	

		for( var j = 0; j < objects.length; j++ )
		{
		    if (objects[j].name.indexOf("vertexMesh") == -1 && objects[j].name.indexOf("edgeMesh") == -1) {
		        //objects[j].material.transparent = !objects[j].material.transparent;
                // Изменил прозрачность на видимость, чтобы все было видно... + без артифактов
		        objects[j].visible = !objects[j].visible;
		    }
		}
	}
	
	this.hideRoom = function ( floorNumber, roomName )
	{
		for (var i = 0; i < this.floors.length; i++) 
		{
			if (this.floors[i].number == floorNumber) {
				var objects = this.floors[i].FloorMesh.children;
				break;
			}
		}	

		for( var j = 0; j < objects.length; j++ )
		{
			if ( objects[j].name.indexOf(roomName) > -1 )
				objects[j].visible = !objects[j].visible;
		}
	}

	this.makeRoomTransparent = function ( floorNumber, roomName )
	{
		for (var i = 0; i < this.floors.length; i++) 
		{
			if (this.floors[i].number == floorNumber) {
				var objects = this.floors[i].FloorMesh.children;
				break;
			}
		}
		
		for( var j = 0; j < objects.length; j++ )
		{
			//находим комнату по названию
			if ( objects[j].name.indexOf(roomName) > -1 )
				//делаем прозрачным все кроме  vertexMesh и edgeMesh
				if ( objects[j].name.indexOf("vertexMesh") == -1 && objects[j].name.indexOf("edgeMesh") == -1 )
					objects[j].material.transparent = !objects[j].material.transparent;
		}
	}

	this.callEvent = function ( floorNumber, eventName )
	{
		for (var i = 0; i < this.floors.length; i++) 
		{
			if (this.floors[i].number == floorNumber) {
				this.floors[i].FloorMesh.dispatchEvent({type:eventName});
				return;
			}
		}	
	}

}

IndoorNavigation.BuildingModule.Floor = function ( data )
{
    var scope = this;

    this.needsUpdate = true; //Этаж должен быть обновлен
    this.number = data.Parameters.FloorNumber;
	
    this.updateFloor = function () {    
        //var time = Date.now() / 1000;
        if (!this.needsUpdate) { INTERSECTED_Wall = null; return; } //TODO Проблема в этом решение что все остальные этажи, которые обновляются тоже получат null объект
        // и можно будет подсветить предмет сквозь стену нижних этажей
	    var vector = new THREE.Vector3(IndoorNavigation.Core.mouse.x, IndoorNavigation.Core.mouse.y, 1);
	    IndoorNavigation.Core.projector.unprojectVector(vector, IndoorNavigation.Core.camera);
	    var ray = new THREE.Raycaster(IndoorNavigation.Core.camera.position,
            vector.sub(IndoorNavigation.Core.camera.position).normalize());
	        
	    //var info = "";

	    //var t0 = performance.now();
	    //var intersects = ray.intersectObjects(scope.FloorMesh.children);
	    //var t1 = performance.now();
	    //info += "WholeFloorMesh " + (t1 - t0).toFixed(5) + " milliseconds.</br>";

	    //t0 = performance.now();
	    var intersects = ray.intersectObjects(scope.OnlyWallMeshes);
	    //t1 = performance.now();
	    //info += "OnlyWallMeshes " + (t1 - t0).toFixed(5) + " milliseconds.</br>";

	    if (intersects.length > 0) {
	        if (intersects[0].object != INTERSECTED_Wall) {
	            INTERSECTED_Wall = intersects[0].object;
	        }
	    }
	    else
	        if (INTERSECTED_Wall != null) {
	            var intersect_another = ray.intersectObject(INTERSECTED_Wall);
	            if (intersect_another.length == 0) {
	                INTERSECTED_Network = null;
	            }
	        }
	}
	
	// test event function
	function move()
	{
		scope.moveTimes ++;
		var t = Math.PI/180 * scope.moveTimes;
		
		var currentName = "";
		var j = 0;
		scope.FloorMesh.position.z = scope.FloorMesh.position.z - Math.cos(0.25 * t) * parseInt(scope.FloorMesh.name) * 12; // 0.5
		if ( scope.moveTimes > 180  &&  scope.moveTimes <= 539)
		{
			t = Math.PI/180 * (scope.moveTimes - 180)
			for ( var i = 0; i < scope.FloorMesh.children.length; i++)
			{
				var roomName = scope.FloorMesh.children[i].name.split("-")[0];
				var object = scope.FloorMesh.children[i];
							
				if ( currentName != roomName ) // нашли другую комнату ...
				{
					j = 0;
					currentName = roomName;
					object.position.x = object.position.x + Math.cos(0.5 * t) * i;
					object.position.y = object.position.y + Math.cos(0.5 * t) * i * 2;
					j++;
				}
				else // объекты одной и той же комнаты
				{
					object.position.x = object.position.x + Math.cos(0.5 * t) * (i - j);
					object.position.y = object.position.y + Math.cos(0.5 * t) * (i - j) * 2;
					j++;
				}
			}
		}
		
		if ( scope.moveTimes <= 718 ) // 88 //358
			requestAnimationFrame(function() { move(); });
		else 
		{
			scope.moveTimes = 0;
		}
		
		
		// setTimeout(function() {
			 // var startTime = (new Date()).getTime();
			 // requestAnimationFrame(chaos); requestAnimationFrame(chaos)
		// }, 20);

	}
	// test event function
	function rotate()
	{
		scope.FloorMesh.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/180 ); //1 градус
		scope.rotateTimes ++;
		if ( scope.rotateTimes <= 359 )
			requestAnimationFrame(rotate);
		else  
		{
			scope.rotateTimes = 0;
			scope.FloorMesh.rotation.y = 0;
		}
	}
	
    Init(data);	
    AttachEvents();
	
    function Init(data)
    {
        //scope.FloorMesh = DataToFloor(data);
		//scope.FloorMesh = SmartDataToFloor(data);
        scope.FloorMesh = new THREE.Object3D();
        scope.OnlyWallMeshes = []; // for perfomance cases in updateFloor ( decrease number of objects to look for in Ray Vector )
		scope.FloorMesh.name = scope.number;
		
		for ( var i = 0; i < data.Rooms.length; i++ )
		{
			object = data.Rooms[i];
			CalculateObjects( data, object );
			Build( data, object, scope.FloorMesh );
		}	
					
		IndoorNavigation.mainScene.add(scope.FloorMesh);
		
		// var centroid = compute2DPolygonCentroid(FillVertexArray(data, data.Construction[1]));
		// var Point = new THREE.Mesh(
                // new THREE.SphereGeometry(30, 16, 8),
                // new THREE.MeshBasicMaterial({ color: 0xff87af }));				
		// Point.position.set(centroid.x,centroid.y,centroid.z);
		// IndoorNavigation.mainScene.add(Point);
    }

	function CalculateObjects( data, object )
	{	
		FillVertexArray( data, object );
			
		// sort by reduction for deleting
		data.Objects.sort( function(a, b) { return b.usedFace.number - a.usedFace.number } );
		
		var foundObjects = [];
		// check objects for this rooms/construction
		for (var i = 0; i < data.Objects.length; i++)
		{
			// first lets save points which used for face where object's face should be cut
			if ( object.name == data.Objects[i].usedFace.objectName )
			{	
				var num = data.Objects[i].usedFace.number;
				foundObjects.push( { "number" : i,  "point1" : object.vertex[object.face[num][0]].clone() , "point1vertexNum" : object.face[num][0],
													"point2" : object.vertex[object.face[num][1]].clone() , "point2vertexNum" : object.face[num][1],
													"point3" : object.vertex[object.face[num][2]].clone() , "point3vertexNum" : object.face[num][2],
													"point4" : object.vertex[object.face[num][3]].clone() , "point4vertexNum" : object.face[num][3] } );
			}
		}
		
		// we saved initial points, now we can scale vertexes
		ScaleVertexArray( data, object );
		
		if ( foundObjects.length == 0 ) return;
						
		// delete faces
		var previousFacenum = data.Objects[foundObjects[0].number].usedFace.number;
		for (var i = 0; i < foundObjects.length; i++)
		{
			var num = data.Objects[foundObjects[i].number].usedFace.number;
			if ( i > 0 ) {
				if ( num != previousFacenum) object.face.splice( num, 1 ); }
			else object.face.splice( num, 1 );
			previousFacenum = num;
		}
		
		var vertexesforNewFaces  = []; // used when building faces while looking intersect points
		var previousFace = data.Objects[foundObjects[0].number].usedFace.number;
		var changedFace = false;
		var cutBotEdges = [];
		var cutTopEdges = [];
		var deleteBot = -1;
		var deleteTop = -1;
		// build vertexes for object's face			
		for (var i = 0; i < foundObjects.length; i++) //foundObjects.length
		{
			var usedObject = data.Objects[foundObjects[i].number];			
						
			var p0 = foundObjects[i].point1;
			var p1 = foundObjects[i].point2;
			var p2 = foundObjects[i].point3;
			var p3 = foundObjects[i].point4;
														
			// Y0 position, vector bottom -> top 
			var direction1 = new THREE.Vector3().subVectors(p3,p0);
			var p0_scalarY = (usedObject.center.y - usedObject.size.height/2) / direction1.length();
			var point0 = new THREE.Vector3().addVectors(p0, direction1.multiplyScalar(p0_scalarY));			
			
			//test
			//object.vertex.push( point0.clone().multiplyScalar(data.Parameters.Unit));
			
			// Y1 position, vector bottom -> top 
			var direction2 = new THREE.Vector3().subVectors(p2,p1);
			var p1_scalarY = (usedObject.center.y - usedObject.size.height/2) / direction2.length();
			var point1 = new THREE.Vector3().addVectors(p1, direction2.multiplyScalar(p1_scalarY));	
			
			//test
			//object.vertex.push( point1.clone().multiplyScalar(data.Parameters.Unit));			
			
			var direction3 = new THREE.Vector3().subVectors(point1, point0);

			var p0_scalarX = ( direction3.length() - (usedObject.center.x + usedObject.size.width/2)) / direction3.length();
			var p1_scalarX = (usedObject.center.x - usedObject.size.width/2) / direction3.length();
			
			// X0 position, vector right -> left
			var fin_point0 = new THREE.Vector3().addVectors(point0, direction3.clone().multiplyScalar(p0_scalarX));
			object.vertex.push(new THREE.Vector3( fin_point0.x,
										          fin_point0.y,
										          fin_point0.z ).multiplyScalar(data.Parameters.Unit));
												  // write down point and its positions in object.vertex Array, so then we cal build faces...
												  vertexesforNewFaces.push([fin_point0, object.vertex.length - 1]);
			// X1 position, vector left -> right
			var fin_point1 = new THREE.Vector3().subVectors(point1, direction3.clone().multiplyScalar(p1_scalarX));
			object.vertex.push(new THREE.Vector3( fin_point1.x,
												  fin_point1.y,
												  fin_point1.z ).multiplyScalar(data.Parameters.Unit));
												  vertexesforNewFaces.push([fin_point1, object.vertex.length - 1]);
			
			// Y3 position, vector top -> bottom 
			var direction4 = new THREE.Vector3().subVectors(p0,p3);
			var p2_scalarY = (direction4.length() - (usedObject.center.y + usedObject.size.height/2)) / direction4.length();
			var point3 = new THREE.Vector3().addVectors(p3, direction4.multiplyScalar(p2_scalarY));
			
			//test
			//object.vertex.push( point3.clone().multiplyScalar(data.Parameters.Unit));
			
			// Y2 position, vector top -> bottom 
			var direction5 = new THREE.Vector3().subVectors(p1,p2);
			var p3_scalarY = (direction5.length() - (usedObject.center.y + usedObject.size.height/2)) / direction5.length();
			var point2 = new THREE.Vector3().addVectors(p2, direction5.multiplyScalar(p3_scalarY));

			//test
			//object.vertex.push( point2.clone().multiplyScalar(data.Parameters.Unit));
			//object.edge.push([object.vertex.length - 2,object.vertex.length - 1]);
			
			var direction6 = new THREE.Vector3().subVectors(point2, point3);

			var p2_scalarX = ( direction3.length() - (usedObject.center.x + usedObject.size.width/2)) / direction3.length();
			var p3_scalarX = (usedObject.center.x - usedObject.size.width/2) / direction3.length();
			
			// X3 position, vector right -> left
			var fin_point3 = new THREE.Vector3().addVectors(point3, direction6.clone().multiplyScalar(p2_scalarX));
			object.vertex.push(new THREE.Vector3( fin_point3.x,
											      fin_point3.y,
											      fin_point3.z ).multiplyScalar(data.Parameters.Unit));
												  vertexesforNewFaces.push([fin_point3, object.vertex.length - 1]);
			
			// X2 position, vector left -> right
			var fin_point2 = new THREE.Vector3().subVectors(point2, direction6.clone().multiplyScalar(p3_scalarX));
			object.vertex.push(new THREE.Vector3( fin_point2.x,
										          fin_point2.y,
										          fin_point2.z ).multiplyScalar(data.Parameters.Unit));	
												  vertexesforNewFaces.push([fin_point2, object.vertex.length - 1]);
			
			//object.face.push([object.vertex.length - 4, object.vertex.length - 3, object.vertex.length - 1, object.vertex.length - 2 ]);
			
			// окей смысл такой:
			// идем по объектам и сравниваниваем лица с i == 1 т.к. previousFace == нулевому объекту и первую проверку он не пройдет все равно
			// если скаляры равны 0 то загоняем предварительные грани в массив и редактируем концы соответсвенно, если скаляры больше 0 то добавляем точки просто
			// как только меняется лицо, то производим создание всех граней и обнуляем массивы для последующих лиц...
			if ( previousFace != usedObject.usedFace.number ) 
				{ changedFace = true; previousFace = usedObject.usedFace.number; }
			if (changedFace)
			{
				changedFace = false;
				if ( deleteBot != -1 ) { object.edge.splice( deleteBot, 1 ); }
				for ( var q = 0 ; q< cutBotEdges.length; q++)
				{
					object.edge.push([cutBotEdges[q][0],cutBotEdges[q][1]]);
					//testEdge(object.vertex[cutBotEdges[q][0]],object.vertex[cutBotEdges[q][1]]);
				}
				cutBotEdges.length = 0;
				if (  deleteBot != -1 && deleteBot < deleteTop ) deleteTop--;
				if ( deleteTop != -1 ) { object.edge.splice( deleteTop, 1 ); }
				for ( var q1 = 0 ; q1< cutTopEdges.length; q1++)
				{
					object.edge.push([cutTopEdges[q1][0],cutTopEdges[q1][1]]);
					//testEdge(object.vertex[cutTopEdges[q1][0]],object.vertex[cutTopEdges[q1][1]]);
				}
				cutTopEdges.length = 0;
				deleteBot = -1; deleteTop = -1;
			}

			var zerobottom = false;
			var zerotop = false;
			if ( p0_scalarY == 0  && p1_scalarY == 0 ) 
				for (var k = 0; k< object.edge.length; k++)
				{
					var index0 = object.edge[k][0];
					var index1 = object.edge[k][1];

					if( (index0 == foundObjects[i].point1vertexNum && index1 == foundObjects[i].point2vertexNum) || 
						(index0 == foundObjects[i].point2vertexNum && index1 == foundObjects[i].point1vertexNum))
						{
							if ( cutBotEdges.length == 0 ){
								deleteBot = k;
								cutBotEdges.push( [index0, object.vertex.length - 4],[object.vertex.length - 3,index1] ); }
							else 
							{
								cutBotEdges[cutBotEdges.length - 1][1] = object.vertex.length - 4;
								cutBotEdges.push([object.vertex.length - 3,index1]); }						
							zerobottom = true;

						}						
				}
			else { // build |_|
				object.edge.push( [object.vertex.length - 2, object.vertex.length - 4],
								  [object.vertex.length - 4, object.vertex.length - 3],
								  [object.vertex.length - 3, object.vertex.length - 1] );
			}
			
			if ( p2_scalarY == 0  && p3_scalarY == 0 ) 
				for (var k = 0; k< object.edge.length; k++)
				{
					var index0 = object.edge[k][0];
					var index1 = object.edge[k][1];

					if( (index0 == foundObjects[i].point3vertexNum && index1 == foundObjects[i].point4vertexNum) || 
						(index0 == foundObjects[i].point4vertexNum && index1 == foundObjects[i].point3vertexNum))
						{
							if ( cutTopEdges.length == 0 ){
								deleteTop = k;
								cutTopEdges.push( [index1, object.vertex.length - 2],[ object.vertex.length - 1, index0 ] ); }
							else 
							{
								cutTopEdges[cutTopEdges.length - 1][1] = object.vertex.length - 2;
								cutTopEdges.push([object.vertex.length - 1, index0]); }
							zerotop = true;
						}
				}
			
			if ( zerobottom  && !zerotop ){ object.edge.push( [object.vertex.length - 2, object.vertex.length - 4],
															  [object.vertex.length - 2, object.vertex.length - 1],
															  [object.vertex.length - 3, object.vertex.length - 1] ); }
			if ( zerobottom && zerotop ) {	object.edge.push( [object.vertex.length - 2, object.vertex.length - 4],
															  [object.vertex.length - 3, object.vertex.length - 1] ); }
			if ( !zerobottom && !zerotop ) { 
				object.edge.push( [object.vertex.length - 2, object.vertex.length - 1] ); }					
			
			/*TODO : поидее еще нужна проверка на боковые грани по ScalarX ... но пока не буду делать, думаю не очень сильно нужно
			
			var botVector = new THREE.Vector3().subVectors(p1,p0);
						
			var distanceVector = new THREE.Vector3( usedObject.center.x, usedObject.center.y, usedObject.center.z );
			var projectedBot = distanceVector.clone().projectOnVector( botVector );
			
			var angle = botVector.angleTo(distanceVector);
			var distanceRight = Math.cos(angle) * projectedBot.length();
						
			// if y = 0 || y = height ( 2.5) = intersected  = > delete edge ... 
			var v2 = new THREE.Vector3(foundObjects[i].point2.x, usedObject.center.y - usedObject.size.height/2, foundObjects[i].point2.z );
			var v1 = new THREE.Vector3(foundObjects[i].point1.x, usedObject.center.y - usedObject.size.height/2, foundObjects[i].point1.z );
			botVector.subVectors(v2,v1);*/					
		}			
		
		// осуществялем последние грани, т.к. лицо уже не поменяется а прогресс, записанный в массивах надо отобразить
		if ( deleteBot != -1 ) { object.edge.splice( deleteBot, 1 ); }
		if (cutBotEdges.length != 0)
		for ( var i = 0 ; i< cutBotEdges.length; i++)
		{
			object.edge.push([cutBotEdges[i][0],cutBotEdges[i][1]]);
			//testEdge(object.vertex[cutBotEdges[i][0]],object.vertex[cutBotEdges[i][1]]);
		}
		if (  deleteBot != -1 && deleteBot < deleteTop ) deleteTop--; //если точка раньше то нужно сместить на 1 влево
		if ( deleteTop != -1 ) { object.edge.splice( deleteTop, 1 ); }
		if (cutTopEdges.length != 0)
		for ( var i = 0 ; i< cutTopEdges.length; i++)
		{
			object.edge.push([cutTopEdges[i][0],cutTopEdges[i][1]]);
			//testEdge(object.vertex[cutTopEdges[i][0]],object.vertex[cutTopEdges[i][1]]);
		}
		
		//TODO: убрать дубликаты foundObjects
		var trash = 0; // тут храним кол-во точек, которые не надо отображать
		
		// create new faces
		for( var i = 0; i < foundObjects.length; i++) // сделать foundobjects без дубликатов
		{
			var faceNumber = data.Objects[foundObjects[i].number].usedFace.number;
			
			var objectsArray = [];
			// lets count objects which situated on the current face
			for( var j = 0; j < foundObjects.length; j++)
			{
				if ( data.Objects[foundObjects[j].number].usedFace.number == faceNumber )
					objectsArray.push(data.Objects[foundObjects[j].number]);
			}
			
			objectsArray.sort( function(a, b) { return (b.center.y + b.size.height/2) - (a.center.y + a.size.height/2) } ); // по высоте в порядке убывания			
			var ScalarsY = []; // 8 * objects
			var ScalarsX = [];
			
			var p0 = foundObjects[i].point1;
			var p1 = foundObjects[i].point2;
			var p2 = foundObjects[i].point3;
			var p3 = foundObjects[i].point4;
			
			// Y3 position, vector top -> bottom 
			var direction1 = new THREE.Vector3().subVectors(p0,p3);
			// Y2 position, vector top -> bottom 
			var direction2 = new THREE.Vector3().subVectors(p1,p2);
			
			
			var direction3 = new THREE.Vector3().subVectors(p0, p1);						
			var direction4 = new THREE.Vector3().subVectors(p3, p2);
					
			//lets write down all scalars...
			for ( var k = 0; k < objectsArray.length; k ++ )
			{
				var p0_scalarY = (direction1.length() - (objectsArray[k].center.y - objectsArray[k].size.height/2)) / direction1.length();
				var p1_scalarY = (direction2.length() - (objectsArray[k].center.y - objectsArray[k].size.height/2)) / direction2.length();
				var p2_scalarY = (direction2.length() - (objectsArray[k].center.y + objectsArray[k].size.height/2)) / direction2.length();
				var p3_scalarY = (direction1.length() - (objectsArray[k].center.y + objectsArray[k].size.height/2)) / direction1.length();
				
				var p0_scalarX = ( objectsArray[k].center.x + objectsArray[k].size.width/2 ) / direction3.length();
				var p1_scalarX = ( objectsArray[k].center.x - objectsArray[k].size.width/2) / direction3.length();
				var p2_scalarX = ( objectsArray[k].center.x - objectsArray[k].size.width/2) / direction4.length();
				var p3_scalarX = ( objectsArray[k].center.x + objectsArray[k].size.width/2) / direction3.length();
				
				// dont write Y scalars == 0 which on edges
				if ( p0_scalarY == 1 || p1_scalarY == 1 )
					ScalarsY.push( [p2_scalarY, p3_scalarY] );
				else				
					if ( p2_scalarY == 0 || p3_scalarY == 0 )
						ScalarsY.push( [p0_scalarY, p1_scalarY] );
					else 
						ScalarsY.push( [p0_scalarY, p1_scalarY], [p2_scalarY, p3_scalarY] );
						
				//ScalarsY.push( [p0_scalarY, p1_scalarY], [p2_scalarY, p3_scalarY] );
				ScalarsX.push( [p0_scalarX, p3_scalarX], [p1_scalarX, p2_scalarX] );
				// if last element we need to write down scalar 1, so the wall faces will be finished in later For( var ... cycle)
				if ( k == objectsArray.length - 1) { ScalarsX.push( [1, 1] ); ScalarsY.push( [1, 1] ); }
				
			}
			
			// sort by increasing
			ScalarsY.sort( function(a, b) { return (a[0] < b[0] && a[1] < b[1]) ? -1: ((a[0] > b[0] && a[1] > b[1]) ? 1 : 0 ) });
			// sort by increasing
			ScalarsX.sort( function(a, b) { return (a[0] < b[0] && a[1] < b[1]) ? -1: ((a[0] > b[0] && a[1] > b[1]) ? 1 : 0 ) });
			
			// lets put Y points on edges ( for test )
			for ( var p = 0; p < ScalarsY.length; p+=2)
			{
				var point0 = new THREE.Vector3().addVectors(p3, direction1.clone().multiplyScalar(ScalarsY[p][0]));
				var point1 = new THREE.Vector3().addVectors(p2, direction2.clone().multiplyScalar(ScalarsY[p][1]));
				
				var point2, point3, good = false;
				if ( typeof(ScalarsY[p + 1])!='undefined' )
				{				
					var point2 = new THREE.Vector3().addVectors(p2, direction2.clone().multiplyScalar(ScalarsY[p + 1][0]));
					var point3 = new THREE.Vector3().addVectors(p3, direction1.clone().multiplyScalar(ScalarsY[p + 1][1]));
					good = true;
				}
				
				// object.vertex.push(new THREE.Vector3( point0.x,
													  // point0.y,
													  // point0.z ).multiplyScalar(data.Parameters.Unit),
													  // new THREE.Vector3( point1.x,
													  // point1.y,
													  // point1.z ).multiplyScalar(data.Parameters.Unit));
				// if (good)
				// object.vertex.push(new THREE.Vector3( point2.x,
													  // point2.y,
													  // point2.z ).multiplyScalar(data.Parameters.Unit),
													  // new THREE.Vector3( point3.x,
													  // point3.y,
													  // point3.z ).multiplyScalar(data.Parameters.Unit));
				//object.edge.push([object.vertex.length - 4,object.vertex.length - 3 ],[object.vertex.length - 2,object.vertex.length - 1 ]);
			}
			
			// lets put X points on edges ( for test )
			for ( var p = 0; p < ScalarsX.length - 1; p+=2)
			{
				var point0 = new THREE.Vector3().addVectors(p1, direction3.clone().multiplyScalar(ScalarsX[p][0]));
				var point1 = new THREE.Vector3().addVectors(p1, direction3.clone().multiplyScalar(ScalarsX[p + 1][0]));					
				var point2 = new THREE.Vector3().addVectors(p2, direction4.clone().multiplyScalar(ScalarsX[p + 1][1]));
				var point3 = new THREE.Vector3().addVectors(p2, direction4.clone().multiplyScalar(ScalarsX[p][1]));
				
				// object.vertex.push(new THREE.Vector3( point0.x,
													  // point0.y,
													  // point0.z ).multiplyScalar(data.Parameters.Unit),
													  // new THREE.Vector3( point1.x,
													  // point1.y,
													  // point1.z ).multiplyScalar(data.Parameters.Unit),
													  // new THREE.Vector3( point2.x,
													  // point2.y,
													  // point2.z ).multiplyScalar(data.Parameters.Unit),
													  // new THREE.Vector3( point3.x,
													  // point3.y,
													  // point3.z ).multiplyScalar(data.Parameters.Unit));
				//object.edge.push([object.vertex.length - 4,object.vertex.length - 1 ],[object.vertex.length - 2,object.vertex.length - 3 ]);
			}
			
			// lets create intersect points ( for test )
			for( var m = 0; m < ScalarsY.length; m++ )
			{
				var point0 = new THREE.Vector3().addVectors(p3, direction1.clone().multiplyScalar(ScalarsY[m][0]));
				var point1 = new THREE.Vector3().addVectors(p2, direction2.clone().multiplyScalar(ScalarsY[m][1]));				
					
				for ( var j = 0; j < ScalarsX.length; j++ )
				{
					var point2 = new THREE.Vector3().addVectors(p1, direction3.clone().multiplyScalar(ScalarsX[j][0]));
					var point3 = new THREE.Vector3().addVectors(p2, direction4.clone().multiplyScalar(ScalarsX[j][1]));
					//vectorsIntersect(point0,point1,point2,point3);
				}
			}
			
			//finally use 2 vectors and build faces
			for ( var p = 0; p < ScalarsY.length; p++) //ScalarsY.length
			{
				var topVector, pointYrightTop , pointYleftTop,
					lowerVector, pointYrightLow , pointYleftLow;
					
				if ( p == 0 )
				{
					//topVector = direction4.clone();
					pointYrightTop = p3;
					pointYleftTop = p2;
				}
				else
				{ // use higher vector
					pointYrightTop = new THREE.Vector3().addVectors(p3, direction1.clone().multiplyScalar(ScalarsY[p-1][0]));
					pointYleftTop = new THREE.Vector3().addVectors(p2, direction2.clone().multiplyScalar(ScalarsY[p-1][1]));
					topVector = new THREE.Vector3().subVectors(pointYrightTop, pointYleftTop);
				}
				
				var pointYrightLow = new THREE.Vector3().addVectors(p3, direction1.clone().multiplyScalar(ScalarsY[p][0]));
				var pointYleftLow = new THREE.Vector3().addVectors(p2, direction2.clone().multiplyScalar(ScalarsY[p][1]));
				
				lowerVector = new THREE.Vector3().subVectors(pointYrightLow, pointYleftLow);
				
				var counter = 0; // how many points found equal 
				var notFinalFace = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
				var N = ScalarsX.length;
				//ok, we got top and bot vector , now lets check all X scalars and find intersections in order to build biggest as possible faces...
				for ( var h = 0; h < N; h++ )
				{
					var pointBot = new THREE.Vector3().addVectors(p1, direction3.clone().multiplyScalar(ScalarsX[h][0]));
					var pointTop = new THREE.Vector3().addVectors(p2, direction4.clone().multiplyScalar(ScalarsX[h][1]));
					
					var pointTopIntersect = vectorsIntersect2(pointYleftTop, pointYrightTop, pointTop, pointBot);
					var pointLowIntersect = vectorsIntersect2(pointYleftLow, pointYrightLow, pointTop, pointBot);
					
					var numberI = -1, numberJ = -1;
					var result = false;
					// lets find how many points equal vectors intersection points
					for ( var b = 0; b < vertexesforNewFaces.length; b++)
					{						
						var point = vertexesforNewFaces[b][0];
						var itsposition = vertexesforNewFaces[b][1];
						
						if (PointsAlmostEqual(pointTopIntersect,point))
							{ counter++; numberI = b; continue;}
							//testVertex2(pointTopIntersect.multiplyScalar(100));
						if (PointsAlmostEqual(pointLowIntersect,point))
							{ counter++; numberJ = b; }
							//testVertex2(pointLowIntersect.multiplyScalar(100));
					}
					// make correction, check if those points belongs to some vertical edge of object ( foundObjects vertexes => vertexesforNewFaces)
					switch(counter)
					{	
						case 0: //check both intersections points cause they both == -1
							for ( var b = 0; b < vertexesforNewFaces.length; b++)
							{	
								// 0 2, 1,3  - next 4,6, 5,7 ...
								if ( b != 0 && b % 2 == 0 ) b += 2;
								if ( b >=  vertexesforNewFaces.length ) break;
								var point1 = vertexesforNewFaces[b][0];
								var point2 = vertexesforNewFaces[b + 2][0];
								
								if (IsPointOnLineSegment(point1, point2, pointTopIntersect))
									counter++; 
								if (IsPointOnLineSegment(point1, point2, pointLowIntersect))
									counter++;
							}	break;		 																				
						case 1: //check only that with -1
							for ( var b = 0; b < vertexesforNewFaces.length; b++)
							{	
								if ( b != 0 && b % 2 == 0 ) b += 2;
								if ( b >=  vertexesforNewFaces.length ) break;
								var point1 = vertexesforNewFaces[b][0];
								var point2 = vertexesforNewFaces[b + 2][0];
								
								if(numberI < 0)
									if (IsPointOnLineSegment(point1, point2, pointTopIntersect))
										counter++; 
								if(numberJ < 0)	
									if (IsPointOnLineSegment(point1, point2, pointLowIntersect))
										counter++;
							}	break;
						//continue
						case 2: break;
					}
										
					switch(counter)
					{	//move forward
						case 0: notFinalFace[0].set( pointLowIntersect.x, pointLowIntersect.y, pointLowIntersect.z );
								notFinalFace[3].set( pointTopIntersect.x, pointTopIntersect.y, pointTopIntersect.z ); break;				
						// check if 2line cross side vector of object not in object vertex points. If true = finish face and skip to next , else continue 
						case 1: 
								// testVertex2(new THREE.Vector3( pointLowIntersect.x,pointLowIntersect.y,pointLowIntersect.z ).multiplyScalar(data.Parameters.Unit));
								// testVertex2(new THREE.Vector3( pointTopIntersect.x,pointTopIntersect.y,pointTopIntersect.z ).multiplyScalar(data.Parameters.Unit));								
								// testVertex2(pointYleftTop.multiplyScalar(data.Parameters.Unit));
								// testVertex2(pointYleftLow.multiplyScalar(data.Parameters.Unit));
								if ( numberI > 0 )									
									result  = IsPointOnLineSegment(vertexesforNewFaces[numberI], vertexesforNewFaces[numberI - 1], pointLowIntersect );
								if ( numberJ > 0 )
									result  = IsPointOnLineSegment(vertexesforNewFaces[numberJ], vertexesforNewFaces[numberJ  - 2], pointTopIntersect );
									
								if (result) // means point on the line => finish face && create new
								{	
									notFinalFace[0].set( pointLowIntersect.x, pointLowIntersect.y, pointLowIntersect.z );
									notFinalFace[1].set( pointYleftLow.x, pointYleftLow.y, pointYleftLow.z );
									notFinalFace[2].set( pointYleftTop.x, pointYleftTop.y, pointYleftTop.z );
									notFinalFace[3].set( pointTopIntersect.x, pointTopIntersect.y, pointTopIntersect.z );
									
									object.vertex.push( notFinalFace[0].multiplyScalar(data.Parameters.Unit),
														notFinalFace[1].multiplyScalar(data.Parameters.Unit),
														notFinalFace[2].multiplyScalar(data.Parameters.Unit),
														notFinalFace[3].multiplyScalar(data.Parameters.Unit));
									trash += 4;		
									object.face.push([object.vertex.length - 4, object.vertex.length - 3, object.vertex.length - 2, object.vertex.length - 1]);
									counter = 0;
									// so we created face , now we need to find first topleft and botleft appropriate points
									var done = false;
									var f = h;
									while(f != ScalarsX.length - 1) // !done
									{	
										f++;
										var pointBot = new THREE.Vector3().addVectors(p1, direction3.clone().multiplyScalar(ScalarsX[f][0]));
										var pointTop = new THREE.Vector3().addVectors(p2, direction4.clone().multiplyScalar(ScalarsX[f][1]));
										
										var pointTopIntersect = vectorsIntersect2(pointYleftTop, pointYrightTop, pointTop, pointBot);
										var pointLowIntersect = vectorsIntersect2(pointYleftLow, pointYrightLow, pointTop, pointBot);
										
										var numberI = -1, numberJ = -1;
										var result = false;
										// lets find how many points equal vectors intersection points
										for ( var b = 0; b < vertexesforNewFaces.length; b++)
										{						
											var point = vertexesforNewFaces[b][0];
											var itsposition = vertexesforNewFaces[b][1];
											
											if (PointsAlmostEqual(pointTopIntersect,point))
												{ counter++; numberI = b; continue;}
												//testVertex2(pointTopIntersect.multiplyScalar(100));
											if (PointsAlmostEqual(pointLowIntersect,point))
												{ counter++; numberJ = b; }
												//testVertex2(pointLowIntersect.multiplyScalar(100));
										}
										if (numberI > 0 || numberJ > 0){
											pointYleftTop = pointTopIntersect.clone();
											pointYleftLow = pointLowIntersect.clone();
											notFinalFace[1].set( pointYleftLow.x, pointYleftLow.y, pointYleftLow.z );
											notFinalFace[2].set( pointYleftTop.x, pointYleftTop.y, pointYleftTop.z );
											done = true;
											h = f;//+ 1;
											break;
										}
										counter = 0;
									}
																		
								}
								else {
									notFinalFace[0].set( pointLowIntersect.x, pointLowIntersect.y, pointLowIntersect.z );
									notFinalFace[1].set( pointYleftLow.x, pointYleftLow.y, pointYleftLow.z );
									notFinalFace[2].set( pointYleftTop.x, pointYleftTop.y, pointYleftTop.z );
									notFinalFace[3].set( pointTopIntersect.x, pointTopIntersect.y, pointTopIntersect.z );
									counter = 0;
								}
								
								break;
						//finish face and skip to next
						case 2:  
								notFinalFace[0].set( pointLowIntersect.x, pointLowIntersect.y, pointLowIntersect.z );
								notFinalFace[1].set( pointYleftLow.x, pointYleftLow.y, pointYleftLow.z );
								notFinalFace[2].set( pointYleftTop.x, pointYleftTop.y, pointYleftTop.z );
								notFinalFace[3].set( pointTopIntersect.x, pointTopIntersect.y, pointTopIntersect.z );
								
								object.vertex.push( notFinalFace[0].clone().multiplyScalar(data.Parameters.Unit),
													notFinalFace[1].clone().multiplyScalar(data.Parameters.Unit),
													notFinalFace[2].clone().multiplyScalar(data.Parameters.Unit),
													notFinalFace[3].clone().multiplyScalar(data.Parameters.Unit));
										
								object.face.push([object.vertex.length - 4, object.vertex.length - 3, object.vertex.length - 2, object.vertex.length - 1]);
								counter = 0;
								trash += 4;
								// so we created face , now we need to find first topleft and botleft appropriate points
								var done = false;
								var f = h;
								while(f != ScalarsX.length - 1) // !done
								{	
									f++;
									var pointBot = new THREE.Vector3().addVectors(p1, direction3.clone().multiplyScalar(ScalarsX[f][0]));
									var pointTop = new THREE.Vector3().addVectors(p2, direction4.clone().multiplyScalar(ScalarsX[f][1]));
									
									var pointTopIntersect = vectorsIntersect2(pointYleftTop, pointYrightTop, pointTop, pointBot);
									var pointLowIntersect = vectorsIntersect2(pointYleftLow, pointYrightLow, pointTop, pointBot);
									
									var numberI = -1, numberJ = -1;
									var result = false;
									// lets find how many points equal vectors intersection points
									for ( var b = 0; b < vertexesforNewFaces.length; b++)
									{	
										var point = vertexesforNewFaces[b][0];
										var itsposition = vertexesforNewFaces[b][1];
										
										if (PointsAlmostEqual(pointTopIntersect,point))
											{ counter++; numberI = b; continue;}
											//testVertex2(pointTopIntersect.multiplyScalar(100));
										if (PointsAlmostEqual(pointLowIntersect,point))
											{ counter++; numberJ = b; }
											//testVertex2(pointLowIntersect.multiplyScalar(100));
									}
									
									// same operation as in beggining... so face can finish even with no vertex found
									switch(counter)
									{	
										case 0: //check both intersections points
											for ( var b = 0; b < vertexesforNewFaces.length; b++)
											{	
												if ( b != 0 && b % 2 == 0 ) b += 2;
												if ( b >=  vertexesforNewFaces.length ) break;
												var point1 = vertexesforNewFaces[b][0];
												var point2 = vertexesforNewFaces[b + 2][0];
												
												if (IsPointOnLineSegment(point1, point2, pointTopIntersect))
													counter++; 
												if (IsPointOnLineSegment(point1, point2, pointLowIntersect))
													counter++;
											}	break;		 																				
										case 1: //check only that with -1
											for ( var b = 0; b < vertexesforNewFaces.length; b++)
											{	
												if ( b != 0 && b % 2 == 0 ) b += 2;
												if ( b >= vertexesforNewFaces.length ) break;
												var point1 = vertexesforNewFaces[b][0];
												var point2 = vertexesforNewFaces[b + 2][0];
												
												if(numberI < 0)
													if (IsPointOnLineSegment(point1, point2, pointTopIntersect))
														counter++; 
												if(numberJ < 0)	
													if (IsPointOnLineSegment(point1, point2, pointLowIntersect))
														counter++;
											}	break;
										//continue
										case 2: break;
									}
									
									if (counter == 2){
										pointYleftTop = pointTopIntersect.clone();
										pointYleftLow = pointLowIntersect.clone();
										notFinalFace[1].set( pointYleftLow.x, pointYleftLow.y, pointYleftLow.z );
										notFinalFace[2].set( pointYleftTop.x, pointYleftTop.y, pointYleftTop.z );
										done = true;
										h = f;
										break;
									}
								}																		

								counter = 0; break;
					}
										
					if( counter == 0 && h ==  N - 1)
					{		
						object.vertex.push( notFinalFace[0].multiplyScalar(data.Parameters.Unit),
											notFinalFace[1].multiplyScalar(data.Parameters.Unit),
											notFinalFace[2].multiplyScalar(data.Parameters.Unit),
											notFinalFace[3].multiplyScalar(data.Parameters.Unit));
						trash += 4;				
						object.face.push([object.vertex.length - 4, object.vertex.length - 3, object.vertex.length - 2, object.vertex.length - 1]);
					}
				}											
			}
										
		}
		
		//TODO: delete duplicate vertexes and refill faces...
		object.trashVertexes = trash;
		
	}	
		
	function Build( data, object, AllMeshes )
	{	
		// convert vertex data to THREE.js vectors
		var vertex = object.vertex;
		
		var tt = false ; // transparent for all materials
		
		if (object.buildArmature)
		{
			var vertexGeometry = new THREE.SphereGeometry(6, 12, 6);
			var vertexMaterial = new THREE.MeshBasicMaterial({ color: object.colors.vertexColor });
			var vertexSingleMesh = new THREE.Mesh(vertexGeometry);

			var trash = 0;
			if( typeof object.trashVertexes != "undefined" || !isNaN(object.trashVertexes))
				var trash = object.trashVertexes;
			// convert vertexes to Points(Spheres)
			var vertexAmalgam = new THREE.Geometry();
			for (var i = 0; i < vertex.length - trash; i++) {
				var vMesh = vertexSingleMesh.clone();
				vMesh.position.set(vertex[i].x, vertex[i].y, vertex[i].z);
				THREE.GeometryUtils.merge(vertexAmalgam, vMesh);		
				//vertexAmalgam.merge(vMesh.geometry);
			}
			
			var vertexMesh = new THREE.Mesh(vertexAmalgam, vertexMaterial);
			vertexMesh.name = object.name + "-vertexMesh";
			AllMeshes.add(vertexMesh);
			
			// check not empty array
			if( typeof object.edge != "undefined") 	{
				
				// convert edge data to Lines(Cylinders)
				var edgeMaterial = new THREE.MeshBasicMaterial({ color: object.colors.edgeColor });
				var edgeAmalgam = new THREE.Geometry();
								
				for (var i = 0; i < object.edge.length; i++) {
					var index0 = object.edge[i][0];
					var index1 = object.edge[i][1];
					var eMesh = cylinderMesh(vertex[index0], vertex[index1], edgeMaterial);
					THREE.GeometryUtils.merge(edgeAmalgam, eMesh);         
				}
				
				var edgeMesh = new THREE.Mesh(edgeAmalgam, edgeMaterial);
				edgeMesh.name = object.name + "-edgeMesh";
				AllMeshes.add(edgeMesh);
			}
		}
		
		if (object.buildWalls) 
		{	
			// convert face data to a single (triangulated) geometry
			var geometry = new THREE.Geometry();
			geometry.vertices = vertex;
			var faceIndex = 0;
			
			for (var faceNum = 0; faceNum < object.face.length; faceNum++) {
				for (var i = 0; i < object.face[faceNum].length - 2; i++) {
					geometry.faces[faceIndex] = new THREE.Face3(object.face[faceNum][0], object.face[faceNum][i + 1], object.face[faceNum][i + 2]);
					geometry.faces[faceIndex].color = new THREE.Color(object.colors.wall); 
					faceIndex++;
				}
			}

			geometry.computeFaceNormals();
			geometry.computeVertexNormals();
			//geometry.computeBoundingBox(); //Remark

			if ( object.materials.outside[0] == true)
			{
				var Obj_side = object.materials.outside[1];
				var Obj_opacity = object.materials.outside[2];
				var faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: Obj_side, transparent: tt, opacity: Obj_opacity });
				faces = new THREE.Mesh(geometry, faceMaterial);
				faces.name = object.name + "-wallMesh";
				faces.scale.multiplyScalar(1.001);
				AllMeshes.add(faces);
				scope.OnlyWallMeshes.push(faces);
			}
			
			if ( object.materials.inside[0] == true)
			{
				var Obj_side = object.materials.outside[1];
				var interiorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: Objside });
				var interiorFaces = new THREE.Mesh(geometry, interiorMaterial);
				interiorFaces.scale.multiplyScalar(0.999);
				AllMeshes.add(interiorFaces);
			}
		}
		
		if (object.buildBottom)
		{
			// convert face data to a single (triangulated) geometry
			var geometry = new THREE.Geometry();
			geometry.vertices = vertex;
			var faceIndex = 0;
			
			for (var faceNum = 0; faceNum < object.botface.length; faceNum++) {
				for (var i = 0; i < object.botface[faceNum].length - 2; i++) {
					geometry.faces[faceIndex] = new THREE.Face3(object.botface[faceNum][0], object.botface[faceNum][i + 1], object.botface[faceNum][i + 2]);
					geometry.faces[faceIndex].color = new THREE.Color(object.colors.bot); 
					faceIndex++;
				}
			}

			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			if ( object.materials.outside[0] == true)
			{
				var Obj_side = object.materials.outside[1];
				var Obj_opacity = object.materials.outside[2];
				var faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: Obj_side, transparent: tt, opacity: Obj_opacity });
				faces = new THREE.Mesh(geometry, faceMaterial);
				faces.name = object.name + "-bottomMesh";
				faces.scale.multiplyScalar(1.001);
				AllMeshes.add(faces);
				scope.OnlyWallMeshes.push(faces);
			}
		}
		
		if (object.buildTop)
		{
			// convert face data to a single (triangulated) geometry
			var geometry = new THREE.Geometry();
			geometry.vertices = vertex;
			var faceIndex = 0;
			
			for (var faceNum = 0; faceNum < object.topface.length; faceNum++) {
				for (var i = 0; i < object.topface[faceNum].length - 2; i++) {
					geometry.faces[faceIndex] = new THREE.Face3(object.topface[faceNum][0], object.topface[faceNum][i + 1], object.topface[faceNum][i + 2]);
					geometry.faces[faceIndex].color = new THREE.Color(object.colors.top); 
					faceIndex++;
				}
			}

			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			if ( object.materials.outside[0] == true)
			{
				var Obj_side = object.materials.outside[1];
				var Obj_opacity = object.materials.outside[2];
				var faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: Obj_side, transparent: tt, opacity: Obj_opacity });
				faces = new THREE.Mesh(geometry, faceMaterial);
				faces.name = object.name + "-topMesh";
				faces.scale.multiplyScalar(1.001);
				AllMeshes.add(faces);
			}
		}		
	}	

    // возможно потом будут какие-нить интерактивные команды...
	function AttachEvents()
	{
		THREE.EventDispatcher.call( scope.FloorMesh );
		scope.rotateTimes = 0; // для вращения
		scope.moveTimes = 0; // для смещения
		scope.FloorMesh.addEventListener('test', function(event) {  
																	rotate();
																	move(); 
																	//alert("GOT THE EVENT");
																	});
	}
	
	//not used
    function DataToFloor(data) {

		var AllMeshes = new THREE.Object3D();
		
		if (data.buildArmature)
		{
			// convert vertex data to THREE.js vectors
			var vertex = []
			for (var i = 0; i < data.vertex.length; i++)
				vertex.push(new THREE.Vector3(data.vertex[i][0], data.vertex[i][1], data.vertex[i][2]).multiplyScalar(100));

			var vertexGeometry = new THREE.SphereGeometry(6, 12, 6);
			var vertexMaterial = new THREE.MeshBasicMaterial({ color: data.vertexColor });//0x222244 });
			var vertexSingleMesh = new THREE.Mesh(vertexGeometry);

			// convert vertexes to Points(Spheres)
			var vertexAmalgam = new THREE.Geometry();
			for (var i = 0; i < data.vertex.length; i++) {
				var vMesh = vertexSingleMesh.clone();
				vMesh.position.set(vertex[i].x, vertex[i].y, vertex[i].z);
				THREE.GeometryUtils.merge(vertexAmalgam, vMesh);		
				//vertexAmalgam.merge(vMesh.geometry);
			}
			var vertexMesh = new THREE.Mesh(vertexAmalgam, vertexMaterial);
			AllMeshes.add(vertexMesh);

			// convert edge data to Lines(Cylinders)
			var edgeMaterial = new THREE.MeshBasicMaterial({ color: data.edgeColor });//0x666666 });
			var edgeAmalgam = new THREE.Geometry();
			for (var i = 0; i < data.edge.length; i++) {
				var index0 = data.edge[i][0];
				var index1 = data.edge[i][1];
				var eMesh = cylinderMesh(vertex[index0], vertex[index1], edgeMaterial);
				THREE.GeometryUtils.merge(edgeAmalgam, eMesh);
				//edgeAmalgam.merge(eMesh.geometry, eMesh.matrix);          
			}
			var edgeMesh = new THREE.Mesh(edgeAmalgam, edgeMaterial);
			AllMeshes.add(edgeMesh);
		}
		if (data.buildWalls)
		{
			// convert face data to a single (triangulated) geometry
			var faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.BackSide, transparent: true, opacity: 0.25 }); // front
			var faceColors =
			{
				4: new THREE.Color(data.wallColor) //7f00e1
			};

			var geometry = new THREE.Geometry();
			geometry.vertices = vertex;
			var faceIndex = 0;
			for (var faceNum = 0; faceNum < data.face.length; faceNum++) {
				for (var i = 0; i < data.face[faceNum].length - 2; i++) {
					geometry.faces[faceIndex] = new THREE.Face3(data.face[faceNum][0], data.face[faceNum][i + 1], data.face[faceNum][i + 2]);
					geometry.faces[faceIndex].color = faceColors[data.face[faceNum].length];
					faceIndex++;
				}
			}

			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			faces = new THREE.Mesh(geometry, faceMaterial);
			faces.scale.multiplyScalar(1.001);
			AllMeshes.add(faces);

			var interiorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.FrontSide }); //back
			var interiorFaces = new THREE.Mesh(geometry, interiorMaterial);
			interiorFaces.scale.multiplyScalar(0.999);
			AllMeshes.add(interiorFaces);
		}
		if (data.buildTop)
		{
			
		}
		if (data.buildBottom)
		{
			// convert face data to a single (triangulated) geometry
			var faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.BackSide, transparent: true, opacity: 0.25 }); // front
			var faceColors =
			{
				4: new THREE.Color(data.bottomColor) //7f00e1
			};

			var geometry = new THREE.Geometry();
			geometry.vertices = vertex;
			var faceIndex = 0;
			for (var faceNum = 0; faceNum < data.bottomFaces.length; faceNum++) {
				for (var i = 0; i < data.bottomFaces[faceNum].length - 2; i++) {
					geometry.faces[faceIndex] = new THREE.Face3(data.bottomFaces[faceNum][0], data.bottomFaces[faceNum][i + 1], data.bottomFaces[faceNum][i + 2]);
					geometry.faces[faceIndex].color = faceColors[data.bottomFaces[faceNum].length];
					faceIndex++;
				}
			}

			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			faces = new THREE.Mesh(geometry, faceMaterial);
			faces.scale.multiplyScalar(1.001);
			AllMeshes.add(faces);

			var interiorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.FrontSide }); //back
			var interiorFaces = new THREE.Mesh(geometry, interiorMaterial);
			interiorFaces.scale.multiplyScalar(0.999);
			AllMeshes.add(interiorFaces);
		}
		
        return AllMeshes;
    }
	//not used
	function SmartDataToFloor(data) {

		var AllMeshes = new THREE.Object3D();
		
		// convert vertex data to THREE.js vectors
		var vertex = [];
		
		for( var i = 0; i < 2; i++ )
		{
		
			if(data.Mode.TopCoordsEqualBottom)
			{
				// bottom
				for (var i = 0; i < data.vertex.length; i++)
				{
					vertex.push(new THREE.Vector3(data.vertex[i][0] + data.Parameters.TranslateX,
												  data.vertex[i][1],
												  data.vertex[i][2] + data.Parameters.TranslateZ).multiplyScalar(data.Parameters.Unit));
				}
				// top ( same as bottom ) y + data.Parameters.Height
				for (var i = 0; i < data.vertex.length; i++)
				{
					vertex.push(new THREE.Vector3(data.vertex[i][0] + data.Parameters.TranslateX,
												  data.vertex[i][1] + data.Parameters.Height,
												  data.vertex[i][2] + data.Parameters.TranslateZ).multiplyScalar(data.Parameters.Unit));
				}		
			} else {
				for (var i = 0; i < data.vertex.length; i++)
					vertex.push(new THREE.Vector3(data.vertex[i][0], data.vertex[i][1], data.vertex[i][2]).multiplyScalar(data.Parameters.Unit));
			}			
			if (data.Options.buildArmature)
			{
				var vertexGeometry = new THREE.SphereGeometry(6, 12, 6);
				var vertexMaterial = new THREE.MeshBasicMaterial({ color: data.Colors.vertexColor });
				var vertexSingleMesh = new THREE.Mesh(vertexGeometry);

				// convert vertexes to Points(Spheres)
				var vertexAmalgam = new THREE.Geometry();
				for (var i = 0; i < data.vertex.length; i++) {
					var vMesh = vertexSingleMesh.clone();
					vMesh.position.set(vertex[i].x, vertex[i].y, vertex[i].z);
					THREE.GeometryUtils.merge(vertexAmalgam, vMesh);		
					//vertexAmalgam.merge(vMesh.geometry);
				}
				var vertexMesh = new THREE.Mesh(vertexAmalgam, vertexMaterial);
				AllMeshes.add(vertexMesh);

				// convert edge data to Lines(Cylinders)
				// convert edge data to Lines(Cylinders)
				var edgeMaterial = new THREE.MeshBasicMaterial({ color: data.Colors.edgeColor });//0x666666 });
				var edgeAmalgam = new THREE.Geometry();
				for (var i = 0; i < data.edge.length; i++) {
					var index0 = data.edge[i][0];
					var index1 = data.edge[i][1];
					var eMesh = cylinderMesh(vertex[index0], vertex[index1], edgeMaterial);
					THREE.GeometryUtils.merge(edgeAmalgam, eMesh);
					//edgeAmalgam.merge(eMesh.geometry, eMesh.matrix);          
				}
				var edgeMesh = new THREE.Mesh(edgeAmalgam, edgeMaterial);
				AllMeshes.add(edgeMesh);
			}
			if (data.Options.buildWalls)
			{
				// convert face data to a single (triangulated) geometry
				var faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.BackSide, transparent: true, opacity: 0.25 }); // front
				var faceColors =
				{
					4: new THREE.Color(data.Colors.wallColor) //7f00e1
				};

				var geometry = new THREE.Geometry();
				geometry.vertices = vertex;
				var faceIndex = 0;
				for (var faceNum = 0; faceNum < data.face.length; faceNum++) {
					for (var i = 0; i < data.face[faceNum].length - 2; i++) {
						geometry.faces[faceIndex] = new THREE.Face3(data.face[faceNum][0], data.face[faceNum][i + 1], data.face[faceNum][i + 2]);
						geometry.faces[faceIndex].color = faceColors[data.face[faceNum].length];
						faceIndex++;
					}
				}

				geometry.computeFaceNormals();
				geometry.computeVertexNormals();

				faces = new THREE.Mesh(geometry, faceMaterial);
				faces.scale.multiplyScalar(1.001);
				AllMeshes.add(faces);

				var interiorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.FrontSide }); //back
				var interiorFaces = new THREE.Mesh(geometry, interiorMaterial);
				interiorFaces.scale.multiplyScalar(0.999);
				AllMeshes.add(interiorFaces);
			}
			if (data.Options.buildTop)
			{
				// convert face data to a single (triangulated) geometry
				var faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.BackSide, transparent: true, opacity: 0.25 }); // front
				var faceColors =
				{
					4: new THREE.Color(data.Colors.topColor) //7f00e1
				};

				var geometry = new THREE.Geometry();
				geometry.vertices = vertex;
				var faceIndex = 0;
				for (var faceNum = 0; faceNum < data.topFaces.length; faceNum++) {
					for (var i = 0; i < data.topFaces[faceNum].length - 2; i++) {
						geometry.faces[faceIndex] = new THREE.Face3(data.topFaces[faceNum][0], data.topFaces[faceNum][i + 1], data.topFaces[faceNum][i + 2]);
						geometry.faces[faceIndex].color = faceColors[data.topFaces[faceNum].length];
						faceIndex++;
					}
				}

				geometry.computeFaceNormals();
				geometry.computeVertexNormals();

				faces = new THREE.Mesh(geometry, faceMaterial);
				faces.scale.multiplyScalar(1.001);
				AllMeshes.add(faces);

				var interiorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.FrontSide }); //back
				var interiorFaces = new THREE.Mesh(geometry, interiorMaterial);
				interiorFaces.scale.multiplyScalar(0.999);
				AllMeshes.add(interiorFaces);
			}
			if (data.Options.buildBottom)
			{
			// convert face data to a single (triangulated) geometry
			var faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.BackSide, transparent: true, opacity: 0.25 }); // front
			var faceColors =
			{
				4: new THREE.Color(data.Colors.bottomColor) //7f00e1
			};

			var geometry = new THREE.Geometry();
			geometry.vertices = vertex;
			var faceIndex = 0;
			for (var faceNum = 0; faceNum < data.bottomFaces.length; faceNum++) {
				for (var i = 0; i < data.bottomFaces[faceNum].length - 2; i++) {
					geometry.faces[faceIndex] = new THREE.Face3(data.bottomFaces[faceNum][0], data.bottomFaces[faceNum][i + 1], data.bottomFaces[faceNum][i + 2]);
					geometry.faces[faceIndex].color = faceColors[data.bottomFaces[faceNum].length];
					faceIndex++;
				}
			}

			geometry.computeFaceNormals();
			geometry.computeVertexNormals();

			faces = new THREE.Mesh(geometry, faceMaterial);
			faces.scale.multiplyScalar(1.001);
			AllMeshes.add(faces);

			var interiorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.FrontSide }); //back
			var interiorFaces = new THREE.Mesh(geometry, interiorMaterial);
			interiorFaces.scale.multiplyScalar(0.999);
			AllMeshes.add(interiorFaces);
		}
		
		}
        return AllMeshes;
    }
	
	function testVertex(position)
	{
		var vertexGeometry = new THREE.SphereGeometry(6, 12, 6);
		var vertexMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });		
		var vertexMesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
		vertexMesh.position.set( position.x, position.y, position.z );
		scope.FloorMesh.add(vertexMesh);
	}
	
	function testVertex2(position)
	{
		var vertexGeometry = new THREE.SphereGeometry(6, 12, 6);
		var vertexMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });		
		var vertexMesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
		vertexMesh.position.set( position.x, position.y, position.z );
		scope.FloorMesh.add(vertexMesh);
	}
	
	function testEdge(point1, point2)
	{
		var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });	
		var direction = new THREE.Vector3().subVectors(point2, point1);
        var arrow = new THREE.ArrowHelper(direction.clone().normalize(), point1);
        var rotation = new THREE.Euler().setFromQuaternion(arrow.quaternion);
        var edgeGeometry = new THREE.CylinderGeometry(3, 3, direction.length(), 8, 4);
        var edge = new THREE.Mesh(edgeGeometry, material);
        var position = new THREE.Vector3().addVectors(point1, direction.multiplyScalar(0.5));

        edge.position.set(position.x, position.y, position.z);// = position;
        edge.rotation.set(rotation.x, rotation.y, rotation.z);// = rotation;

		scope.FloorMesh.add(edge);
	}
	
	
	
	// functions - helpers
	function FillVertexArray( data, object )
	{
		var vertex  = [];
		
		var height = data.Parameters.Height;
		
		if(object.TopCoordsEqualBottom)
		{
			if ( typeof object.specialHeight != "undefined" ) height = object.specialHeight;
			// bottom
			for (var i = 0; i < object.vertex.length; i++)
			{
				vertex.push(new THREE.Vector3(object.vertex[i][0] + data.Parameters.TranslateX,
											  object.vertex[i][1] + data.Parameters.TranslateY,
											  object.vertex[i][2] + data.Parameters.TranslateZ));
			}
			// top ( same as bottom ) y + data.Parameters.Height
			for (var i = 0; i < object.vertex.length; i++)
			{
				vertex.push(new THREE.Vector3(object.vertex[i][0] + data.Parameters.TranslateX,
											  object.vertex[i][1] + data.Parameters.TranslateY + height,
											  object.vertex[i][2] + data.Parameters.TranslateZ));
			}		
		} else {
			for (var i = 0; i < object.vertex.length; i++)
				vertex.push(new THREE.Vector3(object.vertex[i][0] + data.Parameters.TranslateX,
											  object.vertex[i][1],
											  object.vertex[i][2] + data.Parameters.TranslateZ));
		}
		
		object.vertex = vertex;
	}
	function ScaleVertexArray( data, object )
	{
		for (var i = 0; i < object.vertex.length; i++)
		{
			object.vertex[i].multiplyScalar(data.Parameters.Unit);
		}		
	}	
	
	function vectorsIntersect( pointA, pointB, pointC, pointD )
	{
		var vectorBA = new THREE.Vector3().subVectors(pointB,pointA);
		var vectorDC = new THREE.Vector3().subVectors(pointD,pointC);
		var vectorCA = new THREE.Vector3().subVectors(pointC,pointA);
		
		var uNumerator = new THREE.Vector3().crossVectors(vectorCA, vectorBA);
		var denominator = new THREE.Vector3().crossVectors(vectorBA,vectorDC);
		
		var u = uNumerator.length() / denominator.length();
		var t = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(pointC,pointA), vectorDC).length() / denominator.length();

		var resultBool = (t >= 0) && (t <= 1) && (u >= 0) && (u <= 1);
		
		var da = new THREE.Vector3().subVectors(pointB,pointA);
		var db = new THREE.Vector3().subVectors(pointD,pointC);
		var dc = new THREE.Vector3().subVectors(pointC,pointA);
		
		var cross_dc_db = new THREE.Vector3().crossVectors(dc,db);
		var cross_da_db = new THREE.Vector3().crossVectors(da,db);
		
			
		var result = cross_dc_db.clone().dot(denominator) / cross_da_db.lengthSq();
		
		var finalresult = new THREE.Vector3().addVectors(pointA, new THREE.Vector3().multiplyVectors(vectorBA,new THREE.Vector3(result,result,result)));
		
		if ( resultBool ) testVertex(finalresult.multiplyScalar(100));		
	}
	
	function vectorsIntersect2( pointA, pointB, pointC, pointD )
	{
		var vectorBA = new THREE.Vector3().subVectors(pointB,pointA);
		var vectorDC = new THREE.Vector3().subVectors(pointD,pointC);
		var vectorCA = new THREE.Vector3().subVectors(pointC,pointA);
		
		var uNumerator = new THREE.Vector3().crossVectors(vectorCA, vectorBA);
		var denominator = new THREE.Vector3().crossVectors(vectorBA,vectorDC);
		
		var u = uNumerator.length() / denominator.length();
		var t = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(pointC,pointA), vectorDC).length() / denominator.length();

		var resultBool = (t >= 0) && (t <= 1) && (u >= 0) && (u <= 1);
		
		var da = new THREE.Vector3().subVectors(pointB,pointA);
		var db = new THREE.Vector3().subVectors(pointD,pointC);
		var dc = new THREE.Vector3().subVectors(pointC,pointA);
		
		var cross_dc_db = new THREE.Vector3().crossVectors(dc,db);
		var cross_da_db = new THREE.Vector3().crossVectors(da,db);
					
		var result = cross_dc_db.clone().dot(denominator) / cross_da_db.lengthSq();
		
		var finalresult = new THREE.Vector3().addVectors(pointA, new THREE.Vector3().multiplyVectors(vectorBA,new THREE.Vector3(result,result,result)));
		
		return finalresult;
	}
	
	function contains(a, point1, point2) {
		for (var i = 0; i < a.length; i++) {
			if (a[i][0].equals(point1) && a[i][1].equals(point2)) {
				return true;
			}
		}
		return false;
	}

	//used when building faces
	function PointsAlmostEqual(point1, point2)
	{		
		if(	parseFloat(point1.x.toFixed(6)) == parseFloat(point2.x.toFixed(6)) &&
			parseFloat(point1.y.toFixed(6)) == parseFloat(point2.y.toFixed(6)) &&
			parseFloat(point1.z.toFixed(6)) == parseFloat(point2.z.toFixed(6)) )
			return true;
			else return false;
	}
	
	//used when building faces
	function ValuesAlmostEqual(value1, value2)
	{
		if(	parseFloat(value1.toFixed(6)) == parseFloat(value2.toFixed(6)))
			return true;
		else return false;
	}
	
	function IsPointOnLineSegment( point_A, point_B, point)
	{
		var distance1 = new THREE.Vector3().subVectors(point,point_A).length();
		var distance2 = new THREE.Vector3().subVectors(point,point_B).length();
		var distance3 = new THREE.Vector3().subVectors(point_A,point_B).length();
		//if ( distance3 == distance1 + distance2 ) return true;
		if ( ValuesAlmostEqual(distance3, distance1 + distance2) ) return true;
		else return false;
	}
	
	function IsPointOnLine( linePointA, linePointB, point) 
	{
		var EPSILON = 0.001;
		//line's formula is y = a*x + b.
	    var a = (linePointB.y - linePointA.y) / (linePointB.x - linePointB.x);
	    var b = linePointA.y - a * linePointA.x;
	    if ( Math.abs(point.y - (a*point.x+b)) < EPSILON)
	    {
		    return true;
	    }

	    return false;
	}
	
    function cylinderMesh(point1, point2, material) {
        var direction = new THREE.Vector3().subVectors(point2, point1);
        var arrow = new THREE.ArrowHelper(direction.clone().normalize(), point1);
        var rotation = new THREE.Euler().setFromQuaternion(arrow.quaternion);
        var edgeGeometry = new THREE.CylinderGeometry(2, 2, direction.length(), 8, 4);
        var edge = new THREE.Mesh(edgeGeometry, material);
        var position = new THREE.Vector3().addVectors(point1, direction.multiplyScalar(0.5));

        edge.position.set(position.x, position.y, position.z);// = position;
        edge.rotation.set(rotation.x, rotation.y, rotation.z);// = rotation;

        return edge;
    }

	function compute2DPolygonCentroid( vertices )
	{
		var centroid = new THREE.Vector3();
		var signedArea = 0.0;
		var x0 = 0.0; // Current vertex X
		var y0 = 0.0; // Current vertex Y
		var x1 = 0.0; // Next vertex X
		var y1 = 0.0; // Next vertex Y
		var a = 0.0;  // Partial signed area

		// For all vertices except last
		var i=0;
		for (i = 0; i < vertices.length-1; ++i)
		{
			x0 = vertices[i].x;
			y0 = vertices[i].z;
			x1 = vertices[i+1].x;
			y1 = vertices[i+1].z;
			a = x0*y1 - x1*y0;
			signedArea += a;
			centroid.x += (x0 + x1)*a;
			centroid.y += (y0 + y1)*a;
		}

		// Do last vertex
		x0 = vertices[i].x;
		y0 = vertices[i].z;
		x1 = vertices[0].x;
		y1 = vertices[0].z;
		a = x0*y1 - x1*y0;
		signedArea += a;
		centroid.x += (x0 + x1)*a;
		centroid.y += (y0 + y1)*a;

		signedArea *= 0.5;
		centroid.x /= (6.0*signedArea);
		centroid.y /= (6.0*signedArea);

		return centroid;
	}
	
	function makeTextSprite( message, parameters )
	{
		if ( parameters === undefined ) parameters = {};
		
		var fontface = parameters.hasOwnProperty("fontface") ? 
			parameters["fontface"] : "Arial";
		
		var fontsize = parameters.hasOwnProperty("fontsize") ? 
			parameters["fontsize"] : 18;
		
		var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
			parameters["borderThickness"] : 4;
		
		var borderColor = parameters.hasOwnProperty("borderColor") ?
			parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
		
		var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
			parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

		//var spriteAlignment = parameters.hasOwnProperty("alignment") ?
		//	parameters["alignment"] : THREE.SpriteAlignment.topLeft;
			

		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.font = "Bold " + fontsize + "px " + fontface;
		
		// get size data (height depends only on font size)
		var metrics = context.measureText( message );
		var textWidth = metrics.width;
		
		// background color
		context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
									  + backgroundColor.b + "," + backgroundColor.a + ")";
		// border color
		context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
									  + borderColor.b + "," + borderColor.a + ")";

		context.lineWidth = borderThickness;
		roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
		
		// text color
		context.fillStyle = "rgba(0, 0, 0, 1.0)";

		context.fillText( message, borderThickness, fontsize + borderThickness);
		
		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas) 
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial( 
			{ map: texture } );
		var sprite = new THREE.Sprite( spriteMaterial );
		var width = spriteMaterial.map.image.width/2;
		var height = spriteMaterial.map.image.height/2;
		sprite.scale.set(width,height,1.0);
		return sprite;	
	}

	// function for drawing rounded rectangles
	function roundRect(ctx, x, y, w, h, r) 
	{
		ctx.beginPath();
		ctx.moveTo(x+r, y);
		ctx.lineTo(x+w-r, y);
		ctx.quadraticCurveTo(x+w, y, x+w, y+r);
		ctx.lineTo(x+w, y+h-r);
		ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
		ctx.lineTo(x+r, y+h);
		ctx.quadraticCurveTo(x, y+h, x, y+h-r);
		ctx.lineTo(x, y+r);
		ctx.quadraticCurveTo(x, y, x+r, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();   
	}
	
	
}


///////////////////////////////////////////////////////////
/////////////////// FURNITURE MODULE //////////////////////
///////////////////////////////////////////////////////////

IndoorNavigation.FurnitureModule = function()
{
	IndoorNavigation.Module.call(this, "FurnitureModule", "0.0.1", true);
	
	this.inventory = []; // вся мебель
	
	/// override this ... calls update function in each furniture
    this.updateModule = function()
    {
		for( var i = 0; i < this.inventory.length; i++ )
		{
			this.inventory[i].updateItem();
		}
    }

    this.addItem = function ( item )
    {
		//TODO : функция которая автоматически добавляет разные типы объектов
		this.inventory.push( item );
    }

	this.addCollection = function ( data )
	{
		var parameters = data.Parameters;
		var objects = data.Objects;
		
		for( var i = 0; i < objects.length; i++ )
		{
			switch(objects[i].type)
			{
				// case "StairsType1" : 
					// var position = objects[i].position;
					// var positionVector = new THREE.Vector3( position[0] + parameters.TranslateX, position[1] + parameters.TranslateY, position[2] + parameters.TranslateZ).multiplyScalar(parameters.Unit);
						// this.addItem( new IndoorNavigation.FurnitureModule.StairsType1( objects[i].boxWidth, objects[i].boxHeight, objects[i].boxLengt, positionVector, objects[i].angle));
					// break;
				case "DoorType1" : 
					this.addItem( new IndoorNavigation.FurnitureModule.DoorType1( parameters, objects[i] ));
				break;
				case "WindowType1" : 
					this.addItem( new IndoorNavigation.FurnitureModule.WindowType1( parameters, objects[i] ));
				break;
			}
			
			
		}
		
	}
	
    this.deleteItem = function ( item )
    {

    }
	
	this.hideItem = function ( itemNumber )
	{
	
	}

}

IndoorNavigation.FurnitureModule.StairsType1 = function ( boxWidth, boxHeight, boxLength, position , angle )
{	
	// лестница строится через коробку, ширина коробки, ее высота и длина
	var scope = this;
	var numberOfSteps = 8;
	
	var halfWidth = boxWidth/2;
	var halfHeight = boxHeight/2;
	var fourthLength = boxLength/4;
	var twoofourthLength = fourthLength + fourthLength;
	
	var onestepLength = twoofourthLength / numberOfSteps;
	var onestepHeight = halfHeight / numberOfSteps;
	var onestepWidth = halfWidth;
	
	Init();
	
	function Init()
	{
		var stepGeometry = new THREE.BoxGeometry( onestepWidth, onestepHeight, onestepLength );
		var platformGeometry = new THREE.BoxGeometry( boxWidth, onestepHeight, fourthLength );
		
		var materials = [
			new THREE.MeshBasicMaterial( { color: 0x967878 } ),
			new THREE.MeshBasicMaterial( { color: 0xe3e3e3 } )
		];
		
		var stepSingleMesh = new THREE.Mesh(stepGeometry);
		var platformMesh = new THREE.Mesh(platformGeometry);
		
		var allSteps = new THREE.Geometry();
		var length = numberOfSteps * 2 + 2;
		
		// build 
		for (var i = 0; i < length; i++) {
			var sMesh = stepSingleMesh.clone();			
			
			if ( i == 0 ) 
				sMesh.position.set(onestepWidth/2, onestepHeight/2, fourthLength + onestepLength/2  );
			if ( i < numberOfSteps && i !=0 )
				sMesh.position.set(onestepWidth/2, onestepHeight/2 + onestepHeight * i ,fourthLength + onestepLength/2 + onestepLength * i  );
			if ( i == numberOfSteps )
			{
				sMesh = platformMesh.clone();
				sMesh.position.set(0, onestepHeight/2 + onestepHeight * i , fourthLength + fourthLength/2 + onestepLength * i  );				
			}
			if ( i > numberOfSteps )
				sMesh.position.set( -onestepWidth/2, onestepHeight/2 + onestepHeight * i , fourthLength + twoofourthLength*2 + onestepLength/2 - onestepLength * i  );
			if ( i == length - 1 )
			{
				sMesh = platformMesh.clone();
				sMesh.position.set(0, onestepHeight/2 + onestepHeight * i ,fourthLength/2 + twoofourthLength*2 + onestepLength - onestepLength * i );
			}
			
			sMesh.updateMatrix();
			allSteps.merge(sMesh.geometry, sMesh.matrix );
			//THREE.GeometryUtils.merge(allSteps, sMesh);		
		}
		
		var color = 0;
		// paint
		for( var i = 0; i < allSteps.faces.length; i++ ) {
			if ( i % 12 == 0 )
				color == 0 ? color ++ : color --;
			allSteps.faces[ i ].materialIndex = color;
			// if ( i%4 == 0 ) allSteps.faces[ i ].materialIndex = 0;
			// else allSteps.faces[ i ].materialIndex = 1;
			//allSteps.faces[ i ].materialIndex = ( i%2 == 0 ) ? 0: 1;
		}		
		
		scope.StairsMesh = new THREE.Mesh(allSteps, new THREE.MeshFaceMaterial( materials ));
		//scope.StairsMesh = new THREE.Mesh(allSteps, material);
		scope.StairsMesh.name = "Stairs";
		scope.StairsMesh.position.set(position.x, position.y , position.z);
		
		scope.StairsMesh.rotateOnAxis(new THREE.Vector3(0,1,0), angle * Math.PI/180 )
		
		// var direction = new THREE.Vector3().subVectors(point2, point1);
        // var arrow = new THREE.ArrowHelper(direction.clone().normalize(), point1);
        // var rotation = new THREE.Euler().setFromQuaternion(arrow.quaternion);
		// scope.StairsMesh.rotation.set(rotation.x, rotation.y, rotation.z)
		
		IndoorNavigation.mainScene.add(scope.StairsMesh);
	}
	
	this.updateItem = function ()
	{
	}
}

IndoorNavigation.FurnitureModule.DoorType1 = function ( data, object )
{
	var scope = this;
	scope.options = { closed : 1 , opened : -1};
	scope.status = scope.options.closed;
	
	var multiply = data.Unit;
	var Room1Point0 = new THREE.Vector3( object.Room1Point0[0] + data.TranslateX, object.Room1Point0[1] + data.TranslateY, object.Room1Point0[2] + data.TranslateZ );
	var Room1Point1 = new THREE.Vector3( object.Room1Point1[0] + data.TranslateX, object.Room1Point1[1] + data.TranslateY, object.Room1Point1[2] + data.TranslateZ );
	var Room2Point0 = new THREE.Vector3( object.Room2Point0[0] + data.TranslateX, object.Room2Point0[1] + data.TranslateY, object.Room2Point0[2] + data.TranslateZ );
	var Room2Point1 = new THREE.Vector3( object.Room2Point1[0] + data.TranslateX, object.Room2Point1[1] + data.TranslateY, object.Room2Point1[2] + data.TranslateZ );
	var o1 = object.usedObject1;
	var o2 = object.usedObject2;
	
	Init();
	AttachEvents();
	
	function Init()
	{								
		var R1p0 = Room1Point0;
		var R1p1 = Room1Point1;			
																				
		var directionR1 = new THREE.Vector3().subVectors(R1p1, R1p0);
		
		var R1p0_scalarX = ( directionR1.length() - o1.center.x ) / directionR1.length();
		
		var center_pointRoom1 = new THREE.Vector3().addVectors(R1p0, directionR1.clone().multiplyScalar(R1p0_scalarX)).multiplyScalar(multiply);	

		
		var R2p0 = Room2Point0;
		var R2p1 = Room2Point1;
		
		var directionR2 = new THREE.Vector3().subVectors(R2p1, R2p0);
		
		var R2p0_scalarX = ( directionR2.length() - o2.center.x ) / directionR2.length();
		
		var center_pointRoom2 = new THREE.Vector3().addVectors(R2p0, directionR2.clone().multiplyScalar(R2p0_scalarX)).multiplyScalar(multiply);
		
		
		scope.centerPointBetweenCenterPoints = new THREE.Vector3().subVectors( center_pointRoom2 , center_pointRoom1 );		
		var position = new THREE.Vector3().addVectors(center_pointRoom1, scope.centerPointBetweenCenterPoints.clone().multiplyScalar(0.5));
		
		var arrow = new THREE.ArrowHelper(directionR2.clone().normalize(), R2p0);
        var rotation = new THREE.Euler().setFromQuaternion(arrow.quaternion);
		
		CreateDoor( position, rotation );
		
		//testVertex2( position );
		//testVertex2(center_pointRoom1);
		//testVertex2(center_pointRoom2);
		
	}
	
	function testVertex2( position )
	{
		var vertexGeometry = new THREE.SphereGeometry(6, 12, 6);
		var vertexMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });		
		var vertexMesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
		vertexMesh.position.set( position.x, position.y, position.z );
		IndoorNavigation.mainScene.add(vertexMesh);
	}

	function CreateDoor( position, rotation )
	{
		var doorGeometry = new THREE.BoxGeometry( o1.size.width * multiply , o2.size.height * multiply, scope.centerPointBetweenCenterPoints.length() );
		var material = new THREE.MeshBasicMaterial( { color: 0x967878 , side: THREE.DoubleSide } );
		
		scope.DoorMesh = new THREE.Mesh(doorGeometry, material);
		//scope.StairsMesh = new THREE.Mesh(allSteps, material);
		scope.DoorMesh.name = "Door";
		scope.DoorMesh.position.set(position.x + 50, position.y + o1.size.height/2 * multiply, position.z); // + 50 for matrix translation
		scope.DoorMesh.rotation.set(0, rotation.y, 0);
		
		//scope.DoorMesh.geometry.faces.splice(8,4);
		var centerOfMesh = scope.DoorMesh.geometry.center();
		//using that I translated the doors's x by 50 points so it basically rotates on it's side.
		scope.DoorMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(centerOfMesh.x - 50, centerOfMesh.y, centerOfMesh.z) );
		
		IndoorNavigation.mainScene.add(scope.DoorMesh);
	}

	this.updateItem = function ()
	{
		var vector = new THREE.Vector3( IndoorNavigation.Core.mouse.x, IndoorNavigation.Core.mouse.y, 1 );
		IndoorNavigation.Core.projector.unprojectVector( vector, IndoorNavigation.Core.camera );
		var ray = new THREE.Raycaster( IndoorNavigation.Core.camera.position, vector.sub( IndoorNavigation.Core.camera.position ).normalize() );

		var intersects = ray.intersectObject( scope.DoorMesh );

	    // проверяем пересечение, если его нет ,то нужно убедиться не пересекается ли старый объект... 
	    //чтобы INTERSECTED_Furniture не обнулился просто так и можно было с ним взаимодействовать
		if ( intersects.length > 0 )
		{
			if ( intersects[ 0 ].object != INTERSECTED_Furniture ) 
			{
				INTERSECTED_Furniture = intersects[ 0 ].object;
			}
		} 
		else		
			if ( INTERSECTED_Furniture != null ) 
			{
				var intersect_another = ray.intersectObject ( INTERSECTED_Furniture );
				if ( intersect_another.length == 0 )  INTERSECTED_Furniture = null;
			}
		// else // there are no intersections
		// {
			// INTERSECTED_Furniture = null;
		// }
	}
	
	function AttachEvents()
	{
		THREE.EventDispatcher.call( scope.DoorMesh );
		scope.rotateTimes = 0;
		scope.DoorMesh.addEventListener('open', function(event) { rotate(); });
	}
	
	// test event function
	function rotate2()
	{
		scope.DoorMesh.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/180 ); //1 градус
		scope.rotateTimes ++;
		if ( scope.rotateTimes <= 89 )
			requestAnimationFrame(rotate);
		else  
		{
			scope.rotateTimes = 0;
		}
	}

	function rotate()
	{
		scope.DoorMesh.rotateOnAxis(new THREE.Vector3(0,1,0), scope.status * 2 * Math.PI/180 ); //2 градусa //scope.status * Math.PI/180  //1 градус
		switch ( scope.status )
		{
			case scope.options.closed : scope.rotateTimes ++;
										if ( scope.rotateTimes <= 44 ) // 89
											requestAnimationFrame(rotate);
										else  
										{
											//scope.rotateTimes = 0;
											scope.status = scope.options.opened;
										} break;
			case scope.options.opened : scope.rotateTimes --;
										if ( scope.rotateTimes != 0 )
											requestAnimationFrame(rotate);
										else  
										{
											//scope.rotateTimes = 0;
											scope.status = scope.options.closed;
										} break;
		}
	}			

}

IndoorNavigation.FurnitureModule.WindowType1 = function ( data, object )
{
	var scope = this;
	scope.options = { closed : 1 , opened : -1};
	scope.status = scope.options.closed;
	
	var multiply = data.Unit;
	var Room1Point0 = new THREE.Vector3( object.Room1Point0[0] + data.TranslateX, object.Room1Point0[1] + data.TranslateY, object.Room1Point0[2] + data.TranslateZ );
	var Room1Point1 = new THREE.Vector3( object.Room1Point1[0] + data.TranslateX, object.Room1Point1[1] + data.TranslateY, object.Room1Point1[2] + data.TranslateZ );
	var Room2Point0 = new THREE.Vector3( object.Room2Point0[0] + data.TranslateX, object.Room2Point0[1] + data.TranslateY, object.Room2Point0[2] + data.TranslateZ );
	var Room2Point1 = new THREE.Vector3( object.Room2Point1[0] + data.TranslateX, object.Room2Point1[1] + data.TranslateY, object.Room2Point1[2] + data.TranslateZ );
	var o1 = object.usedObject1;
	var o2 = object.usedObject2;
	
	Init();
	AttachEvents();
	
	function Init()
	{								
		var R1p0 = Room1Point0;
		var R1p1 = Room1Point1;			
																				
		var directionR1 = new THREE.Vector3().subVectors(R1p1, R1p0);
		
		var R1p0_scalarX = ( directionR1.length() - o1.center.x ) / directionR1.length();
		
		var center_pointRoom1 = new THREE.Vector3().addVectors(R1p0, directionR1.clone().multiplyScalar(R1p0_scalarX)).multiplyScalar(multiply);	

		center_pointRoom1.set( center_pointRoom1.x, center_pointRoom1.y + o1.center.y * multiply, center_pointRoom1.z);
		
		
		var R2p0 = Room2Point0;
		var R2p1 = Room2Point1;
		
		var directionR2 = new THREE.Vector3().subVectors(R2p1, R2p0);
		
		var R2p0_scalarX = ( directionR2.length() - o2.center.x ) / directionR2.length();
		
		var center_pointRoom2 = new THREE.Vector3().addVectors(R2p0, directionR2.clone().multiplyScalar(R2p0_scalarX)).multiplyScalar(multiply);
		
		center_pointRoom2.set( center_pointRoom2.x, center_pointRoom2.y + o2.center.y * multiply, center_pointRoom2.z);
		
		
		scope.centerPointBetweenCenterPoints = new THREE.Vector3().subVectors( center_pointRoom2 , center_pointRoom1 );		
		var position = new THREE.Vector3().addVectors(center_pointRoom1, scope.centerPointBetweenCenterPoints.clone().multiplyScalar(0.5));
		
		var arrow = new THREE.ArrowHelper(directionR2.clone().normalize(), R2p0);
        var rotation = new THREE.Euler().setFromQuaternion(arrow.quaternion);		
		
		CreateWindow( position, rotation );		
		
	}
	
	function CreateWindow ( position, rotation )
	{
		var windowGeometry = new THREE.BoxGeometry( o1.size.width * multiply , o2.size.height * multiply, scope.centerPointBetweenCenterPoints.length() );
		var material = new THREE.MeshBasicMaterial( { color: 0x967878 , side: THREE.DoubleSide } );
		
		scope.WindowMesh = new THREE.Mesh(windowGeometry, material);
		//scope.StairsMesh = new THREE.Mesh(allSteps, material);
		scope.WindowMesh.name = "Door";
		scope.WindowMesh.position.set(position.x + 50, position.y, position.z); // + 50 for matrix translation
		scope.WindowMesh.rotation.set(0, rotation.y, 0);
		
		//scope.DoorMesh.geometry.faces.splice(8,4);
		var centerOfMesh = scope.WindowMesh.geometry.center();
		//using that I translated the doors's x by 50 points so it basically rotates on it's side.
		scope.WindowMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(centerOfMesh.x - 50, centerOfMesh.y, centerOfMesh.z) );
		
		IndoorNavigation.mainScene.add(scope.WindowMesh);
	}

	this.updateItem = function ()
	{
		var vector = new THREE.Vector3( IndoorNavigation.Core.mouse.x, IndoorNavigation.Core.mouse.y, 1 );
		IndoorNavigation.Core.projector.unprojectVector( vector, IndoorNavigation.Core.camera );
		var ray = new THREE.Raycaster( IndoorNavigation.Core.camera.position, vector.sub( IndoorNavigation.Core.camera.position ).normalize() );

		var intersects = ray.intersectObject( scope.WindowMesh );

		if ( intersects.length > 0 )
		{
			if ( intersects[ 0 ].object != INTERSECTED_Furniture ) 
			{
				INTERSECTED_Furniture = intersects[ 0 ].object;
			}
		}
		else		
			if ( INTERSECTED_Furniture != null ) 
			{
				var intersect_another = ray.intersectObject ( INTERSECTED_Furniture );
				if ( intersect_another.length == 0 )  INTERSECTED_Furniture = null;
			}

	}
	
	function AttachEvents()
	{
		THREE.EventDispatcher.call( scope.WindowMesh );
		scope.rotateTimes = 0;
		scope.WindowMesh.addEventListener('open', function(event) { rotate(); });
	}
	
	function rotate()
	{
		scope.WindowMesh.rotateOnAxis(new THREE.Vector3(0,1,0), scope.status * 2 * Math.PI/180 ); //2 градусa //scope.status * Math.PI/180  //1 градус
		switch ( scope.status )
		{
			case scope.options.closed : scope.rotateTimes ++;
										if ( scope.rotateTimes <= 44 ) // 89
											requestAnimationFrame(rotate);
										else  
										{
											//scope.rotateTimes = 0;
											scope.status = scope.options.opened;
										} break;
			case scope.options.opened : scope.rotateTimes --;
										if ( scope.rotateTimes != 0 )
											requestAnimationFrame(rotate);
										else  
										{
											//scope.rotateTimes = 0;
											scope.status = scope.options.closed;
										} break;
		}
	}			

}


///////////////////////////////////////////////////////////
///////////// NETWORK`S COMPONENTS MODULE /////////////////
///////////////////////////////////////////////////////////


IndoorNavigation.NetworkModule = function()
{
	IndoorNavigation.Module.call(this, "NetworkModule", "0.0.1", true);
	
	this.markers = [];
	this.markersPos = [];
	
	this.updateModule = function()
	{
	    var vector = new THREE.Vector3(IndoorNavigation.Core.mouse.x, IndoorNavigation.Core.mouse.y, 1);

	    IndoorNavigation.Core.projector.unprojectVector(vector, IndoorNavigation.Core.camera);

	    var ray = new THREE.Raycaster(IndoorNavigation.Core.camera.position,
            vector.sub(IndoorNavigation.Core.camera.position).normalize());

	    for (var i = 0; i < this.markers.length; i++) {
	        this.markers[i].Marker.updateItem(ray);
	    }
	    //var t0 = performance.now();
	    //var t1 = performance.now();
	    //IndoorNavigation.Core.Logger.LogSet("UpdateNetwork took " + (t1 - t0).toFixed(3))
    }
	
	this.addMarker = function ( marker, id )
	{
	    var finalmarker = { ID: id, Marker: marker, Position: marker.position };
	    this.markers.push(finalmarker);
	    //this.markers.push(marker);
	    this.markersPos.push(marker.position);
    }
	
	this.addCollection = function ( data )
	{
		var parameters = data.Parameters;
		var objects = data.Markers;
		
		for( var i = 0; i < objects.length; i++ )
		{
			switch(objects[i].type)
			{
				case "Door" : 
				    this.addMarker(new IndoorNavigation.NetworkModule.Door(parameters, objects[i]), objects[i].id);
					break;
				case "Computer" : 
				    this.addMarker(new IndoorNavigation.NetworkModule.Computer(parameters, objects[i]), objects[i].id);
					break;
				case "Modem" : 
				    this.addMarker(new IndoorNavigation.NetworkModule.Modem(parameters, objects[i]), objects[i].id);
					break;
				case "Printer" :
				    this.addMarker(new IndoorNavigation.NetworkModule.Printer(parameters, objects[i]), objects[i].id);
					break;
				case "Server" :
				    this.addMarker(new IndoorNavigation.NetworkModule.Server(parameters, objects[i]), objects[i].id);
					break;
				case "Commutator" : 
				    this.addMarker(new IndoorNavigation.NetworkModule.Commutator(parameters, objects[i]), objects[i].id);
					break;
			    case "Rosette":
			        this.addMarker(new IndoorNavigation.NetworkModule.Rosette(parameters, objects[i]), objects[i].id);
			        break;
			}
			
			
		}
		
	}
}

// используется только для расчета точки двери
IndoorNavigation.NetworkModule.Door = function ( data, object )
{
	var scope = this;
	
	var multiply = data.Unit;
	var Room1Point0 = new THREE.Vector3( object.Room1Point0[0] + data.TranslateX, object.Room1Point0[1] + data.TranslateY, object.Room1Point0[2] + data.TranslateZ );
	var Room1Point1 = new THREE.Vector3( object.Room1Point1[0] + data.TranslateX, object.Room1Point1[1] + data.TranslateY, object.Room1Point1[2] + data.TranslateZ );
	var Room2Point0 = new THREE.Vector3( object.Room2Point0[0] + data.TranslateX, object.Room2Point0[1] + data.TranslateY, object.Room2Point0[2] + data.TranslateZ );
	var Room2Point1 = new THREE.Vector3( object.Room2Point1[0] + data.TranslateX, object.Room2Point1[1] + data.TranslateY, object.Room2Point1[2] + data.TranslateZ );
	var o1 = object.usedObject1;
	var o2 = object.usedObject2;
	
	Init();
	
	function Init()
	{								
		var R1p0 = Room1Point0;
		var R1p1 = Room1Point1;			
																				
		var directionR1 = new THREE.Vector3().subVectors(R1p1, R1p0);
		
		var R1p0_scalarX = ( directionR1.length() - o1.center.x ) / directionR1.length();
		
		var center_pointRoom1 = new THREE.Vector3().addVectors(R1p0, directionR1.clone().multiplyScalar(R1p0_scalarX)).multiplyScalar(multiply);	

		
		var R2p0 = Room2Point0;
		var R2p1 = Room2Point1;
		
		var directionR2 = new THREE.Vector3().subVectors(R2p1, R2p0);
		
		var R2p0_scalarX = ( directionR2.length() - o2.center.x ) / directionR2.length();
		
		var center_pointRoom2 = new THREE.Vector3().addVectors(R2p0, directionR2.clone().multiplyScalar(R2p0_scalarX)).multiplyScalar(multiply);
		
		
		scope.centerPointBetweenCenterPoints = new THREE.Vector3().subVectors( center_pointRoom2 , center_pointRoom1 );		
		scope.position = new THREE.Vector3().addVectors(center_pointRoom1, scope.centerPointBetweenCenterPoints.clone().multiplyScalar(0.5));
		
		var arrow = new THREE.ArrowHelper(directionR2.clone().normalize(), R2p0);
        var rotation = new THREE.Euler().setFromQuaternion(arrow.quaternion);
		
		
        //testVertex2(scope.position);

        LoadModel();
	}
	
	function testVertex2( position )
	{
		var vertexGeometry = new THREE.SphereGeometry(6, 12, 6);
		var vertexMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });		
		var vertexMesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
		vertexMesh.position.set( position.x, position.y, position.z );
		IndoorNavigation.mainScene.add(vertexMesh);
	}

	function LoadModel() {
	    // instantiate a loader
	    var loader = new THREE.ColladaLoader();

	    // load a Babylon resource
	    loader.load(
            // resource URL
            '/App_Constructor/Objects/MARKER1.xml',
            // Function when resource is loaded
            function (collada) {
                scope.object = collada;
                scope.mesh = collada.scene.children[0].children[0];
                scope.mesh.scale.set(25, 25, 25);
                collada.scene.position.set(scope.position.x, scope.position.y, scope.position.z);
                //collada.scene.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
                var markerTexture = THREE.ImageUtils.loadTexture('/App_Constructor/Objects/MARKER1.png');
                var markerMaterial = new THREE.MeshLambertMaterial({ map: markerTexture, side: THREE.DoubleSide });
                scope.mesh.material = markerMaterial;
                IndoorNavigation.mainScene.add(collada.scene);
                //var light = new THREE.PointLight(0xffffff, 0.5, 1500);
                //var light = new THREE.PointLight(0x000000, 50, 500);
                //light.position.set(scope.position.x, scope.position.y + 50, scope.position.z);
                //light.position.set(0,500,0);
                //IndoorNavigation.mainScene.add(light);
            },
            // Function called when download progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            }
        );
	}

	this.updateItem = function (ray) {
	    var intersects = ray.intersectObject(scope.mesh);

	    if (intersects.length > 0) {
	        if (intersects[0].object != INTERSECTED_Furniture) {
	            INTERSECTED_Marker = intersects[0].object;
	        }
	        //scope.object.scene.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 180 * 4);
	        createGlow();
	        scope.mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 180 * 4);
	        //scope.Glow.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 180 * 4);
	        //scope.Glow.rotation.copy(scope.mesh.rotation);
	        scope.Glow.rotation.z = scope.mesh.rotation.z;
	    }
	    else {

	        deleteGlow();

	        if (INTERSECTED_Marker != null) {
	            var intersect_another = ray.intersectObject(INTERSECTED_Marker);
	            if (intersect_another.length == 0) INTERSECTED_Marker = null;
	        }
	    }

	}

	function createGlow()
	{
	    if (scope.Glow != null) return;
	    var customMaterial = new THREE.ShaderMaterial(
        {
            uniforms:
            {
                "c": { type: "f", value: 1.0 },
                "p": { type: "f", value: 1.4 },
                glowColor: { type: "c", value: new THREE.Color(0x515edb) },
                viewVector: { type: "v3", value: IndoorNavigation.Core.camera.position }
            },
            vertexShader: ["uniform vec3 viewVector;",
                            "uniform float c;",
                            "uniform float p;",
                            "varying float intensity;",
                            "void main()",
                            "{",
                                "vec3 vNormal = normalize( normalMatrix * normal );",
                                "vec3 vNormel = normalize( normalMatrix * viewVector );",
                                "intensity = 1.0; //pow( c - dot(vNormal, vNormel), p );",
                                "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                            "}"].join("\n"),
            fragmentShader: ["uniform vec3 glowColor;",
                              "varying float intensity;",
                              "void main()",
                              "{",
                                  "vec3 glow = glowColor * intensity;",
                                  "gl_FragColor = vec4( glow, 1.0 );",
                              "}"].join("\n"),
            side: THREE.FrontSide,
            //alphaTest: 0.9,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
	    scope.Glow = new THREE.Mesh(scope.mesh.geometry, customMaterial);
	    scope.Glow.position.set(scope.position.x, scope.position.y, scope.position.z);
	    scope.Glow.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 180 * 90);
	    //scope.Glow.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2);
	    //scope.Glow.applyMatrix(scope.mesh.matrix);
	    scope.Glow.scale.set(35,35,25);
	    IndoorNavigation.mainScene.add(scope.Glow);
	}
    
	function deleteGlow()
	{
	    IndoorNavigation.mainScene.remove(scope.Glow);
	    scope.Glow = null;
	}
	
}

IndoorNavigation.NetworkModule.Computer = function ( data, object )
{
	var scope = this;
	
	Init();
	
	function Init()
	{
		var multiply = data.Unit;
		var position = object.position;
		var rotation = 0;
		var positionVector = new THREE.Vector3( position[0] + data.TranslateX, position[1] + data.TranslateY, position[2] + data.TranslateZ ).multiplyScalar(multiply);
		
		CreateComputer( positionVector , rotation );
	}
	
	function CreateComputer( position, rotation )
	{
		//var compTexture = new THREE.ImageUtils.loadTexture( 'https://github.com/NafawOrg/Textures/blob/master/crate.jpg' , {} , create);
		//var crateMaterial = new THREE.MeshBasicMaterial( { map: compTexture } );
		
		var computerGeometry = new THREE.BoxGeometry( 100,100,100 );
		var material = new THREE.MeshBasicMaterial( { color: 0xa41f8d , side: THREE.DoubleSide } );
		
		scope.ComputerMesh = new THREE.Mesh(computerGeometry, material);
		scope.ComputerMesh.name = "Computer";
		scope.ComputerMesh.position.set(position.x, position.y + 50 , position.z); 
		//scope.ComputerMesh.rotation.set(0, rotation.y, 0);

		scope.position = scope.ComputerMesh.position;

		var centerOfMesh = scope.ComputerMesh.geometry.center();
		//using that I translated the doors's x by 50 points so it basically rotates on it's side.
		//scope.ComputerMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(centerOfMesh.x - 50, centerOfMesh.y, centerOfMesh.z) );
		
		var spritey = IndoorNavigation.Core.makeTextSprite( "Computer", 
		{ fontsize: 50, fontface: "Georgia", borderColor: {r:0, g:0, b:255, a:1.0} } );
		spritey.position.set(position.x, position.y + 150 , position.z);
		IndoorNavigation.mainScene.add( spritey );
		
		IndoorNavigation.mainScene.add(scope.ComputerMesh);

	}

	this.updateItem = function (ray) {
	    // проверка на то что мы не пересекаем мышкой стенку, которая стоит перед предметом.
	    if (INTERSECTED_Wall == null)
	        var intersects = ray.intersectObject(scope.ComputerMesh);
	    else
	        var intersects = ray.intersectObjects([scope.ComputerMesh, INTERSECTED_Wall]);
	            
	    if ( intersects.length > 0 )
	    {
            // если первый объект который мы встретили стена - выйти.
	        if (intersects[0].object == INTERSECTED_Wall) {
	            if (INTERSECTED_Network != null) {
	                var intersect_another = ray.intersectObject(INTERSECTED_Network);
	                if (intersect_another.length == 0) {
	                    INTERSECTED_Network = null;
	                    IndoorNavigation.Core.Logger.LogSet("Null");
	                }
	            }
	            return;
	        }

	        if (intersects[0].object != INTERSECTED_Network)
	        {
	            INTERSECTED_Network = intersects[0].object;            
	        }
	        IndoorNavigation.Core.Logger.LogSet(INTERSECTED_Network.name + "/" + INTERSECTED_Network.id);
	    } 
	    else		
	        if (INTERSECTED_Network != null)
	        {
	            var intersect_another = ray.intersectObject(INTERSECTED_Network);
	            if (intersect_another.length == 0) {
	                INTERSECTED_Network = null;
	                IndoorNavigation.Core.Logger.LogSet("Null");
	            }
	        }
	}
}

IndoorNavigation.NetworkModule.Server = function ( data, object )
{
	var scope = this;
	
	Init();
	
	function Init()
	{
		var multiply = data.Unit;
		var position = object.position;
		var rotation = 0;
		var positionVector = new THREE.Vector3( position[0] + data.TranslateX, position[1] + data.TranslateY, position[2] + data.TranslateZ ).multiplyScalar(multiply);
		
		CreateServer( positionVector , rotation );
	}
	
	function CreateServer( position, rotation )
	{		
		var serverGeometry = new THREE.BoxGeometry( 50,200,50 );
		var material = new THREE.MeshBasicMaterial( { color: 0x6edc3d , side: THREE.DoubleSide } );
		
		scope.ServerMesh = new THREE.Mesh(serverGeometry, material);
		scope.ServerMesh.name = "Server";
		scope.ServerMesh.position.set(position.x, position.y + 100 , position.z); 
		//scope.ComputerMesh.rotation.set(0, rotation.y, 0);

		scope.position = scope.ServerMesh.position;

		var centerOfMesh = scope.ServerMesh.geometry.center();
		//using that I translated the doors's x by 50 points so it basically rotates on it's side.
		//scope.ComputerMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(centerOfMesh.x - 50, centerOfMesh.y, centerOfMesh.z) );
		
		var spritey = IndoorNavigation.Core.makeTextSprite( "Server", 
		{ fontsize: 50, fontface: "Georgia", borderColor: {r:0, g:0, b:255, a:1.0} } );
		spritey.position.set(position.x, position.y + 150 , position.z);
		IndoorNavigation.mainScene.add( spritey );
		
		IndoorNavigation.mainScene.add(scope.ServerMesh);

	}

	this.updateItem = function () { }
}

IndoorNavigation.NetworkModule.Commutator = function ( data, object )
{
	var scope = this;
	
	Init();
	
	function Init()
	{
		var multiply = data.Unit;
		var position = object.position;
		var rotation = 0;
		var positionVector = new THREE.Vector3( position[0] + data.TranslateX, position[1] + data.TranslateY, position[2] + data.TranslateZ ).multiplyScalar(multiply);
		
		CreateCommutator( positionVector , rotation );
	}
	
	function CreateCommutator( position, rotation )
	{		
		var CommutatorGeometry = new THREE.BoxGeometry( 100,100,100 );
		var material = new THREE.MeshBasicMaterial( { color: 0x6d3aff , side: THREE.DoubleSide } );
		
		scope.CommutatorMesh = new THREE.Mesh(CommutatorGeometry, material);
		scope.CommutatorMesh.name = "Commutator";
		scope.CommutatorMesh.position.set(position.x, position.y + 50 , position.z); 
		//scope.ComputerMesh.rotation.set(0, rotation.y, 0);

		scope.position = scope.CommutatorMesh.position;

		var centerOfMesh = scope.CommutatorMesh.geometry.center();
		//using that I translated the doors's x by 50 points so it basically rotates on it's side.
		//scope.ComputerMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(centerOfMesh.x - 50, centerOfMesh.y, centerOfMesh.z) );
		
		var spritey = IndoorNavigation.Core.makeTextSprite( " Commutator ", 
		{ fontsize: 50, fontface: "Georgia", borderColor: {r:0, g:0, b:255, a:1.0} } );
		spritey.position.set(position.x, position.y + 150 , position.z);
		IndoorNavigation.mainScene.add( spritey );
		
		IndoorNavigation.mainScene.add(scope.CommutatorMesh);

	}

	this.updateItem = function () { }
}

IndoorNavigation.NetworkModule.Modem = function ( data, object )
{
	var scope = this;
	
	Init();
	
	function Init()
	{
		var multiply = data.Unit;
		var position = object.position;
		var rotation = 0;
		var positionVector = new THREE.Vector3( position[0] + data.TranslateX, position[1] + data.TranslateY, position[2] + data.TranslateZ ).multiplyScalar(multiply);
		
		CreateModem( positionVector , rotation );
	}
	
	function CreateModem( position, rotation )
	{		
		var modemGeometry = new THREE.BoxGeometry( 100,50,100 );
		var material = new THREE.MeshBasicMaterial( { color: 0x6d3aff , side: THREE.DoubleSide } );
		
		scope.ModemMesh = new THREE.Mesh(modemGeometry, material);
		scope.ModemMesh.name = "Modem";
		scope.ModemMesh.position.set(position.x, position.y + 25 , position.z); 
		//scope.ComputerMesh.rotation.set(0, rotation.y, 0);

		scope.position = scope.ModemMesh.position;

		var centerOfMesh = scope.ModemMesh.geometry.center();
		//using that I translated the doors's x by 50 points so it basically rotates on it's side.
		//scope.ComputerMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(centerOfMesh.x - 50, centerOfMesh.y, centerOfMesh.z) );
		
		var spritey = IndoorNavigation.Core.makeTextSprite( "Modem", 
		{ fontsize: 50, fontface: "Georgia", borderColor: {r:0, g:0, b:255, a:1.0} } );
		spritey.position.set(position.x, position.y + 150 , position.z);
		IndoorNavigation.mainScene.add( spritey );
		
		IndoorNavigation.mainScene.add(scope.ModemMesh);

	}

	this.updateItem = function () { }
}

IndoorNavigation.NetworkModule.Printer = function ( data, object )
{
	var scope = this;
	
	Init();
	
	function Init()
	{
		var multiply = data.Unit;
		var position = object.position;
		var rotation = 0;
		var positionVector = new THREE.Vector3( position[0] + data.TranslateX, position[1] + data.TranslateY, position[2] + data.TranslateZ ).multiplyScalar(multiply);
		
		CreatePrinter( positionVector , rotation );
	}
	
	function CreatePrinter( position, rotation )
	{		
		var printerGeometry = new THREE.BoxGeometry( 100,100,100 );
		var material = new THREE.MeshBasicMaterial( { color: 0x6d3aff , side: THREE.DoubleSide } );
		
		scope.PrinterMesh = new THREE.Mesh(printerGeometry, material);
		scope.PrinterMesh.name = "Printer";
		scope.PrinterMesh.position.set(position.x, position.y + 50 , position.z); 
		//scope.ComputerMesh.rotation.set(0, rotation.y, 0);

		scope.position = scope.PrinterMesh.position;

		var centerOfMesh = scope.PrinterMesh.geometry.center();
		//using that I translated the doors's x by 50 points so it basically rotates on it's side.
		//scope.ComputerMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(centerOfMesh.x - 50, centerOfMesh.y, centerOfMesh.z) );
		
		var spritey = IndoorNavigation.Core.makeTextSprite( "Printer", 
		{ fontsize: 50, fontface: "Georgia", borderColor: {r:0, g:0, b:255, a:1.0} } );
		spritey.position.set(position.x, position.y + 150 , position.z);
		IndoorNavigation.mainScene.add( spritey );
		
		IndoorNavigation.mainScene.add(scope.PrinterMesh);

	}
	
	this.updateItem = function () { }
}

IndoorNavigation.NetworkModule.Rosette = function ( data, object )
{
	var scope = this;
	
	Init();
	
	function Init()
	{
		var multiply = data.Unit;
		var position = object.position;
		var rotation = 0;
		var positionVector = new THREE.Vector3( position[0] + data.TranslateX, position[1] + data.TranslateY, position[2] + data.TranslateZ ).multiplyScalar(multiply);
		
		CreateRosette( positionVector , rotation );
	}
	
	function CreateRosette( position, rotation )
	{		
		var RosetteGeometry = new THREE.BoxGeometry( 25,25,25 );
		var material = new THREE.MeshBasicMaterial( { color: 0x6d3aff , side: THREE.DoubleSide } );
		
		scope.RosetteMesh = new THREE.Mesh(RosetteGeometry, material);
		scope.RosetteMesh.name = "Rosette";
		scope.RosetteMesh.position.set(position.x, position.y + 12.5 , position.z); 
	    //scope.ComputerMesh.rotation.set(0, rotation.y, 0);

		scope.position = scope.RosetteMesh.position;

		var centerOfMesh = scope.RosetteMesh.geometry.center();
		//using that I translated the doors's x by 50 points so it basically rotates on it's side.
		//scope.ComputerMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(centerOfMesh.x - 50, centerOfMesh.y, centerOfMesh.z) );
		
		var spritey = IndoorNavigation.Core.makeTextSprite( "Rosette", 
		{ fontsize: 50, fontface: "Georgia", borderColor: {r:0, g:0, b:255, a:1.0} } );
		spritey.position.set(position.x, position.y + 150 , position.z);
		IndoorNavigation.mainScene.add( spritey );
		
		IndoorNavigation.mainScene.add(scope.RosetteMesh);
	}	
    
	this.updateItem = function () { }
}


///////////////////////////////////////////////////////////
/////////////////// WIRES MODULE //////////////////////////
///////////////////////////////////////////////////////////

IndoorNavigation.WiresModule = function()
{
    IndoorNavigation.Module.call(this, "WiresModule", "0.0.1", true);

    var scope = this;
    this.wires = [];

    this.updateModule = function ()
    {

    }

    this.addWire = function ( wire )
    {
        this.wires.push( wire );
    }

    this.addCollection = function ( data , markers )
    {
        var multiply = data.Parameters.Unit;
        var Connections = data.Connections;

        for (var i = 0; i < Connections.length; i++)
        {
            var IDS = Connections[i].IDs;
            var AdditionalPoints = Connections[i].AdditionalPoints;

            var Path = [];

            var FirstObject = markers.filter(function (o) { return o.ID == IDS[0]; })[0];
            var SecondObject = markers.filter(function (o) { return o.ID == IDS[1]; })[0];
         
            if (AdditionalPoints.length > 0)
                //Push additional points between objects
                for (var j = 0; j < AdditionalPoints.length; j++) {
                    var point = AdditionalPoints[j];
                    var position = new THREE.Vector3(
                        point[0] + data.Parameters.TranslateX,
                        point[1] + data.Parameters.TranslateY,
                        point[2] + data.Parameters.TranslateZ).multiplyScalar(multiply);
                    if (j == 0)
                        //Push 1 object point
                        Path.push(new THREE.Vector3(FirstObject.Position.x, position.y, FirstObject.Position.z));
                    Path.push(position);
                    if (j + 1 == AdditionalPoints.length)
                        //Push 2 object point
                        Path.push(new THREE.Vector3(SecondObject.Position.x, position.y, SecondObject.Position.z));

                }
            else Path.push(FirstObject.Position, SecondObject.Position);

            

            this.addWire(new IndoorNavigation.Wire(Path));
        }       
    }

    this.deleteWire = function()
    {
        //TODO
    }
	
}


IndoorNavigation.Wire = function (markersPositions) {

    var scope = this;

    Init();

    function Init() {
        //var curve = new THREE.LineCurve3(markersPositions[0], markersPositions[1]);
        var curve = new THREE.SplineCurve3(markersPositions);

        var geometry = new THREE.TubeGeometry(
            curve,  //path
            64,    //segments
            5,     //radius
            8,     //radiusSegments
            false  //closed
        );

        var geometryShader = new THREE.TubeGeometry(
            curve,  //path
            64,    //segments
            10,     //radius
            8,     //radiusSegments
            false  //closed
        );

        var darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, vertexColors: THREE.FaceColors });
        var wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffcc, wireframe: false, transparent: false });
        var multiMaterial = [darkMaterial, wireframeMaterial];

        var darkMaterial2 = new THREE.LineBasicMaterial({ color: 0x000000, vertexColors: THREE.FaceColors });
        //for (var i = 0, j = 4; i < geometry.faces.length; i++) {
        //    if (i < j)
        //        geometry.faces[i].color.setHex(0x7b1cdb);//Math.random() * 0xffffff);
        //    else {
        //        geometry.faces[i].color.setHex(0x75a948);
        //        if (i > j + 4) j += 10;
        //    }
        //}

        scope.wire = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);
        scope.wire.position.set(0, 0, 0);
        IndoorNavigation.mainScene.add(scope.wire);

        var customMaterial = new THREE.ShaderMaterial(
        {
            uniforms:
            {
                "c": { type: "f", value: 1.0 },
                "p": { type: "f", value: 1.4 },
                glowColor: { type: "c", value: new THREE.Color(0x515edb) },
                viewVector: { type: "v3", value: IndoorNavigation.Core.camera.position }
            },
            vertexShader: ["uniform vec3 viewVector;",
                            "uniform float c;",
                            "uniform float p;",
                            "varying float intensity;",
                            "void main()",
                            "{",
                                "vec3 vNormal = normalize( normalMatrix * normal );",
                                "vec3 vNormel = normalize( normalMatrix * viewVector );",
                                "intensity = 1.0; //pow( c - dot(vNormal, vNormel), p );",
                                "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                            "}"].join("\n"),
            fragmentShader: ["uniform vec3 glowColor;",
                              "varying float intensity;",
                              "void main()",
                              "{",
                                  "vec3 glow = glowColor * intensity;",
                                  "gl_FragColor = vec4( glow, 1.0 );",
                              "}"].join("\n"),
            side: THREE.FrontSide,
            //alphaTest: 0.9,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        scope.Glow = new THREE.Mesh(geometryShader, customMaterial);
        scope.Glow.position.set(0, 0, 0);
        IndoorNavigation.mainScene.add(scope.Glow);
    }

}

///////////////////////////////////////////////////////////
///////////////////  API Functions  ///////////////////////
/////////////////// Created in Core ///////////////////////
///////////////////////////////////////////////////////////

IndoorNavigation.API = function()
{

    this.CreatePathTest = function (markersPositions) {

        // для проверки того что функция уже вызвана и чтобы задать новый путь
        // нужно отчистить старый + через Apifunctions происходит вызов метода updateAPI
        IndoorNavigation.Core.APIfunctions.push(this);

        var texturePath = '/App_Constructor/Assets/disc.png';
        var scope = this;
        scope.enabled = true;

        scope.defaultPositions = [];
        scope.defaultColours = [];
        scope.sprites = []; // for debugging

        scope.TotalPathLength = CalculateTotalPath().toFixed(0);
        scope.TotalPoints = (scope.TotalPathLength / 40).toFixed(0); // 40 - размер простраства точки
        
        scope.miniCycle = 1;
        scope.miniCycleMax = 11; // RULE : scope.step * (scope.miniCycleMax - scope.miniCycle ) == 100
        scope.step = 10; // percents

        Init();

        scope.cycle = 0;
        scope.cycleMax = scope.defaultPositions.length - 1;
            //parseInt(scope.TotalPoints, 10) + (markersPositions.length);      

        function Init() {

            scope.particleGeometry = new THREE.Geometry();

            //Создадим массивы координат пути
            for (var i = 0; i < markersPositions.length - 1; i++) {
                //если мы вызвали не первый раз функцию, то необходимо удалить последний элемент, т.к. они единтичны с первым элементом следующего массива
                // иначе будет неподвижная точка на изгибах
                if (i > 0) scope.defaultPositions.splice(scope.defaultPositions.length - 1, 1);
                createPathArray(markersPositions[i], markersPositions[i + 1], scope.particleGeometry.vertices);
            }
            
            //for (var j = 0; j < scope.particleGeometry.vertices.length; j++) {
            //    var sprite = IndoorNavigation.Core.makeTextSprite( " " + j + " " , { fontsize: 50, fontface: "Georgia", borderColor: { r: 0, g: 0, b: 255, a: 1.0 }});
            //    IndoorNavigation.mainScene.add(sprite);
            //    scope.sprites.push(sprite);
            //}

            var discTexture = THREE.ImageUtils.loadTexture(texturePath);

            // properties that may vary from particle to particle. 
            // these values can only be accessed in vertex shaders! 
            //  (pass info to fragment shader via vColor.)
            scope.attributes =
            {
                customColor: { type: 'c', value: [] },
                customOffset: { type: 'f', value: [] },
            };


            // RGB (255, 0 - 255)
            // RGB (255 - 0, 255)

            var particleCount = scope.particleGeometry.vertices.length;
            var colorsNumber = 2 / particleCount;
            var colorRed = 1.0;
            var colorGreen = 0.0;
            for (var v = 0, z = 0; v < particleCount; v++, z++) {
                //attributes.customColor.value[v] = new THREE.Color().setHSL(1 - v / particleCount, 1.0, 0.5);
                if (v < particleCount / 2) {
                    colorGreen = z * colorsNumber;
                    if (v + 1 == particleCount / 2) z = 0;
                }
                else {
                    colorGreen = 1.0;
                    colorRed = 1.0 - z * colorsNumber;
                }
                scope.attributes.customColor.value[v] = new THREE.Color().setRGB(colorRed, colorGreen, 0.0);
                scope.defaultColours.push(new THREE.Color().setRGB(colorRed, colorGreen, 0.0));                
            }

            // values that are constant for all particles during a draw call
            this.uniforms =
            {
                time: { type: "f", value: 1.0 },
                texture: { type: "t", value: discTexture },
            };

            var shaderMaterial = new THREE.ShaderMaterial(
            {
                uniforms: uniforms,
                attributes: scope.attributes,
                vertexShader: [
                    "uniform float time;",
                    "attribute vec3 customColor;",
                    "varying vec3 vColor;",
                    "void main()",
                    "{",
                       "vColor = customColor; // set color associated to vertex; use later in fragment shader.",

                        "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",

                        // option (1): draw particles at constant size on screen
                        // gl_PointSize = size;
                        // option (2): scale particles as objects in 3D space
                        "gl_PointSize = 40.0 * ( 300.0 / length( mvPosition.xyz ) );",
                        "gl_Position = projectionMatrix * mvPosition;",
                    "}"
                ].join("\n"),
                fragmentShader: [
                    "uniform sampler2D texture;",
                    "varying vec3 vColor; // colors associated to vertices, assigned by vertex shader",
                    "void main()",
                    "{",
                        // calculates a color for the particle
                        "gl_FragColor = vec4( vColor, 1.0 );",
                        // sets a white particle texture to desired color
                        "gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );",
                    "}"
                ].join("\n"),
                transparent: true,
                //alphaTest: 0.5,  // if having transparency issues, try including: alphaTest: 0.5, 
                //blending: THREE.AdditiveBlending//, depthTest: false,
                // I guess you don't need to do a depth test if you are alpha blending
                // 
            });

            var particleCube = new THREE.ParticleSystem(scope.particleGeometry, shaderMaterial);

            particleCube.position.set(0, 15, 0);

            particleCube.dynamic = true;
            // in order for transparency to work correctly, we need sortParticles = true.
            //  but this won't work if we calculate positions in vertex shader,
            //  so positions need to be calculated in the update function,
            //  and set in the geometry.vertices array
            particleCube.sortParticles = true;
            IndoorNavigation.mainScene.add(particleCube);
        }

        function move(newPos, lastPos, positionToAdd) {
            var nextvector = new THREE.Vector3().subVectors(newPos, lastPos).multiplyScalar(scope.step / 100);
            positionToAdd.add(nextvector);
        }

        function createPathArray(pos1, pos2, array) {

            var directionVector = new THREE.Vector3().subVectors(pos2, pos1);

            //вычисляем кол-во точек для данного отрезка, чтобы они были равномерно распределенны на всем пути
            var PointsForThisVector = parseInt((directionVector.length() / scope.TotalPathLength * scope.TotalPoints).toFixed(0), 10);

            for (var i = 0 ; i <= PointsForThisVector; i++) {
                var vector = directionVector.clone().multiplyScalar(i / (PointsForThisVector + 1));
                var finalvector = new THREE.Vector3().addVectors(pos1, vector);
                array.push(finalvector);
            }

            for (var i = 0; i <= PointsForThisVector + 1; i++) {
                var vector = directionVector.clone().multiplyScalar(i / (PointsForThisVector + 1));
                var finalvector = new THREE.Vector3().addVectors(pos1, vector);
                scope.defaultPositions.push(finalvector);
                //testVertex2(finalvector);
            }
        }

        this.updateAPI = function () {
            var values = "";
            var positions = scope.defaultPositions;
            var array = scope.particleGeometry.vertices;
            var newPos, oldPos, cycleCopy;
            cycleCopy = scope.cycle;
            for (var v = 0, z = 0; v < array.length; v++, z++) {
                newPos = z + 1 + cycleCopy;
                oldPos = z + cycleCopy;
                if (newPos > array.length - 1) // если вышли за пределы массива, значит дошли до точек которые уже перемещены в начало
                {
                    z = -1; cycleCopy = 0;
                }
                move(positions[newPos], positions[oldPos], array[v]);
                //scope.sprites[v].position.set(array[v].x, array[v].y + 50, array[v].z);
                //values += "<p>[" + v + "] : " + array[v].x.toFixed(0) + "/ " + array[v].z.toFixed(0) + "</p>";
            } 

            scope.miniCycle++;

            // завершилось смещение ровно на 1 элемент
            if (scope.miniCycle == scope.miniCycleMax) {
                scope.miniCycle = 1; remakeArray(array); scope.cycle++;
            }
            if (scope.cycle == scope.cycleMax) {               
                scope.cycle = 0;
            }
        }

        function remakeArray(array) {
            var number = array.length - 1 - scope.cycle;
            var lastItem = array[number]; // нельзя переделывать массив,т.к. привязка элементов не по координатам, приходится переставлять вручную
            var v = scope.defaultPositions[0];
            //scope.attributes.customColor.value[number] = scope.defaultColours[0];

            // Берем номер шарика который переместился в начало, присваем его номер к i
            // закрашиваем с самого начала, при этом с номера последнего перемещенного шарика в начало
            for (var i = number, j = 0; j < array.length - 1; j++)
            {
                scope.attributes.customColor.value[i] = scope.defaultColours[j];
                if (i < array.length - 1) i++;
                else i = 0;
            }

            lastItem.set(v.x, v.y, v.z); // нельзя присваивать , т.к. передается ссылка...
        }

        function CalculateTotalPath()
        {
            var TotalPathLength = 0;

            for (var i = 0; i < markersPositions.length - 1; i++) {

                var directionVector = new THREE.Vector3().subVectors(markersPositions[i + 1], markersPositions[i]);
                //найдем длину всего пути
                TotalPathLength += directionVector.length();
            }

            return TotalPathLength;
        }

        function testVertex2(position) {
            var vertexGeometry = new THREE.SphereGeometry(6, 12, 6);
            var vertexMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            var vertexMesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
            vertexMesh.position.set(position.x, position.y, position.z);
            IndoorNavigation.mainScene.add(vertexMesh);
        }

        function testEdge(point1, point2) {
            var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            var direction = new THREE.Vector3().subVectors(point2, point1);
            var arrow = new THREE.ArrowHelper(direction.clone().normalize(), point1);
            var rotation = new THREE.Euler().setFromQuaternion(arrow.quaternion);
            var edgeGeometry = new THREE.CylinderGeometry(3, 3, direction.length(), 8, 4);
            var edge = new THREE.Mesh(edgeGeometry, material);
            var position = new THREE.Vector3().addVectors(point1, direction.multiplyScalar(0.5));

            edge.position.set(position.x, position.y, position.z);// = position;
            edge.rotation.set(rotation.x, rotation.y, rotation.z);// = rotation;

            IndoorNavigation.mainScene.add(edge);
        }

        function makeTextSprite(message, parameters) {
            if (parameters === undefined) parameters = {};

            var fontface = parameters.hasOwnProperty("fontface") ?
                parameters["fontface"] : "Arial";

            var fontsize = parameters.hasOwnProperty("fontsize") ?
                parameters["fontsize"] : 18;

            var borderThickness = parameters.hasOwnProperty("borderThickness") ?
                parameters["borderThickness"] : 4;

            var borderColor = parameters.hasOwnProperty("borderColor") ?
                parameters["borderColor"] : { r: 0, g: 0, b: 0, a: 1.0 };

            var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
                parameters["backgroundColor"] : { r: 255, g: 255, b: 255, a: 1.0 };

            //var spriteAlignment = parameters.hasOwnProperty("alignment") ?
            //	parameters["alignment"] : THREE.SpriteAlignment.topLeft;

            var spriteAlignment = THREE.SpriteAlignment.topLeft;


            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            context.font = "Bold " + fontsize + "px " + fontface;

            // get size data (height depends only on font size)
            var metrics = context.measureText(message);
            var textWidth = metrics.width;

            // background color
            context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
                                          + backgroundColor.b + "," + backgroundColor.a + ")";
            // border color
            context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
                                          + borderColor.b + "," + borderColor.a + ")";

            context.lineWidth = borderThickness;
            roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
            // 1.4 is extra height factor for text below baseline: g,j,p,q.

            // text color
            context.fillStyle = "rgba(0, 0, 0, 1.0)";

            context.fillText(message, borderThickness, fontsize + borderThickness);

            // canvas contents will be used for a texture
            var texture = new THREE.Texture(canvas)
            texture.needsUpdate = true;

            var spriteMaterial = new THREE.SpriteMaterial(
                { map: texture, useScreenCoordinates: false, alignment: spriteAlignment });
            var sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(100, 50, 1.0);
            return sprite;
        }

        // function for drawing rounded rectangles
        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    this.CreatePath = function(markersPositions)
    {
        IndoorNavigation.Core.APIfunctions.push(this); // для проверки того что функция уже вызвана и чтобы задать новый путь
        // нужно отчистить старый
        var scope = this;
        scope.enabled = true;
        scope.points = 50;

        scope.miniCycle = 1;
        scope.miniCycleMax = 11; // RULE : scope.step * (scope.miniCycleMax - scope.miniCycle ) == 100
        scope.step = 10; // percents

        scope.cycle = 0;
        scope.cycleMax = scope.points + 1;

        scope.defaultPositions = [];

        Init();

        function Init() {

            scope.particleGeometry = new THREE.Geometry();

            createPathArray(markersPositions[0], markersPositions[1], scope.particleGeometry.vertices);

            //testEdge(markersPositions[0], markersPositions[1]);

            var discTexture = THREE.ImageUtils.loadTexture('/App_Constructor/Assets/disc.png');

            // properties that may vary from particle to particle. 
            // these values can only be accessed in vertex shaders! 
            //  (pass info to fragment shader via vColor.)
            this.attributes =
            {
                customColor: { type: 'c', value: [] },
                customOffset: { type: 'f', value: [] },
            };

            var particleCount = scope.particleGeometry.vertices.length
            for (var v = 0; v < particleCount; v++) {
                attributes.customColor.value[v] = new THREE.Color().setHSL(1 - v / particleCount, 1.0, 0.5);
                //attributes.customOffset.value[ v ] = 6.282 * (v / particleCount); // not really used in shaders, move elsewhere
            }

            // values that are constant for all particles during a draw call
            this.uniforms =
            {
                time: { type: "f", value: 1.0 },
                texture: { type: "t", value: discTexture },
            };

            var shaderMaterial = new THREE.ShaderMaterial(
            {
                uniforms: uniforms,
                attributes: attributes,
                vertexShader: document.getElementById('vertexshader').textContent,
                fragmentShader: document.getElementById('fragmentshader').textContent,
                transparent: true,
                //alphaTest: 0.5,  // if having transparency issues, try including: alphaTest: 0.5, 
                //blending: THREE.AdditiveBlending//, depthTest: false,
                // I guess you don't need to do a depth test if you are alpha blending
                // 
            });

            var particleCube = new THREE.ParticleSystem(scope.particleGeometry, shaderMaterial);

            particleCube.position.set(0, 15, 0);

            particleCube.dynamic = true;
            // in order for transparency to work correctly, we need sortParticles = true.
            //  but this won't work if we calculate positions in vertex shader,
            //  so positions need to be calculated in the update function,
            //  and set in the geometry.vertices array
            particleCube.sortParticles = true;
            IndoorNavigation.mainScene.add(particleCube);
        }

        function move(newPos, lastPos, positionToAdd) {
            var nextvector = new THREE.Vector3().subVectors(newPos, lastPos).multiplyScalar(scope.step / 100);
            return positionToAdd.add(nextvector);
        }

        function createPathArray(pos1, pos2, array) {
            scope.position1 = pos1;
            scope.position2 = pos2;

            scope.directionVector = new THREE.Vector3().subVectors(pos2, pos1);

            for (var i = 0 ; i <= scope.points; i++) {
                var vector = scope.directionVector.clone().multiplyScalar(i / (scope.points + 1));
                var finalvector = new THREE.Vector3().addVectors(pos1, vector);
                array.push(finalvector);
            }

            for (var i = 0; i <= scope.points + 1; i++) {

                var vector = scope.directionVector.clone().multiplyScalar(i / (scope.points + 1));
                var finalvector = new THREE.Vector3().addVectors(pos1, vector);
                scope.defaultPositions.push(finalvector);
                //testVertex2(finalvector);
            }
        }

        this.updateAPI = function() {
            var positions = scope.defaultPositions;
            var array = scope.particleGeometry.vertices;
            for (var v = 0; v < array.length; v++) {
                array[v] = move(positions[v + 1], positions[v], array[v]);
            }

            scope.miniCycle++;

            if (scope.miniCycle == scope.miniCycleMax) { scope.miniCycle = 1; remakeArray(array); scope.cycle++; }
            if (scope.cycle == scope.cycleMax) scope.cycle = 0;
        }

        function remakeArray(array) {
            var lastItem = array[array.length - 1 - scope.cycle]; // нельзя переделывать массив,т.к. привязка элементов не по координатам, приходится переставлять вручную
            var v = scope.defaultPositions[0];
            lastItem.set(v.x, v.y, v.z); // нельзя присваивать , т.к. передается ссылка...
        }

    }

    this.ShowInfoBox = function(status)
    {
        if (status)
            $('#NetworkItemInfo').fadeIn('fast');
        else
            if ($('#NetworkItemInfo').css('display') != 'none')
                $('#NetworkItemInfo').fadeOut();
    }
}


// конвейр :D
/*
IndoorNavigation.WiresModule = function (markersPositions) {
    IndoorNavigation.Module.call(this, "WiresModule", "0.0.1", true);

    var scope = this;
    scope.points = 10;
    scope.cycle = 2;
    scope.miniCycle = 1;

    Init();

    function Init() {
        scope.particleGeometry = new THREE.Geometry();
        //for (var i = 0; i < 100; i++)
        //	scope.particleGeometry.vertices.push( new THREE.Vector3(0,0,0) );

        createPathArray(markersPositions[0], markersPositions[1], scope.particleGeometry.vertices);
        //for (var i = 0; i < 2; i++)
        //    scope.particleGeometry.vertices.push(markersPositions[i]);

        var discTexture = THREE.ImageUtils.loadTexture('/App_Constructor/Assets/disc.png');


        // properties that may vary from particle to particle. 
        // these values can only be accessed in vertex shaders! 
        //  (pass info to fragment shader via vColor.)
        this.attributes =
		{
		    customColor: { type: 'c', value: [] },
		    customOffset: { type: 'f', value: [] },
		};

        var particleCount = scope.particleGeometry.vertices.length
        for (var v = 0; v < particleCount; v++) {
            attributes.customColor.value[v] = new THREE.Color().setHSL(1 - v / particleCount, 1.0, 0.5);
            attributes.customOffset.value[v] = 6.282 * (v / particleCount); // not really used in shaders, move elsewhere
        }

        // values that are constant for all particles during a draw call
        this.uniforms =
		{
		    time: { type: "f", value: 1.0 },
		    texture: { type: "t", value: discTexture },
		};

        var shaderMaterial = new THREE.ShaderMaterial(
		{
		    uniforms: uniforms,
		    attributes: attributes,
		    vertexShader: document.getElementById('vertexshader').textContent,
		    fragmentShader: document.getElementById('fragmentshader').textContent,
		    transparent: true,  //alphaTest: 0.5,  // if having transparency issues, try including: alphaTest: 0.5, 
		    // blending: THREE.AdditiveBlending, depthTest: false,
		    // I guess you don't need to do a depth test if you are alpha blending
		    // 
		});

        var particleCube = new THREE.ParticleSystem(scope.particleGeometry, shaderMaterial);
        particleCube.position.set(markersPositions[0].x, 85, markersPositions[0].z);
        particleCube.dynamic = true;
        // in order for transparency to work correctly, we need sortParticles = true.
        //  but this won't work if we calculate positions in vertex shader,
        //  so positions need to be calculated in the update function,
        //  and set in the geometry.vertices array
        particleCube.sortParticles = true;
        IndoorNavigation.mainScene.add(particleCube);
    }

    function position(t) {
        return new THREE.Vector3(
				20.0 * Math.cos(2.0 * t) * (3.0 + Math.cos(3.0 * t)),
				20.0 * Math.sin(2.0 * t) * (3.0 + Math.cos(3.0 * t)),
				50.0 * Math.sin(3.0 * t));
    }

    function move(offset) {
        return scope.directionVector.clone().multiplyScalar(offset / 10);
    }

    function move2(vertNum, lastPos) {
        var nextpoint = scope.directionVector.clone().multiplyScalar(vertNum / 10);

        var miniDirection = new THREE.Vector3().subVectors(nextpoint, lastPos).multiplyScalar(scope.miniCycle / 100);

        return new THREE.Vector3().addVectors(lastPos, miniDirection);
        //miniDirection;
    }

    function createPathArray(pos1, pos2, array) {
        scope.directionVector = new THREE.Vector3().subVectors(pos2, pos1);

        for (var i = 1 ; i <= scope.points; i++) {
            var vector = scope.directionVector.clone().multiplyScalar(i / scope.points);
            array.push(vector);
        }
    }

    this.updateModule = function () {
        var t0 = IndoorNavigation.Core.clock.getElapsedTime();
        uniforms.time.value = 0.125 * t0;

        for (var v = 0; v < scope.particleGeometry.vertices.length; v++) {
            var timeOffset = uniforms.time.value + attributes.customOffset.value[v];
            scope.particleGeometry.vertices[v] = move2(v + scope.cycle, scope.particleGeometry.vertices[v]);
        }

        scope.miniCycle++;

        if (scope.miniCycle == 100) { scope.miniCycle = 1; scope.cycle++; }
        if (scope.cycle == 10) scope.cycle = 0;
    }
}
*/








