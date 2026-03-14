const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;
const easeOutCubic = (value) => 1 - Math.pow(1 - clamp(value), 3);
const easeInOutCubic = (value) => {
  const clamped = clamp(value);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
};

const PHOTO_SLOTS = {
  portraitOne: {
    defaultSrc: "assets/dhruv-deeksha-1.jpg",
    storageKey: "royal-wedding-photo-one"
  },
  portraitTwo: {
    defaultSrc: "assets/dhruv-deeksha-2.jpg",
    storageKey: "royal-wedding-photo-two"
  }
};

const studio = document.querySelector("[data-studio]");
const studioToggle = document.querySelector("[data-toggle-studio]");
const photoTargets = [...document.querySelectorAll("[data-photo-target]")];
const photoUrlInputs = [...document.querySelectorAll("[data-photo-url]")];
const photoFileInputs = [...document.querySelectorAll("[data-photo-file]")];
const clearPhotosButton = document.querySelector("[data-clear-photos]");
const scenes = [...document.querySelectorAll("[data-scene]")];
const revealNodes = [...document.querySelectorAll("[data-reveal]")];
const tiltCards = [...document.querySelectorAll(".interactive-tilt")];
const sceneStates = scenes.map((scene) => ({
  scene,
  top: 0,
  range: 1,
  targetProgress: 0,
  progress: 0,
  targetPresence: 0,
  presence: 0
}));

const photoFrames = Object.fromEntries(
  Object.keys(PHOTO_SLOTS).map((slot) => [
    slot,
    photoTargets.filter((target) => target.dataset.photoTarget === slot)
  ])
);

function getStudioToggleLabel(isOpen) {
  if (window.innerWidth <= 820) {
    return isOpen ? "Close portraits" : "Portraits";
  }

  return isOpen ? "Close portrait studio" : "Load your portraits";
}

function createImageProbe(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(source);
    image.onerror = reject;
    image.src = source;
  });
}

function setFrameState(slot, source, isLoaded) {
  const frames = photoFrames[slot] || [];

  frames.forEach((frame) => {
    const image = frame.querySelector("[data-photo-img]");
    if (image && source) {
      image.src = source;
    }
    frame.classList.toggle("is-loaded", isLoaded);
  });
}

async function applyPhotoSource(slot, source, persist = false) {
  const slotConfig = PHOTO_SLOTS[slot];
  if (!slotConfig) {
    return;
  }

  if (!source) {
    setFrameState(slot, slotConfig.defaultSrc, false);
    return;
  }

  try {
    await createImageProbe(source);
    setFrameState(slot, source, true);
    if (persist) {
      localStorage.setItem(slotConfig.storageKey, source);
    }
  } catch (error) {
    const isDefault = source === slotConfig.defaultSrc;
    if (persist) {
      localStorage.removeItem(slotConfig.storageKey);
    }
    setFrameState(slot, slotConfig.defaultSrc, false);
    if (!isDefault) {
      try {
        await createImageProbe(slotConfig.defaultSrc);
        setFrameState(slot, slotConfig.defaultSrc, true);
      } catch (fallbackError) {
        setFrameState(slot, slotConfig.defaultSrc, false);
      }
    }
  }
}

async function compressFile(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const instance = new Image();
      instance.onload = () => resolve(instance);
      instance.onerror = reject;
      instance.src = objectUrl;
    });

    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function syncUrlInputValues() {
  photoUrlInputs.forEach((input) => {
    const slot = input.dataset.photoUrl;
    const storedValue = localStorage.getItem(PHOTO_SLOTS[slot].storageKey) || "";
    input.value = storedValue.startsWith("data:") ? "" : storedValue;
  });
}

async function initializePhotos() {
  const initializations = Object.entries(PHOTO_SLOTS).map(async ([slot, config]) => {
    const storedValue = localStorage.getItem(config.storageKey);
    const source = storedValue || config.defaultSrc;
    await applyPhotoSource(slot, source, false);
  });

  await Promise.all(initializations);
  syncUrlInputValues();
}

