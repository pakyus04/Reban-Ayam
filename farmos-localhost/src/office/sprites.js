// Watak piksel 16-bit dijana secara prosedur. Setiap bingkai dilukis sekali ke atlas (helaian sprite)
// kemudian disalin ke kanvas. Kunci bingkai: pose|arah|bingkai|muka|barang.
import { shade } from './gfx.js';

export const CW = 24, CH = 32;      // saiz sel sprite
const COLS = 16, ROWS = 16;

export function fullPalette(p = {}) {
  const helmet = p.helmet || '#f5c518', vest = p.vest || '#ff7a1a', shirt = p.shirt || '#dfe9f3', pants = p.pants || '#2a3550';
  const skin = p.skin || '#c68b5b';
  return {
    helmet, helmetHi: shade(helmet, 1.45), helmetSh: shade(helmet, 0.72),
    vest, vestSh: shade(vest, 0.74), tape: '#f3efb4',
    shirt, shirtSh: shade(shirt, 0.78), collar: shade(shirt, 1.5),
    pants, pantsSh: shade(pants, 0.7),
    skin, skinSh: shade(skin, 0.82), hair: '#1c1512',
    boots: '#5a3a1f', bootsSh: '#2e1d0e', belt: '#2a2019',
    eye: '#1a1210', mouth: '#7a2e2a', mouthIn: '#3a1414', blush: '#e2876f', white: '#ffffff',
    board: '#8a6a3a', paper: '#f6f1e2', ink: '#3a6fc0', mug: '#f4efe6', coffee: '#4a2c17',
  };
}

// ---------- muka ----------
function faceFront(P, pal, hx, h, face) {
  const E = pal.eye;
  const eyes = () => { P(hx - 2, h + 7, 1, 2, E); P(hx + 1, h + 7, 1, 2, E); };
  switch (face) {
    case 'blink': P(hx - 2, h + 8, 1, 1, E); P(hx + 1, h + 8, 1, 1, E); P(hx - 1, h + 9, 2, 1, pal.mouth); break;
    case 'focus': eyes(); P(hx - 3, h + 6, 2, 1, pal.hair); P(hx + 1, h + 6, 2, 1, pal.hair); P(hx - 1, h + 10, 2, 1, pal.mouth); break;
    case 'serious': eyes(); P(hx - 3, h + 6, 2, 1, pal.hair); P(hx + 1, h + 6, 2, 1, pal.hair); P(hx - 2, h + 10, 4, 1, pal.mouth); P(hx - 2, h + 9, 1, 1, pal.skinSh); break;
    case 'happy':
      P(hx - 3, h + 8, 1, 1, E); P(hx - 2, h + 7, 1, 1, E); P(hx + 1, h + 7, 1, 1, E); P(hx + 2, h + 8, 1, 1, E);
      P(hx - 2, h + 9, 4, 1, pal.white); P(hx - 2, h + 10, 4, 1, pal.mouth);
      P(hx - 4, h + 9, 1, 1, pal.blush); P(hx + 3, h + 9, 1, 1, pal.blush); break;
    case 'shock':
      P(hx - 3, h + 6, 2, 3, pal.white); P(hx + 1, h + 6, 2, 3, pal.white); P(hx - 2, h + 7, 1, 1, E); P(hx + 1, h + 7, 1, 1, E);
      P(hx - 1, h + 9, 2, 2, pal.mouthIn); break;
    case 'sleep': P(hx - 3, h + 8, 2, 1, E); P(hx + 1, h + 8, 2, 1, E); P(hx, h + 10, 1, 1, pal.mouth); break;
    case 'talk': eyes(); P(hx - 1, h + 9, 2, 2, pal.mouthIn); P(hx - 1, h + 9, 2, 1, pal.white); break;
    case 'sip': P(hx - 3, h + 8, 2, 1, E); P(hx + 1, h + 8, 2, 1, E); break;
    default: eyes(); P(hx - 1, h + 9, 2, 1, pal.mouth);
  }
}

