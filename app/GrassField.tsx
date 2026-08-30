"use client";

import { useEffect, useRef } from "react";

const grassVertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 aBlade;
layout(location=1) in vec2 aOffset;
layout(location=2) in vec4 aParams;
layout(location=3) in vec2 aPhase;
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
  float height = aParams.x;
  float width = aParams.y;
  vec2 windDirection = normalize(vec2(0.76, 0.65));
  vec2 bladeSide = vec2(cos(aParams.z), sin(aParams.z));

  float frontA = sin(dot(aOffset, vec2(0.47, 0.76)) * 0.72 - uTime * 1.34
    + sin(aOffset.x * 0.23 + uTime * 0.27) * 0.42);
  float frontB = sin(dot(aOffset, vec2(-0.22, 0.63)) * 1.38 - uTime * 1.91 + aPhase.x);
  float broad = sin(dot(aOffset, vec2(0.11, 0.18)) * 2.2 - uTime * 0.64 + aPhase.y * 0.12);
  float gust = smoothstep(-0.53, 0.68, frontA);
  float wind = 0.20 + gust * 0.60 + (frontB * 0.5 + 0.5) * 0.13
    + (broad * 0.5 + 0.5) * 0.08;
  wind += sin(uTime * 4.6 + aPhase.x + aOffset.x * 0.37) * 0.034
    + sin(uTime * 7.2 + aPhase.y) * 0.018;
  wind = clamp(wind, 0.16, 1.0);

  float curve = t * t;
  float tip = pow(t, 1.55);
  float taper = pow(max(1.0 - t, 0.0), 0.72);
  vec2 naturalLean = vec2(cos(aPhase.y), sin(aPhase.y)) * height * 0.055 * curve;
  vec2 windOffset = windDirection * height * (0.055 + wind * 0.66) * curve;
  vec2 crossSway = vec2(-windDirection.y, windDirection.x)
    * sin(aPhase.x + uTime * 2.2) * height * 0.025 * curve;

  vec3 world = vec3(
    aOffset.x + naturalLean.x + windOffset.x + crossSway.x,
    height * t * (1.0 - wind * 0.34 * tip),
    aOffset.y + naturalLean.y + windOffset.y + crossSway.y
  );
  world.xz += bladeSide * side * width * taper;

  vec3 tangent = normalize(vec3(
    windDirection.x * wind * 1.14 * tip,
    max(0.24, 1.0 - wind * 0.72 * tip),
    windDirection.y * wind * 1.14 * tip
  ));
  vNormal = normalize(cross(vec3(bladeSide.x, 0.0, bladeSide.y), tangent));
  vWorld = world;
  vT = t;
  vShade = aParams.w;
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
  vec3 sun = normalize(vec3(-0.48, 0.84, 0.30));
  vec3 view = normalize(uCamera - vWorld);
  vec3 halfDirection = normalize(sun + view);
  float direct = max(dot(normal, sun), 0.0);
  float transmitted = pow(max(dot(-normal, sun), 0.0), 1.35);
  float specular = pow(max(dot(normal, halfDirection), 0.0), 22.0);
  float edge = pow(1.0 - abs(dot(normal, view)), 2.2);

  vec3 root = vec3(0.035, 0.185, 0.052);
  vec3 middle = vec3(0.165, 0.405, 0.095);
  vec3 tip = vec3(0.48, 0.67, 0.22);
  vec3 color = mix(root, middle, smoothstep(0.0, 0.55, vT));
  color = mix(color, tip, smoothstep(0.56, 1.0, vT) * 0.64);
  color *= mix(0.72, 1.19, vShade);
  color *= 0.42 + direct * 0.62 + transmitted * 0.22 + edge * 0.08 + vGust * 0.11;
  color += vec3(0.52, 0.65, 0.21) * specular * (0.10 + vGust * 0.32) * vT;
  outColor = vec4(pow(color, vec3(0.92)), 1.0);
}`;

const groundVertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
uniform mat4 uVP;
out vec2 vWorld;
void main() {
  vWorld = aPosition;
  gl_Position = uVP * vec4(aPosition.x, -0.025, aPosition.y, 1.0);
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
  float fine = hash(floor(vWorld * 10.0));
  float broad = sin(vWorld.x * 0.42 + vWorld.y * 0.31) * 0.5 + 0.5;
  vec3 color = mix(vec3(0.055, 0.205, 0.048), vec3(0.17, 0.34, 0.075), broad * 0.45 + fine * 0.12);
  outColor = vec4(color, 1.0);
}`;

