"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const grassVertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 aBlade;
layout(location=1) in vec3 aRoot;
layout(location=2) in vec4 aShape;
layout(location=3) in vec4 aMotion;
uniform mat4 uVP;
uniform float uTime;
uniform float uWindScale;
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
  float terrainLevel = terrainShape(aRoot.xz);
  float terrainX = terrainShape(aRoot.xz + vec2(0.16, 0.0));
  float terrainZ = terrainShape(aRoot.xz + vec2(0.0, 0.16));
  float terrainY = (terrainLevel - 0.5) * 0.58;
  vec2 terrainGradient = vec2(terrainX - terrainLevel, terrainZ - terrainLevel) * 0.58 / 0.16;
  vec3 terrainNormal = normalize(vec3(-terrainGradient.x, 1.0, -terrainGradient.y));
  float slopeAmount = smoothstep(0.018, 0.18, length(terrainGradient));
  vec2 downhill = normalize(-terrainGradient + vec2(0.0001));
  float height = aShape.x * mix(0.94, 1.06, terrainLevel);
  float width = aShape.y;
  vec2 radial = vec2(cos(aShape.z), sin(aShape.z));
  vec2 bladeSide = vec2(cos(aShape.w), sin(aShape.w));
  vec2 windDirection = normalize(vec2(0.78, 0.63));

  vec2 frontDirection = normalize(vec2(0.56, 0.83));
  vec2 frontSide = vec2(-frontDirection.y, frontDirection.x);
  float alongFront = dot(aRoot.xz, frontDirection);
  float acrossFront = dot(aRoot.xz, frontSide);
  float clumpLag = sin(aMotion.z * 1.37) * 0.52;
  float frontPhase = fract((alongFront - uTime * 1.06 + clumpLag) / 18.0);
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
  float wind = 0.11 + gust * 0.48 + clumpBreath * 0.10 + secondFront * 0.045;
  wind += sin(uTime * 2.20 + aMotion.z) * 0.008
    + sin(uTime * 3.10 + aMotion.z * 0.63) * 0.004;
  wind = clamp(wind * uWindScale, 0.05, 2.10);

  float curve = t * t;
  float arch = pow(t, 1.38);
  float tip = pow(t, 2.15);
  float taper = pow(max(1.0 - t, 0.0), 0.66);
  float lean = aMotion.w;
  vec2 bendDirection = normalize(radial * (1.22 - wind * 0.34)
    + windDirection * (0.06 + wind * 0.46)
    + downhill * slopeAmount * 0.11);
  float curlAngle = sin(aMotion.x * 1.37) * 0.22 * arch
    + sin(aMotion.x * 0.71) * 0.06 * tip;
  float curlCos = cos(curlAngle);
  float curlSin = sin(curlAngle);
  vec2 curveDirection = vec2(
    bendDirection.x * curlCos - bendDirection.y * curlSin,
    bendDirection.x * curlSin + bendDirection.y * curlCos
  );
  vec2 rippleDirection = vec2(-windDirection.y, windDirection.x);
  float ripple = sin(aMotion.x + uTime * 1.74 + t * 2.7) * 0.006 * height;

  float naturalReach = height * (0.050 * t + lean * 0.62 * arch);
  float gustReach = height * wind * (
    0.12 + gust * 0.10 + peakGust * 0.18
    + extremeWind * (0.18 + gust * 0.28 + peakGust * 0.42)
  ) * curve;
  vec3 world = aRoot;
  world.y += terrainY;
  // Both vegetation layers emerge from the hidden terrain normal before
  // gravity and wind bend them across the surface.
  world.xz += terrainNormal.xz * height * t * (0.30 - arch * 0.08);
  world.xz += curveDirection * naturalReach;
  world.xz += windDirection * gustReach;
  world.xz += rippleDirection * ripple * tip;
  float verticalLift = max(0.018,
    1.0 - lean * 0.58 * arch - wind * 0.16 * tip - peakGust * 0.42 * tip
      - extremeWind * (0.28 + gust * 0.20 + peakGust * 0.38) * tip
  );
  world.y += height * t * verticalLift * terrainNormal.y;
  world.xz += bladeSide * side * width * taper;

  vec2 horizontalTangent = curveDirection * (lean * 1.02 + 0.08)
    + windDirection * (wind * (0.36 + gust * 0.14) + peakGust * 0.42
      + extremeWind * (0.34 + gust * 0.38 + peakGust * 0.62));
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
}`;

const grassFragment = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vT;
in float vShade;
in float vGust;
uniform vec3 uCamera;
out vec4 outColor;

void main() {
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
  color = mix(color, paleBlade, sunWash * (0.25 + flattened * 0.06));
  float illumination = 0.70 + direct * 0.72 + translucent * 0.18 + vGust * 0.016;
  color *= illumination;
  color += paleBlade * silverEdge * (0.080 + vT * 0.185);
  color += silver * strandFlash * direct * 0.48 * smoothstep(0.16, 1.0, vT);
  color += silver * specular * (1.10 + vGust * 0.36) * smoothstep(0.20, 1.0, vT);
  color *= mix(1.0, 1.06, smoothstep(0.16, 0.78, vT));
  color = min(color, silver);
  outColor = vec4(color, 1.0);
}`;

