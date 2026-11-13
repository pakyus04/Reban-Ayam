// Lukisan pejabat piksel: latar statik, perabot, tingkap ladang, pencahayaan.
import { R, line, disc, rng, mix, shade, rgba, text, textC, textW, VW, VH, WALL, nightAmount, skyColors } from './gfx.js';

// ======================= LATAR STATIK =======================
export function drawBackground(g) {
  const rand = rng(11);

  // ----- lantai papan keras -----
  const tones = ['#b9824f', '#c18b57', '#b07947', '#c8945f'];
  for (let r = 0; r < 28; r++) {
    const y = WALL + r * 8;
    let x = -Math.floor(rand() * 40);
    while (x < VW) {
      const len = 32 + Math.floor(rand() * 3) * 8;
      const c = tones[Math.floor(rand() * tones.length)];
      R(g, x, y, len, 8, c);
      R(g, x, y, len, 1, shade(c, 1.12));
      R(g, x, y + 7, len, 1, shade(c, 0.76));
      R(g, x, y, 1, 8, shade(c, 0.7));
      for (let k = 0; k < 3; k++) R(g, x + 3 + Math.floor(rand() * (len - 12)), y + 2 + Math.floor(rand() * 4), 3 + Math.floor(rand() * 6), 1, shade(c, rand() < 0.5 ? 0.88 : 1.08));
      if (rand() < 0.14) { const kx = x + 6 + Math.floor(rand() * (len - 14)); R(g, kx, y + 3, 2, 2, shade(c, 0.6)); R(g, kx - 1, y + 3, 1, 1, shade(c, 0.8)); R(g, kx + 2, y + 4, 1, 1, shade(c, 0.8)); }
      x += len;
    }
  }

  // ----- lantai jubin pantri -----
  for (let ty = 0; ty < 6; ty++) for (let tx = 0; tx < 6; tx++) {
    const x = tx * 16, y = WALL + ty * 16, c = (tx + ty) % 2 ? '#cfe1da' : '#f1e9d8';
    R(g, x, y, 16, 16, c); R(g, x, y, 16, 1, shade(c, 1.1)); R(g, x, y, 1, 16, shade(c, 1.06));
    R(g, x + 15, y, 1, 16, '#b3b6a8'); R(g, x, y + 15, 16, 1, '#b3b6a8');
    if (rand() < 0.35) R(g, x + 4 + Math.floor(rand() * 8), y + 4 + Math.floor(rand() * 8), 2, 1, shade(c, 0.93));
  }
  R(g, 96, WALL, 2, 98, '#8f989d'); R(g, 96, WALL, 1, 98, '#c5ccd0');
  R(g, 0, 160, 98, 2, '#8f989d'); R(g, 0, 160, 98, 1, '#c5ccd0');

  // ----- permaidani sayap tambahan -----
  R(g, 384, WALL, 128, 224, '#3f5870');
  for (let y = WALL; y < VH; y += 2) for (let x = 384 + (y % 4 ? 2 : 0); x < VW; x += 4) R(g, x, y, 1, 1, '#4a6680');
  for (let y = WALL + 8; y < VH; y += 16) for (let x = 392; x < VW; x += 16) { R(g, x, y, 2, 1, '#5d7b96'); R(g, x, y + 1, 2, 1, '#33485c'); }
  R(g, 384, WALL, 2, 224, '#9aa3a8'); R(g, 384, WALL, 1, 224, '#c9d0d4');

  // ----- tikar mengkuang -----
  const rx = 176, ry = 216, rw = 128, rh = 48;
  R(g, rx - 1, ry - 1, rw + 2, rh + 2, '#6e5a2e');
  for (let j = 0; j < rh / 4; j++) for (let i = 0; i < rw / 4; i++) {
    const d = Math.abs((i % 16) - 8) + Math.abs(j - 6) * 1.34;
    const band = Math.round(d) % 6;
    const c = j < 1 || j > 10 ? '#8f3b46' : band === 0 ? '#2f8f6b' : band === 3 ? '#8f3b46' : (i + j) % 2 ? '#d8bf7a' : '#cdb26c';
    R(g, rx + i * 4, ry + j * 4, 4, 4, c);
    R(g, rx + i * 4, ry + j * 4 + 3, 4, 1, shade(c, 0.86));
    R(g, rx + i * 4 + 3, ry + j * 4, 1, 4, shade(c, 0.92));
  }
  R(g, rx, ry, rw, 2, '#b99b52'); R(g, rx, ry + rh - 2, rw, 2, '#b99b52');
  for (let y = ry + 1; y < ry + rh; y += 3) { R(g, rx - 3, y, 2, 1, '#d8bf7a'); R(g, rx + rw + 1, y, 2, 1, '#d8bf7a'); }

  // ----- dinding belakang -----
  R(g, 0, 0, VW, WALL, '#eadfc6');
  for (let x = 0; x < VW; x += 32) R(g, x, 5, 1, 41, 'rgba(120,90,50,.09)');
  for (let i = 0; i < 300; i++) R(g, Math.floor(rand() * VW), 5 + Math.floor(rand() * 40), 1, 1, 'rgba(120,90,50,.08)');
  R(g, 0, 46, VW, 18, '#b08a5e'); R(g, 0, 46, VW, 1, '#7c5c3a'); R(g, 0, 47, VW, 1, '#caa77a');
  for (let x = 0; x < VW; x += 8) R(g, x, 48, 1, 13, 'rgba(70,45,20,.2)');
  R(g, 0, 61, VW, 3, '#5d432c');
  // dinding sayap (konkrit + keluli) dan tiang pemisah
  R(g, 386, 5, 126, 41, '#d6dbd7');
  for (let i = 0; i < 90; i++) R(g, 388 + Math.floor(rand() * 122), 6 + Math.floor(rand() * 38), 1, 1, 'rgba(60,70,80,.1)');
  R(g, 386, 46, 126, 15, '#8b979f'); R(g, 386, 46, 126, 1, '#b3bec5'); R(g, 386, 60, 126, 1, '#5f6a72');
  for (let x = 392; x < VW; x += 12) { R(g, x, 49, 1, 1, '#5f6a72'); R(g, x, 57, 1, 1, '#5f6a72'); }
  R(g, 0, 0, VW, 4, '#6b5238'); R(g, 0, 4, VW, 1, '#8f7150');
  R(g, 382, 0, 5, WALL, '#7a6248'); R(g, 382, 0, 1, WALL, '#9c8262'); R(g, 386, 0, 1, WALL, '#4f3d2b');
  // bayang dinding atas lantai
  for (let i = 0; i < 6; i++) R(g, 0, WALL + i, VW, 1, `rgba(40,25,10,${(0.26 - i * 0.04).toFixed(2)})`);

  // ----- pantri -----
  for (let y = 32; y < 54; y += 4) for (let x = 0; x < 96; x += 4) {
    R(g, x, y, 4, 4, ((x + y) / 4) % 2 ? '#f4f1e8' : '#dbe9e4'); R(g, x + 3, y, 1, 4, '#c6cdc4'); R(g, x, y + 3, 4, 1, '#c6cdc4');
  }
  R(g, 3, 7, 91, 25, '#6f5235');
  for (let i = 0; i < 4; i++) {
    const x = 4 + Math.round(i * 22.5);
    R(g, x, 8, 21, 23, '#a67c4d'); R(g, x, 8, 21, 1, '#c59a68'); R(g, x + 2, 11, 17, 17, '#b58a58'); R(g, x + 2, 11, 17, 1, '#8f6a40');
    R(g, x + (i % 2 ? 3 : 16), 18, 2, 5, '#e0c27a');
  }
  R(g, 3, 32, 91, 2, 'rgba(0,0,0,.25)');
  // peti ais mini
  R(g, 0, 40, 16, 40, '#9fb0b8'); R(g, 1, 41, 14, 38, '#e4edf0'); R(g, 1, 41, 14, 2, '#f6fafb');
  R(g, 1, 53, 14, 1, '#9fb0b8'); R(g, 12, 44, 2, 6, '#7d8f98'); R(g, 12, 57, 2, 10, '#7d8f98'); R(g, 13, 41, 2, 38, '#cfdbe0');
  R(g, 3, 44, 4, 4, '#f5c518'); R(g, 4, 58, 5, 4, '#e2876f'); R(g, 3, 65, 3, 3, '#7fc97a');
  // kaunter
  R(g, 16, 66, 64, 14, '#8b643c'); R(g, 16, 66, 64, 1, '#6b4a2a');
  for (let i = 0; i < 3; i++) { const x = 18 + i * 21; R(g, x, 68, 19, 11, '#9c7348'); R(g, x, 68, 19, 1, '#b48a5c'); R(g, x + 8, 72, 3, 2, '#e0c27a'); }
  R(g, 15, 54, 66, 12, '#e9dfcd'); R(g, 15, 54, 66, 1, '#fbf6ea'); R(g, 15, 65, 66, 1, '#b9ad96');
  // cawan
  ['#f4efe6', '#ff7a1a', '#2f8f6b'].forEach((c, i) => { const x = 19 + i * 4; R(g, x, 52, 3, 4, c); R(g, x, 52, 3, 1, shade(c, 1.2)); R(g, x + 3, 53, 1, 2, c); });
  // mesin Kopi O
  R(g, 33, 56, 16, 2, '#1c2025');
  R(g, 34, 36, 14, 20, '#2c3138'); R(g, 34, 36, 14, 3, '#4a525c'); R(g, 34, 36, 1, 20, '#3a414a'); R(g, 47, 36, 1, 20, '#1c2025');
  R(g, 35, 41, 12, 1, '#ff7a1a');
  R(g, 37, 45, 8, 10, '#14171b'); R(g, 38, 46, 6, 8, '#2a1a10'); R(g, 38, 49, 6, 5, '#3f2514'); R(g, 38, 46, 1, 8, 'rgba(255,255,255,.25)');
  R(g, 40, 43, 2, 2, '#8a9199');
  // balang biskut, tin, kuih
  R(g, 52, 44, 9, 11, '#cfe3ea'); R(g, 53, 45, 1, 9, '#f2fbff'); R(g, 53, 42, 7, 2, '#c0392b'); R(g, 53, 42, 7, 1, '#e05a4a');
  [[54, 50], [57, 48], [56, 52], [58, 51], [54, 47]].forEach(([x, y]) => R(g, x, y, 2, 2, '#c9965a'));
  R(g, 63, 46, 7, 9, '#2f8f6b'); R(g, 63, 49, 7, 2, '#f5c518'); R(g, 63, 45, 7, 1, '#bfc7c9'); R(g, 69, 46, 1, 9, '#236b50');
  R(g, 70, 55, 10, 1, '#ffffff'); R(g, 71, 52, 3, 3, '#e58fb0'); R(g, 74, 52, 3, 3, '#7fc97a'); R(g, 77, 53, 2, 2, '#f5e6a8');
  // dispenser air
  R(g, 81, 79, 15, 1, 'rgba(0,0,0,.3)');
  R(g, 82, 46, 13, 34, '#eef2f3'); R(g, 82, 46, 13, 1, '#ffffff'); R(g, 94, 46, 1, 34, '#c5cdd0');
  R(g, 84, 54, 9, 8, '#cfd8dc'); R(g, 85, 56, 2, 3, '#d9463a'); R(g, 90, 56, 2, 3, '#2f7dd1'); R(g, 84, 63, 9, 2, '#9aa3a8');
  R(g, 86, 43, 5, 3, '#6fb2dd'); R(g, 84, 30, 9, 14, '#8ec9ee'); R(g, 85, 28, 7, 2, '#8ec9ee'); R(g, 85, 31, 1, 11, '#d6efff'); R(g, 92, 31, 1, 12, '#6fb2dd');

  // ----- papan putih (bingkai) -----
  R(g, 108, 57, 96, 2, 'rgba(0,0,0,.18)');
  R(g, 106, 6, 100, 48, '#8f989d'); R(g, 107, 7, 98, 46, '#c7ced2'); R(g, 109, 9, 94, 42, '#f8fafb');
  R(g, 106, 54, 100, 3, '#7b858b'); R(g, 106, 54, 100, 1, '#aab3b8');
  R(g, 120, 53, 6, 1, '#d9463a'); R(g, 128, 53, 6, 1, '#2f7dd1'); R(g, 136, 53, 6, 1, '#2f8f6b'); R(g, 150, 52, 8, 2, '#3a3a3a');

  // ----- jam dinding (muka) -----
  disc(g, 220, 18, 9, '#4a3626'); disc(g, 220, 18, 8, '#f6f1e2');
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; R(g, 220 + Math.sin(a) * 6.6, 18 - Math.cos(a) * 6.6, 1, 1, i % 3 ? '#9a8f7a' : '#3a2c1e'); }

  // ----- tingkap (bingkai dan ambang) -----
  R(g, 234, 4, 148, 46, '#5d432c'); R(g, 235, 5, 146, 44, '#7a5a3c');
  R(g, 231, 48, 154, 4, '#8b6c4a'); R(g, 231, 48, 154, 1, '#b08e68'); R(g, 231, 52, 154, 2, 'rgba(0,0,0,.2)');

  // ----- bakul gulungan pelan -----
  R(g, 241, 79, 14, 1, 'rgba(0,0,0,.3)');
  R(g, 243, 52, 3, 15, '#f4f1e8'); R(g, 243, 52, 3, 1, '#c9c5b8'); R(g, 247, 49, 3, 18, '#3a6fc0'); R(g, 247, 49, 3, 1, '#8fb3e8'); R(g, 251, 55, 3, 12, '#f4f1e8'); R(g, 251, 55, 3, 1, '#c9c5b8');
  R(g, 242, 66, 12, 14, '#5b6770'); R(g, 242, 66, 12, 1, '#7d8a94'); R(g, 244, 68, 1, 11, '#48525a'); R(g, 248, 68, 1, 11, '#48525a'); R(g, 252, 68, 1, 11, '#48525a');

  // ----- kabinet pelan + plotter -----
  R(g, 336, 79, 32, 1, 'rgba(0,0,0,.3)');
  R(g, 337, 60, 30, 20, '#4c5a66'); R(g, 338, 61, 28, 18, '#7b8b98');
  for (let i = 0; i < 4; i++) { const y = 62 + Math.round(i * 4.3); R(g, 339, y, 26, 3, '#8fa0ad'); R(g, 350, y + 1, 4, 1, '#3d4852'); }
  R(g, 337, 57, 30, 4, '#a4b2bd'); R(g, 337, 57, 30, 1, '#c3cfd8');
  R(g, 340, 46, 24, 11, '#d7d2c4'); R(g, 340, 46, 24, 2, '#ece8dc'); R(g, 340, 55, 24, 2, '#8f8a7c'); R(g, 342, 49, 7, 3, '#2c3138'); R(g, 363, 46, 1, 11, '#b3ae9f');

  // ----- terminal ejen baharu (badan) -----
  R(g, 394, 10, 32, 40, '#232a31'); R(g, 395, 11, 30, 38, '#3b4650'); R(g, 395, 11, 30, 1, '#55626e'); R(g, 424, 11, 1, 38, '#2b343c');
  R(g, 397, 13, 26, 24, '#11161b');
  R(g, 397, 39, 26, 9, '#2b343c');
  R(g, 409, 50, 2, 12, '#232a31');

  // ----- papan tanda sayap + rel topi -----
  R(g, 434, 10, 70, 11, '#232a31'); R(g, 435, 11, 68, 9, '#2f3841'); R(g, 436, 9, 1, 2, '#8a9199'); R(g, 501, 9, 1, 2, '#8a9199');
  textC(g, 'SAYAP TAMBAHAN', 469, 13, '#f5c518');
  R(g, 440, 27, 60, 2, '#6b5238'); R(g, 440, 27, 60, 1, '#8f7150');
}

