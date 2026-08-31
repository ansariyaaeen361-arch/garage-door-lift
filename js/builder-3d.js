// Live WebGL door renderer — shared by the Door Builder (Insulated Panel line) and
// the standalone 3d-prototype.html demo, so a fix made here fixes both.
// Free/open-source (Three.js via CDN, no build step, no paid rendering service).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// One door "cell" in world units. Height stays fixed at ROWS rows (real garage
// doors are ~7' tall regardless of width); width grows with the selected column
// count (single/double/custom), matching js/builder.js's getCols().
const CELL_W = 0.62, CELL_H = 0.5, GAP = 0.03;
const ROWS = 4;
const baseDepth = 0.09;
const baseFrontZ = baseDepth / 2;
const RAISE = 0.06;

// Small image cache so re-picking a window design already looked at doesn't
// re-fetch it, and update() can synchronously check "is this loaded yet?".
const imageCache = new Map();
function preloadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return imageCache.get(src).promise;
  const img = new Image();
  const entry = { img, loaded: false, promise: null };
  entry.promise = new Promise((resolve) => {
    img.onload = () => { entry.loaded = true; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageCache.set(src, entry);
  return entry.promise;
}
function getLoadedImg(src) {
  if (!src) return null;
  const entry = imageCache.get(src);
  return entry && entry.loaded ? entry.img : null;
}

// Draws the *actual* selected window design into a w x h canvas — this used to just
// be a flat grey placeholder rect regardless of which of the 16 designs was picked,
// so switching designs visually did nothing. 'strip' art already spans a full
// double-door row (two window groups + center post baked in), so the whole image is
// stretched once, uncropped, to fill whatever width this door turned out to be —
// never cropped, so no pane can get sliced/torn on an odd column count. 'unit' art
// is one self-contained icon, tiled per column with contain-fit so it's never
// distorted.
function bakeWindowCanvas(img, layout, cols, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#cfd8dc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!img) return canvas;

  if (layout === 'strip') {
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvas.width, canvas.height);
  } else {
    const cellW = canvas.width / cols;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const boxW = cellW * 0.82, boxH = canvas.height * 0.82;
    const scale = Math.min(boxW / iw, boxH / ih);
    const dw = iw * scale, dh = ih * scale;
    for (let c = 0; c < cols; c++) {
      const dx = c * cellW + (cellW - dw) / 2;
      const dy = (canvas.height - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      if (c > 0) {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(c * cellW, 4); ctx.lineTo(c * cellW, canvas.height - 4); ctx.stroke();
      }
    }
  }
  return canvas;
}

// [[top,bottom], ...] pixel-space vertical segments spanning the door body, with a
// gap cut out for the window's row when one is present — 2 segments when the window
// sits in a middle row (not the very top/bottom row), 1 otherwise. Shared by the
// texture bake (drawing) and the 3D mesh generation (geometry) so both agree exactly
// on where the crossbuck/braces stop and start around the window.
function bodySegments(hasWindow, winRowIdx, pad, totalH, cellH, gapY) {
  if (!hasWindow) return [[pad, pad + totalH]];
  const winTop = pad + winRowIdx * (cellH + gapY);
  const winBottom = winTop + cellH;
  const segs = [];
  if (winRowIdx > 0) segs.push([pad, winTop]);
  if (winRowIdx < ROWS - 1) segs.push([winBottom + gapY, pad + totalH]);
  return segs.length ? segs : [[pad, pad + totalH]];
}

function relativeLuminance(hex) {
  const c = new THREE.Color(hex);
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}

function darken(hex, amount) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(1 - amount);
  return '#' + c.getHexString();
}

// Bakes panel/groove/crossbuck lines directly into the color texture so the grid
// reads as carved-in from ANY angle and ANY color — real-time shadow alone (the
// first version of this prototype) went flat/invisible on light colors viewed
// close to head-on, since there was nothing but shadow contrast to see.
function bakeDoorTexture(styleId, colorHex, cols, hasWindow, doorW, doorH, windowImg, windowLayout, winRowIdx = 0) {
  const texW = 1536, texH = Math.round(texW * doorH / doorW);
  const canvas = document.createElement('canvas');
  canvas.width = texW; canvas.height = texH;
  const ctx = canvas.getContext('2d');

  // A raised box's front face has (almost) the exact same surface normal as the
  // base right next to it when the camera looks nearly head-on — real-time light
  // can't tell them apart, so the "3D relief" all but disappears from the front no
  // matter how deep the geometry is. The fix that's guaranteed to work from every
  // angle: bake a permanently *darker recess* into the color itself (a fake groove)
  // wherever the surface is NOT raised, so raised vs. recessed reads as a genuine
  // color/tone difference — independent of the real-time light direction.
  const recessColor = darken(colorHex, 0.22);
  ctx.fillStyle = recessColor;
  ctx.fillRect(0, 0, texW, texH);

  const isLight = relativeLuminance(colorHex) > 0.5;
  const dark = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.4)';
  const light = isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.26)';

  function strokeEmbossed(drawPath, lw) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = dark;
    ctx.save(); ctx.translate(2, 2); drawPath(); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = light;
    ctx.save(); ctx.translate(-2, -2); drawPath(); ctx.stroke(); ctx.restore();
  }
  // Fills the raised area back to the door's true color (undoing the recess tint
  // above), plus a light-catching gradient so it still reads as gently domed.
  function fillRaised(x, y, w, h, vertical) {
    ctx.fillStyle = colorHex;
    ctx.fillRect(x, y, w, h);
    const grad = vertical ? ctx.createLinearGradient(0, y, 0, y + h) : ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, isLight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.16)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }
  // Carriage's stiles/rails/braces are thin strips, not big filled areas — a wide,
  // solid, bright core stroke (not just a hairline) is what makes those read as
  // raised bars rather than pencil-thin lines.
  function strokeRaisedBar(drawPath, barWidth) {
    ctx.lineCap = 'round';
    ctx.lineWidth = barWidth;
    ctx.strokeStyle = colorHex;
    drawPath(); ctx.stroke();
    strokeEmbossed(drawPath, Math.max(2, barWidth * 0.14));
  }

  const pad = texW * 0.016;
  const gapX = texW * 0.009, gapY = texH * 0.014;
  const totalW = texW - pad * 2, totalH = texH - pad * 2;
  const cellW = (totalW - gapX * (cols - 1)) / cols;
  const cellH = (totalH - gapY * (ROWS - 1)) / ROWS;
  const rowY = (r) => pad + r * (cellH + gapY);
  const colX = (c) => pad + c * (cellW + gapX);

  let windowRect = null;
  if (hasWindow) {
    windowRect = { x: pad, y: rowY(winRowIdx), w: totalW, h: cellH };
    const winCanvas = bakeWindowCanvas(windowImg, windowLayout, cols, windowRect.w, windowRect.h);
    ctx.drawImage(winCanvas, windowRect.x, windowRect.y);
    strokeEmbossed(() => { ctx.beginPath(); ctx.rect(windowRect.x + 2, windowRect.y + 2, windowRect.w - 4, windowRect.h - 4); }, 3.5);
  }
  const segs = bodySegments(hasWindow, winRowIdx, pad, totalH, cellH, gapY);

  if (styleId === 'cassette') {
    const inset = cellW * 0.13;
    for (let r = 0; r < ROWS; r++) {
      if (hasWindow && r === winRowIdx) continue;
      for (let c = 0; c < cols; c++) {
        const x = colX(c), y = rowY(r);
        const rx = x + inset, ry = y + inset, rw = cellW - inset * 2, rh = cellH - inset * 2;
        fillRaised(rx, ry, rw, rh, false);
        strokeEmbossed(() => { ctx.beginPath(); ctx.rect(rx, ry, rw, rh); }, 3.5);
      }
    }
  } else if (styleId === 'raised-ranch') {
    const inset = cellH * 0.1;
    for (let r = 0; r < ROWS; r++) {
      if (hasWindow && r === winRowIdx) continue;
      const y = rowY(r) + inset;
      fillRaised(pad + cellW * 0.02, y, totalW - cellW * 0.04, cellH - inset * 2, true);
      strokeEmbossed(() => { ctx.beginPath(); ctx.rect(pad + cellW * 0.02, y, totalW - cellW * 0.04, cellH - inset * 2); }, 3);
    }
  } else if (styleId === 'carriage-short' || styleId === 'carriage-long') {
    const n = styleId === 'carriage-long' ? 6 : 3;
    const barW = Math.max(20, totalW * 0.02);
    segs.forEach(([bodyTop, bodyBottom]) => {
      for (let i = 1; i < n; i++) {
        const x = pad + (totalW / n) * i;
        strokeRaisedBar(() => { ctx.beginPath(); ctx.moveTo(x, bodyTop + barW / 2 + 4); ctx.lineTo(x, bodyBottom - barW / 2 - 4); }, barW);
      }
      [bodyTop + barW / 2 + 2, bodyBottom - barW / 2 - 2].forEach((y) => {
        strokeRaisedBar(() => { ctx.beginPath(); ctx.moveTo(pad + barW / 2 + 4, y); ctx.lineTo(pad + totalW - barW / 2 - 4, y); }, barW);
      });
      const leaves = Math.max(1, Math.round(cols / 4));
      const leafW = totalW / leaves;
      for (let i = 0; i < leaves; i++) {
        const lx = pad + i * leafW;
        strokeRaisedBar(() => {
          ctx.beginPath();
          ctx.moveTo(lx + 20, bodyBottom - 16);
          ctx.lineTo(lx + leafW - 20, bodyTop + 16);
        }, barW * 0.85);
      }
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return {
    texture, windowRect, texW, texH, pad, gapX, gapY, cellW, cellH, bodySegments: segs,
    toWorld(x, y, w, h) {
      const scale = doorW / texW;
      return {
        w: w * scale, h: h * scale,
        cx: (x + w / 2 - texW / 2) * scale,
        cy: doorH - (y + h / 2) * scale
      };
    }
  };
}

const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xe7e4da, roughness: 0.85 });

