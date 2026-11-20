// Draws the cover: multi-panel poster art on a 2D canvas, at any size.
// A cover is a layout of photo panels with white gutters, a colour grade over
// the photos, a halftone title band with bold Anton lettering and a Pacifico
// subtitle, a tilted badge ribbon and a grain + vignette finish. Every panel
// holds one photo with its own zoom and pan, so any photo fits any panel.
//
// state: { layout, grade, title, subtitle, badge, panels: [{ photo, zoom, dx, dy }] }
// photos: array of images (HTMLImageElement), indexed by panel.photo.
// The same function draws the live preview and the exported PNG.

import { GRADES } from './grades.js';

export const LAYOUTS = {
  grid: { label: 'Vice Grid · 2×2' },
  hero: { label: 'Hero Strip' },
  bleed: { label: 'Full Bleed' },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

/** Panel rectangles for a layout, as fractions of the cover [x, y, w, h]. */
export function layoutPanels(layout, w, h) {
  const g = 0.014; // gutter, as a fraction of the short side
  const gw = g * Math.min(w, h);
  if (layout === 'hero') {
    const split = 0.60;
    const top = [0, 0, w, h * split - gw / 2];
    const bw = (w - gw * 2) / 3;
    const by = h * split + gw / 2;
    const bh = h - by;
    return [top, [0, by, bw, bh], [bw + gw, by, bw, bh], [(bw + gw) * 2, by, bw, bh]];
  }
  if (layout === 'bleed') {
    return [[0, 0, w, h]];
  }
  const hw = (w - gw) / 2;
  const hh = (h - gw) / 2;
  return [[0, 0, hw, hh], [hw + gw, 0, hw, hh], [0, hh + gw, hw, hh], [hw + gw, hh + gw, hw, hh]];
}

/** Draws one photo into a panel rect, cropped to fill, with zoom and pan. */
export function drawPanelPhoto(ctx, photo, rect, zoom, dx, dy) {
  const [x, y, w, h] = rect;
  if (!photo) {
    ctx.fillStyle = '#241533';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = Math.max(1, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.2);
    ctx.lineTo(x + w * 0.8, y + h * 0.8);
    ctx.moveTo(x + w * 0.8, y + h * 0.2);
    ctx.lineTo(x + w * 0.2, y + h * 0.8);
    ctx.stroke();
    return;
  }
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(w / iw, h / ih) * zoom;
  const pw = iw * base;
  const ph = ih * base;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(photo, x + (w - pw) / 2 + dx * w, y + (h - ph) / 2 + dy * h, pw, ph);
  ctx.restore();
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded film grain, the same dots on every export of the same cover. */
export function drawGrain(ctx, w, h) {
  const rand = mulberry32(20261119);
  ctx.save();
  ctx.globalAlpha = 0.10;
  const n = Math.floor((w * h) / 9000);
  for (let i = 0; i < n; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
  }
  ctx.restore();
}

/** Vignette: darkened corners so the middle of the cover pops. */
export function drawVignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Halftone dots across a band, big on the left fading to the right. */
export function drawHalftone(ctx, x, y, w, h, color) {
  const step = Math.max(10, h / 5);
  ctx.fillStyle = color;
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const px = x + col * step + (row % 2 ? step / 2 : 0);
      const py = y + row * step + step / 2;
      const fade = 1 - (px - x) / w;
      const r = Math.max(0.6, (step * 0.22) * (0.4 + fade));
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function fitFont(ctx, text, maxWidth, startSize, family, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** The title band: dark strip, halftone edge, big title, script subtitle, stars. */
export function drawTitleBand(ctx, w, h, grade, title, subtitle) {
  const bandH = h * 0.155;
  const y = h - bandH;
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, y, w, bandH);
  drawHalftone(ctx, w * 0.62, y, w * 0.38, bandH, 'rgba(255,255,255,0.16)');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, y, w, Math.max(2, h * 0.004));
  const pad = w * 0.035;
  const titleText = (title || 'NEON COAST').trim().toUpperCase();
  const size = fitFont(ctx, titleText, w * 0.62, bandH * 0.52, 'Anton, "Arial Black", sans-serif', '400');
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = grade.title;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.12;
  ctx.fillText(titleText, pad, y + bandH * 0.42);
  ctx.shadowBlur = 0;
  const sub = (subtitle || '').trim();
  if (sub) {
    const subSize = fitFont(ctx, sub, w * 0.34, bandH * 0.30, 'Pacifico, cursive', '400');
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd7ef';
    ctx.fillText(sub, w - pad, y + bandH * 0.40);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd319';
  ctx.font = `${Math.round(bandH * 0.20)}px sans-serif`;
  ctx.fillText('★ ★ ★ ★ ★', pad, y + bandH * 0.84);
}

/** Tilted badge ribbon in the top-right corner. */
export function drawBadge(ctx, w, h, badge) {
  const text = (badge || '').trim().toUpperCase();
  if (!text) return;
  const bh = h * 0.045;
  ctx.font = `${Math.round(bh * 0.52)}px Anton, "Arial Black", sans-serif`;
  const bw = Math.min(w * 0.34, ctx.measureText(text).width + w * 0.06);
  ctx.save();
  ctx.translate(w - bw / 2 - w * 0.02, bh);
  ctx.rotate(0.06);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}

/** Draws the whole cover onto the canvas's 2D context, at the canvas's size. */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const panels = layoutPanels(state.layout, w, h);
  panels.forEach((rect, i) => {
    const p = state.panels[i] || { photo: 0, zoom: 1, dx: 0, dy: 0 };
    drawPanelPhoto(ctx, photos[p.photo] ?? null, rect, p.zoom, p.dx, p.dy);
  });
  // Grade wash over the photos.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.overlay[0]);
  wash.addColorStop(1, grade.overlay[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  if (state.layout === 'bleed') {
    // Tilted snapshot inset: a second photo as a white-bordered polaroid.
    const inset = state.panels[1] || { photo: 1, zoom: 1, dx: 0, dy: 0 };
    const iw = w * 0.34;
    const ih = h * 0.34;
    const ix = w - iw - w * 0.05;
    const iy = h - ih - h * 0.20;
    ctx.save();
    ctx.translate(ix + iw / 2, iy + ih / 2);
    ctx.rotate(-0.07);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-iw / 2 - 10, -ih / 2 - 10, iw + 20, ih + 20);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 24;
    ctx.fillRect(-iw / 2 - 10, -ih / 2 - 10, iw + 20, ih + 20);
    ctx.shadowBlur = 0;
    drawPanelPhoto(ctx, photos[inset.photo] ?? null, [-iw / 2, -ih / 2, iw, ih], inset.zoom, inset.dx, inset.dy);
    ctx.restore();
  }
  drawTitleBand(ctx, w, h, grade, state.title, state.subtitle);
  drawBadge(ctx, w, h, state.badge);
  drawVignette(ctx, w, h);
  drawGrain(ctx, w, h);
}