// ======================= OBJEK DINAMIK =======================
function cloud(g, x, y, w, c) { R(g, x, y + 2, w, 3, c); R(g, x + 3, y, w - 7, 2, c); R(g, x + Math.round(w / 2), y - 1, Math.round(w / 3), 1, c); }

export function drawWindow(g, t, hour, fanCount = 4) {
  const gx = 238, gy = 8, gw = 140, gh = 38;
  const n = nightAmount(hour);
  const [top, bot] = skyColors(hour);
  const dark = (c, k = 0.65) => mix(c, '#101a36', n * k);
  g.save(); g.beginPath(); g.rect(gx, gy, gw, gh); g.clip();
  for (let i = 0; i < gh; i++) R(g, gx, gy + i, gw, 1, mix(top, bot, i / gh));
  if (n > 0.5) for (let i = 0; i < 28; i++) if ((i + Math.floor(t * 1.5)) % 7) R(g, gx + ((i * 53) % gw), gy + ((i * 29) % 22), 1, 1, rgba('#ffffff', (n - 0.5) * 1.6));
  const arc = (hour - 6.2) / 12.6;
  if (arc > 0 && arc < 1 && n < 0.95) { const sx = gx + 8 + arc * (gw - 16), sy = gy + 27 - Math.sin(arc * Math.PI) * 21; disc(g, sx, sy, 5, '#ffe680'); disc(g, sx, sy, 3, '#fff6c2'); }
  if (n > 0.5) { disc(g, gx + 108, gy + 9, 4, '#f1eed6'); disc(g, gx + 110, gy + 8, 3, mix(top, bot, 0.2)); }
  const cc = n > 0.6 ? '#33426e' : n > 0.1 ? '#fbe2c8' : '#ffffff';
  [[0, 5, 22, 3.1], [62, 2, 16, 2.0], [112, 9, 19, 4.2]].forEach(([o, y, w, sp]) => cloud(g, gx + ((o + t * sp) % (gw + 44)) - 34, gy + y, w, cc));
  // bukit dan tanah
  for (let x = 0; x < gw; x++) { const hh = 7 + Math.round(Math.sin(x * 0.07) * 3 + Math.sin(x * 0.19 + 2) * 1.5); R(g, gx + x, gy + 28 - hh, 1, hh, dark(mix('#5f9f6a', top, 0.4))); }
  R(g, gx, gy + 28, gw, 10, dark('#58a04e')); R(g, gx, gy + 28, gw, 1, dark('#7cc06c'));
  for (let x = 2; x < gw; x += 7) R(g, gx + x, gy + 31 + ((x * 3) % 5), 2, 1, dark('#468a3f'));
  // pokok (bergoyang)
  [[126, 0], [22, 1.7]].forEach(([px, ph]) => { const sw = Math.round(Math.sin(t * 1.2 + ph) * 1.2); R(g, gx + px, gy + 24, 2, 11, dark('#6b4a2f')); disc(g, gx + px + sw, gy + 21, 6, dark('#2f7d4a')); disc(g, gx + px - 3 + sw, gy + 23, 4, dark('#3f9a5c')); disc(g, gx + px + 2 + sw, gy + 18, 3, dark('#46a864')); });
  // silo dedak
  R(g, gx + 9, gy + 15, 8, 17, dark('#cfd6da')); R(g, gx + 9, gy + 15, 2, 17, dark('#eef3f5')); R(g, gx + 10, gy + 13, 6, 2, dark('#aab4ba')); R(g, gx + 12, gy + 12, 2, 1, dark('#aab4ba'));
  R(g, gx + 10, gy + 32, 1, 4, dark('#6f7a82')); R(g, gx + 15, gy + 32, 1, 4, dark('#6f7a82')); R(g, gx + 9, gy + 21, 8, 1, dark('#aab4ba'));
  // reban tertutup: sisi panjang (menjauh ke kiri) + muka Timur dengan exhaust fan
  const wall = dark('#eef1f2', 0.55), roof = dark('#5f86ad', 0.5), roofHi = dark('#86a9cc', 0.5);
  for (let x = gx + 34; x < gx + 82; x++) {
    const k = (x - gx - 34) / 48, y0 = Math.round(21 - k * 3), y1 = Math.round(34 + k * 2);
    R(g, x, gy + y0, 1, y1 - y0, wall);
    R(g, x, gy + y0 - 3, 1, 3, roof); R(g, x, gy + y0 - 3, 1, 1, roofHi);
    if ((x - gx) % 9 < 5 && x > gx + 44) R(g, x, gy + y0 + 4, 1, 3, n > 0.4 ? '#ffd27a' : dark('#9fb6c4'));
  }
  R(g, gx + 34, gy + 21, 7, 13, dark('#2f7f88'));                       // cooling pad di hujung Barat
  for (let i = 0; i < 4; i++) R(g, gx + 34, gy + 23 + i * 3, 7, 1, dark('#1f5c64'));
  const fx0 = gx + 82, fw = 42;
  for (let i = 0; i < 8; i++) { const half = Math.round(((i + 1) * (fw / 2 + 2)) / 8); R(g, fx0 + fw / 2 - half, gy + 9 + i, half * 2, 1, i === 0 ? roofHi : roof); }
  R(g, fx0, gy + 17, fw, 19, wall); R(g, fx0, gy + 17, fw, 1, dark('#c5ccd0')); R(g, fx0, gy + 17, 1, 19, dark('#c5ccd0'));
  const nf = Math.max(1, Math.min(5, fanCount));
  for (let i = 0; i < nf; i++) {
    const cx = Math.round(fx0 + (fw * (i + 0.5)) / nf), cy = gy + 27, r = nf > 3 ? 3 : 4;
    disc(g, cx, cy, r, dark('#2c3138', 0.3)); disc(g, cx, cy, r - 1, dark('#56616c', 0.3));
    const a = t * 7 + i;
    for (let k = 0; k < 2; k++) { const dx = Math.cos(a + k * Math.PI / 2) * (r - 1), dy = Math.sin(a + k * Math.PI / 2) * (r - 1); line(g, cx - dx, cy - dy, cx + dx, cy + dy, dark('#dfe6ea', 0.3)); }
    R(g, cx, cy, 1, 1, '#14171b');
  }
  // pagar
  for (let x = 0; x < gw; x += 6) R(g, gx + x, gy + 34, 1, 4, dark('#8a6b4a'));
  R(g, gx, gy + 35, gw, 1, dark('#a58460'));
  if (n > 0.4) { R(g, gx + 60, gy + 20, 1, 15, '#5a6570'); disc(g, gx + 60, gy + 19, 1, '#fff2b0'); }
  // pantulan kaca
  g.fillStyle = 'rgba(255,255,255,.10)';
  for (let i = 0; i < 12; i++) { g.fillRect(gx + 14 + i, gy + 30 - i * 2, 6, 2); g.fillRect(gx + 96 + i, gy + 34 - i * 2, 3, 2); }
  g.restore();
  // jenang
  R(g, 284, 8, 3, 38, '#7a5a3c'); R(g, 284, 8, 1, 38, '#93714e'); R(g, 331, 8, 3, 38, '#7a5a3c'); R(g, 331, 8, 1, 38, '#93714e');
  R(g, 238, 8, 140, 1, 'rgba(0,0,0,.25)');
  // pasu kecil atas ambang
  R(g, 370, 45, 6, 4, '#a8573a'); R(g, 371, 41, 4, 4, '#3f9a5c'); R(g, 372, 39, 2, 2, '#46a864');
}

