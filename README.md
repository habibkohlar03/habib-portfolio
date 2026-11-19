# Habib Ullah: 3D Developer Portfolio

Interactive developer portfolio: white background, orange brand (matches the HU logo), charcoal text, full-body 3D assistant.
Built with React, Vite, Three.js, React Three Fiber, Drei, GSAP, Framer Motion, Tailwind CSS and Lucide icons.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into /dist
npm run preview    # serve the production build locally
```

Requires Node 18+ (Node 20 or 22 recommended).

## Where to edit things

Nothing about content is hard-coded in components. Edit these files:

| What | File |
|---|---|
| Name, title, intro, About text | `src/data/site.js` |
| **Contact details + form endpoint** | `src/data/contact.js` |
| **Avatar GLB / voice MP3 switches** | `src/data/assets.js` |
| **Projects** (names, descriptions, URLs, images, tech) | `src/data/projects.js` |
| Skills, Services | `src/data/skills.js`, `src/data/services.js` |
| Experience / role history | `src/data/experience.js` |
| Process steps, "Why work with me" | `src/data/process.js` |
| Colors, fonts | `tailwind.config.js`, `src/index.css` |

### Placeholder policy

Only information you provided is shown as fact. Anything missing is labelled on the page:

- Projects: only the 8 names are filled in. Descriptions, roles, tech, URLs and screenshots are empty and show **"Details pending"**. A card drops the badge once `description` is filled in.
- Experience: shows "2 years" and your listed focus areas. The role timeline shows **"Role history pending"** until you add entries to `timeline`.
- Contact: each empty method shows **"Not added yet"** (no broken links).
- Experience, results, ratings and testimonials are never invented. No proficiency percentages are shown for skills.

## Contact form (not connected yet)

The form is disabled and says so until you set an endpoint in `src/data/contact.js`:

1. Create a form with a service that accepts a JSON POST (Formspree, Getform, Basin, or your own Vercel function).
2. Put its URL in `contactForm.endpoint`.
3. Run the site, submit a real test message, and confirm it **arrives in your inbox**.
4. Only then set `contactForm.deliveryVerified = true`.

Until step 4, the success message says the submission was *accepted by the form service* and never claims the message was delivered.

## Design system (white + orange)

Light theme matching the HU logo: white surfaces, charcoal text, orange brand `#ff6a00`. Colors live in `tailwind.config.js` (`brand`, `signal` for orange text, `ink-*` surfaces, `slate-*` greys); component styles (`.btn-primary`, `.btn-ghost`, `.hud-card`, `.chip`) are in `src/index.css`. Primary buttons use charcoal text on the bright orange (6.3:1 contrast; white would be 2.9:1). All text and button color pairs were checked against WCAG AA (4.5:1).

Logo files are in `public/brand/` (`logo-full.webp`, `logo-mark.webp`, favicon and touch icon). They come from your transparent PNG, unretouched.

## Full-body animated assistant and voice introduction

The hero shows `public/models/avatar.glb` (your Avaturn **T2** model) as a full-body character, head to feet.

Sequence: **run in from the background -> slow to a stop facing the visitor -> idle -> talking (while `intro.mp3` plays) -> idle again**, with continuous blends (no jumps). **Stop** silences the audio at once, rewinds it, returns the mouth and face to neutral and the body to idle.

### What the T2 file contains (checked on the real file)

| Feature | Result |
|---|---|
| Skeleton | 54 joints, Mixamo-style names, including `LeftEye` / `RightEye` |
| Face morph targets | 72 in the original: all 15 Oculus `viseme_*`, ARKit shapes (`jawOpen`, `mouthFunnel`, `mouthPucker`, `eyeBlinkLeft/Right`, `eyeLook*`, `brow*`, `mouthSmile*`...). 56 kept after optimization |
| Animation clips | one: `avaturn_animation`, an 8 s seamless standing idle (rotation tracks) |
| Running clip | **none**: the run is procedural (see below) |

### How it works

- **Mouth**: the timeline in `public/audio/intro.visemes.json` (prefetched at page load) is read against the audio clock and drives the model's `viseme_*` targets. When the audio ends or Stop is pressed, every mouth/expression weight eases back to neutral within about 0.1 s.
- **Timeline source**: Rhubarb Lip Sync cannot run in the build sandbox, so the shipped timeline comes from `tools/make-viseme-timeline.py`, an acoustic analysis of your recording (vowel formants, fricatives, closures, pauses). Pause/rest timing was cross-checked against an independent detector (96-99% agreement). Vowel and consonant shapes are heuristic, **not** phoneme recognition. For phoneme-level accuracy run the **Generate Rhubarb lip-sync timeline** workflow from the GitHub Actions tab (untested; it replaces the file).
- **Face**: blinking (`eyeBlinkLeft/Right`), eye saccades and gaze toward the cursor (`eyeLook*`), brows lifting on emphasis, a light smile.
- **Body**: the GLB's own idle clip provides the standing pose. The entrance run, the speaking stance and five gestures (chosen so the last two are never repeated) are procedural poses layered on top (`src/components/avatar/motion/`).
- **Audio** (`src/audio/useIntroAudio.js`): `intro.mp3` and the timeline are loaded at page load, independent of the 3D scene. Play starts the audio immediately (no 3D or lip-sync work happens first). Duplicate playback is prevented and playback errors show a message.

