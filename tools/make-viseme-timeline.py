#!/usr/bin/env python3
"""Builds a mouth-shape timeline (Rhubarb JSON format) from a speech recording using
acoustic analysis only (numpy/scipy + ffmpeg). No speech recognition, no network.

    python3 tools/make-viseme-timeline.py public/audio/intro.mp3 public/audio/intro.visemes.json

Per 10 ms frame it measures loudness, voicing (pitch autocorrelation), the high-frequency
energy share and the first two vocal-tract formants (LPC). From these:
  open vowels (F1 high)           -> D (aa) / C (eh)
  mid vowels                      -> C / E (oh)
  close vowels                    -> B (ee) / F (oo)
  hissing consonants (s, sh, ch)  -> B
  softer fricatives (f, v, th)    -> G
  short dips inside speech        -> A (closed: p, b, m)
  long pauses                     -> X (rest)
This is NOT phoneme recognition: vowels are classified by their acoustics, consonants coarsely.
For phoneme-level accuracy replace the output with Rhubarb Lip Sync's JSON (same format).
"""
import json, subprocess, sys
import numpy as np
from scipy.linalg import solve_toeplitz

src, dst = sys.argv[1], sys.argv[2]
SR, WIN, HOP = 16000, 400, 160
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
duration = len(x) / SR
n = 1 + (len(x) - WIN) // HOP
win = np.hamming(WIN)
pre = np.append(x[0], x[1:] - 0.97 * x[:-1])

def lpc_formants(frame, order=14):
    r = np.correlate(frame, frame, 'full')[len(frame) - 1:len(frame) + order]
    if r[0] <= 1e-9: return None
    try: a = solve_toeplitz(r[:order], r[1:order + 1])
    except Exception: return None
    roots = np.roots(np.concatenate(([1.0], -a)))
    roots = roots[np.imag(roots) > 0.01]
    f = np.angle(roots) * SR / (2 * np.pi)
    bw = -0.5 * (SR / (2 * np.pi)) * 2 * np.log(np.abs(roots) + 1e-12)
    out = sorted(float(fr) for fr, b in zip(f, bw) if 200 < fr < 3600 and b < 450)
    return out

db = np.zeros(n); voiced = np.zeros(n, bool); hr = np.zeros(n); f1 = np.full(n, np.nan); f2 = np.full(n, np.nan)
freqs = np.fft.rfftfreq(WIN, 1 / SR)
for i in range(n):
    seg = x[i * HOP:i * HOP + WIN]
    db[i] = 10 * np.log10(np.mean(seg ** 2) + 1e-10)
    spec = np.abs(np.fft.rfft(seg * win)) ** 2
    tot = spec.sum() + 1e-12
    hr[i] = spec[freqs > 4000].sum() / tot
    ac = np.correlate(seg - seg.mean(), seg - seg.mean(), 'full')[WIN - 1:]
    if ac[0] > 1e-9:
        lo, hi = SR // 300, SR // 70
        voiced[i] = (ac[lo:hi].max() / ac[0]) > 0.45
    fm = lpc_formants(pre[i * HOP:i * HOP + WIN] * win)
    if fm and len(fm) >= 2: f1[i], f2[i] = fm[0], fm[1]

floor, peak = np.percentile(db, 10), np.percentile(db, 97)
thr = max(floor + 9, peak - 34)
speech = db > thr

def med(a, k=5):  # nan-aware running median
    out = a.copy(); h = k // 2
    for i in range(len(a)):
        w = a[max(0, i - h):i + h + 1]; w = w[~np.isnan(w)]
        out[i] = np.median(w) if len(w) else np.nan
    return out
f1s, f2s = med(f1, 7), med(f2, 7)

lab = np.array(['X'] * n, dtype='<U1')
for i in range(n):
    if not speech[i]: continue
    if voiced[i] and not np.isnan(f1s[i]):
        a, b = f1s[i], f2s[i]
        if a <= 420: lab[i] = 'B' if b >= 1700 else ('F' if b < 1150 else 'B')
        elif a <= 620: lab[i] = 'C' if b >= 1500 else ('E' if b < 1150 else 'C')
        else: lab[i] = 'C' if b >= 1650 else 'D'
    elif hr[i] > 0.42: lab[i] = 'B'
    elif hr[i] > 0.18: lab[i] = 'G'
    else: lab[i] = 'C'

# silence classification: short dips between speech = closure (A), long = rest (X)
i = 0
while i < n:
    if not speech[i]:
        j = i
        while j < n and not speech[j]: j += 1
        gap = (j - i) * 0.01
        inside = i > 0 and j < n
        if inside and gap <= 0.15: lab[i:j] = 'A'
        i = j
    else: i += 1

# smooth: mode filter (60 ms), then enforce 50 ms minimum
def mode_filter(l, k=5):
    out = l.copy(); h = k // 2
    for i in range(len(l)):
        w = l[max(0, i - h):i + h + 1]
        vals, cnt = np.unique(w, return_counts=True)
        out[i] = vals[np.argmax(cnt)]
    return out
lab = mode_filter(lab, 5)
cues = []
for i, v in enumerate(lab):
    if cues and cues[-1][2] == v: cues[-1][1] = (i + 1) * 0.01 + WIN / SR / 2
    else: cues.append([i * 0.01 + WIN / SR / 2, (i + 1) * 0.01 + WIN / SR / 2, str(v)])
changed = True
while changed:
    changed = False
    for k in range(1, len(cues) - 1):
        if cues[k][1] - cues[k][0] < 0.05 and cues[k][2] != 'A':
            prev = cues[k - 1]; prev[1] = cues[k][1]; del cues[k]; changed = True; break
    merged = []
    for c in cues:
        if merged and merged[-1][2] == c[2]: merged[-1][1] = c[1]
        else: merged.append(c)
    if len(merged) != len(cues): cues = merged; changed = True
cues[0][0] = 0.0; cues[-1][1] = round(duration, 2)
for a, b in zip(cues, cues[1:]): b[0] = a[1]
out = {'metadata': {'soundFile': src.split('/')[-1], 'duration': round(duration, 2),
                    'generator': 'tools/make-viseme-timeline.py (acoustic analysis: formants + spectrum; not Rhubarb)'},
       'mouthCues': [{'start': round(a, 2), 'end': round(b, 2), 'value': v} for a, b, v in cues if b > a]}
json.dump(out, open(dst, 'w'))
from collections import Counter
dur = Counter()
for a, b, v in cues: dur[v] += b - a
print(f'duration {duration:.1f}s, {len(out["mouthCues"])} cues, mean {duration / len(out["mouthCues"]) * 1000:.0f} ms')
print('time share:', {k: f'{v / duration * 100:.0f}%' for k, v in sorted(dur.items())})
print(f'threshold {thr:.1f} dB (floor {floor:.1f}, peak {peak:.1f}); speech frames {speech.mean() * 100:.0f}%; voiced {voiced[speech].mean() * 100:.0f}% of speech')