function headFront(P, pal, hx, h, face) {
  P(hx - 3, h, 6, 1, pal.helmet);
  P(hx - 5, h + 1, 10, 3, pal.helmet);
  P(hx - 1, h, 2, 3, pal.helmetHi);
  P(hx - 4, h + 1, 2, 1, pal.helmetHi);
  P(hx + 3, h + 2, 2, 2, pal.helmetSh);
  P(hx - 6, h + 4, 12, 1, pal.helmetSh);
  P(hx - 4, h + 5, 8, 6, pal.skin);
  P(hx - 5, h + 6, 1, 2, pal.skin); P(hx + 4, h + 6, 1, 2, pal.skinSh);
  P(hx - 4, h + 5, 1, 2, pal.hair); P(hx + 3, h + 5, 1, 2, pal.hair);
  P(hx + 3, h + 7, 1, 3, pal.skinSh);
  P(hx - 3, h + 10, 6, 1, pal.skinSh);
  faceFront(P, pal, hx, h, face);
}

function headBack(P, pal, hx, h) {
  P(hx - 3, h, 6, 1, pal.helmet);
  P(hx - 5, h + 1, 10, 4, pal.helmet);
  P(hx - 1, h, 2, 4, pal.helmetHi);
  P(hx + 3, h + 2, 2, 3, pal.helmetSh);
  P(hx - 5, h + 4, 10, 1, pal.helmetSh);
  P(hx - 4, h + 5, 8, 4, pal.hair);
  P(hx - 5, h + 6, 1, 2, pal.skin); P(hx + 4, h + 6, 1, 2, pal.skinSh);
  P(hx - 3, h + 9, 6, 2, pal.skin);
  P(hx - 3, h + 9, 6, 1, pal.skinSh);
}

function headSide(P, pal, h, face) {
  P(-3, h, 6, 1, pal.helmet);
  P(-5, h + 1, 10, 3, pal.helmet);
  P(-2, h + 1, 4, 1, pal.helmetHi);
  P(-5, h + 2, 2, 2, pal.helmetSh);
  P(-5, h + 4, 12, 1, pal.helmetSh);
  P(-4, h + 5, 8, 6, pal.skin);
  P(-4, h + 5, 3, 4, pal.hair);
  P(-1, h + 7, 1, 2, pal.skinSh);
  P(4, h + 8, 1, 1, pal.skin);
  P(-3, h + 10, 6, 1, pal.skinSh);
  if (face === 'happy') { P(1, h + 8, 1, 1, pal.eye); P(2, h + 7, 1, 1, pal.eye); P(2, h + 9, 2, 1, pal.white); P(1, h + 9, 1, 1, pal.blush); }
  else if (face === 'shock') { P(1, h + 6, 2, 3, pal.white); P(2, h + 7, 1, 1, pal.eye); P(2, h + 9, 2, 2, pal.mouthIn); }
  else if (face === 'blink' || face === 'sleep') { P(1, h + 8, 2, 1, pal.eye); P(2, h + 10, 2, 1, pal.mouth); }
  else { P(2, h + 7, 1, 2, pal.eye); if (face === 'focus' || face === 'serious') P(1, h + 6, 2, 1, pal.hair); P(2, h + 10, 2, 1, pal.mouth); }
}

// ---------- badan ----------
function legsFront(P, pal, legL, legR) {
  P(-4, -5 + legL, 4, 3, pal.pants); P(0, -5 + legR, 4, 3, pal.pants);
  P(-1, -4, 1, 2, pal.pantsSh);
  P(3, -5 + legR, 1, 3, pal.pantsSh);
  P(-5, -2 + legL, 5, 2, pal.boots); P(0, -2 + legR, 5, 2, pal.boots);
  P(-5, -1 + legL, 5, 1, pal.bootsSh); P(0, -1 + legR, 5, 1, pal.bootsSh);
}

function torsoFront(P, pal, t) {
  P(-5, t, 10, 8, pal.vest);
  P(-1, t, 2, 7, pal.shirt);
  P(-1, t + 3, 1, 1, pal.shirtSh); P(-1, t + 5, 1, 1, pal.shirtSh);
  P(-4, t, 1, 5, pal.tape); P(3, t, 1, 5, pal.tape);
  P(-5, t + 5, 4, 1, pal.tape); P(1, t + 5, 4, 1, pal.tape);
  P(4, t + 1, 1, 6, pal.vestSh);
  P(-5, t + 7, 10, 1, pal.belt);
  P(-3, t, 2, 1, pal.collar); P(1, t, 2, 1, pal.collar);
  P(-1, t, 2, 1, pal.skinSh);
}

