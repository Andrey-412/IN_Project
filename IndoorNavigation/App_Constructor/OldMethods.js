

/// Заменен на грид с ручной нормалью, т.к. вычисления не нужны ...
/// они зависят от Значений векторов, что в данном случае не нужно
/// т.к. заранее знаем оси на которых строятся сегменты
/// если X & Y = то нормаль равна (0,0,1)
/// если X & Z = то нормаль (0,1,0)
function makeGrid(width, height, squaresOneSide, GridColor) {
    var squares = squaresOneSide;
    var geometry = new THREE.BufferGeometry();

    // атрибуты BufferGeometry
    var faces = [];
    var positions = new Float32Array(squares * squares * 2 * 3 * 3);
    var normals = new Float32Array(squares * squares * 2 * 3 * 3);
    var colors = new Float32Array(squares * squares * 2 * 3 * 3);

    var color = new THREE.Color();

    // 1 segment                     // 2 segment
    var pA = new THREE.Vector3(); var pA2 = new THREE.Vector3();
    var pB = new THREE.Vector3(); var pB2 = new THREE.Vector3();
    var pC = new THREE.Vector3(); var pC2 = new THREE.Vector3();

    var cb = new THREE.Vector3(); var cb2 = new THREE.Vector3();
    var ab = new THREE.Vector3(); var ab2 = new THREE.Vector3();

    var Xdirection = width;
    var Zdirection = height;
    var startX = -(squares / 2 * width);  // координата верхнего левого угла По оси X
    var startZ = -(squares / 2 * height); // координата верхнего левого угла По оси Z
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
            var ax = startX + Xdirection * j, az = 0, ay = startZ + Zdirection * currRow;
            var ax2 = startX + Xdirection * (j + 1), az2 = 0, ay2 = startZ + Zdirection * (currRow + 1);

            var bx = startX + Xdirection * j, bz = 0, by = startZ + Zdirection * (currRow + 1);
            var bx2 = startX + Xdirection * (j + 1), bz2 = 0, by2 = startZ + Zdirection * currRow;

            var cx = startX + Xdirection * (j + 1), cz = 0, cy = startZ + Zdirection * (currRow + 1);
            var cx2 = startX + Xdirection * j, cz2 = 0, cy2 = startZ + Zdirection * currRow;

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


            //_____ нормали поверхностей(плоскостей/faces)__________//
            // 1ый сегмент                  // 2ой сегмент
            pA.set(ax, ay, az); pA2.set(ax2, ay2, az2);
            pB.set(bx, by, bz); pB2.set(bx2, by2, bz2);
            pC.set(cx, cy, cz); pC2.set(cx2, cy2, cz2);

            //вычитание векторов (Sets this vector to a - b)
            cb.subVectors(pC, pB); cb2.subVectors(pC2, pB2);
            ab.subVectors(pA, pB); ab2.subVectors(pA2, pB2);

            //It results in a vector that is perpendicular to vector
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

            // colors
            var face1 = new THREE.Face3(pA, pB, pC);
            var face2 = new THREE.Face3(pA2, pB2, pC2);
            face1.normal.copy(normal);
            face2.normal.copy(normal);
            face1.vertexNormals.push(new THREE.Vector3(nx, ny, nz),
                new THREE.Vector3(nx, ny, nz),
                new THREE.Vector3(nx, ny, nz));
            face2.vertexNormals.push(new THREE.Vector3(nx2, ny2, nz2),
                new THREE.Vector3(nx2, ny2, nz2),
                new THREE.Vector3(nx2, ny2, nz2));
            faces.push(face1); faces.push(face2);

            color = new THREE.Color("rgb(130, 130, 130)");

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
    geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('faces', new THREE.BufferAttribute(faces, 2));

    geometry.computeBoundingSphere();

    return geometry;
}