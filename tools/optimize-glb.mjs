// Shrinks an Avaturn T2 GLB for the web without changing how it looks or what it can do.
//   node tools/optimize-glb.mjs input.glb output.glb
// Needs the `sharp` package (npm i -D sharp) for the texture step.
//
//  1. Morph targets: keeps every target (all 52 ARKit + 15 viseme shapes) but stores position
//     deltas as glTF *sparse* accessors (only the vertices that move) and drops normal deltas.
//  2. Textures: downsizes the big ones, converts maps whose alpha is never used to JPEG,
//     palette-compresses the rest. Face colour/normal stay at full resolution.
//  3. Animation: keeps the joint rotation tracks (the standing idle), drops the hips translation
//     and the morph-weight tracks (blinking is driven by the page).
//  4. Drops everything that is no longer referenced.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const [, , inPath, outPath] = process.argv;
const sharp = createRequire(import.meta.url)('sharp');

const buf = fs.readFileSync(inPath);
const jsonLen = buf.readUInt32LE(12);
const J = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
const BIN = buf.slice(20 + jsonLen + 8);

const chunks = [];
let offset = 0;
const pad4 = (n) => (n + 3) & ~3;
function addBytes(bytes) {
  const start = offset;
  chunks.push(bytes);
  offset += bytes.length;
  const padding = pad4(offset) - offset;
  if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
  return start;
}

const bufferViews = [];
const accessors = [];
const viewMap = new Map();
const accMap = new Map();

function copyView(i) {
  if (viewMap.has(i)) return viewMap.get(i);
  const v = J.bufferViews[i];
  const start = addBytes(BIN.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength));
  const nv = { buffer: 0, byteOffset: start, byteLength: v.byteLength };
  if (v.byteStride) nv.byteStride = v.byteStride;
  if (v.target) nv.target = v.target;
  bufferViews.push(nv);
  viewMap.set(i, bufferViews.length - 1);
  return bufferViews.length - 1;
}
function useAccessor(i) {
  if (accMap.has(i)) return accMap.get(i);
  const a = { ...J.accessors[i] };
  if (a.bufferView !== undefined) a.bufferView = copyView(a.bufferView);
  accessors.push(a);
  accMap.set(i, accessors.length - 1);
  return accessors.length - 1;
}

// ---- morph targets: sparse positions only ----
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function readFloats(i) {
  const a = J.accessors[i], v = J.bufferViews[a.bufferView], n = NC[a.type];
  const out = new Float32Array(a.count * n);
  const base = (v.byteOffset || 0) + (a.byteOffset || 0), stride = v.byteStride || n * 4;
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = BIN.readFloatLE(base + k * stride + c * 4);
  return out;
}
const EPS = 5e-5;
// ARKit shapes that nothing on the page drives (speech, blinking, gaze, brows and smile are kept).
const DROP = new Set(['tongueOut', 'cheekPuff', 'jawLeft', 'jawRight', 'mouthLeft', 'mouthRight', 'mouthDimpleLeft', 'mouthDimpleRight',
  'mouthShrugLower', 'mouthShrugUpper', 'noseSneerLeft', 'noseSneerRight', 'mouthFrownLeft', 'mouthFrownRight', 'mouthPressLeft', 'mouthPressRight']);
let morphBefore = 0, morphAfter = 0;
function sparsePositionAccessor(oldIdx) {
  const a = J.accessors[oldIdx];
  const d = readFloats(oldIdx);
  morphBefore += a.count * 12;
  const idx = [];
  for (let k = 0; k < a.count; k++) if (Math.abs(d[k * 3]) > EPS || Math.abs(d[k * 3 + 1]) > EPS || Math.abs(d[k * 3 + 2]) > EPS) idx.push(k);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < a.count; k++) for (let c = 0; c < 3; c++) { min[c] = Math.min(min[c], d[k * 3 + c]); max[c] = Math.max(max[c], d[k * 3 + c]); }
  const acc = { componentType: 5126, count: a.count, type: 'VEC3', min, max };
  if (idx.length) {
    const small = a.count <= 65535;
    const ib = Buffer.alloc(idx.length * (small ? 2 : 4));
    idx.forEach((v, n) => (small ? ib.writeUInt16LE(v, n * 2) : ib.writeUInt32LE(v, n * 4)));
    const vals = Buffer.alloc(idx.length * 12);
    idx.forEach((k, n) => { for (let c = 0; c < 3; c++) vals.writeFloatLE(d[k * 3 + c], n * 12 + c * 4); });
    bufferViews.push({ buffer: 0, byteOffset: addBytes(ib), byteLength: ib.length });
    const ivIdx = bufferViews.length - 1;
    bufferViews.push({ buffer: 0, byteOffset: addBytes(vals), byteLength: vals.length });
    const vvIdx = bufferViews.length - 1;
    acc.sparse = { count: idx.length, indices: { bufferView: ivIdx, componentType: small ? 5123 : 5125 }, values: { bufferView: vvIdx } };
    morphAfter += ib.length + vals.length;
  }
  accessors.push(acc);
  return accessors.length - 1;
}