function torsoBack(P, pal, t) {
  P(-5, t, 10, 8, pal.vest);
  P(-3, t, 1, 5, pal.tape); P(2, t, 1, 5, pal.tape);
  P(-5, t + 5, 10, 1, pal.tape);
  P(4, t + 1, 1, 6, pal.vestSh);
  P(-5, t + 7, 10, 1, pal.belt);
  P(-2, t, 4, 1, pal.collar);
}

// Lengan dilukis untuk sebelah kanan; sebelah kiri dicerminkan.
function arm(P, pal, side, mode, t) {
  const A = (x, r, w, h, c) => P(side > 0 ? x : -x - w, r, w, h, c);
  const S = pal.shirt, K = pal.skin, D = pal.shirtSh;
  switch (mode) {
    case 'fwd': A(5, t + 1, 2, 6, S); A(5, t + 7, 2, 2, K); break;
    case 'back': A(5, t, 2, 5, S); A(6, t, 1, 5, D); A(5, t + 5, 2, 2, K); break;
    case 'typeA': A(5, t, 2, 4, S); A(3, t + 4, 4, 2, S); A(2, t + 5, 2, 2, K); break;
    case 'typeB': A(5, t, 2, 4, S); A(3, t + 4, 4, 2, S); A(2, t + 6, 2, 2, K); break;
    case 'hold': A(5, t, 2, 4, S); A(3, t + 4, 4, 2, S); A(3, t + 5, 2, 2, K); break;
    case 'sip': A(5, t, 2, 3, S); A(4, t - 1, 2, 2, S); A(3, t - 2, 2, 2, K); break;
    case 'mugLow': A(5, t, 2, 4, S); A(4, t + 4, 2, 2, S); A(3, t + 4, 2, 2, K); break;
    case 'waveA': A(5, t - 4, 2, 6, S); A(5, t - 6, 3, 2, K); break;
    case 'waveB': A(5, t - 1, 2, 3, S); A(6, t - 4, 2, 3, S); A(7, t - 6, 2, 2, K); break;
    case 'fistHigh': A(5, t - 6, 2, 8, S); A(5, t - 8, 3, 2, K); break;
    case 'fistLow': A(5, t - 3, 2, 5, S); A(5, t - 5, 3, 2, K); break;
    case 'out': A(5, t, 2, 2, S); A(6, t + 1, 2, 3, S); A(7, t + 4, 2, 2, K); break;
    case 'gesture': A(5, t, 2, 3, S); A(6, t + 1, 2, 2, S); A(7, t - 1, 2, 2, K); break;
    case 'up': A(5, t - 8, 2, 9, S); A(5, t - 10, 2, 2, K); break;
    case 'upOut': A(5, t - 3, 2, 4, S); A(6, t - 8, 2, 5, S); A(7, t - 10, 2, 2, K); break;
    case 'point': A(5, t - 1, 2, 3, S); A(6, t - 4, 2, 3, S); A(7, t - 6, 2, 2, S); A(8, t - 8, 2, 2, K); break;
    case 'elbow': A(5, t, 2, 4, S); A(6, t + 1, 1, 3, D); break;
    case 'none': break;
    default: A(5, t, 2, 6, S); A(6, t + 1, 1, 5, D); A(5, t + 6, 2, 2, K);
  }
}

