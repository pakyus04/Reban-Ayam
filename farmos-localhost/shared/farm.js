// Pengiraan kejuruteraan Halim. Fungsi tulen, tiada kebergantungan.
// Diguna oleh pelayan (Node) dan pelayar (Vite) supaya angka sentiasa sama.
// Semua angka pengudaraan ialah ANGGARAN AWAL. Sahkan dengan pembekal sebelum membeli.

export const DEFAULT_PROJECT = {
  type: 'both',   // 'both' | 'broiler' | 'layer'
  L: 12,          // panjang reban (m), paksi Timur-Barat
  W: 6,           // lebar reban (m)
  H: 2.5,         // tinggi dinding (m)
  extL: 10,       // ruang sokongan luar (m)
  extW: 3,
  share: 50,      // % lebar reban untuk ayam daging (bila type = both)
  part: true,     // dinding pemisah kedap udara
  ew: true,       // orientasi paksi panjang Timur-Barat
  roof: 'pu',     // 'pu' = PU foam metal deck, 'foil' = aluminium foil
};

export const DENSITY = { broiler: [10, 12], layer: [6, 8] };   // ekor/m2, iklim tropika
export const CFM_PER_BIRD = { broiler: 7, layer: 6 };          // puncak cuaca panas
export const CFM_TO_M3H = 1.699;
export const TARGET_SPEED = 2.0;                               // m/s, halaju angin terowong minimum
export const PAD_FACE_SPEED = 1.5;                             // m/s melalui cooling pad 150 mm
export const FANS = {
  36: { cfm: 10000, kw: 0.55, width: 1.1 },
  50: { cfm: 22000, kw: 1.1, width: 1.45 },
};
export const ROOFS = {
  pu: { label: 'PU foam metal deck 50 mm', heat: 1.0 },
  foil: { label: 'Metal deck + lapisan aluminium foil', heat: 1.1 },
};
export const TYPE_LABEL = { both: 'Ayam daging + ayam telur', broiler: 'Ayam daging (broiler)', layer: 'Ayam telur (layer)' };
export const ZONE_LABEL = { broiler: 'Ayam daging', layer: 'Ayam telur' };

const num = (v, d) => (Number.isFinite(+v) ? +v : d);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r1 = (n) => Math.round(n * 10) / 10;

export function normalizeProject(p = {}) {
  const d = DEFAULT_PROJECT;
  return {
    type: ['both', 'broiler', 'layer'].includes(p.type) ? p.type : d.type,
    L: clamp(num(p.L, d.L), 1, 150),
    W: clamp(num(p.W, d.W), 1, 40),
    H: clamp(num(p.H, d.H), 2, 4),
    extL: clamp(num(p.extL, d.extL), 2, 40),
    extW: clamp(num(p.extW, d.extW), 1, 10),
    share: clamp(Math.round(num(p.share, d.share)), 20, 80),
    part: p.part === undefined ? d.part : !!p.part,
    ew: p.ew === undefined ? d.ew : !!p.ew,
    roof: p.roof === 'foil' ? 'foil' : 'pu',
  };
}

function zoneCalc(kind, area, width, s) {
  const dens = DENSITY[kind];
  const cap = [Math.floor(area * dens[0]), Math.floor(area * dens[1])];
  const heat = ROOFS[s.roof].heat;
  const qBird = cap[1] * CFM_PER_BIRD[kind] * heat;              // CFM ikut bilangan ayam
  const cross = width * s.H;                                      // m2 keratan rentas
  const qSpeed = (cross * TARGET_SPEED * 3600) / CFM_TO_M3H;      // CFM ikut halaju sasaran
  const qDesign = Math.max(qBird, qSpeed);
  let size = 36;
  let fans = Math.ceil(qDesign / FANS[36].cfm);
  if (fans > 3) { size = 50; fans = Math.ceil(qDesign / FANS[50].cfm); }
  fans = Math.max(2, fans);                                       // minimum 2 untuk sandaran
  const qInst = fans * FANS[size].cfm;
  const speed = (qInst * CFM_TO_M3H) / 3600 / cross;
  const padArea = (qInst * CFM_TO_M3H) / 3600 / PAD_FACE_SPEED;
  const padLen = padArea / 1.5;                                   // pad tinggi 1.5 m
  return {
    kind, label: ZONE_LABEL[kind], area, width, cap,
    qBird: Math.round(qBird), qSpeed: Math.round(qSpeed), qDesign: Math.round(qDesign), qInst,
    fanSize: size, fans, fanKw: fans * FANS[size].kw, speed, padArea, padLen,
    fansFit: fans * FANS[size].width <= width + 1e-9,
    padOnSides: padLen > width + 1e-9,
    speedDriven: qSpeed > qBird * 2,
  };
}