export function drawClock(g, date) {
  const cx = 220, cy = 18;
  const hm = ((date.getHours() % 12) + date.getMinutes() / 60) / 12 * Math.PI * 2;
  const mm = (date.getMinutes() / 60) * Math.PI * 2, sm = (date.getSeconds() / 60) * Math.PI * 2;
  line(g, cx, cy, cx + Math.sin(hm) * 3.6, cy - Math.cos(hm) * 3.6, '#2a2018');
  line(g, cx, cy, cx + Math.sin(mm) * 5.6, cy - Math.cos(mm) * 5.6, '#2a2018');
  line(g, cx, cy, cx + Math.sin(sm) * 6, cy - Math.cos(sm) * 6, '#d9463a');
  R(g, cx, cy, 1, 1, '#2a2018');
}

// Papan putih: rajah mini reban ikut data projek semasa.
export function drawWhiteboard(g, t, c) {
  text(g, c ? `REBAN ${Math.round(c.s.L)}X${Math.round(c.s.W)}M` : 'PELAN REBAN', 118, 11, '#2f62b0');
  if (c) {
    const s = c.s, bx = 119, by = 19, mw = 44, mh = 28;
    const k = Math.min(mw / s.L, mh / s.W);
    const w = Math.max(10, Math.round(s.L * k)), h = Math.max(8, Math.round(s.W * k));
    const x = bx + Math.round((mw - w) / 2), y = by + Math.round((mh - h) / 2);
    const bad = c.both && !s.part;
    if (c.both) {
      const hb = Math.round((h * s.share) / 100);
      R(g, x, y, w, hb, bad ? '#f7c6c0' : '#fbe3c2'); R(g, x, y + hb, w, h - hb, bad ? '#f7c6c0' : '#cfe3f7');
      if (!bad) R(g, x, y + hb, w, 1, '#2a2f36');
      else for (let i = -h; i < w; i += 4) line(g, x + Math.max(0, i), y + Math.max(0, -i), x + Math.min(w - 1, i + h - 1), y + Math.min(h - 1, h - 1 - Math.max(0, i + h - w)), '#d9463a');
    } else R(g, x, y, w, h, s.type === 'broiler' ? '#fbe3c2' : '#cfe3f7');
    R(g, x, y, w, 1, '#2f62b0'); R(g, x, y + h - 1, w, 1, '#2f62b0'); R(g, x, y, 1, h, '#2f62b0'); R(g, x + w - 1, y, 1, h, '#2f62b0');
    R(g, x - 2, y + 1, 2, h - 2, '#3aa6ff');
    const nf = Math.min(6, c.fansTotal);
    for (let i = 0; i < nf; i++) R(g, x + w, y + Math.round(((i + 0.5) * h) / nf) - 1, 2, 2, '#56616c');
    const ph = Math.floor(t * 6) % 6;
    for (let r = 0; r < (h > 14 ? 2 : 1); r++) {
      const ay = y + Math.round(((r + 0.5) * h) / (h > 14 ? 2 : 1));
      for (let ax = x + 3 + ph; ax < x + w - 4; ax += 6) R(g, ax, ay, 3, 1, '#2f8f6b');
      R(g, x + w - 4, ay - 1, 1, 3, '#2f8f6b'); R(g, x + w - 3, ay, 1, 1, '#2f8f6b');
    }
    if (bad && Math.floor(t * 2) % 2) { disc(g, x + Math.round(w / 2), y + Math.round(h / 2), 4, '#d9463a'); R(g, x + Math.round(w / 2), y + Math.round(h / 2) - 2, 1, 3, '#ffffff'); R(g, x + Math.round(w / 2), y + Math.round(h / 2) + 2, 1, 1, '#ffffff'); }
  }
  // nota lekat dan carta kecil
  R(g, 168, 12, 12, 12, '#ffd84a'); R(g, 168, 23, 12, 1, '#d9b530'); R(g, 170, 15, 8, 1, '#8a6d00'); R(g, 170, 18, 6, 1, '#8a6d00'); R(g, 170, 21, 7, 1, '#8a6d00');
  R(g, 184, 14, 12, 12, '#ff9ec0'); R(g, 184, 25, 12, 1, '#d97a9d'); R(g, 186, 17, 8, 1, '#9a2f5c'); R(g, 186, 20, 5, 1, '#9a2f5c');
  R(g, 170, 29, 13, 12, '#9be08a'); R(g, 170, 40, 13, 1, '#6fb85f'); R(g, 172, 32, 9, 1, '#2f6b22'); R(g, 172, 35, 7, 1, '#2f6b22');
  R(g, 187, 46, 14, 1, '#56616c'); R(g, 187, 32, 1, 15, '#56616c');
  [5, 8, 6, 11].forEach((v, i) => R(g, 189 + i * 3, 46 - v, 2, v, ['#3a6fc0', '#2f8f6b', '#ff7a1a', '#3a6fc0'][i]));
}

