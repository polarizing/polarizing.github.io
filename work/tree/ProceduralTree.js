
class ProceduralTree {
    constructor(config) {
        this.myTree = new Tree({
            "seed": config.seed,
            "segments": config.segments,
            "levels": config.levels,
            "vMultiplier": config.vMultiplier,
            "twigScale": config.twigScale,
            "initalBranchLength": config.initalBranchLength,
            "lengthFalloffFactor": config.lengthFalloffFactor,
            "lengthFalloffPower": config.lengthFalloffPower,
            "clumpMax": config.clumpMax,
            "clumpMin": config.clumpMin,
            "branchFactor": config.branchFactor,
            "dropAmount": config.dropAmount,
            "growAmount": config.growAmount,
            "sweepAmount": config.sweepAmount,
            "maxRadius": config.maxRadius,
            "climbRate": config.climbRate,
            "trunkKink": config.trunkKink,
            "treeSteps": config.treeSteps,
            "taperRate": config.taperRate,
            "radiusFalloffRate": config.radiusFalloffRate,
            "twistRate": config.twistRate,
            "trunkLength": config.trunkLength
        });

        this.octree = new THREE.Octree({
                radius: 0.05, // optional, default = 1, octree will grow and shrink as needed
                undeferred: false, // optional, default = false, octree will defer insertion until you call octree.update();
                depthMax: Infinity, // optional, default = Infinity, infinite depth
                objectsThreshold: 1, // optional, default = 8
                overlapPct: 0, // optional, default = 0.15 (15%), this helps sort objects that overlap nodes
                scene: false // optional, pass scene as parameter only if you wish to visualize octree
        })


        this.trunkGeometry = new THREE.Geometry();
        this.leafGeometry = new THREE.Geometry();

        var self = this;

        // convert the vertices
        this.myTree.verts.forEach(function(v) {
            var vert = new THREE.Vector3(v[0],v[1],v[2])
            self.trunkGeometry.vertices.push(vert);
            // console.log(vert);
        });


        this.myTree.vertsTwig.forEach(function(v) {
            self.leafGeometry.vertices.push(new THREE.Vector3(v[0],v[1],v[2]));
        });


        // convert the faces
        this.myTree.faces.forEach(function(f) {
            self.trunkGeometry.faces.push(new THREE.Face3(f[0],f[1],f[2]));
        });


        this.myTree.facesTwig.forEach(function(f) {
            self.leafGeometry.faces.push(new THREE.Face3(f[0],f[1],f[2]));
        });

        console.log('Trunk Vert:', this.trunkGeometry.vertices.length);
        console.log('Trunk Face:', this.trunkGeometry.faces.length);
        console.log('Leaf Vert:', this.leafGeometry.vertices.length);
        console.log('Leaf Face:', this.leafGeometry.faces.length);

        // console.log(this.leafGeometry.faces);

        // setup uvsTwig
        this.myTree.facesTwig.forEach(function(f) {
            var uva = self.myTree.uvsTwig[f[0]];
            var uvb = self.myTree.uvsTwig[f[1]];
            var uvc = self.myTree.uvsTwig[f[2]];

            var vuva = new THREE.Vector2(uva[0],uva[1]);
            var vuvb = new THREE.Vector2(uvb[0],uvb[1]);
            var vuvc = new THREE.Vector2(uvc[0],uvc[1]);

            self.leafGeometry.faceVertexUvs[0].push([vuva, vuvb, vuvc]);
        });


        // setup uvsTwig
        this.myTree.faces.forEach(function(f) {
            var uva = self.myTree.UV[f[0]];
            var uvb = self.myTree.UV[f[1]];
            var uvc = self.myTree.UV[f[2]];

            var vuva = new THREE.Vector2(uva[0],uva[1]);
            var vuvb = new THREE.Vector2(uvb[0],uvb[1]);
            var vuvc = new THREE.Vector2(uvc[0],uvc[1]);

            self.trunkGeometry.faceVertexUvs[0].push([vuva, vuvb, vuvc]);
        });

        var textureLoader = new THREE.TextureLoader();
        // Create material.
        var leafTexture = textureLoader.load("assets/textures/pink.png");
        leafTexture.anisotropy = 0;
        leafTexture.magFilter = THREE.NearestFilter;
        leafTexture.minFilter = THREE.NearestFilter;
        this.leafMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, map: leafTexture });
        this.leafMaterial.doubleSided = true;
        this.leafMaterial.transparent = true;

        // this.leafMaterial = new THREE.MeshBasicMaterial( { color: 0x999999, wireframe: true, wireframeLinewidth: 0.25 } );
        this.leafMaterial.blending = THREE.CustomBlending;
        this.leafMaterial.blendSrc = THREE.OneFactor;
        this.leafMaterial.blendDst = THREE.OneMinusSrcAlphaFactor
        this.leafMaterial.alphaTest = 0.5;
