// Wires the page: photos, layout, grade, caption, panel pan/zoom, undo/redo and
// PNG export at 1080x1080, 1080x1350 or 1920x1080. A `?shot=` query sets up a
// fixed scene for a screenshot instead (./shots.js). All paths resolve from
// import.meta.url through the module graph; photos never leave the machine.

import { drawCover, LAYOUT_IDS, LAYOUTS } from './cover.js';
import { GRADES, GRADE_IDS } from './grades.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const badgeInput = document.getElementById('badge');
const sizeSelect = document.getElementById('size');

const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };

const state = {
  layout: 'grid',
  grade: 'sunset',
  title: 'NEON COAST',
  subtitle: 'nights on the boulevard',
  badge: 'EST. 2026',
  panels: [
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
    { photo: 1, zoom: 1, dx: 0, dy: 0 },
    { photo: 2, zoom: 1, dx: 0, dy: 0 },
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
  ],
};

let photos = []; // { img, name }
let selectedPanel = 0;
let history = [];
let future = [];

function snapshot() { return JSON.stringify(state); }
function pushHistory() {
  history.push(snapshot());
  if (history.length > 40) history.shift();
  future = [];
}
function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  syncControls();
  redraw();
}

function redraw() {
  drawCover(canvas, state, photos.map((p) => p.img));
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  const names = ['boulevard', 'rooftop', 'neon'];
  const loaded = [];
  for (const name of names) {
    try {
      const img = await loadImage(new URL(`../samples/${name}.jpg`, import.meta.url).href);
      loaded.push({ img, name });
    } catch { /* a missing sample just leaves that slot empty */ }
  }
  return loaded;
}

function renderThumbs() {
  const box = document.getElementById('thumbs');
  box.innerHTML = '';
  photos.forEach((p, i) => {
    const t = document.createElement('img');
    t.src = p.img.src;
    t.alt = p.name;
    t.title = p.name;
    t.addEventListener('click', () => {
      pushHistory();
      state.panels[selectedPanel].photo = i;
      redraw();
    });
    box.appendChild(t);
  });
  const panelBox = document.getElementById('panelPhotos');
  panelBox.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Photo ${i + 1}`;
    b.addEventListener('click', () => {
      pushHistory();
      state.panels[selectedPanel].photo = i;
      redraw();
    });
    panelBox.appendChild(b);
  });
}

function renderOptionButtons(boxId, ids, labels, current, onPick) {
  const box = document.getElementById(boxId);
  box.innerHTML = '';
  ids.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = labels[id];
    b.setAttribute('aria-pressed', String(id === current));
    b.addEventListener('click', () => { pushHistory(); onPick(id); renderOptionButtons(boxId, ids, labels, id, onPick); redraw(); });
    box.appendChild(b);
  });
}

function syncControls() {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  badgeInput.value = state.badge;
  renderOptionButtons('layouts', LAYOUT_IDS, Object.fromEntries(LAYOUT_IDS.map((id) => [id, LAYOUTS[id].label])), state.layout, (id) => { state.layout = id; });
  renderOptionButtons('grades', GRADE_IDS, Object.fromEntries(GRADE_IDS.map((id) => [id, GRADES[id].label])), state.grade, (id) => { state.grade = id; });
}

function applySize() {
  const [w, h] = SIZES[sizeSelect.value] || SIZES['1080x1080'];
  canvas.width = w;
  canvas.height = h;
  redraw();
}

function pickPanelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const g = 0.014 * Math.min(canvas.width, canvas.height);
  let boxes;
  if (state.layout === 'hero') {
    const split = 0.60;
    const bw = (canvas.width - g * 2) / 3;
    const by = canvas.height * split + g / 2;
    boxes = [[0, 0, canvas.width, canvas.height * split - g / 2], [0, by, bw, canvas.height - by], [bw + g, by, bw, canvas.height - by], [(bw + g) * 2, by, bw, canvas.height - by]];
  } else if (state.layout === 'bleed') {
    boxes = [[0, 0, canvas.width, canvas.height]];
  } else {
    const hw = (canvas.width - g) / 2;
    const hh = (canvas.height - g) / 2;
    boxes = [[0, 0, hw, hh], [hw + g, 0, hw, hh], [0, hh + g, hw, hh], [hw + g, hh + g, hw, hh]];
  }
  const hit = boxes.findIndex(([bx, by, bw, bh]) => x >= bx && x <= bx + bw && y >= by && y <= by + bh);
  return hit === -1 ? 0 : hit;
}

let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  selectedPanel = pickPanelAt(e.clientX, e.clientY);
  dragging = { x: e.clientX, y: e.clientY, panel: selectedPanel };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const p = state.panels[dragging.panel];
  p.dx += (e.clientX - dragging.x) / rect.width;
  p.dy += (e.clientY - dragging.y) / rect.height;
  dragging.x = e.clientX;
  dragging.y = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { if (dragging) pushHistory(); dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[pickPanelAt(e.clientX, e.clientY)];
  p.zoom = Math.min(3, Math.max(1, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

document.getElementById('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    const img = await loadImage(URL.createObjectURL(file));
    photos.push({ img, name: file.name });
  }
  renderThumbs();
  redraw();
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
badgeInput.addEventListener('input', () => { state.badge = badgeInput.value; redraw(); });
sizeSelect.addEventListener('change', applySize);
document.getElementById('fillAll').addEventListener('click', () => {
  pushHistory();
  const first = state.panels[0].photo;
  state.panels.forEach((p) => { p.photo = first; });
  redraw();
});
document.getElementById('shuffle').addEventListener('click', () => {
  pushHistory();
  state.layout = LAYOUT_IDS[Math.floor(Math.random() * LAYOUT_IDS.length)];
  state.grade = GRADE_IDS[Math.floor(Math.random() * GRADE_IDS.length)];
  state.panels.forEach((p) => { p.photo = Math.floor(Math.random() * Math.max(1, photos.length)); });
  syncControls();
  redraw();
});
document.getElementById('undo').addEventListener('click', () => {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
});
document.getElementById('redo').addEventListener('click', () => {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
});
document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[sizeSelect.value] || SIZES['1080x1080'];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state, photos.map((p) => p.img));
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved neon-coast-cover-${w}x${h}.png`;
  }, 'image/png');
});

async function boot() {
  try {
    await Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('400 100px Pacifico'),
    ]);
  } catch { /* system fonts stand in if the vendored ones fail */ }
  photos = await loadSamples();
  renderThumbs();
  syncControls();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, state, photos, applySize, redraw);
  } else {
    applySize();
  }
  redraw();
}

boot();
