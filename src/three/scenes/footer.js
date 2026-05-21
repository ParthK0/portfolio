/**
 * scenes/footer.js
 * Water surface ripple shader — looking up from under the ocean.
 * This shader is the most important visual element in Atlantis.
 */
import * as THREE from 'three';

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec2  uResolution;
  varying vec2  vUv;

  // Hash + noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p  = p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // Ripple distortion
    float t  = uTime * 0.35;
    float n  = fbm(uv * 3.5 + t);
    float n2 = fbm(uv * 5.0 - t * 0.7 + 4.3);
    vec2  distort = vec2(n - 0.5, n2 - 0.5) * 0.06;

    // Ocean deep dark blue-green
    vec3 deepColor    = vec3(0.039, 0.055, 0.098);  // #0A0E19
    vec3 surfaceColor = vec3(0.05,  0.25,  0.25);   // teal
    vec3 lightRay     = vec3(0.113, 0.62,  0.459);  // #1D9E75 teal

    // Caustic-like light pattern
    float caustic = fbm((uv + distort) * 6.0 + t * 0.5);
    caustic = pow(caustic, 3.0) * 1.5;

    // Radial light shaft from top center
    float dist = length(uv - vec2(0.5, 1.0));
    float shaft = exp(-dist * 2.5) * (0.3 + 0.1 * sin(t * 1.5 + uv.x * 8.0));

    vec3 col = deepColor;
    col = mix(col, surfaceColor, fbm(uv * 2.0 + distort + t * 0.2) * 0.35);
    col += lightRay * caustic * 0.18;
    col += lightRay * shaft * 0.25;

    // Vignette
    float vignette = smoothstep(1.2, 0.3, dist * 1.4);
    col *= vignette;

    // Soft purple accent near edges
    col += vec3(0.157, 0.149, 0.435) * (1.0 - vignette) * 0.08;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createFooterScene() {
  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const geo = new THREE.PlaneGeometry(2, 2);
  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
  });

  scene.add(new THREE.Mesh(geo, mat));

  function update(t, { width, height } = {}) {
    mat.uniforms.uTime.value = t * 0.001;
    if (width && height) {
      mat.uniforms.uResolution.value.set(width, height);
    }
  }

  return { scene, camera, update };
}
