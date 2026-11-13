import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  Vector2,
  type Camera,
} from "three";
import { sky } from "@/lib/sky-store";
import { STAR_COLORS, mulberry32, pickColorIndex } from "./star-utils";

/**
 * The WebGL sky, in plain three.js (mounted into the R3F scene by
 * StarfieldWebGL.tsx): 3 Points layers (one draw call each), an fbm nebula
 * plane and a meteor streak. Everything is procedural — no textures.
 */

/* --------------------------------- layers --------------------------------- */

interface LayerSpec {
  count: number;
  /** Diameter range, CSS px. */
  size: readonly [number, number];
  opacity: number;
  /** Mouse parallax amplitude, CSS px. */
  parallax: number;
  /** Distance range from the camera at z = 0. */
  depth: readonly [number, number];
  /** How much of the camera-speed stretch this layer takes (near stars only). */
  stretch: number;
}

const LAYERS: readonly LayerSpec[] = [
  { count: 1200, size: [0.6, 1], opacity: 0.5, parallax: 3, depth: [320, 640], stretch: 0 },
  { count: 400, size: [1, 1.5], opacity: 0.75, parallax: 7, depth: [170, 320], stretch: 0 },
  { count: 80, size: [2, 2.5], opacity: 1, parallax: 12, depth: [70, 170], stretch: 1 },
];

const CAMERA_PUSH = -40; // act 1: camera z 0 → -40
const MAX_STRETCH = 1.5;
const PARALLAX_LERP = 0.05;
const DIM_BRIGHTNESS = 0.4; // act 4
const FAST_SCROLL = 900; // px/s: no meteors above this

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};
const glsl = (hex: string) =>
  `vec3(${hexToRgb(hex)
    .map((c) => c.toFixed(4))
    .join(", ")})`;

const STAR_VERT = /* glsl */ `
  // position = (u, v, depth): u/v are the star's NDC position when the camera is at z = 0.
  attribute vec3 aColor;
  attribute vec3 aStar; // size (css px), twinkle seed, twinkle speed (0 = steady)

  uniform float uTime;
  uniform float uDpr;
  uniform float uCamZ;
  uniform vec2 uDepth;   // near, far
  uniform vec2 uRes;     // css px
  uniform vec2 uOffset;  // mouse parallax, css px
  uniform float uOpacity;
  uniform float uBrightness;
  uniform float uStretch;
  uniform float uAspect;
  uniform float uGather;
  uniform vec2 uTarget;  // contact button, NDC

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSize;
  varying vec2 vDir;

  void main() {
    // Perspective by hand: the star keeps its world x/y while the camera moves
    // along z. Stars that pass the camera wrap to the far end of their layer.
    float d0 = position.z;
    float range = uDepth.y - uDepth.x;
    float depth = uDepth.x + mod(d0 - uDepth.x + uCamZ, range);
    vec2 ndc = position.xy * d0 / depth;

    ndc += uOffset * 2.0 / uRes;

    // Act 5: drift toward the contact button, each star by a different amount.
    float pull = uGather * (0.2 + 0.4 * fract(aStar.y * 7.31));
    ndc = mix(ndc, uTarget, pull);

    gl_Position = vec4(ndc, 0.0, 1.0);

    float twinkle = aStar.z > 0.0
      ? mix(0.6, 1.0, 0.5 + 0.5 * sin(uTime * aStar.z + aStar.y))
      : 1.0;
    float size = aStar.x;
    // Sub-pixel stars keep a 1px footprint and get dimmer instead.
    vAlpha = uOpacity * uBrightness * twinkle * min(1.0, size * size);
    vSize = max(size, 1.0) * uDpr;
    vDir = normalize(ndc * vec2(uAspect, 1.0) + vec2(1e-5));
    vColor = aColor;
    gl_PointSize = vSize * uStretch + 2.0;
  }
`;

const STAR_FRAG = /* glsl */ `
  uniform float uStretch;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSize;
  varying vec2 vDir;

  void main() {
    vec2 p = (gl_PointCoord - 0.5) * (vSize * uStretch + 2.0);
    p.y = -p.y;
    // Ellipse stretched along the direction of travel (away from the centre).
    float along = dot(p, vDir) / uStretch;
    float across = dot(p, vec2(-vDir.y, vDir.x));
    float d = length(vec2(along, across));
    float a = 1.0 - smoothstep(vSize * 0.5 - 0.75, vSize * 0.5 + 0.75, d);
    if (a <= 0.003) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

const NEBULA_VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const NEBULA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec2 uRes; // device px
  uniform float uBrightness;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes.y;
    // Slow drift on a 60s cycle.
    float t = uTime * 6.2831853 / 60.0;
    vec2 drift = 0.3 * vec2(cos(t), sin(t));
    float n1 = fbm(uv * 1.3 + drift);
    float n2 = fbm(uv * 2.1 - drift * 1.4 + 5.2);

    vec3 col = mix(${glsl("#1B2A4A")}, ${glsl("#3A2560")}, smoothstep(0.3, 0.7, n2));
    col = mix(col, ${glsl("#6EE7F2")}, 0.22 * smoothstep(0.55, 0.85, n1 * n2 * 2.2));

    // Opacity .12–.18 inside the clouds, 0 between them.
    float alpha = mix(0.12, 0.18, n2) * smoothstep(0.3, 0.7, n1);
    gl_FragColor = vec4(col, alpha * uBrightness);
  }
`;

