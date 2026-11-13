// Enjin pejabat maya: gelung permainan, watak ejen, rutin harian, zarah, interaksi klik.
import { T, COLS, ROWS, VW, VH, R, rgba, text, hourNow, nightAmount } from './gfx.js';
import { findPath } from './path.js';
import { SpriteAtlas } from './sprites.js';
import { STATIONS, SPOTS, ZONES, buildBlocked, tileX, tileY } from './map.js';
import * as S from './scene.js';
import { TIPS } from '../../shared/farm.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// [bilangan bingkai, bingkai sesaat]
const FRAMES = { stand: [2, 1.4], doze: [2, 0.7], wave: [2, 6], cheer: [2, 5], shock: [2, 10], shake: [4, 8], talk: [2, 7], stretch: [2, 1.2], point: [2, 1.5], brew: [2, 3] };
const MOOD_FACE = { working: 'focus', alert: 'serious', happy: 'happy' };

const LINES = {
  coffee: ['Kopi O kaw... ahh, lega.', 'Kopi O dulu, baru otak jalan.', 'Ahh. Sedap kopi pagi ni.'],
  board: ['Aliran udara Barat ke Timur... okey.', 'Zon 3m x 10m ni kena kemas.', 'Pad di Barat, kipas di Timur. Betul.'],
  stretch: ['Aduh... lenguh pinggang.', 'Regang sikit.'],
  window: ['Kipas ekzos berpusing elok.', 'Cuaca panas. Cooling pad kena jalan.', 'Reban nampak tenang hari ni.'],
  flip: ['Semak senarai tapak...', 'Fail biosekuriti, mana satu ya...'],
};

class Agent {
  constructor(office, cfg, station, spawn) {
    this.o = office; this.cfg = cfg; this.id = cfg.id; this.station = station;
    this.atlas = new SpriteAtlas(cfg.palette);
    const s = spawn || station.seat;
    this.x = tileX(s.x); this.y = tileY(s.y);
    this.dir = 'down'; this.pose = spawn ? 'stand' : 'type'; this.seated = !spawn;
    this.path = []; this.queue = []; this.step = null; this.stepT = 0; this.brisk = false;
    this.mood = 'idle'; this.msg = ''; this.fast = false;
    this.t = rnd(0, 10); this.walkT = 0; this.dustT = 0; this.blinkT = rnd(1, 4);
    this.idleT = cfg.brain === 'halim' ? rnd(5, 8) : rnd(10, 18); this.microT = 0; this.micro = 'type'; this.alertT = 0;
    this.emote = null; this.bubble = null; this.item = null; this.lastRoutine = null; this.steamT = 0;
    if (spawn) this.run([{ pose: 'wave', dur: 1.6, dir: 'down', face: 'happy', fx: 'stars' }, { sit: true }]);
  }

  get tile() { return { x: Math.floor(this.x / T), y: Math.floor(this.y / T) }; }
  get isHalim() { return this.cfg.brain === 'halim'; }

  // ---------- skrip ----------
  run(steps) { this.queue = steps.slice(); this.step = null; this.path = []; this.item = null; this.emote = null; this.advance(); }

  advance() {
    const st = this.queue.shift() || null;
    this.step = st; this.stepT = 0;
    if (!st) return;
    if (st.sit) { st.go = this.station.seat; st.seat = true; }
    if (st.go) {
      const target = typeof st.go === 'string' ? this.o.spot(st.go, this) : st.go;
      const from = this.tile;
      let path = findPath(this.o.blocked, COLS, ROWS, from.x, from.y, target.x, target.y);
      if (path === null) { this.advance(); return; }
      if (!path.length && (Math.abs(this.x - tileX(target.x)) > 0.5 || Math.abs(this.y - tileY(target.y)) > 0.5)) path = [{ x: target.x, y: target.y }];
      this.seated = false; this.path = path; this.brisk = !!st.brisk; this.item = st.item || null;
      if (!path.length) this.arrive();
      return;
    }
    if (st.fn) { st.fn(this); this.advance(); return; }
    if (st.stand) this.seated = false;
    if (st.dir) this.dir = st.dir;
    this.pose = st.pose;
    if (st.emote !== undefined) this.emote = st.emote;
    if (st.say) this.say(st.say, { kind: st.kind, dur: st.sayDur });
    if (st.fx) this.o.burst(st.fx, this.x, this.y - 28);
    if (st.start) st.start(this);
  }