type Vec3 = [number, number, number];
type Clump = [
  number, number, number, number, number,
  number, number, number, number, number,
  number?,
];

const featuredClumps: Clump[] = [
  [-5.55,-18.42,.92,.66,-.18,.45,.64,.86,.32,.86],[-3.46,-18.82,1.04,.72,.31,.72,.71,.94,.61,.92],[-1.17,-18.26,.88,.82,-.40,.55,.76,.79,.44,1.00],[.77,-18.73,1.12,.68,.24,.88,.69,.90,.74,.88],[3.02,-18.18,.91,.76,-.28,.38,.79,.82,.40,.95],[5.29,-18.61,1.04,.70,.42,.70,.65,.88,.58,.90],
  [-4.78,-16.06,1.16,.82,.18,.40,.68,.92,.56,.95],[-2.48,-15.72,.98,.96,-.38,.86,.72,.84,.35,1.02],[-.24,-16.31,1.25,.84,.26,.60,.80,.93,.70,.90],[2.18,-15.62,1.06,.92,-.16,.95,.66,.88,.47,1.00],[4.57,-16.16,1.18,.84,.34,.50,.75,.95,.65,.94],
  [-5.37,-13.62,1.12,.91,-.28,.76,.74,.81,.42,1.04],[-3.23,-14.08,1.27,.86,.36,.32,.67,.95,.68,.91],[-.82,-13.42,1.10,1.02,-.18,.98,.83,.89,.36,.98],[1.42,-13.93,1.31,.88,.30,.62,.70,.96,.59,1.05],[3.74,-13.36,1.08,1.00,-.42,.84,.78,.86,.76,.92],[5.62,-14.02,.98,.86,.22,.48,.64,.79,.48,1.02],
  [-4.73,-11.05,1.38,.99,.31,.88,.70,.94,.62,1.03],[-2.11,-11.52,1.17,1.12,-.36,.42,.84,.82,.34,.94],[.26,-10.87,1.44,.96,.14,1.02,.76,.97,.71,1.08],[2.88,-11.41,1.25,1.13,-.24,.60,.69,.88,.49,.96],[5.12,-10.71,1.33,.94,.39,.78,.81,.91,.66,1.01],
  [-5.36,-8.54,1.42,1.14,-.21,.36,.78,.86,.45,1.06],[-2.73,-8.97,1.51,1.02,.29,.91,.66,.96,.72,.98],[-.08,-8.24,1.31,1.24,-.35,.56,.88,.87,.30,1.00],[2.43,-8.82,1.55,1.07,.20,1.05,.74,.95,.61,1.10],[5.07,-8.18,1.41,1.18,-.32,.69,.82,.89,.51,.94],
  [-4.65,-5.83,1.68,1.22,.27,.82,.42,.93,.69,1.10],[-1.63,-6.31,1.48,1.36,-.41,.40,.86,.84,.38,.96],[1.13,-5.48,1.72,1.19,.18,.98,.52,.98,.58,1.16],[4.24,-6.02,1.59,1.31,-.28,.58,.73,.91,.47,1.00],
  [-5.20,-2.64,1.74,1.43,-.34,.36,.85,.87,.40,1.03],[-2.01,-3.17,2.02,1.42,.24,.86,.46,.97,.71,1.18],[1.19,-2.32,1.66,1.55,-.26,.52,.91,.90,.31,.98],[4.34,-3.03,1.88,1.34,.35,1.00,.78,.95,.60,1.08],
  [-4.53,.66,2.04,1.42,.20,.78,.58,.92,.64,1.10],[-.98,-.15,2.42,1.74,-.38,.39,.34,.98,.62,1.20],[2.75,.74,2.10,1.46,.29,.96,.66,.94,.57,1.14],[5.76,-.04,1.48,1.34,-.24,.55,.70,.78,.48,.95],
  [-5.02,4.16,2.13,1.63,-.29,.32,.90,.88,.43,1.04],[-1.32,3.48,2.55,1.85,.24,.84,.46,.98,.68,1.18],[2.58,4.43,2.24,1.58,-.36,.50,.94,.92,.32,1.00],[6.05,3.71,1.63,1.48,.31,1.02,.77,.80,.56,1.06],
  [-4.02,7.79,2.62,1.82,.26,.72,.94,.90,.54,1.05],[.31,7.18,2.72,1.93,-.33,.34,.88,.99,.39,1.10],[4.62,7.92,2.56,1.74,.20,.91,.96,.93,.65,1.00],

  [-1.95,-12.52,2.12,.30,-.22,.22,.98,.22,.49,.67],[3.45,-9.78,2.42,.34,.18,.91,.99,.26,.62,.71],[-3.18,-7.14,2.28,.36,-.31,.40,.97,.24,.44,.72],[1.86,-4.39,2.62,.38,.27,.78,.99,.28,.68,.66],[-2.44,-.94,2.75,.42,-.24,.28,.98,.30,.52,.70],[2.04,2.37,3.02,.45,.20,.88,.99,.33,.72,.64],[-1.06,6.02,3.32,.52,-.18,.38,.99,.34,.57,.68],
  [-3.92,-15.06,1.86,.42,.38,.62,.97,.34,.42,.62],[1.58,-12.04,2.42,.50,-.33,.25,.99,.36,.58,.58],[-.62,-8.68,3.04,.62,.18,.82,.98,.38,.46,.62],[3.08,-5.76,2.74,.68,-.25,.42,.99,.36,.66,.58],[-3.18,-3.02,3.12,.78,.30,.95,.98,.38,.52,.60],[.42,.38,3.82,.92,-.18,.35,.99,.38,.62,.56],[-1.68,3.72,4.58,1.05,.22,.78,.99,.39,.50,.54],[1.04,7.08,5.96,1.34,-.12,.28,.99,.39,.59,.52],
];

