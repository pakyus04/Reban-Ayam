import { useEffect, useRef, useState } from 'react';
import { CalendarDays, FileDown, ImagePlus, Map as MapIcon, MessageSquare, Send, Table, X } from 'lucide-react';
import { fmt } from '../../shared/farm.js';
import FloorPlan from './FloorPlan.jsx';

const TABS = [
  { id: 'plan', label: 'Pelan lantai', short: 'Pelan', icon: MapIcon },
  { id: 'bom', label: 'Jadual BOM', short: 'BOM', icon: Table },
  { id: 'jadual', label: 'Jadual pembinaan', short: 'Jadual', icon: CalendarDays },
  { id: 'chat', label: 'Sembang dan foto tapak', short: 'Sembang', icon: MessageSquare },
];

function Bom({ rows, online }) {
  const groups = [...new Set(rows.map((r) => r.kategori))];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <a href="/api/export/bom.csv" download className={`flex items-center gap-1.5 rounded-md bg-hivis px-3 py-1.5 text-[13.5px] font-semibold text-hivis-ink hover:brightness-110 ${online === false ? 'pointer-events-none opacity-50' : ''}`}><FileDown size={15} />Muat turun CSV</a>
        <a href="/api/export/bom.md" download className={`flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[13.5px] hover:border-hivis ${online === false ? 'pointer-events-none opacity-50' : ''}`}><FileDown size={15} />Muat turun Markdown</a>
        <span className="text-[13px] text-mute">{rows.length} item. Kuantiti dan spesifikasi sahaja, untuk diserah kepada Agen Kewangan.</span>
      </div>
      <div className="mt-3 max-h-[560px] overflow-auto rounded-md border border-line" tabIndex={0}>
        <table className="w-full min-w-[620px] border-collapse text-[13.5px]">
          <thead className="sticky top-0 bg-raised text-left text-[12.5px] text-mute">
            <tr><th className="px-3 py-2 font-semibold">No</th><th className="px-3 py-2 font-semibold">Item</th><th className="px-3 py-2 font-semibold">Spesifikasi</th><th className="px-3 py-2 text-right font-semibold">Kuantiti</th><th className="px-3 py-2 font-semibold">Zon</th></tr>
          </thead>
          {groups.map((gname) => (
            <tbody key={gname}>
              <tr><th colSpan={5} scope="rowgroup" className="border-t border-line bg-sheet px-3 py-1.5 text-left font-display text-[15px] font-semibold">{gname}</th></tr>
              {rows.filter((r) => r.kategori === gname).map((r) => (
                <tr key={r.no} className="border-t border-line align-top">
                  <td className="px-3 py-1.5 tabular-nums text-mute">{r.no}</td>
                  <td className="px-3 py-1.5 font-medium">{r.item}</td>
                  <td className="px-3 py-1.5 text-mute">{r.spesifikasi}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold tabular-nums">{typeof r.kuantiti === 'number' ? r.kuantiti.toLocaleString('en') : r.kuantiti} <span className="font-normal text-mute">{r.unit}</span></td>
                  <td className="px-3 py-1.5 text-mute">{r.zon}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

function Jadual({ phases }) {
  const total = phases.at(-1).tamat;
  return (
    <div>
      <p className="text-[14px] text-mute">Anggaran <span className="font-semibold text-ink">{total} minggu</span> dalam {phases.length} fasa. Tempoh sebenar bergantung cuaca dan kontraktor.</p>
      <ol className="mt-3 space-y-2">
        {phases.map((p) => (
          <li key={p.fasa} className="rounded-md bg-raised px-3 py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="font-display text-[17px] font-semibold"><span className="text-mute">{p.fasa}. </span>{p.tajuk}</h3>
              <span className="text-[13px] font-semibold tabular-nums text-hivis">{p.label}</span>
            </div>
            <div className="mt-1.5 grid gap-px" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden="true">
              {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 rounded-sm ${i + 1 >= p.mula && i + 1 <= p.tamat ? 'bg-hivis' : 'bg-line'}`} />)}
            </div>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[14px]">{p.kerja.map((k) => <li key={k}>{k}</li>)}</ul>
            <p className="mt-1.5 text-[13px] text-mute">Hantar kepada Halim sebelum fasa seterusnya: {p.semak}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

const QUICK = ['Berapa kapasiti ayam?', 'Berapa exhaust fan perlu?', 'Apa aliran biosekuriti?', 'Berapa lama nak siap?'];
const SRC = { anthropic: 'Claude', gemini: 'Gemini', offline: 'enjin tempatan' };

function Chat({ chat, onSend, sending, online }) {
  const [msg, setMsg] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const listRef = useRef(null), fileRef = useRef(null);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [chat.length, sending]);
  useEffect(() => { if (!file) { setPreview(null); return undefined; } const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u); }, [file]);
  const send = async (text) => {
    const t = (text ?? msg).trim();
    if ((!t && !file) || sending) return;
    const f = file;
    setMsg(''); setFile(null); if (fileRef.current) fileRef.current.value = '';
    await onSend(t, f);
  };
  return (
    <div className="flex h-[560px] flex-col">
      <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-auto pb-3 pr-1" aria-live="polite" tabIndex={0}>
        {chat.length === 0 && <p className="m-auto max-w-[44ch] text-center text-[14px] text-mute">Tanya Halim tentang kapasiti, pengudaraan, biosekuriti atau jadual. Lampirkan foto tapak untuk direkod sebelum dinding ditutup.</p>}
        {chat.map((m) => (
          <div key={m.id} className={`max-w-[86%] rounded-xl px-3 py-2 text-[14.5px] ${m.role === 'user' ? 'self-end rounded-br-sm bg-hivis text-hivis-ink' : 'self-start rounded-bl-sm bg-raised'}`}>
            {m.photo && <a href={m.photo} target="_blank" rel="noreferrer"><img src={m.photo} alt="Foto tapak yang dimuat naik" className="mb-1.5 max-h-44 rounded-md" /></a>}
            <div className="whitespace-pre-wrap">{m.text}</div>
            {m.role !== 'user' && m.source && <div className="mt-1 text-[11.5px] text-mute">Halim · {SRC[m.source] || m.source} · {new Date(m.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>}
          </div>
        ))}
        {sending && <div className="self-start rounded-xl rounded-bl-sm bg-raised px-3 py-2 text-[14.5px] text-mute"><span className="pulse">Halim sedang menaip...</span></div>}
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {QUICK.map((q) => <button key={q} type="button" onClick={() => send(q)} disabled={sending || online === false} className="rounded-md border border-line px-2 py-0.5 text-[13px] hover:border-hivis disabled:opacity-50">{q}</button>)}
      </div>
      {preview && file && (
        <div className="mb-2 flex items-center gap-2 rounded-md bg-raised p-1.5 text-[13px]">
          <img src={preview} alt="" className="h-10 w-10 rounded object-cover" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} aria-label="Buang foto" className="rounded p-1 text-mute hover:text-ink"><X size={15} /></button>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input ref={fileRef} id="f-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <label htmlFor="f-photo" className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-2.5 text-[13.5px] hover:border-hivis" title="Lampirkan foto tapak"><ImagePlus size={17} /><span className="hidden sm:inline">Foto tapak</span></label>
        <input id="f-msg" value={msg} onChange={(e) => setMsg(e.target.value)} autoComplete="off" placeholder="Tulis soalan kepada Halim" aria-label="Mesej kepada Halim" className="min-w-0 flex-1 rounded-md border border-line bg-raised px-3 py-2" />
        <button type="submit" disabled={sending || online === false || (!msg.trim() && !file)} className="flex items-center gap-1.5 rounded-md bg-hivis px-3.5 font-semibold text-hivis-ink hover:brightness-110 disabled:opacity-50"><Send size={16} />Hantar</button>
      </form>
    </div>
  );
}

export default function OutputTabs({ tab, setTab, calc, bomRows, phases, chat, onSend, sending, online, signoff, stale }) {
  const stamp = !signoff ? 'Pratonton. Belum disemak Halim.' : stale ? 'Pratonton. Data berubah sejak semakan Halim.' : `Disemak Halim, ${new Date(signoff.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`;
  return (
    <section aria-label="Output kejuruteraan" className="min-w-0 rounded-lg border border-line bg-panel p-4">
      <div role="tablist" aria-label="Output Halim" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => setTab(t.id)}
            className={`flex flex-none items-center gap-1.5 border-b-[3px] px-2 py-2 text-[14.5px] font-semibold sm:px-3 ${tab === t.id ? 'border-hivis text-ink' : 'border-transparent text-mute hover:text-ink'}`}>
            <t.icon size={16} /><span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.short}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="pt-4">
        {tab !== 'chat' && <p className={`mb-3 text-[13px] ${signoff && !stale ? 'text-ok' : 'text-mute'}`}>{stamp}</p>}
        {tab === 'plan' && <FloorPlan calc={calc} />}
        {tab === 'bom' && <Bom rows={bomRows} online={online} />}
        {tab === 'jadual' && <Jadual phases={phases} />}
        {tab === 'chat' && <Chat chat={chat} onSend={onSend} sending={sending} online={online} />}
      </div>
    </section>
  );
}