const GEN_SIZES = [3, 5, 7.5, 10, 15, 20, 30, 45, 60, 80, 100];

export function calc(input) {
  const s = normalizeProject(input);
  const area = s.L * s.W;
  const both = s.type === 'both';
  const zones = [];
  if (both) {
    const wb = (s.W * s.share) / 100;
    zones.push(zoneCalc('broiler', s.L * wb, wb, s));
    zones.push(zoneCalc('layer', s.L * (s.W - wb), s.W - wb, s));
  } else {
    zones.push(zoneCalc(s.type, area, s.W, s));
  }
  const zB = zones.find((z) => z.kind === 'broiler') || null;
  const zL = zones.find((z) => z.kind === 'layer') || null;
  const lights = Math.ceil(area / 10);
  const kw = zones.reduce((a, z) => a + z.fanKw + 0.37, 0) + lights * 0.009;
  const kvaNeed = (kw / 0.8) * 2;                                 // faktor 2 untuk arus permulaan motor
  const genKva = GEN_SIZES.find((g) => g >= kvaNeed) || Math.ceil(kvaNeed / 10) * 10;

  const issues = [];
  const add = (severity, code, text, fix) => issues.push({ severity, code, text, fix });
  if (s.L < 3 || s.W < 2) add('kritikal', 'dimensi', 'Dimensi terlalu kecil untuk reban tertutup. Minimum 3 m x 2 m.', 'Besarkan panjang dan lebar reban.');
  if (both && !s.part) add('kritikal', 'pemisah', 'Ayam daging dan ayam telur dalam satu ruang tanpa dinding pemisah kedap udara. Risiko jangkitan silang.', 'Hidupkan dinding pemisah kedap udara.');
  if (!s.ew) add('amaran', 'orientasi', 'Orientasi bukan Timur-Barat. Dinding panjang terdedah matahari pagi dan petang.', 'Putar bangunan supaya paksi panjang menghala Timur-Barat.');
  if (s.W > s.L) add('amaran', 'nisbah', 'Lebar melebihi panjang. Aliran terowong perlu paksi panjang searah angin.', 'Tukar supaya panjang lebih besar daripada lebar.');
  zones.forEach((z) => {
    if (z.width > 12) add('amaran', 'lebar', `Zon ${z.label.toLowerCase()} lebih 12 m lebar. Aliran udara kurang sekata di tepi.`, 'Kecilkan lebar atau tambah baffle.');
    if (!z.fansFit) add('amaran', 'kipas', `Dinding Timur zon ${z.label.toLowerCase()} (${r1(z.width)} m) tidak muat ${z.fans} kipas ${z.fanSize}".`, 'Lebarkan zon atau rendahkan siling untuk kecilkan keratan rentas.');
  });
  if (s.roof === 'foil') add('amaran', 'bumbung', 'Aluminium foil menebat kurang daripada PU foam. Aliran udara dinaikkan 10% untuk menampung haba bumbung.', 'Pilih PU foam metal deck jika boleh.');

  return {
    s, area, both, zones, zB, zL, lights, kw, genKva, issues,
    birdsMax: zones.reduce((a, z) => a + z.cap[1], 0),
    birdsMin: zones.reduce((a, z) => a + z.cap[0], 0),
    fansTotal: zones.reduce((a, z) => a + z.fans, 0),
    padTotal: zones.reduce((a, z) => a + z.padArea, 0),
    critical: issues.some((i) => i.severity === 'kritikal'),
  };
}

