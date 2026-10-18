const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const room = $("#room");
const stage = $("#stage");
const actions = $("#heroActions");

const introLines = [
  "Hi, I'm Yasmeen Eslam.",
  "I build software.",
  "I turn ideas into products.",
  "Welcome to my digital workspace."
];

function initClock() {
  const ticks = $(".ticks");
  for (let i = 0; i < 12; i++) {
    const tick = document.createElement("i");
    tick.style.setProperty("--r", `${i * 30}deg`);
    ticks.append(tick);
  }
  const hourHand = $(".hand.h");
  const minuteHand = $(".hand.m");
  const secondHand = $(".hand.s");
  const update = () => {
    const now = new Date();
    const sec = now.getSeconds();
    const min = now.getMinutes();
    const hour = now.getHours() % 12;
    secondHand.style.rotate = `${sec * 6}deg`;
    minuteHand.style.rotate = `${min * 6 + sec * 0.1}deg`;
    hourHand.style.rotate = `${hour * 30 + min * 0.5}deg`;
  };
  update();
  setInterval(update, 1000);
}

function initParticles() {
  const holder = $("#particles");
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 28; i++) {
    const dust = document.createElement("span");
    dust.className = "dust";
    dust.style.setProperty("--x", `${28 + Math.random() * 70}%`);
    dust.style.setProperty("--y", `${52 + Math.random() * 36}%`);
    dust.style.setProperty("--s", `${0.3 + Math.random() * 0.4}cqw`);
    dust.style.setProperty("--d", `${7 + Math.random() * 8}s`);
    dust.style.setProperty("--t", `${-Math.random() * 12}s`);
    fragment.append(dust);
  }
  holder.append(fragment);
}

async function typeIntro() {
  const term = $("#term");
  const caret = document.createElement("span");
  caret.className = "caret";

  if (reduceMotion) {
    introLines.forEach((text) => {
      const line = document.createElement("span");
      line.className = "line";
      line.textContent = text;
      term.append(line);
    });
    term.lastElementChild.append(caret);
    revealActions();
    return;
  }

  await sleep(900);

  for (const text of introLines) {
    const line = document.createElement("span");
    line.className = "line";
    term.append(line);
    line.append(caret);
    for (const char of text) {
      caret.before(char);
      await sleep(char === "," || char === "." ? 260 : 52 + Math.random() * 40);
    }
    await sleep(1000);
  }

  revealActions();
}

function revealActions() {
  if (!actions) return;
  actions.removeAttribute("inert");
  actions.classList.add("show");
}

function updateScrollProgress() {
  const progress = Math.min(window.scrollY / window.innerHeight, 1);
  room.style.setProperty("--p", progress.toFixed(3));
}

function initScroll() {
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateScrollProgress();
      ticking = false;
    });
  }, { passive: true });
  updateScrollProgress();
}

let activePanel = null;
let opener = null;
let typingRun = 0;

function prepareTypedText() {
  $$(".panel [data-type]").forEach((el) => {
    const full = el.textContent.trim();
    const readable = document.createElement("span");
    const visual = document.createElement("span");
    el.dataset.full = full;
    readable.className = "sr-only";
    readable.textContent = full;
    visual.className = "typed";
    visual.setAttribute("aria-hidden", "true");
    el.replaceChildren(readable, visual);
  });
}

async function typePanel(panel, run) {
  const items = $$("[data-type]", panel);
  if (reduceMotion) {
    items.forEach((el) => { $(".typed", el).textContent = el.dataset.full; });
    return;
  }
  for (const el of items) {
    const visual = $(".typed", el);
    el.classList.add("typing");
    el.scrollIntoView({ block: "nearest" });
    for (const char of el.dataset.full) {
      if (run !== typingRun) return;
      visual.textContent += char;
      await sleep(14 + Math.random() * 14);
    }
    el.classList.remove("typing");
    await sleep(220);
  }
}

async function openPanel(key, trigger) {
  const panel = document.getElementById(`panel-${key}`);
  if (!panel || activePanel || room.classList.contains("flying")) return;
  const source = $(`.hot[data-target="${key}"]`) || trigger;
  const stageBox = stage.getBoundingClientRect();
  const box = source.getBoundingClientRect();
  const originX = ((box.left + box.width / 2 - stageBox.left) / stageBox.width) * 100;
  const originY = ((box.top + box.height / 2 - stageBox.top) / stageBox.height) * 100;

  opener = trigger;
  stage.style.transformOrigin = `${originX}% ${originY}%`;
  room.classList.add("flying");
  await sleep(reduceMotion ? 0 : 950);

  activePanel = panel;
  document.body.classList.add("panel-open");
  panel.removeAttribute("inert");
  panel.classList.add("open");
  $(".back", panel).focus({ preventScroll: true });
  typePanel(panel, ++typingRun);
}

function closePanel() {
  if (!activePanel) return;
  const panel = activePanel;
  activePanel = null;
  typingRun++;
  panel.classList.remove("open");
  panel.setAttribute("inert", "");
  $$("[data-type]", panel).forEach((el) => {
    el.classList.remove("typing");
    $(".typed", el).textContent = "";
  });
  document.body.classList.remove("panel-open");
  room.classList.remove("flying");
  if (opener) opener.focus({ preventScroll: true });
}

function initNavigation() {
  prepareTypedText();
  $$("[data-target]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      openPanel(item.dataset.target, item);
    });
  });
  $$(".back").forEach((button) => button.addEventListener("click", closePanel));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanel();
  });
}

initClock();
initParticles();
initScroll();
initNavigation();
typeIntro();
