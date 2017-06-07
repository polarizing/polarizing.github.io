    <script>

//------------------------------------------------------
// Some globally shared variables
//------------------------------------------------------

// global variables
var MAX_HEIGHT = 10;
var renderer;
var scene;
var camera;
var control;
var stats;


var controls;

var spheres = [];
var treeAttractors = [];
var genericAttractor;
var p_tree;
var wind = 0;
var clock;
var tree;

var emitter, particleGroup, numEmitters = 120;

class Tween {
    constructor(timeArray, valueArray) {
        this.times = timeArray || [];
        this.values = valueArray || [];
    }

    lerp(t) {
        // console.log(t);
        var i = 0;
        var n = this.times.length;
        while (i < n && t > this.times[i])  
            i++;
        if (i == 0) return this.values[0];
        if (i == n) return this.values[n-1];
        var p = (t - this.times[i-1]) / (this.times[i] - this.times[i-1]);
        if (this.values[0] instanceof THREE.Vector3)
            return this.values[i-1].clone().lerp( this.values[i], p );
        else // its a float
            return this.values[i-1] + p * (this.values[i] - this.values[i-1]);
    }
}

class UtilsMath {
    constructor() {

    }

    static randomVector3(base, spread) {

        var x = base.x + ( Math.random() * spread.x - ( spread.x * 0.5 ) ),
            y = base.y + ( Math.random() * spread.y - ( spread.y * 0.5 ) ),
            z = base.z + ( Math.random() * spread.z - ( spread.z * 0.5 ) );

        return new THREE.Vector3(x, y, z);
    }

    static randomFloat(base, spread) {
        return base + spread * (Math.random() - 0.5);
    }
}


class Node extends THREE.Vector3 {
    constructor(nX, nY, nZ) {
        super(nX, nY, nZ);
        this.x = nX || 0;
        this.y = nY || 0;
        this.z = nZ || 0;
        this.id = "";
        this.diameter = 0;
        this.constrain = {
            x: [-Number.MAX_VALUE, Number.MAX_VALUE],
            y: [-Number.MAX_VALUE, Number.MAX_VALUE],
            z: [-Number.MAX_VALUE, Number.MAX_VALUE]
        }
        this.velocity = new THREE.Vector3();
        this.maxVelocity = 0.5;
        this.acceleration = new THREE.Vector3();
        this.maxAcceleration = Number.MAX_VALUE;
        this.damping = 0.0;
        this.radius = 200.0; // radius of attraction?
        this.strength = 1.0;
        this.ramp = 0.75;
    }

    rotateX(theAngle) {
        var newY = this.y * Math.cos(theAngle) - this.z * Math.sin(theAngle);
        var newZ = this.y * Math.sin(theAngle) + this.z * Math.cos(theAngle);
        this.y = newY;
        this.z = newZ;
    }

    rotateY(theAngle) {
        var newX = this.x * Math.cos(-theAngle) - this.z * Math.sin(-theAngle);
        var newZ = this.x * Math.sin(-theAngle) + this.z * Math.cos(-theAngle);
        this.x = newX;
        this.z = newZ;
    }

    rotateZ(theAngle) {
        var newX = this.x * Math.cos(theAngle) - this.y * Math.sin(theAngle);
        var newY = this.x * Math.sin(theAngle) + this.y * Math.cos(theAngle);
        this.x = newX;
        this.y = newY;
    }

    attractAll(nodes) {
        for (var i = 0; i < nodes.length; i++) {
            var otherNode = nodes[i];
            if (otherNode == null) break;
            if (otherNode == this) continue;
            this.attract(otherNode);
        }
    }

    attract(node) {
        var d = this.distanceTo(node);

        if (d > 0 && d < this.radius) {

            // var s = Math.powd / this.radius;
            // var f = 1 / Math.pow(s, 0.5) - 1;
            // f = f / this.radius;
            var s = Math.pow(d / this.radius, 1 / this.ramp);
            var f = s * 9 * this.strength * (1 / (s + 1) + ((s - 3) / 4)) / d;

            var df = new THREE.Vector3().subVectors(this, node);
            df.multiplyScalar(f);
            node.velocity.x += df.x;
            node.velocity.y += df.y;
            node.velocity.z += df.z;
        }
    }

    update() {
        // Limit function -- equivalent to this.velocity.limit(maxVelocity);
        var magSq = this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y + this.velocity.z * this.velocity.z;
        if (magSq > this.maxVelocity * this.maxVelocity) {
            this.velocity.normalize();
            this.velocity.multiplyScalar(this.maxVelocity);
        }

        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.velocity.z += this.acceleration.z;

        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.z += this.velocity.z;

        var minX = this.constrain.x[0];
        var maxX = this.constrain.x[1];
        var minY = this.constrain.y[0];
        var maxY = this.constrain.y[1];
        var minZ = this.constrain.z[0];
        var maxZ = this.constrain.z[1];

        if (this.x < minX) {
            this.x = minX - (this.x - minX);
            this.velocity.x = -this.velocity.x;
        }
        if (this.x > maxX) {
            this.x = maxX - (this.x - maxX);
            this.velocity.x = -this.velocity.x;
        }

        if (this.y < minY) {
            this.y = minY - (this.y - minY);
            this.velocity.y = -this.velocity.y;
        }
        if (this.y > maxY) {
            this.y = maxY - (this.y - maxY);
            this.velocity.y = -this.velocity.y;
        }

        if (this.z < minZ) {
            this.z = minZ - (this.z - minZ);
            this.velocity.z = -this.velocity.z;
        }
        if (this.z > maxZ) {
            this.z = maxZ - (this.z - maxZ);
            this.velocity.z = -this.velocity.z;
        }

        this.velocity.multiplyScalar(1 - this.damping);
        this.acceleration.multiplyScalar(0);
    }

}


