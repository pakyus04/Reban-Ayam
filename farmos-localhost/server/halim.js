// Otak Halim: LLM (Claude atau Gemini) jika kunci ada dalam .env, jika tidak enjin tempatan luar talian.
import Anthropic from '@anthropic-ai/sdk';
import { calc, bom, schedule, TYPE_LABEL, ROOFS, TIPS, BIOSECURITY, fmt } from '../shared/farm.js';

const { r1, int } = fmt;

export const HALIM_SYSTEM = `NAMA & PERANAN:
Anda ialah Halim, Pakar Pembinaan Reban Ayam Tertutup (Closed House) dan Biosekuriti Ladang di Malaysia.
Fokus: reban tertutup skala mikro, kecil dan sederhana di iklim panas dan lembap tropika.

PRINSIP KERJA:
- Praktikal, utamakan keselamatan ternakan, berterus-terang jika pengguna buat kesilapan teknikal.
- Bahasa Melayu yang mesra, jelas dan ringkas. Sesuai untuk penternak baharu dan tukang tempatan.
- Jawab dalam 2 hingga 6 ayat, atau senarai pendek. Teks biasa sahaja, tanpa Markdown.

KEMAHIRAN:
1. Kapasiti: ayam daging 10-12 ekor/m2 (deep litter), ayam telur 6-8 ekor/m2 (sangkar bertingkat).
2. Pengudaraan terowong: exhaust fan 36" atau 50" di dinding Timur, cooling pad di dinding Barat, penebat bumbung.
3. Pelan lantai, zon bersih lawan zon kotor, footbath, bilik tukar pakaian, stor dedak.
4. Audit foto tapak: kesan kebocoran udara, kedudukan kipas, pemasangan penebat sebelum dinding ditutup.
5. BOM: kuantiti dan spesifikasi sahaja.

BATASAN:
- JANGAN mengira harga, kos atau bajet. Jika ditanya, terangkan bahawa BOM diserah kepada Agen Kewangan.
- Guna angka daripada KONTEKS PROJEK di bawah. Jangan reka angka lain. Nyatakan bahawa angka pengudaraan ialah anggaran awal yang perlu disahkan pembekal.
- Jika data tidak cukup, tanya pengguna.`;

export function llmMode(env = process.env) {
  const want = String(env.LLM_PROVIDER || 'auto').toLowerCase();
  if (want !== 'offline') {
    if ((want === 'anthropic' || want === 'auto') && env.ANTHROPIC_API_KEY) return { provider: 'anthropic', model: env.ANTHROPIC_MODEL || 'claude-opus-5-5' };
    if ((want === 'gemini' || want === 'auto') && env.GEMINI_API_KEY) return { provider: 'gemini', model: env.GEMINI_MODEL || 'gemini-2.5-flash' };
  }
  return { provider: 'offline', model: 'enjin tempatan' };
}

export function projectContext(project) {
  const c = calc(project);
  const s = c.s;
  const lines = [
    `Ternakan: ${TYPE_LABEL[s.type]}. Sistem: reban tertutup.`,
    `Reban utama: ${r1(s.L)} m x ${r1(s.W)} m, tinggi dinding ${r1(s.H)} m, luas ${r1(c.area)} m2.`,
    `Ruang sokongan luar: ${r1(s.extL)} m x ${r1(s.extW)} m (stor dedak, bilik kawalan/generator, ruang sanitasi footbath).`,
    `Orientasi Timur-Barat: ${s.ew ? 'ya' : 'TIDAK'}. Dinding pemisah kedap udara: ${c.both ? (s.part ? 'ada' : 'TIADA') : 'tidak berkenaan'}. Bumbung: ${ROOFS[s.roof].label}.`,
    ...c.zones.map((z) => `Zon ${z.label}: ${r1(z.area)} m2, lebar ${r1(z.width)} m, kapasiti ${z.cap[0]}-${z.cap[1]} ekor, ${z.fans} exhaust fan ${z.fanSize}" (${int(z.qInst)} CFM terpasang; perlu ${int(z.qBird)} CFM ikut ayam, ${int(z.qSpeed)} CFM ikut halaju 2 m/s), halaju angin ${r1(z.speed)} m/s, cooling pad ${r1(z.padArea)} m2.`),
    `Generator sandaran: ${c.genKva} kVA. Lampu LED: ${c.lights} unit.`,
    `BOM: ${bom(project).length} item. Jadual pembinaan: ${schedule(project).at(-1).tamat} minggu.`,
    c.issues.length ? `Amaran semasa: ${c.issues.map((i) => `[${i.severity}] ${i.text}`).join(' ')}` : 'Tiada amaran semasa.',
  ];
  return lines.join('\n');
}