// 
        // this.trunkMaterial = new THREE.MeshBasicMaterial( { color: 0x666666, wireframe: true, wireframeLinewidth: 0.25 } );

        var trunkTexture = textureLoader.load("assets/textures/bark.jpg");
        this.trunkMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, map: trunkTexture });
        this.trunkMaterial.doubleSided = true;
        this.trunkMaterial.transparent = true;
        this.trunkMaterial.alphaTest = 0.5;
        this.trunkMaterial.anisotropy = 0;
        this.trunkMaterial.magFilter = THREE.NearestFilter;
        this.trunkMaterial.minFilter = THREE.NearestFilter;
                // this.trunkMaterial.blending = THREE.MultiplyBlending;

        // Compute normals.
        this.trunkGeometry.computeFaceNormals();
        this.leafGeometry.computeFaceNormals();
        this.trunkGeometry.computeVertexNormals(true);
        this.leafGeometry.computeVertexNormals(true);

        // Create mesh.
        this.trunkMesh = new THREE.Mesh(this.trunkGeometry, this.trunkMaterial);
        this.trunkMesh.name = 'trunk';
        this.trunkMesh.castShadow = true;
        this.trunkMesh.receiveShadow = true;


        this.twigMesh = new THREE.Mesh(this.leafGeometry, this.leafMaterial);
        this.twigMesh.name = 'twig';
        this.twigMesh.castShadow = true;
        this.twigMesh.receiveShadow = true;
        this.octree.add( this.twigMesh, { useVertices: true } );

        // this.trunkGeometry.verticesNeedUpdate = true;

        // console.log(this.trunkMesh.geometry.vertices);

        this.twigMesh.geometry.vertices.forEach(function (vert) {
            var object = {x: vert.x, y: vert.y, z: vert.z, radius: 0.05, id: self.twigMesh}
            self.octree.add( object )
        })

        this.octree.update();

        // var currNode = this.octree.root.getNodeCountEnd();

        // var currNode = this.octree.root;
        // while (currNode.nodesIndices.length > 0) {
        //     // for (curr)
        // }

        this.lastNodes = [];
        getLastNode( this.octree.root );

        function getLastNode ( node ) {
            if ( node.nodesIndices.length == 0 ) {
                // console.log( node.depth );
                // this.lastNodes.push( node );
                if (node.depth >= 10) {
                    self.lastNodes.push( node );
                }

                // console.log(node.getObjectCountEnd());
                // if (node.getObjectCountEnd() <= 8 && node.depth >= 9) {
                //     this.lastNodes.push( node );

                // }
            }
            for ( var i = 0, l = node.nodesIndices.length; i < l; i++ ) {
                var next = node.nodesByIndex[ node.nodesIndices[ i ] ];
                getLastNode( next );
            }
        }

        var visualGeometry = new THREE.CubeGeometry( 0.6, 0.6, 0.6 );
        // var visualGeometry =  new THREE.SphereGeometry( 2, 16, 16 );

        // var visualMaterial = new THREE.MeshBasicMaterial( { color: 0x333333, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending} );

        // visualMaterial.depthTest = true;
        var visualMaterial = new THREE.MeshBasicMaterial( { color: 0xFF0066, wireframe: false} );
        // var visualMaterial = 
        // visualMaterial.blending = THREE.AdditiveBlending;
        for (var i = 0; i < this.lastNodes.length; i++) {

            var node = this.lastNodes[i];
            
            var visual = new THREE.Mesh( visualGeometry, visualMaterial );
            visual.scale.set( node.radiusOverlap * 2, node.radiusOverlap * 2, node.radiusOverlap * 2 );
            visual.position.copy( node.position );
            // scene.add( visual );
        }



        console.log(this.lastNodes.length);

    }

}
