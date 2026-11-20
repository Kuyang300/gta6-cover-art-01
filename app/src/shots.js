// Fixed scenes for screenshots: ?shot=editor shows the page with photos loaded;
// ?shot=cover shows the cover alone at an export size; ?shot=portrait and
// ?shot=wide show the other export sizes. window.__shotReady is set once painted.
// Query params: photo (sample name), caption, sub, layout, grade, size.

export async function runShot(shot, query, state, photos, applySize, redraw) {
  const caption = query.get('caption') ?? 'Neon Coast';
  const sub = query.get('sub') ?? 'nights on the boulevard';
  state.title = caption;
  state.subtitle = sub;
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  const size = document.getElementById('size');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    size.value = query.get('size') || '1920x1080';
  } else if (shot === 'portrait') {
    document.body.classList.add('shot-cover');
    size.value = '1080x1350';
  } else if (shot === 'square') {
    document.body.classList.add('shot-cover');
    size.value = '1080x1080';
  }
  // Spread the three samples across the panels for a full multi-panel look.
  state.panels.forEach((p, i) => { p.photo = i % Math.max(1, photos.length); p.zoom = 1; p.dx = 0; p.dy = 0; });
  applySize();
  redraw();
  await document.fonts.ready;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