class Attractor extends Node {
    
    constructor( nX, nY, nZ ) {
        super(nX, nY, nZ);

        this.BASIC = 0;
        this.SMOOTH = 1;
        this.TWIRL = 2;

        this.mode = this.SMOOTH;
        this.strength = 1;
        this.nodes = [];

    }

    attachNode( theNode ) {
        this.nodes.push( theNode );
    }

    // Overrides parent method.
    attractAll() {
        for (var i = 0; i < this.nodes.length; i++) {
            this.attract( this.nodes[ i ] );
        }
    }

    // Overrides parent method.
    attract( node ) {
        var d = this.distanceTo(node);
        var f = 0;

        switch (this.mode) {
            case (this.BASIC):
                if (d > 0 && d < this.radius) {
                    var s = d / this.radius;
                    f = (1 / Math.pow(s, 0.5 * this.ramp) - 1);
                    f = this.strength * f / this.radius;
                }
                break;
            case (this.SMOOTH || this.TWIRL):
                if (d > 0 && d < this.radius) {
                    var s = Math.pow(d / this.radius, 1 / this.ramp);
                    var f = s * 9 * this.strength * (1 / (s + 1) + ((s - 3) / 4)) / d;
                }
                break;
        }

        // case smooth
        

        var df = new THREE.Vector3().subVectors(this, node);
        df.multiplyScalar(f);

        if (this.mode != this.TWIRL) {
            node.velocity.x += df.x;
            node.velocity.y += df.y;
            node.velocity.z += df.z;
        } else {
            node.velocity.x += df.y;
            node.velocity.y -= df.x;
            node.velocity.z += df.z;
        }

    }

    getMode() {
        return this.mode;
    }

    setMode( theMode ) {
        this.mode = theMode;
    }

    getStrength() {
        return this.strength;
    }

    setStrength( theStrength ) {
        this.strength = theStrength;
    }

    getNodes() {
        return this.nodes;
    }

    setNodes( nodes ) {
        this.nodes = nodes;
    }

}

class AttractorParticle extends Node {
    constructor(nX, nY, nZ) {
        super(nX, nY, nZ);
        // this.position = new THREE.Vector3();
        // this.velocity = new THREE.Vector3();
        // this.acceleration = new THREE.Vector3();

        this.angle = 0;
        this.angleVelocity = 0;
        this.angleAcceleration = 0;

        this.size = 16.0;

        this.color = new THREE.Color();
        this.opacity = 1.0;

        this.age = 0;
        this.alive = 0;
    }


    step(delta) {

        // console.log('Step: ', this);
        this.update(); // updates position, vel, acc based on current node props

        // this.position.add( this.velocity.clone().multiplyScalar(delta) );
        // this.velocity.add( this.acceleration.clone().multiplyScalar(delta) );

        this.angle += this.angleVelocity * 0.01745329251 * delta;
        this.angleVelocity += this.angleAcceleration * 0.01745329251 * delta;
        // console.log("Angle acceleration" this.angleAcceleration * 0.01745 * delta);

        this.age += delta;

        if ( this.sizeTween.times.length > 0 )
            this.size = this.sizeTween.lerp( this.age );
        // console.log(this.size);
        if ( this.colorTween.times.length > 0 )
        {
            var colorHSL = this.colorTween.lerp( this.age );
            this.color = new THREE.Color().setHSL( colorHSL.x, colorHSL.y, colorHSL.z );
        }
    
        if ( this.opacityTween.times.length > 0 )
            this.opacity = this.opacityTween.lerp( this.age );

    }
}

AttractorParticle.prototype.sizeTween = new Tween();
AttractorParticle.prototype.colorTween = new Tween();
AttractorParticle.prototype.opacityTween = new Tween();

options = {
    particle: {
        texture: new THREE.TextureLoader().load( "assets/textures/particles/particle.png"),
        rate: 10,
        deathAge: 400.0,
        blendStyle: THREE.NormalBlending,
    },
    attractor: {
        deathAge: 400.0,
    },
    position: {
        base: new THREE.Vector3(0, 0, 0),
        spread: new THREE.Vector3(0, 0, 0),
    },
    angle: {
        base: 0,
        spread: 50,
    },
    angleVelocity: {
        base: 0,
        spread: 0,
    },
    angleAcceleration: {
        base: 0,
        spread: 0,
    },
    size: {
        base: 1.5,
        spread: 0.5,
        tween: new Tween( [0, 0.5], [0.5, 0.5] ),
    },
    opacity: {
        base: 1.0,
        spread: 0.0,
        // tween: new Tween( [2, 3], [0.9, 0.9] ),
        tween: new Tween()
    },
    color: {
        // base: new THREE.Vector3(0.0, 1.0, 0.5),
        // spread: new THREE.Vector3(0.8, 1.0, 0.5), // rainbow!
        base: new THREE.Vector3(0.0, 1.0, 1.0),
        spread: new THREE.Vector3(0.0, 0.0, 0.0),
        tween: new Tween(),
        // tween: new Tween( [0.5, 2], [ new THREE.Vector3(0, 1, 0.5), new THREE.Vector3(0.8, 1, 0.5) ] )
    },
}

class TreeAttractor extends Attractor {

