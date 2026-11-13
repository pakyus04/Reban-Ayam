// Keadaan aplikasi: muat dari pelayan, simpan automatik, dan terima acara langsung (SSE).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PROJECT, TASKS, calc, normalizeProject } from '../shared/farm.js';

const FALLBACK = {
  project: DEFAULT_PROJECT,
  tasks: TASKS.map((t) => ({ id: t.id, title: t.title, detail: '', status: 'pending', doneAt: null })),
  logs: [], chat: [], signoff: null, llm: { provider: 'offline', model: 'enjin tempatan' }, kopi: 0, busy: false,
  agents: [
    { id: 'halim', slot: 1, name: 'Halim', role: 'PEMBINAAN', title: 'Perancang pembinaan reban dan biosekuriti', status: 'active', brain: 'halim', palette: {}, live: 'idle', message: '' },
    { id: 'kewangan', slot: 2, name: 'Agen 02', role: 'KEWANGAN', title: 'Kewangan dan bajet', status: 'locked', brain: 'generic', palette: { helmet: '#f2f2ec', vest: '#2f7dd1' }, live: 'idle', message: '' },
    { id: 'operasi', slot: 3, name: 'Agen 03', role: 'OPERASI', title: 'Operasi dan jualan', status: 'locked', brain: 'generic', palette: { helmet: '#3fb56f', vest: '#d8e04a' }, live: 'idle', message: '' },
  ],
};

async function api(method, url, body) {
  const res = await fetch(url, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ralat pelayan (${res.status})`);
  return data;
}

// Kecilkan foto dalam pelayar supaya muat naik pantas dan muat untuk LLM.
async function shrinkPhoto(file) {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.86));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch { return file; }
}

export function useFarm(officeRef) {
  const [st, setSt] = useState(FALLBACK);
  const [project, setProjectState] = useState(DEFAULT_PROJECT);
  const [online, setOnline] = useState(null);     // null = sedang menyambung
  const [notice, setNotice] = useState(null);     // {kind, text}
  const [sending, setSending] = useState(false);
  const lastEdit = useRef(0);
  const saveTimer = useRef(null);
  const noticeTimer = useRef(null);

  const flash = useCallback((text, kind = 'info') => {
    setNotice({ text, kind });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api('GET', '/api/state');
      setSt(data); setProjectState(normalizeProject(data.project)); setOnline(true);
    } catch { setOnline(false); }
  }, []);

  useEffect(() => {
    load();
    const es = new EventSource('/api/events');
    const on = (type, fn) => es.addEventListener(type, (e) => fn(JSON.parse(e.data)));
    const push = (key, max) => (row) => setSt((s) => (s[key].some((r) => r.id === row.id) ? s : { ...s, [key]: [...s[key], row].slice(-max) }));
    on('log', push('logs', 200));
    on('chat', push('chat', 120));
    on('tasks', (tasks) => setSt((s) => ({ ...s, tasks })));
    on('agent', (a) => setSt((s) => ({ ...s, agents: s.agents.map((x) => (x.id === a.id ? a : x)) })));
    on('agents', (agents) => setSt((s) => ({ ...s, agents })));
    on('signoff', (signoff) => setSt((s) => ({ ...s, signoff })));
    on('busy', (busy) => setSt((s) => ({ ...s, busy })));
    on('project', (p) => { if (Date.now() - lastEdit.current > 1500) setProjectState(normalizeProject(p)); });
    on('reset', () => load());
    es.onopen = () => setOnline((o) => { if (o === false) load(); return true; });
    es.onerror = () => setOnline(false);
    return () => { es.close(); clearTimeout(saveTimer.current); clearTimeout(noticeTimer.current); };
  }, [load]);

  const setProject = useCallback((patch) => {
    lastEdit.current = Date.now();
    setProjectState((p) => {
      const next = normalizeProject({ ...p, ...patch });
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { api('PUT', '/api/project', next).catch(() => {}); }, 350);
      return next;
    });
  }, []);

  const submit = useCallback(async () => {
    clearTimeout(saveTimer.current);
    try { await api('POST', '/api/submit', project); } catch (e) { flash(e.message, 'warn'); }
  }, [project, flash]);

  const sendChat = useCallback(async (message, file) => {
    setSending(true);
    officeRef.current?.chatStart('halim');
    try {
      let photoId = null;
      if (file) {
        const fd = new FormData();
        fd.append('photo', await shrinkPhoto(file));
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const up = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(up.error || 'Muat naik foto gagal.');
        photoId = up.id;
      }
      const out = await api('POST', '/api/agent/halim', { message, photoId });
      setSt((s) => (s.chat.some((r) => r.id === out.reply.id) ? s : { ...s, chat: [...s.chat, out.reply] }));
      officeRef.current?.chatReply('halim', out.reply.text);
      if (out.note) flash(`LLM gagal, Halim jawab guna enjin tempatan. ${out.note}`, 'warn');
      return true;
    } catch (e) {
      officeRef.current?.chatFail('halim');
      flash(e.message || 'Mesej gagal dihantar.', 'warn');
      return false;
    } finally { setSending(false); }
  }, [officeRef, flash]);

  const reset = useCallback(async () => {
    try { const data = await api('POST', '/api/reset'); setSt(data); setProjectState(normalizeProject(data.project)); flash('Data diset semula.'); }
    catch (e) { flash(e.message, 'warn'); }
  }, [flash]);

  const setAgentStatus = useCallback(async (id, action) => {
    try { await api('POST', `/api/agents/${id}/${action}`); } catch (e) { flash(e.message, 'warn'); }
  }, [flash]);

  const addKopi = useCallback(() => { api('POST', '/api/stats/kopi').then((d) => setSt((s) => ({ ...s, kopi: d.kopi }))).catch(() => {}); }, []);

  const c = useMemo(() => calc(project), [project]);
  const stale = useMemo(() => !!st.signoff && JSON.stringify(normalizeProject(st.signoff.project)) !== JSON.stringify(project), [st.signoff, project]);
  const done = st.tasks.filter((t) => t.status === 'done').length;
  const progress = st.busy ? (done + (st.tasks.some((t) => t.status === 'running') ? 0.5 : 0)) / st.tasks.length : null;

  return { st, project, calc: c, online, notice, sending, stale, done, progress, setProject, submit, sendChat, reset, setAgentStatus, addKopi, flash };
}