function toggleStudio(forceValue) {
  const shouldOpen = typeof forceValue === "boolean" ? forceValue : !studio.classList.contains("is-open");
  studio.classList.toggle("is-open", shouldOpen);
  if (studioToggle) {
    studioToggle.textContent = getStudioToggleLabel(shouldOpen);
    studioToggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  }
}

studioToggle?.addEventListener("click", () => {
  toggleStudio();
});

document.addEventListener("click", (event) => {
  if (!studio.classList.contains("is-open")) {
    return;
  }

  if (studio.contains(event.target)) {
    return;
  }

  toggleStudio(false);
});

clearPhotosButton?.addEventListener("click", async () => {
  Object.values(PHOTO_SLOTS).forEach(({ storageKey }) => {
    localStorage.removeItem(storageKey);
  });

  await initializePhotos();
});

photoUrlInputs.forEach((input) => {
  input.addEventListener("change", async () => {
    const slot = input.dataset.photoUrl;
    const value = input.value.trim();

    if (!value) {
      localStorage.removeItem(PHOTO_SLOTS[slot].storageKey);
      await applyPhotoSource(slot, PHOTO_SLOTS[slot].defaultSrc, false);
      return;
    }

    await applyPhotoSource(slot, value, true);
  });
});

photoFileInputs.forEach((input) => {
  input.addEventListener("change", async () => {
    const slot = input.dataset.photoFile;
    const [file] = input.files || [];

    if (!file) {
      return;
    }

    const compressedDataUrl = await compressFile(file);

    try {
      localStorage.setItem(PHOTO_SLOTS[slot].storageKey, compressedDataUrl);
    } catch (error) {
      console.warn("Could not persist the uploaded image in localStorage.", error);
    }

    await applyPhotoSource(slot, compressedDataUrl, false);
    syncUrlInputValues();
  });
});

function applySceneState(scene, progress, presence) {
  const viewportWidth = window.innerWidth;
  const phone = viewportWidth <= 640;
  const compact = viewportWidth <= 820;
  const motionScale = compact ? 0.52 : 1;
  const driftScale = compact ? 0.5 : 1;

  scene.style.setProperty("--progress", progress.toFixed(4));
  scene.style.setProperty("--lift-soft", `${(1 - progress) * 42 * motionScale}px`);
  scene.style.setProperty("--lift-strong", `${(1 - progress) * 100 * motionScale}px`);
  scene.style.setProperty("--drift-left", `${(0.5 - progress) * 92 * driftScale}px`);
  scene.style.setProperty("--drift-right", `${(progress - 0.5) * 92 * driftScale}px`);
  scene.style.setProperty("--rotate-left", `${(-8 + progress * 8).toFixed(2)}deg`);
  scene.style.setProperty("--rotate-right", `${(8 - progress * 8).toFixed(2)}deg`);
  scene.style.setProperty("--fade", `${(compact ? 0.54 : 0.24) + presence * (compact ? 0.46 : 0.76)}`);
  scene.style.setProperty("--photo-scale", `${compact ? 0.99 : 0.94 + progress * 0.1}`);

  if (scene.classList.contains("hero")) {
    const open = easeOutCubic(progress / (phone ? 0.26 : 0.34));
    const curtain = easeInOutCubic((progress - (phone ? 0.015 : 0.03)) / (phone ? 0.23 : 0.3));
    const screen = easeOutCubic((progress - (phone ? 0.07 : 0.12)) / (phone ? 0.16 : 0.2));
    const reveal = easeOutCubic((progress - (phone ? 0.09 : 0.16)) / (phone ? 0.22 : 0.32));
    const copy = easeOutCubic((progress - (phone ? 0.5 : 0.3)) / (phone ? 0.16 : 0.26));
    const settle = easeOutCubic((progress - (phone ? 0.62 : 0.56)) / (phone ? 0.12 : 0.22));
    const release = easeOutCubic((progress - (phone ? 0.72 : 0.8)) / (phone ? 0.14 : 0.18));
    const copyX = phone ? -50 + copy * 50 : compact ? -50 : -64 + copy * 64;
    const copyY = phone ? (1 - copy) * 34 : compact ? (1 - copy) * 56 : (1 - copy) * 92;
    const cue = 1 - clamp((progress - (phone ? 0.34 : 0.42)) / (phone ? 0.18 : 0.26));

    scene.style.setProperty("--hero-open", open.toFixed(4));
    scene.style.setProperty("--hero-curtain", curtain.toFixed(4));
    scene.style.setProperty("--hero-screen", screen.toFixed(4));
    scene.style.setProperty("--hero-reveal", reveal.toFixed(4));
    scene.style.setProperty("--hero-copy", copy.toFixed(4));
    scene.style.setProperty("--hero-settle", settle.toFixed(4));
    scene.style.setProperty("--hero-release", release.toFixed(4));
    scene.style.setProperty("--hero-copy-x", compact ? `${copyX.toFixed(2)}%` : `${copyX.toFixed(2)}px`);
    scene.style.setProperty("--hero-copy-y", `${copyY.toFixed(2)}px`);
    scene.style.setProperty("--hero-cue", cue.toFixed(4));
  }
}

