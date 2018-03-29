var App = function() {
    var _gui, _guiFields;
    var _engine;
    var _currPreset = Utils.getParameterByName("shape") || "disc"; // initial preset
    var _currSimMode;
    var _uvAnim;
    var _tourMode = false;
    var _musicElem = document.getElementById("music");

    // DEFINES

    var _params = {
        size: 512,
        simMat: createShaderMaterial(SimShader),
        drawMat: createShaderMaterial(ParticleShader),
        update: undefined,  // defined later in the file
    };

    var _simModes = [
        "SIM_PLANE",
        "SIM_CUBE",
        "SIM_DISC",
        "SIM_SPHERE",
        "SIM_BALL",
        "SIM_ROSE_GALAXY",
        "SIM_GALAXY",
        "SIM_NOISE",
        "SIM_TEXTURE"
    ];

    // must have same name as preset, for async loading to work properly
    var _meshes = {
        // bear:      { scale:0.023, yOffset:-2.30, speed:0.05, url:"models/bear.json" },
        // bison:     { scale:0.020, yOffset:-2.00, speed:0.10, url:"models/bison.json" },
        // deer:      { scale:0.040, yOffset:-2.00, speed:0.10, url:"models/deer.json" },
        // parrot:      { scale:0.080, yOffset:0.00, speed:0.10, url:"models/parrot.json" },

        eagle:       { scale:0.025, yOffset: 0.00, speed:0.10, url:"models/eagle.json" },
        // flamingo:       { scale:0.070, yOffset:0.00, speed:0.10, url:"models/flamingo.json" },
        // raven:     { scale:0.070, yOffset:0.00, speed:0.10, url:"models/raven.json" },
        horse:     { scale:0.01, yOffset:0.0, speed:0.1, url:"models/horse.json" },
        // panther:   { scale:0.030, yOffset:-1.70, speed:0.10, url:"models/panther.json" },
        // rabbit:    { scale:0.040, yOffset:-1.00, speed:0.05, url:"models/rabbit.json" },
        human:    { scale:0.035, yOffset:0, speed:0.00, url:"models/human.js" },
        // wolf:      { scale:0.040, yOffset:-1.70, speed:0.10, url:"models/wolf.json" },
    };

    var _presets = {
        "none":    { "user gravity":3, "shape gravity":1, _shape:"" },
        // "noise":   { "user gravity":3, "shape gravity":1, _shape:"SIM_NOISE" },
        "plane":   { "user gravity":4, "shape gravity":3, _shape:"SIM_PLANE" },
                "disc":   { "user gravity":4, "shape gravity":0.50, _shape:"SIM_DISC" },

        "sphere":  { "user gravity":4, "shape gravity":0.3, _shape:"SIM_SPHERE" },
        "galaxy":  { "user gravity":3, "shape gravity":0.5, _shape:"SIM_GALAXY" },
        "petals":  { "user gravity":3, "shape gravity":10, _shape:"SIM_ROSE_GALAXY" },
        // "bear":    { "user gravity":3, "shape gravity":5, _shape:_meshes.bear },
        // "bison":   { "user gravity":3, "shape gravity":5, _shape:_meshes.bison },
        // "parrot":   { "user gravity":3, "shape gravity":5, _shape:_meshes.parrot },

        "eagle":    { "user gravity":3, "shape gravity":5, _shape:_meshes.eagle },
        // "flamingo":     { "user gravity":3, "shape gravity":5, _shape:_meshes.flamingo },
        // "raven":     { "user gravity":3, "shape gravity":5, _shape:_meshes.raven },
        "horse":   { "user gravity":3, "shape gravity":5, _shape:_meshes.horse },
        // "panther": { "user gravity":3, "shape gravity":5, _shape:_meshes.panther },
        // "rabbit":  { "user gravity":3, "shape gravity":5, _shape:_meshes.rabbit },
        // "wolf":    { "user gravity":3, "shape gravity":5, _shape:_meshes.wolf },
        "human":  { "user gravity":3, "shape gravity":0.20, _shape:_meshes.human },

    };



    // FUNCTIONS

    var _setSimMode = function(name) {
        if (name === _currSimMode)
            return;
        _currSimMode = name;  // cache mode, prevent shader recompile

        _simModes.forEach(function(s) {
            delete _params.simMat.defines[s];
        });
        if (name)
            _params.simMat.defines[name] = "";
        _params.simMat.needsUpdate = true;
    };

    var _setPreset = function(name) {
        var preset = _presets[name] || _presets.none;
        _currPreset = name;

        // set shape
        if (preset._shape.length >= 0) {
            _setSimMode(preset._shape);
            _uvAnim.setMesh();  // set no mesh
        }
        else {
            _setSimMode("SIM_TEXTURE");
            _uvAnim.setMesh(preset._shape.mesh);
        }

        _guiFields["user gravity"]  = _params.simMat.uniforms.uInputAccel.value = preset["user gravity"];
        _guiFields["shape gravity"] = _params.simMat.uniforms.uShapeAccel.value = preset["shape gravity"];
    };

    var _takeScreenshot = function() {
        _engine.renderer.getImageData(function(dataUrl) {
            var url = Utils.dataUrlToBlobUrl(dataUrl);
            Utils.openUrlInNewWindow(url, window.innerWidth, window.innerHeight);
        });
    };

    var _toggleMusic = function() {
        if (_musicElem.paused)
            _musicElem.play();
        else
            _musicElem.pause();
    };



    // UPDATE

    var _update = _params.update = function(dt,t) {
        _params.drawMat.uniforms.uTime.value = t;  // for ParticleShader.vs
        _uvAnim.update(dt,t);
        // if(_tourMode) _tourUpdate(dt,t);
        _tourUpdate(dt, t);
    };


    var _tourUpdate = (function() {


    var angle = 0;
    var radius = 1;
    var morphHuman = false;
    var morphPetals = false;
    var morphEagle = false;

    var prevX = undefined;
    var prevZ = undefined;
    var currX = undefined;
    var currZ = undefined;
    var matchSound = 0;
        // var SHAPE_DURATION = 25.0;
        // var BETWEEN_DURATION = 15.0;
        // var BETWEEN_PRESET = "galaxy";
        // var sequence = ["wolf", "petals", "bear", "sphere", "horse", "panther", "plane", "bison"];
        // var timer = 0.0;
        // var seqIdx = 0;
        // var seqName;

        return function(dt,t) {

        if (matchSound < 120) {
            sound.seek(t);
            matchSound += 1;
        }
        console.log('ANIMATION TIME:', t);
        console.log('SOUND TIME:', sound.seek())

        if (t < 3) {
            _engine.camera.position.x = 0;
            _engine.camera.position.z = 0;
            _engine.camera.position.y = -25;
        }
        if (t < 150) {
            if (_params.drawMat.uniforms.uAlpha.value < 0.5) {
                _params.drawMat.uniforms.uAlpha.value += 0.000125;
                console.log( _params.drawMat.uniforms.uAlpha.value);
            }
                if (!currX && !currZ) {
                    currX = _engine.camera.position.x;
                    currZ = _engine.camera.position.z;
                } else {
                    prevX = currX;
                    prevZ = currZ;
                    _engine.camera.position.x = radius * Math.sin( angle );
                    _engine.camera.position.z = radius * Math.cos( angle );
                    currX = _engine.camera.position.x;
                    currZ  = _engine.camera.position.z;
                }
                console.log(prevX, currX);
            angle += 0.005;

        }
        if (t < 60) {
            

            if (_engine.camera.position.y < -2 && !morphHuman) {

                _setPreset("human");
                _guiFields.shape = "human" ;
                _gui.__controllers[0].updateDisplay();  // HARDCODE: controller idx

                morphHuman = true;
            }
            if (_engine.camera.position.y <= 15) {
                var pretest = _engine.camera.position.y += 0.0025;
                if (pretest > 10.0) {
                    _engine.camera.position.y = 10.0
                } else {
                    _engine.camera.position.y += 0.01;
                }
            }
            // _engine.camera.position.z = radius * Math.sin( angle );
            // console.log('Camera position X:', _engine.camera.position.x)
            // console.log('Camera position Y:', _engine.camera.position.y)
            // console.log('Camera position Z:', _engine.camera.position.z)
        } else if (t < 250) {
            if (t >= 60 && !morphPetals) {
                // _engine.camera.position.y = 10;
                _setPreset("petals");
                _guiFields.shape = "petals" ;
                _gui.__controllers[0].updateDisplay();  // HARDCODE: controller idx
                morphPetals = true;

            }
            if (_engine.camera.position.y > 0.25 && t <= 90) {
                // var pretest = _engine.camera.position.y -= 0.025;
                // if (pretest < 0) {
                //     _engine.camera.position.y = 0.0
                // } else {
                _engine.camera.position.y -= 0.0065;
                // }
            }

            if (t >= 90 && t <= 150 &&  _engine.camera.position.y < 10.0) {
                _engine.camera.position.y += 0.01;
            }

            if (t >= 82.5 && t < 84.5) {
                _params.simMat.uniforms.uShapeAccel.value = 0.0;
                _guiFields['shape gravity'] = 0.0;
            }
            if (t >= 84.5 && t < 88.5) {
                _params.simMat.uniforms.uShapeAccel.value = 8.0;
                _guiFields['shape gravity'] = 8.0;
            }
            if (t >= 88.5 && t <= 91.5) {
                _params.simMat.uniforms.uShapeAccel.value = 0.0;
                _guiFields['shape gravity'] = 0.0;
                // _gui.__controllers[0].updateDisplay();  // HARDCODE: controller idx
            } 
            if (t >= 91.5 && t < 95.5) {
                _params.simMat.uniforms.uShapeAccel.value = 4.0;
                _guiFields['shape gravity'] = 4.0;
            }
            if (t >= 95.5 && t < 102.5) {
                _params.simMat.uniforms.uShapeAccel.value = 0.0;
                _guiFields['shape gravity'] = 0.0;
            }
            // 1:43
            if (t >= 102.5 && t < 104.5) {
                 _params.simMat.uniforms.uShapeAccel.value = 2.0;
                _guiFields['shape gravity'] = 2.0;
            }
            // 1:45 - 1:55
            if (t >= 104.5 && t < 114.5) {
                _params.simMat.uniforms.uShapeAccel.value = 2.0;
                _guiFields['shape gravity'] = 2.0;
            }
            // change here?
            // 1:55 - 2:00 Small Click {
            if (t >= 114.0 && t < 119.0) {
                _params.simMat.uniforms.uInputAccel.value = 10.0;
                _guiFields['user gravity'] = 10.0;
            }
            // 2:00 - 2:07 Rebuild
            if (t >= 119.0 && t < 126.0) {
                var dt = t - 120;
                console.log('rebuild', dt);
                _params.simMat.uniforms.uShapeAccel.value = 14.0 - dt * 2; // ending accel is 0.0
                _guiFields['shape gravity'] = 14.0 - dt * 2;
            }
            // 2:07 - 2:13 Medium Shape Accel
            if (t >= 126.0 && t < 132.0) {
                _params.simMat.uniforms.uShapeAccel.value = 15.0; // ending accel is 0.0
                _guiFields['shape gravity'] = 15.0;

                // _params.simMat.uniforms.uInputAccel.value = 20.0;
                // _guiFields['user gravity'] = 15.0;
            }
            // 2:13 - 2:16 Double Medium Click
            if (t >= 132.0 && t < 135.0) {
               _params.simMat.uniforms.uShapeAccel.value = 0.0; // ending accel is 0.0
                _guiFields['shape gravity'] = 0.0;
            }
            // 2:16 - 2:27 Rebuild
            if (t >= 135.0 && t < 140.0) {
                var dt = t - 136;
                _params.simMat.uniforms.uShapeAccel.value = dt;
                _guiFields['shape gravity'] = dt;
            }
            if (t >= 140.0 && t < 146.0) {
                var dt = t - 141;
                _params.simMat.uniforms.uShapeAccel.value = 3 - dt;
                _guiFields['shape gravity'] = dt;
            }
            if (t >= 146.0 && t < 149.0) {
                _params.simMat.uniforms.uInputAccel.value = 150.0;
                _guiFields['user gravity'] = 150.0;
            }
             if (t >= 149.0 && _engine.camera.position.y > 0.2 && t <= 203.0) {
                _engine.camera.position.y -= 0.003;
            }
            if (t >= 154.0 && t <= 179.5) {
                // go back to starting
                // rotating POS, so go to 0
                console.log("POSITION X:", _engine.camera.position.x)
                console.log("POSITION Z:", _engine.camera.position.z)

                // var distFromZeroX = 0 - _engine.camera.position.x; // if position is negative
                // var distFromZeroZ = 0 - _engine.camera.position.z; // if position is negative

                // if (currX - prevX > 0) {
                //     if (_engine.camera.position.x > 0.01) {
                //         _engine.camera.position.x -= 0.01;
                //     }
                //     else _engine.camera.position.x = 0;
                // }
                // else if (currX - prevX < 0) {
                //     if (_engine.camera.position.x < -0.01) {
                //         _engine.camera.position.x += 0.01;
                //     }
                //     else _engine.camera.position.x = 0;
                // }

                // if (currZ - prevZ > 0) {
                //     if (_engine.camera.position.z > 0.01) {
                //         _engine.camera.position.z -= 0.01;
                //     }
                //     else _engine.camera.position.z = 0;
                // }
                // else if (currZ - prevZ < 0) {
                //     if (_engine.camera.position.z <= 0) {
                //         _engine.camera.position.z += 0.01;
                //     }
                //     // else _engine.camera.position.z = 0;
                // }

                var distFromZeroX = 0 - _engine.camera.position.x; // if position is negative
                if (distFromZeroX < 0.01 || distFromZeroX > -0.01) _engine.camera.position.x = 0;
                if (distFromZeroX > 0.01 || distFromZeroX < -0.01) {
                    if (distFromZeroX < 0) _engine.camera.position.x -= 0.01;
                    if (distFromZeroX > 0) _engine.camera.position.x += 0.01;
                }
                var distFromZeroZ = 0 - _engine.camera.position.z; // if position is negative
                if (distFromZeroZ < 0.01 || distFromZeroZ > -0.01) _engine.camera.position.z = 0;
                else if (distFromZeroZ > 0.01 || distFromZeroX < -0.01) {
                    if (distFromZeroZ < 0) _engine.camera.position.z -= 0.01;
                    if (distFromZeroZ > 0) _engine.camera.position.z += 0.01;
                }
                // console.log('POSITION', _engine.camera.position.x);
            }
            if (t >= 149.0 && t < 179.0) {
                var dt = t - 150;
                if (dt > 3) dt = 3;
                _params.simMat.uniforms.uShapeAccel.value = dt;
                _guiFields['shape gravity'] = dt;
            }
            // if (t >= 206 && t < 210.5) {
            if (t >= 204.5 && t < 210.5) { // for real-time demo
                _setPreset("eagle");
                _guiFields.shape = "eagle" ;
                _gui.__controllers[0].updateDisplay();  // HARDCODE: controller idx
                morphEagle = true;
                // if (_engine.camera.position.y > 0) {
                // _engine.camera.position.y = 1.0;
                // }
                if (_engine.camera.position.y < 5) {
                    _engine.camera.position.y += 0.015;
                }
                console.log('X:', _engine.camera.position.x);
                console.log('Y:', _engine.camera.position.y);
                console.log('Z:', _engine.camera.position.z);
                // if (_engine.camera.position.z < 5) {
                //     _engine.camera.position.z += 0.003;
                // }

            }
            if (t >= 210.5 && t < 239.5) {
                if (_engine.camera.position.y > 0) {
                    _engine.camera.position.y -= 0.005;
                }
                _engine.camera.position.z += 0.0125;
            }
            // 239.5 ending
            // if (t >= 203.5 && t < 239.5) {
            //     if (_engine.camera.position.y > 0) {
            //         _engine.camera.position.y -= 0.004;
            //     }
            //     _engine.camera.position.z += 0.003;

            // }

        }




            // if (timer <= 0.0) {
            //     // check against sequence
            //     // if user navigate to different preset
            //     // next tour trigger will go into shape instead of the between
            //     if (_currPreset === seqName) {
            //         _setPreset(BETWEEN_PRESET);
            //         _guiFields.shape = BETWEEN_PRESET;
            //         _gui.__controllers[0].updateDisplay();  // HARDCODE: controller idx
            //         timer = BETWEEN_DURATION;
            //     }
            //     else {
            //         // sequence finished
            //         if (seqIdx >= sequence.length) {
            //             seqIdx = 0;
            //             Utils.shuffle(sequence);
            //             console.log("tour shuffled: " + sequence);
            //         }
            //         seqName = sequence[seqIdx++];
            //         _setPreset(seqName);
            //         _guiFields.shape = seqName;
            //         _gui.__controllers[0].updateDisplay();
            //         console.log("tour: "+seqName);
            //         timer = SHAPE_DURATION;
            //     }
            // }

            // timer -= dt;
        };
    })();



    // INIT

    var _init = function() {
        _engine = new ParticleEngine(_params);

        _uvAnim = new UVMapAnimator(_engine.renderer.getRenderer(), _params.size);
        _params.simMat.uniforms.tTarget = { type: "t", value: _uvAnim.target };
    };

    var _initSound = function() {
          sound = new Howl({
            src: ['bg.mp3']
          })
          sound.once('load', function() {
            sound.play();
          })
    }

    var _initUI = function() {
        _gui = new dat.GUI();
        _guiFields = {
            "color1": [_params.drawMat.uniforms.uColor1.value.x*255, _params.drawMat.uniforms.uColor1.value.y*255, _params.drawMat.uniforms.uColor1.value.z*255],
            "color2": [_params.drawMat.uniforms.uColor2.value.x*255, _params.drawMat.uniforms.uColor2.value.y*255, _params.drawMat.uniforms.uColor2.value.z*255],
            "alpha": _params.drawMat.uniforms.uAlpha.value,
            "color speed": _params.drawMat.uniforms.uColorSpeed.value,
            "color freq": _params.drawMat.uniforms.uColorFreq.value,
            "point size": _params.drawMat.uniforms.uPointSize.value,
            "user gravity": _params.simMat.uniforms.uInputAccel.value,
            "shape gravity": _params.simMat.uniforms.uShapeAccel.value,
            "shape": _currPreset,
            "paused": false,
            "camera rotate": false,
            "camera control": true,
            "screenshot": _takeScreenshot,
            "fullscreen": Utils.toggleFullscreen,
            "take tour!": _tourMode,
            "music": true,
        };

        _gui.add(_guiFields, "shape", Object.keys(_presets))
            .onFinishChange(_setPreset);
        // _gui.add(_guiFields, "take tour!").onChange(function(value) {
        //     _tourMode = value;
        // });
        // _gui.add(_guiFields, "music").onChange(function(value) {
        //     _toggleMusic();
        // });

        var fAppearance = _gui.addFolder("Appearance");
        fAppearance.addColor(_guiFields, "color1").onChange(function(value) {
            if (value[0] === "#") value = Utils.hexToRgb(value);
            _params.drawMat.uniforms.uColor1.value.x = value[0] / 255.0;
            _params.drawMat.uniforms.uColor1.value.y = value[1] / 255.0;
            _params.drawMat.uniforms.uColor1.value.z = value[2] / 255.0;
        });
        fAppearance.addColor(_guiFields, "color2").onChange(function(value) {
            if (value[0] === "#") value = Utils.hexToRgb(value);
            _params.drawMat.uniforms.uColor2.value.x = value[0] / 255.0;
            _params.drawMat.uniforms.uColor2.value.y = value[1] / 255.0;
            _params.drawMat.uniforms.uColor2.value.z = value[2] / 255.0;
        });
        fAppearance.add(_guiFields, "alpha", 0, 1).onChange(function(value) {
            _params.drawMat.uniforms.uAlpha.value = value;
        });
        fAppearance.add(_guiFields, "color speed", -10, 10).onChange(function(value) {
            _params.drawMat.uniforms.uColorSpeed.value = value;
        });
        fAppearance.add(_guiFields, "color freq", 0, 5).onChange(function(value) {
            _params.drawMat.uniforms.uColorFreq.value = value;
        });
        fAppearance.add(_guiFields, "point size", 1, 10).onChange(function(value) {
            _params.drawMat.uniforms.uPointSize.value = value;
        });

        var fPhysics = _gui.addFolder("Gravity");
        fPhysics.add(_guiFields, "user gravity", 0, 100)
        .listen()
        .onChange(function(value) {
            _params.simMat.uniforms.uInputAccel.value = value;
        });
        fPhysics.add(_guiFields, "shape gravity", 0, 10)
        .listen()
        .onChange(function(value) {
            _params.simMat.uniforms.uShapeAccel.value = value;
        });

        var fControls = _gui.addFolder("Camera Controls");
        fControls.add(_guiFields, "paused").onChange(function(value) {
            _engine.pauseSimulation(value);
        }).listen();
        fControls.add(_guiFields, "camera rotate").onChange(function(value) {
            _engine.enableCameraAutoRotate(value);
        }).listen();
        fControls.add(_guiFields, "camera control").onChange(function(value) {
            _engine.enableCameraControl(value);
        }).listen();

        _gui.add(_guiFields, "screenshot");
        _gui.add(_guiFields, "fullscreen");
        _gui.close();
    };

    var _initKeyboard = function() {

        // pause simulation
        Mousetrap.bind("space", function() {
            _guiFields.paused = !_guiFields.paused;
            _engine.pauseSimulation(_guiFields.paused);
            return false;
        });

        // mouse camera control
        Mousetrap.bind(["alt", "option"], function() {
            _guiFields["camera control"] = true;
            _engine.enableCameraControl(true);
            return false;
        }, "keydown");
        Mousetrap.bind(["alt", "option"], function() {
            _guiFields["camera control"] = false;
            _engine.enableCameraControl(false);
            return false;
        }, "keyup");

    };

    var _loadMeshes = function() {
        var loader = new THREE.JSONLoader(true);
        Object.keys(_meshes).forEach(function(k) {
            loader.load(_meshes[k].url, function(geometry) {
                var mesh = new THREE.MorphAnimMesh(geometry);  // no material
                mesh.scale.set(_meshes[k].scale,_meshes[k].scale,_meshes[k].scale);
                mesh.position.y = _meshes[k].yOffset;
                mesh.duration = 1000 / _meshes[k].speed;
                mesh.name = k; // for debugging
                if (mesh.name == "human") {
                    console.log('hi');
                    console.log('setting rotation');
                    // mesh.position.z = -6.0;
                    mesh.rotateY( Math.PI );
                    // mesh.rotateX( Math.PI / 2 - 0.05);
                    // scene.add(mesh);
                    // mesh.updateMatrix(); 
                    // mesh.rotation.set(new THREE.Vector3( Math.PI , 0 , 0));
                    // mesh.geometry.verticesNeedUpdate = true;
                    // mesh.geometry.applyMatrix( mesh.matrix );
                    // mesh.matrix.identity();
                }
                _meshes[k].mesh = mesh;

                // refresh mesh if same name as preset
                if (_currPreset === k)
                    _uvAnim.setMesh(mesh);
            });
        });
    };



    // RUN PROGRAM

    _loadMeshes();
    _init();
    _initSound();
    _initUI();
    _initKeyboard();
    _setPreset(_currPreset);
    _engine.start();


};