// ---------- enjin tempatan (luar talian) ----------
// Padan awal perkataan; perkataan pendek (3 huruf ke bawah) mesti padan tepat supaya 'kos' tidak kena 'kosong'.
const has = (s, ...w) => w.some((x) => new RegExp(`(^|[^a-z0-9])${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${x.length <= 3 ? '(?![a-z0-9])' : ''}`, 'i').test(s));

export function offlineReply(message, project, photo = null) {
  const c = calc(project);
  const s = c.s;
  const q = String(message || '').toLowerCase();
  if (photo) {
    return `Foto "${photo.name}" saya terima dan rekod dalam log. Tanpa sambungan LLM saya tak boleh menganalisis gambar. Semak sendiri di tapak: (1) tiada cahaya tembus di sambungan panel, (2) exhaust fan sama aras dan rapat ke dinding Timur, (3) penebat bumbung tiada celah, (4) dinding pemisah sampai ke bumbung.`;
  }
  if (has(q, 'harga', 'bajet', 'kos', 'rm', 'duit', 'mahal', 'murah')) {
    return 'Saya tak kira harga atau bajet. Saya sediakan BOM dengan kuantiti dan spesifikasi. Muat turun CSV di tab BOM dan serahkan kepada Agen Kewangan.';
  }
  if (has(q, 'kapasiti', 'ekor', 'berapa ayam', 'muat', 'luas')) {
    return `Reban ${r1(s.L)} x ${r1(s.W)} m = ${r1(c.area)} m². ` + c.zones.map((z) => `${z.label}: ${int(z.cap[0])}-${int(z.cap[1])} ekor di ${r1(z.area)} m²`).join('. ') + '. Ikut kepadatan tropika: daging 10-12 ekor/m², telur 6-8 ekor/m².';
  }
  if (has(q, 'kipas', 'exhaust', 'cfm', 'angin', 'panas', 'haba', 'udara', 'cooling', 'pad', 'ventilasi', 'pengudaraan')) {
    return c.zones.map((z) => `Zon ${z.label.toLowerCase()}: ${z.fans} exhaust fan ${z.fanSize}" di dinding Timur (${int(z.qInst)} CFM), halaju angin ${r1(z.speed)} m/s, cooling pad ${r1(z.padArea)} m² di dinding Barat`).join('. ') + `. Ini anggaran awal ikut halaju sasaran 2 m/s. Sahkan dengan pembekal kipas. Sediakan penggera dan generator ${c.genKva} kVA.`;
  }
  if (has(q, 'biosekuriti', 'footbath', 'kasut', 'penyakit', 'jangkit', 'pemisah', 'zon', 'sanitasi')) {
    return (c.critical ? 'Awas, ada risiko kritikal sekarang. ' : '') + BIOSECURITY.aliran.slice(0, 4).join(' ') + ' Dinding pemisah antara ayam daging dan ayam telur mesti kedap udara dari lantai ke bumbung.';
  }
  if (has(q, 'orientasi', 'timur', 'barat', 'matahari', 'arah')) {
    return 'Panjangkan reban ke arah Timur-Barat. Dinding panjang menghadap Utara dan Selatan, jadi kurang kena matahari. Exhaust fan di hujung Timur, cooling pad di hujung Barat.';
  }
  if (has(q, 'bumbung', 'penebat', 'foil', 'pu foam', 'atap')) {
    return `Bumbung sekarang: ${ROOFS[s.roof].label}. PU foam menebat lebih baik daripada aluminium foil. Kalau guna foil, saya naikkan aliran udara 10% untuk tampung haba.`;
  }
  if (has(q, 'jadual', 'minggu', 'fasa', 'lama', 'tempoh', 'siap bila')) {
    const j = schedule(project);
    return `Anggaran ${j.at(-1).tamat} minggu, ${j.length} fasa: ` + j.map((p) => `${p.label} ${p.tajuk.toLowerCase()}`).join(', ') + '. Tempoh bergantung cuaca dan kontraktor.';
  }
  if (has(q, 'bom', 'bahan', 'senarai')) {
    return `BOM semasa ada ${bom(project).length} item, ikut kategori struktur, bumbung, dinding, pengudaraan, kawalan, peralatan dan biosekuriti. Buka tab BOM untuk muat turun CSV atau Markdown.`;
  }
  if (has(q, 'generator', 'genset', 'blackout', 'elektrik', 'penggera', 'alarm')) {
    return `Reban tertutup tak boleh hilang kipas. Sediakan generator ${c.genKva} kVA dengan pemula automatik dan penggera suhu tinggi serta putus bekalan. Uji setiap minggu.`;
  }
  if (has(q, 'foto', 'gambar', 'audit', 'tukang', 'semak tapak')) {
    return 'Muat naik foto rangka, pendawaian atau penebat di ruang sembang ini sebelum dinding ditutup. Saya rekod dalam log. Analisis gambar perlukan sambungan LLM dalam fail .env.';
  }
  if (has(q, 'petua', 'tip', 'nasihat')) return TIPS[Math.floor(Math.random() * TIPS.length)];
  if (has(q, 'hai', 'helo', 'hello', 'salam', 'assalam', 'apa khabar')) {
    return 'Waalaikumsalam! Saya Halim. Tanya saya tentang kapasiti, pengudaraan, biosekuriti, jadual pembinaan atau BOM.';
  }
  if (has(q, 'terima kasih', 'thanks', 'tq')) return 'Sama-sama. Jangan lupa hantar foto tapak sebelum dinding ditutup.';
  return 'Saya boleh bantu tentang kapasiti ayam, exhaust fan dan cooling pad, orientasi, biosekuriti, jadual pembinaan, BOM dan semakan foto tapak. Cuba tanya salah satu.';
}