function front(P, pal, o) {
  const { pose, f } = o;
  let bob = 0, head = 0, hx = 0, legL = 0, legR = 0, aL = 'down', aR = 'down', face = o.face || 'neutral', extra = null;
  if (pose === 'walk') {
    if (f === 1) { legL = -1; bob = -1; aL = 'fwd'; aR = 'back'; }
    if (f === 3) { legR = -1; bob = -1; aL = 'back'; aR = 'fwd'; }
  } else if (pose === 'stand') { bob = f === 1 ? 1 : 0; }
  else if (pose === 'type') { aL = f ? 'typeA' : 'typeB'; aR = f ? 'typeB' : 'typeA'; }
  else if (pose === 'flip') { aL = aR = 'hold'; extra = 'clip'; }
  else if (pose === 'doze') { aL = aR = 'typeB'; head = f ? 3 : 2; face = 'sleep'; }
  else if (pose === 'sip') { aR = f === 0 ? 'sip' : 'mugLow'; extra = f === 0 ? 'mugHigh' : 'mugLow'; face = f === 0 ? 'sip' : 'happy'; }
  else if (pose === 'wave') { aR = f === 0 ? 'waveA' : 'waveB'; }
  else if (pose === 'cheer') { aR = f === 0 ? 'fistHigh' : 'fistLow'; aL = f === 0 ? 'out' : 'down'; bob = f === 0 ? -1 : 1; face = 'happy'; }
  else if (pose === 'shock') { aL = aR = 'out'; head = -1; hx = f === 0 ? -1 : 1; face = 'shock'; }
  else if (pose === 'shake') { hx = [-1, 0, 1, 0][f]; }
  else if (pose === 'talk') { aR = f === 0 ? 'gesture' : 'down'; if (f === 0 && face !== 'serious') face = 'talk'; }
  if (o.item === 'clipboard' && aR === 'down') { aR = 'none'; extra = 'boardSide'; }
  if (o.item === 'mug' && aR === 'down') { aR = 'mugLow'; extra = 'mugLow'; }

  const t = -13 + bob;
  legsFront(P, pal, legL, legR);
  arm(P, pal, -1, aL, t);
  torsoFront(P, pal, t);
  if (extra === 'boardSide') { P(5, t + 1, 2, 3, pal.shirt); P(4, t + 2, 5, 6, pal.board); P(5, t + 3, 3, 4, pal.paper); P(5, t + 4, 2, 1, pal.ink); P(5, t + 6, 3, 1, pal.ink); P(5, t + 7, 2, 1, pal.skin); }
  headFront(P, pal, hx, -24 + bob + head, face);
  arm(P, pal, 1, aR, t);
  if (extra === 'clip') {
    P(-4, t + 1, 8, 6, pal.board); P(-3, t + 2, 6, 4, pal.paper); P(-1, t, 2, 2, '#b9c0c6');
    P(-2, t + 3, 4, 1, pal.ink); P(-2, t + 5, 3, 1, pal.ink);
    if (f === 1) { P(1, t + 1, 3, 2, pal.white); P(2, t, 2, 1, pal.white); }
    P(-5, t + 5, 2, 2, pal.skin); P(3, t + 5, 2, 2, pal.skin);
  }
  if (extra === 'mugHigh') { P(-1, -16 + bob, 3, 3, pal.mug); P(2, -15 + bob, 1, 1, pal.mug); P(-1, -14 + bob, 3, 1, shade(pal.mug, 0.8)); }
  if (extra === 'mugLow') { P(1, t + 3, 3, 3, pal.mug); P(1, t + 3, 3, 1, pal.coffee); P(0, t + 4, 1, 1, pal.mug); }
}

function back(P, pal, o) {
  const { pose, f } = o;
  let bob = 0, head = 0, legL = 0, legR = 0, aL = 'down', aR = 'down';
  if (pose === 'walk') {
    if (f === 1) { legL = -1; bob = -1; aL = 'back'; aR = 'fwd'; }
    if (f === 3) { legR = -1; bob = -1; aL = 'fwd'; aR = 'back'; }
  } else if (pose === 'stand') { bob = f === 1 ? 1 : 0; }
  else if (pose === 'stretch') { aL = aR = f === 0 ? 'up' : 'upOut'; bob = f === 0 ? 0 : -1; }
  else if (pose === 'point') { aR = 'point'; head = f === 1 ? 1 : 0; }
  else if (pose === 'brew') { aL = aR = 'elbow'; bob = f === 1 ? 1 : 0; }
  const t = -13 + bob;
  legsFront(P, pal, legL, legR);
  arm(P, pal, -1, aL, t);
  arm(P, pal, 1, aR, t);
  torsoBack(P, pal, t);
  headBack(P, pal, 0, -24 + bob + head);
}

