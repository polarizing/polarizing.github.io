// var balls = [];
var env = new Pizzicato.Sound('assets/audio/bg.wav', function() {
    env.play();
});

env.volume = 2.0;
env.release = 10;

var highPassFilter = new Pizzicato.Effects.HighPassFilter({
    frequency: 10,
    peak: 10
});

var flanger = new Pizzicato.Effects.Flanger({
    time: 0.45,
    speed: 0.2,
    depth: 0.1,
    feedback: 0.1,
    mix: 0.5
});

var pingPongDelay = new Pizzicato.Effects.PingPongDelay({
    feedback: 0.25,
    time: 0.4,
    mix: 0.5
});

var dubDelay = new Pizzicato.Effects.DubDelay({
    feedback: 1.0,
    time: 0.7,
    mix: 0.5,
    cutoff: 700
});

var reverb = new Pizzicato.Effects.Reverb({
    time: 0.01,
    decay: 0.01,
    reverse: false,
    mix: 0.5
});

var ringModulator = new Pizzicato.Effects.RingModulator({
    speed: 0,
    distortion: 1,
    mix: 0.0
});

var bg = new Pizzicato.Sound('assets/audio/californication.mp3', function() {
    bg.play();
});

bg.volume = 0.2;
bg.addEffect(flanger);
bg.addEffect(ringModulator
	)
bg.release = 10;

var paper = new Pizzicato.Sound('assets/audio/paper.wav', function() {
});

paper.volume = 1.5;
paper.addEffect(pingPongDelay);
paper.release = 10;

var pouringCoffee = new Pizzicato.Sound('assets/audio/pouringCoffee.wav', function() {
});
pouringCoffee.release = 10;
pouringCoffee.volume = 0.8;

var sipping = new Pizzicato.Sound('assets/audio/sipping.wav', function() {
});
sipping.release = 10;

var beat = new Pizzicato.Sound('assets/audio/beat.wav', function() {
});
beat.release = 10;
beat.addEffect(reverb);

// Sipping Coffee Counter
var count = 1;
var beatChange = 0;

// Main Animations
var circleAnim;
var waterAnim;
var paperAnim;
var endingAnim;

// Images
var ladyImage, ladyImage3, ladyImage4, ladyImage5, ladyImage6, ladyImage7;

// Delta Time Change (not used)
var lastTime = 0;
var currentTime = 0;

// Text Font
var font;

function preload() {
	  font = loadFont('assets/LeagueGothic-Regular.otf');
}

function setup() {
	createCanvas(window.innerWidth, window.innerHeight);
	ladyImage = loadImage("assets/starbucks.png");  // Load the image
	ladyImage3 = loadImage("assets/lady_3.png");  // Load the image
	ladyImage4 = loadImage("assets/lady_4.png");  // Load the image
	ladyImage5 = loadImage("assets/lady_5.png");  // Load the image
	ladyImage6 = loadImage("assets/lady_6.png");  // Load the image
	ladyImage7 = loadImage("assets/lady_7.png");  // Load the image
	circleAnim = new CircleAnimation();
	waterAnim = new WaterAnimation();
	paperAnim = new PaperAnimation();
	endingAnim = new EndingAnimation();
}

function draw() {
	background(0,89,45,150);
	// console.log(count);
	if (count == 2) {
		paperAnim.hasStarted = true;
		circleAnim.hasStarted = true;
	}

	if (count == 3) {
		circleAnim.ladyImage = ladyImage3;
	}
	if (count == 4) {
		circleAnim.ladyImage = ladyImage4;
	}
	if (count == 5) {
		circleAnim.ladyImage = ladyImage5;
		circleAnim.oscillate = true;
	}
	if (count == 6) {
		circleAnim.ladyImage = ladyImage6;
	}
	if (count == 7) {
		circleAnim.ladyImage = ladyImage7;
	}

	// Changing sound and animation params based on sipping coffee counter.
	waterAnim.speed = count * 1.4;
	beatChange = count**2;
	ringModulator.mix = count * 0.032;
	console.log('Distortion: ', ringModulator.mix)
		// pingPongDelay.feedback = ( paperAnim.papers.length / 10) * 0.1;
		// console.log(pingPongDelay.feedback);
		console.log(count);
	if (!endingAnim.hasStarted && count <= 8) {
		if(waterAnim.hasStarted) {
				if (keyIsDown(49)) {
					pouringCoffee.play();
					waterAnim.update();
				}
				waterAnim.display();
			}

			if(paperAnim.hasStarted){
				if (frameCount % (60 - beatChange) == 0) {
					paperAnim.addPaper();
					paperAnim.animate();
					paperAnim.update();
					paper.stop();
					paper.play();
				}
				
				paperAnim.display();
			}

			if(circleAnim.hasStarted){
				if (frameCount % (60 - beatChange) == 0) {
					circleAnim.update();
					beat.play();
				}
				if (circleAnim.oscillate) {
					circleAnim.oscillateCircles();
				}
				circleAnim.display();
			}
	}
	else {
		if (!endingAnim.hasStarted) {
			endingAnim.hasStarted = true;
			endingAnim.opacityTween.start();
			endingAnim.volumeTween.start();
			endingAnim.lowerVolume();
		}
		endingAnim.update();
		endingAnim.display();
	}

	lastTime = currentTime;
	currentTime = millis();
	deltaTime = currentTime - lastTime;

	TWEEN.update(millis());

}

