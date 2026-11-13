// Daftar ejen. Untuk tambah ejen baharu, tambah satu objek di sini.
// Meja dan watak piksel dalam pejabat dibuka secara automatik ikut `slot` dan `status`.
//   status: 'active' = watak muncul dan meja dibuka, 'locked' = meja berkunci.
//   palette: warna watak piksel (topi keselamatan, ves, baju, seluar).
//   brain: 'halim' = ada enjin sembang dan tugasan, 'generic' = rutin pejabat sahaja.
export const AGENTS = [
  {
    id: 'halim', slot: 1, name: 'Halim', role: 'PEMBINAAN',
    title: 'Perancang pembinaan reban dan biosekuriti', status: 'active', brain: 'halim',
    palette: { helmet: '#f5c518', vest: '#ff7a1a', shirt: '#dfe9f3', pants: '#2a3550' },
  },
  {
    id: 'kewangan', slot: 2, name: 'Agen 02', role: 'KEWANGAN',
    title: 'Kewangan dan bajet', status: 'locked', brain: 'generic',
    palette: { helmet: '#f2f2ec', vest: '#2f7dd1', shirt: '#f3ead8', pants: '#3b3b46' },
  },
  {
    id: 'operasi', slot: 3, name: 'Agen 03', role: 'OPERASI',
    title: 'Operasi dan jualan', status: 'locked', brain: 'generic',
    palette: { helmet: '#3fb56f', vest: '#d8e04a', shirt: '#e8eef2', pants: '#4a3a2c' },
  },
];
