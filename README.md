# Habib Ullah: 3D Developer Portfolio

Interactive "Control Room" portfolio: dark theme, electric-cyan accents, warm amber highlights.
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

## Full-body animated assistant and voice introduction

The hero shows `public/models/avatar.glb` (your Avaturn model) as a full-body character, head to feet.

Sequence: **run in from the background -> slow to a stop facing the visitor -> idle -> talking (while `intro.mp3` plays) -> idle again**. The blends are continuous (no jumps). **Stop** silences the audio and ends the speaking animation within a fraction of a second.

- `src/components/three/FullBodyAvatar.jsx`: loads the GLB, applies the pose to the skeleton every frame, drives the face.
- `src/components/avatar/motion/`: plain-JS motion logic (entrance path, run cycle, idle, speaking stance, five different gestures chosen by a director that never repeats the last two, blink scheduler). Unit-tested without three.js.
- `src/audio/useIntroAudio.js`: preloads the 300 KB `intro.mp3`, so Play starts at once; `play / stop`, duplicate-playback guard, Web Audio level and frequency bands.
- Body motion is **procedural** (code, not motion-capture clips): it moves the Avaturn skeleton directly.

### What the model can and cannot do (checked on the real file)

The exported GLB has a full skeleton (52 joints) but **no morph targets (blendshapes)**, no jaw or eye bones, and no animation clips. So today:

| Feature | Status |
|---|---|
| Full body, run, idle, gestures, head motion | works from the skeleton |
| Lip-sync | **not possible on this file**: the mouth stays still. The caption under the avatar says so. Nothing is faked |
| Blinking | **not possible** for the same reason (needs `eyeBlinkLeft/Right`) |

Lip-sync and blinking switch on automatically when the GLB has real morph targets:

1. Re-export from Avaturn with blendshapes (their "Type 2" / ARKit-compatible export), or use any GLB with ARKit (`jawOpen`, `mouthFunnel`, ...) or Oculus `viseme_*` targets. Replace `public/models/avatar.glb`.
2. Optional, for accurate sync: run [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync) on `intro.mp3` (`rhubarb -f json intro.mp3 -o public/audio/intro.rhubarb.json`) and set `assets.voice.visemeTimeline = '/audio/intro.rhubarb.json'`. Without it the mouth is an *approximation* driven by voice loudness (not phoneme-accurate).

The free Talking Avatar SDK used in the previous version was removed: it only animates a head (no full body, no body animation, no camera/scene access), so it cannot do this. `npm install` no longer copies any SDK file.

Setup: `npm install`, `npm run dev`, `npm run build`.

### Performance

One WebGL canvas; the 3D chunk loads when the browser is idle after first paint; rendering stops when the hero is off-screen; the pixel ratio is capped and steps down if the frame rate drops; phones/weak devices use the `low` tier (no particles, no cursor look). Static tier (no WebGL, reduced motion, data saver) keeps the audio-only introduction. Not yet measured on a real 4 GB machine.

Tuning: `assets.avatar` (height, offset, pose), `assets.stage` (framing), entrance timing in `src/components/avatar/motion/director.js`.

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