export function bom(input) {
  const c = calc(input);
  const s = c.s;
  const rows = [];
  const add = (kategori, item, spesifikasi, kuantiti, unit, zon = 'Semua') =>
    rows.push({ no: rows.length + 1, kategori, item, spesifikasi, kuantiti: typeof kuantiti === 'number' ? r1(kuantiti) : kuantiti, unit, zon });
  const { L, W, H } = s;
  const frames = Math.ceil(L / 3) + 1;

  add('Struktur', 'Tiang rangka', `RHS galvani 100x50x2.5 mm, tinggi ${r1(H + 0.5)} m`, frames * (W > 8 ? 3 : 2), 'batang');
  add('Struktur', 'Kekuda bumbung', `Kekuda keluli ringan, rentang ${r1(W)} m, jarak 3 m`, frames, 'set');
  add('Struktur', 'Purlin bumbung', 'C-purlin galvani 75 mm, jarak 1.0 m', (Math.ceil(W / 1) + 1) * L, 'm');
  add('Struktur', 'Lantai konkrit', 'Tebal 100 mm, cerun 1:100 ke longkang, kemasan licin', L * W, 'm²');
  add('Bumbung', 'Kepingan bumbung', ROOFS[s.roof].label, L * W * 1.15, 'm²');
  if (s.roof === 'foil') add('Bumbung', 'Penebat bumbung', 'Aluminium foil dua muka + bubble, bawah kepingan bumbung', L * W * 1.15, 'm²');
  add('Dinding', 'Dinding sisi dan hujung', `Panel sandwich PU 50 mm, tinggi ${r1(H)} m, sambungan disilikon`, 2 * (L + W) * H, 'm²');
  add('Dinding', 'Pintu masuk', 'Pintu kedap udara 0.9 m dengan getah pengedap', c.zones.length + 1, 'unit');
  if (c.both && s.part) {
    add('Dinding', 'Dinding pemisah', 'Panel kedap udara penuh, lantai ke bumbung, tiada bukaan', L * H, 'm²', 'Pemisah');
  }
  c.zones.forEach((z) => {
    add('Pengudaraan', 'Exhaust fan', `${z.fanSize}" kira-kira ${FANS[z.fanSize].cfm.toLocaleString('en')} CFM seunit, dinding Timur, dengan shutter`, z.fans, 'unit', z.label);
    add('Pengudaraan', 'Cooling pad', `Kertas selulosa 150 mm, tinggi 1.5 m${z.padOnSides ? ', dinding Barat dan sisi' : ', dinding Barat'}`, z.padArea, 'm²', z.label);
    add('Pengudaraan', 'Pam dan tangki cooling pad', 'Pam 0.37 kW, tangki 500 L, paip agihan PVC', 1, 'set', z.label);
  });
  add('Kawalan', 'Pengawal iklim', 'Termostat digital + sensor suhu dan kelembapan, kawal kipas berperingkat', c.zones.length, 'set');
  add('Kawalan', 'Penggera sandaran', 'Penggera suhu tinggi dan putus bekalan, siren + SMS/panggilan', 1, 'set');
  add('Kawalan', 'Generator sandaran', `Diesel ${c.genKva} kVA, pemula automatik (ATS)`, 1, 'unit', 'Bilik kawalan');
  add('Kawalan', 'Lampu LED reban', 'Kalis air IP65, 9 W, boleh malap', c.lights, 'unit');
  add('Kawalan', 'Pendawaian elektrik', 'Kabel, MCB, kotak kawalan kipas, pembumian', 1, 'lot');
  if (c.zB) {
    add('Peralatan', 'Sekam padi', 'Lapisan deep litter 7 cm, kering', c.zB.area * 0.07, 'm³', 'Ayam daging');
    add('Peralatan', 'Pan feeder', '1 unit setiap 60 ekor', Math.ceil(c.zB.cap[1] / 60), 'unit', 'Ayam daging');
    add('Peralatan', 'Nipple drinker', '1 nipple setiap 10 ekor, paip boleh laras tinggi', Math.ceil(c.zB.cap[1] / 10), 'nipple', 'Ayam daging');
  }
  if (c.zL) {
    add('Peralatan', 'Sangkar bertingkat', 'Set 3 tingkat, kira-kira 120 ekor/set, dengan palung makanan dan saluran telur', Math.ceil(c.zL.cap[1] / 120), 'set', 'Ayam telur');
    add('Peralatan', 'Nipple drinker', '1 nipple setiap 8 ekor', Math.ceil(c.zL.cap[1] / 8), 'nipple', 'Ayam telur');
  }
  add('Biosekuriti', 'Footbath', 'Kolam celup kasut 1.0 x 0.6 m, dalam 15 cm, di ruang sanitasi dan setiap pintu zon', c.zones.length + 1, 'unit', 'Ruang sanitasi');
  add('Biosekuriti', 'Ruang sanitasi', 'Rak kasut ladang, loker pakaian, sinki basuh tangan', 1, 'set', 'Ruang sanitasi');
  add('Biosekuriti', 'Jaring anti burung dan perosak', 'Mesh keluli 12 mm pada semua bukaan udara', c.zones.reduce((a, z) => a + z.padArea, 0) + c.fansTotal * 1.6, 'm²');
  add('Biosekuriti', 'Palet stor dedak', 'Palet plastik 1.0 x 1.2 m, dedak tidak sentuh lantai dan dinding', Math.max(4, Math.ceil((s.extL * s.extW) / 5)), 'unit', 'Stor dedak');
  return rows;
}

