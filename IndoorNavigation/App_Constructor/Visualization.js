var Core = new IndoorNavigation.Core('WebGLContainer', true);


this.POLYHEDRA5 = {
    TestFirstFloor: {
        "Parameters": {
            "FloorNumber": 1,
            "Height": 2.5,
            "TranslateX": -10, // изпользуется при scale стены, чтобы она нормально изменялась со всех сторон 
            "TranslateZ": -7, // Пр. (0,0,0) не scale' ится ...
            "TranslateY": 0.5,
            "Unit": 100, // в 1 метре единиц ( Scalar )
        },
        "Rooms": [
                    {
                        "name": "Basement",
                        "colors": { "wall": 0xAFD2E4, "top": 0xAFD2E4, "bot": 0xAFD2E4, "vertexColor": "", "edgeColor": "", },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.65], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true, // если здание представляет собой коробку, то верхние координаты идентичны нижним (y + Height)
                        "specialHeight": 0.5, //override height in parameters.height
                        "buildArmature": false,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": true,
                        "vertex": [[0, -0.5, 0], [20, -0.5, 0], [20, -0.5, 17], [0, -0.5, 17]],  // specialHeight + TranslateY
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
                    {
                        "name": "MainOutsideWalls",
                        "colors": { "wall": 0xAFD2E4, "top": "", "bot": "", "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true, // если здание представляет собой коробку, то верхние координаты идентичны нижним (y + Height)
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": false,
                        "vertex": [[0, 0, 0], [20, 0, 0], [20, 0, 17], [0, 0, 17]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                    },
                    {
                        "name": "лестница",
                        "colors": { "wall": 0xafe4b3, "top": 0xcd1ccf, "bot": 0x999292, "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, }, //0xc3a3a3
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true,
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": true,
                        "vertex": [[0.5, 0, 0.5], [3.5, 0, 0.5], [3.5, 0, 8.5], [0.5, 0, 8.5]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
                    {
                        "name": "кабинет №1",
                        "colors": { "wall": 0xFDE6BF, "top": "", "bot": 0x999292, "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true,
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": true,
                        "vertex": [[3.75, 0, 0.5], [11.25, 0, 0.5], [11.25, 0, 8.5], [3.75, 0, 8.5]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
                    {
                        "name": "кабинет №2",
                        "colors": { "wall": 0xFDE6BF, "top": "", "bot": 0x999292, "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true,
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": true,
                        "vertex": [[11.5, 0, 0.5], [19.5, 0, 0.5], [19.5, 0, 8.5], [11.5, 0, 8.5]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
                    {
                        "name": "холл",
                        "colors": { "wall": 0xFDE6BF, "top": "", "bot": 0x999292, "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true,
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": true,
                        "vertex": [[0.5, 0, 8.75], [19.5, 0, 8.75], [19.5, 0, 16.5], [0.5, 0, 16.5]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
        ],
        "Objects": [
                    {
                        "name": "door_лестница",
                        "center": { "x": 2, "y": 1 }, // x - показывает насколько далеко центер от левой опоры
                        // процентам top : 10% от высоты стены , bot : 20%/height , left:... right:...
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "лестница", "number": 2 }
                    },
                    {
                        "name": "door_холл",
                        "center": { "x": 17, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "холл", "number": 0 }
                    },
                    {
                        "name": "window_кабинет №1",
                        "center": { "x": 4, "y": 1.25 },
                        "size": { "width": 1, "height": 1.5 },
                        "usedFace": { "objectName": "кабинет №1", "number": 0 }
                    },
                    {
                        "name": "window_MainOutsideWalls",
                        "center": { "x": 12.75, "y": 1.25 },
                        "size": { "width": 1, "height": 1.5 },
                        "usedFace": { "objectName": "MainOutsideWalls", "number": 0 }
                    },
                    {
                        "name": "window_кабинет №2",
                        "center": { "x": 4, "y": 1.25 },
                        "size": { "width": 1, "height": 1.5 },
                        "usedFace": { "objectName": "кабинет №2", "number": 0 }
                    },
                    {
                        "name": "window_MainOutsideWalls",
                        "center": { "x": 4.5, "y": 1.25 },
                        "size": { "width": 1, "height": 1.5 },
                        "usedFace": { "objectName": "MainOutsideWalls", "number": 0 }
                    },
                    {
                        "name": "door_кабинет №1",
                        "center": { "x": 2, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "кабинет №1", "number": 2 }
                    },
                    {
                        "name": "door_холл",
                        "center": { "x": 13.75, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "холл", "number": 0 }
                    },
                    {
                        "name": "door_кабинет №2",
                        "center": { "x": 2, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "кабинет №2", "number": 2 }
                    },
                    {
                        "name": "door_холл",
                        "center": { "x": 6, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "холл", "number": 0 }
                    },
                    {
                        "name": "door_холл",
                        "center": { "x": 10, "y": 1 },
                        "size": { "width": 2, "height": 2 },
                        "usedFace": { "objectName": "холл", "number": 2 }
                    },
                    {
                        "name": "door_MainOutsideWalls",
                        "center": { "x": 10.5, "y": 1 },
                        "size": { "width": 2, "height": 2 },
                        "usedFace": { "objectName": "MainOutsideWalls", "number": 2 }
                    },
        ]
    },
    TestSecondFloor: {
        "Parameters": {
            "FloorNumber": 2,
            "Height": 2.5,
            "TranslateX": -10, // изпользуется при scale стены, чтобы она нормально изменялась со всех сторон 
            "TranslateZ": -7, // Пр. (0,0,0) не scale' ится ...
            "TranslateY": 3.5,
            "Unit": 100, // в 1 метре единиц ( Scalar )
        },
        "Rooms": [
                    {
                        "name": "Basement",
                        "colors": { "wall": 0xAFD2E4, "top": 0xAFD2E4, "bot": 0xAFD2E4, "vertexColor": "", "edgeColor": "", },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.65], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true, // если здание представляет собой коробку, то верхние координаты идентичны нижним (y + Height)
                        "specialHeight": 0.5,
                        "buildArmature": false,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": false,
                        "vertex": [[0, -0.5, 0], [20, -0.5, 0], [20, -0.5, 17], [0, -0.5, 17]],  // specialHeight + TranslateY
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
                    {
                        "name": "MainOutsideWalls",
                        "colors": { "wall": 0xAFD2E4, "top": "", "bot": "", "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true, // если здание представляет собой коробку, то верхние координаты идентичны нижним (y + Height)
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": false,
                        "vertex": [[0, 0, 0], [20, 0, 0], [20, 0, 17], [0, 0, 17]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                    },
                    {
                        "name": "лестница",
                        "colors": { "wall": 0xafe4b3, "top": 0xcd1ccf, "bot": 0x1c5bcf, "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true,
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": false,
                        "vertex": [[0.5, 0, 0.5], [3.5, 0, 0.5], [3.5, 0, 8.5], [0.5, 0, 8.5]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
                    {
                        "name": "кабинет №1",
                        "colors": { "wall": 0xFDE6BF, "top": "", "bot": "", "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true,
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": true,
                        "vertex": [[3.75, 0, 0.5], [11.25, 0, 0.5], [11.25, 0, 8.5], [3.75, 0, 8.5]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
                    {
                        "name": "кабинет №2",
                        "colors": { "wall": 0xFDE6BF, "top": "", "bot": "", "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true,
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": true,
                        "vertex": [[11.5, 0, 0.5], [19.5, 0, 0.5], [19.5, 0, 8.5], [11.5, 0, 8.5]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
                    {
                        "name": "холл",
                        "colors": { "wall": 0xFDE6BF, "top": "", "bot": "", "vertexColor": 0xF3A281, "edgeColor": 0xFACA9E, },
                        "materials": { "outside": [true, THREE.DoubleSide, 0.25], "inside": [false, THREE.FrontSide] },
                        "TopCoordsEqualBottom": true,
                        "buildArmature": true,
                        "buildWalls": true,
                        "buildTop": false,
                        "buildBottom": true,
                        "vertex": [[0.5, 0, 8.75], [19.5, 0, 8.75], [19.5, 0, 16.5], [0.5, 0, 16.5]],
                        "edge": [[0, 1], [1, 5], [5, 4], [4, 0], [1, 2], [2, 6], [6, 5], [2, 3], [3, 7], [7, 6], [3, 0], [4, 7]],
                        "face": [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
                        "botface": [[0, 1, 2, 3]],
                        "topface": [[4, 5, 6, 7]]
                    },
        ],
        "Objects": [
                    {
                        "name": "door_лестница",
                        "center": { "x": 2, "y": 1 }, // x - показывает насколько далеко центер от левой опоры
                        // процентам top : 10% от высоты стены , bot : 20%/height , left:... right:...
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "лестница", "number": 2 }
                    },
                    {
                        "name": "door_холл",
                        "center": { "x": 17, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "холл", "number": 0 }
                    },
                    {
                        "name": "window_кабинет №1",
                        "center": { "x": 4, "y": 1.25 },
                        "size": { "width": 1, "height": 1.5 },
                        "usedFace": { "objectName": "кабинет №1", "number": 0 }
                    },
                    {
                        "name": "window_MainOutsideWalls",
                        "center": { "x": 12.75, "y": 1.25 },
                        "size": { "width": 1, "height": 1.5 },
                        "usedFace": { "objectName": "MainOutsideWalls", "number": 0 }
                    },
                    {
                        "name": "window_кабинет №2",
                        "center": { "x": 4, "y": 1.25 },
                        "size": { "width": 1, "height": 1.5 },
                        "usedFace": { "objectName": "кабинет №2", "number": 0 }
                    },
                    {
                        "name": "window_MainOutsideWalls",
                        "center": { "x": 4.5, "y": 1.25 },
                        "size": { "width": 1, "height": 1.5 },
                        "usedFace": { "objectName": "MainOutsideWalls", "number": 0 }
                    },
                    {
                        "name": "door_кабинет №1",
                        "center": { "x": 2, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "кабинет №1", "number": 2 }
                    },
                    {
                        "name": "door_холл",
                        "center": { "x": 13.75, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "холл", "number": 0 }
                    },
                    {
                        "name": "door_кабинет №2",
                        "center": { "x": 2, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "кабинет №2", "number": 2 }
                    },
                    {
                        "name": "door_холл",
                        "center": { "x": 6, "y": 1 },
                        "size": { "width": 1, "height": 2 },
                        "usedFace": { "objectName": "холл", "number": 0 }
                    },
        ]
    },
};

var buildingModule = new IndoorNavigation.BuildingModule();   			
buildingModule.addFloor( new IndoorNavigation.BuildingModule.Floor( this.POLYHEDRA5.TestFirstFloor ));
//buildingModule.addFloor( new IndoorNavigation.BuildingModule.Floor( this.POLYHEDRA5.TestSecondFloor ));
Core.addModule(buildingModule);

Core.addInterface( new IndoorNavigation.Interface.BuildingInterface( buildingModule ));


this.FURNITURE = {
		TestFirstFloor: {
						"Parameters" : {
							"FloorNumber": 1,
							"Height" : 2.5,
							"TranslateX" : -10, 
							"TranslateZ" : -7,
							"TranslateY" : 0.5,
							"Unit" : 100
						},	
						"Objects" : [ 
							{	"type" : "StairsType1",
								"position" : [ 2, 0, 8.5 ],
								"boxWidth" : 300,
								"boxHeight" : 250,
								"boxLengt" : 800,
								"angle" : 180				
							},
							{	"type" : "DoorType1",
								Room1Point0 : [ 3.5,0,8.5 ],
								Room1Point1 : [ 0.5,0,8.5 ],
								Room2Point0 : [ 0.5,0,8.75 ],  
								Room2Point1 : [ 19.5,0,8.75 ],
								usedObject1 : {  	"name" : "door_лестница",
													"center" : { "x": 2, "y": 1 },
													"size" : { "width" : 1, "height" : 2 },
													"usedFace" : { "objectName": "лестница", "number": 2 } 
												},
								usedObject2	: {  	"name" : "door_холл",
													"center" : { "x": 17, "y": 1 }, 
													"size" : { "width" : 1, "height" : 2 },
													"usedFace" : { "objectName": "холл", "number": 0 } 
												}	
							},
							{	"type" : "WindowType1",
								Room1Point0 : [ 0,0,0 ],
								Room1Point1 : [ 20,0,0 ],
								Room2Point0 : [ 3.75,0,0.5 ],  
								Room2Point1 : [ 11.25,0,0.5 ],
								usedObject1	: {	"name" : "window_MainOutsideWalls",
												"center" : { "x": 12.75, "y": 1.25 },
												"size" : { "width" : 1, "height" : 1.5 },
												"usedFace" : { "objectName": "MainOutsideWalls", "number": 0 } 
											},
								usedObject2 : {	"name" : "window_кабинет №1",
												"center" : { "x": 4, "y": 1.25 },
												"size" : { "width" : 1, "height" : 1.5 },
												"usedFace" : { "objectName": "кабинет №1", "number": 0 } 
											},
							}
						]
		}
};

var furnitureModule = new IndoorNavigation.FurnitureModule();
furnitureModule.addCollection( this.FURNITURE.TestFirstFloor );
Core.addModule(furnitureModule);


this.NETWORK = {
    TestFirstFloor: {
        "Parameters" : {
            "FloorNumber": 1,
            "Height" : 2.5,
            "TranslateX" : -10, 
            "TranslateZ" : -7,
            "TranslateY" : 0.5,
            "Unit" : 100
        },	
        "Markers" : [ 
            {	"type" : "Door",
                "name" : "MainOutsideWalls",
                Room1Point0 : [19.5,0,16.5],  
                Room1Point1 : [0.5,0,16.5],
                Room2Point0 : [20,0,17],
                Room2Point1 : [0,0,17],
                usedObject1 : {  	"name" : "door_холл",
                    "center" : { "x": 10, "y": 1 }, 
                    "size" : { "width" : 2, "height" : 2 },
                    "usedFace" : { "objectName": "холл", "number": 2 } 
                },
                usedObject2	: {  	"name" : "door_MainOutsideWalls",
                    "center" : { "x": 10.5, "y": 1 }, 
                    "size" : { "width" : 2, "height" : 2 },
                    "usedFace" : { "objectName": "MainOutsideWalls", "number": 2 } 
                },				
            },
            {	"type" : "Door",
                "name" : "Лестница",
                Room1Point0 : [ 3.5,0,8.5 ],     
                Room1Point1 : [ 0.5,0,8.5 ],
                Room2Point0 : [ 0.5,0,8.75 ],    
                Room2Point1 : [ 19.5,0,8.75 ],
                usedObject1 : {  	"name" : "door_лестница",
                    "center" : { "x": 2, "y": 1 }, 
                    "size" : { "width" : 1, "height" : 2 },
                    "usedFace" : { "objectName": "лестница", "number": 2 } 
                },						
                usedObject2	: {  	"name" : "door_холл",
                    "center" : { "x": 17, "y": 1 }, 
                    "size" : { "width" : 1, "height" : 2 },
                    "usedFace" : { "objectName": "холл", "number": 0 } 
                },				
            },
            {	"type" : "Door",
                "name" : "кабинет №1",
                Room1Point0 : [11.25,0,8.5],
                Room1Point1 : [3.75,0,8.5],
                Room2Point0 : [ 0.5,0,8.75 ],  
                Room2Point1 : [ 19.5,0,8.75 ],
                usedObject1 : {  	"name" : "door_кабинет №1",
                    "center" : { "x": 2, "y": 1 }, 
                    "size" : { "width" : 1, "height" : 2 },
                    "usedFace" : { "objectName": "кабинет №1", "number": 2 } 
                },
                usedObject2	: {  	"name" : "door_холл",
                    "center" : { "x": 13.75, "y": 1 }, 
                    "size" : { "width" : 1, "height" : 2 },
                    "usedFace" : { "objectName": "холл", "number": 0 } 
                }				
            },
            {	"type" : "Door",
                "name" : "кабинет №2",
                Room1Point0 : [19.5,0,8.5],
                Room1Point1 : [11.5,0,8.5],
                Room2Point0 : [ 0.5,0,8.75 ],  
                Room2Point1 : [ 19.5,0,8.75 ],
                usedObject1 : {  	"name" : "door_кабинет №2",
                    "center" : { "x": 2, "y": 1 }, 
                    "size" : { "width" : 1, "height" : 2 },
                    "usedFace" : { "objectName": "кабинет №2", "number": 2 } 
                },						
                usedObject2	: {  	"name" : "door_холл",
                    "center" : { "x": 6, "y": 1 }, 
                    "size" : { "width" : 1, "height" : 2 },
                    "usedFace" : { "objectName": "холл", "number": 0 } 
                },				
            },
            {	"type" : "Computer",
                "id" : 1,
                "room" : "",
                "position" : [1,0,7]
            },
            {	"type" : "Computer",
                "id": 2,
                "room" : "",
                "position" : [18,0,4]
            },
            {	"type" : "Commutator",
                "id": 3,
                "room" : "",
                "position" : [2.5,0,1]
            },
            {	"type" : "Commutator",
                "id": 4,
                "room" : "",
                "position" : [10.5,0,1]
            },
            {	"type" : "Modem",
                "id": 5,
                "room" : "",
                "position" : [3,0,4]
            },
            {	"type" : "Server",
                "id": 6,
                "room" : "",
                "position" : [4.5,0,7.5]
            },
            {	"type" : "Rosette",
                "id": 7,
                "room" : "",
                "position" : [16,0,0.75]
            },
            {	"type" : "Printer",
            	"id" : 8,
            	"room" : "",
            	"position" : [9,0,15.5]
            }						
        ]
    },
    TestData: {
        "Parameters": {
            "FloorNumber": 1,
            "Height": 2.5,
            "TranslateX": -10,
            "TranslateZ": -7,
            "TranslateY": 0.5,
            "Unit": 100
        },
        "Markers": [
            {
                "type": "Door",
                "name": "Лестница",
                Room1Point0: [3.5, 0, 8.5],
                Room1Point1: [0.5, 0, 8.5],
                Room2Point0: [0.5, 0, 8.75],
                Room2Point1: [19.5, 0, 8.75],
                usedObject1: {
                    "name": "door_лестница",
                    "center": { "x": 2, "y": 1 },
                    "size": { "width": 1, "height": 2 },
                    "usedFace": { "objectName": "лестница", "number": 2 }
                },
                usedObject2: {
                    "name": "door_холл",
                    "center": { "x": 17, "y": 1 },
                    "size": { "width": 1, "height": 2 },
                    "usedFace": { "objectName": "холл", "number": 0 }
                },
            },
            {
                "type": "Door",
                "name": "MainOutsideWalls",
                Room1Point0: [19.5, 0, 16.5],
                Room1Point1: [0.5, 0, 16.5],
                Room2Point0: [20, 0, 17],
                Room2Point1: [0, 0, 17],
                usedObject1: {
                    "name": "door_холл",
                    "center": { "x": 10, "y": 1 },
                    "size": { "width": 2, "height": 2 },
                    "usedFace": { "objectName": "холл", "number": 2 }
                },
                usedObject2: {
                    "name": "door_MainOutsideWalls",
                    "center": { "x": 10.5, "y": 1 },
                    "size": { "width": 2, "height": 2 },
                    "usedFace": { "objectName": "MainOutsideWalls", "number": 2 }
                },
            },
            {
                "type": "Door",
                "name": "кабинет №2",
                Room1Point0: [19.5, 0, 8.5],
                Room1Point1: [11.5, 0, 8.5],
                Room2Point0: [0.5, 0, 8.75],
                Room2Point1: [19.5, 0, 8.75],
                usedObject1: {
                    "name": "door_кабинет №2",
                    "center": { "x": 2, "y": 1 },
                    "size": { "width": 1, "height": 2 },
                    "usedFace": { "objectName": "кабинет №2", "number": 2 }
                },
                usedObject2: {
                    "name": "door_холл",
                    "center": { "x": 6, "y": 1 },
                    "size": { "width": 1, "height": 2 },
                    "usedFace": { "objectName": "холл", "number": 0 }
                },
            },
            {	"type" : "Rosette",
                "number" : "1",
                "room" : "",
                "position" : [16,0,0.75]
            }]
    }
}

var networkModule = new IndoorNavigation.NetworkModule();
networkModule.addCollection(this.NETWORK.TestFirstFloor);
//networkModule.addCollection(this.NETWORK.TestData); // for test
Core.addModule(networkModule);


this.WIRES = {
    TestFirstFloor: {
        "Parameters": {
            "FloorNumber": 1,
            "Height": 2.5,
            "TranslateX": -10,
            "TranslateZ": -7,
            "TranslateY": 0.5,
            "Unit": 100
        },
        "Connections": [
            {
                IDs: [1, 3],
                AdditionalPoints: [[1, 0, 1]]
            },
            {
                IDs: [3, 5],
                AdditionalPoints: [[2.5, 0, 2.5]]
            },
            {
                IDs: [3, 4],
                AdditionalPoints: [[7, 0, 1]]
            },
            {
                IDs: [4, 6],
                AdditionalPoints: [[10.5, 0, 7.5]]
            },
            {
                IDs: [4, 7],
                AdditionalPoints: []
            },
            {
                IDs: [7, 2],
                AdditionalPoints: [[16, 0, 4]]
            },
            {
                IDs: [7, 8],
                AdditionalPoints: [[19, 0, 2], [19, 0, 8], [18, 0, 15.5]]
            }
        ]
    }
}

var wiresModule = new IndoorNavigation.WiresModule().addCollection(this.WIRES.TestFirstFloor, networkModule.markers);
//Core.addModule(wiresModule);


//Core.API.CreatePath(networkModule.markersPos);
Core.API.CreatePathTest(networkModule.markersPos);

Core.animate();








