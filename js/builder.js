// Door Builder — Insulated Panel.
// Vanilla JS, no build step, matches conventions in js/auth.js (fetch pattern, .auth-error, etc.)

(function () {
  'use strict';

  const STORAGE_KEY = 'doorBuilderState';

  // Size is a flat top-level list (single/double/custom width) rather than living
  // inside the line config, in case a second product line is ever reintroduced.
  const SIZES = [
    { id: 'single', label: 'Single Door', dims: "8' wide x 7' tall", cols: 4 },
    { id: 'double', label: 'Double Door', dims: "16' wide x 7' tall", cols: 8 },
    { id: 'custom', label: 'Custom Size', dims: 'Enter your own dimensions', cols: null }
  ];

  // Color palettes are keyed by which Door Style (line) was picked in the Model
  // step — each product line has its own real catalog colors (the catalog PDF
  // gives each line a distinct "COLOR"/"COLORS" page). Reuses the exact hex values
  // already chosen for these swatches on that line's own product page
  // (product-flush.html, product-overlay.html, product-grille.html,
  // product-glass.html) so the builder and the product pages agree.
  const COLOR_PALETTES = {
    traditional: [
      { id: 'black', name: 'Black', hex: '#1a1a1a', code: 'RAL 9005' },
      { id: 'white', name: 'White', hex: '#f2f2ee', code: 'RAL 9016' },
      { id: 'almond', name: 'Almond', hex: '#cfc9b8', code: 'RAL 9005' }
    ],
    'modern-flush': [
      { id: 'dark-oak', name: 'Dark Oak', hex: '#4a2e1a', code: 'WOODGRAIN' },
      { id: 'light-oak', name: 'Light Oak', hex: '#b8875a', code: 'WOODGRAIN' },
      { id: 'red-oak', name: 'Red Oak', hex: '#9c4f2e', code: 'WOODGRAIN' },
      { id: 'carbon-oak', name: 'Carbon Oak', hex: '#c99a4a', code: 'WOODGRAIN' },
      { id: 'dark-walnut', name: 'Dark Walnut', hex: '#7d8791', code: 'WOODGRAIN' },
      { id: 'black-walnut', name: 'Black Walnut', hex: '#6e2f1f', code: 'WOODGRAIN' },
      { id: 'black', name: 'Black', hex: '#1a1a1a', code: 'SOLID' },
      { id: 'white', name: 'White', hex: '#eceae4', code: 'SOLID' }
    ],
    overlay: [
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
    glass: [
      { id: 'standard-white', name: 'Standard White', hex: '#eceae4', code: 'FRAME' },
      { id: 'chocolate', name: 'Chocolate', hex: '#3a2a20', code: 'FRAME' },
      { id: 'bronze', name: 'Bronze', hex: '#8a5a2e', code: 'FRAME' },
      { id: 'black', name: 'Black', hex: '#1a1a1a', code: 'FRAME' }
    ],
    'aluminum-grille': [
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
    ]
  };
  function currentColors() { return COLOR_PALETTES[state.model] || COLOR_PALETTES.traditional; }

  // Only one product line for now — the wizard has no "choose a product line" step,
  // it goes straight to Size. Kept as a keyed LINES object (rather than a bare
  // constant) so the step machinery below (currentLine/lineHasModel/etc.) doesn't
  // need to change if a second line comes back later.
  const LINES = {
    panel: {
      id: 'panel', name: 'Insulated Panel', heroImg: 'assets/style-icon-cassette.png',
      blurb: 'Classic panel doors, 4 styles', secondaryLabel: 'Windows',
      // The Model step shows the 6 marketing product lines (same photos as
      // products.html), not literal Insulated Panel models — it's informational
      // ("which door look are you after"). The 3D/PDF/review pipeline below this
      // step still only ever configures an Insulated Panel door regardless of
      // which is picked here.
      models: [
        { id: 'traditional', name: 'Traditional Insulated Panel Doors', img: 'assets/traditional-door.png' },
        { id: 'modern-flush', name: 'Modern Flush Doors', img: 'assets/modern-flush-door.png' },
        { id: 'overlay', name: 'Overlay Doors', img: 'assets/overlay-door.png' },
        { id: 'glass', name: 'Glass Garage Doors', img: 'assets/glass-garage-door.png' },
        { id: 'aluminum-grille', name: 'Aluminum Grille Doors', img: 'assets/aluminum-grille-door.png' },
        { id: 'non-insulated', name: 'Non-Insulated Panel Doors', img: 'assets/non-insulated-garage-door.png' }
      ],
      styles: [
        { id: 'cassette', name: 'Classic Cassette', pattern: 'cassette', img: 'assets/style-icon-cassette.png' },
        { id: 'carriage-short', name: 'Carriage Short', pattern: 'carriage-short', img: 'assets/style-icon-carriage-short.png' },
        { id: 'raised-ranch', name: 'Raised Ranch', pattern: 'raised-ranch', img: 'assets/style-icon-raised-ranch.png' },
        { id: 'carriage-long', name: 'Carriage Long', pattern: 'carriage-long', img: 'assets/style-icon-carriage-long.png' }
      ],
      // layout 'unit' = one self-contained window icon, tiled per column (contain-fit).
      // layout 'strip' = source image already spans a full double-door row (two window
      // groups + center-post gap baked in) — stretched once across the whole row,
      // whatever the row's actual width ends up being for the chosen door size.
      windows: [
        { id: 'wd1001', name: 'European Style Frame', code: 'CH-WD1001', img: 'assets/window-wd1001-european.png', layout: 'unit' },
        { id: 'wd1002', name: 'Square Cross', code: 'CH-WD1002', img: 'assets/window-wd1002-square-cross.png', layout: 'unit' },
        { id: 'wd1003', name: 'Cross Window', code: 'CH-WD1003', img: 'assets/window-wd1003-cross.png', layout: 'unit' },
        { id: 'wd1004', name: 'Diamond Window', code: 'CH-WD1004', img: 'assets/window-wd1004-diamond.png', layout: 'unit' },
        { id: 'wd1005', name: 'House-Like', code: 'CH-WD1005', img: 'assets/window-wd1005-house.png', layout: 'unit' },
        { id: 'wd1006', name: 'Mountain-Like', code: 'CH-WD1006', img: 'assets/window-wd1006-mountain.png', layout: 'unit' },
        { id: 'wd4001', name: 'Sector Window A', code: 'CH-WD4001', img: 'assets/window-4001-sector-a.png', layout: 'strip' },
        { id: 'wd4003', name: 'Sector Window B', code: 'CH-WD4003', img: 'assets/window-4003-sector-b.png', layout: 'strip' },
        { id: 'wd4002', name: 'Sun Rising', code: 'CH-WD4002', img: 'assets/window-4002-sun-rising.png', layout: 'strip' },
        { id: 'wd4004', name: 'Radiation Window', code: 'CH-WD4004', img: 'assets/window-4004-radiation.png', layout: 'strip' },
        { id: 'wd3003', name: 'Panel Frame', code: 'CH-WD3003', img: 'assets/window-wd3003.png', layout: 'strip' },
        { id: 'wd3004', name: 'Diamond Lattice', code: 'CH-WD3004', img: 'assets/window-wd3004.png', layout: 'strip' },
        { id: 'wd3005', name: 'Arched Column', code: 'CH-WD3005', img: 'assets/window-wd3005.png', layout: 'strip' },
        { id: 'wd3006', name: 'Curved Panel', code: 'CH-WD3006', img: 'assets/window-wd3006.png', layout: 'strip' },
        { id: 'wd3007', name: 'Wide Sunburst', code: 'CH-WD3007', img: 'assets/window-wd3007.png', layout: 'strip' },
        { id: 'wd3008', name: 'Curved Quad Panel', code: 'CH-WD3008', img: 'assets/window-wd3008.png', layout: 'strip' }
      ]
    }
  };

  const WINDOW_ROWS = [
    { id: 'top', name: 'Top Row' },
    { id: 'center', name: 'Center Row' }
  ];

  const defaultState = () => ({
    line: 'panel',
    size: null, customWidth: '', customHeight: '',
    model: null, style: null, color: null, windows: 'none', windowRow: 'top',
    step: 'size'
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
    return !!(s.size || s.model || s.style || s.color || (s.windows && s.windows !== 'none'));
  }

  // ---------- line / step machinery ----------
  // There's only ever one line (Panel) right now, so this always resolves to it —
  // kept as a function (rather than inlining LINES.panel everywhere) so the rest of
  // the step machinery doesn't care whether there's 1 line or several.
  function currentLine() { return LINES[state.line] || LINES.panel; }
  function lineHasModel(line) { return !!line && line.models.length > 1; }
  // The 4 sub-styles (Cassette/Carriage Short/Raised Ranch/Carriage Long) are
  // specific to the Traditional Insulated Panel door — the other 4 Door Style
  // picks (Modern Flush/Overlay/Glass/Aluminum Grille) skip this step entirely.
  function lineHasStyle(line) { return !!line && line.styles.length > 1 && state.model === 'traditional'; }
  function lineHasWindows(line) { return !!line && line.windows.length > 0; }
  // Carriage Short/Long draw one continuous crossbuck spanning the whole door body —
  // there's no natural "row" to relocate a window into — so the Top/Center choice
  // only applies to Classic Cassette and Raised Ranch.
  function styleAllowsWindowRow(styleId) { return styleId === 'cassette' || styleId === 'raised-ranch'; }

  // Step order: Size, then Model (Door Style) before Style, then Color/Windows/Review/Quote.
  // No "choose a product line" step — there's only one line, so nothing to choose.
  function getSteps() {
    const line = currentLine();
    const steps = ['size'];
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
      size: 'SIZE', model: 'DOOR STYLE', style: 'STYLE',
      color: 'COLOR', review: 'REVIEW', quote: 'REQUEST A QUOTE'
    };
    return STATIC[id] || id.toUpperCase();
  }

  // Resolved column count for the current size selection — shared by the 3D/
  // schematic renderers and the Windows-step fit gating.
  function getCols() {
    if (state.size === 'double') return 8;
    if (state.size === 'custom') {
      const w = Number(state.customWidth) || 8;
      return Math.max(3, Math.min(12, Math.round(w / 2)));
    }
    return 4;
  }

  // ---------- lookups ----------
  const findSize = (id) => SIZES.find((s) => s.id === id);
  const findModel = (id) => { const l = currentLine(); return l ? l.models.find((m) => m.id === id) : null; };
  const findStyle = (id) => { const l = currentLine(); return l ? l.styles.find((s) => s.id === id) : null; };
  const findColor = (id) => currentColors().find((c) => c.id === id);
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
    const rowSuffix = styleAllowsWindowRow(s.style)
      ? ` — ${(WINDOW_ROWS.find((r) => r.id === s.windowRow) || WINDOW_ROWS[0]).name}`
      : '';
    return w ? `${w.name}${w.code ? ` (${w.code})` : ''}${rowSuffix}` : '';
  }

  // ---------- validation per step ----------
  function stepError(stepId) {
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

  // ---------- live 3D preview ----------
  // Loaded on demand (js/builder-3d.js, Three.js via CDN) only once a color has
  // been chosen. The controller is created once and kept alive (paused, not
  // destroyed) while the visitor is on an earlier step, so returning to a color
  // already picked doesn't re-pay the load/init cost.
  let door3d = null;
  let door3dLoadPromise = null;

  function door3dPayload() {
    const style = findStyle(state.style);
    const color = findColor(state.color);
    const hasWindow = !!(state.windows && state.windows !== 'none');
    const windowDef = hasWindow ? findWindow(state.windows) : null;
    return {
      cols: getCols(),
      style: style ? style.pattern : 'cassette',
      colorHex: color ? color.hex : '#8a8a86',
      hasWindow,
      windowImg: windowDef ? windowDef.img : null,
      windowLayout: windowDef ? windowDef.layout : 'unit',
      windowRow: styleAllowsWindowRow(state.style) ? (state.windowRow || 'top') : 'top'
    };
  }

  // #builder-preview keeps two permanent child mounts (3D + schematic), toggled via
  // [hidden] — never replaced via innerHTML. Doing that once destroyed the live
  // door3d-mount whenever the visitor switched away from the 3D view and back,
  // orphaning the WebGL canvas (still "running", just no longer attached to
  // anything visible) and leaving a blank box on return.
  function getMount(el, id, className) {
    let mount = document.getElementById(id);
    if (!mount || mount.parentNode !== el) {
      mount = document.createElement('div');
      mount.id = id;
      if (className) mount.className = className;
      el.appendChild(mount);
    }
    return mount;
  }

  function showDoor3D(mount) {
    if (door3d) {
      door3d.resume();
      door3d.resize();
      door3d.update(door3dPayload());
      return;
    }
    if (!door3dLoadPromise) {
      door3dLoadPromise = import('./builder-3d.js').then((mod) => {
        door3d = mod.createDoorScene(mount);
        door3d.update(door3dPayload());
      });
    }
  }

  function renderPreview() {
    const el = document.getElementById('builder-preview');
    if (!el) return;
    // The live 3D preview shows from the very first step (Size), using the
    // door3dPayload() defaults (cassette style, a neutral grey) for whatever
    // hasn't been picked yet, and updates in place as the visitor makes choices.
    const door3dMount = getMount(el, 'door3d-mount', 'door3d-mount');
    door3dMount.hidden = false;
    showDoor3D(door3dMount);

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
    const colors = currentColors();
    grid.innerHTML = colors.map((c) => `
      <button type="button" class="builder-pick" data-pick="color" data-value="${c.id}">
        ${optionCard({ selected: state.color === c.id, title: c.name, sub: c.code, onSwatch: c.hex })}
      </button>`).join('');
  }

  function renderWindowsStep() {
    const grid = document.getElementById('window-options');
    const line = currentLine();
    const items = line ? line.windows : [];
    const noneCard = `<button type="button" class="builder-pick" data-pick="windows" data-value="none">
      ${optionCard({ selected: state.windows === 'none', iconSvg: NO_WINDOW_ICON, title: `No ${line ? line.secondaryLabel : 'Windows'}` })}
    </button>`;
    // Every design is always pickable, on any door size — the 3D/schematic preview
    // stretches or tiles the art to fit whatever width the visitor chose, rather
    // than gatekeeping which designs are "allowed" on which size.
    const cards = items.map((w) => `
      <button type="button" class="builder-pick" data-pick="windows" data-value="${w.id}">
        ${optionCard({ selected: state.windows === w.id, imgSrc: w.img, title: w.name, sub: w.code })}
      </button>`).join('');
    grid.innerHTML = noneCard + cards;

    const rowBox = document.getElementById('window-row-options');
    if (rowBox) {
      const hasWindow = state.windows !== 'none' && styleAllowsWindowRow(state.style);
      rowBox.hidden = !hasWindow;
      if (hasWindow) {
        rowBox.innerHTML = WINDOW_ROWS.map((r) => `
          <button type="button" class="builder-pick" data-pick="windowRow" data-value="${r.id}">
            ${optionCard({ selected: (state.windowRow || 'top') === r.id, title: r.name })}
          </button>`).join('');
      }
    }
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
    if (lineHasModel(line)) rows.push(['Door Style', model ? `${model.name}${model.sub ? ` — ${model.sub}` : ''}` : '—']);
    if (lineHasStyle(line)) rows.push(['Style', style ? style.name : '—']);
    rows.push(['Color', color ? `${color.name}${color.code ? ` (${color.code})` : ''}` : '—']);
    if (lineHasWindows(line)) rows.push([line.secondaryLabel, windowLabel(state)]);
    el.innerHTML = rows.map(([k, v]) => `
      <div class="grille-detail-rows"><div class="row"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v || '—')}</span></div></div>
    `).join('');
  }

  // ---------- step visibility ----------
  let hasRenderedOnce = false;

  // Step section headings are dynamic so the number prefix (01/, 02/, ...) always
  // matches getSteps()'s actual order, regardless of DOM order.
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
    if (!isStepUnlocked(stepId)) stepId = steps.find((s) => isStepUnlocked(s) && stepError(s)) || 'size';
    state.step = stepId;
    document.querySelectorAll('.builder-step').forEach((el) => {
      el.hidden = el.dataset.step !== stepId;
    });
    setError(null);
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
    showStep('size');
  }

  // ---------- wiring ----------
  function attachEvents() {
    document.body.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-pick]');
      if (pick) {
        const field = pick.dataset.pick;
        const value = pick.dataset.value;
        // Each Door Style has its own color palette (see COLOR_PALETTES) — a color
        // id picked under one palette isn't meaningful under another, so switching
        // Door Style clears any previously chosen color rather than silently
        // carrying over a stale (and possibly wrong) selection.
        if (field === 'model' && state.model !== value) state.color = null;
        state[field] = value;
        setError(null);
        saveState();
        renderPreview();
        renderProgress();
        if (field === 'size') renderSizeStep();
        if (field === 'model') renderModelStep();
        if (field === 'style') renderStyleStep();
        if (field === 'color') renderColorStep();
        if (field === 'windows' || field === 'windowRow') renderWindowsStep();
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
        document.getElementById('resume-banner').hidden = true;
        showStep(state.step && getSteps().includes(state.step) ? state.step : 'size');
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
      showStep('size', { persist: false });
    } else {
      showStep('size');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
