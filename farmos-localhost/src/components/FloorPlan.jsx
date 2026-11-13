import { BIOSECURITY, fmt } from '../../shared/farm.js';

const { r1, int } = fmt;

export default function FloorPlan({ calc: c }) {
  const s = c.s;
  const k = Math.min(56, 700 / Math.max(s.L, s.extL));
  const pad = 48, gap = 34;
  const w = s.L * k, h = s.W * k, ew = s.extL * k, eh = s.extW * k;
  const VW = pad * 2 + Math.max(w, ew) + 30, VH = pad + h + gap + eh + 40;
  const x0 = pad, y0 = pad;
  const bad = c.both && !s.part;
  const zones = c.both
    ? [{ z: c.zB, y: y0, h: (h * s.share) / 100, col: 'var(--zone-b)' }, { z: c.zL, y: y0 + (h * s.share) / 100, h: h - (h * s.share) / 100, col: 'var(--zone-l)' }]
    : [{ z: c.zones[0], y: y0, h, col: s.type === 'broiler' ? 'var(--zone-b)' : 'var(--zone-l)' }];
  const ey = y0 + h + gap;
  const segs = [['Ruang sanitasi', 'footbath', 2, 'var(--blue)'], ['Bilik kawalan', 'generator', 3, 'var(--helmet)'], ['Stor dedak', 'atas palet', Math.max(1, s.extL - 5), 'var(--ok)']];
  const total = segs.reduce((a, x) => a + x[2], 0);
  const doorX = x0 + (ew * 1) / total;
  let cx = x0;

  return (
    <div>
      <div className="sheet-grid overflow-x-auto rounded-md border border-line p-2">
        <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={`Pelan lantai reban ${r1(s.L)} meter kali ${r1(s.W)} meter`} className="plan-svg block h-auto w-full min-w-[520px]">
          <defs>
            <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="8" fill="var(--warn)" opacity=".3" /></pattern>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="var(--ok)" /></marker>
          </defs>

          {zones.map(({ z, y, h: zh, col }) => {
            const lines = Math.max(1, Math.min(3, Math.floor(zh / 30)));
            const r = Math.max(5, Math.min(13, (zh - 8) / z.fans / 2.3));
            return (
              <g key={z.kind}>
                <rect x={x0} y={y} width={w} height={zh} fill={col} opacity=".2" />
                <rect x={x0 - 8} y={y + 4} width="8" height={Math.max(4, zh - 8)} fill="var(--blue)" />
                {Array.from({ length: z.fans }, (_, j) => {
                  const fy = y + (zh * (j + 0.5)) / z.fans;
                  return <g key={j}><circle cx={x0 + w + 10} cy={fy} r={r} fill="var(--panel)" stroke="var(--mute)" strokeWidth="2.5" /><path d={`M${x0 + w + 10 - r * 0.7},${fy} h${r * 1.4} M${x0 + w + 10},${fy - r * 0.7} v${r * 1.4}`} stroke="var(--mute)" strokeWidth="1.5" /></g>;
                })}
                {Array.from({ length: lines }, (_, j) => {
                  const ly = y + (zh * (j + 0.5)) / lines + (lines === 1 ? zh * 0.3 : 0);
                  return <line key={j} className="flow" x1={x0 + 12} y1={Math.min(ly, y + zh - 6)} x2={x0 + w - 22} y2={Math.min(ly, y + zh - 6)} stroke="var(--ok)" strokeWidth="2" markerEnd="url(#arr)" />;
                })}
                <text x={x0 + w / 2} y={y + zh / 2 - (zh > 60 ? 8 : 2)} textAnchor="middle" fontSize="15" fontWeight="600">{bad ? `${z.label} (tiada pemisah)` : z.label}</text>
                {zh > 44 && <text x={x0 + w / 2} y={y + zh / 2 + 12} textAnchor="middle" fontSize="12.5" style={{ fill: 'var(--mute)' }}>{r1(z.area)} m² · {int(z.cap[0])}–{int(z.cap[1])} ekor · {z.fans} x {z.fanSize}"</text>}
              </g>
            );
          })}
          {bad && <rect x={x0} y={y0} width={w} height={h} fill="url(#hatch)" />}
          {c.both && (s.part
            ? <><line x1={x0} y1={zones[1].y} x2={x0 + w} y2={zones[1].y} stroke="var(--ink)" strokeWidth="5" /><text x={x0 + w - 8} y={zones[1].y - 7} textAnchor="end" fontSize="11" style={{ fill: 'var(--mute)' }}>dinding pemisah kedap udara</text></>
            : <><line x1={x0} y1={zones[1].y} x2={x0 + w} y2={zones[1].y} stroke="var(--warn)" strokeWidth="2.5" strokeDasharray="8 6" /><text x={x0 + w - 8} y={zones[1].y - 7} textAnchor="end" fontSize="12" fontWeight="600" style={{ fill: 'var(--warn)' }}>TIADA dinding pemisah</text></>)}
          <rect x={x0} y={y0} width={w} height={h} fill="none" stroke="var(--ink)" strokeWidth="3" />

          {/* dimensi */}
          <line x1={x0} y1={y0 - 10} x2={x0 + w} y2={y0 - 10} stroke="var(--mute)" />
          <line x1={x0} y1={y0 - 15} x2={x0} y2={y0 - 5} stroke="var(--mute)" /><line x1={x0 + w} y1={y0 - 15} x2={x0 + w} y2={y0 - 5} stroke="var(--mute)" />
          <text x={x0 + w / 2} y={y0 - 16} textAnchor="middle" fontSize="13" fontWeight="600">{r1(s.L)} m</text>
          <text transform={`translate(${x0 - 24},${y0 + h / 2}) rotate(-90)`} textAnchor="middle" fontSize="13" fontWeight="600">{r1(s.W)} m</text>
          <text x={x0 - 8} y={y0 + h + 15} fontSize="11" style={{ fill: 'var(--blue)' }}>Barat · cooling pad</text>
          <text x={x0 + w + 22} y={y0 + h + 15} textAnchor="end" fontSize="11" style={{ fill: 'var(--mute)' }}>exhaust fan · Timur</text>

          {/* pintu dan laluan ke ruang sokongan */}
          <rect x={doorX - 12} y={y0 + h - 3} width="24" height="6" fill="var(--panel)" stroke="var(--ink)" />
          <line x1={doorX} y1={y0 + h + 3} x2={doorX} y2={ey} stroke="var(--ok)" strokeWidth="2" strokeDasharray="4 3" />

          {segs.map(([n, sub, m, col]) => {
            const sw = (ew * m) / total, x = cx; cx += sw;
            return (
              <g key={n}>
                <rect x={x} y={ey} width={sw} height={eh} fill={col} opacity=".2" /><rect x={x} y={ey} width={sw} height={eh} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
                <text x={x + sw / 2} y={ey + eh / 2 - 1} textAnchor="middle" fontSize={sw < 90 ? 10.5 : 12.5} fontWeight="600">{n}</text>
                <text x={x + sw / 2} y={ey + eh / 2 + 13} textAnchor="middle" fontSize={sw < 90 ? 9.5 : 11} style={{ fill: 'var(--mute)' }}>{sub}</text>
              </g>
            );
          })}
          <text x={x0} y={ey + eh + 18} fontSize="12" style={{ fill: 'var(--mute)' }}>Ruang sokongan luar {r1(s.extW)} m x {r1(s.extL)} m</text>

          {/* kompas */}
          <g transform={`translate(${VW - 30},${pad}) rotate(${s.ew ? 0 : 90})`}>
            <circle r="17" fill="none" stroke="var(--mute)" /><path d="M0,-13 L4.5,3 L0,0 L-4.5,3z" fill="var(--ink)" /><text y="-21" textAnchor="middle" fontSize="11" style={{ fill: 'var(--mute)' }}>U</text>
          </g>
          {!s.ew && <text x={VW - 12} y={pad + 44} textAnchor="end" fontSize="11.5" fontWeight="600" style={{ fill: 'var(--warn)' }}>bukan Timur–Barat</text>}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-mute">
        {[['var(--zone-b)', 'Zon ayam daging'], ['var(--zone-l)', 'Zon ayam telur'], ['var(--blue)', 'Cooling pad'], ['var(--mute)', 'Exhaust fan'], ['var(--ok)', 'Aliran udara']].map(([col, n]) => (
          <span key={n} className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-sm" style={{ background: col }} />{n}</span>
        ))}
      </div>

      <h3 className="mt-5 font-display text-lg font-semibold">Zon dan biosekuriti</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {BIOSECURITY.zon.map((z) => (
          <div key={z.nama} className="rounded-md bg-raised px-3 py-2">
            <div className="flex items-center gap-2 font-semibold"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `var(--${z.warna})` }} />{z.nama}</div>
            <p className="mt-0.5 text-[13px] text-mute">{z.isi}</p>
          </div>
        ))}
      </div>
      <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-[14px]">
        {BIOSECURITY.aliran.map((a) => <li key={a}>{a}</li>)}
      </ol>
    </div>
  );
}
