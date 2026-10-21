import { ScrollTrigger } from "gsap/ScrollTrigger";

const FRAME_COUNT = 240;
const LOAD_WORKERS = 6;

function frameSrc(index) {
  const id = String(index + 1).padStart(4, "0");
  return `/ice-cream/frame_${id}.jpg`;
}

export function initIceCream() {
  const section = document.querySelector("#ice-cream");
  const canvas = document.querySelector("#ice-frames");
  if (!section || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const images = new Array(FRAME_COUNT);
  let wanted = 0;
  let drawn = -1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      drawn = -1;
    }
  }

  function nearest(index) {
    const ready = (image) => image && image.complete && image.naturalWidth > 0;
    if (ready(images[index])) return images[index];
    for (let offset = 1; offset < FRAME_COUNT; offset += 1) {
      if (ready(images[index - offset])) return images[index - offset];
      if (ready(images[index + offset])) return images[index + offset];
    }
    return null;
  }

  function paint(index) {
    const image = nearest(index);
    if (!image) return;
    resize();
    const width = canvas.width;
    const height = canvas.height;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(
      image,
      (width - drawWidth) / 2,
      (height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
    drawn = index;
  }

  function show(index) {
    const next = Math.min(FRAME_COUNT - 1, Math.max(0, index));
    wanted = next;
    if (next !== drawn) paint(next);
  }

  function load(index) {
    return new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (index === wanted || drawn < 0) paint(wanted);
        resolve();
      };
      image.onerror = () => resolve();
      image.src = frameSrc(index);
      images[index] = image;
    });
  }

  async function preload() {
    const opening = FRAME_COUNT - 1;
    await load(opening);
    show(opening);
    const queue = [];
    for (let index = FRAME_COUNT - 2; index >= 0; index -= 1) queue.push(index);
    async function worker() {
      while (queue.length > 0) {
        const index = queue.shift();
        await load(index);
      }
    }
    await Promise.all(Array.from({ length: LOAD_WORKERS }, () => worker()));
    paint(wanted);
  }

  function syncToScroll() {
    const spacer = section.parentElement?.classList.contains("pin-spacer")
      ? section.parentElement
      : section;
    const rect = spacer.getBoundingClientRect();
    const travel = Math.max(1, spacer.offsetHeight - window.innerHeight);
    const passed = Math.min(travel, Math.max(0, -rect.top));
    const progress = passed / travel;
    const scatteredFirst = FRAME_COUNT - 1 - Math.round(progress * (FRAME_COUNT - 1));
    show(scatteredFirst);

    const coveringHeader = rect.top < 72 && rect.bottom > 80;
    document.body.classList.toggle("show-ice", coveringHeader);
    if (coveringHeader) {
      document.querySelector("#site-nav")?.classList.remove("is-open");
      const toggle = document.querySelector(".menu-toggle");
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.setAttribute("aria-label", "Open menu");
    }
  }

  ScrollTrigger.create({
    id: "ice-sequence",
    trigger: section,
    start: "top top",
    end: "+=320%",
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    scrub: true,
    onUpdate: syncToScroll,
  });

  window.addEventListener("scroll", syncToScroll, { passive: true });
  syncToScroll();

  const observer = new ResizeObserver(() => {
    drawn = -1;
    paint(wanted);
  });
  observer.observe(canvas);

  preload();
}
