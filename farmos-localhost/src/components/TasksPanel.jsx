import { useEffect, useRef } from 'react';
import { Check, Circle, LoaderCircle } from 'lucide-react';

const KIND = { warn: 'text-warn', ok: 'text-ok', task: 'text-ink', photo: 'text-blue' };

export default function TasksPanel({ tasks, logs, busy }) {
  const done = tasks.filter((t) => t.status === 'done').length;
  const pct = Math.round((done / tasks.length) * 100);
  const logRef = useRef(null);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [logs.length]);
  return (
    <section aria-labelledby="h-tugas" className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="h-tugas" className="font-display text-[22px] font-semibold leading-tight">Lima tugas Halim</h2>
        <span className="text-[13px] tabular-nums text-mute">{done}/{tasks.length} siap</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Kemajuan tugasan">
        <div className={`h-full rounded-full bg-hivis transition-[width] duration-500 ${busy ? 'pulse' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-3 space-y-1.5">
        {tasks.map((t, i) => (
          <li key={t.id} className={`flex items-start gap-2.5 rounded-md px-3 py-2 ${t.status === 'running' ? 'bg-hivis/10 ring-1 ring-hivis' : 'bg-raised'}`}>
            <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-semibold ${t.status === 'done' ? 'bg-ok text-ground' : t.status === 'running' ? 'text-hivis' : 'text-mute'}`}>
              {t.status === 'done' ? <Check size={13} strokeWidth={3} /> : t.status === 'running' ? <LoaderCircle size={16} className="animate-spin" /> : <Circle size={15} />}
            </span>
            <div className="min-w-0">
              <div className="leading-snug"><span className="text-mute">{i + 1}. </span><span className={t.status === 'done' ? '' : 'font-medium'}>{t.title}</span></div>
              {t.detail && <div className="text-[13px] text-mute">{t.detail}</div>}
            </div>
          </li>
        ))}
      </ol>

      <h3 className="mt-4 text-[13px] font-semibold text-mute">Log aktiviti</h3>
      <div ref={logRef} className="mt-1.5 max-h-48 overflow-auto rounded-md border border-line bg-sheet px-3 py-2 font-pixel text-[18px] leading-[1.15] text-mute" aria-live="polite" tabIndex={0}>
        {logs.length === 0 && <div>Belum ada aktiviti. Hantar data kepada Halim untuk mula.</div>}
        {logs.map((l) => (
          <div key={l.id}><span className="mr-2 text-hivis">{new Date(l.ts).toLocaleTimeString('en-GB')}</span><span className={KIND[l.kind] || ''}>{l.text}</span></div>
        ))}
      </div>
    </section>
  );
}
