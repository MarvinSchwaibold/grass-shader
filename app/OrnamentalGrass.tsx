"use client";

import { useEffect, useRef } from "react";

const grassVertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 aBlade;
layout(location=1) in vec3 aRoot;
layout(location=2) in vec4 aShape;
layout(location=3) in vec4 aMotion;
uniform mat4 uVP;
uniform float uTime;
out vec3 vNormal;
out vec3 vWorld;
out float vT;
out float vShade;
out float vGust;

void main() {
  float side = aBlade.x;
  float t = aBlade.y;
  float height = aShape.x;
  float width = aShape.y;
  vec2 radial = vec2(cos(aShape.z), sin(aShape.z));
  vec2 bladeSide = vec2(cos(aShape.w), sin(aShape.w));
  vec2 windDirection = normalize(vec2(0.78, 0.63));

  float rollingFront = sin(
    dot(aRoot.xz, vec2(0.41, 0.71)) * 0.76
    - uTime * 1.04
    + sin(aRoot.x * 0.27 + uTime * 0.23) * 0.38
  );
  float clumpBreath = sin(uTime * 1.62 + aMotion.z) * 0.5 + 0.5;
  float secondFront = sin(
    dot(aRoot.xz, vec2(-0.18, 0.56)) * 1.18
    - uTime * 1.46 + aMotion.z * 0.24
  ) * 0.5 + 0.5;
  float gust = smoothstep(-0.58, 0.72, rollingFront);
  float wind = 0.14 + gust * 0.37 + clumpBreath * 0.12 + secondFront * 0.08;
  wind += sin(uTime * 3.8 + aMotion.x) * 0.025
    + sin(uTime * 6.4 + aMotion.x * 1.7) * 0.012;
  wind = clamp(wind, 0.13, 0.72);

  float curve = t * t;
  float arch = pow(t, 1.38);
  float tip = pow(t, 2.15);
  float taper = pow(max(1.0 - t, 0.0), 0.66);
  float lean = aMotion.w;
  vec2 bendDirection = normalize(radial * (0.96 - wind * 0.72)
    + windDirection * (0.22 + wind * 1.10));
  float curlAngle = sin(aMotion.x * 1.37) * 0.48 * arch
    + sin(aMotion.x * 0.71) * 0.14 * tip;
  float curlCos = cos(curlAngle);
  float curlSin = sin(curlAngle);
  vec2 curveDirection = vec2(
    bendDirection.x * curlCos - bendDirection.y * curlSin,
    bendDirection.x * curlSin + bendDirection.y * curlCos
  );
  vec2 rippleDirection = vec2(-windDirection.y, windDirection.x);
  float ripple = sin(aMotion.x + uTime * 2.25 + t * 2.7) * 0.018 * height;

  float naturalReach = height * (0.065 * t + lean * 0.80 * arch);
  float gustReach = height * wind * (0.22 + gust * 0.17) * curve;
  vec3 world = aRoot;
  world.xz += curveDirection * naturalReach;
  world.xz += windDirection * gustReach;
  world.xz += rippleDirection * ripple * tip;
  world.y += height * t * (
    1.0 - lean * 0.64 * arch - wind * 0.22 * tip
  );
  world.xz += bladeSide * side * width * taper;

  vec2 horizontalTangent = curveDirection * (lean * 1.02 + 0.08)
    + windDirection * wind * (0.42 + gust * 0.18);
  vec3 tangent = normalize(vec3(
    horizontalTangent.x * arch,
    max(0.13, 1.0 - lean * 0.72 * arch - wind * 0.36 * tip),
    horizontalTangent.y * arch
  ));
  vNormal = normalize(cross(vec3(bladeSide.x, 0.0, bladeSide.y), tangent));
  vWorld = world;
  vT = t;
  vShade = aMotion.y;
  vGust = gust * 0.72 + wind * 0.28;
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
  float specular = pow(max(dot(normal, halfDirection), 0.0), 24.0);
  float silverEdge = pow(1.0 - abs(dot(normal, view)), 6.4);

  // Palette sampled from the target half of the pixel comparison:
  // #192818, #2e3e26, #384a3a, #62734d, #76863d, #a0ae55,
  // #a1ac74, #afb884, #c6d098.
  vec3 root = vec3(0.0980, 0.1569, 0.0941);
  vec3 shadowBlade = vec3(0.1843, 0.2588, 0.1490);
  vec3 coolBlade = vec3(0.2510, 0.3569, 0.2392);
  vec3 oliveBlade = vec3(0.4196, 0.5020, 0.2471);
  vec3 dullBlade = vec3(0.5176, 0.5765, 0.3843);
  vec3 dryBlade = vec3(0.6314, 0.6588, 0.3569);
  vec3 grayBlade = vec3(0.5608, 0.6039, 0.5137);
  vec3 paleBlade = vec3(0.6824, 0.7216, 0.5176);
  vec3 silver = vec3(0.7765, 0.8157, 0.5961);

  float dryFamily = smoothstep(0.76, 0.93, vShade);
  vec3 color = vShade < 0.32 ? coolBlade
    : (vShade < 0.72 ? oliveBlade : dullBlade);
  vec3 weathered = fract(vShade * 13.71) < 0.48 ? dryBlade : grayBlade;
  color = mix(color, weathered, dryFamily * 0.78);
  color *= mix(0.72, 1.18, fract(vShade * 5.71));
  color = mix(root, color, smoothstep(0.06, 0.42, vT));
  color = mix(color, shadowBlade, (1.0 - smoothstep(0.03, 0.28, vT)) * 0.22);
  color = mix(color, paleBlade, smoothstep(0.58, 1.0, vT) * dryFamily * 0.16);
  float illumination = 0.78 + direct * 0.58 + translucent * 0.13 + vGust * 0.020;
  color *= illumination;
  color += paleBlade * silverEdge * (0.018 + vT * 0.055);
  color += silver * specular * (0.42 + vGust * 0.18) * smoothstep(0.30, 1.0, vT);
  color *= mix(1.0, 1.07, smoothstep(0.18, 0.80, vT));
  color = min(color, silver);
  outColor = vec4(color, 1.0);
}`;

const groundVertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
uniform mat4 uVP;
out vec2 vWorld;
void main() {
  vWorld = aPosition;
  gl_Position = uVP * vec4(aPosition.x, -0.035, aPosition.y, 1.0);
}`;

