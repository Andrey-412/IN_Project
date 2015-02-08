var NormalGridTexture, HoveredGridTexture;
var PointMap;

LoadAssets();

function LoadAssets() {
    // note: 4x4 checkboard pattern scaled so that each square is 25 by 25 pixels.
    //floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    //floorTexture.repeat.set(10, 10);
    PointMap = new THREE.ImageUtils.loadTexture('/App_Constructor/Assets/point.png');
    NormalGridTexture = new THREE.ImageUtils.loadTexture('/App_Constructor/Assets/GridNormal.png');
    HoveredGridTexture = new THREE.ImageUtils.loadTexture('/App_Constructor/Assets/GridHovered.png');
}