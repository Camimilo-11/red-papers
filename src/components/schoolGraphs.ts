/**
 * Grafos de fondo por escuela (SIMAPC).
 *
 * Cada escuela tiene un grafo de exactamente N_NODES nodos con una forma que
 * representa su campo. Como todos tienen el mismo número de nodos, el fondo es
 * UN SOLO grafo que se transforma de una escuela a otra (los nodos viajan) en
 * lugar de cambiar una imagen por otra.
 *
 * Todo es determinista (sin Math.random): el mismo resultado en cada carga.
 * Coordenadas en un lienzo de 1600 x 900.
 */

export type SchoolCode = 'ECAA' | 'ECBI' | 'ECFN' | 'ECTEA' | 'ECMC' | 'ECQI' | 'YTLC';

export const N_NODES = 72;
export const GRAPH_W = 1600;
export const GRAPH_H = 900;

export interface SchoolGraph {
  /** x0,y0,x1,y1,... (N_NODES pares) */
  points: Float32Array;
  /** pares de índices de nodo: a0,b0,a1,b1,... */
  edges: Uint16Array;
}

/** Color del logo de cada escuela (se usa para trazo y nodos). */
export const SCHOOL_GRAPH_COLORS: Record<SchoolCode, string> = {
  ECAA: '#1db5a5',
  ECBI: '#6fb23a',
  ECFN: '#c4901a',
  ECTEA: '#d9743a',
  ECMC: '#e0453a',
  ECQI: '#3a9fd6',
  YTLC: '#1e9bb0',
};

// ---------- utilidades ----------
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];
type Edge = [number, number];

/**
 * Ajusta la nube al área derecha/central del lienzo (la izquierda queda para
 * el texto), conserva la proporción, y ORDENA los nodos de izquierda a derecha
 * para que al transformarse entre escuelas los nodos hagan trayectos cortos
 * y coherentes (sin cruzarse como una maraña).
 */