export function drawTerminal(g, t, agents) {
  R(g, 398, 14, 24, 22, '#1f4f9a');
  for (let x = 400; x < 422; x += 4) R(g, x, 14, 1, 22, '#2d62b3');
  for (let y = 16; y < 36; y += 4) R(g, 398, y, 24, 1, '#2d62b3');
  const on = Math.floor(t * 1.6) % 2;
  R(g, 409, 17, 2, 8, on ? '#ffffff' : '#bcd3f5'); R(g, 406, 20, 8, 2, on ? '#ffffff' : '#bcd3f5');
  textC(g, 'EJEN', 410, 28, '#dbe8ff');
  R(g, 398, 14 + (Math.floor(t * 14) % 22), 24, 1, 'rgba(255,255,255,.12)');
  agents.forEach((a, i) => { const x = 400 + i * 6; R(g, x, 41, 4, 4, '#14181c'); R(g, x + 1, 42, 2, 2, a.status === 'active' ? '#3fe08f' : '#f5c518'); });
  R(g, 419, 42, 2, 2, Math.floor(t * 3) % 2 ? '#ff5b4a' : '#5a1f1a');
}

function helmet(g, x, y, c) {
  R(g, x + 2, y, 6, 1, c); R(g, x, y + 1, 10, 4, c); R(g, x + 4, y, 2, 3, shade(c, 1.4)); R(g, x + 7, y + 2, 2, 2, shade(c, 0.75)); R(g, x - 1, y + 5, 12, 1, shade(c, 0.7));
}
export function drawWingWall(g, agents) {
  agents.filter((a) => a.slot > 1).forEach((a, i) => {
    const x = 450 + i * 30;
    R(g, x + 4, 28, 2, 4, '#8a9199');
    if (a.status !== 'active') helmet(g, x, 31, a.palette.helmet || '#ffffff');
  });
}

