import{r as e}from"./rolldown-runtime-C60lm6uB.js";import{i as t,r as n}from"./framework-BgSIrAUN.js";import{a as r,i,n as a,o,r as s,s as c,t as l,useDialKit as u}from"./dist-B3OuQTcg.js";function d(e,t,n={}){let i=e.get(),a=null,s=i,l,u=typeof i==`string`?i.replace(/[\d.-]/g,``):void 0,d=()=>{a&&=(a.stop(),null),e.animation=void 0},m=()=>{let t=p(e.get()),r=p(s);if(t===r){d();return}let i=a?a.getGeneratorVelocity():e.getVelocity();d(),a=new o({keyframes:[t,r],velocity:i,type:`spring`,restDelta:.001,restSpeed:.01,...n,onUpdate:l})},h=()=>{m(),e.animation=a??void 0,e.events.animationStart?.notify(),a?.then(()=>{e.animation=void 0,e.events.animationComplete?.notify()})};if(e.attach((e,t)=>{s=e,l=e=>t(f(e,u)),c.postRender(h)},d),r(t)){let r=n.skipInitialAnimation===!0,i=t.on(`change`,t=>{r?(r=!1,e.jump(f(t,u),!1)):e.set(f(t,u))}),a=e.on(`destroy`,i);return()=>{i(),a()}}return d}function f(e,t){return t?e+t:e}function p(e){return typeof e==`number`?e:parseFloat(e)}var m=e(n(),1);function h(e,t,n){(0,m.useInsertionEffect)(()=>e.on(t,n),[e,t,n])}function g(e,t={}){let{isStatic:n}=(0,m.useContext)(i),o=()=>r(e)?e.get():e;if(n)return a(o);let c=s(o());return(0,m.useInsertionEffect)(()=>d(c,e,t),[c,JSON.stringify(t)]),c}function _(e,t={}){return g(e,{type:`spring`,...t})}var v=t(),y=.35,b=3.6,x=50;function S(e){return y+Math.max(0,Math.min(100,e))/100*(b-y)}var C=[{id:`recording`,kind:`video`,src:`/IMG_7400.mp4`,poster:`/IMG_7400-poster.jpg`,caption:`Grass Study Recording.mp4`,label:`Original footage of mounded ornamental grass moving in the wind`},{id:`pixel-map`,kind:`image`,src:`/pixel-hex-map.png`,caption:`Pixel Hex Map.png`,label:`Pixel hex color map`},{id:`relief-map`,kind:`image`,src:`/color-relief-map.png`,caption:`Color Relief Map.png`,label:`Color relief map`},{id:`gradient-map`,kind:`image`,src:`/gradient-map.png`,caption:`Gradient Map.png`,label:`Gradient color map`},{id:`topographical-map`,kind:`image`,src:`/topographical-map.png`,caption:`Topographical Map.png`,label:`Topographical terrain map`}],w=[`7394`,`7398`,`7400`,`7401`,`7403`,`7406`],T={stiffness:410,damping:34,mass:.92,restDelta:.22,restSpeed:2.2};function E(e){return Math.max(0,Math.min(1,e))}function D(e,t){if(e<=0)return e*.18;let n=Math.max(t,1);return e*.72/(1+e/(n*.72))}function O(e){if(!e||e.readyState<HTMLMediaElement.HAVE_CURRENT_DATA||e.videoWidth<1||e.videoHeight<1)return null;let t=Math.max(e.videoWidth,e.videoHeight),n=Math.min(1,960/t),r=document.createElement(`canvas`);r.width=Math.max(1,Math.round(e.videoWidth*n)),r.height=Math.max(1,Math.round(e.videoHeight*n));let i=r.getContext(`2d`,{alpha:!1});if(!i)return null;try{return i.drawImage(e,0,0,r.width,r.height),r.toDataURL(`image/jpeg`,.94)}catch{return null}}function k({flight:e,onComplete:t}){return(0,v.jsx)(l.div,{className:`recording-overlay-card recording-overlay-card-returning`,initial:{x:e.from.x,y:e.from.y,width:e.from.width,height:e.from.height,borderRadius:e.from.radius},animate:{x:e.to.x,y:e.to.y,width:e.to.width,height:e.to.height,borderRadius:e.to.radius},transition:{x:{type:`spring`,...T,velocity:e.velocityX},y:{type:`spring`,...T,velocity:e.velocityY},width:{type:`spring`,...T,velocity:e.velocityWidth},height:{type:`spring`,...T,velocity:e.velocityHeight},borderRadius:{type:`spring`,...T,velocity:e.velocityRadius}},onAnimationComplete:()=>t(e.id),"aria-hidden":`true`,children:e.frameDataUrl?(0,v.jsx)(`img`,{className:`recording-overlay-video recording-overlay-frame`,src:e.frameDataUrl,alt:``,draggable:!1}):(0,v.jsx)(`video`,{className:`recording-overlay-video`,src:`/study-${e.recording}.mp4`,autoPlay:!0,loop:!0,muted:!0,playsInline:!0,preload:`auto`,onLoadedMetadata:t=>{let n=t.currentTarget;Number.isFinite(e.playbackTime)&&(n.currentTime=e.playbackTime),n.play().catch(()=>void 0)}})})}var A=`#version 300 es
precision highp float;
layout(location=0) in vec2 aBlade;
layout(location=1) in vec3 aRoot;
layout(location=2) in vec4 aShape;
layout(location=3) in vec4 aMotion;
uniform mat4 uVP;
uniform float uTime;
uniform float uWindScale;
uniform float uBladeLengthScale;
uniform float uTerrainDepth;
uniform float uStudy;
uniform sampler2D uTerrain;
out vec3 vNormal;
out vec3 vWorld;
out float vT;
out float vShade;
out float vGust;

vec2 terrainUV(vec2 xz) {
  return vec2((xz.x + 10.0) / 20.0, (12.0 - xz.y) / 34.0);
}

float terrainShape(vec2 xz) {
  vec3 sampleColor = textureLod(uTerrain, clamp(terrainUV(xz), 0.0, 1.0), 5.0).rgb;
  float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
  return smoothstep(0.19, 0.76, luminance);
}

void main() {
  float side = aBlade.x;
  float t = aBlade.y;
  float secondStudy = step(0.5, uStudy);
  float terrainLevel = terrainShape(aRoot.xz);
  float terrainX = terrainShape(aRoot.xz + vec2(0.16, 0.0));
  float terrainZ = terrainShape(aRoot.xz + vec2(0.0, 0.16));
  // DialKit's authored terrain value is 2.0. Zero removes all relief and
  // values above 2.0 exaggerate the exact same height field. The nonlinear
  // upper range makes the far-right state intentionally tall and spiky while
  // preserving the authored midpoint exactly.
  float authoredTerrainStrength = mix(0.58, 0.43, secondStudy);
  float depthInput = max(uTerrainDepth * 0.5, 0.0);
  float depthScale = depthInput <= 1.0
    ? pow(depthInput, 1.55)
    : 1.0 + pow(depthInput - 1.0, 1.15) * 4.5;
  float terrainStrength = authoredTerrainStrength * depthScale;
  float terrainY = (terrainLevel - 0.5) * terrainStrength;
  // Terrain Depth owns elevation only. Blade drape and rest direction remain
  // stable while the hill roots move up and down, so raising the terrain can
  // never make the vegetation look flatter.
  float orientationStrength = authoredTerrainStrength;
  vec2 terrainGradient = vec2(terrainX - terrainLevel, terrainZ - terrainLevel) * orientationStrength / 0.16;
  vec3 terrainNormal = normalize(vec3(-terrainGradient.x, 1.0, -terrainGradient.y));
  float slopeAmount = smoothstep(0.018, 0.18, length(terrainGradient));
  vec2 downhill = normalize(-terrainGradient + vec2(0.0001));
  float height = aShape.x * uBladeLengthScale * mix(0.94, 1.06, terrainLevel);
  float width = aShape.y;
  vec2 radial = vec2(cos(aShape.z), sin(aShape.z));
  vec2 bladeSide = vec2(cos(aShape.w), sin(aShape.w));
  vec2 windDirection = normalize(mix(vec2(0.78, 0.63), vec2(-0.18, 0.98), secondStudy));

  vec2 frontDirection = normalize(mix(vec2(0.56, 0.83), vec2(-0.12, 0.99), secondStudy));
  vec2 frontSide = vec2(-frontDirection.y, frontDirection.x);
  float alongFront = dot(aRoot.xz, frontDirection);
  float acrossFront = dot(aRoot.xz, frontSide);
  float clumpLag = sin(aMotion.z * 1.37) * 0.52;
  float frontPhase = fract((alongFront - uTime * mix(1.06, 0.72, secondStudy) + clumpLag) / 18.0);
  float frontDistance = min(frontPhase, 1.0 - frontPhase) * 18.0;
  float primaryFront = 1.0 - smoothstep(0.75, 3.15, frontDistance);
  float primaryRegion = 0.18 + 0.82 * pow(
    sin(acrossFront * 0.31 - uTime * 0.23 + aMotion.z * 0.11) * 0.5 + 0.5,
    1.65
  );
  float secondPhase = fract((dot(aRoot.xz, vec2(-0.84, 0.54))
    - uTime * 0.68 - clumpLag * 0.42) / 23.0);
  float secondDistance = min(secondPhase, 1.0 - secondPhase) * 23.0;
  float secondFront = (1.0 - smoothstep(0.55, 2.45, secondDistance))
    * (0.24 + 0.76 * pow(sin(aRoot.x * 0.26 + uTime * 0.17) * 0.5 + 0.5, 2.0));
  float clumpBreath = sin(uTime * (0.86 + sin(aMotion.z) * 0.12) + aMotion.z)
    * 0.5 + 0.5;
  float frontResponse = 0.68 + 0.32 * (sin(aMotion.z * 1.91) * 0.5 + 0.5);
  float gust = clamp(primaryFront * primaryRegion * frontResponse
    + secondFront * 0.38, 0.0, 1.0);
  float peakGust = pow(gust, 2.20);
  float extremeWind = smoothstep(1.0, 3.6, uWindScale);
  float chaosA = sin(dot(aRoot.xz, vec2(0.91, -0.47)) * 1.16
    - uTime * 3.60 + aMotion.z * 0.72);
  float chaosB = sin(dot(aRoot.xz, vec2(-0.38, 0.96)) * 1.74
    - uTime * 4.85 + aMotion.z * 1.31);
  float chaosC = sin(dot(aRoot.xz, vec2(0.52, 0.68)) * 2.43
    + uTime * 2.95 + aMotion.x * 0.19);
  float chaosPulse = clamp(0.52 + chaosA * 0.25 + chaosB * 0.16
    + chaosC * 0.11, 0.0, 1.0);
  float individualTurn = sin(aMotion.x * 1.23 + uTime * 6.20
    + dot(aRoot.xz, vec2(0.21, -0.17)));
  vec2 crossWind = vec2(-windDirection.y, windDirection.x);
  vec2 chaoticWindDirection = normalize(windDirection
    + crossWind * (chaosA * 1.06 + individualTurn * 0.52) * extremeWind
    + radial * (chaosB * 0.46 + individualTurn * 0.26) * extremeWind);
  float wind = mix(0.11, 0.085, secondStudy)
    + gust * mix(0.48, 0.37, secondStudy)
    + clumpBreath * mix(0.10, 0.075, secondStudy)
    + secondFront * 0.045;
  wind += sin(uTime * 2.20 + aMotion.z) * 0.008
    + sin(uTime * 3.10 + aMotion.z * 0.63) * 0.004;
  wind *= mix(1.0, 0.58 + chaosPulse * 1.04, extremeWind);
  wind = clamp(wind * uWindScale, 0.05, 2.10);

  float curve = t * t;
  float arch = pow(t, 1.38);
  float tip = pow(t, 2.15);
  float taper = pow(max(1.0 - t, 0.0), 0.66);
  float lean = aMotion.w;
  vec2 bendDirection = normalize(radial * (mix(1.22, 1.58, secondStudy) - wind * mix(0.34, 0.24, secondStudy))
    + chaoticWindDirection * (mix(0.06, 0.04, secondStudy) + wind * mix(0.46, 0.34, secondStudy))
    + downhill * slopeAmount * 0.11);
  float curlAngle = sin(aMotion.x * 1.37) * 0.22 * arch
    + sin(aMotion.x * 0.71) * 0.06 * tip;
  float curlCos = cos(curlAngle);
  float curlSin = sin(curlAngle);
  vec2 curveDirection = vec2(
    bendDirection.x * curlCos - bendDirection.y * curlSin,
    bendDirection.x * curlSin + bendDirection.y * curlCos
  );
  vec2 rippleDirection = vec2(-chaoticWindDirection.y, chaoticWindDirection.x);
  float bladeFlutter = sin(aMotion.x * 1.71 + uTime * 5.40 + t * 3.2)
    + sin(aMotion.x * 0.83 - uTime * 7.10 + t * 5.1) * 0.46;
  float ripple = sin(aMotion.x + uTime * 1.74 + t * 2.7) * 0.006 * height
    + bladeFlutter * extremeWind * height * (0.020 + gust * 0.028);

  float naturalReach = height * (0.050 * t + lean * mix(0.62, 0.72, secondStudy) * arch);
  float gustReach = height * wind * (
    0.12 + gust * 0.10 + peakGust * 0.18
    + extremeWind * (0.09 + gust * 0.16 + peakGust * 0.22)
  ) * curve * mix(1.0, 0.78, secondStudy);
  vec3 world = aRoot;
  world.y += terrainY;
  // Both vegetation layers emerge from the hidden terrain normal before
  // gravity and wind bend them across the surface.
  world.xz += terrainNormal.xz * height * t * (0.30 - arch * 0.08);
  world.xz += curveDirection * naturalReach;
  world.xz += chaoticWindDirection * gustReach;
  world.xz += rippleDirection * ripple * tip;
  float verticalLift = max(0.018,
    1.0 - lean * mix(0.58, 0.76, secondStudy) * arch
      - wind * mix(0.16, 0.11, secondStudy) * tip
      - peakGust * mix(0.42, 0.30, secondStudy) * tip
      - extremeWind * (0.28 + gust * 0.20 + peakGust * 0.38) * tip
      - extremeWind * abs(chaosB) * 0.14 * tip
  );
  world.y += height * t * verticalLift * terrainNormal.y;
  world.xz += bladeSide * side * width * taper;

  vec2 horizontalTangent = curveDirection * (lean * 1.02 + 0.08)
    + chaoticWindDirection * (wind * (0.36 + gust * 0.14) + peakGust * 0.42
      + extremeWind * (0.34 + gust * 0.38 + peakGust * 0.62))
    + rippleDirection * chaosC * extremeWind * 0.38;
  vec3 tangent = normalize(vec3(
    horizontalTangent.x * arch + terrainNormal.x * (1.0 - arch) * 0.34,
    max(0.018, 1.0 - lean * 0.70 * arch - wind * 0.28 * tip - peakGust * 0.48 * tip
      - extremeWind * (0.34 + peakGust * 0.44) * tip)
      * terrainNormal.y,
    horizontalTangent.y * arch + terrainNormal.z * (1.0 - arch) * 0.34
  ));
  vNormal = normalize(cross(vec3(bladeSide.x, 0.0, bladeSide.y), tangent));
  vWorld = world;
  vT = t;
  vShade = aMotion.y;
  vGust = gust * 0.78 + wind * 0.22;
  gl_Position = uVP * vec4(world, 1.0);
}`,j=`#version 300 es
precision highp float;
layout(location=0) in vec2 aTerrainUV;
uniform sampler2D uTerrain;
uniform float uTerrainDepth;
out vec2 vTerrainUV;
out float vTerrainLevel;

float terrainShape(vec2 uv) {
  vec3 sampleColor = textureLod(uTerrain, clamp(uv, 0.0, 1.0), 4.0).rgb;
  float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
  return smoothstep(0.19, 0.76, luminance);
}

void main() {
  // Match object-fit: cover for the 367x652 authored map inside the
  // 832x1492 study frame. Only the tiny symmetric horizontal excess is cut.
  vTerrainUV = vec2(mix(0.00466, 0.99534, aTerrainUV.x), aTerrainUV.y);
  vTerrainLevel = terrainShape(vTerrainUV);

  // This is real height-field deformation of the tessellated terrain mesh.
  // 0.0 is planar, 2.0 is the authored relief, and 4.0 is twice that relief.
  float depthInput = max(uTerrainDepth * 0.5, 0.0);
  float authoredDepth = depthInput <= 1.0
    ? pow(depthInput, 1.55)
    : 1.0 + pow(depthInput - 1.0, 1.15) * 4.5;
  float height = (vTerrainLevel - 0.5) * authoredDepth;
  vec2 clip = aTerrainUV * 2.0 - 1.0;

  // A restrained oblique projection exposes the vertical extrusion while
  // preserving the authored map's screen-space composition.
  clip += vec2(-0.020, 0.085) * height;
  float perspectiveW = 1.0 - height * 0.075;
  gl_Position = vec4(clip, clamp(-height * 0.30, -0.9, 0.9), perspectiveW);
}`,M=`#version 300 es
precision highp float;
in vec2 vTerrainUV;
in float vTerrainLevel;
uniform sampler2D uTerrain;
uniform sampler2D uTerrainVisual;
uniform float uTerrainDepth;
out vec4 outColor;

float terrainShape(vec2 uv) {
  vec3 sampleColor = texture(uTerrain, clamp(uv, 0.0, 1.0)).rgb;
  float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
  return smoothstep(0.19, 0.76, luminance);
}

void main() {
  vec3 mapColor = texture(uTerrainVisual, vTerrainUV).rgb;
  ivec2 terrainSize = textureSize(uTerrain, 0);
  vec2 texel = 1.0 / vec2(max(terrainSize, ivec2(1)));
  float level = vTerrainLevel;
  float levelX = terrainShape(vTerrainUV + vec2(texel.x * 2.0, 0.0));
  float levelY = terrainShape(vTerrainUV + vec2(0.0, texel.y * 2.0));
  vec2 gradient = vec2(levelX - level, levelY - level) / max(texel * 2.0, vec2(0.0001));
  float depthInput = max(uTerrainDepth * 0.5, 0.0);
  float authoredDepth = depthInput <= 1.0
    ? pow(depthInput, 1.55)
    : 1.0 + pow(depthInput - 1.0, 1.15) * 4.5;
  vec3 normal = normalize(vec3(-gradient.x * 0.020 * authoredDepth, 1.0,
    -gradient.y * 0.020 * authoredDepth));
  vec3 sun = normalize(vec3(-0.54, 0.78, 0.32));
  float direct = max(dot(normal, sun), 0.0);

  // Terrain Depth never fades or recolors the texture. It only changes mesh
  // height and the physical normal produced by that height. A flat mesh has a
  // neutral multiplier of exactly 1.0; raised slopes receive real relief light.
  float flatDirect = sun.y;
  float reliefLight = 1.0 + (direct - flatDirect) * (0.46 + authoredDepth * 0.10);
  vec3 color = mapColor * clamp(reliefLight, 0.72, 1.28);
  outColor = vec4(color, 1.0);
}`,N=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vT;
in float vShade;
in float vGust;
uniform vec3 uCamera;
uniform float uStudy;
uniform sampler2D uReferenceColorField;
uniform sampler2D uGeneratedGradientField;
uniform vec2 uResolution;
out vec4 outColor;