const METEOR_VERT = /* glsl */ `
  uniform vec2 uRes;   // css px
  uniform vec2 uHead;  // css px, origin top-left
  uniform vec2 uDir;   // unit vector, y down
  uniform float uLength;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec2 normal = vec2(-uDir.y, uDir.x);
    vec2 p = uHead - uDir * uLength * (1.0 - uv.x) + normal * (uv.y - 0.5) * 2.0;
    gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
  }
`;

const METEOR_FRAG = /* glsl */ `
  uniform float uAlpha;
  varying vec2 vUv;

  void main() {
    // White head → transparent tail, soft across the width.
    float a = vUv.x * vUv.x * (1.0 - abs(vUv.y - 0.5) * 2.0);
    gl_FragColor = vec4(1.0, 1.0, 1.0, a * uAlpha);
  }
`;

function makeLayer(spec: LayerSpec, index: number) {
  const rand = mulberry32(977 + index * 131);
  const position = new Float32Array(spec.count * 3);
  const color = new Float32Array(spec.count * 3);
  const star = new Float32Array(spec.count * 3);
  const palette = STAR_COLORS.map(hexToRgb);

  for (let i = 0; i < spec.count; i++) {
    // Slightly wider than the screen so parallax / gathering never show an edge.
    position[i * 3] = (rand() * 2 - 1) * 1.25;
    position[i * 3 + 1] = (rand() * 2 - 1) * 1.25;
    position[i * 3 + 2] = spec.depth[0] + rand() * (spec.depth[1] - spec.depth[0]);

    color.set(palette[pickColorIndex(rand())], i * 3);

    star[i * 3] = spec.size[0] + rand() * (spec.size[1] - spec.size[0]);
    star[i * 3 + 1] = rand() * Math.PI * 2;
    // 30% twinkle, period 2–5s.
    star[i * 3 + 2] = rand() < 0.3 ? (Math.PI * 2) / (2 + rand() * 3) : 0;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(position, 3));
  geometry.setAttribute("aColor", new BufferAttribute(color, 3));
  geometry.setAttribute("aStar", new BufferAttribute(star, 3));

  const material = new ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uDpr: { value: 1 },
      uCamZ: { value: 0 },
      uDepth: { value: new Vector2(spec.depth[0], spec.depth[1]) },
      uRes: { value: new Vector2(1, 1) },
      uOffset: { value: new Vector2() },
      uOpacity: { value: spec.opacity },
      uBrightness: { value: 1 },
      uStretch: { value: 1 },
      uAspect: { value: 1 },
      uGather: { value: 0 },
      uTarget: { value: new Vector2() },
    },
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 1 + index;
  return { spec, points, material, geometry };
}

/* ---------------------------------- scene --------------------------------- */

export interface SkyFrame {
  /** Seconds since the previous rendered frame. */
  dt: number;
  /** Canvas size in CSS px. */
  width: number;
  height: number;
  dpr: number;
  camera: Camera;
}

export interface SkyScene {
  group: Group;
  update: (frame: SkyFrame) => void;
  dispose: () => void;
}

