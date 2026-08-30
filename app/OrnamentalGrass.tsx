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
  float specular = pow(max(dot(normal, halfDirection), 0.0), 18.0);
  float silverEdge = pow(1.0 - abs(dot(normal, view)), 3.2);

  // Palette sampled from the target half of the pixel comparison:
  // #192818, #2e3e26, #384a3a, #62734d, #76863d, #a0ae55,
  // #a1ac74, #afb884, #c6d098.
  vec3 root = vec3(0.0980, 0.1569, 0.0941);
  vec3 shadowBlade = vec3(0.2196, 0.2902, 0.2275);
  vec3 greenBlade = vec3(0.4627, 0.5255, 0.2392);
  vec3 sunBlade = vec3(0.6275, 0.6824, 0.3333);
  vec3 paleBlade = vec3(0.6863, 0.7216, 0.5176);
  vec3 silver = vec3(0.7765, 0.8157, 0.5961);

  float colorFamily = smoothstep(0.43, 0.49, vShade);
  vec3 color = mix(shadowBlade, greenBlade, colorFamily);
  color *= mix(0.88, 1.08, fract(vShade * 3.17));
  color = mix(root, color, smoothstep(0.03, 0.34, vT));
  color = mix(color, sunBlade, smoothstep(0.42, 1.0, vT) * (0.14 + vShade * 0.18));
  float illumination = 0.75 + direct * 0.44 + translucent * 0.16 + vGust * 0.035;
  color *= illumination;
  color += paleBlade * silverEdge * (0.18 + vT * 0.34);
  color += silver * specular * (0.38 + vGust * 0.26) * smoothstep(0.16, 1.0, vT);
  color *= mix(1.0, 1.24, smoothstep(0.08, 0.70, vT));
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
  vec3 deepest = vec3(0.0980, 0.1569, 0.0941);
  vec3 soilGreen = vec3(0.1804, 0.2431, 0.1490);
  vec3 lifted = vec3(0.2196, 0.2902, 0.2275);
  vec3 color = mix(deepest, soilGreen, fine * 0.42 + broad * 0.28);
  color = mix(color, lifted, max(0.0, broad - 0.70) * 0.26);
  color *= 1.10;
  outColor = vec4(color, 1.0);
}`;

type Vec3 = [number, number, number];
type Clump = [number, number, number, number];

const clumps: Clump[] = [
  [-5.2,-18.5,.62,.26],[-3.3,-18.7,.66,.74],[-1.3,-18.4,.63,.38],[.8,-18.6,.68,.82],[2.9,-18.4,.64,.17],[5.0,-18.6,.66,.59],
  [-4.5,-16.2,.68,.71],[-2.5,-16.1,.72,.22],[-.4,-16.3,.69,.85],[1.7,-16.1,.74,.39],[3.8,-16.2,.70,.63],
  [-5.2,-14.0,.73,.14],[-3.3,-14.1,.68,.62],[-1.4,-13.9,.76,.34],[.7,-14.0,.72,.78],[2.8,-14.1,.76,.46],[4.9,-13.8,.70,.91],
  [-4.5,-12.0,.80,.58],[-2.5,-11.8,.86,.20],[-.35,-12.1,.79,.83],[1.8,-11.9,.85,.41],[4.0,-12.0,.82,.70],
  [-5.1,-9.9,.91,.28],[-3.05,-9.7,.88,.76],[-.9,-9.8,.96,.36],[1.5,-9.7,.90,.89],[3.8,-9.9,.94,.53],[5.6,-9.6,.86,.18],
  [-4.5,-7.5,1.02,.67],[-2.15,-7.2,1.08,.24],[.25,-7.5,1.00,.82],[2.65,-7.2,1.09,.38],[5.0,-7.4,1.02,.72],
  [-5.1,-4.7,1.15,.19],[-2.55,-4.9,1.10,.71],[-.05,-4.5,1.24,.45],[2.75,-4.8,1.17,.88],[5.25,-4.5,1.12,.31],
  [-4.55,-1.7,1.29,.74],[-1.75,-1.45,1.20,.25],[1.12,-1.8,1.38,.62],[4.1,-1.4,1.28,.16],
  [-5.2,1.6,1.38,.40],[-2.3,1.8,1.48,.82],[.95,1.55,1.43,.23],[4.25,1.9,1.52,.68],
  [-4.6,5.0,1.58,.78],[-1.1,4.8,1.68,.34],[2.55,5.1,1.62,.61],[5.8,4.7,1.55,.18],
  [-3.8,8.5,1.72,.29],[-.1,8.1,1.82,.73],[3.8,8.4,1.78,.45],
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

  const segments = 7;
  const blade = new Float32Array((segments + 1) * 4);
  for (let i=0;i<=segments;i+=1) blade.set([-1,i/segments,1,i/segments], i*4);

  const totalWeight = clumps.reduce((sum, clump) => sum + clump[2] * clump[2], 0);
  const counts = clumps.map((clump) => Math.floor(requested * clump[2] * clump[2] / totalWeight));
  let count = counts.reduce((sum, value) => sum + value, 0);
  for (let i=0;count<requested;i=(i+1)%counts.length) { counts[i] += 1; count += 1; }
  const instances = new Float32Array(count * 11);
  let index = 0;

  clumps.forEach(([centerX,centerZ,radius,variation], clumpIndex) => {
    const clumpPhase = seeded(clumpIndex, 20) * Math.PI * 2;
    const foreground = Math.max(0, Math.min(1, (centerZ + 1) / 9.5));
    const scaledRadius = radius * 1.33 * (1 - foreground * .12);
    const verticalScale = 1 - foreground * .52;
    for (let bladeIndex=0;bladeIndex<counts[clumpIndex];bladeIndex+=1) {
      const offset = index * 11;
      const angle = seeded(index, 1) * Math.PI * 2;
      const rootDistance = Math.sqrt(seeded(index, 2)) * scaledRadius * .58;
      const rootRatio = rootDistance / (scaledRadius * .58);
      const rootLift = .025 + Math.sqrt(Math.max(0, 1 - rootRatio * rootRatio)) * scaledRadius * .27 * verticalScale;
      const height = scaledRadius * (.58 + seeded(index, 3) * .62) * (.97 + variation * .08) * verticalScale;
      instances[offset] = centerX + Math.cos(angle) * rootDistance;
      instances[offset+1] = rootLift;
      instances[offset+2] = centerZ + Math.sin(angle) * rootDistance;
      instances[offset+3] = height;
      instances[offset+4] = .006 + seeded(index, 4) * .012;
      instances[offset+5] = angle + (seeded(index, 5) - .5) * 1.32;
      instances[offset+6] = instances[offset+5] + Math.PI * .5 + (seeded(index, 6) - .5) * .46;
      instances[offset+7] = seeded(index, 7) * Math.PI * 2;
      instances[offset+8] = .18 + seeded(index, 8) * .82;
      instances[offset+9] = clumpPhase;
      instances[offset+10] = Math.min(.98, .20 + Math.pow(seeded(index, 9), .72) * .68 + foreground * .14);
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
  const requested = matchMedia("(max-width:700px)").matches ? 92000 : 138000;
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
