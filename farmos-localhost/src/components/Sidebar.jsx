import { useEffect, useRef } from 'react';
import { Database, Lock, Plus } from 'lucide-react';
import { SpriteAtlas } from '../office/sprites.js';
import { MOOD } from './OfficeStage.jsx';

function Avatar({ palette, locked }) {
  const ref = useRef(null);
  useEffect(() => {
    const g = ref.current.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 20, 20);
    const atlas = new SpriteAtlas(palette);
    const i = atlas.index('stand', 'down', 0, 'neutral', '');
    g.drawImage(atlas.cv, (i % 16) * 24 + 2, Math.floor(i / 16) * 32 + 7, 20, 20, 0, 0, 20, 20);
  }, [palette]);
  return <canvas ref={ref} width="20" height="20" aria-hidden="true" className={`h-10 w-10 flex-none rounded bg-raised ${locked ? 'opacity-40 grayscale' : ''}`} style={{ imageRendering: 'pixelated' }} />;
}

export default function Sidebar({ agents, llm, online, onHire }) {
  return (
    <aside className="flex flex-col gap-5 border-b border-line bg-panel px-4 py-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div>
        <div className="font-pixel text-[34px] leading-none text-hivis">FarmOS</div>
        <div className="mt-1 text-[13px] text-mute">Pusat kawalan ejen reban</div>
        <div className="tape mt-3 w-24" />
      </div>

      <nav aria-label="Senarai ejen">
        <ul className="flex flex-row flex-wrap gap-2 lg:flex-col">
          {agents.map((a) => {
            const active = a.status === 'active';
            const mood = MOOD[a.live] || MOOD.idle;
            return (
              <li key={a.id} className={`flex min-w-[190px] flex-1 items-center gap-3 rounded-md border px-2.5 py-2 lg:flex-none ${active ? (a.brain === 'halim' ? 'border-hivis bg-raised' : 'border-line bg-raised') : 'border-dashed border-line'}`}>
                <Avatar palette={a.palette} locked={!active} />
                <div className="min-w-0">
                  <div className={`font-semibold leading-tight ${active ? '' : 'text-mute'}`}>{a.name}</div>
                  {active ? (
                    <div className="flex items-center gap-1.5 text-[12.5px] text-mute"><span className={`inline-block h-2 w-2 rounded-full ${mood.dot}`} />{mood.label}</div>
                  ) : (
                    <div className="flex items-center gap-1 text-[12.5px] text-mute"><Lock size={11} />Slot {String(a.slot).padStart(2, '0')}, {a.title.toLowerCase()}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <button onClick={onHire} className="mt-2 flex w-full items-center gap-2 rounded-md border border-dashed border-line px-3 py-2 text-left text-[14px] text-mute hover:border-hivis hover:text-hivis">
          <Plus size={15} />Tambah ejen
        </button>
      </nav>

      <div className="mt-auto hidden space-y-2 text-[12.5px] text-mute lg:block">
        <div className="flex items-start gap-2"><Database size={14} className="mt-0.5 flex-none" /><span>Data disimpan dalam <span className="text-ink">data/farmos.db</span> di komputer ini.</span></div>
        <div className="flex items-center gap-2"><span className={`inline-block h-2 w-2 flex-none rounded-full ${online ? 'bg-ok' : online === false ? 'bg-warn' : 'bg-mute'}`} />{online ? 'Pelayan tempatan bersambung' : online === false ? 'Pelayan tempatan terputus' : 'Menyambung...'}</div>
        <div>Otak Halim: <span className="text-ink">{llm.provider === 'offline' ? 'enjin tempatan, luar talian' : `${llm.provider === 'anthropic' ? 'Claude' : 'Gemini'} (${llm.model})`}</span></div>
      </div>
    </aside>
  );
}
