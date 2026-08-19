# Session Handoff — Door Builder: Three.js live-3D preview

Is file ko naye Claude Code session mein paste/refer kar dena. Ye file purani wali
`SESSION_HANDOFF.md` ko poori tarah replace kar rahi hai (purani wali ka canvas-based
plan ab obsolete ho chuka hai — hum us approach se aage nikal kar Three.js pe shift ho
chuke hain, neeche wajah aur poori history hai).

---

## Project

`c:\Users\PC\OneDrive\Desktop\garage-door` — Garage Door Lift, ek catalog/marketing
website. Stack: plain HTML/CSS/JS (no build step) + Node/Express/SQLite backend in
`server/`. Run: `cd server && npm install && npm start` → `http://localhost:3000`.
(Note: is session ke aakhir mein server routing mein ek external/khud-ba-khud change
dikha — `/builder.html` ab `/builder` pe 301 redirect karta hai. Ye maine nahi kiya,
system ne khud modify kiya tha — dono URLs kaam karte hain, iski wajah se pareshan
mat hona.)

---

## Bohot mukhtasar: ab tak site pe kya ban chuka hai (stable, is session ka focus nahi)

- Site-wide design polish: login/signup split layout, header/footer redesign, about
  page.
- Saare 5 product lines (`product-panel.html`, `product-flush.html`,
  `product-overlay.html`, `product-glass.html`, `product-grille.html`) PDF catalog ke
  mutabiq real images ke saath rebuild ho chuki hain. Ye sab STABLE hai, is session
  mein ismein koi kaam nahi hua.

---

## MAIN FOCUS: Door Builder tool — poori history (yahan dhyan se padhna)

User ne CHI DoorVisions (`doorvisions.chiohd.com`) jaisa "design your own door"
configurator maanga tha — sab 5 product lines ke liye: size/model/style/color/windows
choose karo, live preview dekho, quote request submit karo.

### Phase 1 — Canvas photo-compositing (ban chuka hai, ab BAND-i history)

Pehle ek 2D Canvas-based system banaya tha (real photo texture + `multiply` blend
color tint + vector pattern overlay + real window images). Isko bohot iterate kiya —
front-facing pattern visibility, window "torn/cropped" bugs, window row height, sab
fix kiye. **Phir poora builder.js ko extend kiya taake saare 5 lines support ho**
(`LINES` data structure — Insulated Panel/Modern Flush/Overlay/Glass/Aluminum
Grille), har line ke apne model/style/color/window options, dynamic step wizard jo
sirf relevant steps dikhata hai. Panel line ko hi photorealistic canvas mila, baaki 4
lines ko simple "schematic" preview (flat color box).

**Ye poora canvas system ab DELETE ho chuka hai** — Phase 2 mein Three.js se replace
kar diya. Agar kahin purani canvas-related functions (`drawDoorCanvas`,
`drawPatternOverlay`, `MATERIAL_SWATCH` waghera) ka zikr mile purani memory/plans mein,
wo ab **exist nahi karte**.

### Phase 2 — CHI research + Three.js decision (yahi ab active hai)

User ne poocha "hum CHI jaisa tool kyun nahi bana sakte" — maine `doorvisions.chiohd.com`
ko Playwright se research kiya:
- Shuru mein laga ke CHI ek **pre-rendered photo library** use kar raha hai
  (`chi-api.renoworks.com/data/CHI/product/renders/{code}.jpg`).
- User ne sahi shak kiya ke ye **live-rendering** ho sakti hai — maine dobara test
  kiya: same selections do baar try kiye, do alag numeric codes aaye (`26776639` vs
  `773994939`) — ye **confirm karta hai ke ye live/on-demand render hai**, fixed
  catalog lookup nahi.
- Renoworks pricing dekhi: public self-serve tier ~CA$39/user/month (Capterra pe),
  lekin CHI jaisi enterprise API integration ki pricing publicly available nahi hai
  (custom quote lagta hai) — humare paas budget/infrastructure nahi hai isliye.

**Faisla:** Free/open-source **Three.js** (WebGL) se apna khud ka live 3D renderer
banayenge — Renoworks jitna polished nahi hoga (unke paas professional 3D artists
hain), lekin genuine live-3D hai, paisa nahi lagta.

### Phase 3 — Three.js prototype (`3d-prototype.html`)

Standalone demo page banai, `http://localhost:3000/3d-prototype.html` — sirf
Insulated Panel styles test karne ke liye (nav mein link nahi hai, seedha URL se
kholna).

**Bugs jo mile aur fix kiye:**
1. **Front-view visibility bug** (bohot important, do baar aaya): jab camera seedha
   door ke saamne hota hai, raised 3D box ka front-face aur base surface same
   direction light face karte hain — shadow contrast almost ghayab ho jata hai.
   **Fix:** texture mein hi ek permanent **do-tone "recess" effect** bake kiya (jahan
   panel raised nahi hai wahan color ko ~22% darken kar diya) — ye kisi bhi
   angle/lighting pe hamesha dikhta hai, real-time shadow pe depend nahi karta.