    // camera for z-indexing
    constructor( nX, nY, nZ, camera, options ) {
        super(nX, nY, nZ);

        this.camera = camera;

        // Particle Properties
        this.particlesPerSecond = options.particle.rate;
        this.particleDeathAge = options.particle.deathAge;
        
        // Attractor Properties
        this.attractorAlive = true;
        this.attractorAge = 0.0;
        this.attractorDeathAge = options.attractor.deathAge;

        // this.particleCount = this.particlesPerSecond * Math.min( this.particleDeathAge, this.attractorDeathAge );
        this.particleCount = 10;
        this.uuid = THREE.Math.generateUUID();

        this.position = {
            _base: options.position.base,
            _spread: options.position.spread
        }

        // this.velocity = {
        //     _base: options.velocity.base,
        //     _spread: options.velocity.spread
        // }

        this.angle = {
            _base: options.angle.base,
            _spread: options.angle.spread
        }

        this.angleVelocity = {
            _base: options.angleVelocity.base,
            _spread: options.angleVelocity.spread
        }

        this.angleAcceleration = {
            _base: options.angleAcceleration.base,
            _spread: options.angleAcceleration.spread
        }

        // color, opacity, and size are tweenable values
        this.size = {
            _base: options.size.base,
            _spread: options.size.spread,
            _tween: options.size.tween
        }

        this.opacity = {
            _base: options.opacity.base,
            _spread: options.opacity.spread,
            _tween: options.opacity.tween
        }

        this.color = {
            _base: options.color.base,
            _spread: options.color.spread,
            _tween: options.color.tween
        }

        this.blendStyle = options.particle.blendStyle;
        
        // THREE.JS RENDERING FOR PARTICLE MESH AFFECTED BY THIS ATTRACTOR
        this.particleGeom = new THREE.BufferGeometry();
        // var textureLoader = new THREE.TextureLoader();
        // Create material.
        // var particleTexture = options.particle.texture;
        // particleTexture.anisotropy = 0;
        // particleTexture.magFilter = THREE.NearestFilter;
        // particleTexture.minFilter = THREE.NearestFilter;
        // this.particleMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, map: particleTexture });
        // this.particleMaterial.doubleSided = true;
        // this.particleMaterial.transparent = true;


        // this.particleMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );  
        // this.particleMaterial = new THREE.PointsMaterial( { 
        //     color: 0xFFFFFF,
        //     size: 0.3,
        //     map: options.particle.texture,
        //     blending: THREE.NormalBlending,
        //     transparent: true,
        //     // lights: true
        //  } )

        // this.particleMaterial = new THREE.MeshPhongMaterial( { ambient: 0x050505, color: 0x0033ff, specular: 0x555555, shininess: 30 } );
        this.particleMaterial = new THREE.ShaderMaterial( {
            uniforms: 
            {
                color:     { value: new THREE.Color( 0xffffff ) },
                texture:   { value: options.particle.texture },
            },
            vertexShader:   document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
            transparent: true, // alphaTest: 0.5,  // if having transparency issues, try including: alphaTest: 0.5, 
            alphaTest: 0.5,
            blending: THREE.NormalBlending, 
            depthTest: true,
            depthWrite: true,
        });

        this.particleMaterial.side = THREE.DoubleSide;
        // this.particleMaterial.transparent = true;


        this.particleMesh = new THREE.Points();
        this.particleMesh.dynamic = true;
        this.particleMesh.sortParticles = true;
        this.particleMesh.castShadow = true;
        this.particleMesh.receiveShadow = true;

    }

    createParticle() {
        var particle = new AttractorParticle();
        // particle.position = UtilsMath.randomVector3( this.position._base, this.position._spread );
        var pos = UtilsMath.randomVector3( this.position._base, this.position._spread );
        particle.x = pos.x;
        particle.y = pos.y;
        particle.z = pos.z;
        particle.angle = UtilsMath.randomFloat( this.angle._base, this.angle._spread );
        particle.angleVelocity = UtilsMath.randomFloat( this.angleVelocity._base, this.angleVelocity._spread );
        particle.angleAcceleration = UtilsMath.randomFloat( this.angleAcceleration._base, this.angleAcceleration._spread );
        particle.opacity = UtilsMath.randomFloat( this.opacity._base, this.opacity._spread );
        var color = UtilsMath.randomVector3( this.color._base, this.color._spread );
        particle.color = new THREE.Color().setHSL( color.x, color.y, color.z );
        particle.age = 0;
        return particle;
    }

    setParticleCount(pc) {
        this.particleCount = pc;
    }

    initialize() {

        AttractorParticle.prototype.sizeTween = this.size._tween;
        AttractorParticle.prototype.opacityTween = this.opacity._tween;
        AttractorParticle.prototype.colorTween = this.color._tween;

        var positions = new Float32Array( this.particleCount * 3 );
        var colors = new Float32Array( this.particleCount * 3 );
        var sizes = new Float32Array( this.particleCount );
        var angles = new Float32Array( this.particleCount );
        var visibilities = new Float32Array( this.particleCount );
        var opacities = new Float32Array( this.particleCount );

        var color = new THREE.Color();

        for (var i = 0, i3 = 0; i < this.particleCount; i++, i3 += 3) {
            this.nodes.push( this.createParticle() );
            positions[ i3 + 0 ] = this.nodes[i].x;
            positions[ i3 + 1 ] = this.nodes[i].y;
            positions[ i3 + 2 ] = this.nodes[i].z;

            angles[ i ] = this.nodes[i].angle;
            visibilities[ i ] = this.nodes[i].alive;
            opacities[ i ] = this.nodes[i].opacity;
            sizes[ i ] = this.nodes[i].size;

            colors[ i3 + 0 ] = this.nodes[i].r;
            colors[ i3 + 1 ] = this.nodes[i].g;
            colors[ i3 + 2 ] = this.nodes[i].b;
        }

        this.particleGeom.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        this.particleGeom.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
        this.particleGeom.addAttribute( 'customSize', new THREE.BufferAttribute( sizes, 1 ) );
        this.particleGeom.addAttribute( 'customAngle', new THREE.BufferAttribute( angles, 1 ) );
        this.particleGeom.addAttribute( 'customVisibility', new THREE.BufferAttribute( visibilities, 1 ) );
        this.particleGeom.addAttribute( 'customOpacity', new THREE.BufferAttribute( opacities, 1 ) );

        this.particleMaterial.blending = this.blendStyle;
        if ( this.blendStyle != THREE.NormalBlending) 
            this.particleMaterial.depthTest = false;


        this.particleMesh = new THREE.Points(this.particleGeom, this.particleMaterial);
        // this.particleMesh.dynamic = true;
        // this.particleMesh.sortParticles = true;
        this.particleMesh.castShadow = true;
        this.particleMesh.receiveShadow = true;
        scene.add( this.particleMesh );
    }

