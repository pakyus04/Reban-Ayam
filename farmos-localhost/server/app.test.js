// Ujian API. Jalankan: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from './app.js';
import { calc, bom, schedule } from '../shared/farm.js';
import { offlineReply } from './halim.js';

async function boot(env = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farmos-test-'));
  const ctx = createApp({ dataDir, env: { FARMOS_STEP_MS: '15', LLM_PROVIDER: 'offline', ...env } });
  const server = await new Promise((r) => { const s = ctx.app.listen(0, '127.0.0.1', () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const j = async (method, url, body) => {
    const res = await fetch(base + url, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json() };
  };
  const stop = async () => { ctx.close(); server.closeAllConnections(); await new Promise((r) => server.close(r)); fs.rmSync(dataDir, { recursive: true, force: true }); };
  return { base, j, stop, dataDir };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('pengiraan: kapasiti dan kipas lalai', () => {
  const c = calc({});
  assert.equal(c.area, 72);
  assert.deepEqual(c.zB.cap, [360, 432]);
  assert.deepEqual(c.zL.cap, [216, 288]);
  assert.ok(c.zB.fans >= 2 && c.zB.speed >= 2, 'halaju angin capai sasaran 2 m/s');
  assert.equal(c.critical, false);
  assert.ok(bom({}).every((r) => !/\bRM\s?\d|harga/i.test(JSON.stringify(r))), 'BOM tiada harga');
  assert.equal(schedule({}).at(-1).tamat, 9);
});

test('pengiraan: tiada dinding pemisah = kritikal', () => {
  const c = calc({ part: false });
  assert.equal(c.critical, true);
  assert.equal(calc({ part: false, type: 'broiler' }).critical, false);
});

test('enjin luar talian: tolak soalan harga, tidak keliru dengan "kosong"', () => {
  assert.match(offlineReply('berapa harga semua ni', {}), /tak kira harga/);
  assert.doesNotMatch(offlineReply('reban saya kosong, berapa kapasiti?', {}), /tak kira harga/);
  assert.match(offlineReply('berapa exhaust fan', {}), /exhaust fan/);
});

test('API: state, simpan projek, amaran biosekuriti', async () => {
  const t = await boot();
  try {
    const s = await t.j('GET', '/api/state');
    assert.equal(s.status, 200);
    assert.equal(s.body.agents.length, 3);
    assert.equal(s.body.agents[0].live, 'idle');
    assert.equal(s.body.llm.provider, 'offline');
    const p = await t.j('PUT', '/api/project', { part: false });
    assert.equal(p.body.issues[0].severity, 'kritikal');
    assert.equal((await t.j('GET', '/api/state')).body.agents[0].live, 'alert');
    await t.j('PUT', '/api/project', { part: true });
    assert.equal((await t.j('GET', '/api/state')).body.agents[0].live, 'idle');
  } finally { await t.stop(); }
});

test('API: hantar data menjalankan 5 tugasan dan menandatangani', async () => {
  const t = await boot();
  try {
    const r = await t.j('POST', '/api/submit', { L: 20, W: 8 });
    assert.equal(r.status, 202);
    assert.equal((await t.j('POST', '/api/submit', {})).status, 409);
    assert.equal((await t.j('GET', '/api/state')).body.agents[0].live, 'working');
    await sleep(400);
    const s = (await t.j('GET', '/api/state')).body;
    assert.ok(s.tasks.every((x) => x.status === 'done'));
    assert.equal(s.signoff.project.L, 20);
    assert.equal(s.agents[0].live, 'happy');
    assert.ok(s.logs.some((l) => /siap sedia/.test(l.text)));
  } finally { await t.stop(); }
});

test('API: sembang luar talian, eksport BOM, muat naik foto', async () => {
  const t = await boot();
  try {
    const c = await t.j('POST', '/api/agent/halim', { message: 'berapa bajet?' });
    assert.equal(c.body.source, 'offline');
    assert.match(c.body.reply.text, /tak kira harga/);
    assert.equal((await t.j('POST', '/api/agent/halim', { message: '' })).status, 400);

    const csv = await (await fetch(t.base + '/api/export/bom.csv')).text();
    assert.match(csv, /^No,Kategori,Item,Spesifikasi,Kuantiti,Unit,Zon/);
    assert.doesNotMatch(csv, /\bRM\s?\d/);
    const md = await (await fetch(t.base + '/api/export/bom.md')).text();
    assert.match(md, /\| No \| Kategori \|/);

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    const fd = new FormData();
    fd.append('photo', new Blob([png], { type: 'image/png' }), 'rangka.png');
    const up = await (await fetch(t.base + '/api/upload', { method: 'POST', body: fd })).json();
    assert.ok(up.id && up.url.startsWith('/uploads/'));
    assert.equal((await fetch(t.base + up.url)).status, 200);
    const ph = await t.j('POST', '/api/agent/halim', { message: 'semak rangka', photoId: up.id });
    assert.match(ph.body.reply.text, /rangka\.png/);
    const bad = new FormData();
    bad.append('photo', new Blob(['x'], { type: 'text/plain' }), 'a.txt');
    assert.equal((await fetch(t.base + '/api/upload', { method: 'POST', body: bad })).status, 400);
  } finally { await t.stop(); }
});

test('API: daftar ejen dan status luar (Hermes)', async () => {
  const t = await boot();
  try {
    assert.equal((await t.j('POST', '/api/agents/halim/lock')).status, 400);
    const a = await t.j('POST', '/api/agents/kewangan/activate');
    assert.equal(a.body.status, 'active');
    const w = await t.j('POST', '/api/agents/halim/status', { status: 'bekerja', message: 'Mengira kipas' });
    assert.equal(w.body.live, 'working');
    assert.equal(w.body.message, 'Mengira kipas');
    assert.equal((await t.j('POST', '/api/agents/halim/status', { status: 'tidur' })).status, 400);
    assert.equal((await t.j('POST', '/api/agents/halim/status', { status: 'santai' })).body.live, 'idle');
  } finally { await t.stop(); }
});

test('API: data kekal selepas pelayan dimulakan semula', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farmos-test-'));
  const env = { FARMOS_STEP_MS: '15', LLM_PROVIDER: 'offline' };
  let ctx = createApp({ dataDir, env });
  ctx.db.setProject({ L: 33, W: 9 });
  ctx.db.addChat('user', 'ingat saya');
  ctx.close();
  ctx = createApp({ dataDir, env });
  assert.equal(ctx.db.project().L, 33);
  assert.equal(ctx.db.chat('halim').at(-1).text, 'ingat saya');
  ctx.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});
