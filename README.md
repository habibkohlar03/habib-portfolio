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

## Talking avatar and voice introduction (Talking Avatar SDK)

The hero uses the free, open-source [Talking Avatar SDK](https://talking-avatar.dev/open-source-talking-avatar)
(`@interviewflowai/talking-avatar`, MIT) with its built-in male avatar (`AVATARS.male`). It provides the
facial blendshapes and lip-sync that the old Avaturn `avatar.glb` lacked. No paid APIs or services are used.

How it works:

- `src/components/avatar/TalkingAvatarStage.jsx` renders the SDK's `TalkingAvatarView` (lazy-loaded after first paint).
- **Play Introduction** calls the SDK's `speak('/audio/intro.mp3')`. The avatar plays the audio itself and its mouth is driven from the audio. **Stop** calls `stopSpeaking()`.
- If the clip fails to load or decode, a clear message and a **Try again** button are shown.
- If the avatar cannot be shown (no WebGL, reduced motion, data saver, or it failed to load), the same buttons play the audio on its own, so the introduction still works.
- The playback logic lives in `src/components/avatar/introPlayback.js` (plain JS, unit-testable).

Setup after unzipping:

```bash
npm install          # installs the SDK + three, and copies viseme-model.bin to public/sdk/
npm run dev
```

`npm install` runs `scripts/copy-viseme-model.mjs`, which copies the SDK's lip-sync model from
`node_modules/@interviewflowai/talking-avatar/dist/viseme-model.bin` to `public/sdk/viseme-model.bin`
(re-run with `npm run sync-sdk`). **Commit `public/sdk/viseme-model.bin`** so Vercel serves it from your domain.
To use the SDK's jsDelivr copy instead, set `assets.sdk.modelUrl = null` in `src/data/assets.js`.

`package.json` lists the SDK as `"latest"`. After your first install, run
`npm install @interviewflowai/talking-avatar@latest` once so npm records a normal version range, then commit
`package-lock.json`.

Files: the voice file is `public/audio/intro.mp3` (switch: `assets.voice.enabled`). An optional transcript can go
in `assets.voice.transcript`.

### Legacy files (not used by the hero any more)

`public/models/avatar.glb` (Avaturn export, T-pose, no facial blendshapes), `src/components/three/*`,
`src/audio/*`. They are kept untouched. Delete `avatar.glb` if you want to save 4 MB in the deployed site.

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