    step(dt) {

        var time = Date.now() * 0.005;

        var recycleIndices = [];

        var positions = this.particleGeom.attributes.position.array;
        var colors = this.particleGeom.attributes.customColor.array;
        var sizes = this.particleGeom.attributes.customSize.array;
        var angles = this.particleGeom.attributes.customAngle.array;
        var visibilities = this.particleGeom.attributes.customVisibility.array;
        var opacities = this.particleGeom.attributes.customOpacity.array;

        for (var i = 0, i3 = 0; i < this.particleCount; i++, i3 += 3) {

            if ( this.nodes[i].alive ) {

                this.nodes[i].step(dt); // update node

                if ( this.nodes[i].age > this.particleDeathAge ) 
                {
                    this.nodes[i].alive = 0.0;
                    recycleIndices.push(i);
                }

                // update position
                positions[ i3 + 0 ] = this.nodes[i].x;
                positions[ i3 + 1 ] = this.nodes[i].y;
                positions[ i3 + 2 ] = this.nodes[i].z;

                // update particle properties in shader
                visibilities[ i ] = this.nodes[i].alive;
                opacities[ i ] = this.nodes[i].opacity;
                sizes[ i ]    = this.nodes[i].size;
                angles[ i ]   = this.nodes[i].angle;

                var color = this.nodes[i].color;

                colors[ i3 + 0 ] = color.r;
                colors[ i3 + 1 ] = color.g;
                colors[ i3 + 2 ] = color.b;
            }
        }

        if ( !this.attractorAlive ) return;

        if ( this.attractorAge < this.particleDeathAge ) {

            // var startIndex = Math.round( this.particlesPerSecond * (this.attractorAge +  0) );
            // var   endIndex = Math.round( this.particlesPerSecond * (this.attractorAge + dt) );
            // if  ( endIndex > this.particleCount ) 
                  // endIndex = this.particleCount; 
            for (var i = 0; i < this.nodes.length; i++) {
                this.nodes[i].alive = 1.0;
            }
            // for (var i = startIndex; i < endIndex; i++) {
            //     this.nodes[i].alive = 1.0;  
            // }
        }

        for (var j = 0; j < recycleIndices.length; j++) {
            var i = recycleIndices[j];
            this.nodes[i] = this.createParticle();
            this.nodes[i].alive = 1.0;
        }

        this.attractorAge += dt;
        if ( this.attractorAge > this.attractorDeathAge ) this.attractorAlive = false;

        // Sort Depth Points for Z-Indexing 
        // https://github.com/mrdoob/three.js/issues/6461
        // removed in r70+ (three.js)
        this.sortPoints();

        this.particleGeom.attributes.position.needsUpdate = true;
        this.particleGeom.attributes.customSize.needsUpdate = true;
        this.particleGeom.attributes.customColor.needsUpdate = true;
        this.particleGeom.attributes.customAngle.needsUpdate = true;
        this.particleGeom.attributes.customVisibility.needsUpdate = true;
        this.particleGeom.attributes.customOpacity.needsUpdate = true;
    }

     // https://github.com/mrdoob/three.js/commit/8406cd7c6ecbdaca8e9d985158e5403492da48b5
    sortPoints() {

            var vector = new THREE.Vector3();
            // Model View Projection matrix
            var matrix = new THREE.Matrix4();
            matrix.multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
            matrix.multiply( this.particleMesh.matrixWorld );
            //
            var geometry = this.particleMesh.geometry;
            var index = geometry.getIndex();
            var positions = geometry.getAttribute( 'position' ).array;
            var length = positions.length / 3;
            if ( index === null ) {
                var array = new Uint16Array( length );
                for ( var i = 0; i < length; i ++ ) {
                    array[ i ] = i;
                }
                index = new THREE.BufferAttribute( array, 1 );
                geometry.setIndex( index );
            }
            var sortArray = [];
            for ( var i = 0; i < length; i ++ ) {
                vector.fromArray( positions, i * 3 );
                vector.applyMatrix4( matrix );
                sortArray.push( [ vector.z, i ] );
            }
            function numericalSort( a, b ) {
                return b[ 0 ] - a[ 0 ];
            }
            sortArray.sort( numericalSort );
            var indices = index.array;
            for ( var i = 0; i < length; i ++ ) {
                indices[ i ] = sortArray[ i ][ 1 ];
            }
            geometry.index.needsUpdate = true;
    }

    destroy() {
        
    }
}

