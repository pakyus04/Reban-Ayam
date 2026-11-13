import { useEffect, useMemo, useRef, useState } from 'react';
import { Moon, RotateCcw, Sun, TriangleAlert, WifiOff } from 'lucide-react';
import { bom, schedule, fmt } from '../shared/farm.js';
import { useFarm } from './useFarm.js';
import OfficeStage from './components/OfficeStage.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProjectPanel from './components/ProjectPanel.jsx';
import TasksPanel from './components/TasksPanel.jsx';
import OutputTabs from './components/OutputTabs.jsx';
import HireDialog from './components/HireDialog.jsx';

const { r1, int } = fmt;
const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const savedTheme = () => { try { return localStorage.getItem('farmos.theme') || 'dark'; } catch { return 'dark'; } };

export default function App() {
  const officeRef = useRef(null);
  const farm = useFarm(officeRef);
  const { st, project, calc: c } = farm;
  const [theme, setTheme] = useState(savedTheme);
  const [tab, setTab] = useState('plan');
  const [popup, setPopup] = useState(null);
  const [hire, setHire] = useState(false);
  const [paused, setPaused] = useState(prefersReduced);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('farmos.theme', theme); } catch { /* storan disekat */ } }, [theme]);

  const bomRows = useMemo(() => bom(project), [project]);
  const phases = useMemo(() => schedule(project), [project]);
  const slot = (n) => st.agents.find((a) => a.slot === n);

  const onZone = (id, at) => {
    if (id === 'terminal') { setPopup(null); setHire(true); return; }
    const jam = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const desk = (n) => {
      const a = slot(n), no = String(n).padStart(2, '0');
      if (!a) return { title: `Meja slot ${no}`, body: <p>Meja ini masih kosong.</p> };
      const active = a.status === 'active';
      return {
        title: `[SLOT ${no}: ${a.role} - ${active ? 'AKTIF' : 'LOCKED'}]`,
        body: <><p><b>{a.name}</b>, {a.title.toLowerCase()}.</p><p>{active ? 'Watak pratonton sedang bekerja di meja ini. Ia belum boleh menjawab atau mengira.' : n === 2 ? 'Ejen ini akan terima BOM daripada Halim dan mengira kos. Meja masih berkunci.' : 'Ejen ini akan urus operasi ladang dan jualan. Meja masih berkunci.'}</p></>,
        action: { label: 'Buka terminal ejen', fn: () => { setPopup(null); setHire(true); } },
      };
    };
    const content = {
      coffee: { title: 'Mesin Kopi O', body: <><p>Kopi O panas, tanpa susu. Bahan api rasmi Halim.</p><p>Cawan hari ini: <b>{st.kopi}</b></p></> },
      board: { title: 'Papan putih perancangan', body: <><p>Rajah mini ikut data semasa: <b>{r1(project.L)} x {r1(project.W)} m</b>, {int(c.birdsMin)}–{int(c.birdsMax)} ekor, {c.fansTotal} exhaust fan.</p>{c.critical && <p className="text-warn">Ada risiko kritikal. Lihat senarai amaran.</p>}</>, action: { label: 'Buka pelan lantai', fn: () => { setTab('plan'); setPopup(null); document.getElementById('tab-plan')?.scrollIntoView({ block: 'center' }); } } },
      window: { title: 'Tingkap ladang', body: <><p>Reban tertutup di luar: <b>{c.fansTotal} exhaust fan</b> di hujung Timur, cooling pad di hujung Barat.</p><p>Jam tempatan <b>{jam}</b>. Langit ikut waktu sebenar.</p></> },
      desk1: { title: 'Meja lukisan Halim', body: <><p>Dua monitor, pelan biru, pembaris skala dan cawan Kopi O.</p><p>Tugas siap: <b>{farm.done}/{st.tasks.length}</b></p></> },
      maquette: { title: 'Model reban 1:50', body: <p>Model reban tertutup: bumbung bertebat, dinding pemisah di tengah, kipas di Timur dan pad di Barat.</p> },
      desk2: desk(2), desk3: desk(3),
    }[id];
    if (content) setPopup({ id, ...content, x: at.x, y: at.y, top: at.top, above: at.y > (officeHeight() * 0.62) });
  };
  const officeHeight = () => document.querySelector('.office-frame')?.clientHeight || 400;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <Sidebar agents={st.agents} llm={st.llm} online={farm.online} onHire={() => setHire(true)} />

      <main className="flex min-w-0 flex-col gap-5 px-4 py-5 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[30px] font-bold leading-none">Pejabat maya Halim</h1>
            <p className="mt-1.5 text-[14px] text-mute">Perancang pembinaan reban tertutup dan biosekuriti. Iklim tropika Malaysia.</p>
          </div>
          <div className="flex items-center gap-2">
            {confirmReset ? (
              <span className="flex items-center gap-2 rounded-md border border-warn px-2.5 py-1.5 text-[13.5px]">
                Padam log, sembang dan foto?
                <button onClick={() => { setConfirmReset(false); farm.reset(); }} className="rounded bg-warn px-2 py-0.5 font-semibold text-white">Padam</button>
                <button onClick={() => setConfirmReset(false)} className="rounded border border-line px-2 py-0.5">Batal</button>
              </span>
            ) : (
              <button onClick={() => setConfirmReset(true)} disabled={st.busy || farm.online === false} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[14px] hover:border-hivis disabled:opacity-50"><RotateCcw size={15} />Set semula data</button>
            )}
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[14px] hover:border-hivis">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}{theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
            </button>
          </div>
        </header>

        {farm.online === false && (
          <div role="alert" className="flex items-start gap-2.5 rounded-md border border-warn bg-warn/10 px-3.5 py-2.5 text-[14px]">
            <WifiOff size={17} className="mt-0.5 flex-none text-warn" />
            <span>Pelayan tempatan tidak dijumpai. Jalankan <span className="font-semibold">npm run dev</span> dalam folder farmos-localhost. Pengiraan masih berjalan, tetapi simpan, hantar dan sembang perlukan pelayan.</span>
          </div>
        )}
        {farm.notice && (
          <div role="status" className={`flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-[14px] ${farm.notice.kind === 'warn' ? 'border-warn bg-warn/10' : 'border-line bg-panel'}`}>
            {farm.notice.kind === 'warn' && <TriangleAlert size={17} className="mt-0.5 flex-none text-warn" />}{farm.notice.text}
          </div>
        )}

        <OfficeStage ref={officeRef} agents={st.agents} ready={farm.online !== null} calc={c} progress={farm.progress} paused={paused} setPaused={setPaused} popup={popup}
          onZone={onZone} onClosePopup={() => setPopup(null)} onKopi={farm.addKopi} llm={st.llm} />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <ProjectPanel project={project} calc={c} setProject={farm.setProject} onSubmit={farm.submit} busy={st.busy} online={farm.online} stale={farm.stale} signoff={st.signoff} />
            <TasksPanel tasks={st.tasks} logs={st.logs} busy={st.busy} />
          </div>
          <OutputTabs tab={tab} setTab={setTab} calc={c} bomRows={bomRows} phases={phases} chat={st.chat} onSend={farm.sendChat} sending={farm.sending} online={farm.online} signoff={st.signoff} stale={farm.stale} />
        </div>
      </main>

      <HireDialog open={hire} onClose={() => setHire(false)} agents={st.agents} onToggle={farm.setAgentStatus} online={farm.online} />
    </div>
  );
}
