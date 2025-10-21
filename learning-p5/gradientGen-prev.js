/* gradientGen.js
 * Exposes: window.GradientGen = { generateTheme, precompute, defaults }
 * Requires: p5.js already loaded (uses color(), lerp(), constrain(), random(), etc.)
 */
(function () {
  // ---------- Small helpers ----------
  const clamp360 = (h) => ((h % 360) + 360) % 360;

  function hueLerp(h1, h2, t) {
    let d = (h2 - h1) % 360;
    if (d < -180) d += 360; else if (d > 180) d -= 360;
    return (h1 + d * t + 360) % 360;
  }

  function HSBtoRGBArr(h, s, b) {
    colorMode(HSB, 360, 100, 100, 255);
    const c = color(h, s, b);
    colorMode(RGB, 255, 255, 255, 255);
    return [Math.round(red(c)), Math.round(green(c)), Math.round(blue(c))];
  }

  function warpU(u, mode) {
    if (!mode) return u;
    if (mode === 'ease')  return u * u * (3 - 2 * u);
    if (mode === 'power') return Math.pow(u, 0.65);
    return u;
  }

  // ---------- Defaults (you can override via options) ----------
  const DEFAULTS = {
    // safe ranges to avoid crushed blacks/whites
    minS: 22, maxS: 96,
    minV: 18, maxV: 96,

    // neighbor constraints
    minVStep: 1.2,  // vertical monotone brightness step
    minHStep: 3.5,  // minimal hue change horizontally
    minSStep: 1.2,  // minimal sat change horizontally

    // uniqueness micro-nudges
    uniqEpsH: 0.7,
    uniqEpsV: 0.6,

    // banding / warp variability
    bandStepRange: [10, 18],
    warpMode: Math.random() < 0.5 ? 'ease' : null,

    // “external” tuning you were adjusting from HUD
    genMinDelta: 1.30, // per-row brightness span min (across columns)
    genBands: 2        // # of band slices across columns
  };

  // ---------- Random corner theme with broad movement but structure ----------
  function generateTheme() {
    const base   = Math.random() * 360;
    const span   = 130 + Math.random() * 50;   // big left-right hue travel
    const offset = -35 + Math.random() * 70;   // top-bottom hue shift

    // corner envelopes (sat/value kept readable)
    const tS = [60, 95], tV = [80, 96];
    const bS = [55, 90], bV = [60, 85];

    const topA = [ clamp360(base),              random(tS[0], tS[1]), random(tV[0], tV[1]) ];
    const topB = [ clamp360(base + span),       random(tS[0], tS[1]), random(tV[0], tV[1]) ];
    const botA = [ clamp360(base + offset),     random(bS[0], bS[1]), random(bV[0], bV[1]) ];
    const botB = [ clamp360(base + offset + span), random(bS[0], bS[1]), random(bV[0], bV[1]) ];

    return { topA, topB, botA, botB, name: 'Advanced Flow' };
  }

  // ---------- Main precompute ----------
  function precompute(rows, cols, topA, topB, botA, botB, options = {}) {
    const opt = Object.assign({}, DEFAULTS, options);

    const bandHueStep = random(opt.bandStepRange[0], opt.bandStepRange[1]);
    const warpMode    = opt.warpMode;
    const bands = Math.max(1, opt.genBands | 0);
    const bandW = Math.max(1, Math.floor(cols / bands));

    // 1) Interpolate H/S/V fields
    const H = Array.from({ length: rows }, () => Array(cols));
    const S = Array.from({ length: rows }, () => Array(cols));
    const V = Array.from({ length: rows }, () => Array(cols));

    for (let r = 0; r < rows; r++) {
      const vr = rows === 1 ? 0 : r / (rows - 1);

      const baseL_h = hueLerp(topA[0], botA[0], vr);
      const baseR_h = hueLerp(topB[0], botB[0], vr);
      const baseL_s = lerp(topA[1], botA[1], vr);
      const baseR_s = lerp(topB[1], botB[1], vr);
      let   baseL_v = lerp(topA[2], botA[2], vr);
      let   baseR_v = lerp(topB[2], botB[2], vr);

      // enforce strong brightness span across row → enables vertical monotone
      if (cols > 1) {
        const span = baseR_v - baseL_v;
        const wantSpan = Math.sign(span || 1) * Math.max(Math.abs(span), opt.genMinDelta * (cols - 1));
        baseR_v = baseL_v + wantSpan;
      }

      for (let c = 0; c < cols; c++) {
        const uRaw = cols === 1 ? 0 : c / (cols - 1);
        const u    = warpU(uRaw, warpMode);
        const bandIdx = Math.min(bands - 1, Math.floor(c / bandW));

        const hL = (baseL_h + bandIdx * bandHueStep) % 360;
        const hR = (baseR_h - bandIdx * bandHueStep) % 360;

        let h = hueLerp(hL, hR, u);
        let s = lerp(baseL_s, baseR_s, u);
        let v = lerp(baseL_v, baseR_v, u);

        s = constrain(s, opt.minS, opt.maxS);
        v = constrain(v, opt.minV, opt.maxV);

        H[r][c] = h; S[r][c] = s; V[r][c] = v;
      }
    }

    // 2) Vertical monotone brightness per column
    for (let c = 0; c < cols; c++) {
      const vTop = V[0][c], vBot = V[rows - 1][c];
      const dir = (vBot >= vTop) ? +1 : -1;
      let prev = vTop;
      for (let r = 1; r < rows; r++) {
        let need = dir * (V[r][c] - prev);
        if (need < opt.minVStep) {
          V[r][c] = constrain(prev + dir * opt.minVStep, opt.minV, opt.maxV);
        }
        prev = V[r][c];
      }
    }

    // 3) Horizontal min deltas for hue/sat
    for (let r = 0; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        // hue circular min step
        let dh = H[r][c] - H[r][c - 1];
        dh = ((dh + 540) % 360) - 180;
        if (Math.abs(dh) < opt.minHStep) {
          const sign = dh === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dh);
          H[r][c] = clamp360(H[r][c - 1] + sign * opt.minHStep);
        }
        // sat linear min step
        let ds = S[r][c] - S[r][c - 1];
        if (Math.abs(ds) < opt.minSStep) {
          const signS = ds === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(ds);
          S[r][c] = constrain(S[r][c - 1] + signS * opt.minSStep, opt.minS, opt.maxS);
        }
      }
    }

    // 4) Convert to RGB + enforce uniqueness
    const out = Array.from({ length: rows }, () => Array(cols));
    const seen = new Set();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let h = H[r][c], s = S[r][c], v = V[r][c];
        let rgb = HSBtoRGBArr(h, s, v);

        // uniqueness via tiny hue/value nudges
        let key = `${rgb[0]},${rgb[1]},${rgb[2]}`;
        if (seen.has(key)) {
          let tries = 4, ok = false;
          while (tries-- > 0 && !ok) {
            h = clamp360(h + (Math.random() < 0.5 ? -opt.uniqEpsH : opt.uniqEpsH));
            v = constrain(v + (Math.random() < 0.5 ? -opt.uniqEpsV : opt.uniqEpsV), opt.minV, opt.maxV);
            rgb = HSBtoRGBArr(h, s, v);
            key = `${rgb[0]},${rgb[1]},${rgb[2]}`;
            if (!seen.has(key)) ok = true;
          }
        }
        seen.add(key);
        out[r][c] = rgb;
      }
    }

    return out;
  }

  // Surface a stable API on window
  window.GradientGen = {
    defaults: DEFAULTS,
    generateTheme,
    precompute
  };
})();
