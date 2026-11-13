import { useEffect, useRef } from 'react';
import { Lock, LockOpen, X } from 'lucide-react';

export default function HireDialog({ open, onClose, agents, onToggle, online }) {
  const ref = useRef(null);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-labelledby="h-hire"
      className="m-auto w-[min(560px,92vw)] rounded-lg border-2 border-helmet bg-panel p-0 text-ink backdrop:bg-black/60">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="h-hire" className="font-display text-2xl font-semibold leading-tight">Terminal ejen baharu</h2>
            <p className="mt-1 text-[14px] text-mute">Setiap ejen ada satu slot meja dalam pejabat. Buka slot untuk lihat wataknya masuk bekerja.</p>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="rounded p-1 text-mute hover:text-ink"><X size={18} /></button>
        </div>
        <ul className="mt-4 space-y-2">
          {agents.map((a) => {
            const active = a.status === 'active', no = String(a.slot).padStart(2, '0');
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-md bg-raised px-3 py-2.5">
                <span className="font-pixel text-[22px] leading-none text-helmet">{no}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.name} <span className="font-normal text-mute">· {a.title}</span></div>
                  <div className="font-pixel text-[17px] leading-tight text-mute">[SLOT {no}: {a.role} - {active ? 'AKTIF' : 'LOCKED'}]</div>
                </div>
                {a.brain === 'halim' ? <span className="text-[13px] text-ok">Sentiasa aktif</span> : (
                  <button onClick={() => onToggle(a.id, active ? 'lock' : 'activate')} disabled={online === false}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13.5px] font-semibold disabled:opacity-50 ${active ? 'border border-line hover:border-hivis' : 'bg-hivis text-hivis-ink hover:brightness-110'}`}>
                    {active ? <Lock size={14} /> : <LockOpen size={14} />}{active ? 'Kunci semula' : 'Buka slot (pratonton)'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[13px] text-mute">Slot 02 dan 03 ialah pratonton: watak akan masuk dan buat rutin pejabat, tetapi belum boleh menjawab atau mengira. Untuk tambah ejen sebenar, tambah satu objek dalam <span className="text-ink">server/agents.config.js</span> dan mulakan semula pelayan.</p>
      </div>
    </dialog>
  );
}