function updateSceneTargets() {
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;

  sceneStates.forEach((state) => {
    const rectTop = state.top - scrollY;
    state.targetProgress = clamp((scrollY - state.top) / state.range);
    state.targetPresence = clamp((viewportHeight - rectTop) / (viewportHeight * 0.9));
  });
}

function refreshSceneMetrics(syncImmediately = false) {
  sceneStates.forEach((state) => {
    state.top = state.scene.offsetTop;
    state.range = Math.max(state.scene.offsetHeight - window.innerHeight, 1);
  });

  updateSceneTargets();

  if (syncImmediately) {
    sceneStates.forEach((state) => {
      state.progress = state.targetProgress;
      state.presence = state.targetPresence;
      applySceneState(state.scene, state.progress, state.presence);
    });
  }
}

let sceneAnimationFrame = 0;

function animateScenes() {
  const phone = window.innerWidth <= 640;
  const compact = window.innerWidth <= 820;
  const easing = phone ? 0.34 : compact ? 0.24 : 0.18;
  let shouldContinue = false;

  sceneStates.forEach((state) => {
    state.progress = lerp(state.progress, state.targetProgress, easing);
    state.presence = lerp(state.presence, state.targetPresence, easing);

    if (Math.abs(state.progress - state.targetProgress) < 0.0006) {
      state.progress = state.targetProgress;
    } else {
      shouldContinue = true;
    }

    if (Math.abs(state.presence - state.targetPresence) < 0.0006) {
      state.presence = state.targetPresence;
    } else {
      shouldContinue = true;
    }

    applySceneState(state.scene, state.progress, state.presence);
  });

  if (shouldContinue) {
    sceneAnimationFrame = window.requestAnimationFrame(animateScenes);
  } else {
    sceneAnimationFrame = 0;
  }
}

function requestSceneUpdate() {
  updateSceneTargets();

  if (sceneAnimationFrame) {
    return;
  }

  sceneAnimationFrame = window.requestAnimationFrame(animateScenes);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    threshold: 0.18
  }
);

revealNodes.forEach((node) => {
  revealObserver.observe(node);
});

tiltCards.forEach((card) => {
  const resetTilt = () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--shine-x", "50%");
    card.style.setProperty("--shine-y", "50%");
  };

  resetTilt();

  card.addEventListener("pointermove", (event) => {
    if (window.innerWidth < 960) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width;
    const offsetY = (event.clientY - rect.top) / rect.height;
    const tiltX = (0.5 - offsetY) * 8;
    const tiltY = (offsetX - 0.5) * 10;

    card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    card.style.setProperty("--shine-x", `${(offsetX * 100).toFixed(2)}%`);
    card.style.setProperty("--shine-y", `${(offsetY * 100).toFixed(2)}%`);
  });

  card.addEventListener("pointerleave", resetTilt);
});

