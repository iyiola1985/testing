import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector("#webgl");
const letters = document.querySelectorAll(".headline-1 span:not(.space)");
const headline2 = document.querySelector(".headline-2");

function createSkyTexture() {
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 2;
  skyCanvas.height = 512;
  const ctx = skyCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#1d6ec7");
  gradient.addColorStop(0.42, "#5eb4ea");
  gradient.addColorStop(0.72, "#c5e6f8");
  gradient.addColorStop(1, "#f6e7c4");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);

  const texture = new THREE.CanvasTexture(skyCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createCloud(x, y, z, scale) {
  const group = new THREE.Group();
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const puffs = [
    [0, 0, 0, 1],
    [0.85, 0.12, 0.1, 0.78],
    [-0.75, 0.08, -0.08, 0.72],
    [0.18, 0.38, 0.04, 0.55],
    [-0.2, 0.06, 0.32, 0.5],
  ];

  for (const [px, py, pz, size] of puffs) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), material);
    puff.position.set(px, py, pz);
    puff.scale.set(size * 1.45, size * 0.82, size);
    group.add(puff);
  }

  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  return group;
}

const scene = new THREE.Scene();
scene.background = createSkyTexture();
scene.fog = new THREE.Fog(0xc5e6f8, 12, 38);

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.AmbientLight(0xd7ecff, 0.7));
const key = new THREE.DirectionalLight(0xfff4d6, 1.55);
key.position.set(4, 6, 3);
scene.add(key);
scene.add(new THREE.HemisphereLight(0x9ad0ff, 0xf3e2b8, 0.75));
const rim = new THREE.DirectionalLight(0xffffff, 0.45);
rim.position.set(-4, 2, -3);
scene.add(rim);

const clouds = [
  createCloud(-6.2, 2.4, -10, 1.6),
  createCloud(6.8, 1.6, -12, 2.1),
  createCloud(-1.4, 3.2, -16, 1.35),
  createCloud(3.2, -2.4, -14, 1.8),
];
for (const cloud of clouds) {
  scene.add(cloud);
}

const clock = new THREE.Clock();
const modelState = {
  group: new THREE.Group(),
  ready: false,
};

modelState.group.position.set(0, -2.4, 1.2);
modelState.group.rotation.set(0.35, 0.2, 0);
modelState.group.scale.setScalar(0.85);
scene.add(modelState.group);

new GLTFLoader().load(
  "/cookie.glb",
  (gltf) => {
    const model = gltf.scene;
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.material?.map) {
          child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
        }
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const target = 2.2;
    const scale = target / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);

    modelState.group.add(model);
    modelState.ready = true;
  },
  undefined,
  () => {
    const fallback = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.38, 32, 64),
      new THREE.MeshStandardMaterial({
        color: 0xc48a4a,
        roughness: 0.45,
        metalness: 0.05,
      })
    );
    modelState.group.add(fallback);
    modelState.ready = true;
  }
);

gsap
  .timeline({
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
    },
  })
  .to(
    letters,
    {
      y: () => gsap.utils.random(-420, -220),
      x: () => gsap.utils.random(-160, 160),
      rotate: () => gsap.utils.random(-40, 40),
      opacity: 0,
      stagger: { each: 0.03, from: "random" },
      ease: "power2.out",
    },
    0
  )
  .to(headline2, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 0.45)
  .to(modelState.group.position, { x: 0, y: 0.15, z: 0, ease: "none" }, 0)
  .to(modelState.group.rotation, { x: 0.1, y: Math.PI * 2.15, z: 0, ease: "none" }, 0)
  .to(modelState.group.scale, { x: 1, y: 1, z: 1, ease: "none" }, 0);

headline2.style.transform = "translateY(24px)";

function tick() {
  const t = clock.getElapsedTime();
  if (modelState.ready) {
    modelState.group.position.y += Math.sin(t * 1.4) * 0.0018;
  }
  for (const cloud of clouds) {
    cloud.position.x += Math.sin(t * 0.15 + cloud.position.z) * 0.0015;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
