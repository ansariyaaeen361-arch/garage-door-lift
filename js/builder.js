// Door Builder — all 5 product lines.
// Vanilla JS, no build step, matches conventions in js/auth.js (fetch pattern, .auth-error, etc.)

(function () {
  'use strict';

  const STORAGE_KEY = 'doorBuilderState';

  // Size is the one step every line shares identically (single/double/custom width),
  // so it stays a flat top-level list rather than living inside each line's config.
  const SIZES = [
    { id: 'single', label: 'Single Door', dims: "8' wide x 7' tall", cols: 4 },
    { id: 'double', label: 'Double Door', dims: "16' wide x 7' tall", cols: 8 },
    { id: 'custom', label: 'Custom Size', dims: 'Enter your own dimensions', cols: null }
  ];

  function overlaySeries(group, codes) {
    return codes.map((code) => ({ id: 'ov-' + code, name: code, img: `assets/overlay-${code}.png`, group }));
  }

  // Every line supplies the same shape — models / styles / colors / windows — even
  // when it only has one (or zero) of something. The step machinery below decides
  // whether to actually show a step for model/style/windows based on how many
  // options that array has (0 or 1 = nothing to choose, so skip it and auto-fill).
  const LINES = {
    panel: {
      id: 'panel', name: 'Insulated Panel', heroImg: 'assets/style-icon-cassette.png',
      blurb: 'Classic panel doors, 4 styles', secondaryLabel: 'Windows',
      models: [
        { id: 's25-40', name: 'S25-40', img: 'assets/model-1.png', sub: 'R-14.7' },
        { id: 's25-20', name: 'S25-20', img: 'assets/model-2.png', sub: 'R-14.7' },
        { id: 's25-30', name: 'S25-30', img: 'assets/model-3.png', sub: 'R-14.7' }
      ],
      styles: [
        { id: 'cassette', name: 'Classic Cassette', pattern: 'cassette', img: 'assets/style-icon-cassette.png' },
        { id: 'carriage-short', name: 'Carriage Short', pattern: 'carriage-short', img: 'assets/style-icon-carriage-short.png' },
        { id: 'raised-ranch', name: 'Raised Ranch', pattern: 'raised-ranch', img: 'assets/style-icon-raised-ranch.png' },
        { id: 'carriage-long', name: 'Carriage Long', pattern: 'carriage-long', img: 'assets/style-icon-carriage-long.png' }
      ],
      colors: [
        { id: 'black', name: 'Black', hex: '#1a1a1a', code: 'RAL 9005' },
        { id: 'white', name: 'White', hex: '#f2f2ee', code: 'RAL 9016' },
        { id: 'almond', name: 'Almond', hex: '#cfc9b8', code: 'RAL 9005' }
      ],
      // layout 'unit' = one self-contained window icon, tiled per column (contain-fit).
      // layout 'strip' = source image already spans a full double-door row (two window
      // groups + center-post gap baked in) — stretched once across the whole row.
      // minCols = how many door columns this art needs to look right.
      windows: [
        { id: 'wd1001', name: 'European Style Frame', code: 'CH-WD1001', img: 'assets/window-wd1001-european.png', layout: 'unit', minCols: 2 },
        { id: 'wd1002', name: 'Square Cross', code: 'CH-WD1002', img: 'assets/window-wd1002-square-cross.png', layout: 'unit', minCols: 2 },
        { id: 'wd1003', name: 'Cross Window', code: 'CH-WD1003', img: 'assets/window-wd1003-cross.png', layout: 'unit', minCols: 2 },
        { id: 'wd1004', name: 'Diamond Window', code: 'CH-WD1004', img: 'assets/window-wd1004-diamond.png', layout: 'unit', minCols: 2 },
        { id: 'wd1005', name: 'House-Like', code: 'CH-WD1005', img: 'assets/window-wd1005-house.png', layout: 'unit', minCols: 2 },
        { id: 'wd1006', name: 'Mountain-Like', code: 'CH-WD1006', img: 'assets/window-wd1006-mountain.png', layout: 'unit', minCols: 2 },
        { id: 'wd4001', name: 'Sector Window A', code: 'CH-WD4001', img: 'assets/window-4001-sector-a.png', layout: 'strip', minCols: 6 },
        { id: 'wd4003', name: 'Sector Window B', code: 'CH-WD4003', img: 'assets/window-4003-sector-b.png', layout: 'strip', minCols: 6 },
        { id: 'wd4002', name: 'Sun Rising', code: 'CH-WD4002', img: 'assets/window-4002-sun-rising.png', layout: 'strip', minCols: 6 },
        { id: 'wd4004', name: 'Radiation Window', code: 'CH-WD4004', img: 'assets/window-4004-radiation.png', layout: 'strip', minCols: 6 },
        { id: 'wd3003', name: 'Panel Frame', code: 'CH-WD3003', img: 'assets/window-wd3003.png', layout: 'strip', minCols: 6 },
        { id: 'wd3004', name: 'Diamond Lattice', code: 'CH-WD3004', img: 'assets/window-wd3004.png', layout: 'strip', minCols: 6 },
        { id: 'wd3005', name: 'Arched Column', code: 'CH-WD3005', img: 'assets/window-wd3005.png', layout: 'strip', minCols: 6 },
        { id: 'wd3006', name: 'Curved Panel', code: 'CH-WD3006', img: 'assets/window-wd3006.png', layout: 'strip', minCols: 6 },
        { id: 'wd3007', name: 'Wide Sunburst', code: 'CH-WD3007', img: 'assets/window-wd3007.png', layout: 'strip', minCols: 6 },
        { id: 'wd3008', name: 'Curved Quad Panel', code: 'CH-WD3008', img: 'assets/window-wd3008.png', layout: 'strip', minCols: 6 }
      ]
    },
    flush: {
      id: 'flush', name: 'Modern Flush', heroImg: 'assets/flush-hero.png',
      blurb: 'Smooth flat-panel, minimalist', secondaryLabel: 'Windows',
      models: [{ id: 's25-00', name: 'S25-00', img: 'assets/flush-model.png', sub: 'R-14.7' }],
      styles: [{ id: 'flush', name: 'Flush', img: 'assets/style-icon-flush.png' }],
      colors: [
        { id: 'dark-oak', name: 'Dark Oak', hex: '#4a2e1a', code: 'WOODGRAIN' },
        { id: 'light-oak', name: 'Light Oak', hex: '#b8875a', code: 'WOODGRAIN' },
        { id: 'red-oak', name: 'Red Oak', hex: '#9c4f2e', code: 'WOODGRAIN' },
        { id: 'carbon-oak', name: 'Carbon Oak', hex: '#c99a4a', code: 'WOODGRAIN' },
        { id: 'dark-walnut', name: 'Dark Walnut', hex: '#7d8791', code: 'WOODGRAIN' },
        { id: 'black-walnut', name: 'Black Walnut', hex: '#6e2f1f', code: 'WOODGRAIN' },
        { id: 'black', name: 'Black', hex: '#1a1a1a', code: 'SOLID' },
        { id: 'white', name: 'White', hex: '#eceae4', code: 'SOLID' }
      ],
      windows: [
        { id: 'slim', name: 'Slim Windows', code: 'Complete Aluminum Frame', img: 'assets/win-slim.png' },
        { id: 'standard', name: 'Standard Windows', img: 'assets/win-standard.png' }
      ]
    },
    overlay: {
      id: 'overlay', name: 'Overlay', heroImg: 'assets/overlay-hero.png',
      blurb: 'Installs over your existing door', secondaryLabel: 'Windows',
      models: [],
      styles: [
        ...overlaySeries('6400 Series — Aluminium Sheet Panel', ['6410', '6412', '6414', '6416', '6418']),
        ...overlaySeries('6500 Series — Aluminium Sheet Panel', ['6510', '6512', '6514', '6516', '6518', '6520', '6522', '6524', '6526', '6528']),
        ...overlaySeries('6600 Series — Aluminium Sheet Panel', ['6610', '6612', '6614', '6616', '6618']),
        ...overlaySeries('7100 Series — Insulated Panel', ['7110', '7112', '7114', '7116', '7118', '7120', '7122', '7124', '7126', '7128']),
        ...overlaySeries('7200 Series — Insulated Panel', ['7210', '7212', '7214', '7216', '7218'])
      ],
      colors: [
        { id: 'chocolate-brown', name: 'Chocolate Brown', hex: '#3a2a20', code: 'RAL 8077' },
        { id: 'basic-grey', name: 'Basic Grey', hex: '#54585c', code: 'RAL 7014' },
        { id: 'white', name: 'White', hex: '#eceae4', code: 'RAL 9016' },
        { id: 'brown-suede', name: 'Brown Suede', hex: '#4a3226', code: 'RAL 8077' },
        { id: 'matte-black', name: 'Matte Black', hex: '#141414', code: 'RAL 8077' },
        { id: 'light-oak', name: 'Light Oak', hex: '#b8875a', code: 'PL-OK01' },
        { id: 'dark-oak', name: 'Dark Oak', hex: '#5a3a24', code: 'PL-OK02' },
        { id: 'white-suede', name: 'White Suede', hex: '#dcd8ce', code: 'RAL 8014' },
        { id: 'black-walnut', name: 'Black Walnut', hex: '#4a3628', code: 'PL-WT02' }
      ],
      windows: [
        { id: 'wd3003', name: 'Panel Frame', code: 'CH-WD3003', img: 'assets/window-wd3003.png', layout: 'strip', minCols: 6 },
        { id: 'wd3004', name: 'Diamond Lattice', code: 'CH-WD3004', img: 'assets/window-wd3004.png', layout: 'strip', minCols: 6 },
        { id: 'wd3005', name: 'Arched Column', code: 'CH-WD3005', img: 'assets/window-wd3005.png', layout: 'strip', minCols: 6 },
        { id: 'wd3006', name: 'Curved Panel', code: 'CH-WD3006', img: 'assets/window-wd3006.png', layout: 'strip', minCols: 6 },
        { id: 'wd3007', name: 'Wide Sunburst', code: 'CH-WD3007', img: 'assets/window-wd3007.png', layout: 'strip', minCols: 6 },
        { id: 'wd3008', name: 'Curved Quad Panel', code: 'CH-WD3008', img: 'assets/window-wd3008.png', layout: 'strip', minCols: 6 }
      ]
    },
    glass: {
      id: 'glass', name: 'Glass', heroImg: 'assets/glass-hero.png',
      blurb: 'Full-view aluminum-framed', secondaryLabel: 'Glass Type',
      models: [
        { id: 'sf3500', name: 'SF3500 Series', img: 'assets/model-sf3500.jpg', sub: 'Frame door design' },
        { id: 'sf3520', name: 'SF3520 Series', img: 'assets/model-sf3520.jpg', sub: 'Frameless door design' },
        { id: 'sf3540', name: 'SF3540 Series', img: 'assets/model-sf3540.jpg', sub: 'Glass + foam fusion' }
      ],
      styles: [],
      colors: [
        { id: 'standard-white', name: 'Standard White', hex: '#eceae4', code: 'FRAME' },
        { id: 'chocolate', name: 'Chocolate', hex: '#4a3226', code: 'FRAME' },
        { id: 'bronze', name: 'Bronze', hex: '#8a6a3a', code: 'FRAME' },
        { id: 'black', name: 'Black', hex: '#141414', code: 'FRAME' }
      ],
      windows: [
        { id: 'clear', name: 'Clear Glass', img: 'assets/glasstype-clear.jpg' },
        { id: 'bronze-tint', name: 'Bronze Tinted Glass', img: 'assets/glasstype-bronze.jpg' },
        { id: 'black-glass', name: 'Black Glass', img: 'assets/glasstype-black.jpg' },
        { id: 'reflective-black', name: 'Reflective Black Tempered Glass', img: 'assets/glasstype-reflective-black.jpg' },
        { id: 'frost', name: 'Frost Glass', img: 'assets/glasstype-frost.jpg' },
        { id: 'mirrored', name: 'Mirrored Glass', img: 'assets/glasstype-mirrored.jpg' },
        { id: 'white-glass', name: 'White Glass', img: 'assets/glasstype-white.jpg' }
      ]
    },
    grille: {
      id: 'grille', name: 'Aluminum Grille', heroImg: 'assets/grille-banner.jpg',
      blurb: 'Vertical battens, glass or panel infill', secondaryLabel: 'Windows',
      models: [{ id: '6120', name: '6120 Series', img: 'assets/grille-model-6120.jpg' }],
      styles: [],
      colors: [
        { id: 'cdm-3001', name: 'CDM 3001', hex: '#d9c8a0', code: 'BATTEN' },
        { id: 'cdm-3002', name: 'CDM 3002', hex: '#a97c46', code: 'BATTEN' },
        { id: 'cdm-3003', name: 'CDM 3003', hex: '#c9a877', code: 'BATTEN' },
        { id: 'cdm-3004', name: 'CDM 3004', hex: '#7a3f2a', code: 'BATTEN' },
        { id: 'cdm-3005', name: 'CDM 3005', hex: '#e0d3ae', code: 'BATTEN' },
        { id: 'cdm-3006', name: 'CDM 3006', hex: '#5c3d28', code: 'BATTEN' },
        { id: 'cdm-3007', name: 'CDM 3007', hex: '#c9812f', code: 'BATTEN' },
        { id: 'cdm-3008', name: 'CDM 3008', hex: '#4a4038', code: 'BATTEN' },
        { id: 'cdm-3009', name: 'CDM 3009', hex: '#8a8a72', code: 'BATTEN' },
        { id: 'shining-gold', name: 'Shining Gold', hex: '#b8963f', code: '3010' },
        { id: 'matte-black', name: 'Matte Black', hex: '#141414', code: '3011' },
        { id: 'matte-white', name: 'Matte White', hex: '#eceae4', code: '3012' },
        { id: 'matte-gray', name: 'Matte Gray', hex: '#6b6b6b', code: '3013' },
        { id: 'woven-design', name: 'Woven Design', hex: '#d4d0c5', code: '3015' }
      ],
      windows: []
    }
  };
  const LINE_LIST = Object.values(LINES);

  // A small flat crop of real painted-steel door material (no panel lines in it —
  // just the subtle brushed-grain surface), tiled behind the door. Used only for the
  // Panel line's photorealistic canvas — see drawDoorCanvas().
  const MATERIAL_SWATCH = 'assets/material-swatch.png';
  const MATERIAL_TILE_SIZE = 34; // canvas units per tile repeat

  const defaultState = () => ({
    line: null,
    size: null, customWidth: '', customHeight: '',
    model: null, style: null, color: null, windows: 'none',
    step: 'line'
  });

  let state = defaultState();

  // ---------- persistence ----------
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable — non-fatal */ }
  }
  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function clearSavedState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
  function hasAnySelection(s) {
    return !!(s.line || s.size || s.model || s.style || s.color || (s.windows && s.windows !== 'none'));
  }

  // ---------- line / step machinery ----------
  function currentLine() { return state.line ? LINES[state.line] : null; }
  function lineHasModel(line) { return !!line && line.models.length > 1; }
  function lineHasStyle(line) { return !!line && line.styles.length > 1; }
  function lineHasWindows(line) { return !!line && line.windows.length > 0; }

  // Reset selections that don't carry over between lines (a Flush color id means
  // nothing to Grille) whenever the visitor changes their product line. Lines with
  // exactly one model/style auto-fill it (nothing to actually choose), so those
  // steps get skipped entirely by getSteps() below.
  function onLineChange() {
    const line = currentLine();
    state.model = line && line.models.length === 1 ? line.models[0].id : null;
    state.style = line && line.styles.length === 1 ? line.styles[0].id : null;
    state.color = null;
    state.windows = 'none';
  }

  // The canonical step order never changes; a line just omits whichever of
  // model/style/windows it doesn't have more than one option for.
  function getSteps() {
    const line = currentLine();
    const steps = ['line', 'size'];
    if (lineHasModel(line)) steps.push('model');
    if (lineHasStyle(line)) steps.push('style');
    steps.push('color');
    if (lineHasWindows(line)) steps.push('windows');
    steps.push('review', 'quote');
    return steps;
  }

  function stepLabel(id) {
    if (id === 'windows') {
      const line = currentLine();
      return line ? line.secondaryLabel.toUpperCase() : 'WINDOWS';
    }
    const STATIC = {
      line: 'PRODUCT LINE', size: 'SIZE', model: 'MODEL', style: 'STYLE',
      color: 'COLOR', review: 'REVIEW', quote: 'REQUEST A QUOTE'
    };
    return STATIC[id] || id.toUpperCase();
  }

  // Resolved column count for the current size selection — shared by the canvas
  // renderer, the schematic preview and the Windows-step fit gating.
  function getCols() {
    if (state.size === 'double') return 8;
    if (state.size === 'custom') {
      const w = Number(state.customWidth) || 8;
      return Math.max(3, Math.min(12, Math.round(w / 2)));
    }
    return 4;
  }

  // If the currently-selected window design no longer fits the door (e.g. the
  // visitor went back and shrank the size), drop it instead of leaving a
  // now-invalid, badly-stretched selection silently in place.
  function enforceWindowFit() {
    if (!state.windows || state.windows === 'none') return;
    const w = findWindow(state.windows);
    if (w && w.minCols && w.minCols > getCols()) {
      state.windows = 'none';
      setError('Your selected window needed a wider door for this size, so it was reset to "No Windows".');
    }
  }

  // ---------- lookups ----------
  const findSize = (id) => SIZES.find((s) => s.id === id);
  const findModel = (id) => { const l = currentLine(); return l ? l.models.find((m) => m.id === id) : null; };
  const findStyle = (id) => { const l = currentLine(); return l ? l.styles.find((s) => s.id === id) : null; };
  const findColor = (id) => { const l = currentLine(); return l ? l.colors.find((c) => c.id === id) : null; };
  const findWindow = (id) => { const l = currentLine(); return l ? l.windows.find((w) => w.id === id) : null; };

  function sizeLabel(s) {
    if (!s.size) return '';
    if (s.size === 'custom') {
      const w = s.customWidth || '?';
      const h = s.customHeight || '?';
      return `Custom — ${w}' x ${h}'`;
    }
    const found = findSize(s.size);
    return found ? `${found.label} (${found.dims})` : '';
  }
  function windowLabel(s) {
    const line = currentLine();
    const label = line ? line.secondaryLabel : 'Windows';
    if (!s.windows || s.windows === 'none') return `No ${label.toLowerCase()}`;
    const w = findWindow(s.windows);
    return w ? `${w.name}${w.code ? ` (${w.code})` : ''}` : '';
  }

  // ---------- validation per step ----------
  function stepError(stepId) {
    if (stepId === 'line') return state.line ? null : 'Please choose a product line.';
    if (stepId === 'size') {
      if (!state.size) return 'Please select a door size.';
      if (state.size === 'custom') {
        const w = Number(state.customWidth);
        const h = Number(state.customHeight);
        if (!w || w < 6 || w > 20) return 'Enter a width between 6 and 20 feet.';
        if (!h || h < 6 || h > 12) return 'Enter a height between 6 and 12 feet.';
      }
      return null;
    }
    if (stepId === 'model') return state.model ? null : 'Please select a model.';
    if (stepId === 'style') return state.style ? null : 'Please select a style.';
    if (stepId === 'color') return state.color ? null : 'Please select a color.';
    return null;
  }
  function isStepUnlocked(stepId) {
    const steps = getSteps();
    const idx = steps.indexOf(stepId);
    for (let i = 0; i < idx; i++) {
      const s = steps[i];
      if (s === 'windows' || s === 'review') continue;
      if (stepError(s)) return false;
    }
    return true;
  }

  // ---------- canvas preview (Panel line only — real-photo compositing) ----------
  // Base textures are real, evenly-lit door photos. We tint them with the selected
  // color using a 'multiply' blend (like a photo-editing multiply layer) so the
  // panel shading/grooves in the photo survive the color change, instead of a flat
  // SVG fill that looked schematic rather than like an actual door.
  const imageCache = new Map();
  function preloadImage(src) {
    if (imageCache.has(src)) return imageCache.get(src).promise;
    const img = new Image();
    const entry = { img, loaded: false, promise: null };
    entry.promise = new Promise((resolve) => {
      img.onload = () => { entry.loaded = true; resolve(); };
      img.onerror = () => resolve();
      img.src = src;
    });
    imageCache.set(src, entry);
    return entry.promise;
  }
  function getImg(src) {
    if (!src) return null;
    const entry = imageCache.get(src);
    return entry && entry.loaded ? entry.img : null;
  }
  function preloadAllAssets() {
    const srcs = new Set([MATERIAL_SWATCH]);
    LINES.panel.windows.forEach((w) => srcs.add(w.img));
    return Promise.all([...srcs].map(preloadImage));
  }

  function drawMaterial(ctx, x, y, w, h) {
    const img = getImg(MATERIAL_SWATCH);
    if (!img) return false;
    const pattern = ctx.createPattern(img, 'repeat');
    if (!pattern) return false;
    const scale = MATERIAL_TILE_SIZE / img.naturalWidth;
    const matrix = new DOMMatrix().translate(x, y).scale(scale);
    if (pattern.setTransform) pattern.setTransform(matrix);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = pattern;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return true;
  }

  // object-fit:contain — scales the source into the box without stretching its aspect
  // ratio or cropping into it. Used for window art so a design that's proportioned for
  // an 8-column door doesn't get its panes sliced mid-shape on a narrower/wider one
  // (a hard crop was leaving visibly broken/torn pane borders at the cut edge).
  function drawContained(ctx, img, x, y, w, h, paddingRatio) {
    if (!img) return;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const pad = paddingRatio || 0;
    const boxW = w * (1 - pad * 2), boxH = h * (1 - pad * 2);
    const scale = Math.min(boxW / iw, boxH / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Photo texture alone doesn't guarantee the panel geometry reads correctly at
  // every crop/stretch ratio, so this draws the real, accurate pattern (box panels /
  // crossbuck lines / ranch grooves) as an embossed double-stroke (a light line and a
  // dark line, each offset by ~1px) on top of the tinted photo — a groove reads as
  // carved in regardless of what the underlying photo happened to show at this size.
  function strokeEmbossed(ctx, drawPath, lightColor, darkColor, lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = darkColor;
    ctx.save(); ctx.translate(0.6, 0.6); drawPath(); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = lightColor;
    ctx.save(); ctx.translate(-0.6, -0.6); drawPath(); ctx.stroke(); ctx.restore();
  }

  function relativeLuminance(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  // Low-alpha 'overlay' fill that reads as a raised/rounded-over bevel catching light
  // on one side and shadow on the other — used to give flat vector shapes (panel
  // insets, ranch bands) the same sense of molded depth as the door photos they used
  // to rely on.
  function fillBevel(ctx, x, y, w, h, isLight, vertical) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const grad = vertical ? ctx.createLinearGradient(0, y, 0, y + h) : ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, isLight ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.1)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // Row 0 becomes taller/shorter than the rest whenever a 'strip' window graphic is
  // showing (its own aspect ratio decides the height it needs) — every other row
  // stays at the nominal cellH. This is the single source of truth for row tops so
  // the material, pattern lines and window art all agree on where each row sits.
  function rowTop(r, pad, windowRowH, cellH, gap) {
    if (r <= 0) return pad;
    return pad + windowRowH + gap + (r - 1) * (cellH + gap);
  }

  function drawPatternOverlay(ctx, pattern, colorHex, cols, rows, cellW, cellH, gap, pad, skipRow0, windowRowH) {
    const isLight = relativeLuminance(colorHex || '#8a8a86') > 0.45;
    const dark = isLight ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.22)';
    const light = isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.14)';
    const totalW = cols * cellW + (cols - 1) * gap;
    const totalH = windowRowH + (rows - 1) * cellH + (rows - 1) * gap;
    const rowY = (r) => rowTop(r, pad, windowRowH, cellH, gap);

    if (pattern === 'cassette') {
      // Full-width reveal seams between rows, like a real cassette door's continuous
      // horizontal joints, plus a raised bevel rectangle inset within each panel.
      for (let r = 1; r < rows; r++) {
        const y = rowY(r) - gap / 2;
        strokeEmbossed(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(pad + 3, y);
          ctx.lineTo(pad + totalW - 3, y);
        }, light, dark, 1.25);
      }
      const inset = 8;
      for (let r = 0; r < rows; r++) {
        if (skipRow0 && r === 0) continue;
        const rh0 = r === 0 ? windowRowH : cellH;
        for (let c = 0; c < cols; c++) {
          const x = pad + c * (cellW + gap), y = rowY(r);
          const rx = x + inset, ry = y + inset, rw = cellW - inset * 2, rh = rh0 - inset * 2;
          fillBevel(ctx, rx, ry, rw, rh, isLight, false);
          strokeEmbossed(ctx, () => { ctx.beginPath(); ctx.rect(rx, ry, rw, rh); }, light, dark, 1.25);
        }
      }
    } else if (pattern === 'raised-ranch') {
      for (let r = 0; r < rows; r++) {
        if (skipRow0 && r === 0) continue;
        const rh0 = r === 0 ? windowRowH : cellH;
        fillBevel(ctx, pad, rowY(r), totalW, rh0, isLight, true);
      }
      for (let r = 1; r < rows; r++) {
        const y = rowY(r) - gap / 2;
        strokeEmbossed(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(pad + 4, y);
          ctx.lineTo(pad + totalW - 4, y);
        }, light, dark, 1.25);
      }
    } else if (pattern === 'carriage-long' || pattern === 'carriage-short') {
      const n = pattern === 'carriage-long' ? 6 : 3;
      for (let i = 1; i < n; i++) {
        const x = pad + (totalW / n) * i;
        strokeEmbossed(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(x, pad + 4);
          ctx.lineTo(x, pad + totalH - 4);
        }, light, dark, 1.25);
      }
      // a top and bottom rail ties the verticals together into a believable frame
      [pad + 3, pad + totalH - 3].forEach((y) => {
        strokeEmbossed(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(pad + 4, y);
          ctx.lineTo(pad + totalW - 4, y);
        }, light, dark, 1.25);
      });
      // diagonal crossbuck brace per door leaf — the defining carriage-house look;
      // Long uses one brace per (narrower) leaf, Short's leaves are wider so its
      // braces sit at a shallower angle, another visual cue the two aren't the same.
      const leaves = Math.max(1, Math.round(cols / 4));
      const leafW = totalW / leaves;
      for (let i = 0; i < leaves; i++) {
        const lx = pad + i * leafW;
        strokeEmbossed(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(lx + 7, pad + totalH - 6);
          ctx.lineTo(lx + leafW - 7, pad + 6);
        }, light, dark, 1.25);
      }
    }
  }

  // Flat multiply-tint alone reads as a solid color swatch. A soft top-light/
  // bottom-shadow gradient, a gentle vignette, and a faint diagonal sheen give the
  // same photo a sense of depth and studio lighting without needing new photos.
  function drawLightingEffect(ctx, x, y, w, h) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, 'rgba(255,255,255,0.16)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.15, x + w / 2, y + h / 2, Math.max(w, h) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = vg;
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const sheen = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.45, 'rgba(255,255,255,0.08)');
    sheen.addColorStop(0.55, 'rgba(255,255,255,0.08)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  const PREVIEW_SCALE = 3; // internal render resolution multiplier for crisp output

  function drawDoorCanvas(canvas) {
    const cols = getCols();
    const rows = 4;
    const color = findColor(state.color);
    const fill = color ? color.hex : '#8a8a86';
    const style = findStyle(state.style);
    const hasWindow = state.windows && state.windows !== 'none';
    const windowDef = hasWindow ? findWindow(state.windows) : null;
    const windowImg = windowDef ? getImg(windowDef.img) : null;

    const cellW = 60, cellH = 46, gap = 3, pad = 22;
    const totalW = cols * cellW + (cols - 1) * gap;

    // 'strip' window art varies wildly in native aspect ratio (2.9:1 to 8.8:1) —
    // sizing the row from that aspect either made low-aspect (fan/sunburst) designs
    // blow up to a disproportionately tall row, or, capped, left empty margins on
    // the sides. A fixed, modest row height (a bit taller than a normal panel row,
    // for breathing room) sidesteps both: rendering always fills it exactly below.
    const windowRowH = hasWindow && windowDef.layout === 'strip' ? cellH * 1.3 : cellH;

    const totalH = windowRowH + (rows - 1) * cellH + (rows - 1) * gap;
    const vw = totalW + pad * 2;
    const vh = totalH + pad * 2;

    canvas.width = vw * PREVIEW_SCALE;
    canvas.height = vh * PREVIEW_SCALE;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(PREVIEW_SCALE, 0, 0, PREVIEW_SCALE, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    ctx.fillStyle = '#EDEDEA';
    ctx.fillRect(0, 0, vw, vh);

    const drewMaterial = drawMaterial(ctx, pad, pad, totalW, totalH);
    if (!drewMaterial) {
      ctx.fillStyle = '#d8d8d4';
      ctx.fillRect(pad, pad, totalW, totalH);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = fill;
    ctx.fillRect(pad, pad, totalW, totalH);
    ctx.restore();

    if (style) {
      drawPatternOverlay(ctx, style.pattern, fill, cols, rows, cellW, cellH, gap, pad, hasWindow, windowRowH);
    }

    if (hasWindow) {
      const rowY = pad, rowW = totalW, rowH = windowRowH;

      if (windowDef.layout === 'strip') {
        // Stretch the *whole* source image (never a cropped slice of it) to exactly
        // fill the row — guarantees no empty margins and, since nothing is cropped,
        // no pane can ever get sliced/torn at a crop edge. The trade-off is a mild,
        // uniform aspect squish on designs far from the row's own proportions, which
        // reads far better than either a gap or a cut-off pane.
        if (windowImg) ctx.drawImage(windowImg, 0, 0, windowImg.naturalWidth, windowImg.naturalHeight, pad, rowY, rowW, rowH);
      } else {
        for (let c = 0; c < cols; c++) {
          const cx = pad + c * (cellW + gap);
          ctx.fillStyle = '#cfd8dc';
          ctx.fillRect(cx, rowY, cellW, rowH);
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 0.5, rowY + 0.5, cellW - 1, rowH - 1);
          if (windowImg) drawContained(ctx, windowImg, cx, rowY, cellW, rowH, 0.12);
        }
      }
    }

    drawLightingEffect(ctx, pad, pad, totalW, totalH);

    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, vw - 2, vh - 2);
  }

  // ---------- schematic preview (Flush / Overlay / Glass / Grille) ----------
  // These 4 lines don't get the Panel's photo-compositing treatment — a flat color
  // box sized to the chosen door, plus a small badge for the windows/glass-type
  // selection, is honest about what it is (like CHI's own tool, which stays a plain
  // schematic block right up until it has a full, real render to show).
  function renderSchematicPreview(el) {
    const line = currentLine();
    const color = findColor(state.color);

    // Before a color is picked there's nothing real to show yet — an empty grey box
    // reads as broken. Show the line's own hero photo instead so the preview panel
    // always displays something meaningful, then switch to the flat-color door once
    // there's an actual color to render.
    if (!color) {
      el.innerHTML = `
        <div class="schematic-hero">
          <img src="${line.heroImg}" alt="${escapeHtml(line.name)}">
          <div class="schematic-hero-label">${escapeHtml(line.name)}</div>
        </div>`;
      return;
    }

    const cols = getCols();
    const rows = 4;
    const fill = color.hex;
    const cellW = 60, cellH = 46, gap = 3, pad = 18;
    const totalW = cols * cellW + (cols - 1) * gap;
    const totalH = rows * cellH + (rows - 1) * gap;

    let lines = '';
    for (let c = 1; c < cols; c++) {
      lines += `<div class="schematic-vline" style="left:${(c * (cellW + gap) - gap / 2) / totalW * 100}%"></div>`;
    }
    for (let r = 1; r < rows; r++) {
      lines += `<div class="schematic-hline" style="top:${(r * (cellH + gap) - gap / 2) / totalH * 100}%"></div>`;
    }

    const hasWindow = state.windows && state.windows !== 'none';
    const w = hasWindow ? findWindow(state.windows) : null;
    const badge = w ? `<div class="schematic-window-badge"><img src="${w.img}" alt="${escapeHtml(w.name)}"><span>${escapeHtml(w.name)}</span></div>` : '';

    el.innerHTML = `
      <div class="schematic-door-wrap" style="width:${Math.min(100, 40 + cols * 6)}%;aspect-ratio:${totalW + pad * 2} / ${totalH + pad * 2};">
        <div class="schematic-door" style="background:${fill};padding:${pad}px;">
          <div class="schematic-door-face">${lines}</div>
        </div>
        ${badge}
      </div>`;
  }

  function renderPreview() {
    const el = document.getElementById('builder-preview');
    if (!el) return;

    if (state.line === 'panel') {
      let canvas = el.querySelector('canvas.door-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'door-canvas';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Live door preview');
        el.innerHTML = '';
        el.appendChild(canvas);
      }
      drawDoorCanvas(canvas);
    } else if (state.line) {
      renderSchematicPreview(el);
    } else {
      el.innerHTML = '<div class="schematic-placeholder">Choose a product line to start</div>';
    }

    const chips = document.getElementById('builder-summary-chips');
    if (!chips) return;
    const line = currentLine();
    const items = [
      line ? line.name : null,
      state.size ? sizeLabel(state) : null,
      state.model && lineHasModel(line) ? findModel(state.model).name : null,
      state.style && lineHasStyle(line) ? findStyle(state.style).name : null,
      state.color ? findColor(state.color).name : null,
      state.windows && state.windows !== 'none' ? windowLabel(state) : null
    ].filter(Boolean);
    chips.innerHTML = items.length
      ? items.map((t) => `<span class="builder-chip">${escapeHtml(t)}</span>`).join('')
      : '<span class="builder-chip builder-chip-muted">Your selections will appear here</span>';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // ---------- progress bar ----------
  function renderProgress() {
    const el = document.getElementById('builder-progress');
    if (!el) return;
    const steps = getSteps();
    const currentIdx = steps.indexOf(state.step);
    el.innerHTML = steps.map((id, idx) => {
      const done = idx < currentIdx && !stepError(id);
      const current = id === state.step;
      const locked = !isStepUnlocked(id) && idx > currentIdx;
      const cls = ['builder-progress-seg'];
      if (done) cls.push('is-done');
      if (current) cls.push('is-current');
      if (locked) cls.push('is-locked');
      return `<button type="button" class="${cls.join(' ')}" data-goto="${id}" ${locked ? 'disabled' : ''}>
        <span class="n">${idx + 1}</span><span class="t">${stepLabel(id)}</span>
      </button>`;
    }).join('');
  }

  // ---------- option grid renderers ----------
  const NO_WINDOW_ICON = `<svg viewBox="0 0 60 46" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;">
    <rect x="1" y="1" width="58" height="44" fill="none" stroke="#5C5A55" stroke-width="1.5"/>
    <line x1="8" y1="8" x2="52" y2="38" stroke="#5C5A55" stroke-width="2"/>
    <line x1="52" y1="8" x2="8" y2="38" stroke="#5C5A55" stroke-width="2"/>
  </svg>`;

  function optionCard({ selected, imgSrc, iconSvg, title, sub, onSwatch, disabled }) {
    const swatch = onSwatch ? `<div class="builder-swatch" style="background:${onSwatch}"></div>` : '';
    let frame = '';
    if (iconSvg) frame = `<div class="style-icon-frame">${iconSvg}</div>`;
    else if (imgSrc) frame = `<div class="style-icon-frame"><img src="${imgSrc}" alt="${escapeHtml(title)}"></div>`;
    return `<div class="style-icon-card builder-option${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}">
      ${swatch}${frame}
      <div class="style-icon-name">${escapeHtml(title)}${sub ? `<span class="code">${escapeHtml(sub)}</span>` : ''}</div>
    </div>`;
  }

  function renderLineStep() {
    const grid = document.getElementById('line-options');
    if (!grid) return;
    grid.innerHTML = LINE_LIST.map((l) => `
      <button type="button" class="builder-pick" data-pick="line" data-value="${l.id}">
        ${optionCard({ selected: state.line === l.id, imgSrc: l.heroImg, title: l.name, sub: l.blurb })}
      </button>`).join('');
  }

  function renderSizeStep() {
    const grid = document.getElementById('size-options');
    grid.innerHTML = SIZES.map((s) => `
      <button type="button" class="builder-pick" data-pick="size" data-value="${s.id}">
        ${optionCard({ selected: state.size === s.id, title: s.label, sub: s.dims })}
      </button>`).join('');

    const customBox = document.getElementById('size-custom-fields');
    customBox.hidden = state.size !== 'custom';
    document.getElementById('custom-width').value = state.customWidth || '';
    document.getElementById('custom-height').value = state.customHeight || '';
  }

  function renderModelStep() {
    const grid = document.getElementById('model-options');
    const line = currentLine();
    const models = line ? line.models : [];
    grid.innerHTML = models.map((m) => `
      <button type="button" class="builder-pick" data-pick="model" data-value="${m.id}">
        ${optionCard({ selected: state.model === m.id, imgSrc: m.img, title: m.name, sub: m.sub })}
      </button>`).join('');
  }

  function renderStyleStep() {
    const grid = document.getElementById('style-options');
    const line = currentLine();
    const styles = line ? line.styles : [];
    let html = '';
    let lastGroup;
    styles.forEach((s) => {
      if (s.group && s.group !== lastGroup) {
        html += `<div class="style-group-head">${escapeHtml(s.group)}</div>`;
        lastGroup = s.group;
      }
      html += `<button type="button" class="builder-pick" data-pick="style" data-value="${s.id}">
        ${optionCard({ selected: state.style === s.id, imgSrc: s.img, title: s.name })}
      </button>`;
    });
    grid.innerHTML = html;
  }

  function renderColorStep() {
    const grid = document.getElementById('color-options');
    const line = currentLine();
    const colors = line ? line.colors : [];
    grid.innerHTML = colors.map((c) => `
      <button type="button" class="builder-pick" data-pick="color" data-value="${c.id}">
        ${optionCard({ selected: state.color === c.id, title: c.name, sub: c.code, onSwatch: c.hex })}
      </button>`).join('');
  }

  function renderWindowsStep() {
    const grid = document.getElementById('window-options');
    const line = currentLine();
    const items = line ? line.windows : [];
    const cols = getCols();
    const noneCard = `<button type="button" class="builder-pick" data-pick="windows" data-value="none">
      ${optionCard({ selected: state.windows === 'none', iconSvg: NO_WINDOW_ICON, title: `No ${line ? line.secondaryLabel : 'Windows'}` })}
    </button>`;
    const cards = items.map((w) => {
      const fits = !w.minCols || w.minCols <= cols;
      return `
      <button type="button" class="builder-pick" data-pick="windows" data-value="${w.id}" ${fits ? '' : 'disabled'}>
        ${optionCard({ selected: state.windows === w.id, imgSrc: w.img, title: w.name, sub: fits ? w.code : 'Needs a wider door', disabled: !fits })}
      </button>`;
    }).join('');
    grid.innerHTML = noneCard + cards;
  }

  function renderReviewStep() {
    const el = document.getElementById('review-summary');
    const line = currentLine();
    const model = findModel(state.model);
    const style = findStyle(state.style);
    const color = findColor(state.color);
    const rows = [
      ['Product Line', line ? line.name : '—'],
      ['Size', sizeLabel(state)]
    ];
    if (lineHasModel(line)) rows.push(['Model', model ? `${model.name}${model.sub ? ` — ${model.sub}` : ''}` : '—']);
    if (lineHasStyle(line)) rows.push(['Style', style ? style.name : '—']);
    rows.push(['Color', color ? `${color.name}${color.code ? ` (${color.code})` : ''}` : '—']);
    if (lineHasWindows(line)) rows.push([line.secondaryLabel, windowLabel(state)]);
    el.innerHTML = rows.map(([k, v]) => `
      <div class="grille-detail-rows"><div class="row"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v || '—')}</span></div></div>
    `).join('');
  }

  // ---------- step visibility ----------
  let hasRenderedOnce = false;

  // Step section headings are dynamic now that the number/order of visible steps
  // depends on the chosen line (e.g. Grille never shows Model/Style/Windows at all).
  function updateStepHeadings() {
    const steps = getSteps();
    const line = currentLine();
    steps.forEach((id, idx) => {
      const section = document.querySelector(`.builder-step[data-step="${id}"]`);
      if (!section) return;
      const kicker = section.querySelector('.spec-kicker');
      const title = section.querySelector('.spec-title');
      const num = String(idx + 1).padStart(2, '0');
      if (kicker) kicker.textContent = `${num} / ${stepLabel(id)}`;
      if (id === 'windows' && line) {
        if (title) title.textContent = line.secondaryLabel === 'Windows' ? 'Choose a window option' : `Choose a ${line.secondaryLabel}`;
        const note = section.querySelector('.window-note');
        if (note) note.textContent = `Optional — pick the ${line.secondaryLabel.toLowerCase()} for this door.`;
      }
    });
  }

  // persist=false is used for the very first paint when a resumable draft exists in
  // localStorage — we must not touch storage until the visitor actually chooses
  // "Resume" or "Discard", otherwise this initial render would silently overwrite
  // (and destroy) their saved progress before they ever see the resume banner.
  function showStep(stepId, { persist = true } = {}) {
    const steps = getSteps();
    if (!isStepUnlocked(stepId)) stepId = steps.find((s) => isStepUnlocked(s) && stepError(s)) || 'line';
    state.step = stepId;
    document.querySelectorAll('.builder-step').forEach((el) => {
      el.hidden = el.dataset.step !== stepId;
    });
    setError(null);
    if (stepId === 'line') renderLineStep();
    if (stepId === 'size') renderSizeStep();
    if (stepId === 'model') renderModelStep();
    if (stepId === 'style') renderStyleStep();
    if (stepId === 'color') renderColorStep();
    if (stepId === 'windows') renderWindowsStep();
    if (stepId === 'review') renderReviewStep();
    updateStepHeadings();
    renderProgress();
    renderPreview();
    if (persist) saveState();
    if (hasRenderedOnce) {
      window.scrollTo({ top: document.getElementById('builder-progress').offsetTop - 90, behavior: 'smooth' });
    }
    hasRenderedOnce = true;
  }

  function setError(msg) {
    const el = document.getElementById('builder-error');
    if (!el) return;
    if (msg) { el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function goNext() {
    const err = stepError(state.step);
    if (err) { setError(err); return; }
    const steps = getSteps();
    const idx = steps.indexOf(state.step);
    if (idx < steps.length - 1) showStep(steps[idx + 1]);
  }
  function goBack() {
    const steps = getSteps();
    const idx = steps.indexOf(state.step);
    if (idx > 0) showStep(steps[idx - 1]);
  }

  // ---------- quote form ----------
  const FIELD_IDS = ['q-quantity', 'q-name', 'q-phone', 'q-email', 'q-address', 'q-city', 'q-state', 'q-country', 'q-postal'];

  function clearFieldErrors() {
    FIELD_IDS.forEach((id) => {
      const el = document.getElementById(`fe-${id}`);
      if (el) el.textContent = '';
    });
  }

  function validateQuoteForm(data) {
    const errors = {};
    if (!data.name.trim()) errors['q-name'] = 'Full name is required.';
    if (!data.phone.trim()) errors['q-phone'] = 'Phone number is required.';
    else if (!/^[\d+()\-.\s]{7,}$/.test(data.phone.trim())) errors['q-phone'] = 'Enter a valid phone number.';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors['q-email'] = 'Enter a valid email address.';
    const qty = Number.parseInt(data.quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) errors['q-quantity'] = 'Quantity must be at least 1.';
    return errors;
  }

  async function submitQuote(e) {
    e.preventDefault();
    clearFieldErrors();
    setSubmitError(null);

    const data = {
      quantity: document.getElementById('q-quantity').value,
      name: document.getElementById('q-name').value,
      phone: document.getElementById('q-phone').value,
      email: document.getElementById('q-email').value,
      address: document.getElementById('q-address').value,
      city: document.getElementById('q-city').value,
      state: document.getElementById('q-state').value,
      country: document.getElementById('q-country').value,
      postalCode: document.getElementById('q-postal').value
    };

    const errors = validateQuoteForm(data);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([id, msg]) => {
        const el = document.getElementById(`fe-${id}`);
        if (el) el.textContent = msg;
      });
      return;
    }

    const line = currentLine();
    const model = findModel(state.model);
    const style = findStyle(state.style);
    const color = findColor(state.color);
    const config = {
      lineLabel: line ? line.name : '',
      secondaryLabel: line ? line.secondaryLabel : 'Windows',
      sizeLabel: sizeLabel(state),
      modelLabel: lineHasModel(line) && model ? `${model.name}${model.sub ? ` (${model.sub})` : ''}` : '',
      styleLabel: lineHasStyle(line) && style ? style.name : '',
      colorLabel: color ? `${color.name}${color.code ? ` (${color.code})` : ''}` : '',
      windowLabel: lineHasWindows(line) ? windowLabel(state) : ''
    };

    const submitBtn = document.getElementById('quote-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING…';

    try {
      const res = await fetch('/api/builder/quote', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, contact: data })
      });
      const result = await res.json();
      if (!res.ok) {
        setSubmitError(result.error || 'Something went wrong. Please try again.');
        return;
      }
      showSuccess(result);
      clearSavedState();
    } catch {
      setSubmitError('Could not reach the server. Is it running?');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SUBMIT REQUEST';
    }
  }

  function setSubmitError(msg) {
    const el = document.getElementById('quote-submit-error');
    if (!el) return;
    if (msg) { el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function showSuccess(result) {
    document.querySelectorAll('.builder-step').forEach((el) => { el.hidden = true; });
    const successEl = document.getElementById('builder-success');
    successEl.hidden = false;
    document.getElementById('builder-progress').style.display = 'none';
    document.getElementById('builder-preview-wrap').style.display = 'none';
    document.querySelector('.builder-grid').classList.add('is-success');
    const dl = document.getElementById('success-download');
    dl.href = result.pdfUrl;
    document.getElementById('success-ref').textContent = result.publicId;
  }

  function startOver() {
    state = defaultState();
    clearSavedState();
    document.getElementById('builder-success').hidden = true;
    document.getElementById('builder-progress').style.display = '';
    document.getElementById('builder-preview-wrap').style.display = '';
    document.querySelector('.builder-grid').classList.remove('is-success');
    document.getElementById('builder-quote-form').reset();
    clearFieldErrors();
    setSubmitError(null);
    showStep('line');
  }

  // ---------- wiring ----------
  function attachEvents() {
    document.body.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-pick]');
      if (pick) {
        const field = pick.dataset.pick;
        const value = pick.dataset.value;
        state[field] = value;
        setError(null);
        if (field === 'line') onLineChange();
        if (field === 'size') enforceWindowFit();
        saveState();
        renderPreview();
        renderProgress();
        if (field === 'line') renderLineStep();
        if (field === 'size') renderSizeStep();
        if (field === 'model') renderModelStep();
        if (field === 'style') renderStyleStep();
        if (field === 'color') renderColorStep();
        if (field === 'windows') renderWindowsStep();
        return;
      }
      const goto = e.target.closest('[data-goto]');
      if (goto && !goto.disabled) { showStep(goto.dataset.goto); return; }

      if (e.target.closest('[data-next]')) { goNext(); return; }
      if (e.target.closest('[data-back]')) { goBack(); return; }
      if (e.target.closest('[data-start-over]')) {
        if (confirm('Start over? This clears your current design.')) startOver();
        return;
      }
      if (e.target.closest('[data-resume]')) {
        const saved = loadSavedState();
        if (saved) state = Object.assign(defaultState(), saved);
        enforceWindowFit();
        document.getElementById('resume-banner').hidden = true;
        showStep(state.step && getSteps().includes(state.step) ? state.step : 'line');
        return;
      }
      if (e.target.closest('[data-discard-resume]')) {
        clearSavedState();
        document.getElementById('resume-banner').hidden = true;
        return;
      }
    });

    document.getElementById('custom-width').addEventListener('input', (e) => {
      state.customWidth = e.target.value;
      enforceWindowFit();
      saveState();
      renderPreview();
      renderProgress();
    });
    document.getElementById('custom-height').addEventListener('input', (e) => {
      state.customHeight = e.target.value;
      saveState();
      renderPreview();
      renderProgress();
    });

    document.getElementById('builder-quote-form').addEventListener('submit', submitQuote);
  }

  function init() {
    attachEvents();
    const saved = loadSavedState();
    const hasDraft = saved && hasAnySelection(saved);
    if (hasDraft) {
      document.getElementById('resume-banner').hidden = false;
      // While a draft is waiting on the resume banner, render without touching
      // storage — the visitor's choice (Resume / Discard) is what should decide
      // whether that saved data lives or dies, not this initial paint.
      showStep('line', { persist: false });
    } else {
      // ?line=flush (etc.) lets a product page's own "Build a Door" CTA drop the
      // visitor straight into that line instead of the line-picker step.
      const params = new URLSearchParams(location.search);
      const qLine = params.get('line');
      if (qLine && LINES[qLine]) {
        state.line = qLine;
        onLineChange();
        showStep('size');
      } else {
        showStep('line');
      }
    }
    // First paint uses placeholder fills; re-render once real photos are in cache.
    preloadAllAssets().then(renderPreview);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
