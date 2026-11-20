// Colour grades: each one is a sunset or neon wash drawn over the photos with
// 'overlay' and 'soft-light' blending, plus a warm tint at the foot of the cover.
// The names are the buttons the editor shows; the values are the whole look.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    overlay: ['rgba(255, 94, 20, 0.34)', 'rgba(255, 0, 110, 0.30)'],
    wash: 'rgba(255, 122, 24, 0.16)',
    title: '#ffffff',
    band: '#160a24',
  },
  neon: {
    label: 'Neon Night',
    overlay: ['rgba(0, 229, 255, 0.30)', 'rgba(255, 0, 153, 0.34)'],
    wash: 'rgba(123, 47, 247, 0.18)',
    title: '#7df9ff',
    band: '#0b0620',
  },
  vice: {
    label: 'Vice Pink',
    overlay: ['rgba(255, 45, 149, 0.36)', 'rgba(255, 140, 0, 0.26)'],
    wash: 'rgba(255, 45, 149, 0.18)',
    title: '#ffd319',
    band: '#2b0a33',
  },
  gold: {
    label: 'Gold Hour',
    overlay: ['rgba(255, 183, 0, 0.32)', 'rgba(255, 94, 20, 0.28)'],
    wash: 'rgba(255, 200, 60, 0.14)',
    title: '#fff7d6',
    band: '#241203',
  },
  noir: {
    label: 'Noir',
    overlay: ['rgba(20, 20, 40, 0.42)', 'rgba(90, 90, 120, 0.18)'],
    wash: 'rgba(0, 0, 0, 0.10)',
    title: '#f2f2f2',
    band: '#0a0a0a',
  },
};

export const GRADE_IDS = Object.keys(GRADES);