const groundFragment = `#version 300 es
precision highp float;
in vec2 vWorld;
out vec4 outColor;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  float fine = hash(floor(vWorld * 13.0));
  float broad = sin(vWorld.x * 0.52 + vWorld.y * 0.29) * 0.5 + 0.5;
  float pathA = 1.0 - smoothstep(0.26, 0.94,
    abs(vWorld.x + 1.10 + sin(vWorld.y * 0.42) * 0.82));
  float pathB = 1.0 - smoothstep(0.24, 0.82,
    abs(vWorld.x - 2.75 - sin(vWorld.y * 0.31 + 1.2) * 0.64));
  float crossPath = 1.0 - smoothstep(0.25, 0.78,
    abs(vWorld.y + 5.7 - sin(vWorld.x * 0.58) * 0.76));
  float pocket = pow(max(0.0,
    sin(vWorld.x * 1.23 + vWorld.y * 0.37)
    * sin(vWorld.y * 0.94 - vWorld.x * 0.18)), 3.0);
  vec3 deepest = vec3(0.0980, 0.1569, 0.0941);
  vec3 soilGreen = vec3(0.1961, 0.2667, 0.1725);
  vec3 lifted = vec3(0.2431, 0.3176, 0.2510);
  vec3 color = mix(deepest, soilGreen, fine * 0.42 + broad * 0.28);
  color = mix(color, lifted, max(0.0, broad - 0.70) * 0.26);
  color = mix(color, deepest, min(0.48,pathA * 0.20 + pathB * 0.18 + crossPath * 0.13 + pocket * 0.22));
  color *= 1.12;
  outColor = vec4(color, 1.0);
}`;

type Vec3 = [number, number, number];
type Clump = [
  number, number, number, number, number,
  number, number, number, number, number,
];

