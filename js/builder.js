// Door Builder — Insulated Panel.
// Vanilla JS, no build step.

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
      { id: 'almond', name: 'Almond', hex: '#cfc9b8', code: 'RAL 1015' }
    ],
    // img (where present) is a real photographed wood-grain/finish swatch — shown
    // instead of the flat hex approximation, since a flat color can't represent a
    // wood-grain finish accurately.
    'modern-flush': [
      { id: 'dark-oak', name: 'Dark Oak', hex: '#4a2e1a', code: 'WOODGRAIN', img: 'assets/wood-dark-oak.png' },
      { id: 'light-oak', name: 'Light Oak', hex: '#b8875a', code: 'WOODGRAIN', img: 'assets/wood-light-oak.png' },
      { id: 'red-oak', name: 'Red Oak', hex: '#9c4f2e', code: 'WOODGRAIN', img: 'assets/wood-red-oak.png' },
      { id: 'carbon-oak', name: 'Carbon Oak', hex: '#c99a4a', code: 'WOODGRAIN', img: 'assets/wood-carbon-oak.png' },
      { id: 'dark-walnut', name: 'Dark Walnut', hex: '#7d8791', code: 'WOODGRAIN', img: 'assets/wood-dark-walnut.png' },
      { id: 'black-walnut', name: 'Black Walnut', hex: '#6e2f1f', code: 'WOODGRAIN', img: 'assets/wood-black-walnut.png' },
      { id: 'black', name: 'Black', hex: '#1a1a1a', code: 'SOLID', img: 'assets/wood-black.png' },
      { id: 'white', name: 'White', hex: '#eceae4', code: 'SOLID', img: 'assets/wood-white.png' }
    ],
    overlay: [
      { id: 'chocolate-brown', name: 'Chocolate Brown', hex: '#3a2a20', code: 'RAL 8017' },
      { id: 'basic-grey', name: 'Basic Grey', hex: '#54585c', code: 'RAL 7014' },
      { id: 'white', name: 'White', hex: '#eceae4', code: 'RAL 9016' },
      { id: 'brown-suede', name: 'Brown Suede', hex: '#4a3226', code: 'RAL 8011' },
      { id: 'matte-black', name: 'Matte Black', hex: '#141414', code: 'RAL 9005' },
      { id: 'light-oak', name: 'Light Oak', hex: '#b8875a', code: 'PL-OK01', img: 'assets/wood-light-oak.png' },
      { id: 'dark-oak', name: 'Dark Oak', hex: '#5a3a24', code: 'PL-OK02', img: 'assets/wood-dark-oak.png' },
      { id: 'white-suede', name: 'White Suede', hex: '#dcd8ce', code: 'RAL 9002' },
      { id: 'black-walnut', name: 'Black Walnut', hex: '#4a3628', code: 'PL-WT02', img: 'assets/wood-black-walnut.png' }
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

  // Sub-styles are keyed by Door Style too — Traditional's product page shows all 4
  // (Cassette/Carriage Short/Raised Ranch/Carriage Long); Non-Insulated's own page
  // only carries Cassette + Raised Ranch (Carriage Short/Long were dropped there),
  // so the builder mirrors that instead of offering styles that page doesn't have.
  // No other Door Style has a Style step at all.
  const STYLE_ENTRIES = {
    cassette: { id: 'cassette', name: 'Classic Cassette', pattern: 'cassette', img: 'assets/style-icon-cassette.png' },
    'carriage-short': { id: 'carriage-short', name: 'Carriage Short', pattern: 'carriage-short', img: 'assets/style-icon-carriage-short.png' },
    'raised-ranch': { id: 'raised-ranch', name: 'Raised Ranch', pattern: 'raised-ranch', img: 'assets/style-icon-raised-ranch.png' },
    'carriage-long': { id: 'carriage-long', name: 'Carriage Long', pattern: 'carriage-long', img: 'assets/style-icon-carriage-long.png' },
    flush: { id: 'flush', name: 'Flush', pattern: 'flush', img: 'assets/style-icon-flush.png' },
    'vertical-batten': { id: 'vertical-batten', name: 'Vertical Batten', pattern: 'vertical-batten', img: 'assets/aluminum-grille-door.png' },
    'full-view': { id: 'full-view', name: 'Full-View Glass', pattern: 'glass', img: 'assets/glass-garage-door.png' }
  };
  const STYLES_BY_MODEL = {
    traditional: [STYLE_ENTRIES.cassette, STYLE_ENTRIES['carriage-short'], STYLE_ENTRIES['raised-ranch'], STYLE_ENTRIES['carriage-long']],
    'non-insulated': [STYLE_ENTRIES.cassette, STYLE_ENTRIES['raised-ranch']],
    // Overlay's real 6400/6500/6600 series (see the actual 6410/6412/6414
    // reference photos) are all X/V-brace carriage-door patterns — none of
    // them are the plain raised-box Cassette look or the horizontal-band
    // Raised Ranch look, so only the 2 carriage/brace patterns are offered
    // here (not all 4, unlike Traditional) — this is both a closer match to
    // the real catalog and keeps Overlay from rendering identically to
    // Traditional when the same style happens to get picked on both.
    overlay: [STYLE_ENTRIES['carriage-short'], STYLE_ENTRIES['carriage-long']],
    'modern-flush': [STYLE_ENTRIES.flush],
    'aluminum-grille': [STYLE_ENTRIES['vertical-batten']],
    glass: [STYLE_ENTRIES['full-view']]
  };
  function currentStyles() { return STYLES_BY_MODEL[state.model] || []; }

  // Only one product line for now — the wizard has no "choose a product line" step,
  // it goes straight to Size. Kept as a keyed LINES object (rather than a bare
  // constant) so the step machinery below (currentLine/lineHasModel/etc.) doesn't
  // need to change if a second line comes back later.
  const LINES = {
    panel: {
      id: 'panel', name: 'Insulated Panel', heroImg: 'assets/style-icon-cassette.png',
      blurb: 'Classic panel doors, 4 styles', secondaryLabel: 'Windows',
      // The Model step originally showed all 6 marketing product lines as
      // informational cards, but the 3D preview/review/PDF only ever configured
      // an Insulated Panel door underneath regardless of which was picked — so a
      // visitor choosing Glass, Overlay, Aluminum Grille or Modern Flush got a
      // preview and quote PDF that misrepresented that product (client-reported
      // issue). Fixed by giving each line its own real style pattern in
      // bakeDoorTexture()/update() (js/builder-3d.js: 'flush' for Modern Flush,
      // 'vertical-batten' for Aluminum Grille, the same 4 carriage patterns for
      // Overlay) instead of always baking the Traditional panel-grid look.
      // Glass got its own real construction too: a full-view aluminum frame grid
      // with every cell an actual glass pane (not a painted panel), rather than
      // reusing the panel-grid look — see 'glass' in bakeDoorTexture()/update().
      models: [
        { id: 'traditional', name: 'Traditional Insulated Panel Doors', img: 'assets/traditional-door.png' },
        { id: 'modern-flush', name: 'Modern Flush Doors', img: 'assets/modern-flush-door.png' },
        { id: 'overlay', name: 'Overlay Doors', img: 'assets/overlay-door.png' },
        { id: 'aluminum-grille', name: 'Aluminum Grille Doors', img: 'assets/aluminum-grille-door.png' },
        { id: 'glass', name: 'Glass Garage Doors', img: 'assets/glass-garage-door.png' },
        { id: 'non-insulated', name: 'Non-Insulated Panel Doors', img: 'assets/non-insulated-garage-door.png' }
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

  // ---------- per-model glass / window option sets ----------

  // Inline SVG builder for glass-type option cards (Glass Garage Door).
  // Generates a 3 × 3 grid of glass-tinted cells on a dark background.
  function _makeGlassSvg(fill, opacity, stroke, extra) {
    let cells = '';
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        cells += `<rect x="${5 + c * 25}" y="${5 + r * 17}" width="21" height="13" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="0.5"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 56"><rect width="80" height="56" fill="#0e0e0e"/>${cells}${extra || ''}</svg>`;
  }

  // 'tint' is the base color baked into every glass pane on the door; 'finish'
  // tells builder-3d.js which material recipe to use (clear/tinted/frosted/
  // reflective/mirror) so the 3D preview's actual glass panes match the picked
  // type instead of always rendering the same default blue-glass look.
  const GLASS_DOOR_TYPES = [
    { id: 'glass-clear',      name: 'Clear Glass',                     layout: 'unit', tint: '#b8d4e8', finish: 'clear',
      svg: _makeGlassSvg('#b8d4e8', 0.35, '#7aaac4', '<line x1="8" y1="5" x2="26" y2="18" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>') },
    { id: 'glass-bronze',     name: 'Bronze Tinted Glass',             layout: 'unit', tint: '#8a5a1e', finish: 'tinted',
      svg: _makeGlassSvg('#8a5a1e', 0.7,  '#6a4010', '') },
    { id: 'glass-black',      name: 'Black Glass',                     layout: 'unit', tint: '#141414', finish: 'tinted',
      svg: _makeGlassSvg('#040404', 1.0,  '#2a2a2a', '') },
    { id: 'glass-refl-black', name: 'Reflective Black Tempered Glass', layout: 'unit', tint: '#141414', finish: 'reflective',
      svg: _makeGlassSvg('#040404', 1.0,  '#2a2a2a',
        '<line x1="5" y1="5" x2="75" y2="51" stroke="rgba(255,255,255,0.18)" stroke-width="3" stroke-linecap="round"/>' +
        '<line x1="5" y1="14" x2="48" y2="51" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>') },
    { id: 'glass-frost',      name: 'Frosted Glass',                   layout: 'unit', tint: '#c8d0d8', finish: 'frosted',
      svg: _makeGlassSvg('#c8d0d8', 0.6,  '#9aa4ae', '') },
    { id: 'glass-mirror',     name: 'Mirrored Glass',                  layout: 'unit', tint: '#c0c8d0', finish: 'mirror',
      svg: (() => {
        let cells = '';
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 3; c++)
            cells += `<rect x="${5 + c * 25}" y="${5 + r * 17}" width="21" height="13" fill="url(#gmir)" stroke="#909898" stroke-width="0.5"/>`;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 56"><defs><linearGradient id="gmir" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#b8c8d4"/><stop offset="40%" stop-color="#e0e8ec"/><stop offset="100%" stop-color="#586068"/></linearGradient></defs><rect width="80" height="56" fill="#0e0e0e"/>${cells}</svg>`;
      })() },
    { id: 'glass-white',      name: 'White Glass',                     layout: 'unit', tint: '#e8eaed', finish: 'clear',
      svg: _makeGlassSvg('#e8eaed', 0.92, '#b4b8bc', '') }
  ];

  // Modern Flush side-glass options — glass panels placed in a narrow vertical
  // strip on the LEFT or RIGHT side of the door body (not a top-row window),
  // always 4 panes stacked in that strip. SVG previews mirror the actual 3D
  // layout — glassW is kept narrow (thin sidelite strip, not a wide glass block).
  function _flushSideSvg(side, panels, paneHeightRatio = 0.72) {
    const glassW = 12, gap = 2;
    const doorW = 58;
    const doorX = side === 'right' ? 4 : 4 + glassW + gap;
    const glassX = side === 'right' ? doorX + doorW + gap : 4;
    const paneGap = 3;
    const slotH = (48 - paneGap * (panels - 1)) / panels;
    const paneH = slotH * paneHeightRatio;
    let panes = '';
    for (let i = 0; i < panels; i++) {
      const y = 4 + i * (slotH + paneGap) + (slotH - paneH) / 2;
      panes += `<rect x="${glassX}" y="${y}" width="${glassW}" height="${paneH}" fill="rgba(180,214,235,0.38)" stroke="#7aaac4" stroke-width="0.8"/>`;
    }
    let seams = '';
    for (let i = 1; i < 3; i++) {
      const y = 4 + i * 14.67;
      seams += `<line x1="${doorX}" y1="${y}" x2="${doorX + doorW}" y2="${y}" stroke="#1c1c1c" stroke-width="1.5"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 56"><rect width="80" height="56" fill="#5a5a5a"/><rect x="${doorX}" y="4" width="${doorW}" height="48" fill="#2a2a2a"/>${seams}${panes}</svg>`;
  }
  const FLUSH_SIDE_GLASS = [
    { id: 'flush-side-left-4p',        name: 'Side Glass — Left',       layout: 'unit', side: 'left',  panels: 4, paneHeightRatio: 0.72, svg: _flushSideSvg('left', 4, 0.72) },
    { id: 'flush-side-right-4p',       name: 'Side Glass — Right',      layout: 'unit', side: 'right', panels: 4, paneHeightRatio: 0.72, svg: _flushSideSvg('right', 4, 0.72) },
    { id: 'flush-side-left-short-4p',  name: 'Side Glass — Left Short', layout: 'unit', side: 'left',  panels: 4, paneHeightRatio: 0.747, svg: _flushSideSvg('left', 4, 0.747) },
    { id: 'flush-side-right-short-4p', name: 'Side Glass — Right Short',layout: 'unit', side: 'right', panels: 4, paneHeightRatio: 0.747, svg: _flushSideSvg('right', 4, 0.747) }
  ];

  // Overlay uses only these 6 compatible strip-style window designs.
  const OVERLAY_WINDOW_IDS = new Set(['wd3008', 'wd3003', 'wd3006', 'wd3005', 'wd3004', 'wd3007']);

  // Keyed by model id — undefined/missing means "use LINES.panel.windows" (full catalog).
  // Defined here because LINES.panel.windows is already in scope above.
  const WINDOWS_BY_MODEL = {
    overlay: LINES.panel.windows.filter((w) => OVERLAY_WINDOW_IDS.has(w.id)),
    glass: GLASS_DOOR_TYPES,
    'aluminum-grille': [],
    'modern-flush': FLUSH_SIDE_GLASS
  };

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
  // Only Door Styles with a real "Door Styles" section on their own product page
  // (Traditional, Non-Insulated) get this step — see STYLES_BY_MODEL.
  function lineHasStyle(line) { return !!line && currentStyles().length > 1; }

  // Returns the window/glass-type options for the currently selected model.
  // Models not listed in WINDOWS_BY_MODEL (Traditional, Non-Insulated) fall back
  // to the full catalog in LINES.panel.windows.
  function currentWindows() {
    const override = WINDOWS_BY_MODEL[state.model];
    if (override !== undefined) return override;
    const line = currentLine();
    return line ? line.windows : [];
  }

  // Step label for the windows step changes per model (Glass → "Glass Type",
  // Modern Flush → "Side Glass", everything else → "Windows").
  const _SECONDARY_LABELS = { glass: 'Glass Type', 'modern-flush': 'Side Glass' };
  function currentSecondaryLabel() {
    return _SECONDARY_LABELS[state.model] || (currentLine() ? currentLine().secondaryLabel : 'Windows');
  }

  function lineHasWindows() { return currentWindows().length > 0; }
  // Carriage Short/Long draw one continuous crossbuck spanning the whole door body —
  // there's no natural "row" to relocate a window into — so the Top/Center choice
  // only applies to Classic Cassette and Raised Ranch.
  function styleAllowsWindowRow(styleId) { return styleId === 'cassette' || styleId === 'raised-ranch'; }

  // Step order: Size, then Model (Product Line) before Panel Design, then Color/
  // Windows/Review/Quote. "style" always keeps its slot in this array — even for
  // product lines that don't use it — so the step COUNT and every later step's
  // number stay stable regardless of which product line is picked, instead of
  // Color/Windows/Review/Quote shifting up by one the moment a line that has a
  // Panel Design step gets selected. isStepUnlocked()/goNext()/goBack() treat an
  // inapplicable "style" slot as automatically satisfied and skip over it.
  function getSteps() {
    const line = currentLine();
    const steps = ['size'];
    if (lineHasModel(line)) steps.push('model');
    steps.push('style');
    steps.push('color');
    if (lineHasWindows()) steps.push('windows');
    steps.push('review', 'quote');
    return steps;
  }

  function stepLabel(id) {
    if (id === 'windows') return currentSecondaryLabel().toUpperCase();

    const STATIC = {
      size: 'SIZE', model: 'PRODUCT LINE', style: 'PANEL DESIGN',
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
  const findStyle = (id) => currentStyles().find((s) => s.id === id);
  const findColor = (id) => currentColors().find((c) => c.id === id);
  const findWindow = (id) => currentWindows().find((w) => w.id === id) || null;

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
    const label = currentSecondaryLabel();
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
    if (stepId === 'style') return lineHasStyle(currentLine()) && !state.style ? 'Please select a panel design.' : null;
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
  // Set once the 3D preview has failed to load (CDN blocked, network timeout,
  // WebGL unavailable, etc.) so every later renderPreview() call goes straight
  // to the 2D fallback instead of retrying the import on its own — the visitor
  // has to press "Retry 3D preview" to try again.
  let door3dFailed = false;
  const DOOR3D_LOAD_TIMEOUT_MS = 9000;

  function door3dPayload() {
    const style = findStyle(state.style);
    const color = findColor(state.color);
    // A model with exactly one style (Modern Flush, Aluminum Grille) never
    // shows the Panel Design step at all (see skippableStep()), so state.style
    // is never explicitly set — fall back to that model's own single style
    // pattern instead of always defaulting to 'cassette'.
    const onlyStyle = currentStyles().length === 1 ? currentStyles()[0] : null;
    const selected = (state.windows && state.windows !== 'none') ? findWindow(state.windows) : null;

    // Glass Garage Door's "windows" step picks a glass TYPE, not a window design —
    // it must never cut a window row into the door (the whole door is already
    // glass); it only retints the existing panes. Modern Flush's "windows" step
    // picks a SIDE-glass layout (left/right strip), also never a top-row cut.
    // Every other model keeps the normal top-row window behavior.
    const isGlassModel = state.model === 'glass';
    const isFlushModel = state.model === 'modern-flush';
    const hasWindow = !isGlassModel && !isFlushModel && !!selected;

    return {
      cols: getCols(),
      style: style ? style.pattern : (onlyStyle ? onlyStyle.pattern : 'cassette'),
      colorHex: color ? color.hex : '#8a8a86',
      hasWindow,
      windowImg: hasWindow ? selected.img : null,
      windowLayout: hasWindow ? selected.layout : 'unit',
      windowRow: styleAllowsWindowRow(state.style) ? (state.windowRow || 'top') : 'top',
      glassTint: isGlassModel && selected ? selected.tint : null,
      glassFinish: isGlassModel && selected ? selected.finish : null,
      sideGlass: isFlushModel && selected ? { side: selected.side, panels: selected.panels, paneHeightRatio: selected.paneHeightRatio } : null
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

  // Dependency-free 2D fallback — draws the same cols x 4-row grid the 3D scene
  // uses, flat-colored per the current selection, with a lighter band standing
  // in for the window row. No CDN, no WebGL: this always works, so the tool
  // stays usable end to end even when the 3D preview can't load.
  const FALLBACK_ROWS = 4;
  function render2D(canvas, payload) {
    const cssW = canvas.clientWidth || 560;
    const cssH = Math.round(cssW * 0.72);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const pad = cssW * 0.06;
    const doorW = cssW - pad * 2, doorH = cssH - pad * 2;
    const doorX = pad, doorY = pad;
    ctx.fillStyle = '#cfcbc0';
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.fillStyle = '#e9e6df';
    ctx.fillRect(doorX - 8, doorY - 8, doorW + 16, doorH + 16);

    const cols = Math.max(1, payload.cols || 4);
    const gap = doorW * 0.012;
    const cellW = (doorW - gap * (cols - 1)) / cols;
    const cellH = (doorH - gap * (FALLBACK_ROWS - 1)) / FALLBACK_ROWS;
    const windowRowIdx = payload.windowRow === 'center' ? 1 : 0;

    for (let r = 0; r < FALLBACK_ROWS; r++) {
      for (let c = 0; c < cols; c++) {
        const x = doorX + c * (cellW + gap);
        const y = doorY + r * (cellH + gap);
        const isWindowCell = payload.hasWindow && r === windowRowIdx;
        ctx.fillStyle = isWindowCell ? '#6b7280' : payload.colorHex;
        ctx.fillRect(x, y, cellW, cellH);
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
      }
    }
  }

  function showFallback2D(mount) {
    mount.hidden = false;
    render2D(mount, door3dPayload());
  }

  function setDoor3DStatus(status) {
    const statusMount = document.getElementById('door3d-status');
    if (!statusMount) return;
    statusMount.hidden = status === 'none';
    statusMount.dataset.status = status;
  }

  function showDoor3D(mount) {
    if (door3d) {
      door3d.resume();
      door3d.resize();
      door3d.update(door3dPayload());
      return;
    }
    if (door3dFailed) return; // stays on the 2D fallback until Retry is pressed
    if (!door3dLoadPromise) {
      setDoor3DStatus('loading');
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('3D preview timed out loading')), DOOR3D_LOAD_TIMEOUT_MS);
      });
      // Promise.race settles on whichever finishes first; if the timeout wins,
      // a late-arriving import() success is simply never chained into anything
      // and is ignored — no risk of it fighting the fallback afterwards.
      door3dLoadPromise = Promise.race([import('./builder-3d.js'), timeout])
        .then((mod) => {
          door3d = mod.createDoorScene(mount);
          door3d.update(door3dPayload());
          setDoor3DStatus('none');
          const door2dMount = document.getElementById('door2d-mount');
          if (door2dMount) door2dMount.hidden = true;
          mount.hidden = false;
        })
        .catch((err) => {
          console.error('[builder] 3D preview failed to load, showing 2D fallback:', err);
          door3dFailed = true;
          door3dLoadPromise = null;
          setDoor3DStatus('error');
          mount.hidden = true;
          const door2dMount = document.getElementById('door2d-mount');
          if (door2dMount) showFallback2D(door2dMount);
        });
    }
  }

  // A browser that has already failed a dynamic import() for a given module URL
  // caches that failure for the page's lifetime — calling import() again on the
  // exact same URL rejects immediately every time, even once the network/CDN
  // issue that caused it is gone. The only reliable way to actually retry is a
  // full reload, which gets a clean module registry. Progress isn't lost: the
  // wizard's state is saved to localStorage (STORAGE_KEY) and restored on load.
  function retryDoor3D() {
    window.location.reload();
  }

  function renderPreview() {
    const el = document.getElementById('builder-preview');
    if (!el) return;
    // The live 3D preview shows from the very first step (Size), using the
    // door3dPayload() defaults (cassette style, a neutral grey) for whatever
    // hasn't been picked yet, and updates in place as the visitor makes choices.
    const door3dMount = getMount(el, 'door3d-mount', 'door3d-mount');
    // Not built with getMount() since that helper always creates a <div> —
    // this permanent mount needs to be a <canvas> from the start.
    let canvasMount = document.getElementById('door2d-mount');
    if (!canvasMount) {
      canvasMount = document.createElement('canvas');
      canvasMount.id = 'door2d-mount';
      canvasMount.className = 'door-canvas';
      canvasMount.hidden = true;
      el.appendChild(canvasMount);
    }
    let statusMount = document.getElementById('door3d-status');
    if (!statusMount) {
      statusMount = document.createElement('div');
      statusMount.id = 'door3d-status';
      statusMount.className = 'builder-3d-status';
      statusMount.hidden = true;
      statusMount.innerHTML =
        '<div class="builder-3d-status-loading">Loading 3D preview…</div>' +
        '<div class="builder-3d-status-error">' +
        '3D preview couldn\'t load, so we\'re showing a simplified view below.' +
        '<button type="button" class="btn btn-outline btn-sm" data-retry-3d>Retry 3D preview</button>' +
        '</div>';
      statusMount.querySelector('[data-retry-3d]').addEventListener('click', retryDoor3D);
      el.appendChild(statusMount);
    }

    if (door3dFailed) {
      door3dMount.hidden = true;
      showFallback2D(canvasMount);
    } else {
      door3dMount.hidden = false;
      showDoor3D(door3dMount);
      if (door3d) canvasMount.hidden = true;
    }

    const chips = document.getElementById('builder-summary-chips');
    if (!chips) return;
    const line = currentLine();
    const items = [
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
    const styles = currentStyles();
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
    grid.innerHTML = colors.map((c) => {
      // A real photographed wood-grain swatch (where we have one) instead of a
      // flat hex approximation — a solid fill can't represent a wood-grain finish.
      const swatchStyle = c.img ? `url('${c.img}') center/cover` : c.hex;
      return `
      <button type="button" class="builder-pick" data-pick="color" data-value="${c.id}">
        ${optionCard({ selected: state.color === c.id, title: c.name, sub: c.code, onSwatch: swatchStyle })}
      </button>`;
    }).join('');
  }

  function renderWindowsStep() {
    const grid = document.getElementById('window-options');
    const label = currentSecondaryLabel();
    const items = currentWindows();
    const noneCard = `<button type="button" class="builder-pick" data-pick="windows" data-value="none">
      ${optionCard({ selected: state.windows === 'none', iconSvg: NO_WINDOW_ICON, title: `No ${label.toLowerCase()}` })}
    </button>`;
    const cards = items.map((w) => `
      <button type="button" class="builder-pick" data-pick="windows" data-value="${w.id}">
        ${optionCard({ selected: state.windows === w.id, imgSrc: w.img, iconSvg: w.svg, title: w.name, sub: w.code })}
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
      ['Size', sizeLabel(state)]
    ];
    if (lineHasModel(line)) rows.push(['Product Line', model ? `${model.name}${model.sub ? ` — ${model.sub}` : ''}` : '—']);
    if (lineHasStyle(line)) rows.push(['Panel Design', style ? style.name : '—']);
    rows.push(['Color', color ? `${color.name}${color.code ? ` (${color.code})` : ''}` : '—']);
    if (lineHasWindows()) rows.push([currentSecondaryLabel(), windowLabel(state)]);
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
      if (id === 'windows') {
        const lbl = currentSecondaryLabel();
        if (title) title.textContent = lbl === 'Windows' ? 'Choose a window option' : `Choose a ${lbl.toLowerCase()}`;
        const note = section.querySelector('.window-note');
        if (note) note.textContent = `Optional — pick the ${lbl.toLowerCase()} for this door.`;
      }
    });
  }

  // persist=false is used for the very first paint when a resumable draft exists in
  // localStorage — we must not touch storage until the visitor actually chooses
  // "Resume" or "Discard", otherwise this initial render would silently overwrite
  // (and destroy) their saved progress before they ever see the resume banner.
  function showStep(stepId, { persist = true } = {}) {
    const steps = getSteps();
    // Guard against ever landing directly on the reserved-but-inapplicable
    // "style" slot (a stray progress-chip click, a resumed draft from before the
    // current line was picked, etc.) — its grid would just render empty.
    if (skippableStep(stepId)) stepId = steps[steps.indexOf(stepId) + 1] || 'color';
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

  // "style" keeps a reserved slot in getSteps() even when the current line has no
  // Panel Design choice (see getSteps()) — skip straight past it in that case so
  // the visitor never lands on an empty/inapplicable step.
  function skippableStep(stepId) {
    return stepId === 'style' && !lineHasStyle(currentLine());
  }
  function goNext() {
    const err = stepError(state.step);
    if (err) { setError(err); return; }
    const steps = getSteps();
    let idx = steps.indexOf(state.step);
    do { idx++; } while (idx < steps.length - 1 && skippableStep(steps[idx]));
    if (idx < steps.length) showStep(steps[idx]);
  }
  function goBack() {
    const steps = getSteps();
    let idx = steps.indexOf(state.step);
    do { idx--; } while (idx > 0 && skippableStep(steps[idx]));
    if (idx >= 0) showStep(steps[idx]);
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
      postalCode: document.getElementById('q-postal').value,
      website: document.getElementById('q-website') ? document.getElementById('q-website').value : ''
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
      secondaryLabel: currentSecondaryLabel(),
      sizeLabel: sizeLabel(state),
      modelLabel: lineHasModel(line) && model ? `${model.name}${model.sub ? ` (${model.sub})` : ''}` : '',
      styleLabel: lineHasStyle(line) && style ? style.name : '',
      colorLabel: color ? `${color.name}${color.code ? ` (${color.code})` : ''}` : '',
      windowLabel: lineHasWindows() ? windowLabel(state) : ''
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
        // Each Door Style has its own color palette (see COLOR_PALETTES) and its own
        // set of sub-styles (see STYLES_BY_MODEL, e.g. Traditional has 4, Non-
        // Insulated has 2, most have none) — a color or style id picked under one
        // isn't meaningful under another, so switching Door Style clears both
        // rather than silently carrying over a stale (and possibly invalid)
        // selection.
        if (field === 'model' && state.model !== value) { state.color = null; state.style = null; state.windows = 'none'; }
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