export function drawPantryFx(g, t, brewing) {
  R(g, 45, 38, 2, 2, Math.floor(t * (brewing ? 8 : 1.5)) % 2 ? '#ff5b4a' : '#6b1f18');
  if (brewing && Math.floor(t * 10) % 2) R(g, 40, 45, 2, 1, '#3f2514');
  const bub = Math.floor(t * 2) % 9;
  R(g, 87, 41 - bub, 1, 1, '#d6efff'); R(g, 89, 43 - ((bub + 4) % 9), 1, 1, '#d6efff');
  R(g, 14, 43, 1, 1, '#3fe08f');
}

export function drawPlotter(g, t, working) {
  const len = working ? 6 + (Math.floor(t * 4) % 8) : 5;
  R(g, 345, 56, 14, len, '#2f62b0'); R(g, 345, 56, 14, 1, '#8fb3e8');
  for (let y = 58; y < 56 + len - 1; y += 2) R(g, 347, y, 10, 1, '#dbe8ff');
  R(g, 346, 50, 2, 1, working && Math.floor(t * 6) % 2 ? '#3fe08f' : '#2f8f6b');
}

export function drawMonstera(g, t) {
  R(g, 97, 79, 14, 1, 'rgba(0,0,0,.3)');
  const leaves = [[95, 55, 6, 0], [108, 51, 6, 1.3], [101, 42, 6, 2.1], [110, 63, 4, 0.6], [92, 65, 5, 2.8]];
  leaves.forEach(([x, y, , ph]) => line(g, 104, 70, x + Math.round(Math.sin(t * 0.9 + ph) * 0.8), y + 3, '#2a6a3d'));
  leaves.forEach(([x, y, r, ph]) => {
    const lx = x + Math.round(Math.sin(t * 0.9 + ph) * 0.9);
    disc(g, lx, y, r, '#2a7445'); disc(g, lx - 1, y - 1, r - 2, '#3f9a5c');
    line(g, lx, y - r + 1, lx, y + r - 1, '#256238');
    R(g, lx - r, y, 2, 1, '#eadfc6'); R(g, lx + r - 1, y - 2, 2, 1, '#eadfc6'); R(g, lx + r - 2, y + 2, 2, 1, '#256238');
    R(g, lx - 2, y - 2, 1, 1, '#6fc98a');
  });
  R(g, 98, 70, 12, 10, '#a8573a'); R(g, 97, 69, 14, 2, '#c06b48'); R(g, 99, 79, 10, 1, '#7c3d27'); R(g, 108, 71, 2, 8, '#8a4530');
}