const clumps: Clump[] = [
  [-5.55,-18.42,.92,.66,-.18,.45,.64,.86,.32,.86],[-3.46,-18.82,1.04,.72,.31,.72,.71,.94,.61,.92],[-1.17,-18.26,.88,.82,-.40,.55,.76,.79,.44,1.00],[.77,-18.73,1.12,.68,.24,.88,.69,.90,.74,.88],[3.02,-18.18,.91,.76,-.28,.38,.79,.82,.40,.95],[5.29,-18.61,1.04,.70,.42,.70,.65,.88,.58,.90],
  [-4.78,-16.06,1.16,.82,.18,.40,.68,.92,.56,.95],[-2.48,-15.72,.98,.96,-.38,.86,.72,.84,.35,1.02],[-.24,-16.31,1.25,.84,.26,.60,.80,.93,.70,.90],[2.18,-15.62,1.06,.92,-.16,.95,.66,.88,.47,1.00],[4.57,-16.16,1.18,.84,.34,.50,.75,.95,.65,.94],
  [-5.37,-13.62,1.12,.91,-.28,.76,.74,.81,.42,1.04],[-3.23,-14.08,1.27,.86,.36,.32,.67,.95,.68,.91],[-.82,-13.42,1.10,1.02,-.18,.98,.83,.89,.36,.98],[1.42,-13.93,1.31,.88,.30,.62,.70,.96,.59,1.05],[3.74,-13.36,1.08,1.00,-.42,.84,.78,.86,.76,.92],[5.62,-14.02,.98,.86,.22,.48,.64,.79,.48,1.02],
  [-4.73,-11.05,1.38,.99,.31,.88,.70,.94,.62,1.03],[-2.11,-11.52,1.17,1.12,-.36,.42,.84,.82,.34,.94],[.26,-10.87,1.44,.96,.14,1.02,.76,.97,.71,1.08],[2.88,-11.41,1.25,1.13,-.24,.60,.69,.88,.49,.96],[5.12,-10.71,1.33,.94,.39,.78,.81,.91,.66,1.01],
  [-5.36,-8.54,1.42,1.14,-.21,.36,.78,.86,.45,1.06],[-2.73,-8.97,1.51,1.02,.29,.91,.66,.96,.72,.98],[-.08,-8.24,1.31,1.24,-.35,.56,.88,.87,.30,1.00],[2.43,-8.82,1.55,1.07,.20,1.05,.74,.95,.61,1.10],[5.07,-8.18,1.41,1.18,-.32,.69,.82,.89,.51,.94],
  [-4.65,-5.83,1.68,1.22,.27,.82,.70,.93,.69,1.05],[-1.63,-6.31,1.48,1.36,-.41,.40,.86,.84,.38,.96],[1.13,-5.48,1.72,1.19,.18,.98,.79,.98,.58,1.12],[4.24,-6.02,1.59,1.31,-.28,.58,.73,.91,.47,1.00],
  [-5.20,-2.64,1.74,1.43,-.34,.36,.85,.87,.40,1.03],[-2.01,-3.17,1.92,1.31,.24,.86,.72,.97,.71,1.12],[1.19,-2.32,1.66,1.55,-.26,.52,.91,.90,.31,.98],[4.34,-3.03,1.88,1.34,.35,1.00,.78,.95,.60,1.08],
  [-4.53,.66,2.04,1.42,.20,.78,.76,.92,.64,1.08],[-.98,-.15,2.22,1.55,-.38,.39,.92,.98,.35,1.02],[2.75,.74,2.10,1.46,.29,.96,.82,.94,.57,1.12],[5.76,-.04,1.48,1.34,-.24,.55,.70,.78,.48,.95],
  [-5.02,4.16,2.13,1.63,-.29,.32,.90,.88,.43,1.04],[-1.32,3.48,2.40,1.71,.24,.84,.80,.98,.68,1.13],[2.58,4.43,2.24,1.58,-.36,.50,.94,.92,.32,1.00],[6.05,3.71,1.63,1.48,.31,1.02,.77,.80,.56,1.06],
  [-4.02,7.79,2.62,1.82,.26,.72,.94,.90,.54,1.05],[.31,7.18,2.72,1.93,-.33,.34,.88,.99,.39,1.10],[4.62,7.92,2.56,1.74,.20,.91,.96,.93,.65,1.00],

  [-1.95,-12.52,2.12,.30,-.22,.22,.98,.22,.49,.67],[3.45,-9.78,2.42,.34,.18,.91,.99,.26,.62,.71],[-3.18,-7.14,2.28,.36,-.31,.40,.97,.24,.44,.72],[1.86,-4.39,2.62,.38,.27,.78,.99,.28,.68,.66],[-2.44,-.94,2.75,.42,-.24,.28,.98,.30,.52,.70],[2.04,2.37,3.02,.45,.20,.88,.99,.33,.72,.64],[-1.06,6.02,3.32,.52,-.18,.38,.99,.34,.57,.68],
  [-3.92,-15.06,1.86,.42,.38,.62,.97,.34,.42,.62],[1.58,-12.04,2.42,.50,-.33,.25,.99,.36,.58,.58],[-.62,-8.68,3.04,.62,.18,.82,.98,.38,.46,.62],[3.08,-5.76,2.74,.68,-.25,.42,.99,.36,.66,.58],[-3.18,-3.02,3.12,.78,.30,.95,.98,.38,.52,.60],[.42,.38,3.82,.92,-.18,.35,.99,.38,.62,.56],[-1.68,3.72,4.58,1.05,.22,.78,.99,.39,.50,.54],[1.04,7.08,5.96,1.34,-.12,.28,.99,.39,.59,.52],
];

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