export function schedule(input) {
  const c = calc(input);
  const s = c.s;
  const extra = c.area > 400 ? 2 : c.area > 150 ? 1 : 0;
  const phases = [
    { tajuk: 'Tapak dan saliran', minggu: 1, kerja: ['Ukur dan pancang tapak', `Tanda paksi panjang ${s.ew ? 'Timur-Barat' : '(betulkan ke Timur-Barat dahulu)'}`, 'Ratakan tanah, buat longkang keliling'], semak: 'Foto pancang dan arah kompas.' },
    { tajuk: 'Asas dan lantai konkrit', minggu: 1 + extra, kerja: ['Tuang asas tiang', 'Lantai konkrit cerun 1:100', 'Bina kolam footbath'], semak: 'Foto cerun lantai sebelum konkrit keras.' },
    { tajuk: 'Rangka dan kekuda', minggu: 1 + extra, kerja: ['Dirikan tiang RHS', 'Pasang kekuda dan purlin', 'Semak tegak dan pepenjuru'], semak: 'Foto sambungan tiang dan kekuda.' },
    { tajuk: 'Bumbung dan penebat', minggu: 1, kerja: [`Pasang ${ROOFS[s.roof].label}`, 'Tutup rabung dan tepi supaya kedap'], semak: 'Foto penebat dari bawah sebelum siling ditutup.' },
    { tajuk: 'Dinding dan pemisah', minggu: 1 + extra, kerja: ['Pasang panel dinding dan pintu kedap', c.both ? 'Bina dinding pemisah kedap udara, lantai ke bumbung' : 'Silikon semua sambungan panel'], semak: 'Foto dinding pemisah sebelum ditutup kemasan.' },
    { tajuk: 'Pengudaraan', minggu: 1, kerja: [`Pasang ${c.fansTotal} exhaust fan di dinding Timur`, `Pasang cooling pad ${r1(c.padTotal)} m² di dinding Barat`, 'Sambung pam, tangki dan paip pad'], semak: 'Foto kedudukan kipas dan pad.' },
    { tajuk: 'Elektrik dan kawalan', minggu: 1, kerja: ['Pendawaian, MCB dan pembumian', 'Pasang pengawal iklim dan sensor', `Pasang penggera sandaran dan generator ${c.genKva} kVA`], semak: 'Foto kotak kawalan sebelum ditutup.' },
    { tajuk: 'Peralatan dan ruang sokongan', minggu: 1, kerja: [c.zL ? 'Pasang sangkar bertingkat dan nipple' : 'Pasang feeder dan nipple', c.zB ? 'Tabur sekam padi 7 cm' : 'Uji saluran telur', `Siapkan ruang sokongan ${r1(s.extL)} m x ${r1(s.extW)} m`], semak: 'Foto susun atur dalaman.' },
    { tajuk: 'Uji dan sanitasi', minggu: 1, kerja: ['Uji asap untuk kesan kebocoran udara', 'Uji kipas, pad, penggera dan generator', 'Basuh, nyahkuman, rehat 7 hari sebelum ayam masuk'], semak: 'Foto ujian asap di sambungan dinding.' },
  ];
  let w = 1;
  return phases.map((p, i) => {
    const mula = w; const tamat = w + p.minggu - 1; w = tamat + 1;
    return { fasa: i + 1, tajuk: p.tajuk, mula, tamat, label: mula === tamat ? `Minggu ${mula}` : `Minggu ${mula}-${tamat}`, kerja: p.kerja, semak: p.semak };
  });
}

export const BIOSECURITY = {
  zon: [
    { nama: 'Zon kotor', warna: 'warn', isi: 'Luar pagar, laluan lori dedak, tempat letak kenderaan.' },
    { nama: 'Zon peralihan', warna: 'hivis', isi: 'Ruang sanitasi: footbath, tukar kasut dan pakaian ladang, basuh tangan.' },
    { nama: 'Zon bersih', warna: 'ok', isi: 'Reban, stor dedak dan bilik kawalan. Pekerja dan peralatan khas sahaja.' },
  ],
  aliran: [
    'Masuk melalui ruang sanitasi sahaja.',
    'Celup kasut di footbath. Tukar larutan setiap hari.',
    'Tukar kepada kasut dan pakaian ladang.',
    'Guna kasut berasingan untuk zon ayam daging dan zon ayam telur.',
    'Bangkai dan najis keluar ikut pintu Timur, bukan melalui ruang sanitasi.',
  ],
};