export function drawFern(g, t) {
  R(g, 209, 79, 14, 1, 'rgba(0,0,0,.3)');
  for (let i = 0; i < 9; i++) {
    const a = -1.25 + i * 0.31, sw = Math.sin(t * 1.1 + i * 0.7) * 0.9;
    for (let s = 1; s <= 11; s++) {
      const x = 216 + Math.sin(a) * s * 1.35 + (sw * s) / 11, y = 72 - Math.cos(a) * s * 1.7 + s * s * 0.07;
      R(g, x, y, s % 2 ? 2 : 1, 1, s % 2 ? '#3f9a5c' : '#2a7445');
      if (s % 3 === 0) R(g, x + (a < 0 ? -1 : 1), y - 1, 1, 1, '#6fc98a');
    }
  }
  R(g, 210, 72, 12, 8, '#6b7a86'); R(g, 209, 71, 14, 2, '#8796a2'); R(g, 219, 73, 2, 6, '#56636e');
}

export function drawChair(g, cx, y, occupied) {
  // y = baris tapak kerusi (bawah jubin tempat duduk)
  R(g, cx - 8, y - 17, 16, 13, '#2b3744'); R(g, cx - 7, y - 18, 14, 1, '#2b3744');
  R(g, cx - 7, y - 16, 14, 10, '#3d4d5d'); R(g, cx - 7, y - 16, 14, 1, '#52657a'); R(g, cx - 6, y - 13, 12, 1, '#ff7a1a');
  R(g, cx - 10, y - 9, 2, 6, '#232d38'); R(g, cx + 8, y - 9, 2, 6, '#232d38');
  if (!occupied) { R(g, cx - 7, y - 5, 14, 5, '#3d4d5d'); R(g, cx - 7, y - 5, 14, 1, '#52657a'); R(g, cx - 1, y, 2, 3, '#1c232b'); R(g, cx - 5, y + 2, 10, 1, '#1c232b'); }
}

function monitorBack(g, x, y, glow, t) {
  // x,y = penjuru kiri atas panel belakang (22 x 16)
  if (glow) { g.fillStyle = rgba(glow, 0.22); g.fillRect(x - 2, y - 3, 26, 3); g.fillRect(x - 3, y - 1, 2, 16); g.fillRect(x + 23, y - 1, 2, 16); }
  R(g, x, y, 22, 16, '#23282e'); R(g, x, y, 22, 1, '#3b434c'); R(g, x + 1, y + 1, 20, 14, '#2d343c');
  for (let i = 0; i < 4; i++) R(g, x + 4, y + 4 + i * 2, 14, 1, '#232a31');
  R(g, x + 10, y + 12, 2, 1, glow ? (Math.floor(t * 3) % 2 ? glow : shade(glow, 0.7)) : '#4a525c');
  R(g, x + 9, y + 16, 4, 4, '#1c2025'); R(g, x + 5, y + 20, 12, 2, '#1c2025'); R(g, x + 5, y + 20, 12, 1, '#3b434c');
}