function grassGeometry(gl: WebGL2RenderingContext, requested: number) {
  const vao = gl.createVertexArray();
  const bladeBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  if (!vao || !bladeBuffer || !instanceBuffer) throw new Error("Grass allocation failed");

  const segments = 6;
  const blade = new Float32Array((segments + 1) * 4);
  for (let i=0;i<=segments;i+=1) blade.set([-1,i/segments,1,i/segments], i*4);

  const weight = (clump: Clump) => clump[2] * clump[3] * clump[7]
    * (clump[7] < .405 ? 2.00 : 1);
  const totalWeight = clumps.reduce((sum, clump) => sum + weight(clump), 0);
  const counts = clumps.map((clump) => Math.floor(requested * weight(clump) / totalWeight));
  let count = counts.reduce((sum, value) => sum + value, 0);
  for (let i=0;count<requested;i=(i+1)%counts.length) { counts[i] += 1; count += 1; }
  const instances = new Float32Array(count * 11);
  let index = 0;

  clumps.forEach(([
    centerX,centerZ,radiusX,radiusZ,rotation,flow,collapse,
    density,tone,lengthScale,
  ], clumpIndex) => {
    const clumpPhase = seeded(clumpIndex, 20) * Math.PI * 2;
    const foreground = Math.max(0, Math.min(1, (centerZ + 2) / 10));
    const rotationCos = Math.cos(rotation);
    const rotationSin = Math.sin(rotation);
    const flowX = Math.cos(flow);
    const flowZ = Math.sin(flow);
    const meanRadius = Math.sqrt(radiusX * radiusZ);
    const clumpLength = .73 + seeded(clumpIndex, 15) * .39;
    const clumpCollapseBias = (seeded(clumpIndex, 16) - .5) * .34;
    const organicCenterX = centerX + (seeded(clumpIndex, 17) - .5) * .42;
    const organicCenterZ = centerZ + (seeded(clumpIndex, 18) - .5) * .54;
    for (let bladeIndex=0;bladeIndex<counts[clumpIndex];bladeIndex+=1) {
      const offset = index * 11;
      const angle = seeded(index, 1) * Math.PI * 2;
      const radialSeed = seeded(index, 2);
      const rootRatio = seeded(index, 17) < .42
        ? Math.pow(radialSeed, 1.34) * .88
        : Math.pow(radialSeed, .62);
      const brokenEdge = 1
        + Math.sin(angle * 3 + clumpPhase) * .18
        + Math.sin(angle * 5 - clumpPhase * .63) * .11;
      const localX = Math.cos(angle) * rootRatio * radiusX * brokenEdge * .96;
      const localZ = Math.sin(angle) * rootRatio * radiusZ * brokenEdge * .96;
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
      const patchAngle = flow
        + Math.sin(angle * 2 + clumpPhase) * 1.05
        + Math.sin(angle * 5 - clumpPhase * .72) * .46;
      const patchX = Math.cos(patchAngle);
      const patchZ = Math.sin(patchAngle);
      const directionX = patchX * .84 + outwardX * .16;
      const directionZ = patchZ * .84 + outwardZ * .16;
      const tangled = seeded(index, 19) < .23 ? 1 : 0;
      const direction = Math.atan2(directionZ,directionX)
        + (seeded(index, 5) - .5) * 1.46
        + tangled * (seeded(index, 20) - .5) * 2.35;
      const strandNoise = .82 + Math.pow(seeded(index, 3), .82) * .42;
      const irregularProfile = Math.max(.72,Math.min(1.12,
        .90 + Math.sin(angle * 2 + clumpPhase) * .12
        + Math.sin(angle * 5 - clumpPhase * .71) * .07
      ));
      const strayLength = seeded(index, 13) > .93 ? 1.08
        : seeded(index, 13) < .17 ? .78 : 1;
      const baseBlade = seeded(index, 21) < .36 ? 1 : 0;
      const contactPatch = rootRatio > .48
        && Math.sin(angle * 3 + clumpPhase) > .42 ? 1 : 0;
      const edgeLength = .90 + (1 - rootRatio) * .12
        + Math.max(-.13,Math.min(.13,(rootX * flowX + rootZ * flowZ) / meanRadius * .12));
      const flattenedMat = density < .405 ? 1 : 0;
      const height = meanRadius * .88 * strandNoise * edgeLength
        * irregularProfile * strayLength * lengthScale * clumpLength
        * (1 - foreground * .10) * (1 - flattenedMat * .47)
        * (1 - contactPatch * .23) * (1 - baseBlade * .19)
        * (1 - tangled * .06);
      const rootLift = .018 + (1 - rootRatio) * .045 * (1 - collapse * .54)
        + seeded(index, 12) * .018;
      instances[offset] = organicCenterX + rootX;
      instances[offset+1] = rootLift;
      instances[offset+2] = organicCenterZ + rootZ;
      instances[offset+3] = height;
      instances[offset+4] = (.016 + seeded(index, 4) * .016)
        * (1 + baseBlade * .13);
      instances[offset+5] = direction;
      instances[offset+6] = direction + Math.PI * .5 + (seeded(index, 6) - .5) * .62;
      instances[offset+7] = seeded(index, 7) * Math.PI * 2;
      const family = seeded(index, 11);
      instances[offset+8] = Math.max(.06,Math.min(.98,
        tone * .48 + seeded(index, 8) * .44
        + (family > .87 ? .24 : 0) - (family < .14 ? .17 : 0)
      ));
      instances[offset+9] = clumpPhase;
      instances[offset+10] = Math.max(.34,Math.min(.98,
        .20 + collapse * .43 + foreground * .03 + rootRatio * .17
        + clumpCollapseBias
        + Math.sin(angle * 2 + clumpPhase) * .075
        + Math.sin(angle * 5 - clumpPhase) * .035
        + flattenedMat * .34 + contactPatch * .20 - baseBlade * .07
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

function groundGeometry(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) throw new Error("Ground allocation failed");
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-10,-22,10,-22,-10,12,-10,12,10,-22,10,12]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.bindVertexArray(null);
  return { vao, buffer };
}

function start(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2",{antialias:true,alpha:false,depth:true,powerPreference:"high-performance"});
  if (!gl) return;
  const camera: Vec3 = [0,10.2,8.0];
  const grassProgram = program(gl,grassVertex,grassFragment);
  const groundProgram = program(gl,groundVertex,groundFragment);
  const requested = matchMedia("(max-width:700px)").matches ? 138000 : 210000;
  const grass = grassGeometry(gl,requested);
  const ground = groundGeometry(gl);
  const view = lookAt(camera,[0,.30,-2.35]);
  const grassVP = gl.getUniformLocation(grassProgram,"uVP");
  const groundVP = gl.getUniformLocation(groundProgram,"uVP");
  const time = gl.getUniformLocation(grassProgram,"uTime");
  const cameraUniform = gl.getUniformLocation(grassProgram,"uCamera");
  if (!grassVP || !groundVP || !time || !cameraUniform) throw new Error("Missing uniforms");

  let frame = 0;
  const started = performance.now();
  const render = (now: number) => {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1,1.65);
    const width = Math.max(1,Math.round(box.width*ratio));
    const height = Math.max(1,Math.round(box.height*ratio));
    if (canvas.width!==width || canvas.height!==height) { canvas.width=width; canvas.height=height; }
    gl.viewport(0,0,width,height);
    const vp = multiply(perspective(width/height),view);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(.0980,.1569,.0941,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(groundProgram);
    gl.uniformMatrix4fv(groundVP,false,vp);
    gl.bindVertexArray(ground.vao);
    gl.drawArrays(gl.TRIANGLES,0,6);
    gl.useProgram(grassProgram);
    gl.uniformMatrix4fv(grassVP,false,vp);
    gl.uniform1f(time,(now-started)/1000);
    gl.uniform3fv(cameraUniform,camera);
    gl.bindVertexArray(grass.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,grass.vertices,grass.count);
    frame=requestAnimationFrame(render);
  };
  frame=requestAnimationFrame(render);
  return () => {
    cancelAnimationFrame(frame);
    gl.deleteBuffer(grass.bladeBuffer);
    gl.deleteBuffer(grass.instanceBuffer);
    gl.deleteVertexArray(grass.vao);
    gl.deleteBuffer(ground.buffer);
    gl.deleteVertexArray(ground.vao);
    gl.deleteProgram(grassProgram);
    gl.deleteProgram(groundProgram);
  };
}

export function OrnamentalGrass() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try { return start(ref.current); }
    catch (error) { console.error("Unable to start the ornamental grass field",error); }
  },[]);
  return (
    <>
      <canvas
        ref={ref}
        className="grass-canvas"
        role="img"
        aria-label="Mounded ornamental grass moving continuously in layered coastal wind"
      />
      <div className="grass-fallback" aria-hidden="true" />
    </>
  );
}
