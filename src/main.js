import "./style.css";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initIceCream } from "./iceCream.js";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({
  ignoreMobileResize: true,
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
});

const canvas = document.querySelector("#webgl");
const letters = document.querySelectorAll(".headline-1 span:not(.space)");
const letters2 = document.querySelectorAll(".headline-2 span:not(.space)");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function setMenuOpen(open) {
  siteNav.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(!siteNav.classList.contains("is-open"));
});

for (const link of siteNav.querySelectorAll("a")) {
  link.addEventListener("click", () => setMenuOpen(false));
}

const scene = new THREE.Scene();

const skyCanvas = document.createElement("canvas");
const skyContext = skyCanvas.getContext("2d");
const skyTexture = new THREE.CanvasTexture(skyCanvas);
skyTexture.colorSpace = THREE.SRGBColorSpace;
skyTexture.magFilter = THREE.LinearFilter;
skyTexture.minFilter = THREE.LinearFilter;
scene.background = skyTexture;

let skyImage = null;

function layoutSky() {
  const viewAspect = window.innerWidth / Math.max(1, window.innerHeight);
  const width = 1600;
  const height = Math.max(1, Math.round(width / viewAspect));
  skyCanvas.width = width;
  skyCanvas.height = height;
  skyContext.fillStyle = "#8fd0f5";
  skyContext.fillRect(0, 0, width, height);

  if (skyImage) {
    const scale = Math.max(width / skyImage.naturalWidth, height / skyImage.naturalHeight);
    const drawWidth = skyImage.naturalWidth * scale;
    const drawHeight = skyImage.naturalHeight * scale;
    skyContext.drawImage(
      skyImage,
      (width - drawWidth) / 2,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
  }

  skyTexture.needsUpdate = true;
}

const skyLoader = new THREE.TextureLoader();
skyLoader.load("/hero-bg.jpg", (texture) => {
  skyImage = texture.image;
  layoutSky();
});

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: !isMobile(),
  powerPreference: "high-performance",
});
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2));
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

const clock = new THREE.Clock();
const modelState = {
  group: new THREE.Group(),
  float: new THREE.Group(),
  ready: false,
};

modelState.group.position.set(0, -0.7, 1.4);
modelState.group.rotation.set(0.28, 0.12, 0.04);
modelState.group.scale.setScalar(0.74);
modelState.group.add(modelState.float);
scene.add(modelState.group);

function createCookieMaterial(texture, tint = 0xffffff) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    color: tint,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: true,
    fog: false,
    side: THREE.DoubleSide,
  });
}

function createCookie(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;

  const cookie = new THREE.Group();
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 2.7),
    createCookieMaterial(texture)
  );
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 2.7),
    createCookieMaterial(texture, 0xd4a06a)
  );
  back.rotation.y = Math.PI;
  back.position.z = -0.12;
  front.position.z = 0.12;
  cookie.add(front, back);
  cookie.renderOrder = 2;
  return cookie;
}

const cookieLoader = new THREE.TextureLoader();
cookieLoader.load(
  "/cookie.png",
  (texture) => {
    modelState.float.add(createCookie(texture));
    modelState.ready = true;
  },
  undefined,
  (error) => {
    console.error("Failed to load cookie.png", error);
  }
);

gsap
  .timeline({
    scrollTrigger: {
      trigger: ".scroll-track",
      start: "top top",
      end: "bottom bottom",
      scrub: isMobile() ? 0.35 : 0.85,
      invalidateOnRefresh: false,
    },
  })
  .to(
    letters,
    {
      y: () => (isMobile() ? -70 : -110),
      x: 0,
      rotate: 0,
      opacity: 0,
      duration: 0.9,
      stagger: { each: 0.03, from: "center" },
      ease: "power2.in",
    },
    0
  )
  .from(
    letters2,
    {
      y: () => (isMobile() ? 36 : 48),
      x: 0,
      rotate: 0,
      opacity: 0,
      duration: 0.85,
      stagger: { each: 0.03, from: "center" },
      ease: "power2.out",
    },
    1.08
  )
  .to(
    modelState.group.position,
    {
      x: 0,
      y: isMobile() ? 0.28 : 0.05,
      z: isMobile() ? 1.35 : 0.6,
      duration: 1.85,
      ease: "power2.inOut",
    },
    0.12
  )
  .to(
    modelState.group.rotation,
    { x: 0.1, y: 0.52, z: -0.04, duration: 2.15, ease: "power1.inOut" },
    0
  )
  .to(
    modelState.group.scale,
    {
      x: isMobile() ? 0.78 : 1.08,
      y: isMobile() ? 0.78 : 1.08,
      z: isMobile() ? 0.78 : 1.08,
      duration: 1.85,
      ease: "power2.inOut",
    },
    0.12
  );

function tick() {
  const t = clock.getElapsedTime();

  if (modelState.ready) {
    modelState.float.position.y = Math.sin(t * 1.2) * 0.04;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

let lastWidth = window.innerWidth;

function fitScene(forceRefresh = false) {
  const mobile = isMobile();
  const widthChanged = window.innerWidth !== lastWidth;
  lastWidth = window.innerWidth;

  camera.position.z = mobile ? 8.2 : 6;
  camera.fov = mobile ? 42 : 35;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  layoutSky();

  if (forceRefresh || widthChanged) {
    ScrollTrigger.refresh();
  }
  if (!mobile) {
    setMenuOpen(false);
  }
}

initIceCream();
tick();
fitScene(true);

window.addEventListener("resize", () => fitScene(false));