// Frame + glass mesh spanning a whole pixel-space row, textured with the actual
// selected window design.
function addWindowRow(doorMeshGroup, baked, loadedWindowImg, windowLayout, cols) {
  if (!baked.windowRect) return;
  const wr = baked.windowRect;
  const inset = wr.w * 0.01;
  const fw = baked.toWorld(0, 0, wr.w - inset * 2, wr.h - inset * 2);
  const fpos = baked.toWorld(wr.x + inset, wr.y + inset, wr.w - inset * 2, wr.h - inset * 2);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(fw.w, fw.h, RAISE * 0.9), frameMaterial);
  frame.position.set(fpos.cx, fpos.cy, baseFrontZ + RAISE * 0.45);
  frame.castShadow = true; frame.receiveShadow = true;
  doorMeshGroup.add(frame);

  const winTexCanvas = bakeWindowCanvas(loadedWindowImg, windowLayout, cols, 1200, Math.max(1, Math.round(1200 * wr.h / wr.w)));
  const winTexture = new THREE.CanvasTexture(winTexCanvas);
  winTexture.colorSpace = THREE.SRGBColorSpace;
  const glassMat = new THREE.MeshPhysicalMaterial({
    map: winTexture, color: 0xffffff, roughness: 0.12, metalness: 0.05,
    transmission: 0.3, thickness: 0.05, ior: 1.4, transparent: true, opacity: 0.97
  });
  const glassInset = wr.w * 0.006;
  const gw = baked.toWorld(0, 0, wr.w - glassInset * 2, wr.h - glassInset * 2);
  const gpos = baked.toWorld(wr.x + glassInset, wr.y + glassInset, wr.w - glassInset * 2, wr.h - glassInset * 2);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(gw.w, gw.h, 0.015), glassMat);
  glass.position.set(gpos.cx, gpos.cy, baseFrontZ + RAISE * 0.9 + 0.01);
  doorMeshGroup.add(glass);
}