function startCanvasAtmosphere() {
  const canvas = document.getElementById("luxCanvas");
  const context = canvas?.getContext("2d");
  const particles = [];
  let width = 0;
  let height = 0;
  let frameHandle = 0;
  let lastFrameTime = 0;

  if (!canvas || !context || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    const compact = width <= 820;
    const ratio = Math.min(window.devicePixelRatio || 1, compact ? 1.1 : 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function seedParticles() {
    particles.length = 0;
    const compact = width <= 820;
    const count = compact ? Math.max(12, Math.round(width / 46)) : Math.max(22, Math.round(width / 36));

    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1 + Math.random() * 3.6,
        speed: 0.12 + Math.random() * 0.38,
        drift: (Math.random() - 0.5) * 0.18,
        alpha: 0.08 + Math.random() * 0.22,
        hue: Math.random() > 0.52 ? "gold" : "rose"
      });
    }
  }

  function renderAtmosphere(timestamp = 0) {
    const compact = width <= 820;
    const frameInterval = compact ? 1000 / 24 : 1000 / 30;

    if (document.hidden) {
      frameHandle = window.requestAnimationFrame(renderAtmosphere);
      return;
    }

    if (timestamp - lastFrameTime < frameInterval) {
      frameHandle = window.requestAnimationFrame(renderAtmosphere);
      return;
    }

    const delta = lastFrameTime ? (timestamp - lastFrameTime) / 16.67 : 1;
    lastFrameTime = timestamp;
    context.clearRect(0, 0, width, height);

    const beam = context.createLinearGradient(0, 0, width, height);
    beam.addColorStop(0, "rgba(242, 208, 141, 0.02)");
    beam.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
    beam.addColorStop(1, "rgba(185, 109, 134, 0.03)");
    context.fillStyle = beam;
    context.fillRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.y -= particle.speed * delta;
      particle.x += particle.drift * delta;

      if (particle.y < -10) {
        particle.y = height + 10;
      }

      if (particle.x < -10) {
        particle.x = width + 10;
      } else if (particle.x > width + 10) {
        particle.x = -10;
      }

      const gradient = context.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius * 5
      );

      if (particle.hue === "gold") {
        gradient.addColorStop(0, `rgba(242, 208, 141, ${particle.alpha})`);
      } else {
        gradient.addColorStop(0, `rgba(255, 199, 214, ${particle.alpha})`);
      }

      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius * 5, 0, Math.PI * 2);
      context.fill();
    });

    frameHandle = window.requestAnimationFrame(renderAtmosphere);
  }

  resizeCanvas();
  seedParticles();
  frameHandle = window.requestAnimationFrame(renderAtmosphere);

  window.addEventListener("resize", () => {
    resizeCanvas();
    seedParticles();
    lastFrameTime = 0;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      return;
    }

    lastFrameTime = 0;

    if (!frameHandle) {
      frameHandle = window.requestAnimationFrame(renderAtmosphere);
    }
  });
}

async function bootInvitation() {
  await initializePhotos();
  refreshSceneMetrics(true);
  startCanvasAtmosphere();
  toggleStudio(false);

  window.addEventListener("scroll", requestSceneUpdate, { passive: true });
  window.addEventListener("resize", () => {
    refreshSceneMetrics(true);
    if (studioToggle) {
      studioToggle.textContent = getStudioToggleLabel(studio.classList.contains("is-open"));
    }
  });
  window.addEventListener("orientationchange", () => {
    refreshSceneMetrics(true);
    if (studioToggle) {
      studioToggle.textContent = getStudioToggleLabel(studio.classList.contains("is-open"));
    }
  });
}

bootInvitation();
