// Peta pejabat: jubin yang dihalang, stesen kerja, titik berdiri, zon interaktif.
import { T, COLS, ROWS } from './gfx.js';

// Satu stesen bagi setiap slot ejen. Untuk tambah meja ke-4, tambah objek di sini.
export const STATIONS = [
  { slot: 1, kind: 'main', seat: { x: 18, y: 7 }, look: { x: 18, y: 11 } },
  { slot: 2, kind: 'wing', seat: { x: 27, y: 7 }, look: { x: 27, y: 10 }, deskY: 122, plateY: 88 },
  { slot: 3, kind: 'wing', seat: { x: 27, y: 13 }, look: { x: 27, y: 16 }, deskY: 218, plateY: 184 },
];

export const SPOTS = {
  coffee: [{ x: 2, y: 5 }, { x: 3, y: 5 }, { x: 1, y: 5 }],
  board: [{ x: 9, y: 4 }, { x: 11, y: 4 }, { x: 8, y: 4 }],
  window: [{ x: 19, y: 5 }, { x: 17, y: 5 }, { x: 20, y: 5 }],
  front: [{ x: 15, y: 15 }, { x: 12, y: 15 }, { x: 18, y: 15 }],
  terminal: [{ x: 25, y: 4 }, { x: 25, y: 5 }, { x: 24, y: 5 }],
  maquette: [{ x: 6, y: 14 }, { x: 6, y: 13 }, { x: 4, y: 15 }],
};

export function buildBlocked() {
  const b = new Uint8Array(COLS * ROWS);
  const set = (x0, y0, x1 = x0, y1 = y0) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) b[y * COLS + x] = 1; };
  set(0, 0, COLS - 1, 3);       // dinding belakang
  set(0, 4, 5, 4);              // pantri: peti ais, kaunter, dispenser
  set(6, 4); set(13, 4);        // monstera, pakis
  set(15, 4); set(21, 4, 22, 4); // bakul pelan, kabinet pelan + plotter
  set(16, 8, 20, 9);            // meja lukisan Halim
  set(26, 8, 28, 8);            // meja slot 02
  set(26, 14, 28, 14);          // meja slot 03
  set(3, 13, 5, 14);            // meja model reban
  return b;
}

export const tileX = (tx) => tx * T + 8;
export const tileY = (ty) => ty * T + 15;

// Zon boleh klik (koordinat piksel logik). Susunan = keutamaan.
export const ZONES = [
  { id: 'coffee', x: 30, y: 32, w: 22, h: 30, label: 'Mesin Kopi O' },
  { id: 'board', x: 105, y: 5, w: 102, h: 53, label: 'Papan putih' },
  { id: 'window', x: 231, y: 3, w: 154, h: 52, label: 'Tingkap ladang' },
  { id: 'terminal', x: 392, y: 8, w: 36, h: 44, label: 'Terminal ejen baharu' },
  { id: 'desk2', x: 384, y: 84, w: 122, h: 66, label: 'Meja slot 02' },
  { id: 'desk3', x: 384, y: 180, w: 122, h: 66, label: 'Meja slot 03' },
  { id: 'desk1', x: 256, y: 112, w: 80, h: 48, label: 'Meja lukisan Halim' },
  { id: 'maquette', x: 46, y: 192, w: 52, h: 50, label: 'Model reban' },
];
