var appState = {
  currentState: 0,
  video: {
    id: null,
  },
  gui: {
    opacity: 0.0,
    shown: false
  },
  currentMemorySelected: null,
  currentMemorySelectionReady: false
}

var queue        = new createjs.LoadQueue(),
    $state       = $('#state'),
    $progress    = $('#progress'),
    $progressbar = $('#progressbar .bar');

queue.installPlugin(createjs.Sound);
createjs.Sound.alternateExtensions = ["mp3"];

queue.on('complete',     onComplete);
queue.on('error',        onError);
queue.on('fileload',     onFileLoad);
queue.on('fileprogress', onFileProgress);
queue.on('progress',     onProgress);

var manifest = [
  {
    "src": "assets/videos/sitting.m4v",
    "id": "video001",
    "type":"video"
  },
   {
    "src":  "assets/videos/head.m4v",
    "id": "video002",
    "type":"video"
  },
  {
    "src":  "assets/videos/chest.mp4",
    "id": "video003",
    "type":"video"
  },
    {
    "src":  "assets/videos/back.m4v",
    "id": "video004",
    "type":"video"
  },
      {
    "src":  "assets/videos/side.m4v",
    "id": "video005",
    "type":"video"
  },
  {
    "src":  "assets/videos/leftHand.m4v",
    "id": "video006",
    "type":"video"
  },
  {
    "src":  "assets/videos/rightHand.m4v",
    "id": "video007",
    "type":"video"
  },
  {
    "src":  "assets/videos/leftFoot.m4v",
    "id": "video008",
    "type":"video"
  },
  {
    "src":  "assets/videos/rightFoot.m4v",
    "id": "video009",
    "type":"video"
  },
   {
    "src":  "assets/audio/low_drone.mp3",
    "id": "audio001",
    "type":"sound"
  },
  {
    "src":  "assets/audio/slow_heartbeat.mp3",
    "id": "audio002",
    "type":"sound"
  },
  {
    "src":  "assets/audio/metal_door_slam.mp3",
    "id": "audio003",
    "type":"sound"
  },
  {
    "src":  "assets/audio/ambience.mp3",
    "id": "audio004",
    "type":"sound"
  },
  {
    "src": "assets/videos/happy.mp4",
    "id": "happy",
    "type": "video"
  },
  {
    "src": "assets/audio/architecture.mp3",
    "id": "outroMusic",
    "type": "sound"
  }
]

for (var i = 1; i < 53; i++) {
    var newEntry = {};
    // newEntry.name = currentIdx.name.first + " " + currentIdx.name.last;
    newEntry.src = 'assets/images/F' + i + '.JPG';
    newEntry.id = 'memoryPic' + i;
    newEntry.type = 'image'
    manifest.push(newEntry);
}

queue.loadManifest(manifest);

function switchVideo (id) {
        var vid = queue.getResult(id);
          if (appState.video.id) {
            $('#' + appState.video.id).get(0).pause();
            $('#' + appState.video.id).hide();
          }
          $('#' + id).show();
          $('#' + id).get(0).play();
          $('#' + id).get(0).loop = true;

          appState.video.id = id;
    }

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Once all assets in manifest are loaded with preload.js
// we initiate the Snap SVG library to load our SVG UI.

// For simple introduction to SnapSVG, see http://svg.dabbles.info/
// and http://snapsvg.io/start/.

// We load our SVG asynchronous using Snap.load(). We will have access to this SVG as a 
// Snap Fragment object within the callback, which we will use to bind event listeners,
// interaction, animation to parts of our SVG.

