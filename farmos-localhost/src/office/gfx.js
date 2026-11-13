// Alat lukis piksel: segi empat, garisan, cakera, warna, fon bitmap 3x5.
export const T = 16, COLS = 32, ROWS = 18, VW = COLS * T, VH = ROWS * T, WALL = 4 * T;

export const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

export function line(g, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  g.fillStyle = c;
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
}

export function disc(g, cx, cy, r, c) {
  g.fillStyle = c;
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y) + 0.3); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
}

export function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const shade = (c, f) => (f <= 1 ? mix(c, '#000000', 1 - f) : mix(c, '#ffffff', f - 1));
export const rgba = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };

// Fon bitmap 3x5 (huruf besar, nombor, tanda). Setiap glif = 5 baris x 3 bit.
const GLYPHS = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001',
  5: '111100110001110', 6: '011100110101010', 7: '111001010010010', 8: '111101111101111', 9: '010101011001110',
  ':': '000010000010000', '-': '000000111000000', '+': '000010111010000', '[': '110100100100110', ']': '011001001001011',
  '.': '000000000000010', '!': '010010010000010', '/': '001001010100100', '?': '110001010000010', '%': '101001010100101',
  "'": '010010000000000', ',': '000000000010100', '=': '000111000111000', '>': '100010001010100', '<': '001010100010001',
};
export const textW = (s) => Math.max(0, s.length * 4 - 1);
export function text(g, str, x, y, c) {
  g.fillStyle = c;
  const s = String(str).toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const gl = GLYPHS[s[i]];
    if (!gl) continue;
    for (let b = 0; b < 15; b++) if (gl[b] === '1') g.fillRect(Math.round(x) + i * 4 + (b % 3), Math.round(y) + ((b / 3) | 0), 1, 1);
  }
  return textW(s);
}
export function textC(g, str, cx, y, c) { return text(g, str, Math.round(cx - textW(String(str)) / 2), y, c); }

export const hourNow = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; };
// 0 = siang penuh, 1 = malam penuh
export function nightAmount(h) {
  if (h >= 7.5 && h <= 17.5) return 0;
  if (h >= 19.5 || h <= 5.5) return 1;
  return h < 7.5 ? 1 - (h - 5.5) / 2 : (h - 17.5) / 2;
}
export function skyColors(h) {
  const n = nightAmount(h);
  const day = ['#4fa9e6', '#c3e6f8'], night = ['#0b1230', '#22346a'];
  const glow = h < 12 ? ['#e9966a', '#fbd9a2'] : ['#d9664f', '#f7bf78'];
  if (n === 0) return day;
  if (n === 1) return night;
  // senja/subuh: siang -> jingga -> malam
  return n < 0.5 ? [mix(day[0], glow[0], n * 2), mix(day[1], glow[1], n * 2)] : [mix(glow[0], night[0], (n - 0.5) * 2), mix(glow[1], night[1], (n - 0.5) * 2)];
}