function keyReleased() {
	if (key === '1') {
		pouringCoffee.pause();
	}
}

function keyTyped() {
	if (key === '1') {
		waterAnim.hasStarted = true;
	}
	if (key == '2') {
		circleAnim.hasStarted = true;
	}
	if (key == '3') {
		paperAnim.hasStarted = true;
		paperAnim.addPaper();
		paperAnim.animate();
	}
	// if (key == '4') {
	// 	if (count >= 2) {
	// 		endingAnim.hasStarted = true;
	// 		endingAnim.opacityTween.start();
	// 		endingAnim.volumeTween.start();
	// 		endingAnim.lowerVolume();
	// 	}
	// }
}

class EndingAnimation {
	constructor() {
		var self = this;
		this.props = { endingOpacity: { value: 0 }, volume: { bg: bg.volume, env: env.volume, paper: paper.volume, pouringCoffee: pouringCoffee.volume, sipping: sipping.volume, beat: beat.volume} };
		this.opacityTween = new TWEEN.Tween(this.props.endingOpacity)
					 .to({ value: 255 }, 5000)
					 .onUpdate(function() {
					 	// bg, paper, pouringCoffee, sipping, beat, env
					 })
		 			.onComplete(function() {
					 })
		 this.volumeTween = new TWEEN.Tween(this.props.volume)
					 .to({ bg: 0, env: 0, paper: 0, pouringCoffee: 0, sipping: 0, beat: 0 }, 5000)
					 .onUpdate(function() {
					 	bg.volume = self.props.volume.bg;
					 	env.volume = self.props.volume.env;
					 	paper.volume = self.props.volume.paper;
					 	pouringCoffee.volume = self.props.volume.pouringCoffee;
					 	sipping.volume = self.props.volume.sipping;
					 	beat.volume = self.props.volume.beat;

					 })
		 			.onComplete(function() {
					 })
		// this.audio = [bg, paper, pouringCoffee, sipping, beat, env];
		this.hasStarted = false;
	}

	lowerVolume() {
		// for (var i = 0; i < this.audio.length; i++) {
		// 	this.audio[i].stop();
		// }
	}

	update() {

	}

	display() {
		fill(0, this.props.endingOpacity.value );
		rect(0, 0, width, height);
	}
}

class IceAnimation {

	constructor() {
		var self = this;

	}

	update() {

	}

	display() {

	}

}


class Paper {
	constructor(desiredPosition, desiredRotation, desiredOpacity) {
		var self = this;
		this.props = {
			position: createVector(width / 2, height),
			rotation: 0,
			desiredPosition: desiredPosition,
			desiredRotation: desiredRotation,
			desiredOpacity: desiredOpacity,
			width: 300,
			height: 400,
			opacity: 255,
		}

		this.message = "when will i finish?";
		this.anim = new TWEEN.Tween(this.props.position)
					 .to({ x : self.props.desiredPosition.x, y : self.props.desiredPosition.y }, 250)
					 .onUpdate(function() {
					 	// console.log('tweening');
					 })
		 			.onComplete(function() {
					 })
		 this.fontsize = 18;
	}



	tween() {
		this.anim.start();
	}

	display() {
		push();
			translate(this.props.position.x, this.props.position.y);
			noStroke();
			fill(255, this.props.desiredOpacity);
			rotate(this.props.desiredRotation);
			rect(0, 0, this.props.width, this.props.height);
			fill(0);
			textSize(18);
			textAlign(CENTER);
			var bounds = font.textBounds(this.message, 0, 0, this.fontsize);
			// console.log(bounds);
			text("midterm paper", this.props.width / 2, this.props.height / 2);
		pop();
	}

}


