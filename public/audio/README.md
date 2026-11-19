# Intro audio and mouth timeline

- `intro.mp3`: your recorded introduction. Preloaded when the page loads, so Play starts immediately.
- `intro.visemes.json`: mouth-shape timeline (Rhubarb JSON format), prefetched at page load.
  The shipped file was produced by `tools/make-viseme-timeline.py` (acoustic analysis of the recording:
  vowel formants, fricative energy, closures and pauses). It is NOT phoneme recognition.
  For phoneme-level accuracy, run the "Generate Rhubarb lip-sync timeline" workflow in GitHub (Actions tab),
  which replaces this file with Rhubarb Lip Sync output. If you change `intro.mp3`, regenerate the timeline.