// Only the raised, long-grass cushions belong to the mound layer. The narrow
// channel entries from the old system are intentionally excluded; a separate
// stratified base layer now covers those troughs continuously.
const moundClumps = featuredClumps.filter((clump) => clump[7] >= .405);

function shader(gl: WebGL2RenderingContext, type: number, source: string) {
  const value = gl.createShader(type);
  if (!value) throw new Error("Could not create shader");
  gl.shaderSource(value, source);
  gl.compileShader(value);
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(value) || "Shader compilation failed";
    gl.deleteShader(value);
    throw new Error(message);
  }
  return value;
}

function program(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const value = gl.createProgram();
  if (!value) throw new Error("Could not create program");
  const vs = shader(gl, gl.VERTEX_SHADER, vertex);
  const fs = shader(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(value, vs);
  gl.attachShader(value, fs);
  gl.linkProgram(value);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(value, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(value) || "Program linking failed");
  }
  return value;
}

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(...v) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}

function dot(a: Vec3, b: Vec3) {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

function lookAt(eye: Vec3, target: Vec3) {
  const z = normalize([eye[0]-target[0], eye[1]-target[1], eye[2]-target[2]]);
  const x = normalize(cross([0,1,0], z));
  const y = cross(z, x);
  return new Float32Array([
    x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
    -dot(x,eye),-dot(y,eye),-dot(z,eye),1,
  ]);
}

function perspective(aspect: number) {
  const near = .1;
  const far = 48;
  const f = 1 / Math.tan(Math.PI * .116);
  const range = 1 / (near - far);
  return new Float32Array([
    f/aspect,0,0,0, 0,f,0,0, 0,0,(near+far)*range,-1, 0,0,near*far*2*range,0,
  ]);
}

function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);
  for (let c=0;c<4;c+=1) for (let r=0;r<4;r+=1) {
    out[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1]
      + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
  }
  return out;
}

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function moundGrassGeometry(gl: WebGL2RenderingContext, requested: number) {
  const vao = gl.createVertexArray();
  const bladeBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  if (!vao || !bladeBuffer || !instanceBuffer) throw new Error("Grass allocation failed");

  const segments = 7;
  const blade = new Float32Array((segments + 1) * 4);
  for (let i=0;i<=segments;i+=1) blade.set([-1,i/segments,1,i/segments], i*4);

  const weight = (clump: Clump, clumpIndex: number) => clump[2] * clump[3] * clump[7]
    * (clump[7] < .405 ? .82 : 1)
    * (.68 + seeded(clumpIndex, 31) * .72);
  const totalWeight = moundClumps.reduce((sum, clump, clumpIndex) => sum + weight(clump, clumpIndex), 0);
  const counts = moundClumps.map((clump, clumpIndex) => Math.floor(requested * weight(clump, clumpIndex) / totalWeight));
  let count = counts.reduce((sum, value) => sum + value, 0);
  for (let i=0;count<requested;i=(i+1)%counts.length) { counts[i] += 1; count += 1; }
  const instances = new Float32Array(count * 11);
  let index = 0;

  moundClumps.forEach(([
    centerX,centerZ,radiusX,radiusZ,rotation,flow,collapse,
    density,tone,lengthScale,species = 0,
  ], clumpIndex) => {
    const clumpPhase = seeded(clumpIndex, 20) * Math.PI * 2;
    const foreground = Math.max(0, Math.min(1, (centerZ + 2) / 10));
    const rotationCos = Math.cos(rotation);
    const rotationSin = Math.sin(rotation);
    const localFlow = flow + (seeded(clumpIndex, 22) - .5) * 3.10;
    const flowX = Math.cos(localFlow);
    const flowZ = Math.sin(localFlow);
    const meanRadius = Math.sqrt(radiusX * radiusZ);
    const isContinuity = density < .405 ? 1 : 0;
    const posture = seeded(clumpIndex, 32);
    const upright = isContinuity > .5 ? 0 : posture < .29 ? 1 : 0;
    const flattened = isContinuity > .5 ? 0 : posture > .76 ? 1 : 0;
    const postureLength = upright > .5 ? 1.22 : flattened > .5 ? .66 : .94;
    const postureLift = upright > .5 ? 1.24 : flattened > .5 ? .54 : .90;
    const footprintScale = upright > .5 ? .88 : flattened > .5 ? 1.18 : 1.0;
    const clumpLength = postureLength * (.82 + seeded(clumpIndex, 15) * .38);
    const clumpCollapseBias = (seeded(clumpIndex, 16) - .5) * .42
      - upright * .16 + flattened * .30;
    const organicCenterX = centerX + (seeded(clumpIndex, 17) - .5) * .42;
    const organicCenterZ = centerZ + (seeded(clumpIndex, 18) - .5) * .54;
    for (let bladeIndex=0;bladeIndex<counts[clumpIndex];bladeIndex+=1) {
      const offset = index * 11;
      const angle = seeded(index, 1) * Math.PI * 2;
      const radialSeed = seeded(index, 2);
      const rootRatio = seeded(index, 17) < .55
        ? Math.pow(radialSeed, 1.42) * .90
        : Math.pow(radialSeed, .72);
      const brokenEdge = 1
        + Math.sin(angle * 3 + clumpPhase) * .18
        + Math.sin(angle * 5 - clumpPhase * .63) * .11;
      const localX = Math.cos(angle) * rootRatio * radiusX * brokenEdge * .96
        * footprintScale;
      const localZ = Math.sin(angle) * rootRatio * radiusZ * brokenEdge * .96
        * (flattened > .5 ? 1.08 : upright > .5 ? .92 : 1);
      const lobeRoll = seeded(index, 14);
      const lobeSide = lobeRoll < .28 ? -1 : lobeRoll > .72 ? 1 : 0;
      const lobeDepth = lobeRoll < .16 ? -.7 : lobeRoll > .84 ? .55 : 0;
      const rootX = localX * rotationCos - localZ * rotationSin
        - flowZ * lobeSide * radiusX * .13 + flowX * lobeDepth * radiusZ * .08;
      const rootZ = localX * rotationSin + localZ * rotationCos
        + flowX * lobeSide * radiusX * .13 + flowZ * lobeDepth * radiusZ * .08;
      const outwardLength = Math.hypot(rootX,rootZ) || 1;
      const outwardX = rootX / outwardLength;
      const outwardZ = rootZ / outwardLength;
      const flattenedMat = isContinuity;
      const broadFlow = flattenedMat > .5 ? .40 : .92;
      const fineFlow = flattenedMat > .5 ? .18 : .36;
      const patchAngle = localFlow
        + Math.sin(angle * 2 + clumpPhase) * broadFlow
        + Math.sin(angle * 5 - clumpPhase * .72) * fineFlow;
      const patchX = Math.cos(patchAngle);
      const patchZ = Math.sin(patchAngle);
      const directionX = patchX * .84 + outwardX * .16;
      const directionZ = patchZ * .84 + outwardZ * .16;
      const tangled = seeded(index, 19) < (.27 + flattenedMat * .12) ? 1 : 0;
      const direction = Math.atan2(directionZ,directionX)
        + (seeded(index, 5) - .5) * (flattenedMat > .5 ? .38 : .64)
        + tangled * (seeded(index, 20) - .5) * 1.82;
      const strandNoise = .82 + Math.pow(seeded(index, 3), .82) * .42;
      const irregularProfile = Math.max(.72,Math.min(1.12,
        .90 + Math.sin(angle * 2 + clumpPhase) * .12
        + Math.sin(angle * 5 - clumpPhase * .71) * .07
      ));
      const strayLength = seeded(index, 13) > .93 ? 1.14
        : seeded(index, 13) < .17 ? .72 : 1;
      const baseBlade = seeded(index, 21) < .36 ? 1 : 0;
      const contactPatch = rootRatio > .48
        && Math.sin(angle * 3 + clumpPhase) > .42 ? 1 : 0;
      const edgeLength = .90 + (1 - rootRatio) * .12
        + Math.max(-.13,Math.min(.13,(rootX * flowX + rootZ * flowZ) / meanRadius * .12));
      const structuralLength = meanRadius <= 1.45
        ? meanRadius : 1.45 + (meanRadius - 1.45) * .28;
      let height = structuralLength * .98 * strandNoise * edgeLength
        * irregularProfile * strayLength * lengthScale * clumpLength
        * (1 - foreground * .10) * (1 - flattenedMat * .24)
        * (1 - contactPatch * .23) * (1 - baseBlade * .19)
        * (1 - tangled * .06);
      const worldRootX = organicCenterX + rootX;
      const worldRootZ = organicCenterZ + rootZ;
      if (species > .5) {
        height *= .76;
      }
      const roundedShoulder = Math.pow(Math.max(0,1 - rootRatio),1.12);
      const moundLift = roundedShoulder * meanRadius * .36 * postureLift
        * (1 - flattenedMat * .84);
      const rootLift = .018 + moundLift
        + (1 - rootRatio) * .045 * (1 - collapse * .54)
        + seeded(index, 12) * .018;
      instances[offset] = worldRootX;
      instances[offset+1] = rootLift;
      instances[offset+2] = worldRootZ;
      instances[offset+3] = height;
      instances[offset+4] = species > .5
        ? .011 + seeded(index, 4) * .009
        : (.0048 + seeded(index, 4) * .0047) * (1 + baseBlade * .10);
      instances[offset+5] = direction;
      instances[offset+6] = direction + Math.PI * .5 + (seeded(index, 6) - .5) * .62;
      instances[offset+7] = seeded(index, 7) * Math.PI * 2;
      const family = seeded(index, 11);
      const bladeShade = Math.max(.06,Math.min(.98,
        tone * .68 + seeded(index, 8) * .28 + foreground * .08
        + (family > .72 ? .24 : 0) - (family < .11 ? .13 : 0)
      ));
      instances[offset+8] = species > .5 ? 2 + bladeShade : bladeShade + flattenedMat;
      instances[offset+9] = clumpPhase;
      instances[offset+10] = Math.max(.26,Math.min(.98,
        .14 + collapse * .48 + foreground * .03 + rootRatio * .13
        + clumpCollapseBias
        + Math.sin(angle * 2 + clumpPhase) * .075
        + Math.sin(angle * 5 - clumpPhase) * .035
        + flattenedMat * .46 + contactPatch * .16 - baseBlade * .07
        + tangled * .07 + (seeded(index, 9) - .5) * .32
      ));
      index += 1;
    }
  });

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, blade, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, instances, gl.STATIC_DRAW);
  const stride = 11 * Float32Array.BYTES_PER_ELEMENT;
  for (const [location,size,offset] of [[1,3,0],[2,4,3],[3,4,7]]) {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location,size,gl.FLOAT,false,stride,offset*4);
    gl.vertexAttribDivisor(location,1);
  }
  gl.bindVertexArray(null);
  return { vao, bladeBuffer, instanceBuffer, vertices:(segments+1)*2, count };
}

