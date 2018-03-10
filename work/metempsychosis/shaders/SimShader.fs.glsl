#inject shaders/chunks/Constants.glsl
#inject shaders/chunks/Rand.glsl
#inject shaders/chunks/NoiseFuncs.glsl


varying vec2 vUv;

uniform sampler2D tPrev;
uniform sampler2D tCurr;
uniform float uDeltaT;
uniform float uTime;
uniform vec3 uInputPos[4];
uniform vec4 uInputPosAccel;
uniform float uInputAccel;
uniform float uShapeAccel;

#ifdef SIM_TEXTURE
uniform sampler2D tTarget;
#endif

void main() {

    // read data
    vec3 prevPos = texture2D(tPrev, vUv).rgb;
    vec3 currPos = texture2D(tCurr, vUv).rgb;
    vec3 vel = (currPos - prevPos) / uDeltaT;

    // CALC ACCEL

    vec3 accel = vec3(0.0);

    #inject shaders/chunks/SimBasicShapes.glsl
    #inject shaders/chunks/SimRoseGalaxy.glsl
    #inject shaders/chunks/SimGalaxy.glsl
    #inject shaders/chunks/SimTextureTarget.glsl

    #inject shaders/chunks/SimInputPos.glsl

    const float t0 = 0.0;
    const float t1 = 45.0;
    const float t2 = 56.9;
    const float t3 = 63.6;

    float localTime = uTime;
    if (localTime > t1 && localTime < t2) {
       vec3 curl = curlNoise( currPos.xyz * 1.);
        vel += curl * 0.50;
        vel *= 0.03;
    }
    else if (localTime > t2 && localTime < t3) {
        vec3 curl = curlNoise( currPos.xyz * 1.);
        vel += curl * 0.97;
        vel *= 0.50;
    } else if (localTime < t3) {

    }

    // state updates
    vel = K_VEL_DECAY * vel + accel * uDeltaT;


    currPos += vel * uDeltaT;

    // write out
    gl_FragColor = vec4(currPos, 1.0);
}