  arrive() {
    const st = this.step;
    this.item = null;
    if (st.seat) { this.seated = true; this.dir = 'down'; this.pose = 'type'; }
    else { this.pose = 'stand'; if (st.dir) this.dir = st.dir; }
    this.advance();
  }

  say(textIn, { kind = 'say', dur } = {}) {
    const t = String(textIn || '').trim();
    if (!t) return;
    this.bubble = { text: t, kind, age: 0, dur: dur ?? Math.min(9, Math.max(2.4, 1.6 + t.length / 14)) };
  }

  // ---------- suasana daripada pelayan ----------
  setMood(mood, msg = '') {
    const prev = this.mood, prevMsg = this.msg;
    this.mood = mood; this.msg = msg;
    if (mood === 'working') {
      this.bubble = { text: msg || 'Bekerja...', kind: 'thought', age: 99, dur: 1e9 };
      if (prev !== 'working') this.run([{ sit: true, brisk: true }]);
      return;
    }
    if (this.bubble && this.bubble.kind === 'thought') this.bubble = null;
    if (prev === mood) { if (mood === 'alert' && msg !== prevMsg) this.say(msg, { kind: 'alert' }); return; }
    if (mood === 'happy') {
      this.run([{ pose: 'cheer', dur: 4.6, dir: 'down', stand: true, say: msg || 'Pelan & BOM siap sedia untuk disemak!', sayDur: 5, fx: 'hearts', emote: 'star' }, { fn: (a) => { a.emote = null; } }]);
    } else if (mood === 'alert') {
      this.alertT = rnd(5, 7);
      this.run([{ pose: 'shock', dur: 1.8, dir: 'down', stand: true, emote: '!', say: msg, kind: 'alert', sayDur: 5.5 }, { go: 'front', brisk: true, dir: 'down' }]);
    } else if (prev === 'alert') {
      this.run([{ pose: 'cheer', dur: 2.4, dir: 'down', say: 'Bagus, risiko sudah dibetulkan.', fx: 'stars', emote: 'star' }, { fn: (a) => { a.emote = null; } }, { sit: true }]);
    }
  }

  // ---------- sembang ----------
  chatStart() {
    if (this.mood === 'working' || this.mood === 'alert') { this.emote = '...'; return; }
    this.run([{ go: 'front', brisk: true, dir: 'down' }, { pose: 'wave', dur: 1.1, dir: 'down', face: 'happy' }, { pose: 'stand', dur: 90, dir: 'down', emote: '...' }]);
  }
  chatReply(reply) {
    const short = clip(String(reply).replace(/\s+/g, ' '), 118), dur = Math.min(11, 2.6 + short.length / 16);
    if (this.mood === 'working') { this.emote = null; this.say(short, { dur }); return; }
    if (this.mood === 'alert') { this.run([{ pose: 'talk', dur, dir: 'down', say: short, sayDur: dur, emote: null }]); return; }
    this.run([{ go: 'front', brisk: true, dir: 'down' }, { pose: 'talk', dur, dir: 'down', say: short, sayDur: dur, emote: null }, { pose: 'stand', dur: 1.2, dir: 'down' }, { sit: true }]);
  }
  chatFail() { if (this.emote === '...') this.emote = null; if (this.step && this.step.emote === '...') this.run([{ sit: true }]); }