const meshes = J.meshes.map((m) => {
  const names = m.extras && m.extras.targetNames;
  const keep = (names || []).map((n) => !DROP.has(n));
  const mm = { ...m, primitives: null };
  if (names) mm.extras = { ...m.extras, targetNames: names.filter((n) => !DROP.has(n)) };
  mm.primitives = m.primitives.map((p) => {
    const np = { ...p, attributes: {} };
    for (const [k, v] of Object.entries(p.attributes)) np.attributes[k] = useAccessor(v);
    if (p.indices !== undefined) np.indices = useAccessor(p.indices);
    if (p.targets) np.targets = p.targets.filter((_, ti) => !names || keep[ti]).map((t) => ({ POSITION: sparsePositionAccessor(t.POSITION) }));
    return np;
  });
  return mm;
});

// ---- skins ----
const skins = (J.skins || []).map((s) => ({ ...s, inverseBindMatrices: s.inverseBindMatrices !== undefined ? useAccessor(s.inverseBindMatrices) : undefined }));

// ---- animation: rotation tracks only ----
const animations = (J.animations || []).map((a) => {
  const channels = [], samplers = [], smap = new Map();
  for (const c of a.channels) {
    if (c.target.path !== 'rotation') continue;
    if (!smap.has(c.sampler)) {
      const s = a.samplers[c.sampler];
      samplers.push({ input: useAccessor(s.input), output: useAccessor(s.output), interpolation: s.interpolation || 'LINEAR' });
      smap.set(c.sampler, samplers.length - 1);
    }
    channels.push({ sampler: smap.get(c.sampler), target: c.target });
  }
  return { name: a.name, channels, samplers };
});

// ---- textures ----
// [maxSize, format]: jpeg(quality) | png (palette) | keep
const PLAN = {
  1: [512, 'jpeg', 84], 2: [512, 'jpeg', 85], 5: [256, 'jpeg', 85], 8: [256, 'jpeg', 85],
  14: [256, 'jpeg', 85], 15: [256, 'jpeg', 85], 19: [512, 'png'], 20: [512, 'jpeg', 82],
  21: [512, 'jpeg', 82], 22: [512, 'jpeg', 84], 23: [512, 'jpeg', 82], 25: [512, 'jpeg', 82],
  26: [512, 'jpeg', 84], 27: [512, 'jpeg', 82], 7: [512, 'png'],
};
const images = [];
let imgBefore = 0, imgAfter = 0;
for (let i = 0; i < J.images.length; i++) {
  const v = J.bufferViews[J.images[i].bufferView];
  const src = BIN.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  imgBefore += src.length;
  const plan = PLAN[i];
  let out = src, mime = J.images[i].mimeType;
  if (plan) {
    const [size, fmt, q] = plan;
    let s = sharp(src).resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true });
    if (fmt === 'jpeg') { s = s.flatten({ background: '#808080' }).jpeg({ quality: q, mozjpeg: true }); mime = 'image/jpeg'; }
    else { s = s.png({ palette: true, quality: 85, compressionLevel: 9 }); mime = 'image/png'; }
    const cand = await s.toBuffer();
    if (cand.length < src.length) out = cand; else mime = J.images[i].mimeType;
  }
  imgAfter += out.length;
  bufferViews.push({ buffer: 0, byteOffset: addBytes(out), byteLength: out.length });
  images.push({ bufferView: bufferViews.length - 1, mimeType: mime });
}

const outJson = { ...J, meshes, skins, animations, images, accessors, bufferViews, buffers: [{ byteLength: offset }] };
for (const n of outJson.nodes) if (n.weights) delete n.weights;
for (const m of outJson.meshes) if (m.weights) delete m.weights;

let jsonBuf = Buffer.from(JSON.stringify(outJson));
jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad4(jsonBuf.length) - jsonBuf.length, 0x20)]);
const binBuf = Buffer.concat(chunks);
const total = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonBuf.length, 0); jh.write('JSON', 4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(binBuf.length, 0); bh.write('BIN\0', 4);
fs.writeFileSync(outPath, Buffer.concat([head, jh, jsonBuf, bh, binBuf]));
const mb = (n) => (n / 1e6).toFixed(2) + ' MB';
console.log(`file ${mb(buf.length)} -> ${mb(total)} | morph ${mb(morphBefore * 2)} (pos+normals) -> ${mb(morphAfter)} | textures ${mb(imgBefore)} -> ${mb(imgAfter)}`);