function onComplete(event) {

  // console.log('Complete', event);
  // $state.text( $state.text() + '[All loaded]' );
  // $progressbar.addClass('complete');

    var s = Snap("#svgout");

    var vid = $("#fs-video");
    var begin = $("#intro button");
    var intro = $('#intro');

    // SVG ID Labels for Easy Access
    var gui = {

      body: {
        head: {
          title: 'Head',
          id: 'head',
          snapElem: null
        },
        chest: {
          title: 'Chest',
          id: 'chest',
          snapElem: null
        },
        leftShoulder: {
          title: 'Left Shoulder',
          id: 'leftShoulder',
          snapElem: null
        },
        rightShoulder: {
          title: 'Right Shoulder',
          id: 'rightShoulder',
          snapElem: null
        },
        leftHand: {
          title: 'Left Hand',
          id: 'leftHand',
          snapElem: null
        },
        rightHand: {
          title: 'Right Hand',
          id: 'rightHand',
          snapElem: null
        },
        leftFoot: {
          title: 'Left Foot',
          id: 'leftFoot',
          snapElem: null
        },
        rightFoot: {
          title: 'Right Foot',
          id: 'rightFoot',
          snapElem: null
        }
      }

    };

    var tux = Snap.load("assets/images/gui.svg", function ( f ) {

          var sound001;
          var sound002;
          var sound003;
          var sound004;

          var myp5;

          // STEP 1: ILLUSTRATOR SVG -> INTERACTIVE UI
          // Here, we will bind event listeners to parts of the SVG
          // and append to DOM. This makes parts of the SVG clickable, interactive,
          // and have basic transitional effects.


            // GUI_BODY_COMPONENT

            var body = f.select('#body');
     
            var bodyScreen = f.select('#bodyScreen');
            var bodyDesign = f.select('#design');

            bodyScreen.hover(function() {
              this.attr({class: 'whitefadein'});
              bodyDesign.attr({class: 'redfadein'});
            }, function() {
              this.attr({class: 'whitefadeout'});
            })

            for (var key in gui.body) {
              var item = gui.body[key];
              item.snapElem = f.select('#' + item.id);
              item.snapElem.select('#' + item.id + 'Label').attr('fill-opacity', '0.0');
              item.snapElem.select('#' + item.id + 'Boundary').attr('fill-opacity', '0.0');

              // item.snapElem.attr('fill-opacity', '0.0');
              item.snapElem.hover(function() {
                var currElemId = this.attr('id');
                var currElemLabel = this.select('#' + currElemId + 'Label');
                var currElemBoundary = this.select('#' + currElemId + 'Boundary');
                currElemLabel.animate({'fill-opacity': '1'}, 700, mina.bounce, function() {})
                currElemBoundary.animate({'fill-opacity': '1'}, 700, mina.bounce, function() {})
              }, function() {
                var currElemId = this.attr('id');
                var currElemLabel = this.select('#' + currElemId + 'Label');
                var currElemBoundary = this.select('#' + currElemId + 'Boundary');
                currElemLabel.animate({'fill-opacity': '0'}, 700, mina.linear, function() {})
                currElemBoundary.animate({'fill-opacity': '0'}, 700, mina.linear, function() {})
              })

              item.snapElem.click(function() {

                switch(this.attr('id')) {
                  case "head": switchVideo('video002')
                               break;
                  case "chest": switchVideo('video003')
                                break;
                   case "leftShoulder": switchVideo('video004')
                                break;
                  case "rightShoulder": switchVideo('video005')
                               break;
                  case "leftHand": switchVideo('video006')
                                break;
                   case "rightHand": switchVideo('video007')
                                break;
                  case "leftFoot": switchVideo('video008')
                               break;
                  case "rightFoot": switchVideo('video009')
                                break;
                }
              })
            }

            // GUI_BUTTON_COMPONENT

            var buttonCapsuleBackground = f.select('#background');
            var buttonPlayBackground = f.select('#playButton');

            console.log('CAPSULE', buttonCapsuleBackground);
            buttonCapsuleBackground.hover(function() {
              this.attr({class: 'redfadein'});
              // this.animate({'fill': '#fff000'}, 700, mina.bounce, function() {})
            }, function() {
              this.attr({class: 'redfadeout'})
            })

            buttonPlayBackground.hover(function() {
                            this.attr({class: 'redfadein'});
                            buttonCapsuleBackground.attr({class: 'redfadein'})
                          }, function() {
                            this.attr({class: 'redfadeout'})
                            buttonCapsuleBackground.attr({class: 'redfadeout'})
                          })

            buttonPlayBackground.click(function() {
              console.log('hi');

             
              $('#gui').fadeOut(1000, function() {
                    myp5.remove();
                    $('#gui').remove();
                    $('canvas').remove();
                    $('#intro').remove();
                    $('#fs-video').fadeOut(4000, function() {
                        $('#fs-video').remove();

                        sound001.stop();
                        sound002.stop();
                        sound003.stop();

                          init();
                          animate();
                    });
              });
            })

            // Finally, we append the fragment to our original Snap object
            // which will append to DOM.

            s.append( f );

            // STEP 2: p5.js Canvas Overlay for Animated Components
            // We will create an individual instance of p5.js within this function's scope
            // in order to have access to SnapSVG. This way we can find positions of 
            // our SVG UI elements through Snap and create more complicated animations 
            // through Canvas/WebGL.

            // Note: The sketch is not called until Step 3 -- where are our app begins.
            // The sketch also utilizes helper classes that are at the bottom of this function for readability.
            // These helper classes are prototype-based functional classes which are hoisted to the top.

            var sketch = function ( p ) {

              var heartbeat;


              p.preload = function() {

              }

              p.setup = function() {

                p.createCanvas(p.windowWidth, p.windowHeight);

                var leftPos  = $("#monitorFrame")[0].getBoundingClientRect().left   + $(window)['scrollLeft']();
                var rightPos = $("#monitorFrame")[0].getBoundingClientRect().right  + $(window)['scrollLeft']();
                var topPos   = $("#monitorFrame")[0].getBoundingClientRect().top    + $(window)['scrollTop']();
                var bottomPos= $("#monitorFrame")[0].getBoundingClientRect().bottom + $(window)['scrollTop']();

                height = bottomPos - topPos;
                width = rightPos - leftPos;
                heartbeat = new HeartBeat(p, leftPos, topPos, width, 30);
              }

              p.draw = function() {
                p.clear();
                heartbeat.display();
              }

              p.windowResized = function() {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
                // if ($("#monitorFrame")[0]) {
                  var leftPos  = $("#monitorFrame")[0].getBoundingClientRect().left   + $(window)['scrollLeft']();
                  var rightPos = $("#monitorFrame")[0].getBoundingClientRect().right  + $(window)['scrollLeft']();
                  var topPos   = $("#monitorFrame")[0].getBoundingClientRect().top    + $(window)['scrollTop']();
                  var bottomPos= $("#monitorFrame")[0].getBoundingClientRect().bottom + $(window)['scrollTop']();
                // }
                height = bottomPos - topPos;
                width = rightPos - leftPos;
                heartbeat = new HeartBeat(p, leftPos, topPos + height / 2, width, 30);
              }

            }

            // Step 3: Putting together THREE.JS Outro

          var days = 0;
          var clock = new THREE.Clock();

  
          class MemoryLoader {
            constructor() {
              this.memoryCreation = true;
              this.rate = 1; // per second
              this.numberToCreate = 1;
              this.lastMemoryCreation = 0;
              this.age = 0;
              this.memoriesCreated = 0;
              this.objects = [];

              this.createProps = {
                tweenToZ: 10000,
                opacityTween: true
              }

              this.dayUpdate = true;
              this.dayUpdateRate = 1;
              this.lastDateUpdate = 0;
              this.day = 0;
              this.dateTime = moment("31000101");
              this.date = document.createElement( 'div' );
              this.date.className = 'date';
              this.date.textContent = this.dateTime.month() + 1 + " " + this.dateTime.date() + " " + this.dateTime.year()

              var dateObject = new THREE.CSS3DObject( this.date );
              dateObject.position.x = 0;
              dateObject.position.y = 575;
              dateObject.position.z = 0;
              scene.add(dateObject);

              this.current = {
                rate: 1,
              }

              var self = this;
              var rateDown = new TWEEN.Tween( this.current )
                    .to( { rate: 0.02 }, 30000 ) // 30000 // 25000
                    .easing( TWEEN.Easing.Cubic.Out )
                    .onUpdate( function () {
                      self.dayUpdateRate = self.current.rate;
                      self.rate = self.current.rate;
                    } )
                    .onComplete(function() {
                  
                    })

              var rateUp = new TWEEN.Tween( this.current )
                  .to( { rate: 1 }, 10000 ) // 10000
                    .easing( TWEEN.Easing.Cubic.Out )
                    .onUpdate( function () {
                      self.dayUpdateRate = self.current.rate;
                        self.createProps.opacityTween = false;
                    } )
                    .onComplete(function() {
                    self.dayUpdate = false;
                    self.memoryCreation = false;
                    self.date.textContent = "Present Day";

                    self.newMemory = document.createElement( 'div' );
                    self.newMemory.className = 'newmemory';

                    // var picture = document.createElement ( 'img' );
                    // picture.className = 'newmemoryPicture';
                    // picture.src = 'assets/images/F4.jpg';

                    var picture = queue.getResult("memoryPic4");
                    picture.className = 'newmemoryPicture';
                    self.newMemory.appendChild( picture );

                    var memoryId = document.createElement( 'div' );
                    memoryId.className = 'newmemoryId';
                    self.newMemory.appendChild( memoryId );

                    var newMemoryObject = new THREE.CSS3DObject( self.newMemory );
                    newMemoryObject.position.x = 0;
                    newMemoryObject.position.y = 0;
                    newMemoryObject.position.z = 3000;

                    newMemoryObject.element.style.opacity = 1;
                    appState.currentMemorySelected = newMemoryObject;

                    scene.add(newMemoryObject);

                    var newMemProps = {
                      opacity: 0,
                    }

                     new TWEEN.Tween( newMemProps )
                        .to( { opacity: 1 }, 5000 ) // 30000
                        .easing( TWEEN.Easing.Cubic.Out )
                        .onUpdate( function () {
                          newMemoryObject.element.style.opacity = newMemProps.opacity;
                        } )
                        .onComplete(function() {
                      
                        })
                        .start();

                      var tweenA = new TWEEN.Tween( newMemoryObject.position )
                      .to( { x: newMemoryObject.position.x, y: newMemoryObject.position.y, z: newMemoryObject.position.z - 1500 }, 7500)
                      .easing( TWEEN.Easing.Cubic.Out )
                      .onComplete(function() {

                        $(".newmemoryId").typed({
                          strings: ['New Memory Collected', 'Analyzing ...', 'Mem Id: #' + self.memoriesCreated],
                          // Optionally use an HTML element to grab strings from (must wrap each string in a <p>)
                          stringsElement: null,
                          // typing speed
                          typeSpeed: 3,
                          // time before typing starts
                          startDelay: 0,
                          // backspacing speed
                          backSpeed: 1,
                          // shuffle the strings
                          shuffle: false,
                          // time before backspacing
                          backDelay: 500,
                          // Fade out instead of backspace (must use CSS class)
                          fadeOut: false,
                          fadeOutClass: 'typed-fade-out',
                          fadeOutSpeed: 500, // milliseconds
                          // loop
                          loop: false,
                          // null = infinite
                          loopCount: null,
                          // show cursor
                          showCursor: true,
                          // character for cursor
                          cursorChar: null,
                          // attribute to type (null == text)
                          attr: null,
                          // either html or text
                          contentType: 'html',
                          // call when done callback function
                          callback: function() {
                            $('#menu').show();
                            console.log('All done');
                            var props = {
                              grayscale: 0
                            }
                            new TWEEN.Tween( props )
                              .to( { grayscale: 100 }, 10000 ) // 30000
                              .easing( TWEEN.Easing.Cubic.Out )
                              .onUpdate( function () {
                                newMemoryObject.element.style.filter = 'grayscale(' + props.grayscale + '%)';
                              } )
                              .onComplete(function() {
                            
                              })
                              .start();

                             new TWEEN.Tween( newMemoryObject.position )
                            .to( { x: newMemoryObject.position.x, y: newMemoryObject.position.y, z: newMemoryObject.position.z - 1500 }, 7500)
                            .easing( TWEEN.Easing.Cubic.InOut )
                            .onComplete(function() {
                              appState.currentMemorySelectionReady = true;

                            })
                            .start();

                          },
                          // starting callback function before each string
                          preStringTyped: function() {},
                          //callback for every typed string
                          onStringTyped: function() {
                          },
                          // callback for reset
                          resetCallback: function() {
                          }
                        });
                      })
                    tweenA.start();


                    })

              rateDown.chain(rateUp);
              rateDown.start();
              }

            update(dt) {

              var self = this;

              this.lastMemoryCreation += dt;
              this.lastDateUpdate += dt;
              this.age += dt;

              if (this.dayUpdate) {
                if (this.lastDateUpdate > this.dayUpdateRate) {
                  this.dateTime = moment("31000101").add(this.day, 'days');
                  this.date.textContent = this.dateTime.month() + 1 + " " + this.dateTime.date() + " " + this.dateTime.year();
                  this.day += 1;
                  this.lastDateUpdate = 0;
                }
              }
              if (this.memoryCreation) {
                if (this.lastMemoryCreation > this.rate) {
                      var item = table[Math.floor(Math.random()*table.length)];
                      // var item = queue.getResult("memoryPic" + getRandomInt(1, 52)).src;
                      // item.id = "newInsertedPic";
                      var memory = document.createElement( 'div' );
                      memory.addEventListener('click', function(event) {
                        console.log('clicked memory');
                        console.log(this);
                        for (var i = 0; i < self.objects.length; i++) {
                          if (self.objects[i].element === this) {
                            console.log('found!');
                            if (appState.currentMemorySelected && appState.currentMemorySelectionReady) {
                              var cssObject = self.objects[i];

                              var curr = {
                                x: cssObject.position.x,
                                y: cssObject.position.y,
                                z: cssObject.position.z
                              }

                                new TWEEN.Tween( self.objects[i].position )
                                .to( { x: 0, y: 0, z: 1000 }, 3000)
                                .easing( TWEEN.Easing.Cubic.InOut )
                                .onComplete(function() {

                                })
                                .start();

                                new TWEEN.Tween( appState.currentMemorySelected.position )
                                .to( { x: curr.x, y: curr.y, z: curr.z }, 3000)
                                .easing( TWEEN.Easing.Cubic.InOut )
                                .onUpdate(function() {
                                  appState.currentMemorySelectionReady = false;
                                })
                                .onComplete(function() {
                                  appState.currentMemorySelectionReady = true;
                                  appState.currentMemorySelected = cssObject;
                                })
                                .start();

                            }
                            

                          }
                          else {
                            console.log('not found');
                          }
                        }
                      })
                      memory.className = 'memory';
                      memory.style.backgroundColor = 'rgba(0,127,127,255)';

                      var picture = document.createElement ( 'img' );
                      picture.className = 'picture';
                      picture.src = item.picture;

                      console.log(picture);
                      memory.appendChild( picture );

                      var memoryId = document.createElement( 'div' );
                      memoryId.className = 'memoryId';
                      memoryId.textContent = 'Mem Id: #' + this.memoriesCreated;
                      memory.appendChild( memoryId );

                      var object = new THREE.CSS3DObject( memory );
                      object.position.x = Math.random() * 5000 - 2500;
                      object.position.y = Math.random() * 2500 - 1250;
                      object.position.z = -11000;
                      object.blending = THREE.AdditiveBlending;
                      scene.add( object );
                      this.objects.push( object );

                      object.element.style.opacity = 0;
                      object.current = {
                        opacity: 0
                      }

                      var tweenA = new TWEEN.Tween( object.position )
                        .to( { x: object.position.x, y: object.position.y, z: object.position.z + getRandomInt(9000, 10000) }, 5000)
                        .easing( TWEEN.Easing.Cubic.Out )

                      tweenA.start();

                      if (this.createProps.opacityTween) {
                        var opacityTweenA = new TWEEN.Tween( object.current )
                          .to( { opacity: 1 }, 1000 )
                          .onUpdate( function () {
                              object.element.style.opacity = object.current.opacity;
                          } )
                          // .delay(5000);

                        var opacityTweenB = new TWEEN.Tween( object.current )
                            .to( { opacity: 0 }, 5000 )
                            .onUpdate( function () {
                                object.element.style.opacity = object.current.opacity;
                            } )
                            .onComplete(function() {
                              // self.objects.splice(self.objects.indexOf(object), 1);
                              // console.log(self.objects.indexOf(object));
                              scene.remove(object);
                              object.element.remove();
                            })

                        opacityTweenA.chain(opacityTweenB);
                        opacityTweenA.start();
                      }
                      else {
                        var opacityTweenA = new TWEEN.Tween( object.current )
                          .to( { opacity: 1 }, 1000 )
                          .onUpdate( function () {
                              object.element.style.opacity = object.current.opacity;
                          } )

                          var opacityTweenB = new TWEEN.Tween( object.current )
                            .to( { opacity: Math.random(0, 1) }, 5000 )
                            .onUpdate( function () {
                                object.element.style.opacity = object.current.opacity;
                            } )
                            .onComplete(function() {
                              // scene.remove(object);
                              // object.element.remove();
                            })

                        opacityTweenA.chain(opacityTweenB);
                        opacityTweenA.start();
                      }
                      

                      this.lastMemoryCreation = 0;
                      this.memoriesCreated += 1;
                  }
              }
              

            }

            display() {

            }
          }


      var table = [
      ]

      for (var i = 1; i < 53; i++) {
            var newEntry = {};
            newEntry.picture = 'assets/images/F' + i + '.JPG';
            table.push(newEntry);
        }

      var camera, scene, renderer;
      var controls;
      var objects = [];
      var targets = { table: [], sphere: [], helix: [], grid: [] };
      var date;

      var memoryLoader;

      function init() {
        camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 50000 );
        camera.position.z = 3000;
        scene = new THREE.Scene();

          video = document.createElement( 'video' );
          video.id = 'video';
          // video.type = ' video/ogg; codecs="theora, vorbis" ';
          video.src = "assets/videos/happy.mp4";
          video.load(); // must call after setting/changing source
          video.play();

          // video = queue.getResult("happy");
          // video.id = 'video';
          // video.load();
          // video.play();

          var volObj = {
            volume: 0
          }

          new TWEEN.Tween( volObj )
              .to( { volume: 1 }, 2500)
              .easing( TWEEN.Easing.Linear.None )
              .onUpdate(function() {
                video.volume = volObj.volume
              })
              .start();

          var videoObject = new THREE.CSS3DObject( video );
          videoObject.position.x = 0;
          videoObject.position.y = 0;
          videoObject.position.z = 1750;
          videoObject.element.style.opacity = 1.0;

          scene.add( videoObject );

          new TWEEN.Tween( videoObject.position )
              .to( { x: videoObject.position.x, y: videoObject.position.y, z: videoObject.position.z - 7000 }, 60000)
              .easing( TWEEN.Easing.Linear.None )
              .delay(90000)
              .onStart(function() {
                console.log('called start');
                memoryLoader = new MemoryLoader();
                videoObject.position.z = 3750;
                
// var audio = queue.getResult("outroMusic");
                var instance = createjs.Sound.play("outroMusic");
                instance.volume = 0.5;
// console.log(audio);
                // audio.play();
              })
              .start();

          var videoProps = {
            scale: 100,
            opacity: 1
          }

          new TWEEN.Tween( videoProps )
              .to( { opacity: 0.3 }, 60000)
              .easing( TWEEN.Easing.Linear.None )
              .onUpdate( function() {
                videoObject.element.style.opacity = videoProps.opacity;   
              })
              .delay(90000)
              .start();

        renderer = new THREE.CSS3DRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.domElement.style.position = 'absolute';
        renderer.sortObjects = true;

        document.getElementById( 'container' ).appendChild( renderer.domElement );
        //
        controls = new THREE.TrackballControls( camera, renderer.domElement );
        controls.rotateSpeed = 0.5;
        controls.minDistance = 500;
        controls.maxDistance = 50000;
        controls.addEventListener( 'change', render );

        window.addEventListener( 'resize', onWindowResize, false );
      }

      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        render();
      }
      function animate() {
        requestAnimationFrame( animate );

        var dt = clock.getDelta();

        if (memoryLoader) {
          memoryLoader.update(dt);
          memoryLoader.display();
        }

        TWEEN.update();
        controls.update();
        render();
      }
      function render() {
        camera.lookAt( scene.position );
        camera.position.x += 0;
        renderer.render( scene, camera );
      }

            // STEP 3: Putting everything together.
            // Here we will control the main logic of our application.
            
            sound001 = createjs.Sound.play("audio001", { loop: -1 , volume: 0.15});
            switchVideo("video001");
            $('#' + appState.video.id).get(0).loop = false;


            // When first loaded on landing page, GUI is not seen.
            if (appState.currentState == 0) {
              $('#svgout').hide();
            }

            
            // The following section of code dictates the transition from
            // State 0 (Landing Page) to State 1 (Intro).

            // Upon click of the 'Begin' button, the intro video will
            // fade out, our appstate updates, we modify background video and audio.
            // We also fade in our SVG 

            begin.click(function() {
              sound003 = createjs.Sound.play("audio003", { volume: 0.25 });
              vid.animate({
                opacity: 0
              }, 4000, function() {
                appState.currentState = 1;
                  switchVideo("video003");

                 if (appState.currentState == 1) {

                  vid.animate({
                          opacity: 1
                        }, 5000, function() {
                            $('#svgout').fadeIn().css('opacity', 0);
                            myp5 = new p5(sketch);
                            sound002 = createjs.Sound.play("audio002", { loop: -1 , volume: 0.15 });
                            // sound004 = createjs.Sound.play("audio004", { loop: -1 , volume: 0.08 });
                            // sound001.stop();
                            $('#svgout').animate({
                              opacity: 1
                            }, 1500, function() {

                            });
                      })
                  }
              })

              intro.animate({
                opacity: 0
              }, 4000, function() {

              })
            })



            function HeartBeat(p, nX, nY, duration, rate) {
                this.p = p;
                this.pos = this.p.createVector(nX, nY);
                this.duration = duration;
                this.rate = rate;
                this.y = [];
                for (var i = 0; i < this.duration; i++) {
                  this.y.push(0);
                }
                this.startingFrame = this.p.frameCount;
                this.pulsing = false;
                this.pulseStart = 0;
                this.pulseCount = 0;
            }

            HeartBeat.prototype.pulse = function() {

            }

            HeartBeat.prototype.update = function() {

            }

            HeartBeat.prototype.display = function() {
                this.p.push();
                  this.p.translate(this.pos.x, this.pos.y);
                  this.p.stroke(255);
                  this.p.strokeWeight(1.0);
                  for (var i = this.y.length - 1; i > 0; i--) {
                    this.y[i] = this.y[i - 1];
                  }
                  for (var i = 1; i < this.y.length; i++) {
                      this.p.line(i, this.y[i], i - 1, this.y[i - 1])
                  }

                  if (this.pulsing) {
                    this.y[0] = this.p.sin(this.pulseCount * 0.5) * this.p.random(0, 25);
                    if (this.p.frameCount - this.pulseStart == 13) {
                      this.pulsing = false;
                    }
                    this.pulseCount += 1;
                  } else {
                    this.y[0] = 0;
                  }
                  if (this.p.frameCount % 58 == 0) {
                    this.pulsing = true;
                    this.pulseStart = this.p.frameCount;
                    this.pulseCount = 0;
                    var h = f.select('#heartRateNum').children()[1];
                    h.attr({ text: this.p.int(this.p.random(90, 93)) });
                    console.log(f);
                    console.log(h);
                  } 
                  
                this.p.pop();
            }
    } );
}

function onError(event) {
  console.log('Error', event);
  $state.text( $state.text() + '[' + event.item.id + ' errored] ');
}

function onFileLoad(event) {
  console.log('File loaded', event);
  $state.text( $state.text() + '[' + event.item.id + ' loaded] ');
  var item = event.item;
  var type = item.type;

  if (type == createjs.LoadQueue.VIDEO) {
      var vid = event.result;
      $(vid).prop('autoplay', false);
      $(vid).attr('id', event.item.id)
      $(vid).attr('muted', true);
      vid.className = 'fs-video';

      $(vid).hide();
      $('#fs-video').append( $(vid) );
  }
}

function onFileProgress(event) {
  console.log('File progress', event);
}

function onProgress(event) {
  var progress = Math.round(event.loaded * 100);
  
  console.log('General progress', Math.round(event.loaded) * 100, event);
  $progress.text(progress + '%');
  $progressbar.css({
    'width': progress + '%'
  });
}