function baseGrassGeometry(gl: WebGL2RenderingContext, requested: number) {
  const vao = gl.createVertexArray();
  const bladeBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  if (!vao || !bladeBuffer || !instanceBuffer) throw new Error("Base grass allocation failed");

  const segments = 5;
  const blade = new Float32Array((segments + 1) * 4);
  for (let segment=0;segment<=segments;segment+=1) {
    blade.set([-1,segment/segments,1,segment/segments],segment*4);
  }

  // One jittered blade in every cell guarantees continuous coverage rather
  // than relying on overlapping tufts to hide a rendered floor.
  const terrainWidth = 16.8;
  const terrainDepth = 35.0;
  const columns = Math.max(1,Math.round(Math.sqrt(requested * terrainWidth / terrainDepth)));
  const rows = Math.max(1,Math.ceil(requested / columns));
  const count = columns * rows;
  const instances = new Float32Array(count * 11);
  let instance = 0;
  for (let row=0;row<rows;row+=1) {
    for (let column=0;column<columns;column+=1) {
      const offset = instance * 11;
      const rootX = -8.4 + ((column + .16 + seeded(instance,41) * .68) / columns) * terrainWidth;
      const rootZ = -23.0 + ((row + .16 + seeded(instance,42) * .68) / rows) * terrainDepth;
      const regionColumn = Math.floor((rootX + 8.4) / 1.22);
      const regionRow = Math.floor((rootZ + 23.0) / 1.36);
      const region = regionRow * 19 + regionColumn;
      const regionPhase = seeded(region,43) * Math.PI * 2;
      const compression = seeded(region,44);
      const fieldDirection = regionPhase
        + Math.sin(rootX * .24 + rootZ * .11) * .38
        + Math.cos(rootZ * .19 - rootX * .07) * .24;
      const tangled = seeded(instance,45) < (.17 + compression * .16) ? 1 : 0;
      const direction = fieldDirection + (seeded(instance,46) - .5) * .78
        + tangled * (seeded(instance,47) - .5) * 1.72;
      const compressedLength = compression > .72 ? .68 : compression < .20 ? 1.08 : .88;
      const height = (.42 + seeded(instance,48) * .48) * compressedLength;
      const shade = Math.max(.04,Math.min(.94,
        .09 + seeded(instance,49) * .54 + (compression < .18 ? .18 : 0)
      ));

      instances[offset] = rootX;
      instances[offset+1] = .010 + seeded(instance,50) * .014;
      instances[offset+2] = rootZ;
      instances[offset+3] = height;
      instances[offset+4] = .0046 + seeded(instance,51) * .0042;
      instances[offset+5] = direction;
      instances[offset+6] = direction + Math.PI * .5 + (seeded(instance,52) - .5) * .48;
      instances[offset+7] = seeded(instance,53) * Math.PI * 2;
      instances[offset+8] = 1 + shade;
      instances[offset+9] = regionPhase;
      instances[offset+10] = Math.max(.36,Math.min(.94,
        .48 + compression * .28 + (seeded(instance,54) - .5) * .20 + tangled * .08
      ));
      instance += 1;
    }
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,bladeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,blade,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,instances,gl.STATIC_DRAW);
  const stride = 11 * Float32Array.BYTES_PER_ELEMENT;
  for (const [location,size,attributeOffset] of [[1,3,0],[2,4,3],[3,4,7]]) {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location,size,gl.FLOAT,false,stride,attributeOffset*4);
    gl.vertexAttribDivisor(location,1);
  }
  gl.bindVertexArray(null);
  return { vao, bladeBuffer, instanceBuffer, vertices:(segments+1)*2, count };
}

