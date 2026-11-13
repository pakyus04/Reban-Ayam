// Pangkalan data tempatan: SQLite terbina dalam Node (node:sqlite). Fail: data/farmos.db
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_PROJECT, normalizeProject, TASKS } from '../shared/farm.js';
import { AGENTS } from './agents.config.js';

export function openDb(dataDir) {
  fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'farmos.db'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, ord INTEGER NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', done_at TEXT);
    CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, agent TEXT NOT NULL DEFAULT 'halim', kind TEXT NOT NULL DEFAULT 'info', text TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, agent TEXT NOT NULL DEFAULT 'halim', role TEXT NOT NULL, text TEXT NOT NULL, photo TEXT, source TEXT);
    CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, file TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS agents (id TEXT PRIMARY KEY, slot INTEGER NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, brain TEXT NOT NULL, palette TEXT NOT NULL, live TEXT NOT NULL DEFAULT 'idle', message TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL);
  `);

  const now = () => new Date().toISOString();
  const q = {
    kvGet: db.prepare('SELECT value FROM kv WHERE key = ?'),
    kvSet: db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
    taskAll: db.prepare('SELECT id, title, detail, status, done_at AS doneAt FROM tasks ORDER BY ord'),
    taskUpsert: db.prepare('INSERT INTO tasks (id, ord, title) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET ord = excluded.ord, title = excluded.title'),
    taskSet: db.prepare('UPDATE tasks SET status = ?, detail = ?, done_at = ? WHERE id = ?'),
    taskReset: db.prepare("UPDATE tasks SET status = 'pending', detail = '', done_at = NULL"),
    logAdd: db.prepare('INSERT INTO logs (ts, agent, kind, text) VALUES (?, ?, ?, ?)'),
    logTail: db.prepare('SELECT * FROM (SELECT id, ts, agent, kind, text FROM logs ORDER BY id DESC LIMIT ?) ORDER BY id'),
    chatAdd: db.prepare('INSERT INTO chat (ts, agent, role, text, photo, source) VALUES (?, ?, ?, ?, ?, ?)'),
    chatTail: db.prepare('SELECT * FROM (SELECT id, ts, agent, role, text, photo, source FROM chat WHERE agent = ? ORDER BY id DESC LIMIT ?) ORDER BY id'),
    photoAdd: db.prepare('INSERT INTO photos (ts, file, name, mime, size) VALUES (?, ?, ?, ?, ?)'),
    photoGet: db.prepare('SELECT * FROM photos WHERE id = ?'),
    photoNote: db.prepare('UPDATE photos SET note = ? WHERE id = ?'),
    agentAll: db.prepare('SELECT * FROM agents ORDER BY slot'),
    agentGet: db.prepare('SELECT * FROM agents WHERE id = ?'),
    agentInsert: db.prepare('INSERT INTO agents (id, slot, name, role, title, status, brain, palette, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
    agentSync: db.prepare('UPDATE agents SET slot = ?, name = ?, role = ?, title = ?, brain = ?, palette = ? WHERE id = ?'),
    agentStatus: db.prepare('UPDATE agents SET status = ?, updated_at = ? WHERE id = ?'),
    agentLive: db.prepare('UPDATE agents SET live = ?, message = ?, updated_at = ? WHERE id = ?'),
  };

  // Semai tugasan dan ejen daripada konfigurasi.
  TASKS.forEach((t, i) => q.taskUpsert.run(t.id, i, t.title));
  for (const a of AGENTS) {
    const row = q.agentGet.get(a.id);
    if (!row) q.agentInsert.run(a.id, a.slot, a.name, a.role, a.title, a.status, a.brain, JSON.stringify(a.palette), now());
    else {
      q.agentSync.run(a.slot, a.name, a.role, a.title, a.brain, JSON.stringify(a.palette), a.id);
      if (a.status === 'active' && row.status !== 'active') q.agentStatus.run('active', now(), a.id);
    }
  }
  if (!q.kvGet.get('project')) q.kvSet.run('project', JSON.stringify(DEFAULT_PROJECT));
  // Kerja yang terputus semasa pelayan ditutup tidak boleh kekal "running".
  db.exec("UPDATE tasks SET status = 'pending' WHERE status = 'running'");
  db.exec("UPDATE agents SET live = 'idle', message = '' WHERE live IN ('working', 'chatting', 'happy')");

  const mapAgent = (r) => ({ id: r.id, slot: r.slot, name: r.name, role: r.role, title: r.title, status: r.status, brain: r.brain, palette: JSON.parse(r.palette), live: r.live, message: r.message, updatedAt: r.updated_at });
  const api = {
    now,
    kv: (k, d = null) => { const r = q.kvGet.get(k); return r ? JSON.parse(r.value) : d; },
    setKv: (k, v) => q.kvSet.run(k, JSON.stringify(v)),
    project: () => normalizeProject(api.kv('project', DEFAULT_PROJECT)),
    setProject: (p) => { const n = normalizeProject(p); api.setKv('project', n); return n; },
    tasks: () => q.taskAll.all().map((r) => ({ ...r })),
    setTask: (id, status, detail = '') => q.taskSet.run(status, detail, status === 'done' ? now() : null, id),
    resetTasks: () => q.taskReset.run(),
    log: (text, kind = 'info', agent = 'halim') => { const ts = now(); const r = q.logAdd.run(ts, agent, kind, text); return { id: Number(r.lastInsertRowid), ts, agent, kind, text }; },
    logs: (n = 120) => q.logTail.all(n).map((r) => ({ ...r })),
    addChat: (role, text, { agent = 'halim', photo = null, source = null } = {}) => { const ts = now(); const r = q.chatAdd.run(ts, agent, role, text, photo, source); return { id: Number(r.lastInsertRowid), ts, agent, role, text, photo, source }; },
    chat: (agent = 'halim', n = 80) => q.chatTail.all(agent, n).map((r) => ({ ...r })),
    addPhoto: (file, name, mime, size) => { const ts = now(); const r = q.photoAdd.run(ts, file, name, mime, size); return { id: Number(r.lastInsertRowid), ts, file, name, mime, size }; },
    photo: (id) => { const r = q.photoGet.get(id); return r ? { ...r } : null; },
    notePhoto: (id, note) => q.photoNote.run(note, id),
    agents: () => q.agentAll.all().map(mapAgent),
    agent: (id) => { const r = q.agentGet.get(id); return r ? mapAgent(r) : null; },
    setAgentStatus: (id, status) => q.agentStatus.run(status, now(), id),
    setAgentLive: (id, live, message = '') => q.agentLive.run(live, message, now(), id),
    wipe: () => { db.exec('DELETE FROM logs; DELETE FROM chat; DELETE FROM photos;'); q.taskReset.run(); api.setKv('project', DEFAULT_PROJECT); api.setKv('signoff', null); db.exec("UPDATE agents SET live = 'idle', message = ''"); },
    close: () => db.close(),
  };
  return api;
}
