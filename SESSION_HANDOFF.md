# Session Handoff — Door Builder Realism Fix

Is file ko naye Claude Code session mein paste/refer kar dena. Neeche poora context hai: ab tak kya ho chuka hai, aur abhi kya adhoora hai.

---

## Project

`c:\Users\PC\OneDrive\Desktop\garage-door` — Garage Door Lift, ek catalog/marketing website. Stack: plain HTML/CSS/JS (no build step) + Node/Express/SQLite backend in `server/`. Run: `cd server && npm install && npm start` → `http://localhost:3000`.

---

## Ab tak jo kaam ho chuka hai (is session mein)

### 1. Site-wide design polish
- Login/Signup pages: split layout (photo panel + form panel)
- Header: bada logo, segmented nav with pill hover, brand tagline
- Footer: yellow top accent, giant faint wordmark watermark, column dividers
- About page: stats row, tag overlay on image, fixed a CSS specificity bug

### 2. Saare 5 product lines PDF catalog ke mutabiq rebuild kiye
PDF source tha: `C:\Users\PC\Downloads\catalog Garage Door Lift wo.pdf` (aur JPG exports usi Downloads folder ke andar sub-folders mein).

- **product-panel.html (Insulated Panel)** — reference/template page, sabse pehle poora banaya: Door Styles (8 real icons: Classic Cassette/Carriage Short/Raised Ranch/Carriage Long x single/double, PDF se), Hardware (4 real photos: Torsion Spring/Track&Angle/Roller/Hardware Box), Window Options (16 real window images — codes CH-WD1001 se CH-WD3008 tak), Types of Glass (Clear/Frost real photos), Surface Texture (3 wood-grain swatches: Black/White/Almond)
- **product-flush.html (Modern Flush)** — 1 model, 1 style (Flush, apna icon), 8 colors, Windows section (Slim/Standard, custom yellow-ribbon layout, PDF jaisa)
- **product-overlay.html (Overlay)** — Door Styles ab 35 real product-code-named images (6400/6500/6600/7100/7200 SERIES), Windows sirf 6 (WD3003-3008, Overlay ki apni), Glass types (Clear/Frost/Black Laminate — Black Laminate ki photo internet se li), Door Models section poori tarah hata di gayi
- **product-glass.html (Glass)** — 3 models (SF3500/3520/3540, real photos, uniform size `.model-card.photo`), Door Styles (SE3500/SE3520, real images, ab side-by-side row layout), "Types of Glass" ko "FRAME DOOR DESIGNS" naam se yellow-ribbon banner + 7 real glass-type images (car-through-window style) mein rebuild kiya, "THE DETAILS ARE IMPORTANT" section add kiya (SF3540 fusion detail, 2 real photos), Windows/Hardware sections hata di gayi. **Colors section abhi bhi placeholder hai** — user ne jo 4 color images di thin (Black/Bronze/Chocolate/White) wo sab EK HI blank/duplicate image thi (same MD5 hash) — user ne kaha "same hi use kar lo", to abhi chaaron cards mein wahi ek image lagi hai. Jab sahi 4 alag photos milen to update karni hain.
- **product-grille.html (Aluminum Grille)** — Door Styles + Window options + Hardware + Types of Glass sections hata di gayi (PDF mein in ka distinct content nahi tha). "Aluminum Grille Doors Features" naya section (numbered features + Product Detail specs + 2 real photos, apna khud ka design, reference jaisa copy nahi). "Door Models" → "Aluminum Grille Models" naam diya, real photo + descriptive paragraph add kiya. Banner/hero image bhi real photo se update ki.

