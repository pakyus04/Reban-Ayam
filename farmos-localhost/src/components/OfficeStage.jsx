import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { Office, ZONES } from '../office/Office.js';

export const MOOD = {
  idle: { label: 'Santai', dot: 'bg-blue' },
  chatting: { label: 'Bersembang', dot: 'bg-blue pulse' },
  working: { label: 'Bekerja', dot: 'bg-hivis pulse' },
  happy: { label: 'Siap', dot: 'bg-ok' },
  alert: { label: 'Amaran', dot: 'bg-warn pulse' },
};
const MOOD_COLOR = { idle: '#8fd0ff', chatting: '#8fd0ff', working: '#ffb066', happy: '#7dffb8', alert: '#ff8a7a' };

const OfficeStage = forwardRef(function OfficeStage({ agents, ready, calc, progress, paused, setPaused, popup, onZone, onClosePopup, onKopi, llm }, ref) {
  const cvRef = useRef(null), ovRef = useRef(null), office = useRef(null), cb = useRef({});
  cb.current = { onZone, onClosePopup, onKopi };

  useEffect(() => {
    const o = new Office(cvRef.current, ovRef.current, {
      onZone: (id, at) => cb.current.onZone?.(id, at),
      onMiss: () => cb.current.onClosePopup?.(),
      onAgent: () => cb.current.onClosePopup?.(),
      onKopi: () => cb.current.onKopi?.(),
    });
    office.current = o;
    window.farmosOffice = o;   // untuk nyahpepijat dari konsol pelayar
    return () => { o.destroy(); office.current = null; };
  }, []);

  useImperativeHandle(ref, () => ({
    chatStart: (id) => office.current?.chatStart(id),
    chatReply: (id, text) => office.current?.chatReply(id, text),
    chatFail: (id) => office.current?.chatFail(id),
    trigger: (id) => office.current?.trigger(id),
    poke: (id) => office.current?.agents.get(id)?.poke(),
  }), []);

  const regKey = agents.map((a) => `${a.id}:${a.status}:${a.slot}`).join('|');
  const liveKey = agents.map((a) => `${a.id}:${a.live}:${a.message}`).join('|');
  // Tunggu data sebenar dari pelayan supaya ejen sedia ada tidak "masuk semula" setiap kali halaman dimuat.
  useEffect(() => { if (ready) office.current?.setAgents(agents); }, [regKey, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready) for (const a of agents) office.current?.setLive(a.id, a.live, a.message); }, [liveKey, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { office.current?.setCalc(calc); }, [calc]);
  useEffect(() => { office.current?.setProgress(progress); }, [progress]);
  useEffect(() => { office.current?.setPaused(paused); }, [paused]);

  const halim = agents.find((a) => a.brain === 'halim') || agents[0];
  const mood = MOOD[halim?.live] || MOOD.idle;
  const brain = llm.provider === 'offline' ? 'Otak: enjin tempatan' : `Otak: ${llm.provider === 'anthropic' ? 'Claude' : 'Gemini'}`;

  return (
    <section aria-label="Pejabat maya" className="rounded-lg border border-line bg-panel p-2.5 sm:p-3">
      <div className="office-frame">
        <canvas ref={cvRef} role="img" aria-label={`Pejabat piksel 16-bit. Halim sedang ${mood.label.toLowerCase()}.`} />
        <div ref={ovRef} className="office-overlay">
          <div className="fo-chip left-2">Halim: <span style={{ color: MOOD_COLOR[halim?.live] || MOOD_COLOR.idle }}>{mood.label}</span></div>
          <div className="fo-chip right-2">{brain}</div>
          {popup && (
            <div className={`fo-popup ${popup.above ? 'above' : ''}`} style={{ left: popup.x, top: popup.above ? popup.top : popup.y }} role="dialog" aria-label={popup.title}>
              <div className="mb-1 flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-semibold leading-tight">{popup.title}</h3>
                <button onClick={onClosePopup} aria-label="Tutup" className="-mr-1 rounded p-0.5 text-mute hover:text-ink"><X size={16} /></button>
              </div>
              <div className="space-y-1.5 text-[13.5px] text-mute [&_b]:font-semibold [&_b]:text-ink">{popup.body}</div>
              {popup.action && <button onClick={popup.action.fn} className="mt-2.5 rounded bg-hivis px-3 py-1.5 text-[13px] font-semibold text-hivis-ink hover:brightness-110">{popup.action.label}</button>}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[13px]">
        <span className="mr-1 text-mute">Klik dalam pejabat, atau:</span>
        <button onClick={() => office.current?.agents.get(halim?.id)?.poke()} className="rounded border border-line px-2 py-0.5 hover:border-hivis">Sapa Halim</button>
        {ZONES.map((z) => (
          <button key={z.id} onClick={() => office.current?.trigger(z.id)} className="rounded border border-line px-2 py-0.5 hover:border-hivis">{z.label}</button>
        ))}
        <button onClick={() => setPaused(!paused)} aria-pressed={paused} className="ml-auto flex items-center gap-1.5 rounded border border-line px-2 py-0.5 text-mute hover:border-hivis hover:text-ink">
          {paused ? <Play size={13} /> : <Pause size={13} />}{paused ? 'Sambung animasi' : 'Jeda animasi'}
        </button>
      </div>
    </section>
  );
});

export default OfficeStage;