type Vec3 = [number, number, number];

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
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function lookAt(eye: Vec3, target: Vec3) {
  const z = normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const x = normalize(cross([0, 1, 0], z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}

function perspective(aspect: number) {
  const near = 0.1;
  const far = 42;
  const f = 1 / Math.tan(Math.PI * 0.1275);
  const range = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0,
    (near + far) * range, -1, 0, 0, near * far * 2 * range, 0,
  ]);
}

function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1]
        + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function grassGeometry(gl: WebGL2RenderingContext, count: number) {
  const vao = gl.createVertexArray();
  const bladeBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  if (!vao || !bladeBuffer || !instanceBuffer) throw new Error("Grass allocation failed");

  const segments = 6;
  const blade = new Float32Array((segments + 1) * 4);
  for (let i = 0; i <= segments; i += 1) {
    const offset = i * 4;
    blade.set([-1, i / segments, 1, i / segments], offset);
  }

  const columns = Math.ceil(Math.sqrt(count * 0.65));
  const rows = Math.ceil(count / columns);
  const instances = new Float32Array(count * 8);
  for (let i = 0; i < count; i += 1) {
    const offset = i * 8;
    const x = i % columns;
    const z = Math.floor(i / columns);
    instances[offset] = ((x + 0.5 + (seeded(i, 1) - 0.5) * 0.86) / columns - 0.5) * 13;
    instances[offset + 1] = ((z + 0.5 + (seeded(i, 2) - 0.5) * 0.86) / rows - 0.5) * 20 - 3.8;
    instances[offset + 2] = 0.56 + Math.pow(seeded(i, 3), 0.68) * 0.67;
    instances[offset + 3] = 0.012 + seeded(i, 4) * 0.022;
    instances[offset + 4] = seeded(i, 5) * Math.PI * 2;
    instances[offset + 5] = 0.18 + seeded(i, 6) * 0.82;
    instances[offset + 6] = seeded(i, 7) * Math.PI * 2;
    instances[offset + 7] = seeded(i, 8) * Math.PI * 2;
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, blade, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, instances, gl.STATIC_DRAW);
  const stride = 8 * Float32Array.BYTES_PER_ELEMENT;
  for (const [location, size, offset] of [[1, 2, 0], [2, 4, 2], [3, 2, 6]]) {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * 4);
    gl.vertexAttribDivisor(location, 1);
  }
  gl.bindVertexArray(null);
  return { vao, bladeBuffer, instanceBuffer, vertices: (segments + 1) * 2 };
}

function groundGeometry(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) throw new Error("Ground allocation failed");
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-9,-16, 9,-16, -9,8, -9,8, 9,-16, 9,8]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { vao, buffer };
}

function start(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, depth: true, powerPreference: "high-performance" });
  if (!gl) return;

  const camera: Vec3 = [0, 6.4, 7.6];
  const grassProgram = program(gl, grassVertex, grassFragment);
  const groundProgram = program(gl, groundVertex, groundFragment);
  const count = matchMedia("(max-width: 700px)").matches ? 66000 : 92000;
  const grass = grassGeometry(gl, count);
  const ground = groundGeometry(gl);
  const view = lookAt(camera, [0, 0.34, -2]);
  const grassVP = gl.getUniformLocation(grassProgram, "uVP");
  const groundVP = gl.getUniformLocation(groundProgram, "uVP");
  const time = gl.getUniformLocation(grassProgram, "uTime");
  const cameraUniform = gl.getUniformLocation(grassProgram, "uCamera");
  if (!grassVP || !groundVP || !time || !cameraUniform) throw new Error("Missing uniforms");

  let frame = 0;
  const started = performance.now();
  const render = (now: number) => {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.65);
    const width = Math.max(1, Math.round(box.width * ratio));
    const height = Math.max(1, Math.round(box.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    const vp = multiply(perspective(width / height), view);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0.08, 0.23, 0.055, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(groundProgram);
    gl.uniformMatrix4fv(groundVP, false, vp);
    gl.bindVertexArray(ground.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.useProgram(grassProgram);
    gl.uniformMatrix4fv(grassVP, false, vp);
    gl.uniform1f(time, (now - started) / 1000);
    gl.uniform3fv(cameraUniform, camera);
    gl.bindVertexArray(grass.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, grass.vertices, count);
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);

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

export function GrassField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      return start(ref.current);
    } catch (error) {
      console.error("Unable to start the grass field", error);
    }
  }, []);

  return (
    <>
      <canvas
        ref={ref}
        className="grass-canvas"
        role="img"
        aria-label="Dense green grass moving continuously in broad diagonal gusts"
      />
      <div className="grass-fallback" aria-hidden="true" />
    </>
  );
}