// class Sphere extends Node {
//     constructor(r, nX, nY, nZ) {
//         super(nX, nY, nZ);
//         // console.log(this.prototype);
//         this.geometry = new THREE.SphereGeometry(r, 16, 16);
//         // console.log(this.geometry);
//         this.material = new THREE.MeshPhongMaterial({
//             color: 0xFF0066,
//         });


//         // this.material = new THREE.MeshStandardMaterial({
//         //     color: 0xFF0066,
//         //     roughness: 0
//         // });
//         // var envMap = new THREE.TextureLoader().load('texture2.png');
//         // envMap.mapping = THREE.SphericalReflectionMapping;
//         // this.material.envMap = envMap;
//         this.mesh = new THREE.Mesh(this.geometry, this.material);
//         // this.castShadow = true;
//         // this.receiveShadow = true;
//         this.mesh.position.set(this.x, this.y, this.z);
//         // this.constrain = {
//         //     x: [-10, 10],
//         //     y: [-Number.MAX_VALUE, Number.MAX_VALUE],
//         //     z: [-Number.MAX_VALUE, Number.MAX_VALUE]
//         // }
//         this.maxVelocity = 1.5;

//         this.wireframeGeometry = new THREE.EdgesGeometry(this.geometry); // or WireframeGeometry( geometry )

//         this.wireframeMaterial = new THREE.LineBasicMaterial({
//             color: 0x000000,
//             linewidth: 2
//         });

//         this.wireframeMesh = new THREE.LineSegments(this.wireframeGeometry, this.wireframeMaterial);

//         this.mass = Math.random(1, 10) * 10;
//     }

//     applyForce(f) {
//         f.divideScalar(this.mass);
//         this.acceleration.add(f);
//     }

//     update() {
//         super.update();
//         this.mesh.position.set(this.x, this.y, this.z);
//     }
// }


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
                radius: 0.02, // optional, default = 1, octree will grow and shrink as needed
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
        var leafTexture = textureLoader.load("../assets/textures/pink.png");
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

        var trunkTexture = textureLoader.load("../assets/textures/bark.jpg");
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
            var object = {x: vert.x, y: vert.y, z: vert.z, radius: 0.02, id: self.twigMesh}
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

        var visualGeometry = new THREE.CubeGeometry( 1, 1, 1 );
        // var visualGeometry =  new THREE.SphereGeometry( 2, 16, 16 );

        // var visualMaterial = new THREE.MeshBasicMaterial( { color: 0x333333, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending} );

        // visualMaterial.depthTest = true;
        var visualMaterial = new THREE.MeshBasicMaterial( { color: 0xFF0066, wireframe: true} );
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



//var scale = chroma.scale(['0x0000cc','0x0000ff','red']).domain([0,MAX_HEIGHT]);

//------------------------------------------------------
// Set up the main scene
//------------------------------------------------------

/**
 * Initializes the scene, camera and objects. Called when the window is
 * loaded by using window.onload (see below)
 */