Sab images `C:\Users\PC\Downloads\` ke various sub-folders se aayi hain (user step-by-step deta raha), `assets/` folder mein descriptive names se save hain.

### 3. Door Builder tool (BADA FEATURE — abhi adhoora hai, isi pe kaam chal raha tha)

User ne CHI DoorVisions (`doorvisions.chiohd.com`) jaisa ek "design your own door" configurator maanga — step-by-step size/model/style/color/windows choose karo, live preview dekho, phir quote request submit karo (PDF banti hai, email stub hai abhi).

**Poora plan mode se pass hua tha, approved plan yahan hai:** `C:\Users\PC\.claude\plans\gentle-puzzling-tiger.md`

**Ab tak bana hua hai (v1 scope = sirf Insulated Panel line):**
- `builder.html` — 7-step wizard (Size → Model → Style → Color → Windows → Review → Request a Quote), progress bar, resume-banner
- `js/builder.js` — CONFIG data (sizes/models/styles/colors/16 windows), state + localStorage autosave/resume, step navigation, quote form validation, submit handler
- `server/routes/builder.js` — POST `/api/builder/quote` (validation, PDF generation via `pdfkit`, DB save), GET `/api/builder/quote/:publicId/pdf`
- `server/db.js` — naya table `builder_quotes`
- `server/mailer.js` — stub (sirf console.log karta hai, real SMTP baad mein add hoga jab user credentials de)
- `css/style.css` — naya `/* door builder */` section
- Nav link "BUILD A DOOR" sab 12 pages pe + CTA button `product-panel.html` ke hero pe

**Fix kiye gaye bugs (is session mein):**
1. Form `id="quote-form"` contact.html ke form se clash kar raha tha (main.js ka purana handler bhi trigger ho jata tha) — id `builder-quote-form` kar diya
2. `.builder-resume-banner` aur `.builder-custom-size` CSS mein `display:flex/grid` set tha jo HTML ke `[hidden]` attribute ko override kar raha tha — `[hidden] { display:none }` explicit add kiya
3. Reload ke baad "Resume" click karne pe user galat step pe chala jata tha kyunki `init()` localStorage ko fresh state se overwrite kar deta tha ISSE PEHLE ke user resume/discard choose kare — `showStep(stepId, {persist})` param add kiya
4. Success screen ka grid layout tootta tha jab preview-column hide hoti thi (grid item display:none hone se doosra item galat column mein chala jata tha) — `.builder-grid.is-success { grid-template-columns:1fr }` class add ki
5. PDF ka disclaimer text page 2 pe overflow ho raha tha — y-position adjust ki
6. Custom width/height inputs plain unstyled the — site ka `.form input` jaisa style diya
7. Style step (Classic Cassette/Carriage Short/Raised Ranch/Carriage Long) mein images nahi thin, sirf text buttons the — existing assets (`assets/style-icon-*.png`) use kar ke real icons add kiye
8. **Window selection preview bug**: koi bhi window select karo, preview mein hamesha ek hi generic cross-mullion pattern dikhta tha (change hi nahi hota tha) — har window ko ek "family" (plain/grid/grid-circle/diamond/arch/fan) diya aur `windowOverlay()` function likha jo family ke hisab se alag SVG shape banata hai. "No Windows" option ko bhi ab X/cross icon mila (pehle khali tha)

---

## ABHI JO ADHOORA HAI — yahan se continue karna hai

User ne live preview dekh kar kaha ke ye "flat/schematic drawing" jaisa lagta hai, CHI ke reference tool jaisa "real" nahi lagta (unhone apni site ke 2 screenshots aur CHI ke screenshots compare karke dikhaye).

Maine 3 approaches suggest kiye (AskUserQuestion se), **user ne Option A choose kiya:**

> **Canvas photo-compositing**: Ek neutral (light grey/white) real panel-texture photo lenge (har style ke liye), Canvas API se selected color ka realistic tint lagayenge (`globalCompositeOperation = 'multiply'` — jaise photo editing mein multiply blend, jo texture/shading preserve karte hue color tint karta hai), aur real window images upar overlay karenge. Size (single/double/custom) dynamic rahegi.

**Maine shuru kiya tha:**
- Web search (Unsplash/Pexels via WebFetch) se "neutral, straight-on, evenly-lit, tileable garage door panel texture photo" dhoondne ki koshish ki — **kaamyabi nahi mili**, kyunki real stock photos zyada tar angle se li gayi hoti hain, environmental shadows ke saath, "flat tileable texture" jaisi nahi hoti. Ye bilkul waisi hi mushkil thi jaisi is session mein pehle "clear glass swatch" dhoondte waqt aayi thi.
- Agla qadam ye tha ke maine already-downloaded local assets check karne shuru kiye the (interrupt ho gaya): `assets/door-white-carriage.png`, `assets/door-white-panel.png`, `assets/panel-raised.png`, `assets/panel-ranch.png`, `assets/panel-closeup.png`, `assets/style-carriage-long.png` waghera — dekhna tha ke in mein se koi "neutral base texture" ke tor par kaam aa sakta hai ya nahi (ye already is site pe kahin aur use ho rahi real AI-generated photos hain).

### Karne wale kaam (naye session mein yahan se shuru karna):

1. **Base texture photos decide karo** — 4 chahiye (Classic Cassette, Carriage Short, Raised Ranch, Carriage Long ke liye), ideally ek single panel-row jo horizontally tile ho sake, halki/white tone mein (multiply blend ke liye best). Options:
   - Existing `assets/` folder ke andar dekho (upar list ki gayi files) — shayad kaam aa jayen
   - Ya user se pooch lo ke wo khud AI-generate kar ke de (jaisa is poori session mein image-sourcing ka established pattern raha hai — user Downloads folder mein images deta raha, main unhe process karta raha)
   - Ya web se aur dhoondo (mushkil hoga, upar wajah likhi hai)

2. **Window images ka mismatch issue** — 16 mein se sirf 6 (CH-WD3003 se CH-WD3008) real photorealistic-style images hain (`assets/window-wd3003.png` se `window-wd3008.png`, jo `C:\Users\PC\Downloads\WINDOW  GLASS SECTIONS` se aayi thin). Baaki 10 (CH-WD1001-1006, 4001-4004) simple 2D flat icon-diagrams hain (PDF se crop kiye gaye the, koi photo nahi). Agar Canvas compositing photorealistic banana hai to in 10 ke liye bhi behtar/real images chahiye hongi — ya to user se maango, ya inko alag treat karo (accept karo ke ye thoda kam "real" dikhenge).

3. **`js/builder.js` mein rendering engine badlo**: abhi `buildDoorSvg()`, `patternOverlay()`, `windowOverlay()` functions SVG bana rahe hain (`js/builder.js` mein, roughly line 106-225 ke aas paas — exact line numbers is file mein dekh lena). Inko replace karna hai ek Canvas-based renderer se:
   - `<canvas>` element `#builder-preview` div ke andar (ya us div ko replace kar ke)
   - Har panel cell ke liye: base texture image draw karo, phir usi jagah color-tint rectangle `globalCompositeOperation='multiply'` ke saath draw karo
   - Top row mein agar window selected hai to real window image us cell ki jagah draw karo (position/scale calculate kar ke)
   - Size (single=4 cols, double=8 cols, custom=proportional) wahi logic jo abhi hai, bas ab canvas grid ke hisab se

4. **Poora flow dobara test karo** — jaisa is session mein pehle bhi kiya (Playwright script se: `cd server && npm start`, phir `builder.html` par step-by-step click kar ke screenshots lo aur verify karo ke naya visual sach mein "real" lagta hai)

---

## Zaroori context jo naye session ko pata hona chahiye

- User Roman Urdu mein baat karta hai, usi mein jawab dena
- User bohot specific hai image quality/accuracy ke baare mein — jab bhi image duplicate/wrong/blank ho, seedha bata dena, chup ke use mat karna
- Har image change ke baad browser mein Playwright se visually verify karna (`npx playwright screenshot` ya local `node_modules/playwright` script scratchpad mein install kar ke) — sirf code likh kar mat chhod dena
- `server/` background mein already chal raha ho sakta hai — pehle `curl -sf http://localhost:3000/index.html` se check karo, warna `cd server && npm start` karo
- Poora approved plan yahan hai agar reference chahiye: `C:\Users\PC\.claude\plans\gentle-puzzling-tiger.md`
