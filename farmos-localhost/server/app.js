// Pelayan API FarmOS (Express). Semua data kekal dalam data/farmos.db.
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { openDb } from './db.js';
import { calc, bom, bomCsv, bomMarkdown, TASKS, taskDetail, TYPE_LABEL, fmt } from '../shared/farm.js';
import { askHalim, llmMode } from './halim.js';

const LIVE_ALIAS = { santai: 'idle', idle: 'idle', bekerja: 'working', working: 'working', siap: 'happy', happy: 'happy', amaran: 'alert', alert: 'alert' };
const MIME_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const today = () => new Date().toLocaleDateString('en-CA');

export function createApp({ dataDir, distDir = null, env = process.env } = {}) {
  const db = openDb(dataDir);
  const uploadDir = path.join(dataDir, 'uploads');
  const stepMs = Number(env.FARMOS_STEP_MS || 1200);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // ---------- acara langsung (SSE) ----------
  const clients = new Set();
  const emit = (type, data) => { const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const c of clients) c.write(msg); };
  const ping = setInterval(() => emit('ping', Date.now()), 25000);
  ping.unref();
  app.get('/api/events', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
  });
  const log = (text, kind = 'info', agent = 'halim') => { const row = db.log(text, kind, agent); emit('log', row); return row; };

  // ---------- status langsung Halim ----------
  let job = null;          // kerja "Hantar data" yang sedang berjalan
  let ext = null;          // status daripada ejen luar (contoh Hermes)
  let flash = null;        // status sementara (siap / sembang)
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

  function baseLive() {
    if (job) return ['working', job.msg];
    if (flash) return [flash.live, flash.message];
    if (ext) return [ext.live, ext.message];
    const c = calc(db.project());
    if (c.critical) return ['alert', c.issues.find((i) => i.severity === 'kritikal').text];
    return ['idle', ''];
  }
  function refreshLive() {
    const [live, message] = baseLive();
    const a = db.agent('halim');
    if (a.live !== live || a.message !== message) { db.setAgentLive('halim', live, message); emit('agent', db.agent('halim')); }
  }
  function setFlash(live, message, ms) {
    const f = { live, message }; flash = f; refreshLive();
    if (ms) later(() => { if (flash === f) { flash = null; refreshLive(); } }, ms);
    return () => { if (flash === f) { flash = null; refreshLive(); } };
  }

  const state = () => ({
    project: db.project(), tasks: db.tasks(), logs: db.logs(), chat: db.chat('halim'), agents: db.agents(),
    signoff: db.kv('signoff'), llm: llmMode(env), kopi: db.kv(`kopi:${today()}`, 0), busy: !!job, taskDefs: TASKS,
  });

  app.get('/api/health', (req, res) => res.json({ ok: true, llm: llmMode(env).provider }));
  app.get('/api/state', (req, res) => res.json(state()));

  // ---------- projek ----------
  app.put('/api/project', (req, res) => {
    const before = calc(db.project());
    const project = db.setProject({ ...db.project(), ...(req.body || {}) });
    const after = calc(project);
    if (!before.critical && after.critical) log(`Amaran: ${after.issues.find((i) => i.severity === 'kritikal').text}`, 'warn');
    if (before.critical && !after.critical) log('Risiko kritikal sudah dibetulkan.', 'ok');
    emit('project', project);
    refreshLive();
    res.json({ project, issues: after.issues });
  });

  app.post('/api/submit', (req, res) => {
    if (job) return res.status(409).json({ error: 'Halim masih bekerja. Tunggu sehingga siap.' });
    const project = req.body && Object.keys(req.body).length ? db.setProject({ ...db.project(), ...req.body }) : db.project();
    emit('project', project);
    const c = calc(project);
    job = { msg: 'Menerima data projek...' };
    ext = null; flash = null;
    db.resetTasks();
    emit('tasks', db.tasks());
    log(`Data diterima: ${TYPE_LABEL[project.type].toLowerCase()}, reban ${fmt.r1(project.L)} x ${fmt.r1(project.W)} m. Halim mula bekerja.`);
    refreshLive();
    emit('busy', true);

    const step = (i) => {
      if (i >= TASKS.length) {
        const signoff = { at: db.now(), project, critical: c.critical, issues: c.issues.length };
        db.setKv('signoff', signoff);
        emit('signoff', signoff);
        job = null;
        emit('busy', false);
        if (c.critical) { log(`Siap, tetapi ada ${c.issues.filter((x) => x.severity === 'kritikal').length} risiko kritikal. Betulkan sebelum membina.`, 'warn'); refreshLive(); }
        else { log('Pelan dan BOM siap sedia untuk disemak.', 'ok'); setFlash('happy', 'Pelan & BOM siap sedia untuk disemak!', 9000); }
        return;
      }
      const t = TASKS[i];
      db.setTask(t.id, 'running');
      job.msg = t.thought;
      emit('tasks', db.tasks());
      refreshLive();
      later(() => {
        const detail = taskDetail(t.id, project);
        db.setTask(t.id, 'done', detail);
        emit('tasks', db.tasks());
        log(`${t.title}: ${detail}`, 'task');
        step(i + 1);
      }, stepMs);
    };
    later(() => step(0), Math.min(stepMs, 600));
    res.status(202).json({ ok: true, steps: TASKS.length, stepMs });
  });

  // ---------- eksport BOM ----------
  app.get('/api/export/bom.csv', (req, res) => {
    const p = db.project();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bom-reban-halim.csv"');
    res.send('﻿' + bomCsv(bom(p)));
    log('BOM dimuat turun (CSV).');
  });
  app.get('/api/export/bom.md', (req, res) => {
    const p = db.project();
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bom-reban-halim.md"');
    res.send(bomMarkdown(bom(p), p));
    log('BOM dimuat turun (Markdown).');
  });

  // ---------- foto tapak ----------
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${MIME_EXT[file.mimetype] || ''}`),
    }),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => (MIME_EXT[file.mimetype] ? cb(null, true) : cb(new Error('Hanya foto JPG, PNG atau WebP diterima.'))),
  });
  app.post('/api/upload', (req, res) => {
    upload.single('photo')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Foto melebihi 8 MB. Kecilkan dahulu.' : err.message });
      if (!req.file) return res.status(400).json({ error: 'Tiada foto diterima.' });
      const name = path.basename(String(req.file.originalname || 'foto')).slice(0, 80);
      const row = db.addPhoto(req.file.filename, name, req.file.mimetype, req.file.size);
      res.json({ id: row.id, url: `/uploads/${row.file}`, name });
    });
  });
  app.use('/uploads', express.static(uploadDir, { fallthrough: false, index: false }));

  // ---------- sembang dengan ejen ----------
  app.post('/api/agent/:id', async (req, res) => {
    const agent = db.agent(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Ejen tidak dijumpai.' });
    const message = String(req.body?.message || '').trim().slice(0, 2000);
    const photo = req.body?.photoId ? db.photo(Number(req.body.photoId)) : null;
    if (!message && !photo) return res.status(400).json({ error: 'Tulis mesej atau lampirkan foto.' });
    if (req.body?.photoId && !photo) return res.status(400).json({ error: 'Foto tidak dijumpai. Muat naik semula.' });

    const history = db.chat(agent.id, 12);
    const userRow = db.addChat('user', message || 'Sila semak foto tapak ini.', { agent: agent.id, photo: photo ? `/uploads/${photo.file}` : null });
    emit('chat', userRow);
    if (photo) log(`Foto tapak direkod: ${photo.name}.`, 'photo');

    if (agent.brain !== 'halim') {
      const row = db.addChat('agent', `${agent.name} belum dilatih. Buat masa ini hanya Halim boleh menjawab.`, { agent: agent.id, source: 'offline' });
      emit('chat', row);
      return res.json({ reply: row, source: 'offline' });
    }

    const done = job ? () => {} : setFlash('chatting', 'Menaip jawapan...', 0);
    try {
      let image = null;
      if (photo && llmMode(env).provider !== 'offline' && photo.size <= 4.5 * 1024 * 1024) {
        image = { mime: photo.mime, data: fs.readFileSync(path.join(uploadDir, photo.file)).toString('base64') };
      }
      const out = await askHalim({ message, project: db.project(), history, photo, image, env });
      if (out.note) log(`LLM gagal, guna enjin tempatan. ${out.note}`, 'warn');
      if (photo) db.notePhoto(photo.id, out.reply.slice(0, 500));
      const row = db.addChat('agent', out.reply, { agent: agent.id, source: out.source });
      emit('chat', row);
      res.json({ reply: row, source: out.source, note: out.note || null });
    } catch (err) {
      res.status(500).json({ error: 'Halim gagal menjawab. ' + String(err?.message || err) });
    } finally {
      done();
    }
  });

  // ---------- daftar ejen ----------
  app.get('/api/agents', (req, res) => res.json(db.agents()));
  app.post('/api/agents/:id/:action', (req, res, next) => {
    const { id, action } = req.params;
    const agent = db.agent(id);
    if (!agent) return res.status(404).json({ error: 'Ejen tidak dijumpai.' });
    if (action === 'activate' || action === 'lock') {
      if (id === 'halim') return res.status(400).json({ error: 'Halim tidak boleh dikunci.' });
      db.setAgentStatus(id, action === 'activate' ? 'active' : 'locked');
      log(action === 'activate' ? `Slot ${String(agent.slot).padStart(2, '0')} dibuka: ${agent.name} (${agent.title}) masuk pejabat.` : `Slot ${String(agent.slot).padStart(2, '0')} dikunci semula.`, 'info', id);
      emit('agents', db.agents());
      return res.json(db.agent(id));
    }
    if (action === 'status') {
      // Untuk ejen luar (contoh Hermes): POST {status: 'bekerja'|'siap'|'amaran'|'santai', message}
      const live = LIVE_ALIAS[String(req.body?.status || '').toLowerCase()];
      if (!live) return res.status(400).json({ error: "status mesti 'santai', 'bekerja', 'siap' atau 'amaran'." });
      const message = String(req.body?.message || '').slice(0, 200);
      if (id !== 'halim') { db.setAgentLive(id, live, message); emit('agent', db.agent(id)); return res.json(db.agent(id)); }
      if (job) return res.status(409).json({ error: 'Halim sedang menjalankan tugasan dalam aplikasi.' });
      flash = null;
      if (live === 'happy') { ext = null; setFlash('happy', message || 'Kerja siap!', 9000); }
      else { ext = live === 'idle' ? null : { live, message }; refreshLive(); }
      log(`Status luar: ${req.body.status}${message ? ' - ' + message : ''}`, live === 'alert' ? 'warn' : 'info');
      return res.json(db.agent(id));
    }
    next();
  });

  // ---------- lain-lain ----------
  app.post('/api/stats/kopi', (req, res) => {
    const k = `kopi:${today()}`; const n = db.kv(k, 0) + 1; db.setKv(k, n);
    res.json({ kopi: n });
  });
  app.post('/api/reset', (req, res) => {
    if (job) return res.status(409).json({ error: 'Halim masih bekerja. Tunggu sehingga siap.' });
    ext = null; flash = null;
    db.wipe();
    for (const f of fs.readdirSync(uploadDir)) fs.rmSync(path.join(uploadDir, f), { force: true });
    log('Data diset semula. Halim sedia menerima data projek.');
    emit('reset', true);
    res.json(state());
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Laluan API tidak dijumpai.' }));

  if (distDir && fs.existsSync(path.join(distDir, 'index.html'))) {
    app.use(express.static(distDir));
    app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(distDir, 'index.html')) : next()));
  }
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: err.type === 'entity.parse.failed' ? 'JSON tidak sah.' : String(err.message || err) });
  });

  if (!db.logs(1).length) db.log('FarmOS bermula. Halim sedia menerima data projek.');
  refreshLive();

  const close = () => { clearInterval(ping); for (const t of timers) clearTimeout(t); for (const c of clients) c.end(); db.close(); };
  return { app, db, close };
}