2. Carriage style ke vertical stiles/braces bohot patli (10px) thi, isliye dikhti hi
   nahi thi — width badha kar `barW = max(20, totalW*0.02)` kiya, aur texture ke
   stroke ko bhi bold/high-contrast kiya (`strokeRaisedBar` helper).

### Phase 4 — Real page integration (`builder.html` + `js/builder.js`)

3D renderer ko shared module `js/builder-3d.js` mein nikala (dono
`3d-prototype.html` aur real `builder.html` isi ek file ko import karte hain — ek
jagah fix karo, dono jagah fix ho jata hai).

- Sirf **Panel line** ko 3D milta hai; baaki 4 lines schematic preview use karte hain
  (jaisa pehle tha).
- Three.js sirf tab load hota hai (dynamic `import()`) jab user Panel line choose
  kare — baaki lines is cost se bachi rehti hain.
- `builder.html` mein `<script type="importmap">` add kiya (three.js CDN paths).

**Integration bugs jo mile aur fix kiye:**
1. Line switch karne pe (Panel → koi aur line → wapas Panel) preview **blank white ho
   jata tha**. Wajah: schematic preview render karte waqt `el.innerHTML = ...` poore
   `#builder-preview` ko clear kar deta tha, jisse 3D wala persistent mount
   (`#door3d-mount`) bhi DOM se destroy ho jata — lekin JS variable `door3d` ab bhi
   ek DETACHED canvas ko refer kar raha hota. **Fix:** ab `#builder-preview` ke andar
   DO permanent sibling divs hain (`#door3d-mount`, `#schematic-mount`) jo kabhi
   innerHTML se replace nahi hote, sirf `hidden` attribute se toggle hote hain.
2. Upar wale fix ke baad, DONO mounts EK SAATH visible ho gaye (overlap). Wajah: yahi
   project mein pehle bhi aa chuka bug — `.schematic-mount { display:flex }` CSS
   rule ne `[hidden] { display:none }` UA default ko override kar diya (same
   specificity, baad wala rule jeet gaya). **Fix:** explicit
   `.schematic-mount[hidden] { display:none }` add kiya (isi pattern ka istemal
   `.builder-resume-banner` aur `.builder-custom-size` ke liye bhi is project mein
   pehle se ho chuka hai).

### Phase 5 — Window bugs (SABSE RECENT, abhi filhaal fix hua)

User ne 2 bade bugs report kiye:
1. **Wide windows chhote door pe disable ho jati thi** — purana system `minCols`
   field use karta tha (jaise strip-layout windows ko `minCols:6` diya tha, Single
   Door sirf 4 cols hai to wo greyed-out ho jati thi). User ne kaha: koi bhi window
   kabhi bhi disable nahi honi chahiye, bas jo bhi size ho usi ke hisab se
   adjust/stretch ho jani chahiye.
   **Fix:** `minCols` field poori tarah hata diya (data se bhi, gating logic se
   bhi — `enforceWindowFit()` function bhi delete kiya). Ab HAR window HAMESHA
   selectable hai.
2. **3D preview mein window ka asli design kabhi dikhta hi nahi tha** — chahe koi
   bhi window select karo, hamesha ek generic flat blue-grey glass box dikhta tha.
   Wajah: window ki asli image kabhi texture mein load/draw hi nahi ki gayi thi.
   **Fix:** `js/builder-3d.js` mein image preload/cache system add kiya, aur
   `bakeWindowCanvas()` function likha jo:
   - `layout:'strip'` windows (jo already ek poori double-door-row jaisi composed
     image hain) ko poora, bina crop kiye, stretch kar deta hai jitni bhi row width
     ho.
   - `layout:'unit'` windows (single self-contained icon) ko har column mein
     contain-fit se tile karta hai.
   Ye texture body-texture ke window-row area mein bhi draw hoti hai, AUR ek dedicated
   3D glass mesh (ab per-column nahi, POORI row span karta hua EK frame + EK glass) pe
   bhi `map` texture ki tarah lagti hai — taake real glass material (transmission,
   reflection) ke saath asli pattern dikhe.

**Ye sab test kiya gaya hai (Playwright se) aur kaam kar raha hai** — Single Door aur
Double Door dono pe, saari 16 windows (koi disabled nahi), har ek apna sahi/alag
design dikhati hai.

---

## ABHI JO ADHOORA HAI — agle session mein yahan se shuru karna

User ne khud confirm kiya ke abhi window ka "3D" sirf ek **flat glass box + upar
image texture** hai — window ka OUTLINE hamesha plain rectangle hi hai (jaise
"Mountain-Like" ka box bhi ek plain rectangle hai jispe mountain-shape ki IMAGE chaspa
hai, asli 3D-sculpted mountain-shape nahi hai). Isse compare karo door PANELS se
(Cassette boxes, Carriage stiles/braces, Ranch bands) — wo genuinely real 3D
`BoxGeometry` hain, sahi shape/position ke saath.