  poke() {
    if (this.mood === 'working') { this.say('Sekejap ya, tengah kira ni...', { dur: 2.4 }); return; }
    if (this.mood === 'alert') { this.say(this.msg, { kind: 'alert' }); return; }
    const tip = this.isHalim ? pick(TIPS) : `Saya ${this.cfg.name}. ${this.cfg.title}. Belum dilatih lagi.`;
    this.run([{ pose: 'wave', dur: 2.8, dir: 'down', face: 'happy', say: tip, sayDur: 7 }]);
  }

  // ---------- rutin harian ----------
  script(name) {
    const L = (k) => (this.isHalim ? pick(LINES[k]) : null);
    switch (name) {
      case 'coffee': return [
        { go: 'coffee', dir: 'up' },
        { pose: 'brew', dur: 2.6, dir: 'up', emote: 'cup', start: (a) => { a.o.brewing = 2.6; } },
        { pose: 'sip', dur: 4.4, dir: 'down', emote: null, say: L('coffee'), tick: (a, dt) => { a.steamT -= dt; if (a.steamT <= 0) { a.steamT = 0.22; a.o.steam(a.x + 2, a.y - 18); } } },
        { fn: (a) => { a.o.mugHot = 45; if (a.isHalim) a.o.h.onKopi?.(); } },
        { sit: true, item: 'mug' },
      ];
      case 'board': return [
        { go: 'board', dir: 'up' },
        { pose: 'point', dur: 4.8, dir: 'up', emote: 'bulb', say: L('board') },
        { fn: (a) => { a.emote = null; } },
        { sit: true, item: 'clipboard' },
      ];
      case 'window': return [
        { go: 'window', dir: 'up' },
        { pose: 'stretch', dur: 2.6, dir: 'up', say: L('stretch') },
        { pose: 'stand', dur: 4.2, dir: 'up', emote: 'note', say: L('window') },
        { fn: (a) => { a.emote = null; } },
        { sit: true },
      ];
      default:
        return this.o.isLate()
          ? [{ sit: true }, { pose: 'doze', dur: 9, dir: 'down', emote: 'z', tick: (a, dt) => { a.steamT -= dt; if (a.steamT <= 0) { a.steamT = 1.1; a.o.zzz(a.x + 6, a.y - 26); } } }, { fn: (a) => { a.emote = null; } }]
          : [{ sit: true }, { pose: 'flip', dur: 6, dir: 'down', say: L('flip') }];
    }
  }
  routine() {
    let r = pick(['coffee', 'board', 'window', 'desk'].filter((x) => x !== this.lastRoutine && (this.isHalim || x !== 'board')));
    if (this.o.isLate() && Math.random() < 0.55) r = 'desk';
    this.lastRoutine = r;
    this.run(this.script(r));
  }

  think(dt) {
    if (this.mood === 'working') {
      if (!this.seated) { this.run([{ sit: true, brisk: true }]); return; }
      this.pose = 'type'; this.fast = true; this.emote = null;
      if (!this.bubble) this.bubble = { text: this.msg || 'Bekerja...', kind: 'thought', age: 99, dur: 1e9 };
      return;
    }
    this.fast = false;
    if (this.mood === 'alert') {
      const f = this.o.spot('front', this), t = this.tile;
      if (t.x !== f.x || t.y !== f.y) { this.run([{ go: 'front', brisk: true, dir: 'down' }]); return; }
      this.seated = false; this.dir = 'down'; this.emote = '!'; this.pose = 'stand';
      this.alertT -= dt;
      if (this.alertT <= 0) { this.alertT = rnd(6, 9); this.run([{ pose: 'shake', dur: 1.4, dir: 'down', emote: '!', say: this.msg, kind: 'alert' }]); }
      return;
    }
    if (!this.seated) {
      const s = this.station.seat, t = this.tile;
      if (t.x === s.x && t.y === s.y && Math.abs(this.x - tileX(s.x)) < 0.5) { this.seated = true; this.dir = 'down'; }
      else { this.run([{ sit: true }]); return; }
    }
    if (this.emote !== null) this.emote = null;
    this.microT -= dt;
    if (this.microT <= 0) { this.microT = rnd(4, 7); this.micro = pick(['type', 'type', 'flip']); }
    this.pose = this.micro;
    if (this.mood === 'idle') {
      this.idleT -= dt;
      if (this.idleT <= 0) { this.idleT = rnd(12, 20); this.routine(); }
    }
  }