void main() {
  float secondStudy = step(0.5, uStudy);
  vec3 normal = normalize(gl_FrontFacing ? vNormal : -vNormal);
  vec3 sun = normalize(vec3(-0.54, 0.78, 0.32));
  vec3 view = normalize(uCamera - vWorld);
  vec3 halfDirection = normalize(sun + view);
  float direct = max(dot(normal, sun), 0.0);
  float translucent = pow(max(dot(-normal, sun), 0.0), 1.2);
  float specular = pow(max(dot(normal, halfDirection), 0.0), 28.0);
  float silverEdge = pow(1.0 - abs(dot(normal, view)), 7.0);

  // Palette sampled from the target half of the pixel comparison:
  // #192818, #2e3e26, #384a3a, #62734d, #76863d, #a0ae55,
  // #a1ac74, #afb884, #c6d098.
  vec3 root = vec3(0.0980, 0.1569, 0.0941);
  vec3 shadowBlade = vec3(0.1804, 0.2431, 0.1490);
  vec3 coolBlade = vec3(0.2196, 0.2902, 0.2275);
  vec3 naturalBlade = vec3(0.4314, 0.5216, 0.2588);
  vec3 freshBlade = vec3(0.5765, 0.6549, 0.2510);
  vec3 oliveBlade = vec3(0.4784, 0.5373, 0.2627);
  vec3 grayBlade = vec3(0.6863, 0.7412, 0.5569);
  vec3 strawBlade = vec3(0.7608, 0.7529, 0.5216);
  vec3 paleBlade = vec3(0.8549, 0.8941, 0.7137);
  vec3 silver = vec3(0.9608, 0.9765, 0.9098);

  float accentPlant = step(2.0, vShade);
  float flattened = step(1.0, vShade) * (1.0 - accentPlant);
  float shade = fract(vShade);
  float strandFlash = smoothstep(0.72, 0.97, fract(shade * 29.73));
  vec3 color = shade < 0.14 ? coolBlade
    : (shade < 0.32 ? naturalBlade
    : (shade < 0.52 ? freshBlade
    : (shade < 0.68 ? oliveBlade
    : (shade < 0.84 ? grayBlade : strawBlade))));
  float dryFamily = smoothstep(0.60, 0.93, shade);
  vec3 weathered = fract(shade * 13.71) < 0.52 ? strawBlade : grayBlade;
  color = mix(color, weathered, dryFamily * 0.74);
  // Study 02 keeps the same families but pulls their base values toward the
  // quieter olive/sage character of the second recording. Sunlight can still
  // reveal pale strands later without turning the whole cushion lime.
  float familyLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  vec3 studyTwoMuted = mix(
    vec3(0.185, 0.255, 0.155),
    vec3(0.625, 0.660, 0.455),
    smoothstep(0.10, 0.72, familyLuma)
  );
  color = mix(color, studyTwoMuted, secondStudy * 0.24);
  // Trough blades stay cool and dark, but retain the same separated strand
  // shading as the lit mounds instead of fading into a pale floor-like mat.
  color = mix(color, mix(shadowBlade, coolBlade, 0.62),
    flattened * (0.34 + dryFamily * 0.16));
  color *= mix(0.82, 1.12, fract(shade * 7.31));
  vec3 accentRoot = vec3(0.2784, 0.3216, 0.0471);
  vec3 accentLeaf = mix(
    vec3(0.6196, 0.6902, 0.0235),
    vec3(0.8706, 0.8549, 0.0745),
    shade
  );
  color = mix(color, accentLeaf, accentPlant);
  vec3 rootColor = mix(root, accentRoot, accentPlant);
  color = mix(rootColor, color, smoothstep(0.05, 0.44, vT));
  color = mix(color, shadowBlade, (1.0 - smoothstep(0.03, 0.26, vT)) * 0.20);
  float sunWash = smoothstep(0.48, 0.96, direct) * smoothstep(0.44, 1.0, vT);
  color = mix(color, paleBlade,
    sunWash * (0.25 + flattened * 0.06) * mix(1.0, 0.76, secondStudy));
  float illumination = 0.70 + direct * 0.72 + translucent * 0.18 + vGust * 0.016;
  color *= illumination;
  color += paleBlade * silverEdge * (0.080 + vT * 0.185)
    * mix(1.0, 0.82, secondStudy);
  color += silver * strandFlash * direct * 0.48 * smoothstep(0.16, 1.0, vT)
    * mix(1.0, 0.76, secondStudy);
  color += silver * specular * (1.10 + vGust * 0.36) * smoothstep(0.20, 1.0, vT)
    * mix(1.0, 0.78, secondStudy);
  color *= mix(1.0, 1.06, smoothstep(0.16, 0.78, vT));

  // Subtle screen-space color inheritance from the blurred real reference.
  // The renderer retains its high-frequency blade lighting and specular detail.
  vec2 fieldUV = clamp(gl_FragCoord.xy / uResolution, 0.0, 1.0);
  vec3 referenceField = texture(uReferenceColorField, fieldUV).rgb;
  float referenceLuma = dot(referenceField, vec3(0.2126, 0.7152, 0.0722));
  float sourceLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  vec3 referenceChroma = referenceField / max(referenceLuma, 0.055);
  float spatialLuma = mix(sourceLuma, referenceLuma, 0.28);
  vec3 spatialTint = referenceChroma * spatialLuma;
  color = mix(color, spatialTint, mix(0.34, 0.40, secondStudy));

  // Gentle value refinement only: lift midtones and reflected sunlight while
  // preserving the restrained reference-field palette and existing shading.
  float tintedLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float midtoneMask = smoothstep(0.14, 0.34, tintedLuma)
    * (1.0 - smoothstep(0.62, 0.84, tintedLuma));
  color *= 1.0 + midtoneMask * 0.075;

  float sunlitBlade = smoothstep(0.42, 0.92, direct)
    * smoothstep(0.25, 1.0, vT);
  float reflectedFlash = clamp(
    0.16 + silverEdge * 0.38 + strandFlash * 0.24 + specular * 0.45,
    0.0, 1.0
  );
  color += vec3(0.043, 0.052, 0.046) * sunlitBlade * reflectedFlash;

  float lowerHalf = 1.0 - smoothstep(0.38, 0.76, fieldUV.y);
  float strawVariation = clamp(lowerHalf * 0.55 + flattened * 0.70, 0.0, 1.0)
    * dryFamily * smoothstep(0.30, 1.0, vT);
  color = mix(color, vec3(0.67, 0.63, 0.50),
    strawVariation * mix(0.085, 0.15, secondStudy));

  float refinedLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float shadowLift = 1.0 - smoothstep(0.11, 0.29, refinedLuma);
  color += vec3(0.016, 0.022, 0.018) * shadowLift;

  // The supplied blurred comparison provides an explicit low-frequency
  // correction at every screen coordinate. Apply most of that measured
  // difference while retaining the blade-scale lighting variation.
  vec3 generatedGradientField = texture(uGeneratedGradientField, fieldUV).rgb;
  float generatedGradientLuma = dot(
    generatedGradientField, vec3(0.2126, 0.7152, 0.0722)
  );
  vec3 generatedGradientChroma = generatedGradientField
    / max(generatedGradientLuma, 0.055);
  vec3 chromaRatio = clamp(
    referenceChroma / max(generatedGradientChroma, vec3(0.16)),
    vec3(0.78), vec3(1.22)
  );
  color *= mix(vec3(1.0), chromaRatio, 0.24);

  float comparisonLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float spatialValueOffset = (referenceLuma - generatedGradientLuma) * 0.72;
  float correctedLuma = clamp(comparisonLuma + spatialValueOffset, 0.052, 0.965);
  color *= correctedLuma / max(comparisonLuma, 0.032);
  color = min(color, silver);
  // Absolute simulator shadow floor requested by the study: no rendered grass
  // fragment may become darker than #001E08.
  color = max(color, vec3(0.0, 0.117647, 0.031373));
  outColor = vec4(color, 1.0);
}`,P=[[-5.55,-18.42,.92,.66,-.18,.45,.64,.86,.32,.86],[-3.46,-18.82,1.04,.72,.31,.72,.71,.94,.61,.92],[-1.17,-18.26,.88,.82,-.4,.55,.76,.79,.44,1],[.77,-18.73,1.12,.68,.24,.88,.69,.9,.74,.88],[3.02,-18.18,.91,.76,-.28,.38,.79,.82,.4,.95],[5.29,-18.61,1.04,.7,.42,.7,.65,.88,.58,.9],[-4.78,-16.06,1.16,.82,.18,.4,.68,.92,.56,.95],[-2.48,-15.72,.98,.96,-.38,.86,.72,.84,.35,1.02],[-.24,-16.31,1.25,.84,.26,.6,.8,.93,.7,.9],[2.18,-15.62,1.06,.92,-.16,.95,.66,.88,.47,1],[4.57,-16.16,1.18,.84,.34,.5,.75,.95,.65,.94],[-5.37,-13.62,1.12,.91,-.28,.76,.74,.81,.42,1.04],[-3.23,-14.08,1.27,.86,.36,.32,.67,.95,.68,.91],[-.82,-13.42,1.1,1.02,-.18,.98,.83,.89,.36,.98],[1.42,-13.93,1.31,.88,.3,.62,.7,.96,.59,1.05],[3.74,-13.36,1.08,1,-.42,.84,.78,.86,.76,.92],[5.62,-14.02,.98,.86,.22,.48,.64,.79,.48,1.02],[-4.73,-11.05,1.38,.99,.31,.88,.7,.94,.62,1.03],[-2.11,-11.52,1.17,1.12,-.36,.42,.84,.82,.34,.94],[.26,-10.87,1.44,.96,.14,1.02,.76,.97,.71,1.08],[2.88,-11.41,1.25,1.13,-.24,.6,.69,.88,.49,.96],[5.12,-10.71,1.33,.94,.39,.78,.81,.91,.66,1.01],[-5.36,-8.54,1.42,1.14,-.21,.36,.78,.86,.45,1.06],[-2.73,-8.97,1.51,1.02,.29,.91,.66,.96,.72,.98],[-.08,-8.24,1.31,1.24,-.35,.56,.88,.87,.3,1],[2.43,-8.82,1.55,1.07,.2,1.05,.74,.95,.61,1.1],[5.07,-8.18,1.41,1.18,-.32,.69,.82,.89,.51,.94],[-4.65,-5.83,1.68,1.22,.27,.82,.42,.93,.69,1.1],[-1.63,-6.31,1.48,1.36,-.41,.4,.86,.84,.38,.96],[1.13,-5.48,1.72,1.19,.18,.98,.52,.98,.58,1.16],[4.24,-6.02,1.59,1.31,-.28,.58,.73,.91,.47,1],[-5.2,-2.64,1.74,1.43,-.34,.36,.85,.87,.4,1.03],[-2.01,-3.17,2.02,1.42,.24,.86,.46,.97,.71,1.18],[1.19,-2.32,1.66,1.55,-.26,.52,.91,.9,.31,.98],[4.34,-3.03,1.88,1.34,.35,1,.78,.95,.6,1.08],[-4.53,.66,2.04,1.42,.2,.78,.58,.92,.64,1.1],[-.98,-.15,2.42,1.74,-.38,.39,.34,.98,.62,1.2],[2.75,.74,2.1,1.46,.29,.96,.66,.94,.57,1.14],[5.76,-.04,1.48,1.34,-.24,.55,.7,.78,.48,.95],[-5.02,4.16,2.13,1.63,-.29,.32,.9,.88,.43,1.04],[-1.32,3.48,2.55,1.85,.24,.84,.46,.98,.68,1.18],[2.58,4.43,2.24,1.58,-.36,.5,.94,.92,.32,1],[6.05,3.71,1.63,1.48,.31,1.02,.77,.8,.56,1.06],[-4.02,7.79,2.62,1.82,.26,.72,.94,.9,.54,1.05],[.31,7.18,2.72,1.93,-.33,.34,.88,.99,.39,1.1],[4.62,7.92,2.56,1.74,.2,.91,.96,.93,.65,1],[-1.95,-12.52,2.12,.3,-.22,.22,.98,.22,.49,.67],[3.45,-9.78,2.42,.34,.18,.91,.99,.26,.62,.71],[-3.18,-7.14,2.28,.36,-.31,.4,.97,.24,.44,.72],[1.86,-4.39,2.62,.38,.27,.78,.99,.28,.68,.66],[-2.44,-.94,2.75,.42,-.24,.28,.98,.3,.52,.7],[2.04,2.37,3.02,.45,.2,.88,.99,.33,.72,.64],[-1.06,6.02,3.32,.52,-.18,.38,.99,.34,.57,.68],[-3.92,-15.06,1.86,.42,.38,.62,.97,.34,.42,.62],[1.58,-12.04,2.42,.5,-.33,.25,.99,.36,.58,.58],[-.62,-8.68,3.04,.62,.18,.82,.98,.38,.46,.62],[3.08,-5.76,2.74,.68,-.25,.42,.99,.36,.66,.58],[-3.18,-3.02,3.12,.78,.3,.95,.98,.38,.52,.6],[.42,.38,3.82,.92,-.18,.35,.99,.38,.62,.56],[-1.68,3.72,4.58,1.05,.22,.78,.99,.39,.5,.54],[1.04,7.08,5.96,1.34,-.12,.28,.99,.39,.59,.52]],F=[[-4.82,-18.62,3.2,.82,.18,.18,.82,.95,.56,.96],[-.18,-18.34,3.46,.92,-.12,.72,.76,.99,.68,1.02],[4.78,-18.56,3.02,.78,.22,.36,.88,.94,.62,.94],[-5.24,-15.52,3.05,.94,-.24,.86,.9,.96,.58,1],[-.54,-15.84,3.92,1.02,.16,.3,.78,1,.71,1.08],[4.68,-15.36,3.22,.88,-.18,.62,.84,.97,.64,.98],[-4.16,-12.18,3.62,1.08,.28,.42,.76,.98,.54,1.04],[1.52,-12.48,4.08,1.16,-.22,.96,.88,1,.7,1.1],[5.74,-11.88,2.42,.82,.18,.26,.92,.92,.6,.94],[-5.16,-8.72,3.04,1.02,-.28,.74,.86,.96,.62,1],[-.44,-9.14,4.2,1.22,.2,.34,.8,1,.72,1.12],[4.78,-8.48,3.28,1.04,-.16,.88,.94,.98,.58,1.02],[-3.92,-5.42,3.82,1.26,.24,.28,.78,1,.56,1.08],[2.34,-5.78,4.18,1.18,-.26,.82,.9,1,.7,1.14],[6.08,-5.14,2.2,.82,.14,.48,.84,.9,.62,.96],[-5.22,-1.86,3.18,1.12,-.18,.94,.88,.97,.6,1.04],[-.22,-2.22,4.34,1.34,.22,.38,.8,1,.73,1.14],[5.02,-1.54,3.34,1.08,-.22,.68,.92,.98,.66,1.06],[-3.86,1.82,4.12,1.38,.26,.3,.82,1,.64,1.12],[2.62,2.16,4.26,1.32,-.24,.88,.9,1,.7,1.16],[6.16,1.54,2.24,.9,.16,.46,.86,.92,.58,.98],[-5.06,5.58,3.44,1.24,-.2,.78,.92,.98,.62,1.08],[-.12,5.2,4.52,1.48,.2,.34,.84,1,.74,1.18],[5.08,5.82,3.52,1.26,-.18,.94,.9,.99,.6,1.08],[-3.42,8.52,4.72,1.54,.18,.4,.86,1,.68,1.16],[3.66,8.26,4.56,1.48,-.2,.82,.94,1,.72,1.18]],I=P.filter(e=>e[7]>=.405);function L(e,t,n){let r=e.createShader(t);if(!r)throw Error(`Could not create shader`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r)||`Shader compilation failed`;throw e.deleteShader(r),Error(t)}return r}function R(e,t,n){let r=e.createProgram();if(!r)throw Error(`Could not create program`);let i=L(e,e.VERTEX_SHADER,t),a=L(e,e.FRAGMENT_SHADER,n);if(e.attachShader(r,i),e.attachShader(r,a),e.linkProgram(r),e.deleteShader(i),e.deleteShader(a),!e.getProgramParameter(r,e.LINK_STATUS))throw Error(e.getProgramInfoLog(r)||`Program linking failed`);return r}function z(e){let t=Math.hypot(...e)||1;return[e[0]/t,e[1]/t,e[2]/t]}function B(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]}function V(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function H(e,t){let n=z([e[0]-t[0],e[1]-t[1],e[2]-t[2]]),r=z(B([0,1,0],n)),i=B(n,r);return new Float32Array([r[0],i[0],n[0],0,r[1],i[1],n[1],0,r[2],i[2],n[2],0,-V(r,e),-V(i,e),-V(n,e),1])}function U(e){let t=.1,n=1/Math.tan(Math.PI*.116),r=1/(t-48);return new Float32Array([n/e,0,0,0,0,n,0,0,0,0,(t+48)*r,-1,0,0,t*48*2*r,0])}function W(e,t){let n=new Float32Array(16);for(let r=0;r<4;r+=1)for(let i=0;i<4;i+=1)n[r*4+i]=e[i]*t[r*4]+e[4+i]*t[r*4+1]+e[8+i]*t[r*4+2]+e[12+i]*t[r*4+3];return n}function G(e,t){let n=Math.sin(e*127.1+t*311.7)*43758.5453;return n-Math.floor(n)}function K(e,t,n){let r=e.createVertexArray(),i=e.createBuffer(),a=e.createBuffer();if(!r||!i||!a)throw Error(`Grass allocation failed`);let o=new Float32Array(32);for(let e=0;e<=7;e+=1)o.set([-1,e/7,1,e/7],e*4);let s=n===`study-7401`,c=s?F:I,l=(e,t)=>e[2]*e[3]*e[7]*(e[7]<.405?.82:1)*(.68+G(t,31)*.72),u=c.reduce((e,t,n)=>e+l(t,n),0),d=c.map((e,n)=>Math.floor(t*l(e,n)/u)),f=d.reduce((e,t)=>e+t,0);for(let e=0;f<t;e=(e+1)%d.length)d[e]+=1,f+=1;let p=new Float32Array(f*11),m=0;c.forEach(([e,t,n,r,i,a,o,c,l,u,f=0],h)=>{let g=G(h,20)*Math.PI*2,_=Math.max(0,Math.min(1,(t+2)/10)),v=Math.cos(i),y=Math.sin(i),b=a+(G(h,22)-.5)*(s?2.18:3.1),x=Math.cos(b),S=Math.sin(b),C=Math.sqrt(n*r),w=+(c<.405),T=G(h,32),E=w>.5?0:+(T<(s?.18:.29)),D=w>.5?0:+(T>(s?.65:.76)),O=E>.5?s?1.1:1.22:D>.5?s?.76:.66:.94,k=E>.5?s?1.18:1.24:D>.5?s?.52:.54:.9,A=E>.5?.88:D>.5?s?1.16:1.18:1,j=O*(.82+G(h,15)*.38),M=(G(h,16)-.5)*.42-E*.16+D*.3,N=e+(G(h,17)-.5)*.42,P=t+(G(h,18)-.5)*.54;for(let e=0;e<d[h];e+=1){let e=m*11,t=G(m,1)*Math.PI*2,i=G(m,2),a=G(m,17)<.55?i**1.42*.9:i**.72,c=s?1.22:1,d=1+Math.sin(t*3+g)*.18*c+Math.sin(t*5-g*.63)*.11*c,T=Math.cos(t)*a*n*d*.96*A,O=Math.sin(t)*a*r*d*.96*(D>.5?1.08:E>.5?.92:1),F=G(m,14),I=F<.28?-1:+(F>.72),L=F<.16?-.7:F>.84?.55:0,R=T*v-O*y-S*I*n*.13+x*L*r*.08,z=T*y+O*v+x*I*n*.13+S*L*r*.08,B=Math.hypot(R,z)||1,V=R/B,H=z/B,U=w,W=U>.5?.4:s?.5:.92,K=U>.5?.18:s?.24:.36,q=Math.floor(t/(Math.PI*2)*6),J=h*13+q,Y=s?(G(J,60)-.5)*1.06:0,X=s?.86+G(J,61)*.28:1,Z=s?(G(J,62)-.5)*.3:0,Q=b+Math.sin(t*2+g)*W+Math.sin(t*5-g*.72)*K+Y,$=Math.cos(Q),ee=Math.sin(Q),te=$*.84+V*.16,ne=ee*.84+H*.16,re=+(G(m,19)<(s?.35:.27)+U*.12),ie=Math.atan2(ne,te)+(G(m,5)-.5)*(U>.5?.38:s?.48:.64)+re*(G(m,20)-.5)*1.82,ae=.82+G(m,3)**.82*.42,oe=Math.max(.72,Math.min(1.12,.9+Math.sin(t*2+g)*.12+Math.sin(t*5-g*.71)*.07)),se=G(m,13)>.93?1.14:G(m,13)<.17?.72:1,ce=+(G(m,21)<.36),le=+(a>.48&&Math.sin(t*3+g)>.42),ue=.9+(1-a)*.12+Math.max(-.13,Math.min(.13,(R*x+z*S)/C*.12)),de=(C<=1.45?C:1.45+(C-1.45)*.28)*(s?.9:.98)*ae*ue*oe*se*u*j*X*(1-_*.1)*(1-U*.24)*(1-le*.23)*(1-ce*.19)*(1-re*.06),fe=N+R,pe=P+z;f>.5&&(de*=.76);let me=.018+Math.max(0,1-a)**1.12*C*(s?.22:.36)*k*(1-U*.84)+(1-a)*.045*(1-o*.54)+G(m,12)*.018;p[e]=fe,p[e+1]=me,p[e+2]=pe,p[e+3]=de,p[e+4]=f>.5?.011+G(m,4)*.009:s?.006+G(m,4)*.0052:(.0048+G(m,4)*.0047)*(1+ce*.1),p[e+5]=ie,p[e+6]=ie+Math.PI*.5+(G(m,6)-.5)*.62,p[e+7]=G(m,7)*Math.PI*2;let he=G(m,11),ge=Math.max(.06,Math.min(.98,l*.68+G(m,8)*.28+_*.08+(he>.72?.24:0)-(he<.11?.13:0)));p[e+8]=f>.5?2+ge:ge+U,p[e+9]=g,p[e+10]=Math.max(.26,Math.min(.98,.14+o*.48+_*.03+a*.13+M+Math.sin(t*2+g)*.075+Math.sin(t*5-g)*.035+Z+U*.46+le*.16-ce*.07+re*.07+(G(m,9)-.5)*.32)),m+=1}}),e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,i),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,p,e.STATIC_DRAW);let h=11*Float32Array.BYTES_PER_ELEMENT;for(let[t,n,r]of[[1,3,0],[2,4,3],[3,4,7]])e.enableVertexAttribArray(t),e.vertexAttribPointer(t,n,e.FLOAT,!1,h,r*4),e.vertexAttribDivisor(t,1);return e.bindVertexArray(null),{vao:r,bladeBuffer:i,instanceBuffer:a,vertices:16,count:f}}function q(e,t,n){let r=e.createVertexArray(),i=e.createBuffer(),a=e.createBuffer();if(!r||!i||!a)throw Error(`Base grass allocation failed`);let o=new Float32Array(24);for(let e=0;e<=5;e+=1)o.set([-1,e/5,1,e/5],e*4);let s=16.8,c=Math.max(1,Math.round(Math.sqrt(t*s/35))),l=Math.max(1,Math.ceil(t/c)),u=c*l,d=new Float32Array(u*11),f=n===`study-7401`,p=0;for(let e=0;e<l;e+=1)for(let t=0;t<c;t+=1){let n=p*11,r=-8.4+(t+.16+G(p,41)*.68)/c*s,i=-23+(e+.16+G(p,42)*.68)/l*35,a=Math.floor((r+8.4)/1.22),o=Math.floor((i+23)/1.36)*19+a,u=G(o,43)*Math.PI*2,m=G(o,44),h=u+Math.sin(r*.24+i*.11)*.38+Math.cos(i*.19-r*.07)*.24,g=+(G(p,45)<.17+m*.16),_=h+(G(p,46)-.5)*(f?.52:.78)+g*(G(p,47)-.5)*1.72,v=m>.72?.68:m<.2?1.08:.88,y=(f?.48+G(p,48)*.42:.42+G(p,48)*.48)*v,b=Math.max(.04,Math.min(.94,(f?.17:.09)+G(p,49)*.54+(m<.18?.18:0)));d[n]=r,d[n+1]=.01+G(p,50)*.014,d[n+2]=i,d[n+3]=y,d[n+4]=f?.0074+G(p,51)*.005:.0046+G(p,51)*.0042,d[n+5]=_,d[n+6]=_+Math.PI*.5+(G(p,52)-.5)*.48,d[n+7]=G(p,53)*Math.PI*2,d[n+8]=1+b,d[n+9]=u,d[n+10]=Math.max(.28,Math.min(.98,(f?.68:.48)+m*(f?.24:.28)+(G(p,54)-.5)*.2+g*.08)),p+=1}e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,i),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,a),e.bufferData(e.ARRAY_BUFFER,d,e.STATIC_DRAW);let m=11*Float32Array.BYTES_PER_ELEMENT;for(let[t,n,r]of[[1,3,0],[2,4,3],[3,4,7]])e.enableVertexAttribArray(t),e.vertexAttribPointer(t,n,e.FLOAT,!1,m,r*4),e.vertexAttribDivisor(t,1);return e.bindVertexArray(null),{vao:r,bladeBuffer:i,instanceBuffer:a,vertices:12,count:u}}function J(e){let t=e.createVertexArray(),n=e.createBuffer(),r=e.createBuffer();if(!t||!n||!r)throw Error(`Terrain geometry allocation failed`);let i=new Float32Array(25425*2),a=0;for(let e=0;e<=224;e+=1)for(let t=0;t<=112;t+=1)i[a]=t/112,i[a+1]=e/224,a+=2;let o=new Uint32Array(25088*6),s=0;for(let e=0;e<224;e+=1)for(let t=0;t<112;t+=1){let n=e*113+t,r=n+1,i=n+112+1,a=i+1;o.set([n,i,r,r,i,a],s),s+=6}return e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,n),e.bufferData(e.ARRAY_BUFFER,i,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,r),e.bufferData(e.ELEMENT_ARRAY_BUFFER,o,e.STATIC_DRAW),e.bindVertexArray(null),{vao:t,vertexBuffer:n,indexBuffer:r,count:o.length}}function Y(e,t){let n=e.createTexture();if(!n)throw Error(`Terrain texture allocation failed`);e.bindTexture(e.TEXTURE_2D,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([132,111,78,255]));let r=new Image;return r.decoding=`async`,r.onload=()=>{e.bindTexture(e.TEXTURE_2D,n),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1)},r.src=t,{texture:n,image:r}}function X(e,t,n){let r=e.createTexture();if(!r)throw Error(`Color field texture allocation failed`);e.bindTexture(e.TEXTURE_2D,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array(n)),e.generateMipmap(e.TEXTURE_2D);let i=new Image;return i.decoding=`async`,i.onload=()=>{e.bindTexture(e.TEXTURE_2D,r),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i),e.generateMipmap(e.TEXTURE_2D),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1)},i.src=t,{texture:r,image:i}}function Z(e,t,n,r,i){let a=e.getContext(`webgl2`,{antialias:!0,alpha:!1,depth:!0,powerPreference:`high-performance`});if(!a)return;let o=i===`study-7401`,s=[0,10.2,8],c=R(a,A,N),l=R(a,j,M),u=matchMedia(`(max-width:700px)`).matches,d=q(a,u?o?16e4:112e3:o?264e3:188e3,i),f=K(a,u?o?94e3:82e3:o?154e3:136e3,i),p=J(a),m=Y(a,o?`/IMG_7401-terrain.png`:`/topography-terrain.png`),h=X(a,`/topographical-map.png`,[145,106,74,255]),g=X(a,o?`/IMG_7401-color-field.png`:`/reference-color-field-v2.png`,o?[119,148,62,255]:[118,132,75,255]),_=X(a,o?`/IMG_7401-color-field.png`:`/generated-gradient-field.png`,o?[119,148,62,255]:[107,123,68,255]),v=H(s,[0,.3,-2.35]),x=a.getUniformLocation(c,`uVP`),S=a.getUniformLocation(c,`uTerrain`),C=a.getUniformLocation(c,`uReferenceColorField`),w=a.getUniformLocation(c,`uGeneratedGradientField`),T=a.getUniformLocation(c,`uResolution`),E=a.getUniformLocation(c,`uTime`),D=a.getUniformLocation(c,`uWindScale`),O=a.getUniformLocation(c,`uBladeLengthScale`),k=a.getUniformLocation(c,`uTerrainDepth`),P=a.getUniformLocation(c,`uStudy`),F=a.getUniformLocation(c,`uCamera`),I=a.getUniformLocation(l,`uTerrain`),L=a.getUniformLocation(l,`uTerrainVisual`),z=a.getUniformLocation(l,`uTerrainDepth`);if(!x||!S||!C||!w||!T||!E||!D||!O||!k||!P||!F||!I||!L||!z)throw Error(`Missing uniforms`);let B=0,V=0,G=performance.now(),Z=i=>{let u=Math.min(Math.max((i-G)/1e3,0),.05);G=i;let A=t.current,j=.45+Math.max(0,Math.min(1,(A-y)/(b-y)))*4.75;V+=u*j;let M=e.getBoundingClientRect(),N=Math.min(devicePixelRatio||1,2.25),R=Math.max(1,Math.round(M.width*N)),H=Math.max(1,Math.round(M.height*N));(e.width!==R||e.height!==H)&&(e.width=R,e.height=H),a.viewport(0,0,R,H);let K=W(U(R/H),v);a.enable(a.DEPTH_TEST),a.depthFunc(a.LEQUAL),a.disable(a.CULL_FACE),a.clearColor(0,.117647,.031373,1),a.clear(a.COLOR_BUFFER_BIT|a.DEPTH_BUFFER_BIT),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,m.texture),a.activeTexture(a.TEXTURE1),a.bindTexture(a.TEXTURE_2D,g.texture),a.activeTexture(a.TEXTURE2),a.bindTexture(a.TEXTURE_2D,_.texture),a.activeTexture(a.TEXTURE3),a.bindTexture(a.TEXTURE_2D,h.texture);let q=r.current;if(!q.showGrass){a.useProgram(l),a.uniform1i(I,0),a.uniform1i(L,3),a.uniform1f(z,q.depth),a.bindVertexArray(p.vao),a.drawElements(a.TRIANGLES,p.count,a.UNSIGNED_INT,0),B=requestAnimationFrame(Z);return}a.useProgram(c),a.uniformMatrix4fv(x,!1,K),a.uniform1i(S,0),a.uniform1i(C,1),a.uniform1i(w,2),a.uniform2f(T,R,H),a.uniform1f(E,V),a.uniform1f(D,A),a.uniform1f(k,q.depth),a.uniform1f(P,+!!o),a.uniform3fv(F,s);let J=n.current;a.bindVertexArray(d.vao),a.uniform1f(O,J.overall*J.base),a.drawArraysInstanced(a.TRIANGLE_STRIP,0,d.vertices,d.count),a.bindVertexArray(f.vao),a.uniform1f(O,J.overall*J.mounds),a.drawArraysInstanced(a.TRIANGLE_STRIP,0,f.vertices,f.count),B=requestAnimationFrame(Z)};return B=requestAnimationFrame(Z),()=>{cancelAnimationFrame(B),a.deleteBuffer(d.bladeBuffer),a.deleteBuffer(d.instanceBuffer),a.deleteVertexArray(d.vao),a.deleteBuffer(f.bladeBuffer),a.deleteBuffer(f.instanceBuffer),a.deleteVertexArray(f.vao),a.deleteBuffer(p.vertexBuffer),a.deleteBuffer(p.indexBuffer),a.deleteVertexArray(p.vao),m.image.onload=null,a.deleteTexture(m.texture),h.image.onload=null,a.deleteTexture(h.texture),g.image.onload=null,a.deleteTexture(g.texture),_.image.onload=null,a.deleteTexture(_.texture),a.deleteProgram(c),a.deleteProgram(l)}}function Q(){let e=(0,m.useRef)(new Map),t=(0,m.useRef)(new Map),n=(0,m.useRef)({pointerId:-1,index:-1,startX:0,startY:0,axis:`pending`,samples:[]}),r=(0,m.useRef)({index:-1,distance:0,velocity:0,lastTime:0,timer:null}),i=(0,m.useRef)({pointerId:-1,startX:0,startY:0,originX:.5,originY:.5,frame:null,axis:`pending`,samples:[]}),a=(0,m.useRef)(null),o=(0,m.useRef)(null),s=(0,m.useRef)(null),c=(0,m.useRef)(null),u=(0,m.useRef)(null),d=(0,m.useRef)(0),f=(0,m.useRef)(`idle`),[p,g]=(0,m.useState)(`idle`),[y,b]=(0,m.useState)(null),[x,S]=(0,m.useState)(null),[C,A]=(0,m.useState)(0),[j,M]=(0,m.useState)([]),[N,P]=(0,m.useState)(null),[F,I]=(0,m.useState)(0),L=_(0,T),R=_(0,T),z=_(1,T),B=_(1,T),V=_(14,T),H=_(1,T),U=e=>{f.current=e,g(e)},W=(e,t=14)=>({x:e.left,y:e.top,width:e.width,height:e.height,radius:t}),G=()=>{let e=document.querySelector(`.recording-grid-stage`);if(e)return W(e.getBoundingClientRect(),12);let t=Math.min(window.innerHeight-72,920),n=832/1492*t;return{x:(window.innerWidth-n)/2,y:(window.innerHeight-t)/2,width:n,height:t,radius:12}},K=()=>({x:L.get(),y:R.get(),width:z.get(),height:B.get(),radius:V.get()}),q=e=>{L.jump(e.x),R.jump(e.y),z.jump(e.width),B.jump(e.height),V.jump(e.radius),H.jump(1)},J=(e,t)=>{let n=K(),r=1e3/60;L.setWithVelocity(n.x-e/60,n.x,r),R.setWithVelocity(n.y-t/60,n.y,r)},Y=e=>{L.set(e.x),R.set(e.y),z.set(e.width),B.set(e.height),V.set(e.radius),H.set(1)},X=t=>{let n=e.current.get(t);return n?W(n.getBoundingClientRect(),14):null},Z=e=>{M(t=>t.filter(t=>t.id!==e))},Q=(e=0,t=0)=>{let n=o.current,r=s.current;if(n===null||r===null||f.current===`idle`)return!1;let i=X(r)??a.current;if(!i)return!1;let l=u.current?.getBoundingClientRect(),p=H.get(),m=l?W(l,V.get()*p):K(),h={id:++d.current,recording:n,index:r,from:m,to:i,velocityX:e||L.getVelocity(),velocityY:t||R.getVelocity(),velocityWidth:z.getVelocity(),velocityHeight:B.getVelocity(),velocityRadius:V.getVelocity(),playbackTime:c.current?.currentTime??0,frameDataUrl:O(c.current)};return M(e=>[...e,h]),o.current=null,s.current=null,a.current=null,U(`idle`),b(null),S(null),!0},$=(e,n)=>{if(j.some(e=>e.index===n))return;if(s.current===n){Q();return}s.current!==null&&Q();let r=X(n);r&&(a.current=r,o.current=e,s.current=n,S(n),A(t.current.get(n)?.currentTime??0),b(e),q(r),U(`opening`),requestAnimationFrame(()=>{s.current===n&&Y(G())}))},ee=(e=0,t=0)=>{f.current!==`idle`&&Q(e,t)},te=(e=0,t=0)=>{U(`opening`),J(e,t),Y(G())},ne=()=>{if(f.current!==`opening`||s.current===null)return;let e=G();Math.abs(L.get()-e.x)<1&&Math.abs(R.get()-e.y)<1&&Math.abs(z.get()-e.width)<1&&Math.abs(B.get()-e.height)<1&&U(`open`)};h(L,`animationComplete`,ne),h(z,`animationComplete`,ne),(0,m.useEffect)(()=>{let e=()=>{(f.current===`open`||f.current===`opening`)&&Y(G())},t=e=>{e.key===`Escape`&&ee()};return window.addEventListener(`resize`,e),window.addEventListener(`keydown`,t),()=>{window.removeEventListener(`resize`,e),window.removeEventListener(`keydown`,t)}}),(0,m.useEffect)(()=>()=>{r.current.timer&&clearTimeout(r.current.timer)},[]);let re=(e,t)=>{t.button===0&&(n.current={pointerId:t.pointerId,index:e,startX:t.clientX,startY:t.clientY,axis:`pending`,samples:[{x:t.clientX,y:t.clientY,time:performance.now()}]},I(0),t.currentTarget.setPointerCapture(t.pointerId))},ie=(e,t)=>{let r=n.current;if(r.pointerId!==t.pointerId||r.index!==e)return;let i=t.clientX-r.startX,a=t.clientY-r.startY,o=performance.now();for(r.samples.push({x:t.clientX,y:t.clientY,time:o});r.samples.length>2&&o-r.samples[0].time>100;)r.samples.shift();if(a>=5?r.axis=`vertical`:r.axis===`pending`&&Math.abs(i)>=10&&(r.axis=`horizontal`),r.axis!==`vertical`)return;t.preventDefault();let s=D(a,window.innerHeight);P({index:e,deltaX:i*.22,deltaY:s,progress:E(a/Math.max(window.innerHeight*.28,1))})},ae=(e,t,r,i=!1)=>{let a=n.current;if(a.pointerId!==r.pointerId||a.index!==t)return;r.currentTarget.hasPointerCapture(r.pointerId)&&r.currentTarget.releasePointerCapture(r.pointerId);let o=a.axis===`vertical`,s=a.axis===`horizontal`,c=a.samples[0],l=a.samples[a.samples.length-1],u=Math.max((l?.time??0)-(c?.time??0),1),d=c&&l?(l.y-c.y)/u*1e3:0;n.current.pointerId=-1,n.current.index=-1,n.current.axis=`pending`,n.current.samples=[],o&&I(d),P(null),!i&&!o&&!s&&$(e,t)},oe=e=>{if(f.current!==`idle`)return;let t=e.target.closest(`.recording-grid-item`);if(!t)return;let n=Number(t.dataset.gridIndex);if(!Number.isFinite(n))return;let i=e.deltaMode===WheelEvent.DOM_DELTA_LINE?16:e.deltaMode===WheelEvent.DOM_DELTA_PAGE?window.innerHeight:1,a=-e.deltaY*i,o=r.current,s=performance.now();if(o.index<0||s-o.lastTime>140){if(a<=0||Math.abs(e.deltaY)<Math.abs(e.deltaX))return;o.index=n,o.distance=0,o.velocity=0,I(0)}if(o.index!==n)return;e.preventDefault();let c=o.lastTime>0?Math.max(s-o.lastTime,8):16;o.lastTime=s,o.velocity=a/c*1e3,o.distance=Math.max(0,o.distance+a),P({index:n,deltaX:0,deltaY:D(o.distance,window.innerHeight),progress:E(o.distance/Math.max(window.innerHeight*.28,1))}),o.timer&&clearTimeout(o.timer),o.timer=setTimeout(()=>{I(o.velocity),P(null),o.index=-1,o.distance=0,o.velocity=0,o.lastTime=0,o.timer=null},95)},se=e=>{if(e.button!==0||f.current===`closing`)return;let t=K();i.current={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,originX:E((e.clientX-t.x)/Math.max(t.width,1)),originY:E((e.clientY-t.y)/Math.max(t.height,1)),frame:t,axis:`pending`,samples:[{x:e.clientX,y:e.clientY,time:performance.now()}]},e.currentTarget.setPointerCapture(e.pointerId)},ce=e=>{let t=i.current;if(t.pointerId!==e.pointerId||!t.frame)return;let n=e.clientX-t.startX,r=e.clientY-t.startY,a=performance.now();for(t.samples.push({x:e.clientX,y:e.clientY,time:a});t.samples.length>2&&a-t.samples[0].time>100;)t.samples.shift();if(r>=5?t.axis=`vertical`:t.axis===`pending`&&Math.abs(n)>=10&&(t.axis=`horizontal`),t.axis!==`vertical`)return;f.current!==`dragging`&&U(`dragging`);let o=E(Math.max(0,r)/Math.max(window.innerHeight*.46,1)),s=D(r,window.innerHeight),c=1-o*.14,l=t.frame.width*c,u=t.frame.height*c;L.jump(t.frame.x+n*.34+(t.frame.width-l)*t.originX),R.jump(t.frame.y+s+(t.frame.height-u)*t.originY),H.jump(c),V.jump(12+o*8)},le=(e,t=!1)=>{let n=i.current;if(n.pointerId!==e.pointerId)return;e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId);let r=n.samples,a=r[0],o=r[r.length-1],s=Math.max((o?.time??0)-(a?.time??0),1),c=a&&o?(o.x-a.x)/s*1e3:0,l=a&&o?(o.y-a.y)/s*1e3:0,u=(o?.y??n.startY)-n.startY,d=E((E(u/Math.max(window.innerHeight*.46,1))-.6)/.25);l*=1+d*.45;let f=!t&&n.axis===`vertical`&&(u>window.innerHeight*.16||l>560),p=!t&&n.axis===`pending`;i.current.pointerId=-1,i.current.frame=null,i.current.samples=[],i.current.axis=`pending`,p||f?ee(c*.34,Math.max(l,0)):te(c*.2,l*.25)},ue=e=>{if(!N)return{x:0,y:0,scale:1,zIndex:0};let t=Math.abs(e-N.index);if(e===N.index){let e=.058*(1-Math.exp(-N.deltaY/110));return{x:N.deltaX,y:N.deltaY,scale:1-e,zIndex:6}}let n=Math.exp(-t*.88)*N.progress;return{x:0,y:N.deltaY*n*.13,scale:1-n*.014,zIndex:Math.max(0,5-t)}},de=new Set(j.map(e=>e.index));return x!==null&&de.add(x),(0,v.jsxs)(`section`,{className:`recording-grid-experience`,"aria-label":`Six original grass study recordings`,children:[(0,v.jsx)(`div`,{className:`grass-stage recording-grid-stage`,onWheel:oe,children:w.map((n,r)=>{let i=ue(r),a=de.has(r);return(0,v.jsxs)(l.button,{ref:t=>{t?e.current.set(r,t):e.current.delete(r)},className:`recording-grid-item${a?` is-flight-source`:``}`,type:`button`,"data-grid-index":r,"aria-label":`Open grass study recording IMG_${n}`,animate:i,transition:N?{duration:0}:{x:{type:`spring`,stiffness:420,damping:25,mass:.82},y:{type:`spring`,stiffness:420,damping:25,mass:.82,velocity:F},scale:{type:`spring`,stiffness:420,damping:25,mass:.82}},onPointerDown:e=>re(r,e),onPointerMove:e=>ie(r,e),onPointerUp:e=>ae(n,r,e),onPointerCancel:e=>ae(n,r,e,!0),onClick:e=>{e.detail===0&&$(n,r)},"aria-disabled":j.some(e=>e.index===r),children:[(0,v.jsx)(`video`,{ref:e=>{e?t.current.set(r,e):t.current.delete(r)},className:`recording-grid-video`,src:`/study-${n}.mp4`,autoPlay:!0,loop:!0,muted:!0,playsInline:!0,preload:`auto`,"aria-hidden":`true`}),(0,v.jsxs)(`span`,{className:`visually-hidden`,children:[`Grass study recording IMG_`,n]})]},n)})}),j.length>0||y&&p!==`idle`&&x!==null?(0,v.jsxs)(`div`,{className:`recording-overlay-layer`,"aria-live":`polite`,children:[j.map(e=>(0,v.jsx)(k,{flight:e,onComplete:Z},e.id)),y&&p!==`idle`&&x!==null?(0,v.jsx)(l.div,{ref:u,className:`recording-overlay-card recording-overlay-card-active`,role:`dialog`,"aria-label":`Expanded grass study recording IMG_${y}`,"aria-modal":`false`,style:{x:L,y:R,width:z,height:B,borderRadius:V,scale:H,transformOrigin:`top left`},onPointerDown:se,onPointerMove:ce,onPointerUp:e=>le(e),onPointerCancel:e=>le(e,!0),children:(0,v.jsx)(`video`,{ref:c,className:`recording-overlay-video`,src:`/study-${y}.mp4`,autoPlay:!0,loop:!0,muted:!0,playsInline:!0,preload:`auto`,onLoadedMetadata:e=>{let t=e.currentTarget;Number.isFinite(C)&&(t.currentTime=C),t.play().catch(()=>void 0)}},`${y}-${x}`)}):null]}):null]})}function $({showRecordingGrid:e=!0}){let t=(0,m.useRef)(null),n=(0,m.useRef)(S(x)),r=new URLSearchParams(window.location.search).get(`native`)===`1`,i=r?{overall:1.25,base:2,length:1.4,terrainDepth:.48}:{overall:1,base:1,length:1,terrainDepth:2},a=u(`Grass Study`,{blade:{overall:[i.overall,.5,1.5,.01],base:[i.base,.25,2,.01],length:[i.length,.25,2,.01]},terrain:{terrainDepth:[i.terrainDepth,0,4,.01],showGrass:!0}},{id:r?`grass-study-native-v1`:`grass-study-controls-v3`,persist:!r}),o=(0,m.useRef)({overall:i.overall,base:i.base,mounds:i.length}),s=(0,m.useRef)({depth:i.terrainDepth,showGrass:!0});o.current={overall:a.blade.overall,base:a.blade.base,mounds:a.blade.length},s.current={depth:a.terrain.terrainDepth,showGrass:a.terrain.showGrass};let c=(0,m.useRef)({active:!1,left:0,width:1,lastX:0,lastTime:0,velocity:0}),l=`study-7400`,[d,f]=(0,m.useState)(`recording`),[p,h]=(0,m.useState)(x),[g,_]=(0,m.useState)(0),[y,b]=(0,m.useState)(!1);(0,m.useEffect)(()=>{if(t.current)try{return Z(t.current,n,o,s,l)}catch(e){console.error(`Unable to start the ornamental grass field`,e)}},[l]);let w=C.find(e=>e.id===d)??C[0],T=C,E=`${p}%`,D=e=>{let t=Math.max(0,Math.min(100,e));n.current=S(t),h(t)};return(0,v.jsxs)(`div`,{className:`grass-comparison${e?``:` grass-comparison--two-panel`}`,children:[e?(0,v.jsx)(Q,{}):null,(0,v.jsx)(`section`,{className:`grass-experience`,"aria-label":`Generated grass simulation`,children:(0,v.jsxs)(`div`,{className:`generated-stage-shell`,children:[(0,v.jsxs)(`figure`,{className:`grass-stage generated-stage`,children:[(0,v.jsx)(`canvas`,{ref:t,className:`grass-canvas`,role:`img`,"aria-label":`Mounded ornamental grass moving continuously in layered coastal wind`}),(0,v.jsx)(`div`,{className:`grass-fallback`,"aria-hidden":`true`}),(0,v.jsx)(`figcaption`,{className:`visually-hidden`,children:`Dense mounds of fine ornamental grass moving continuously in bright coastal wind.`})]}),(0,v.jsx)(`div`,{className:`wind-drawer${y?` is-dragging`:``}`,style:{"--wind-fill":E,"--wind-pull":`${g*.725}px`,"--wind-stretch":1+Math.abs(g)*.003,transformOrigin:g<0?`right center`:`left center`},children:(0,v.jsxs)(`label`,{className:`wind-control${p>=100?` is-max`:``}`,children:[(0,v.jsxs)(`span`,{className:`wind-control__progress`,"aria-hidden":`true`,children:[(0,v.jsx)(`span`,{className:`wind-control__filled-label`,"aria-hidden":`true`,children:`Wind`}),(0,v.jsx)(`span`,{className:`wind-control__filled-marker`})]}),(0,v.jsx)(`span`,{className:`wind-control__empty-marker`,"aria-hidden":`true`}),(0,v.jsx)(`span`,{className:`wind-control__label`,"aria-hidden":`true`,children:`Wind`}),(0,v.jsx)(`output`,{className:`wind-control__value`,children:Math.round(p)}),(0,v.jsx)(`input`,{className:`wind-control__range`,type:`range`,min:`0`,max:`100`,step:`1`,value:p,"aria-label":`Wind strength`,"aria-valuetext":`${Math.round(p)} out of 100`,onChange:e=>{D(Number(e.currentTarget.value))},onPointerDown:e=>{e.preventDefault();let t=e.currentTarget,n=t.getBoundingClientRect(),r=performance.now();c.current={active:!0,left:n.left,width:n.width,lastX:e.clientX,lastTime:r,velocity:0},t.focus(),t.setPointerCapture(e.pointerId),b(!0),_(0),D((e.clientX-n.left)/n.width*100)},onPointerMove:e=>{if(!c.current.active)return;let t=performance.now(),n=Math.max(1,t-c.current.lastTime),r=(e.clientX-c.current.lastX)/n,i=(e.clientX-c.current.left)/c.current.width,a=i<0?i*c.current.width:i>1?(i-1)*c.current.width:0,o=i<=0&&r<0||i>=1&&r>0?r*4.6:0,s=Math.max(-18,Math.min(18,a*.24+o));c.current.lastX=e.clientX,c.current.lastTime=t,c.current.velocity=r,_(s),D(i*100)},onPointerUp:e=>{c.current.active=!1,e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId),b(!1),_(0)},onPointerCancel:()=>{c.current.active=!1,b(!1),_(0)}})]})})]})}),(0,v.jsx)(`section`,{className:`reference-experience`,"aria-label":`Original grass reference video`,children:(0,v.jsxs)(`div`,{className:`reference-stage-shell`,children:[(0,v.jsxs)(`figure`,{className:`grass-stage reference-stage`,children:[w.kind===`video`?(0,v.jsx)(`video`,{className:`reference-video`,src:w.src,poster:w.poster,autoPlay:!0,loop:!0,muted:!0,playsInline:!0,preload:`auto`,"aria-label":w.label},w.id):(0,v.jsx)(`img`,{className:`reference-image`,src:w.src,alt:w.label},w.id),(0,v.jsx)(`figcaption`,{className:`visually-hidden`,children:`Active real-world reference footage for the generated grass study.`})]}),(0,v.jsx)(`aside`,{className:`reference-media-tray`,"aria-label":`Reference media`,children:T.map(e=>{let t=w.id===e.id;return(0,v.jsxs)(`div`,{className:`reference-map-item`,children:[(0,v.jsx)(`button`,{className:`reference-map-button${t?` is-selected`:``}`,type:`button`,"aria-label":`Show ${e.caption}`,"aria-pressed":t,onClick:()=>f(e.id),children:e.kind===`video`?(0,v.jsx)(`video`,{className:`reference-map`,src:e.src,poster:e.poster,autoPlay:!0,loop:!0,muted:!0,playsInline:!0,preload:`metadata`,"aria-hidden":`true`}):(0,v.jsx)(`img`,{className:`reference-map`,src:e.src,alt:``})}),(0,v.jsx)(`span`,{className:`reference-map-hover-label`,"aria-hidden":`true`,children:e.caption})]},e.id)})})]})})]})}export{$ as OrnamentalGrass};