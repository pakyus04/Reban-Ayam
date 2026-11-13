// Pathfinding A* atas grid jubin (4 arah). Mengembalikan senarai jubin dari mula (tidak termasuk) ke sasaran.
export function findPath(blocked, cols, rows, sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return [];
  const ok = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && !blocked[y * cols + x];
  if (!ok(tx, ty)) return null;
  const N = cols * rows;
  const g = new Float32Array(N).fill(Infinity);
  const f = new Float32Array(N).fill(Infinity);
  const from = new Int32Array(N).fill(-1);
  const fromDir = new Int8Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const open = [];
  const h = (x, y) => Math.abs(x - tx) + Math.abs(y - ty);
  const s = sy * cols + sx;
  g[s] = 0; f[s] = h(sx, sy); open.push(s);
  const DX = [1, -1, 0, 0], DY = [0, 0, 1, -1];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % cols, cy = (cur / cols) | 0;
    if (cx === tx && cy === ty) {
      const out = [];
      for (let n = cur; n !== s; n = from[n]) out.push({ x: n % cols, y: (n / cols) | 0 });
      return out.reverse();
    }
    for (let d = 0; d < 4; d++) {
      const nx = cx + DX[d], ny = cy + DY[d];
      if (!ok(nx, ny)) continue;
      const n = ny * cols + nx;
      if (closed[n]) continue;
      const cost = g[cur] + 1 + (fromDir[cur] !== -1 && fromDir[cur] !== d ? 0.15 : 0); // kurangkan belok-belok
      if (cost < g[n]) { g[n] = cost; f[n] = cost + h(nx, ny); from[n] = cur; fromDir[n] = d; open.push(n); }
    }
  }
  return null;
}