function createTerrainTexture(gl: WebGL2RenderingContext) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Terrain texture allocation failed");
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,
    new Uint8Array([132,111,78,255]),
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  };
  image.src = "/topography-terrain.png";
  return { texture, image };
}

function start(canvas: HTMLCanvasElement, windAmount: { current: number }) {
  const gl = canvas.getContext("webgl2",{antialias:true,alpha:false,depth:true,powerPreference:"high-performance"});
  if (!gl) return;
  const camera: Vec3 = [0,10.2,8.0];
  const grassProgram = program(gl,grassVertex,grassFragment);
  const mobile = matchMedia("(max-width:700px)").matches;
  const baseGrass = baseGrassGeometry(gl,mobile ? 112000 : 188000);
  const moundGrass = moundGrassGeometry(gl,mobile ? 82000 : 136000);
  const terrain = createTerrainTexture(gl);
  const view = lookAt(camera,[0,.30,-2.35]);
  const grassVP = gl.getUniformLocation(grassProgram,"uVP");
  const grassTerrain = gl.getUniformLocation(grassProgram,"uTerrain");
  const time = gl.getUniformLocation(grassProgram,"uTime");
  const windScale = gl.getUniformLocation(grassProgram,"uWindScale");
  const cameraUniform = gl.getUniformLocation(grassProgram,"uCamera");
  if (!grassVP || !grassTerrain || !time || !windScale || !cameraUniform) {
    throw new Error("Missing uniforms");
  }

  let frame = 0;
  let windClock = 0;
  let previousFrame = performance.now();
  const render = (now: number) => {
    const delta = Math.min(Math.max((now - previousFrame) / 1000,0),.05);
    previousFrame = now;
    const amount = windAmount.current;
    const speed = amount <= 1
      ? .45 + ((amount - .35) / .65) * .55
      : 1 + Math.pow((amount - 1) / 2.6,.85) * 4.2;
    windClock += delta * speed;
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1,2.25);
    const width = Math.max(1,Math.round(box.width*ratio));
    const height = Math.max(1,Math.round(box.height*ratio));
    if (canvas.width!==width || canvas.height!==height) { canvas.width=width; canvas.height=height; }
    gl.viewport(0,0,width,height);
    const vp = multiply(perspective(width/height),view);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(.035,.052,.030,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,terrain.texture);
    gl.useProgram(grassProgram);
    gl.uniformMatrix4fv(grassVP,false,vp);
    gl.uniform1i(grassTerrain,0);
    gl.uniform1f(time,windClock);
    gl.uniform1f(windScale,amount);
    gl.uniform3fv(cameraUniform,camera);
    gl.bindVertexArray(baseGrass.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,baseGrass.vertices,baseGrass.count);
    gl.bindVertexArray(moundGrass.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,moundGrass.vertices,moundGrass.count);
    frame=requestAnimationFrame(render);
  };
  frame=requestAnimationFrame(render);
  return () => {
    cancelAnimationFrame(frame);
    gl.deleteBuffer(baseGrass.bladeBuffer);
    gl.deleteBuffer(baseGrass.instanceBuffer);
    gl.deleteVertexArray(baseGrass.vao);
    gl.deleteBuffer(moundGrass.bladeBuffer);
    gl.deleteBuffer(moundGrass.instanceBuffer);
    gl.deleteVertexArray(moundGrass.vao);
    terrain.image.onload = null;
    gl.deleteTexture(terrain.texture);
    gl.deleteProgram(grassProgram);
  };
}

