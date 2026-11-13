// Titik mula pelayan FarmOS. Jalankan: npm run dev  (atau: npm run api)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 5)) {
  console.error(`\nFarmOS perlukan Node.js 22.5 atau lebih baharu (versi anda: ${process.versions.node}).\nMuat turun versi LTS terkini di https://nodejs.org kemudian cuba semula.\n`);
  process.exit(1);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(path.join(root, '.env')); } catch { /* tiada .env: mod luar talian */ }

const { createApp } = await import('./app.js');
const { llmMode } = await import('./halim.js');

const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || '127.0.0.1';
const { app } = createApp({ dataDir: path.join(root, 'data'), distDir: path.join(root, 'dist') });

const server = app.listen(port, host, () => {
  const m = llmMode();
  console.log(`\n  FarmOS API   http://localhost:${port}`);
  console.log(`  Pangkalan data  data/farmos.db`);
  console.log(`  Otak Halim   ${m.provider === 'offline' ? 'enjin tempatan (luar talian, tiada kunci API)' : `${m.provider} (${m.model})`}\n`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`\nPort ${port} sedang digunakan. Tutup program lain atau tukar PORT dalam .env.\n`);
  else console.error(err);
  process.exit(1);
});
