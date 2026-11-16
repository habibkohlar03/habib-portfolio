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

## Adding your 3D avatar

The site runs without it (a stylized placeholder mannequin is shown). To integrate your own:

1. Create the avatar from your photos with a tool such as **Ready Player Me** or **Avaturn** (check their current terms), and export a **full-body GLB**.
2. Requirements for the GLB:
   - **Facial blendshapes for lip-sync:** ARKit-style (`jawOpen`, `mouthOpen`, ...) and/or Oculus visemes (`viseme_aa`, `viseme_PP`, ...). In Ready Player Me, enable the ARKit/Oculus-viseme morph target options on export.
   - **A neutral standing pose, or an idle animation clip.** Many exports are in a T-pose with no animation. If yours is, re-export in a relaxed pose or add an idle clip (named with "idle"; it plays automatically).
   - Keep it **under ~5 MB** (compress textures; Draco/meshopt via `gltf-transform` or `gltfjsx`).
3. Save it as `public/models/avatar.glb`.
4. Set `assets.avatar.enabled = true` in `src/data/assets.js`.

The model is auto-scaled and placed on the platform. The caption under the avatar reports what it detected:

| Caption | Meaning |
|---|---|
| Lip-sync: viseme timeline | Visemes present **and** a timeline is configured (most accurate) |
| Lip-sync: audio-driven jaw movement | Only a jaw/mouth-open shape was found |
| No facial blendshapes found, lip-sync off | The model has no usable face morph targets, so **nothing is faked**. Re-export with blendshapes |

If the GLB fails to load, the placeholder is shown automatically.

Note: Drei loads the Draco decoder from a CDN by default. If you export with Draco, either allow that or use meshopt compression.

## Adding your voice introduction

1. Save the recording as `public/audio/intro.mp3` (same origin, no external CDN, so the analyser can read it).
2. Set `assets.voice.enabled = true` in `src/data/assets.js`.
3. Optional but recommended: an accessible **transcript** in `assets.voice.transcript`.
4. Optional, for accurate lip-sync: run your recording through [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync) (`rhubarb -f json intro.mp3 -o intro.visemes.json`), save the file in `public/audio/`, and set `assets.voice.visemeTimeline = '/audio/intro.visemes.json'`.

The player provides Play / Pause / Replay and a progress bar. When the audio ends, the avatar returns to idle and Replay restarts from the beginning. Audio is not downloaded until the visitor clicks.

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
- [ ] After adding assets: voice plays, pauses, replays; avatar returns to idle at the end
- [ ] After connecting the form: test submission arrives in your inbox