function finalize(pts: Pt[], edges: Edge[]): SchoolGraph {
  if (pts.length !== N_NODES) throw new Error(`grafo con ${pts.length} nodos, se esperaban ${N_NODES}`);
  const box = { x0: 560, y0: 40, x1: 1580, y1: 860 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const k = Math.min((box.x1 - box.x0) / (maxX - minX), (box.y1 - box.y0) / (maxY - minY));
  const ox = box.x0 + ((box.x1 - box.x0) - (maxX - minX) * k) / 2 - minX * k;
  const oy = box.y0 + ((box.y1 - box.y0) - (maxY - minY) * k) / 2 - minY * k;
  const fitted: Pt[] = pts.map(([x, y]) => [x * k + ox, y * k + oy]);

  const order = fitted.map((_, i) => i).sort((a, b) => fitted[a][0] - fitted[b][0] || fitted[a][1] - fitted[b][1]);
  const remap = new Array<number>(N_NODES);
  order.forEach((old, ni) => (remap[old] = ni));

  const points = new Float32Array(N_NODES * 2);
  order.forEach((old, ni) => {
    points[ni * 2] = fitted[old][0];
    points[ni * 2 + 1] = fitted[old][1];
  });
  const seen = new Set<string>();
  const out: number[] = [];
  for (const [a, b] of edges) {
    const A = remap[a], B = remap[b];
    if (A === B) continue;
    const key = A < B ? `${A}-${B}` : `${B}-${A}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(A, B);
  }
  return { points, edges: Uint16Array.from(out) };
}

// ---------- ECAA: árbol que crece (cultivo, cadena agroindustrial) ----------
function treeGraph(): SchoolGraph {
  const r = rng(11);
  const pts: Pt[] = [[0, 0]];
  const edges: Edge[] = [];
  // cola de ramas: [índice del nodo, ángulo, longitud, profundidad]
  const queue: [number, number, number, number][] = [[0, -Math.PI / 2, 150, 0]];
  while (pts.length < N_NODES && queue.length) {
    const [idx, ang, len, d] = queue.shift()!;
    const [px, py] = pts[idx];
    const kids = d === 0 ? 1 : d < 5 ? 2 : r() < 0.35 ? 1 : 2;
    for (let c = 0; c < kids && pts.length < N_NODES; c++) {
      const spread = kids === 1 ? (r() - 0.5) * 0.3 : (c === 0 ? -1 : 1) * (0.38 + r() * 0.22);
      const a = ang + spread;
      const l = len * (0.78 + r() * 0.1);
      const n = pts.length;
      pts.push([px + Math.cos(a) * l, py + Math.sin(a) * l]);
      edges.push([idx, n]);
      queue.push([n, a, l, d + 1]);
    }
  }
  return finalize(pts, edges);
}

// ---------- ECBI: doble hélice de ADN ----------
function helixGraph(): SchoolGraph {
  const pts: Pt[] = [];
  const edges: Edge[] = [];
  const per = N_NODES / 2; // 36 por hebra
  const turns = 3.2;
  for (let s = 0; s < 2; s++) {
    for (let i = 0; i < per; i++) {
      const t = i / (per - 1);
      const phase = t * turns * Math.PI * 2 + s * Math.PI;
      const along = t * 1000; // eje largo
      const across = Math.sin(phase) * 150;
      // eje inclinado ~ -28° para dinamismo
      const ang = -0.49;
      pts.push([along * Math.cos(ang) - across * Math.sin(ang), along * Math.sin(ang) + across * Math.cos(ang)]);
      if (i > 0) edges.push([s * per + i - 1, s * per + i]);
    }
  }
  for (let i = 0; i < per; i += 1) edges.push([i, per + i]); // peldaños
  return finalize(pts, edges);
}

// ---------- ECFN: átomo / órbitas (física y nanotecnología) ----------
function atomGraph(): SchoolGraph {
  const pts: Pt[] = [];
  const edges: Edge[] = [];
  // núcleo: 8 nodos en dos capas
  const nuc: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const rr = i % 2 ? 26 : 54;
    nuc.push(pts.length);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  for (let i = 0; i < 8; i++) edges.push([nuc[i], nuc[(i + 1) % 8]]);
  for (let i = 0; i < 8; i += 2) edges.push([nuc[i], nuc[(i + 2) % 8]]);
  // 4 órbitas de 16 nodos
  const orbitAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
  for (let o = 0; o < 4; o++) {
    const first = pts.length;
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      const x = Math.cos(t) * 430;
      const y = Math.sin(t) * 150;
      const c = Math.cos(orbitAngles[o]), s = Math.sin(orbitAngles[o]);
      pts.push([x * c - y * s, x * s + y * c]);
      edges.push([first + i, first + ((i + 1) % 16)]);
    }
    edges.push([first + (o * 4) % 16, nuc[(o * 2) % 8]]); // la órbita toca el núcleo
  }
  return finalize(pts, edges);
}

// ---------- ECTEA: curvas de nivel (relieve, tierra) ----------
function contourGraph(): SchoolGraph {
  const pts: Pt[] = [];
  const edges: Edge[] = [];
  const rings = 6;
  const per = 12;
  const idx = (k: number, i: number) => k * per + (i % per);
  for (let k = 0; k < rings; k++) {
    for (let i = 0; i < per; i++) {
      const t = (i / per) * Math.PI * 2;
      const rad = 60 + k * 62;
      // relieve irregular determinista (cresta alargada hacia la derecha)
      const wob = 1 + 0.18 * Math.sin(t * 3 + k * 0.7) + 0.1 * Math.cos(t * 5 - k);
      pts.push([Math.cos(t) * rad * wob * 1.45, Math.sin(t) * rad * wob * 0.9]);
      edges.push([idx(k, i), idx(k, i + 1)]);
    }
  }
  for (let k = 0; k < rings - 1; k++) for (let i = 0; i < per; i += 2) edges.push([idx(k, i), idx(k + 1, i)]);
  return finalize(pts, edges);
}

// ---------- ECMC: curva de regresión con banda de confianza ----------
function dataGraph(): SchoolGraph {
  const r = rng(29);
  const pts: Pt[] = [];
  const edges: Edge[] = [];
  const m = N_NODES / 3; // 24 nodos por curva: central, superior, inferior
  const base = (x: number) => -Math.sin((x / 1000) * Math.PI * 2.2) * 150 - x * 0.12;
  for (let layer = 0; layer < 3; layer++) {
    const off = layer === 0 ? 0 : layer === 1 ? -120 : 120;
    for (let i = 0; i < m; i++) {
      const x = (i / (m - 1)) * 1000;
      const jitter = layer === 0 ? 0 : (r() - 0.5) * 46;
      pts.push([x + (layer ? (r() - 0.5) * 18 : 0), base(x) + off + jitter]);
      if (i > 0) edges.push([layer * m + i - 1, layer * m + i]);
    }
  }
  for (let i = 0; i < m; i += 2) {
    edges.push([i, m + i]); // central <-> superior
    edges.push([i, 2 * m + i]); // central <-> inferior
  }
  for (let i = 1; i < m; i += 4) edges.push([m + i, 2 * m + i - 1]); // cruces de la banda
  return finalize(pts, edges);
}

// ---------- ECQI: moléculas (anillos de seis átomos unidos por enlaces) ----------
function moleculeGraph(): SchoolGraph {
  const pts: Pt[] = [];
  const edges: Edge[] = [];
  // 10 anillos hexagonales (60 nodos) + 12 sustituyentes
  const centers: Pt[] = [
    [0, 0], [200, -60], [400, 20], [220, 150], [-30, 190],
    [440, -190], [620, -90], [610, 130], [820, 20], [-170, -130],
  ];
  const sizes = [62, 52, 66, 48, 56, 50, 60, 46, 64, 50];
  const ringStart: number[] = [];
  centers.forEach(([cx, cy], k) => {
    ringStart.push(pts.length);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + k * 0.4;
      pts.push([cx + Math.cos(a) * sizes[k], cy + Math.sin(a) * sizes[k]]);
      edges.push([ringStart[k] + i, ringStart[k] + ((i + 1) % 6)]);
    }
  });
  const nearest = (a: number, b: number) => {
    let best: Edge = [ringStart[a], ringStart[b]], bd = Infinity;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      const A = ringStart[a] + i, B = ringStart[b] + j;
      const d = Math.hypot(pts[A][0] - pts[B][0], pts[A][1] - pts[B][1]);
      if (d < bd) { bd = d; best = [A, B]; }
    }
    return best;
  };
  [[0, 1], [1, 2], [1, 3], [0, 4], [3, 2], [2, 5], [5, 6], [6, 7], [7, 8], [2, 7], [0, 9]].forEach(([a, b]) => edges.push(nearest(a, b)));
  // sustituyentes (12) colgando de átomos de anillo
  const hooks = [2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 59, 11];
  hooks.forEach((h, n) => {
    const [x, y] = pts[h];
    const k = Math.floor(h / 6);
    const [cx, cy] = centers[k];
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
    const id = pts.length;
    pts.push([x + (dx / d) * (60 + (n % 3) * 14), y + (dy / d) * (60 + (n % 3) * 14)]);
    edges.push([h, id]);
  });
  return finalize(pts, edges);
}

// ---------- YTLC: globo (idiomas y cultura en red) ----------
function globeGraph(): SchoolGraph {
  const pts: Pt[] = [];
  const edges: Edge[] = [];
  const meridians = 8;
  const parallels = 9;
  const tilt = 0.45;
  const spin = 0.35;
  const id = (m: number, p: number) => m * parallels + p;
  for (let m = 0; m < meridians; m++) {
    for (let p = 0; p < parallels; p++) {
      const lon = (m / meridians) * Math.PI * 2 + spin;
      const lat = -Math.PI / 2 + ((p + 0.5) / parallels) * Math.PI;
      const x = Math.cos(lat) * Math.sin(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lon);
      // inclinación del eje
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
      pts.push([x * 420, y2 * 420]);
      if (p > 0) edges.push([id(m, p - 1), id(m, p)]);
      edges.push([id(m, p), id((m + 1) % meridians, p)]);
    }
  }
  return finalize(pts, edges);
}

let cache: Record<SchoolCode, SchoolGraph> | null = null;
export function getSchoolGraphs(): Record<SchoolCode, SchoolGraph> {
  if (!cache) {
    cache = {
      ECAA: treeGraph(),
      ECBI: helixGraph(),
      ECFN: atomGraph(),
      ECTEA: contourGraph(),
      ECMC: dataGraph(),
      ECQI: moleculeGraph(),
      YTLC: globeGraph(),
    };
  }
  return cache;
}
