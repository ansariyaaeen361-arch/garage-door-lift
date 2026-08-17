# Garage Door Lift — Project Status

## What this is
A catalog/marketing website for "Garage Door Lift" (residential garage door supplier). Originally imported from a Claude Design mockup (`claude.ai/design`), then rebuilt as a real, working site.

## Stack
- **Frontend:** plain HTML/CSS/JS — no framework, no build step.
- **Backend:** Node.js + Express + SQLite, in `server/` — handles login/signup and quote-request tracking.
- **Run it:** `cd server && npm install && npm start` → open `http://localhost:3000`.
  (Plain `python -m http.server` no longer works for the whole site — login/signup/quotes need the Node backend running.)

## Pages
- `index.html`, `products.html`, `about.html`, `contact.html`
- 5 product detail pages: `product-panel.html`, `product-flush.html`, `product-overlay.html`, `product-glass.html`, `product-grille.html`
- `login.html`, `signup.html`, `account.html` (shows a signed-in user's quote-request history)

## What's implemented
- Full responsive site (dark theme, yellow accent), matching the original design mockup.
- Scroll-reveal animations, hover effects, mobile nav menu.
- Contact form posts to the real backend (`/api/quotes`) and saves to SQLite (`server/data/app.db`).
- Signup/login with bcrypt-hashed passwords + JWT cookie sessions. A signed-in user's quote requests are linked to their account and listed on `account.html`.

## Images
- Live in `assets/` and `uploads/`.
- Most product photos are AI-generated (Gemini), pulled from the user's local `Downloads\genrated image` folder, watermark-removed, and matched to the right spot by content.
- All image containers use natural aspect-ratio sizing (`height: auto`) — nothing is cropped and there's no letterboxing. This took several rounds of CSS iteration based on feedback.
- Home hero is a full-bleed background photo with the headline/CTA overlaid on a dark gradient.

## Known gaps
- One style card ("Carriage Long Double" on `product-panel.html`) still uses an older stock photo — no matching generated image was available for it.
- Footer/contact info (phone, email, area) is placeholder text ("available on request") — needs real details.
- Not deployed anywhere yet — only tested locally via `npm start`.