export function createSkyScene(): SkyScene {
  const group = new Group();
  const layers = LAYERS.map(makeLayer);

  const plane = new PlaneGeometry(2, 2);
  const nebulaMaterial = new ShaderMaterial({
    vertexShader: NEBULA_VERT,
    fragmentShader: NEBULA_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uRes: { value: new Vector2(1, 1) },
      uBrightness: { value: 1 },
    },
  });
  const nebula = new Mesh(plane, nebulaMaterial);
  nebula.frustumCulled = false;
  nebula.renderOrder = 0;

  const meteorGeometry = new PlaneGeometry(1, 1);
  const meteorMaterial = new ShaderMaterial({
    vertexShader: METEOR_VERT,
    fragmentShader: METEOR_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRes: { value: new Vector2(1, 1) },
      uHead: { value: new Vector2() },
      uDir: { value: new Vector2(1, 0) },
      uLength: { value: 0 },
      uAlpha: { value: 0 },
    },
  });
  const meteor = new Mesh(meteorGeometry, meteorMaterial);
  meteor.frustumCulled = false;
  meteor.renderOrder = 10;
  meteor.visible = false;

  group.add(nebula, ...layers.map((l) => l.points), meteor);

  /* ------------------------------ frame state ----------------------------- */

  const pointer = { x: 0, y: 0 }; // -1..1, y down
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  let time = 0;
  let nebulaTime = 0;
  let brightness = 1;
  let stretch = 1;
  let lastCamZ = sky.push * CAMERA_PUSH;
  let lastScroll = window.scrollY;
  let scrollSpeed = 0;
  let target: Element | null = null;

  const METEOR_MS = 0.6;
  const METEOR_TAIL = 120;
  const METEOR_TRAVEL = 460;
  const nextMeteorDelay = () => 8 + Math.random() * 7;
  let meteorAt = nextMeteorDelay();
  let meteorT = -1; // seconds into the current streak, -1 = idle
  const meteorStart = new Vector2();
  const meteorDir = new Vector2();

  function update({ dt, width, height, dpr, camera }: SkyFrame) {
    time += dt;

    // Scroll speed, measured here so it also decays to 0 when scrolling stops.
    const scroll = window.scrollY;
    scrollSpeed = Math.abs(scroll - lastScroll) / Math.max(dt, 1e-3);
    lastScroll = scroll;

    // Act 4: dim to 40%, freeze the nebula, hold the meteors.
    const paused = sky.dim > 0.5;
    brightness += (1 - (1 - DIM_BRIGHTNESS) * sky.dim - brightness) * 0.1;
    if (!paused) nebulaTime += dt;

    // Act 1: the camera pushes into the stars; near stars stretch with its speed.
    const camZ = sky.push * CAMERA_PUSH;
    camera.position.z = camZ;
    const camSpeed = Math.abs(camZ - lastCamZ) / Math.max(dt, 1e-3);
    lastCamZ = camZ;
    const stretchTarget = 1 + (MAX_STRETCH - 1) * Math.min(camSpeed / 24, 1);
    stretch += (stretchTarget - stretch) * 0.18;

    // Act 5: where the contact button is right now, in NDC.
    let tx = 0;
    let ty = 0;
    const gather = sky.gather;
    if (gather > 0.001) {
      if (!target?.isConnected) target = document.querySelector("[data-contact-target]");
      const rect = target?.getBoundingClientRect();
      if (rect) {
        tx = ((rect.left + rect.width / 2) / width) * 2 - 1;
        ty = 1 - ((rect.top + rect.height / 2) / height) * 2;
      }
    }

    for (const { spec, material } of layers) {
      const u = material.uniforms;
      u.uTime.value = time;
      u.uDpr.value = dpr;
      u.uCamZ.value = camZ;
      u.uRes.value.set(width, height);
      u.uAspect.value = width / height;
      u.uBrightness.value = brightness;
      u.uStretch.value = 1 + (stretch - 1) * spec.stretch;
      u.uGather.value = target ? gather : 0;
      u.uTarget.value.set(tx, ty);
      // Stars shift against the pointer; nearer layers shift more.
      const offset = u.uOffset.value as Vector2;
      offset.x += (-pointer.x * spec.parallax - offset.x) * PARALLAX_LERP;
      offset.y += (pointer.y * spec.parallax - offset.y) * PARALLAX_LERP;
    }

    nebulaMaterial.uniforms.uTime.value = nebulaTime;
    nebulaMaterial.uniforms.uRes.value.set(width * dpr, height * dpr);
    nebulaMaterial.uniforms.uBrightness.value = brightness;

    // Meteors: one every 8–15s, 600ms, ~30°; never while scrolling fast.
    const m = meteorMaterial.uniforms;
    if (meteorT < 0 && time >= meteorAt) {
      if (paused || scrollSpeed > FAST_SCROLL) {
        meteorAt = time + 1.5;
      } else {
        meteorT = 0;
        const left = Math.random() < 0.5;
        const angle = ((26 + Math.random() * 8) * Math.PI) / 180;
        meteorDir.set(Math.cos(angle) * (left ? -1 : 1), Math.sin(angle));
        meteorStart.set(
          width * (left ? 0.45 + Math.random() * 0.5 : 0.05 + Math.random() * 0.5),
          height * (0.05 + Math.random() * 0.4),
        );
        m.uDir.value.copy(meteorDir);
        meteor.visible = true;
      }
    }
    if (meteorT >= 0) {
      meteorT += dt;
      const p = meteorT / METEOR_MS;
      if (p >= 1) {
        meteorT = -1;
        meteor.visible = false;
        meteorAt = time + nextMeteorDelay();
      } else {
        m.uRes.value.set(width, height);
        m.uHead.value.copy(meteorStart).addScaledVector(meteorDir, METEOR_TRAVEL * p);
        m.uLength.value = METEOR_TAIL * Math.min(1, p * 4);
        m.uAlpha.value = Math.sin(Math.PI * p) * 0.9 * brightness;
      }
    }
  }

  function dispose() {
    window.removeEventListener("pointermove", onPointerMove);
    for (const layer of layers) {
      layer.geometry.dispose();
      layer.material.dispose();
    }
    plane.dispose();
    nebulaMaterial.dispose();
    meteorGeometry.dispose();
    meteorMaterial.dispose();
  }

  return { group, update, dispose };
}