function side(P, pal, o) {
  const { pose, f } = o;
  let bob = 0, phase = 0;
  if (pose === 'walk') { if (f === 1) { phase = 1; bob = -1; } if (f === 3) { phase = 2; bob = -1; } }
  else if (pose === 'stand') bob = f === 1 ? 1 : 0;
  if (phase === 0) {
    P(-2, -5, 5, 3, pal.pants); P(-2, -5, 1, 3, pal.pantsSh);
    P(-2, -2, 6, 2, pal.boots); P(-2, -1, 6, 1, pal.bootsSh);
  } else {
    const near = phase === 1 ? pal.pants : pal.pantsSh, far = phase === 1 ? pal.pantsSh : pal.pants;
    P(-4, -5, 3, 2, far); P(-5, -4, 3, 2, far); P(-6, -3, 4, 2, pal.bootsSh);
    P(0, -5, 3, 3, near); P(1, -3, 3, 1, near); P(1, -2, 5, 2, pal.boots); P(1, -1, 5, 1, pal.bootsSh);
    P(-2, -5, 3, 1, pal.pants);
  }
  const t = -13 + bob;
  P(-3, t, 7, 8, pal.vest);
  P(3, t + 1, 1, 6, pal.shirt);
  P(-3, t, 1, 7, pal.vestSh);
  P(-2, t + 5, 5, 1, pal.tape); P(1, t, 1, 5, pal.tape);
  P(-3, t + 7, 7, 1, pal.belt);
  P(1, t, 3, 1, pal.collar);
  const ax = phase === 1 ? -2 : phase === 2 ? 1 : -1;
  if (o.item === 'clipboard') { P(-1, t + 1, 2, 4, pal.shirt); P(1, t + 2, 4, 6, pal.board); P(2, t + 3, 2, 4, pal.paper); P(0, t + 5, 2, 2, pal.skin); }
  else if (o.item === 'mug') { P(-1, t + 1, 2, 4, pal.shirt); P(0, t + 4, 3, 2, pal.shirt); P(3, t + 4, 1, 2, pal.skin); P(4, t + 3, 3, 3, pal.mug); P(4, t + 3, 3, 1, pal.coffee); }
  else { P(ax, t + 1, 2, 5, pal.shirt); P(ax, t + 1, 1, 5, pal.shirtSh); P(ax + (phase === 2 ? 1 : phase === 1 ? -1 : 0), t + 6, 2, 2, pal.skin); }
  headSide(P, pal, -24 + bob, o.face || 'neutral');
}

function paint(g, ox, oy, pal, o) {
  const cx = ox + 12, by = oy + CH;
  const mir = o.dir === 'left';
  const P = (x, r, w, h, c) => { g.fillStyle = c; g.fillRect(cx + (mir ? -x - w : x), by + r, w, h); };
  if (o.dir === 'down') front(P, pal, o);
  else if (o.dir === 'up') back(P, pal, o);
  else side(P, pal, o);
}

export class SpriteAtlas {
  constructor(palette) {
    this.pal = fullPalette(palette);
    this.cv = document.createElement('canvas');
    this.cv.width = CW * COLS; this.cv.height = CH * ROWS;
    this.g = this.cv.getContext('2d');
    this.map = new Map();
  }
  index(pose, dir, f, face, item) {
    const key = `${pose}|${dir}|${f}|${face}|${item || ''}`;
    let i = this.map.get(key);
    if (i === undefined) {
      i = this.map.size;
      if (i >= COLS * ROWS) return 0;
      this.map.set(key, i);
      paint(this.g, (i % COLS) * CW, ((i / COLS) | 0) * CH, this.pal, { pose, dir, f, face, item });
    }
    return i;
  }
  // (x, y) = titik tengah tapak kaki
  draw(g, x, y, pose, dir, f, face, item) {
    const i = this.index(pose, dir, f, face, item);
    g.drawImage(this.cv, (i % COLS) * CW, ((i / COLS) | 0) * CH, CW, CH, Math.round(x) - 12, Math.round(y) - CH + 1, CW, CH);
  }
}