  update(dt) {
    this.t += dt;
    this.blinkT -= dt; if (this.blinkT < -0.13) this.blinkT = rnd(2, 5);
    if (this.bubble) { this.bubble.age += dt; if (this.bubble.age > this.bubble.dur) this.bubble = null; }
    if (this.path.length) {
      const p = this.path[0], px = tileX(p.x), py = tileY(p.y);
      const dx = px - this.x, dy = py - this.y, d = Math.hypot(dx, dy), sp = (this.brisk ? 76 : 44) * dt;
      this.pose = 'walk';
      if (d > 0.01) this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      this.walkT += dt * (this.brisk ? 1.5 : 1);
      this.dustT -= dt; if (this.dustT <= 0) { this.dustT = this.brisk ? 0.13 : 0.3; this.o.puff(this.x, this.y); }
      if (d <= sp) { this.x = px; this.y = py; this.path.shift(); if (!this.path.length) this.arrive(); }
      else { this.x += (dx / d) * sp; this.y += (dy / d) * sp; }
      return;
    }
    const st = this.step;
    if (st && st.pose) {
      this.stepT += dt;
      if (st.tick) st.tick(this, dt);
      if (this.stepT >= (st.dur ?? 2)) this.advance();
      return;
    }
    this.think(dt);
  }

  frame() {
    const p = this.pose;
    if (p === 'walk') return Math.floor(this.walkT * 8) % 4;
    if (p === 'type') return Math.floor(this.t * (this.fast ? 11 : 4.5)) % 2;
    if (p === 'flip') return this.t % 1.7 < 0.3 ? 1 : 0;
    if (p === 'sip') return this.stepT % 2.2 < 1.4 ? 0 : 1;
    const [n, rate] = FRAMES[p] || FRAMES.stand;
    return Math.floor(this.t * rate) % n;
  }

  draw(g) {
    const f = this.frame();
    let face = (this.step && this.step.face) || MOOD_FACE[this.mood] || 'neutral';
    if (this.blinkT < 0 && (face === 'neutral' || face === 'focus')) face = 'blink';
    const yOff = this.pose === 'cheer' && f === 0 ? -2 : 0;
    if (!this.seated) { R(g, this.x - 6, this.y, 12, 1, 'rgba(0,0,0,.28)'); R(g, this.x - 4, this.y + 1, 8, 1, 'rgba(0,0,0,.16)'); }
    this.atlas.draw(g, this.x, this.y + yOff, this.pose, this.dir, f, face, this.item);
    // pantulan cahaya monitor pada muka dan ves semasa menaip laju
    if (this.fast && this.seated) {
      const a = 0.1 + 0.07 * (Math.floor(this.t * 9) % 2);
      R(g, this.x - 4, this.y - 18, 8, 6, rgba('#57d6ff', a)); R(g, this.x - 5, this.y - 12, 10, 6, rgba('#57d6ff', a * 0.8));
    }
  }
}

export class Office {
  constructor(canvas, overlay, handlers = {}) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.overlay = overlay; this.h = handlers;
    const mk = () => { const c = document.createElement('canvas'); c.width = VW; c.height = VH; return c; };
    this.frameCv = mk(); this.g = this.frameCv.getContext('2d');
    this.bg = mk(); S.drawBackground(this.bg.getContext('2d'));
    this.fx = mk();
    this.blocked = buildBlocked();
    this.agents = new Map(); this.registry = []; this.booted = false;
    this.particles = []; this.t = 0; this.calc = null; this.progress = null;
    this.hover = null; this.paused = false; this.brewing = 0; this.mugHot = 0; this.ambientT = 0;
    this.k = 0; this.scale = 1; this.bubbles = new Map();
    const q = new URLSearchParams(window.location.search).get('jam');
    this.hourOverride = q !== null && q !== '' && Number.isFinite(Number(q)) ? Number(q) : null;