### Loading speed

- Model 13.97 MB -> 3.30 MB (about 2.3 MB gzipped), 56 morph targets stored sparsely, textures resized.
- After first paint (browser idle) the page fetches the 3D code and the model file in parallel at low priority; until the model is ready the silhouette placeholder is shown. One WebGL canvas only; it pauses when scrolled out of view and the pixel ratio adapts to the frame rate. Resources are disposed when the avatar unmounts.
- Phones and weak devices use the `low` tier (no particles, no cursor look); no-WebGL, reduced-motion and data-saver visitors get the audio-only introduction.

Tuning: `assets.avatar` (height, offset), `assets.stage` (framing), entrance timing in `src/components/avatar/motion/entrance.js`.

### Real motion clips (optional)

For a natural *run*, add a Mixamo running clip: see `public/animations/README.md`. Clip playback is implemented but **not yet tested with a real clip**.

## Performance and accessibility notes

- The 3D bundle (three, r3f, drei) is a lazy chunk loaded when the browser is idle, after the headline and buttons have painted.
- Three quality tiers (`src/hooks/useQualityTier.js`): `static` (no WebGL: reduced motion, data-saver, no WebGL), `low` (phones, tablets, weak devices: lighter scene, no particles, capped pixel ratio), `high` (capable desktops).
- The canvas stops rendering when the hero is off-screen; pixel ratio steps down if frame rate drops.
- Reduced-motion visitors get no scroll animations and a static avatar; phones get shorter reveals.
- Semantic landmarks, skip link, visible focus states, labelled controls, keyboard-operable menu (Esc closes).
- Fonts load from Google Fonts. For best Core Web Vitals you can self-host them later.

## Deploy

```bash
git init && git add . && git commit -m "Initial portfolio"
# create a GitHub repo, then:
git remote add origin <your-repo-url>
git push -u origin main
```

Import the repo in Vercel. `vercel.json` already sets the build config and caching headers. No environment variables are required.

Before launch, also add: a canonical URL, `og:url` / `og:image` (a share image), a sitemap, and your real contact details.

## Project structure

```
src/
  App.jsx, main.jsx, index.css
  audio/        useIntroAudio, IntroPlayer, lipsync
  components/
    layout/     Navbar, Footer, ScrollProgress
    three/      AvatarScene, StudioStage, PlaceholderAvatar, GlbAvatar, AvatarFallback, SceneErrorBoundary
    ui/         Section, Badge, TiltCard
  data/         all content, contact and asset config
  hooks/        useMediaQuery, useReducedMotion, useQualityTier, useScrollAnimations
  lib/          contactMethods
  sections/     Hero, About, Skills, Services, Projects, Experience, Process, WhyMe, Contact
public/         favicon, robots.txt, models/, audio/, images/projects/
```

## Manual test checklist

- [ ] `npm run build` completes with no errors
- [ ] Hero: headline and buttons appear immediately; 3D avatar appears shortly after
- [ ] Nav links scroll to every section; active link highlights; mobile menu opens/closes (button and Esc)
- [ ] Projects: 8 cards, each marked "Details pending"
- [ ] Resize to ~375px: no horizontal scroll, avatar still visible, text readable
- [ ] OS "reduce motion" on: static avatar, no scroll animations
- [ ] Keyboard only: Tab reaches every control with a visible focus ring
- [ ] Lighthouse (mobile): check Performance, Accessibility, SEO
- [ ] Hero: the avatar appears (full head and upper body) at phone, tablet and desktop widths
- [ ] Press **Play Introduction**: audio plays and the avatar's mouth moves in sync; **Stop** stops both
- [ ] Break the audio path on purpose (rename intro.mp3): a clear error message and a **Try again** button appear
- [ ] `public/sdk/viseme-model.bin` exists and loads (DevTools > Network, no 404)
- [ ] After connecting the form: test submission arrives in your inbox

## Contact form (Resend) setup

1. Vercel -> Project -> Settings -> Environment Variables: add `RESEND_API_KEY` (your Resend key), for Production, then **redeploy**.
2. Sender: by default mail is sent from `onboarding@resend.dev`, Resend's test sender. It can ONLY deliver to the email
   address your Resend account is registered with. Either register Resend with `habibwebdeveloper3@gmail.com`, or set
   `CONTACT_TO` to your Resend account email, or (recommended) verify a domain at resend.com/domains and set
   `CONTACT_FROM` to e.g. `Portfolio Contact <contact@yourdomain.com>`.
3. Optional `CONTACT_TO` (default habibwebdeveloper3@gmail.com) and `CONTACT_DEBUG=1` (enables `GET /api/contact`, a status
   check that never shows the key).
4. If sending fails, open Vercel -> Deployments -> Functions/Logs and look for `[contact]` lines: they state the exact
   Resend error and what to change. Visitors only ever see a generic message.

## Project screenshots

Run GitHub -> Actions -> "Capture project screenshots" (it also runs automatically when `src/data/projects.js` changes).
It saves a real homepage screenshot per project to `public/images/projects/<id>.webp`; existing images are kept.