function init() {

    // create a scene, that will hold all our elements such as objects, cameras and lights.
    scene = new THREE.Scene();

    // create a camera, which defines where we're looking at.
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.01, 10000);

    // create a render, sets the background color and the size
    renderer = new THREE.WebGLRenderer( {antialias: true, alpha: true} );
    renderer.setClearColor(0xffffff, 1.0);
        // renderer.setClearColor(0x222222, 1.0);// gray color scheme

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    clock = new THREE.Clock();

    // position and point the camera to the center of the scene
    camera.position.x = 40;
    camera.position.y = 2;
    camera.position.z = 10;
    // camera.lookAt(new THREE.Vector3(0,-100,0));
    // addLights();
      // var light = new THREE.DirectionalLight( 0xffffff );
      // light.position.set( 1, 1, 1 );
      // scene.add( light );

      // var light = new THREE.DirectionalLight( 0x002288 );
      // light.position.set( -1, -1, -1 );
      // scene.add( light );

      // var light = new THREE.AmbientLight( 0x222222 );
      // scene.add( light );

    control = new function() {
        this.seed = 4;
        this.segments = 6;
        this.levels = 7;
        this.vMultiplier = 2.36;
        this.twigScale = 0.12;
        this.initalBranchLength = 1.7;
        this.lengthFalloffFactor = 0.85;
        this.lengthFalloffPower = 0.99;
        this.clumpMax = 0.454;
        this.clumpMin = 0.404;
        this.branchFactor = 2.45;
        this.dropAmount = 0;
        this.growAmount = 0.235;
        this.sweepAmount = 0.01;
        this.maxRadius = 0.1;
        this.climbRate = 0.371;
        this.trunkKink = 0.093;
        this.treeSteps = 10;
        this.taperRate = 0.947;
        this.radiusFalloffRate = 0.73;
        this.twistRate = 3.02;
        this.trunkLength = 4;
        this.rotationSpeed = 0.005;
        this.generation = 0;

        this.update = function() {
            createTree(control);
        };
    };

    attractorControl = new function() {
        this.tree_mesh_attractor_strength = 0.3;
        this.tree_repeller_strength = -0.3;
    }

    // control = new function() {
    //     this.seed = 16;
    //     this.segments = 6;
    //     this.levels = 5;
    //     this.vMultiplier = 2.36;
    //     this.twigScale = 0.2;
    //     this.initalBranchLength = 1.5;
    //     this.lengthFalloffFactor = 0.85;
    //     this.lengthFalloffPower = 0.99;
    //     this.clumpMax = 0.7;
    //     this.clumpMin = 0.5;
    //     this.branchFactor = 8;
    //     this.dropAmount = -0.01;
    //     this.growAmount = 0.235;
    //     this.sweepAmount = 0.01;
    //     this.maxRadius = 0.15;
    //     this.climbRate = 0.2;
    //     this.trunkKink = 0.093;
    //     this.treeSteps = 10;
    //     this.taperRate = 0.947;
    //     this.radiusFalloffRate = 0.75;
    //     this.twistRate = 3.02;
    //     this.trunkLength = 4;
    //     this.rotationSpeed = 0.005;
    //     this.generation = 0;

    //     this.update = function() {
    //         createTree(control);
    //     };
    // };

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // remove when using animation loop
    // enable animation loop when using damping or autorotation
    //controls.enableDamping = true;
    //controls.dampingFactor = 0.25;
    controls.enableZoom = false;

    // add the control gui and the stats UI
    addControlGui(control);
    addAttractorControlGui(attractorControl);
    addStatsObject();

    // add the output of the renderer to the html element
    document.body.appendChild(renderer.domElement);

    // set up the example specific stuff
    // createTree(control);
    createPlane(control);
    initParticles();



        // var newTree = new TreeAttractor(0, 7, 0, camera, options);
        // // var resolution = 8;
        // newTree.setParticleCount(p_tree.lastNodes.length);
        // newTree.initialize();
        // newTree.strength = 0.0;
        // newTree.maxVelocity = 1.0;
        // for (var i = 0; i < (newTree.nodes.length); i++) {
        //     var x = p_tree.lastNodes[i].position.x;
        //     var y = p_tree.lastNodes[i].position.y;
        //     var z = p_tree.lastNodes[i].position.z;
        //     var node = newTree.nodes[i];
        //     node.x = x;
        //     node.y = y;
        //     node.z = z;
        //     // for (var j = 0; j < resolution; j++) {
        //     //     var node = newTree.nodes[i * j];
        //     //     var vec = UtilsMath.randomVector3(new THREE.Vector3(x, y, z), new THREE.Vector3(2, 2, 2));
        //     //     node.x = vec.x;
        //     //     node.y = vec.y;
        //     //     node.z = vec.z;
        //     // }
        // }

        // genericAttractor = new Attractor(0, 7, 0);
        // genericAttractor.strength = 0;
        // genericAttractor.damping = 0.0;
        // genericAttractor.radius = 2.5;
        // genericAttractor.ramp = 0.75;
        // genericAttractor.maxVelocity = 1.0;
        // genericAttractor;

        // newTree.setParticleCount(3000);

        // treeAttractors.push( newTree );

        // for (var i = 0; i < p_tree.lastNodes.length; i++) {
        //     var pos = p_tree.lastNodes[i].position;
        //     // console.log(pos);
        //     options.position = {
        //         base: new THREE.Vector3(pos.x, pos.y, pos.z),
        //         spread: new THREE.Vector3(0.2, 0.2, 0.2),   
        //     }
            


        //     newTree.setStrength(0.0);

        //     // console.log(newTree);
        //     treeAttractors.push( newTree )
        // }

        // treeA = new TreeAttractor(0, 0, 0, camera, options);
        // treeA.initialize();
        // console.log(treeA);
    // call the render function, after the first render, interval is determined
    // by requestAnimationFrame
    animate();
}


    function addLights() {


    // add spotlight for the shadows
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(10, 750, 10);
    spotLight.shadowCameraNear = 20;
    spotLight.shadowCameraFar = 50;
    spotLight.castShadow = true;
    spotLight.shadowCameraVisible = true;
    scene.add(spotLight);

    scene.add(new THREE.AmbientLight(0x252525));
    scene.add(new THREE.AmbientLight(0x666666));

    var light;

    // light = new THREE.DirectionalLight(0xdfebff, 1.75);
    light = new THREE.DirectionalLight(0xffffff, 1.75);
    light.position.set(100, 200, 400);
    light.position.multiplyScalar(1.2);

    light.castShadow = true;
    light.shadowCameraVisible = true;

    light.shadowMapWidth = 712;
    light.shadowMapHeight = 712;

    var d = 12;

    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d
    light.shadowCameraVisible = true;
;

    light.shadowCameraFar = 1000;
    light.shadowDarkness = 0.1;

    scene.add(light);

    // other lights

        // var light = new THREE.AmbientLight(0xffffff); // soft white light
        // scene.add(light);

        var pointLight = new THREE.PointLight(0xffffff, 1.0, 1);
        pointLight.position.set(0, 15, 0);
        scene.add(pointLight);

        // var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        // // directionalLight.position.set(0, -1, 0);
        // scene.add(directionalLight);

        var point_light = new THREE.PointLight(0xffffff);
        point_light.position.x = 10;
        point_light.position.y = 0;
        point_light.position.z = 10;
        scene.add(point_light);
        scene.add(new THREE.PointLightHelper(pointLight, 3));

        scene.add(new THREE.PointLightHelper(point_light, 3));

        var light = new THREE.SpotLight("#fff", 0.8);
        light.position.y = 100;

        light.angle = 1.05;

        light.decay = 2;
        light.penumbra = 1;

        light.shadow.camera.near = 10;
        light.shadow.camera.far = 1000;
        light.shadow.camera.fov = 30;

        scene.add(light);

    }
        
        function getRandomNumber( base ) {
            return Math.random() * base - (base/2);
        }

        function getRandomColor() {
            var c = new THREE.Color();
            c.setRGB( Math.random(), Math.random(), Math.random() );
            return c;
        }


        // Create particle group and emitter
        function initParticles() {
            particleGroup = new SPE.Group({
                texture: {
                    value: THREE.ImageUtils.loadTexture('assets/textures/particles/smokeparticle.png')
                }
            });

            emitter = new SPE.Emitter({
                maxAge: {
                    value: 2
                },
                position: {
                    value: new THREE.Vector3(0, 0, -50),
                    spread: new THREE.Vector3( 0, 0, 0 )
                },

                acceleration: {
                    value: new THREE.Vector3(0, -10, 0),
                    spread: new THREE.Vector3( 10, 0, 10 )
                },

                velocity: {
                    value: new THREE.Vector3(0, 25, 0),
                    spread: new THREE.Vector3(10, 7.5, 10)
                },

                color: {
                    value: [ new THREE.Color('white'), new THREE.Color('red') ]
                },

                size: {
                    value: 1
                },

                particleCount: 2000
            });

            particleGroup.addEmitter( emitter );
            scene.add( particleGroup.mesh );

            // document.querySelector('.numParticles').textContent =
            //     'Total particles: ' + emitter.particleCount;
        }
        // // Create particle group and emitter
        // function initParticles() {
        //     particleGroup = new SPE.Group({
        //         texture: {
        //             value: options.particle.texture
        //         }
        //     });

            
        //     for( var i = 0; i < numEmitters; ++i ) {
        //         emitter = new SPE.Emitter({
        //             maxAge: 5,
        //             type: Math.random() * 4 | 0,
        //             position: {
        //                 value: new THREE.Vector3(
        //                     0, 0, 0
        //                 )
        //             },

        //             acceleration:{
        //                 value: new THREE.Vector3(
        //                     1, 1, 1
        //                 )
        //             },

        //             velocity: {
        //                 value: new THREE.Vector3(
        //                     1, 1, 1
        //                 )
        //             },

        //             rotation: {
        //                 axis: new THREE.Vector3(
        //                     getRandomNumber(1),
        //                     getRandomNumber(1),
        //                     getRandomNumber(1)
        //                 ),
        //                 angle: Math.random() * Math.PI,
        //                 center: new THREE.Vector3(
        //                     0, 0, 0
        //                 )
        //             },

        //             wiggle: {
        //                 value: Math.random() * 20
        //             },

        //             drag: {
        //                 value: Math.random()
        //             },

        //             color: {
        //                 value: [ getRandomColor(), getRandomColor() ]
        //             },
        //             size: {
        //                 value: [10, 10, 10]
        //             },

        //             particleCount: 100,

        //             opacity: [0, 1, 0]
        //         });
        //         console.log(emitter);
        //         particleGroup.addEmitter( emitter );
        //     }

        //     scene.add( particleGroup.mesh );

        //     // document.querySelector('.numParticles').textContent =
        //         // 'Total particles: ' + emitter.particleCount;
        // }