class PaperAnimation {

	constructor(){
		var self = this;
		this.position = createVector(width / 2, height / 2)
		this.hasStarted = false;
		this.numPapers = 5;
		this.papers = [];
		// for (var i = 0; i < this.numPapers; i++) {
		// 	var desiredRotation = random( radians(-15), radians(15) );
		// 	var delta = createVector(20,20);
		// 	var opacity = (255 / this.numPapers) * i + (255 / this.numPapers);
		// 	var position = createVector( this.position.x + delta.x * i, this.position.y + delta.y * i );
		// 	this.papers.push( new Paper( position, desiredRotation, opacity ));
		// }
	}

	addPaper() {
		var desiredRotation = random( radians(-15), radians(15) );
		var delta = createVector(20,20);
		var opacity = random(100, 255);
		var position = createVector( random(0, width - 200), random(200, height - 200) );
		this.papers.push( new Paper( position, desiredRotation, opacity ));
	}

	animate() {
		for (var i = 0; i < this.papers.length; i++) {
			this.papers[i].tween();
		}
	}

	update(){

	}

	display(){
		push();
		for (var i = 0; i < this.papers.length; i++){
			this.papers[i].display();
		}
		pop();
	}
}

class WaterAnimation {

	constructor() {
		var self = this;
		this.hasStarted = false;
		this.liquid = { value: 0 };
		this.opacity = { value: 255 };
		this.speed = 10.0;
		this.tween = new TWEEN.Tween(this.liquid)
					 .to({value: 0}, 4000)
					 .onUpdate(function() {
						console.log('Opacity Value: ', this.value);
					 })
		 			.onComplete(function() {
					 	self.opacity.value = 255;
					 	pouringCoffee.stop();
					 	count += 1;
					 })
		 this.soundPlaying = false;
	}

	update() {
		if (this.liquid.value < height) {
			this.liquid.value += this.speed;
		}
		else {
			this.liquid.value = height;

			sipping.play();

			this.tween.start();
		}
	}

	display() {

		push();
			translate(0, height - this.liquid.value);
			rotate(this.rotation);
			fill(66, 43, 37, this.opacity.value);
			rect(0, 0, width, height);
		pop();
	}

}

class CircleAnimation {

	constructor() {
		this.numCircles = 8;
		this.circleWidth=width/this.numCircles;
		this.circleRadius = this.circleWidth / 2;
		this.circles = [];
		this.number = 0;
		for (var i = 0; i < this.numCircles; i++) {
			this.circles.push( new Circle( i, createVector(this.circleWidth * i + this.circleRadius, 0) ) )
		}
		this.hasStarted=false;
		this.isStarbucksLogo = false;
		this.ladyImage = ladyImage;
		this.oscillate = false;
	}

	update() {

		if (this.number<this.numCircles){
			this.number++
		}
		else {
			this.number=0
		}

	}

	oscillateCircles() {
		if (this.oscillate) {
			for (var i = 0; i < this.circles.length; i++) {
				this.circles[i].update();
			}
		}
	}

	updateCircles() {

	}

	toggle() {

	}

	display() {
		push()

			translate(0, height / 2);
			noStroke();

			for (var i = 0; i < this.number; i++)  {
				fill(255);
				var pos = this.circles[i].pos;
				ellipse(pos.x, pos.y,this.circleWidth, this.circleWidth);
				image(this.ladyImage, this.circleWidth * i, pos.y - this.circleWidth / 2, this.circleWidth, this.circleWidth);
			}
			
			// translate(0,height/2);
			// noStroke();
			// for (var i=0; i<this.number; i++){
			// 	fill(255);
			// 	ellipse(this.circleWidth*i + this.circleRadius, 0 ,this.circleWidth, this.circleWidth);
			// 	// if (this.isStarbucksLogo) {
			// 	image(this.ladyImage, this.circleWidth * i, 0 - this.circleWidth / 2, this.circleWidth, this.circleWidth);
			// 	// }
			// }

		pop()
	}

}

class Circle {
	constructor(id, pos) {
		this.id = id;
		this.pos = pos;
		this.velocity = createVector(0, 0);
		this.startFrame = 0 + (this.id * 10);
	}
	update() {
		this.pos.y += sin(this.startFrame * 0.1) * 2;
		this.startFrame += 1;
	}
	display() {

	}
}