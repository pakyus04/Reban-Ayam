import { useEffect, useState } from 'react';
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from 'lucide-react';
import { ROOFS, TYPE_LABEL, fmt } from '../../shared/farm.js';

const { r1, int } = fmt;

function NumField({ id, label, value, min, max, step = 0.5, onChange }) {
  const [txt, setTxt] = useState(String(value));
  const [focus, setFocus] = useState(false);
  useEffect(() => { if (!focus) setTxt(String(value)); }, [value, focus]);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] text-mute">{label}</label>
      <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={txt}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChange={(e) => { setTxt(e.target.value); const v = parseFloat(e.target.value); if (Number.isFinite(v) && v >= min && v <= max) onChange(v); }}
        className="w-full rounded-md border border-line bg-raised px-2.5 py-1.5 tabular-nums" />
    </div>
  );
}

function Toggle({ id, checked, onChange, children, danger }) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 ${danger ? 'border-warn bg-warn/10' : 'border-line'}`}>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className={`relative mt-0.5 h-5 w-9 flex-none rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-hivis ${checked ? 'bg-ok' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span className="text-[14px] leading-snug">{children}</span>
    </label>
  );
}

export default function ProjectPanel({ project, calc: c, setProject, onSubmit, busy, online, stale, signoff }) {
  const s = project;
  const stats = [
    ['Luas reban', `${r1(c.area)} m²`],
    ...c.zones.map((z) => [z.label, `${int(z.cap[0])}–${int(z.cap[1])} ekor`]),
    ['Exhaust fan', c.zones.map((z) => `${z.fans} x ${z.fanSize}"`).join(' + ')],
    ['Cooling pad', `${r1(c.padTotal)} m²`],
    ['Halaju angin', `${r1(Math.min(...c.zones.map((z) => z.speed)))} m/s`],
  ];
  return (
    <section aria-labelledby="h-data" className="rounded-lg border border-line bg-panel p-4">
      <h2 id="h-data" className="font-display text-[22px] font-semibold leading-tight">Data diperlukan Halim</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13.5px]">
        <dt className="text-mute">Sistem</dt><dd>Reban tertutup (closed house)</dd>
        <dt className="text-mute">Ruang sokongan luar</dt><dd>{r1(s.extW)} m x {r1(s.extL)} m ({r1(s.extW * s.extL)} m²): stor dedak, bilik kawalan/generator, ruang sanitasi footbath</dd>
      </dl>

      <div className="mt-4 space-y-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="f-type" className="text-[13px] text-mute">Ternakan</label>
          <select id="f-type" value={s.type} onChange={(e) => setProject({ type: e.target.value })} className="w-full rounded-md border border-line bg-raised px-2.5 py-1.5">
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="f-L" label="Panjang reban (m)" value={s.L} min={3} max={150} onChange={(v) => setProject({ L: v })} />
          <NumField id="f-W" label="Lebar reban (m)" value={s.W} min={2} max={40} onChange={(v) => setProject({ W: v })} />
        </div>
        {s.type === 'both' && (
          <div className="flex flex-col gap-1">
            <label htmlFor="f-share" className="text-[13px] text-mute">Bahagian ayam daging: <span className="font-semibold text-ink">{s.share}%</span> lebar reban</label>
            <input id="f-share" type="range" min="20" max="80" step="5" value={s.share} onChange={(e) => setProject({ share: Number(e.target.value) })} className="accent-hivis" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="f-roof" className="text-[13px] text-mute">Penebat bumbung</label>
          <select id="f-roof" value={s.roof} onChange={(e) => setProject({ roof: e.target.value })} className="w-full rounded-md border border-line bg-raised px-2.5 py-1.5">
            <option value="pu">PU foam metal deck</option>
            <option value="foil">Aluminium foil</option>
          </select>
        </div>
        {s.type === 'both' && (
          <Toggle id="f-part" checked={s.part} onChange={(v) => setProject({ part: v })} danger={!s.part}>
            Dinding pemisah kedap udara antara ayam daging dan ayam telur
          </Toggle>
        )}
        <Toggle id="f-ew" checked={s.ew} onChange={(v) => setProject({ ew: v })}>Orientasi paksi panjang Timur–Barat</Toggle>
      </div>

      <ul className="mt-4 space-y-1.5" aria-live="polite">
        {c.issues.length === 0 && (
          <li className="flex items-start gap-2 rounded-r-md border-l-[3px] border-ok bg-ok/10 px-3 py-2 text-[13.5px]"><CircleCheck size={16} className="mt-0.5 flex-none text-ok" />Tiada amaran. Spesifikasi selamat untuk dirancang.</li>
        )}
        {c.issues.map((i) => (
          <li key={i.code + i.text} className={`flex items-start gap-2 rounded-r-md border-l-[3px] px-3 py-2 text-[13.5px] ${i.severity === 'kritikal' ? 'border-warn bg-warn/10' : 'border-helmet bg-helmet/10'}`}>
            <TriangleAlert size={16} className={`mt-0.5 flex-none ${i.severity === 'kritikal' ? 'text-warn' : 'text-helmet'}`} />
            <span><span className="font-semibold">{i.severity === 'kritikal' ? 'Kritikal. ' : 'Amaran. '}</span>{i.text} <span className="text-mute">{i.fix}</span></span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-md bg-raised px-3 py-2">
            <dd className="font-display text-[21px] font-semibold leading-tight tabular-nums">{v}</dd>
            <dt className="text-[12.5px] text-mute">{k}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[12.5px] text-mute">Angka pengudaraan ialah anggaran awal ikut halaju sasaran 2 m/s. Sahkan dengan pembekal.</p>

      <button onClick={onSubmit} disabled={busy || online === false} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-hivis px-4 py-2.5 font-semibold text-hivis-ink hover:brightness-110 disabled:opacity-60">
        {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
        {busy ? 'Halim sedang bekerja...' : 'Hantar data kepada Halim'}
      </button>
      <p className="mt-2 text-[12.5px] text-mute">
        {online === false ? 'Pelayan tempatan terputus. Jalankan npm run dev, kemudian muat semula.'
          : !signoff ? 'Halim belum menyemak data ini.'
          : stale ? 'Data berubah sejak semakan terakhir. Hantar semula kepada Halim.'
          : `Disemak Halim pada ${new Date(signoff.at).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' })}.`}
      </p>
    </section>
  );
}