//------------------------------------------------------
// Functions specific to this example
//------------------------------------------------------

function createPlane(config) {
    var groundMaterial = new THREE.MeshPhongMaterial({
        // color: 0x6C6C6C,
        color: 0x111111 // gray color scheme
    });
    plane = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), groundMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;

    scene.add(plane);
}

var generation = 0;

function createTree(config) {

    //console.log(p_tree);
    // console.log(p_tree.twigMesh.geometry.vertices);
    // console.log(p_tree.trunkMesh.geometry.vertices.length);

        // setTimeout(function() {
            var twig = scene.getObjectByName('twig');
            var trunk = scene.getObjectByName('trunk');
            if (twig) scene.remove(twig);
            if (trunk) scene.remove(trunk);
        // }, 35)
        p_tree = new ProceduralTree(config);
        scene.add(p_tree.trunkMesh);
        // scene.add(p_tree.twigMesh);
        // p_tree.trunkMesh.material.opacity = 0;
        // p_tree.twigMesh.material.opacity = 0;

        // if (twig) twig.material.opacity = 0;
        // if (trunk) trunk.material.opacity = 0;

}


//------------------------------------------------------
// Main render loop
//------------------------------------------------------


/**
 * Called when the scene needs to be rendered. Delegates to requestAnimationFrame
 * for future renders
 */

 var lastTime = 0;
 var lastTime2 = 0;