    this.onMove = (e) => { const hit = this.hit(this.toWorld(e)); this.hover = hit; this.cv.style.cursor = hit ? 'pointer' : 'default'; };
    this.onLeave = () => { this.hover = null; };
    this.onClick = (e) => { const hit = this.hit(this.toWorld(e)); if (!hit) { this.h.onMiss?.(); return; } if (hit.agent) { hit.agent.poke(); this.h.onAgent?.(hit.agent.id); } else this.trigger(hit.zone.id); };
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerleave', this.onLeave);
    canvas.addEventListener('click', this.onClick);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    this.last = performance.now();
    this.loop = (now) => {
      const dt = this.paused ? 0 : Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt); this.render();
      this.raf = requestAnimationFrame(this.loop);
    };
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf); this.ro.disconnect();
    this.cv.removeEventListener('pointermove', this.onMove); this.cv.removeEventListener('pointerleave', this.onLeave); this.cv.removeEventListener('click', this.onClick);
    for (const el of this.bubbles.values()) el.remove();
    this.bubbles.clear();
  }

  resize() {
    const rect = this.cv.getBoundingClientRect();
    if (!rect.width) return;
    this.scale = rect.width / VW;
    const k = Math.max(1, Math.min(5, Math.ceil(this.scale * (window.devicePixelRatio || 1))));
    if (k !== this.k) { this.k = k; this.cv.width = VW * k; this.cv.height = VH * k; }
  }

  hour() { return this.hourOverride ?? hourNow(); }
  isLate() { const h = this.hour(); return h >= 22 || h < 6; }
  date() { if (this.hourOverride === null) return new Date(); const d = new Date(); d.setHours(Math.floor(this.hourOverride), Math.round((this.hourOverride % 1) * 60)); return d; }

  // ---------- data daripada React ----------
  setAgents(list) {
    this.registry = [...list].sort((a, b) => a.slot - b.slot);
    for (const cfg of this.registry) {
      const st = STATIONS.find((s) => s.slot === cfg.slot);
      const have = this.agents.get(cfg.id);
      if (cfg.status === 'active' && st && !have) {
        const a = new Agent(this, cfg, st, this.booted ? { x: 15, y: 17 } : null);
        this.agents.set(cfg.id, a);
        if (cfg.live && cfg.live !== 'idle' && cfg.live !== 'chatting') a.setMood(cfg.live, cfg.message);
      } else if (cfg.status !== 'active' && have) this.agents.delete(cfg.id);
    }
    for (const id of [...this.agents.keys()]) if (!this.registry.find((r) => r.id === id)) this.agents.delete(id);
    this.booted = true;
  }
  setLive(id, live, message) { const a = this.agents.get(id); if (a && live !== 'chatting') a.setMood(live, message || ''); }
  setCalc(c) { this.calc = c; }
  setProgress(p) { this.progress = p; }
  setPaused(p) { this.paused = !!p; }
  chatStart(id = 'halim') { this.agents.get(id)?.chatStart(); }
  chatReply(id, reply) { this.agents.get(id)?.chatReply(reply); }
  chatFail(id = 'halim') { this.agents.get(id)?.chatFail(); }
  get halim() { return [...this.agents.values()].find((a) => a.isHalim) || null; }

  spot(name, agent) { const list = SPOTS[name]; return list[Math.min(list.length - 1, Math.max(0, agent.station.slot - 1))]; }

  // ---------- interaksi ----------
  toWorld(e) { const r = this.cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * VW, y: ((e.clientY - r.top) / r.height) * VH }; }
  hit(p) {
    const list = [...this.agents.values()].sort((a, b) => b.y - a.y);
    for (const a of list) if (Math.abs(p.x - a.x) < 9 && p.y > a.y - 27 && p.y < a.y + 2) return { agent: a };
    for (const z of ZONES) if (p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h) return { zone: z };
    return null;
  }
  trigger(id) {
    const z = ZONES.find((x) => x.id === id);
    if (!z) return;
    this.h.onZone?.(id, { x: (z.x + z.w / 2) * this.scale, y: (z.y + z.h) * this.scale, top: z.y * this.scale });
    const a = this.halim;
    if (!a) return;
    if (a.mood === 'working') { a.say('Sekejap ya, tengah kira ni...', { dur: 2.4 }); return; }
    if (a.mood === 'alert') { a.say('Betulkan risiko dulu ya.', { kind: 'alert', dur: 2.6 }); return; }
    const slotAgent = (slot) => this.registry.find((r) => r.slot === slot);
    const look = (slot) => {
      const st = STATIONS.find((s) => s.slot === slot), cfg = slotAgent(slot);
      const line = !cfg ? 'Meja ini masih kosong.' : cfg.status === 'active' ? `Itu meja ${cfg.name}.` : `Meja ini untuk ejen ${cfg.title.toLowerCase()} nanti.`;
      return [{ go: st.look, dir: 'up' }, { pose: 'stand', dur: 3.4, dir: 'up', emote: '?', say: line }, { fn: (x) => { x.emote = null; } }, { sit: true }];
    };
    const scripts = {
      coffee: () => a.script('coffee'), board: () => a.script('board'), window: () => a.script('window'), desk1: () => a.script('desk'),
      desk2: () => look(2), desk3: () => look(3),
      terminal: () => [{ go: 'terminal', dir: 'up' }, { pose: 'point', dur: 2.8, dir: 'up', say: 'Nak tambah ejen baharu?' }, { sit: true }],
      maquette: () => [{ go: 'maquette', dir: 'left' }, { pose: 'stand', dur: 3.8, dir: 'left', emote: 'bulb', say: 'Model reban 1:50. Kipas di Timur, pad di Barat.' }, { fn: (x) => { x.emote = null; } }, { sit: true }],
    };
    if (scripts[id]) { a.idleT = rnd(12, 20); a.run(scripts[id]()); }
  }

  // ---------- zarah ----------
  puff(x, y) { this.particles.push({ k: 'dust', x: x + rnd(-2, 2), y: y - 1, vx: rnd(-7, 7), vy: rnd(-9, -3), life: 0, max: 0.42 }); }
  steam(x, y) { this.particles.push({ k: 'steam', x: x + rnd(-1, 1), y, vx: rnd(-3, 3), vy: rnd(-12, -7), life: 0, max: 1.1 }); }
  zzz(x, y) { this.particles.push({ k: 'z', x, y, vx: rnd(2, 5), vy: -7, life: 0, max: 1.8 }); }
  burst(kind, x, y) { for (let i = 0; i < 8; i++) this.particles.push({ k: kind === 'hearts' ? (i % 2 ? 'heart' : 'star') : 'star', x: x + rnd(-8, 8), y: y + rnd(-2, 6), vx: rnd(-16, 16), vy: rnd(-30, -14), life: -i * 0.12, max: 1.3 }); }

  update(dt) {
    this.t += dt;
    if (!dt) return;
    this.brewing = Math.max(0, this.brewing - dt);
    this.mugHot = Math.max(0, this.mugHot - dt);
    this.ambientT -= dt;
    if (this.ambientT <= 0) { this.ambientT = this.brewing > 0 ? 0.1 : 0.55; this.steam(41, 43); if (this.mugHot > 0 && Math.random() < 0.5) this.steam(276, 139); }
    for (const a of this.agents.values()) a.update(dt);
    for (const p of this.particles) {
      p.life += dt;
      if (p.life < 0) continue;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 'dust') p.vy += 30 * dt;
      if (p.k === 'heart' || p.k === 'star') p.vy += 26 * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.max);
  }

  drawParticles(g) {
    for (const p of this.particles) {
      if (p.life < 0) continue;
      const a = 1 - p.life / p.max, x = Math.round(p.x), y = Math.round(p.y);
      if (p.k === 'dust') R(g, x, y, a > 0.5 ? 2 : 1, a > 0.5 ? 2 : 1, rgba('#d9c39a', a * 0.8));
      else if (p.k === 'steam') { R(g, x, y, 1, 2, rgba('#ffffff', a * 0.75)); if (a < 0.6) R(g, x + 1, y - 1, 1, 1, rgba('#ffffff', a * 0.5)); }
      else if (p.k === 'z') text(g, 'Z', x, y, rgba('#dfe6ea', a));
      else if (p.k === 'heart') { const c = rgba('#ff5d7e', a); R(g, x, y, 2, 2, c); R(g, x + 3, y, 2, 2, c); R(g, x, y + 1, 5, 2, c); R(g, x + 1, y + 3, 3, 1, c); R(g, x + 2, y + 4, 1, 1, c); }
      else { const c = rgba('#ffd84a', a); R(g, x + 2, y, 1, 5, c); R(g, x, y + 2, 5, 1, c); R(g, x + 1, y + 1, 3, 3, c); }
    }
  }

  render() {
    const g = this.g, t = this.t, hour = this.hour(), night = nightAmount(hour), late = this.isLate();
    const halim = this.halim;
    const working = !!halim && halim.mood === 'working';
    g.drawImage(this.bg, 0, 0);
    S.drawWindow(g, t, hour, this.calc ? this.calc.fansTotal : 4);
    S.drawClock(g, this.date());
    S.drawWhiteboard(g, t, this.calc);
    S.drawTerminal(g, t, this.registry);
    S.drawWingWall(g, this.registry);
    S.drawPantryFx(g, t, this.brewing > 0);
    S.drawPlotter(g, t, working);
    S.drawWindowLight(g, hour);

    const items = [{ z: 80, f: () => { S.drawMonstera(g, t); S.drawFern(g, t); } }, { z: 240, f: () => S.drawMaquette(g) }, { z: 144, f: () => S.drawBreakTable(g) }];
    for (const st of STATIONS) {
      const cfg = this.registry.find((r) => r.slot === st.slot);
      const ag = cfg ? this.agents.get(cfg.id) : null;
      const cx = tileX(st.seat.x), seatY = st.seat.y * T + 16;
      items.push({ z: seatY - 1.5, f: () => S.drawChair(g, cx, seatY, !!(ag && ag.seated)) });
      if (st.kind === 'main') items.push({ z: 160, f: () => S.drawMainDesk(g, t, { working, alert: !!halim && halim.mood === 'alert', night, mugHot: this.mugHot > 0, name: cfg ? cfg.name : 'HALIM' }) });
      else items.push({ z: st.deskY + 26, f: () => S.drawWingDesk(g, t, st, cfg, !!cfg && cfg.status === 'active') });
    }
    for (const a of this.agents.values()) items.push({ z: a.y, f: () => a.draw(g) });
    items.sort((p, q) => p.z - q.z).forEach((i) => i.f());
    this.drawParticles(g);

    for (const st of STATIONS) {
      if (st.kind !== 'wing') continue;
      const cfg = this.registry.find((r) => r.slot === st.slot), no = String(st.slot).padStart(2, '0');
      const label = cfg ? `[SLOT ${no}: ${cfg.role} - ${cfg.status === 'active' ? 'AKTIF' : 'LOCKED'}]` : `[SLOT ${no}: KOSONG]`;
      S.drawPlate(g, 444, st.plateY, label, !!cfg && cfg.status === 'active', t);
    }

    // pencahayaan malam
    if (night > 0.02) {
      const lamps = [];
      if (!late) lamps.push({ x: 48, y: 120, r: 100, a: 0.8 }, { x: 296, y: 150, r: 140, a: 0.85 }, { x: 448, y: 170, r: 120, a: 0.8 }, { x: 150, y: 230, r: 110, a: 0.7 });
      lamps.push({ x: 312, y: 138, r: late ? 56 : 44, a: 0.9, color: '#ffd27a' });
      lamps.push({ x: 270, y: 120, r: 30, a: 0.6, color: working ? '#57d6ff' : '#3aa6d6' }, { x: 322, y: 120, r: 30, a: 0.6, color: working ? '#57d6ff' : '#3aa6d6' });
      lamps.push({ x: 410, y: 26, r: 30, a: 0.7, color: '#3a7bff' }, { x: 308, y: 96, r: 76, a: 0.3, color: '#9fb6ff' }, { x: 8, y: 50, r: 16, a: 0.4, color: '#3fe08f' }, { x: 42, y: 46, r: 16, a: 0.45, color: '#ff6a4a' });
      for (const a of this.agents.values()) if (!a.isHalim && a.seated) lamps.push({ x: a.x - 10, y: a.y - 12, r: 28, a: 0.6, color: '#3aa6d6' });
      S.drawLighting(g, this.fx, { night, late, lamps });
    }

    // sorotan zon dan emote (sentiasa terang)
    if (this.hover && this.hover.zone) {
      const z = this.hover.zone, c = '#ffe680', L = 5;
      [[z.x, z.y, 1, 1], [z.x + z.w - 1, z.y, -1, 1], [z.x, z.y + z.h - 1, 1, -1], [z.x + z.w - 1, z.y + z.h - 1, -1, -1]].forEach(([x, y, sx, sy]) => {
        R(g, sx > 0 ? x : x - L + 1, y, L, 1, c); R(g, x, sy > 0 ? y : y - L + 1, 1, L, c);
      });
    }
    for (const a of this.agents.values()) {
      const hoverA = this.hover && this.hover.agent === a;
      if (a.emote) S.drawEmote(g, a.x, a.y - 27, a.emote, t);
      else if (hoverA) R(g, a.x - 1, a.y - 30, 3, 2, '#ffe680');
      if (a.isHalim && a.mood === 'working' && this.progress !== null) {
        const w = 24, x = Math.round(a.x - w / 2), y = Math.round(a.y) - 33;
        R(g, x - 1, y - 1, w + 2, 5, '#14181c'); R(g, x, y, w, 3, '#3b4650'); R(g, x, y, Math.round(w * Math.max(0.04, this.progress)), 3, '#ff7a1a'); R(g, x, y, Math.round(w * Math.max(0.04, this.progress)), 1, '#ffb066');
      }
    }

    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    c.drawImage(this.frameCv, 0, 0, VW * this.k, VH * this.k);
    this.syncBubbles();
  }

  syncBubbles() {
    const s = this.scale, wrapW = this.overlay.clientWidth;
    for (const a of this.agents.values()) {
      let el = this.bubbles.get(a.id);
      const b = a.bubble;
      if (!b) { if (el) el.hidden = true; continue; }
      if (!el) { el = document.createElement('div'); this.overlay.appendChild(el); this.bubbles.set(a.id, el); }
      el.hidden = false;
      const cls = `fo-bubble fo-${b.kind}`;
      if (el.className !== cls) el.className = cls;
      const n = Math.min(b.text.length, Math.floor(b.age * 42));
      const shown = b.text.slice(0, Math.max(1, n));
      if (el._t !== shown) { el.textContent = shown; el._t = shown; }
      const lift = (a.isHalim && a.mood === 'working' && this.progress !== null ? 38 : a.emote ? 42 : 29);
      const bw = el.offsetWidth, x = Math.max(bw / 2 + 4, Math.min(wrapW - bw / 2 - 4, a.x * s));
      el.style.left = `${x}px`;
      el.style.top = `${Math.max(el.offsetHeight + 4, (a.y - lift) * s)}px`;
      el.style.setProperty('--tail', `${Math.max(10, Math.min(bw - 10, a.x * s - x + bw / 2))}px`);
    }
    for (const [id, el] of this.bubbles) if (!this.agents.has(id)) { el.remove(); this.bubbles.delete(id); }
  }
}

export { ZONES };