export function OrnamentalGrass() {
  const ref = useRef<HTMLCanvasElement>(null);
  const windAmount = useRef(1);
  const drag = useRef({
    active: false,
    left: 0,
    width: 1,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });
  const [windStrength, setWindStrength] = useState(50);
  const [elasticPull, setElasticPull] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    try { return start(ref.current,windAmount); }
    catch (error) { console.error("Unable to start the ornamental grass field",error); }
  },[]);
  const windFill = `${windStrength}%`;
  const setStrength = (strength: number) => {
    const next = Math.max(0,Math.min(100,strength));
    const normalized = next / 100;
    windAmount.current = normalized <= .5
      ? .35 + (normalized / .5) * .65
      : 1 + Math.pow((normalized - .5) / .5,1.60) * 2.6;
    setWindStrength(next);
  };
  return (
    <div className="grass-comparison">
      <section className="grass-experience" aria-label="Generated grass simulation">
        <figure className="grass-stage">
          <canvas
            ref={ref}
            className="grass-canvas"
            role="img"
            aria-label="Mounded ornamental grass moving continuously in layered coastal wind"
          />
          <div className="grass-fallback" aria-hidden="true" />
          <figcaption className="visually-hidden">
            Dense mounds of fine ornamental grass moving continuously in bright
            coastal wind.
          </figcaption>
        </figure>
        <label
          className={`wind-control${isDragging ? " is-dragging" : ""}${windStrength >= 100 ? " is-max" : ""}`}
          style={{
            "--wind-fill": windFill,
            "--wind-pull": `${elasticPull * .725}px`,
            "--wind-stretch": 1 + Math.abs(elasticPull) * .003,
            transformOrigin: elasticPull < 0 ? "right center" : "left center",
          } as CSSProperties}
        >
          <span className="wind-control__progress" aria-hidden="true">
            <span className="wind-control__filled-label" aria-hidden="true">Wind</span>
            <span className="wind-control__filled-marker" />
          </span>
          <span className="wind-control__empty-marker" aria-hidden="true" />
          <span className="wind-control__label" aria-hidden="true">Wind</span>
          <output className="wind-control__value">{Math.round(windStrength)}</output>
          <input
            className="wind-control__range"
            type="range"
            min="0"
            max="100"
            step="1"
            value={windStrength}
            aria-label="Wind strength"
            aria-valuetext={`${Math.round(windStrength)} out of 100`}
            onChange={(event) => {
              setStrength(Number(event.currentTarget.value));
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              const input = event.currentTarget;
              const box = input.getBoundingClientRect();
              const now = performance.now();
              drag.current = {
                active: true,
                left: box.left,
                width: box.width,
                lastX: event.clientX,
                lastTime: now,
                velocity: 0,
              };
              input.focus();
              input.setPointerCapture(event.pointerId);
              setIsDragging(true);
              setElasticPull(0);
              setStrength(((event.clientX - box.left) / box.width) * 100);
            }}
            onPointerMove={(event) => {
              if (!drag.current.active) return;
              const now = performance.now();
              const elapsed = Math.max(1,now - drag.current.lastTime);
              const velocity = (event.clientX - drag.current.lastX) / elapsed;
              const raw = (event.clientX - drag.current.left) / drag.current.width;
              const excess = raw < 0 ? raw * drag.current.width
                : raw > 1 ? (raw - 1) * drag.current.width : 0;
              const directedVelocity = (raw <= 0 && velocity < 0)
                || (raw >= 1 && velocity > 0) ? velocity * 4.6 : 0;
              const pull = Math.max(-18,Math.min(18,excess * .24 + directedVelocity));
              drag.current.lastX = event.clientX;
              drag.current.lastTime = now;
              drag.current.velocity = velocity;
              setElasticPull(pull);
              setStrength(raw * 100);
            }}
            onPointerUp={(event) => {
              drag.current.active = false;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              setIsDragging(false);
              setElasticPull(0);
            }}
            onPointerCancel={() => {
              drag.current.active = false;
              setIsDragging(false);
              setElasticPull(0);
            }}
          />
        </label>
      </section>
      <section className="reference-experience" aria-label="Original grass reference video">
        <figure className="grass-stage reference-stage">
          <video
            className="reference-video"
            src="/IMG_7400.mp4"
            poster="/IMG_7400-poster.jpg"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="Original footage of ornamental grass moving in the wind"
          />
          <figcaption className="visually-hidden">
            Original reference footage of dense ornamental grass moving outdoors.
          </figcaption>
        </figure>
        <p className="reference-caption">Grass Study Recording.mp4</p>
      </section>
    </div>
  );
}