**Next task:** Har window design ke liye **asli 3D geometry** banao (image-texture ki
jagah, ya uske saath) — jaise glass ka OUTLINE khud mountain/diamond/fan-shape ho, na
ke ek plain box jispe shape ki tasveer ho.

### Implementation ka suggested approach (agle session ke liye)

1. **16 designs ko families mein group karo** (poori tarah bespoke 16 shapes banane
   ki bajaye) — purane 2D/SVG system mein ye classification already thi (`preview`
   field: `plain`, `grid`, `grid-circle`, `diamond`, `arch`, `fan`) is session ke
   pehle wale phase mein use hoti thi, phir asli image-based system aane par hata di
   gayi thi. Wahi concept reuse karo:
   - `plain`/`grid` → simple rectangle (already trivial, BoxGeometry hi kaafi hai)
   - `diamond` → diamond-outline shape
   - `arch`/`grid-circle` → arched-top ya domed shape (Mountain-Like, House-Like
     jaisi)
   - `fan` → sector/sunburst radiating shape (Sector Window A/B, Sun Rising,
     Radiation Window)
   Har family ke liye EK parametric `THREE.Shape` banao, `THREE.ExtrudeGeometry` se
   3D nikalo (thickness/bevel ke saath glass jaisa look).
2. Har window entry (`LINES.panel.windows` array, `js/builder.js` mein) ko wapas ek
   `family` field do (jaisa purana `preview` field tha).
3. `js/builder-3d.js` mein window mesh banate waqt: `layout` (unit/strip) ke sath-sath
   `family` bhi check karo, aur us family ke corresponding `THREE.Shape` se geometry
   banao (image texture ab bhi `map` ki tarah use ho sakti hai UPAR se, ya phir glass
   material ka color match karne ke liye — decide karna hoga kya zyada real lagta
   hai: (a) sculpted shape + flat glass color/tint, ya (b) sculpted shape + upar wahi
   image bhi texture ki tarah).
4. Test Playwright se — jaisa is poore session mein hota raha (`scratchpad` mein test
   script likho, screenshots lo, front-on aur rotated dono angles check karo).

**Zaroori:** Ye kaam SIRF Panel line ke 3D window ke liye hai. Baaki 4 lines
(Flush/Overlay/Glass/Grille) abhi bhi schematic preview use karti hain — unhe 3D dena
is session mein kabhi discuss nahi hua, scope mein mat lena jab tak user na kahe.

---

## Files jo is Three.js kaam mein touch hui hain

- `js/builder-3d.js` — **naya file**, poora 3D renderer (material/texture baking,
  panel geometry per style, window texture baking, scene/camera/lighting setup,
  mount/update/pause/resume/resize API). Shared by prototype aur real page dono.
- `3d-prototype.html` — **naya file**, standalone demo (nav mein link nahi, seedha
  URL se test karo).
- `js/builder.js` — bohot bada rewrite. `LINES` data structure (5 lines), dynamic
  step wizard, `door3dPayload()` function jo current state se 3D renderer ke liye
  payload banata hai, `showDoor3D()`/`getMount()` mount-management functions.
- `builder.html` — importmap script tag, do mount divs.
- `css/style.css` — `.door3d-mount`, `.schematic-mount` (aur uska `[hidden]` fix).
- `server/routes/builder.js` — validation relaxed (Line/Size/Color hi required hain
  ab, Model/Style/Windows optional hain kyunki har line ke paas nahi hote).

---

## Zaroori context jo naye session ko pata hona chahiye

- User Roman Urdu mein baat karta hai, usi mein jawab dena.
- User bohot hands-on hai — screenshot le kar exact bug dikhata hai, expect karta hai
  ke turant fix ho aur turant Playwright se visually verify ho, sirf code likh kar mat
  chhod dena.
- **Is session mein bohot saare "same class ke bugs" bar-bar aaye hain** — dhyan
  rakhna: (a) `[hidden]` attribute ko CSS `display:flex/grid` override kar deta hai
  jab tak explicit `.class[hidden]{display:none}` na ho, (b) `el.innerHTML = ...` se
  koi persistent child (jaise 3D canvas mount) accidentally destroy ho sakta hai agar
  wo us `el` ke andar tha.
- Server: `curl -sf http://localhost:3000/builder.html` (ya `/builder`) se check karo
  pehle, warna `cd server && npm start` background mein chalao. Route changes ke baad
  server RESTART chahiye hota hai (node hot-reload nahi karta).
- Har visual change ke baad Playwright se verify karna — pattern is poore session mein
  established hai: `scratchpad` directory mein chhota test script likho
  (`chromium.launch()`, `page.goto()`, click through steps, `screenshot()`), phir
  screenshot Read tool se dekho.
- Is task ke bare mein user ne explicitly kaha: **"alag session mein banana hai, ye
  session bilkul full hone wala hai"** — matlab naya session isi Window-3D-geometry
  task se seedha shuru ho sakta hai, bina extra clarification maange (scope upar
  clearly likh diya hai).