export const TASKS = [
  { id: 'dimensi', title: 'Penentuan dimensi dan kapasiti ternakan', thought: 'Kira luas dan kapasiti...' },
  { id: 'zon', title: 'Pengurusan zon dan biosekuriti', thought: 'Semak zon 3m x 10m...' },
  { id: 'udara', title: 'Spesifikasi pengudaraan closed house', thought: 'Kira CFM exhaust fan...' },
  { id: 'jadual', title: 'Penjadualan fasa pembinaan mingguan', thought: 'Susun fasa pembinaan...' },
  { id: 'bom', title: 'Penyediaan BOM (kuantiti sahaja)', thought: 'Kira kuantiti bahan...' },
];

export function taskDetail(id, input) {
  const c = calc(input);
  const s = c.s;
  switch (id) {
    case 'dimensi': return `${r1(s.L)} x ${r1(s.W)} m = ${r1(c.area)} m². Kapasiti ${c.birdsMin.toLocaleString('en')}-${c.birdsMax.toLocaleString('en')} ekor.`;
    case 'zon': return c.critical ? `${c.issues.filter((i) => i.severity === 'kritikal').length} risiko kritikal dikesan.` : `Zon bersih dan kotor diasingkan. Ruang sokongan ${r1(s.extL)} x ${r1(s.extW)} m.`;
    case 'udara': return `${c.zones.map((z) => `${z.fans} x ${z.fanSize}"`).join(' + ')} exhaust fan, cooling pad ${r1(c.padTotal)} m², penggera sandaran.`;
    case 'jadual': { const j = schedule(input); return `${j.length} fasa, ${j[j.length - 1].tamat} minggu.`; }
    case 'bom': return `${bom(input).length} item, tanpa harga.`;
    default: return '';
  }
}

export function bomCsv(rows) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ['No', 'Kategori', 'Item', 'Spesifikasi', 'Kuantiti', 'Unit', 'Zon'];
  return [head.join(','), ...rows.map((r) => [r.no, r.kategori, r.item, r.spesifikasi, r.kuantiti, r.unit, r.zon].map(esc).join(','))].join('\r\n') + '\r\n';
}

export function bomMarkdown(rows, input) {
  const c = calc(input);
  const s = c.s;
  const lines = [
    '# Senarai Kuantiti Bahan (BOM) - Reban Tertutup',
    '',
    `- Ternakan: ${TYPE_LABEL[s.type]}`,
    `- Reban utama: ${r1(s.L)} m x ${r1(s.W)} m (${r1(c.area)} m²)`,
    `- Ruang sokongan luar: ${r1(s.extL)} m x ${r1(s.extW)} m`,
    `- Kapasiti: ${c.birdsMin}-${c.birdsMax} ekor`,
    '- Disediakan oleh Halim. Kuantiti dan spesifikasi sahaja, tanpa harga. Serahkan kepada Agen Kewangan untuk kiraan kos.',
    '',
    '| No | Kategori | Item | Spesifikasi | Kuantiti | Unit | Zon |',
    '|---:|---|---|---|---:|---|---|',
    ...rows.map((r) => `| ${r.no} | ${r.kategori} | ${r.item} | ${r.spesifikasi} | ${r.kuantiti} | ${r.unit} | ${r.zon} |`),
    '',
  ];
  return lines.join('\n');
}

export const TIPS = [
  'Petua: paksi panjang reban menghala Timur-Barat. Matahari tak panggang dinding panjang.',
  'Petua: exhaust fan di hujung Timur, cooling pad di hujung Barat. Udara lalu sepanjang reban.',
  'Petua: uji asap sebelum ayam masuk. Asap bocor bermakna udara panas masuk tanpa lalu pad.',
  'Petua: dedak atas palet, 30 cm dari dinding. Tikus tak ada tempat sembunyi.',
  'Petua: footbath tanpa larutan baharu setiap hari cuma kolam kotor.',
  'Petua: ayam daging dan ayam telur jangan kongsi udara. Dinding pemisah mesti sampai bumbung.',
  'Petua: generator sandaran mesti hidup sendiri. Reban tertutup tanpa kipas 15 minit pun bahaya.',
  'Petua: lantai cerun 1:100 ke longkang. Air basuhan tak bertakung.',
  'Petua: ambil foto rangka dan penebat sebelum ditutup. Lepas tutup, susah nak betulkan.',
  'Petua: halaju angin terowong sasaran 2 m/s. Kalau lemah, rendahkan siling dahulu sebelum tambah kipas.',
];

export const fmt = { r1, int: (n) => Math.round(n).toLocaleString('en') };