export function drawMainDesk(g, t, st) {
  const { working, alert, night, mugHot, name } = st;
  const glow = alert ? '#ff5b4a' : working ? '#57d6ff' : '#3aa6d6';
  R(g, 256, 160, 80, 2, 'rgba(0,0,0,.28)');
  // muka depan
  R(g, 256, 148, 80, 12, '#a47645'); R(g, 256, 148, 80, 1, '#7c5a34'); R(g, 256, 159, 80, 1, '#6b4a2a'); R(g, 335, 148, 1, 12, '#8a6238');
  R(g, 260, 151, 22, 7, '#b78853'); R(g, 269, 154, 4, 1, '#e0c27a'); R(g, 310, 151, 22, 7, '#b78853'); R(g, 319, 154, 4, 1, '#e0c27a');
  R(g, 285, 150, 22, 8, '#2b2f36'); R(g, 286, 151, 20, 6, '#d9b24a'); textC(g, name || 'HALIM', 296, 152, '#2b2018');
  // permukaan meja lukisan
  R(g, 256, 122, 80, 26, '#d9b27a'); R(g, 256, 122, 80, 1, '#f0d19c'); R(g, 256, 147, 80, 1, '#b98d55'); R(g, 256, 122, 1, 26, '#e7c58f'); R(g, 335, 122, 1, 26, '#b98d55');
  for (let x = 262; x < 332; x += 14) R(g, x, 123, 1, 24, 'rgba(120,80,30,.12)');
  // pelan biru, pembaris skala, pensel
  R(g, 283, 130, 28, 15, '#2f62b0'); R(g, 283, 130, 28, 1, '#5b8fda'); R(g, 310, 130, 1, 15, '#234c8c');
  R(g, 286, 133, 18, 9, '#2f62b0'); R(g, 286, 133, 18, 1, '#dbe8ff'); R(g, 286, 141, 18, 1, '#dbe8ff'); R(g, 286, 133, 1, 9, '#dbe8ff'); R(g, 303, 133, 1, 9, '#dbe8ff'); R(g, 286, 137, 18, 1, '#9cc0f5');
  R(g, 306, 134, 3, 1, '#dbe8ff'); R(g, 306, 137, 3, 1, '#dbe8ff');
  R(g, 279, 144, 26, 2, '#f2e9c8'); for (let x = 280; x < 305; x += 2) R(g, x, 144, 1, 1, '#6b5a3a'); R(g, 279, 145, 26, 1, '#d3c79e');
  R(g, 313, 139, 7, 1, '#f5c518'); R(g, 320, 139, 1, 1, '#2b2018'); R(g, 312, 139, 1, 1, '#e2876f');
  // papan kekunci dan tetikus
  R(g, 288, 124, 16, 5, '#cfd5d9'); R(g, 288, 124, 16, 1, '#eef2f4'); for (let x = 289; x < 303; x += 2) { R(g, x, 125, 1, 1, '#8f989d'); R(g, x, 127, 1, 1, '#8f989d'); }
  R(g, 306, 125, 3, 4, '#eef2f4'); R(g, 306, 128, 3, 1, '#b3bcc1');
  // cawan kopi
  R(g, 274, 141, 4, 4, '#f4efe6'); R(g, 274, 141, 4, 1, '#4a2c17'); R(g, 278, 142, 1, 2, '#f4efe6'); R(g, 274, 145, 5, 1, 'rgba(0,0,0,.2)');
  if (mugHot && Math.floor(t * 3) % 2) R(g, 275, 139, 1, 1, 'rgba(255,255,255,.7)');
  // dua monitor (belakangnya menghadap kita, skrin menghadap Halim)
  monitorBack(g, 259, 114, glow, t);
  monitorBack(g, 311, 114, glow, t + 0.4);
  // lampu meja
  R(g, 326, 143, 7, 2, '#2b3138'); line(g, 329, 143, 331, 134, '#4a525c'); line(g, 331, 134, 325, 129, '#4a525c');
  R(g, 320, 127, 7, 3, '#f5c518'); R(g, 320, 130, 7, 1, night > 0.2 ? '#fff6c2' : '#c99a0a');
}

export function drawWingDesk(g, t, st, agent, active) {
  const y = st.deskY, x = 416;
  R(g, x, y + 26, 48, 2, 'rgba(0,0,0,.28)');
  R(g, x, y + 16, 48, 10, '#6f7a85'); R(g, x, y + 16, 48, 1, '#4f5962'); R(g, x + 2, y + 18, 44, 6, '#7d8893'); R(g, x + 20, y + 20, 8, 1, '#c9d0d4');
  R(g, x, y, 48, 16, '#c9cdd1'); R(g, x, y, 48, 1, '#e6e9eb'); R(g, x, y + 15, 48, 1, '#9aa1a7'); R(g, x + 47, y, 1, 16, '#aab0b6');
  if (active) {
    monitorBack(g, x + 3, y - 8, '#3aa6d6', t + st.slot);
    R(g, x + 28, y + 2, 14, 4, '#cfd5d9'); R(g, x + 28, y + 2, 14, 1, '#eef2f4');
    R(g, x + 30, y + 9, 10, 5, '#f6f1e2'); R(g, x + 31, y + 10, 6, 1, '#9aa1a7'); R(g, x + 31, y + 12, 5, 1, '#9aa1a7');
  } else {
    // monitor bertutup kain habuk
    const cx = x + 3, cy = y - 12;
    R(g, cx, cy + 2, 20, 22, '#d9cfb8'); R(g, cx + 1, cy, 18, 2, '#e6dcc6'); R(g, cx - 1, cy + 6, 1, 17, '#c9bfa6'); R(g, cx + 20, cy + 5, 1, 18, '#b8ae95');
    R(g, cx + 4, cy + 3, 1, 20, '#c9bfa6'); R(g, cx + 10, cy + 2, 1, 21, '#e6dcc6'); R(g, cx + 15, cy + 4, 1, 19, '#c9bfa6');
    R(g, cx - 1, cy + 23, 22, 1, '#b8ae95'); R(g, cx + 2, cy + 24, 3, 1, '#d9cfb8'); R(g, cx + 12, cy + 24, 4, 1, '#d9cfb8');
    // mangga kunci
    R(g, cx + 8, cy + 10, 4, 2, '#8a9199'); R(g, cx + 8, cy + 9, 1, 2, '#8a9199'); R(g, cx + 11, cy + 9, 1, 2, '#8a9199'); R(g, cx + 7, cy + 12, 6, 5, '#f5c518'); R(g, cx + 9, cy + 14, 2, 2, '#6b5200');
  }
}

export function drawPlate(g, cx, y, label, active, t) {
  const w = textW(label) + 8, x = Math.round(cx - w / 2);
  for (let i = 0; i < 6; i += 2) { R(g, x + 6, y - 6 + i, 1, 1, '#8a9199'); R(g, x + w - 7, y - 6 + i, 1, 1, '#8a9199'); }
  R(g, x - 1, y - 1, w + 2, 11, '#14181c'); R(g, x, y, w, 9, '#262d35'); R(g, x, y, w, 1, '#3b4650');
  text(g, label, x + 4, y + 2, active ? '#3fe08f' : '#f5c518');
  R(g, x + 1, y + 7, 1, 1, active ? '#3fe08f' : Math.floor(t * 2) % 2 ? '#ff5b4a' : '#5a1f1a');
}

export function drawBreakTable(g) {
  R(g, 62, 143, 20, 1, 'rgba(0,0,0,.25)');
  [50, 86].forEach((x) => { R(g, x, 141, 8, 1, 'rgba(0,0,0,.25)'); R(g, x + 3, 134, 2, 7, '#5a6570'); R(g, x, 130, 8, 4, '#d9463a'); R(g, x, 130, 8, 1, '#f07a6a'); R(g, x, 133, 8, 1, '#a6332a'); });
  R(g, 71, 132, 2, 11, '#5a6570'); R(g, 67, 142, 10, 1, '#3d4852');
  R(g, 62, 124, 20, 9, '#c9a06a'); R(g, 62, 124, 20, 1, '#e3bd85'); R(g, 62, 132, 20, 1, '#8b643c'); R(g, 61, 126, 1, 5, '#c9a06a'); R(g, 82, 126, 1, 5, '#a57a46');
  R(g, 65, 126, 6, 3, '#ffffff'); R(g, 66, 126, 2, 2, '#e58fb0'); R(g, 68, 127, 2, 1, '#7fc97a'); R(g, 75, 126, 3, 4, '#f4efe6'); R(g, 75, 126, 3, 1, '#4a2c17');
}