// ---------- LLM ----------
function toTurns(history) {
  const turns = [];
  for (const m of history) {
    const role = m.role === 'user' ? 'user' : 'assistant';
    if (!turns.length && role !== 'user') continue;
    if (turns.length && turns.at(-1).role === role) turns.at(-1).text += '\n' + m.text;
    else turns.push({ role, text: m.text });
  }
  if (turns.length && turns.at(-1).role === 'user') turns.pop(); // mesej semasa ditambah berasingan
  return turns;
}

const FALLBACK_MODELS = ['claude-fable-5-2', 'claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'];

async function askAnthropic({ model, system, turns, message, image, env }) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 120_000, maxRetries: 1 });
  const content = [];
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mime, data: image.data } });
  content.push({ type: 'text', text: message });
  const params = {
    model,
    max_tokens: 16000,
    system,
    messages: [...turns.map((t) => ({ role: t.role, content: t.text })), { role: 'user', content }],
  };
  // Model terkini boleh menolak atas sebab keselamatan; fallback pelayan menyambung pada model lain.
  const res = FALLBACK_MODELS.includes(model)
    ? await client.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
    : await client.messages.create(params);
  if (res.stop_reason === 'refusal') return 'Maaf, saya tak dapat jawab soalan itu. Cuba tanya tentang pembinaan reban atau biosekuriti.';
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  if (!text) throw new Error('Jawapan kosong daripada Claude');
  return text;
}

async function askGemini({ model, system, turns, message, image, env }) {
  const parts = [];
  if (image) parts.push({ inlineData: { mimeType: image.mime, data: image.data } });
  parts.push({ text: message });
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [...turns.map((t) => ({ role: t.role === 'user' ? 'user' : 'model', parts: [{ text: t.text }] })), { role: 'user', parts }],
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${data?.error?.message || res.statusText}`);
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
  if (!text) throw new Error('Jawapan kosong daripada Gemini');
  return text;
}

function explain(err) {
  if (err instanceof Anthropic.AuthenticationError) return 'Kunci API Claude tidak sah. Semak ANTHROPIC_API_KEY dalam .env.';
  if (err instanceof Anthropic.RateLimitError) return 'Had kadar Claude dicapai. Cuba sebentar lagi.';
  if (err instanceof Anthropic.NotFoundError) return 'Model Claude tidak dijumpai. Semak ANTHROPIC_MODEL dalam .env.';
  if (err instanceof Anthropic.APIConnectionError) return 'Tidak dapat sambung ke Claude. Semak internet.';
  if (err instanceof Anthropic.APIError) return `Ralat Claude ${err.status}: ${err.message}`;
  if (err?.name === 'TimeoutError') return 'LLM terlalu lama membalas.';
  return String(err?.message || err);
}

/**
 * @returns {Promise<{reply: string, source: 'anthropic'|'gemini'|'offline', note?: string}>}
 */
export async function askHalim({ message, project, history = [], photo = null, image = null, env = process.env }) {
  const mode = llmMode(env);
  if (mode.provider === 'offline') return { reply: offlineReply(message, project, photo), source: 'offline' };
  const system = `${HALIM_SYSTEM}\n\nKONTEKS PROJEK (data semasa pengguna):\n${projectContext(project)}`;
  const text = image
    ? `${message || 'Sila semak foto tapak ini.'}\n\n(Foto tapak dilampirkan: "${photo?.name}". Periksa ralat pembinaan yang nampak: kebocoran udara, kedudukan kipas, penebat, dinding pemisah. Jika gambar tidak jelas, nyatakan apa yang perlu difoto semula.)`
    : message;
  const args = { model: mode.model, system, turns: toTurns(history), message: text, image, env };
  try {
    const reply = mode.provider === 'anthropic' ? await askAnthropic(args) : await askGemini(args);
    return { reply, source: mode.provider };
  } catch (err) {
    return { reply: offlineReply(message, project, photo), source: 'offline', note: explain(err) };
  }
}