export function createDoorScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfcbc0);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = false; // avoid hijacking page scroll inside the sticky preview panel
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI / 2 - 0.55;
  controls.maxPolarAngle = Math.PI / 2 + 0.1;
  controls.minAzimuthAngle = -0.9;
  controls.maxAzimuthAngle = 0.9;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; }, { once: true });

  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a4840, 0.6));
  const key = new THREE.DirectionalLight(0xfff6e6, 1.9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0015;
  scene.add(key);
  const fillLight = new THREE.DirectionalLight(0xcfe0ff, 0.55);
  fillLight.position.set(-5, 2.5, 3);
  scene.add(fillLight);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(-2, 3, -5);
  scene.add(rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0xbdb8ab, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: 0xdedad0, roughness: 1 }));
  wall.receiveShadow = true;
  scene.add(wall);

  const doorGroup = new THREE.Group();
  scene.add(doorGroup);
  let trimBars = [];
  let doorMeshGroup = null;
  let lastDims = null;

  function clearTrim() { trimBars.forEach((b) => doorGroup.remove(b)); trimBars = []; }
  function addTrimBar(w, h, x, y) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), frameMaterial);
    bar.position.set(x, y, -0.05);
    bar.castShadow = true; bar.receiveShadow = true;
    doorGroup.add(bar);
    trimBars.push(bar);
  }

  function frameScene(doorW, doorH) {
    key.position.set(doorW * 1.1, doorH * 2.6, doorH * 2.4);
    key.shadow.camera.left = -doorW; key.shadow.camera.right = doorW;
    key.shadow.camera.top = doorH * 1.5; key.shadow.camera.bottom = -doorH * 0.5;
    key.shadow.camera.updateProjectionMatrix();
    wall.position.set(0, doorH * 5, -doorH * 1.6);
    const dist = Math.max(doorW, doorH * 1.7) * 1.75;
    camera.position.set(doorW * 0.28, doorH * 0.64, dist);
    controls.target.set(0, doorH * 0.5, 0);
    controls.minDistance = dist * 0.6;
    controls.maxDistance = dist * 1.7;
  }

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  let lastRequestedWindowImg = null;

  function update({ cols, style, colorHex, hasWindow, windowImg, windowLayout, windowRow }) {
    cols = Math.max(3, Math.min(12, cols || 4));
    const doorW = cols * CELL_W + (cols - 1) * GAP;
    const doorH = ROWS * CELL_H + (ROWS - 1) * GAP;
    // 'center' sits one row below the top (row 1 of 0..ROWS-1) — matches the option
    // shown in the Windows step, not a strict geometric middle of the door.
    const winRowIdx = windowRow === 'center' ? 1 : 0;

    // The window art loads async — draw with whatever's already cached right now
    // (a plain placeholder the very first time a given design is picked), then
    // re-run update() once it's ready. lastRequestedWindowImg guards against a
    // stale load finishing after the visitor has already picked something else.
    lastRequestedWindowImg = hasWindow ? windowImg : null;
    if (hasWindow && windowImg && !getLoadedImg(windowImg)) {
      preloadImage(windowImg).then(() => {
        if (lastRequestedWindowImg === windowImg) {
          update({ cols, style, colorHex, hasWindow, windowImg, windowLayout, windowRow });
        }
      });
    }
    const loadedWindowImg = hasWindow ? getLoadedImg(windowImg) : null;

    if (!lastDims || lastDims.w !== doorW || lastDims.h !== doorH) {
      clearTrim();
      const tw = 0.14;
      addTrimBar(doorW + tw * 2, tw, 0, tw / 2);
      addTrimBar(tw, doorH + tw, -doorW / 2 - tw / 2, doorH / 2 + tw / 2);
      addTrimBar(tw, doorH + tw, doorW / 2 + tw / 2, doorH / 2 + tw / 2);
      addTrimBar(doorW + tw * 2, tw, 0, doorH + tw / 2 + tw / 2);
      frameScene(doorW, doorH);
      lastDims = { w: doorW, h: doorH };
    }

    if (doorMeshGroup) doorGroup.remove(doorMeshGroup);
    doorMeshGroup = new THREE.Group();

    const baked = bakeDoorTexture(style, colorHex, cols, hasWindow, doorW, doorH, loadedWindowImg, windowLayout, winRowIdx);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      map: baked.texture, color: 0xffffff, roughness: 0.5, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.25
    });
    const flatMat = new THREE.MeshPhysicalMaterial({
      color: colorHex, roughness: 0.5, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.25
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, baseDepth), bodyMat);
    base.position.set(0, doorH / 2, 0);
    base.castShadow = true; base.receiveShadow = true;
    doorMeshGroup.add(base);

    if (style === 'cassette') {
      for (let r = 0; r < ROWS; r++) {
        if (hasWindow && r === winRowIdx) continue;
        for (let c = 0; c < cols; c++) {
          const x = baked.pad + c * (baked.cellW + baked.gapX);
          const y = baked.pad + r * (baked.cellH + baked.gapY);
          const inset = baked.cellW * 0.13;
          const w = baked.toWorld(0, 0, baked.cellW - inset * 2, baked.cellH - inset * 2);
          const pos = baked.toWorld(x + inset, y + inset, baked.cellW - inset * 2, baked.cellH - inset * 2);
          const panel = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, RAISE), flatMat);
          panel.position.set(pos.cx, pos.cy, baseFrontZ + RAISE / 2);
          panel.castShadow = true; panel.receiveShadow = true;
          doorMeshGroup.add(panel);
        }
      }
    } else if (style === 'raised-ranch') {
      for (let r = 0; r < ROWS; r++) {
        if (hasWindow && r === winRowIdx) continue;
        const yTop = baked.pad + r * (baked.cellH + baked.gapY);
        const vInset = baked.cellH * 0.1;
        const hInset = baked.cellW * 0.02;
        const y = yTop + vInset;
        const bandH = baked.cellH - vInset * 2;
        const bandW = baked.texW - baked.pad * 2 - hInset * 2;
        const w = baked.toWorld(0, 0, bandW, bandH);
        const pos = baked.toWorld(baked.pad + hInset, y, bandW, bandH);
        const band = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, RAISE), flatMat);
        band.position.set(pos.cx, pos.cy, baseFrontZ + RAISE / 2);
        band.castShadow = true; band.receiveShadow = true;
        doorMeshGroup.add(band);
      }
    } else if (style === 'carriage-short' || style === 'carriage-long') {
      const n = style === 'carriage-long' ? 6 : 3;
      const stileWpx = Math.max(20, (baked.texW - baked.pad * 2) * 0.02); // matches the texture's barW
      const braceScale = doorW / baked.texW;
      baked.bodySegments.forEach(([bodyTopPx, bodyBottomPx]) => {
        for (let i = 1; i < n; i++) {
          const xPx = baked.pad + ((baked.texW - baked.pad * 2) / n) * i - stileWpx / 2;
          const w = baked.toWorld(0, 0, stileWpx, bodyBottomPx - bodyTopPx - 16);
          const pos = baked.toWorld(xPx, bodyTopPx + 8, stileWpx, bodyBottomPx - bodyTopPx - 16);
          const stile = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, RAISE), flatMat);
          stile.position.set(pos.cx, pos.cy, baseFrontZ + RAISE / 2);
          stile.castShadow = true; stile.receiveShadow = true;
          doorMeshGroup.add(stile);
        }
        [bodyTopPx + 8, bodyBottomPx - 8].forEach((yPx) => {
          const w = baked.toWorld(0, 0, baked.texW - baked.pad * 2, stileWpx);
          const pos = baked.toWorld(baked.pad, yPx - stileWpx / 2, baked.texW - baked.pad * 2, stileWpx);
          const rail = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, RAISE), flatMat);
          rail.position.set(pos.cx, pos.cy, baseFrontZ + RAISE / 2);
          rail.castShadow = true; rail.receiveShadow = true;
          doorMeshGroup.add(rail);
        });
        const leaves = Math.max(1, Math.round(cols / 4));
        const leafWpx = (baked.texW - baked.pad * 2) / leaves;
        const braceLenPx = Math.hypot(leafWpx - 28, bodyBottomPx - bodyTopPx - 24);
        for (let i = 0; i < leaves; i++) {
          const lxPx = baked.pad + i * leafWpx;
          const centerPx = { x: lxPx + leafWpx / 2, y: (bodyTopPx + bodyBottomPx) / 2 };
          const pos = baked.toWorld(centerPx.x, centerPx.y, 0, 0);
          const brace = new THREE.Mesh(new THREE.BoxGeometry(braceLenPx * braceScale, stileWpx * braceScale * 0.85, RAISE), flatMat);
          brace.position.set(pos.cx, pos.cy, baseFrontZ + RAISE / 2);
          brace.rotation.z = Math.atan2(bodyBottomPx - bodyTopPx - 24, leafWpx - 28);
          brace.castShadow = true; brace.receiveShadow = true;
          doorMeshGroup.add(brace);
        }
      });
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.16, 12),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.6 })
      );
      handle.rotation.z = Math.PI / 2;
      handle.position.set(doorW / 2 - doorW / cols * 0.3, doorH * 0.42, baseFrontZ + RAISE + 0.025);
      handle.castShadow = true;
      doorMeshGroup.add(handle);
    }

    if (hasWindow) {
      addWindowRow(doorMeshGroup, baked, loadedWindowImg, windowLayout, cols);
    }

    doorGroup.add(doorMeshGroup);
  }

  let running = true;
  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return {
    update,
    pause() { running = false; },
    resume() { if (!running) { running = true; animate(); } },
    resize,
    dispose() {
      running = false;
      resizeObserver.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}