export function drawMaquette(g) {
  R(g, 48, 240, 48, 2, 'rgba(0,0,0,.28)');
  R(g, 48, 230, 48, 10, '#8b643c'); R(g, 48, 230, 48, 1, '#6b4a2a'); R(g, 50, 232, 4, 8, '#7a5733'); R(g, 90, 232, 4, 8, '#7a5733');
  R(g, 48, 202, 48, 28, '#c9a06a'); R(g, 48, 202, 48, 1, '#e3bd85'); R(g, 48, 229, 48, 1, '#a57a46');
  R(g, 52, 206, 40, 20, '#5fa257'); R(g, 52, 206, 40, 1, '#7cc06c'); R(g, 52, 225, 40, 1, '#3f7d3a');
  // model reban 1:50
  R(g, 57, 211, 30, 9, '#eef1f2'); R(g, 57, 219, 30, 1, '#b9c2c7'); R(g, 56, 207, 32, 5, '#5f86ad'); R(g, 56, 207, 32, 1, '#86a9cc'); R(g, 56, 211, 32, 1, '#456a8f');
  R(g, 57, 212, 3, 7, '#2f7f88'); R(g, 83, 213, 3, 3, '#2c3138'); R(g, 84, 214, 1, 1, '#aeb7bd'); R(g, 83, 217, 3, 2, '#2c3138');
  R(g, 70, 212, 1, 8, '#2a2f36');
  R(g, 62, 221, 16, 3, '#d9cdb0'); R(g, 54, 208, 1, 6, '#6b4a2f'); R(g, 53, 205, 3, 3, '#f5c518');
}

// ======================= EMOTE =======================
const ICONS = {
  '!': ['..X..', '..X..', '..X..', '..X..', '.....', '..X..'],
  '?': ['.XXX.', '...X.', '..XX.', '..X..', '.....', '..X..'],
  heart: ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..', '.....'],
  star: ['..X..', '.XXX.', 'XXXXX', '.XXX.', '.X.X.', '.....'],
  bulb: ['.XXX.', 'XXXXX', 'XXXXX', '.XXX.', '.XXX.', '..X..'],
  z: ['XXXX.', '..X..', '.X...', 'XXXX.', '.....', '.....'],
  note: ['..XX.', '..X.X', '..X..', '.XX..', 'XXX..', '.X...'],
  cup: ['X.X..', '.X.X.', 'XXXX.', 'XXXXX', 'XXXX.', '.XX..'],
};
const ICON_COLOR = { '!': '#e5352b', '?': '#2f62b0', heart: '#e5486d', star: '#e0a400', bulb: '#e0a400', z: '#56616c', note: '#2f8f6b', cup: '#6b4423' };

export function drawEmote(g, x, y, kind, t) {
  // gelembung 13 x 12 di atas kepala; (x, y) = tengah bawah gelembung
  const bx = Math.round(x) - 6, by = Math.round(y) - 13;
  const flash = kind === '!' && Math.floor(t * 5) % 2;
  R(g, bx + 1, by - 1, 11, 13, '#1c1512'); R(g, bx, by, 13, 11, '#1c1512');
  R(g, bx + 1, by, 11, 11, flash ? '#ffd9d4' : '#ffffff'); R(g, bx + 1, by, 11, 1, flash ? '#fff' : '#ffffff');
  R(g, bx + 5, by + 11, 3, 2, '#1c1512'); R(g, bx + 6, by + 11, 1, 1, flash ? '#ffd9d4' : '#ffffff');
  if (kind === '...') { const k = Math.floor(t * 4) % 4; for (let i = 0; i < 3; i++) R(g, bx + 3 + i * 3, by + 5 - (k === i ? 1 : 0), 2, 2, '#56616c'); return; }
  const ic = ICONS[kind]; if (!ic) return;
  const c = ICON_COLOR[kind];
  ic.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === 'X') R(g, bx + 4 + i, by + 2 + j, 1, 1, c); });
}

// ======================= PENCAHAYAAN =======================
export function drawWindowLight(g, hour) {
  const n = nightAmount(hour);
  const a = n < 1 ? (1 - n) * 0.17 : 0.05;
  const skew = Math.round((12.5 - Math.min(19, Math.max(6, hour))) * 4);
  g.fillStyle = n < 1 ? `rgba(255,240,190,${a.toFixed(3)})` : `rgba(150,180,255,${a})`;
  [[238, 284], [287, 331], [334, 378]].forEach(([x0, x1]) => {
    g.beginPath(); g.moveTo(x0, WALL); g.lineTo(x1, WALL); g.lineTo(x1 + skew + 8, WALL + 74); g.lineTo(x0 + skew - 8, WALL + 74); g.closePath(); g.fill();
  });
}

export function drawLighting(g, fx, st) {
  const { night, late, lamps } = st;       // lamps: [{x,y,r,color,a}]
  if (night <= 0.02) return;
  const f = fx.getContext('2d');
  f.globalCompositeOperation = 'source-over';
  f.clearRect(0, 0, VW, VH);
  f.fillStyle = `rgba(10,14,44,${(night * (late ? 0.62 : 0.42)).toFixed(3)})`;
  f.fillRect(0, 0, VW, VH);
  f.globalCompositeOperation = 'destination-out';
  for (const l of lamps) {
    const gr = f.createRadialGradient(l.x, l.y, 1, l.x, l.y, l.r);
    gr.addColorStop(0, `rgba(0,0,0,${l.a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    f.fillStyle = gr; f.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  f.globalCompositeOperation = 'source-over';
  g.drawImage(fx, 0, 0);
  g.globalCompositeOperation = 'lighter';
  for (const l of lamps) {
    if (!l.color) continue;
    const gr = g.createRadialGradient(l.x, l.y, 1, l.x, l.y, l.r * 0.8);
    gr.addColorStop(0, rgba(l.color, 0.16 * night)); gr.addColorStop(1, rgba(l.color, 0));
    g.fillStyle = gr; g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  g.globalCompositeOperation = 'source-over';
}