function animate(currentTime) {

    requestAnimationFrame(animate);
    var delta = clock.getDelta();

    render( delta );

    wind += delta + Math.random();
    // for (var i = 0; i < p_tree.twigMesh )

    // rotating whole mesh
    // var r = Math.random();
    // p_tree.twigMesh.rotation.z += Math.cos(wind * r) * 0.015;
    // p_tree.trunkMesh.rotation.z += Math.cos(wind * r) * 0.015;
    // p_tree.octree.remove();
    // p_tree.octree.remove(p_tree.twigMesh)
    // p_tree.octree.update();    

    // removeNode( p_tree.octree.root );
    // function removeNode ( node ) {
    //         for ( var i = 0, l = node.nodesIndices.length; i < l; i++ ) {
    //             var next = node.nodesByIndex[ node.nodesIndices[ i ] ];
    //             removeNode ( next );
    //         }

    //         p_tree.octree.remove ( node );
    //     }
    // console.log('removed all nodes');

    // p_tree.trunkMesh.geometry.vertices.forEach(function (vert) {
    //     var object = {x: vert.x, y: vert.y, z: vert.z, radius: 0.0025, id: self.trunkMesh}
    //     // console.log(object);
    //     p_tree.octree.add( object )
    // })

    // console.log('added all nodes');

    // if (currentTime >= lastTime + 30 && currentTime < 30000) {
    //     if (control.trunkLength < 4) {
    //         control.trunkLength += 0.01333; // 24 seconds
    //     } else {
    //         control.trunkLength = 4;
    //     }

    //     if (control.initalBranchLength < 1.7) {
    //         control.initalBranchLength += 0.005666;
    //     } else {
    //         control.initalBranchLength = 1.7;
    //     }

    //     if (control.maxRadius < 0.1) {
    //         control.maxRadius += 0.000333;
    //     } else {
    //         control.maxRadius = 0.1;
    //     }

    //     if (control.branchFactor < 2.45) {
    //         control.branchFactor += 0.008166;
    //     } else {
    //         control.branchFactor = 2.45;
    //     }

    //     if (control.twigScale < 0.13) {
    //         control.twigScale += 0.0004333;
    //     } else {
    //         control.twigScale = 0.13;
    //     }

    //     if (control.climbRate < 0.371) {
    //         control.climbRate += 0.0012366;
    //     } else {
    //         control.climbRate = 0.371;
    //     }

    //     if (control.growAmount < 0.235) {
    //         control.growAmount += 0.00078333;
    //     } else {
    //         control.growAmount = 0.235;
    //     }

    //     if (control.twistRate < 3) {
    //         control.twistRate += 0.0020666;
    //     } else {
    //         control.twistRate = 3;
    //     }

    //     createTree(control);
    //     lastTime = currentTime;
    // }

    // treeA.attractAll();

    // treeA.step(delta);

    // console.log(treeA.nodes[0]);
    // update the camera

       var rotSpeed = control.rotationSpeed;
       camera.position.x = camera.position.x * Math.cos(rotSpeed) + camera.position.z * Math.sin(rotSpeed);
       camera.position.z = camera.position.z * Math.cos(rotSpeed) - camera.position.x * Math.sin(rotSpeed);
       camera.lookAt(scene.position);
        controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true
    
    for (var i = 0; i < treeAttractors.length; i++) {
        // treeAttractors[i].rotateX(0.5);
        // treeAttractors[i].rotateY(0.5);
        // treeAttractors[i].rotateZ(0.5);
        // console.log(Math.sin(clock.getElapsedTime()))
        // console.log(Math.sin(clock.getElapsedTime() * 0.0005))
        treeAttractors[i].x = Math.cos(clock.getElapsedTime());
        treeAttractors[i].z = Math.cos(clock.getElapsedTime());
        treeAttractors[i].y = Math.cos(clock.getElapsedTime()) + 4;

        for (var j = 0; j < treeAttractors[i].nodes.length; j++) {
            genericAttractor.attract(treeAttractors[i].nodes[j])
        }
                // treeAttractors[i].z += Math.sin(clock.getElapsedTime() * 0.00005);

        // treeAttractors[i].x =  treeAttractors[i].x * Math.cos(rotSpeed) + treeAttractors[i].z * Math.sin(rotSpeed);
        // treeAttractors[i].z =  treeAttractors[i].z * Math.cos(rotSpeed) + treeAttractors[i].x * Math.sin(rotSpeed);
        // console.log( treeAttractors[i].x );
        treeAttractors[i].attractAll();
        treeAttractors[i].step(delta);
    }

    // update stats
    stats.update();

    // control.levels += 0.001;
    // createTree(control);
    // console.log(control.levels);
    // render using requestAnimationFrame
}


    function render( dt ) {
        particleGroup.tick( dt );
        renderer.render( scene, camera );
        TWEEN.update();
    }


//------------------------------------------------------
// Some generic helper functions
//------------------------------------------------------

/**
 * Create the control object, based on the supplied configuration
 *
 * @param controlObject the configuration for this control
 */
function addControlGui(controlObject) {
    var gui = new dat.GUI();
    gui.add(controlObject,"seed");
    gui.add(controlObject,"segments");
    gui.add(controlObject,"levels");
    gui.add(controlObject,"vMultiplier");
    gui.add(controlObject,"twigScale");
    gui.add(controlObject,"initalBranchLength");
    gui.add(controlObject,"lengthFalloffFactor");
    gui.add(controlObject,"lengthFalloffPower");
    gui.add(controlObject,"clumpMax");
    gui.add(controlObject,"clumpMin");
    gui.add(controlObject,"branchFactor");
    gui.add(controlObject,"dropAmount");
    gui.add(controlObject,"growAmount");
    gui.add(controlObject,"sweepAmount");
    gui.add(controlObject,"maxRadius");
    gui.add(controlObject,"climbRate");
    gui.add(controlObject,"trunkKink");
    gui.add(controlObject,"treeSteps");
    gui.add(controlObject,"taperRate");
    gui.add(controlObject,"radiusFalloffRate");
    gui.add(controlObject,"twistRate");
    gui.add(controlObject,"radiusFalloffRate");
    gui.add(controlObject,"trunkLength");
    gui.add(controlObject,"rotationSpeed");

    gui.add(controlObject,"update");
}

function addAttractorControlGui(controlObject) {
    var gui = new dat.GUI();
    gui.add(controlObject,"tree_mesh_attractor_strength");
    gui.add(controlObject,"tree_repeller_strength");
}

/**
 * Add the stats object to the top left border
 */
function addStatsObject() {
    stats = new Stats();
    stats.setMode(0);

    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild( stats.domElement );
}


/**
 * Function handles the resize event. This make sure the camera and the renderer
 * are updated at the correct moment.
 */
function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//------------------------------------------------------
// Init the scene and register the resize handler
//------------------------------------------------------

// calls the init function when the window is done loading.
window.onload = init;
// calls the handleResize function when the window is resized
window.addEventListener('resize', handleResize, false);

</script>
