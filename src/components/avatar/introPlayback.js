// Playback state machine for the voice introduction.
//
// Kept free of React so it can be tested on its own. The hook in
// useIntroPlayback.js is a thin wrapper around it.
//
//   status: 'idle' | 'starting' | 'playing' | 'error'
//
// With the Talking Avatar SDK the avatar plays the audio itself (the SDK docs
// say to let the avatar play its own audio, to avoid echo), so the SDK path is
// avatar.speak(url) and avatar.stopSpeaking(). If the avatar is unavailable
// (no WebGL, reduced motion, data saver, or it failed to load) the same
// controls fall back to plain audio so the introduction still works.

const MESSAGES = {
  loading: 'The avatar is still loading. Please try again in a moment.',
  failed: 'The voice introduction could not be played. Please try again.',
};

// The SDK docs say a ref on TalkingAvatarView exposes instance methods such as
// speak(). They do not name the ref's type, so accept the instance itself or a
// wrapper that holds it.
export function resolveAvatar(refValue) {
  if (!refValue) return null;
  if (typeof refValue.speak === 'function') return refValue;
  const inner = refValue.avatar ?? refValue.instance ?? null;
  return inner && typeof inner.speak === 'function' ? inner : null;
}

// Waits for the SDK instance to show up on the ref, then for its `ready` promise.
// Some React wrappers only fill the ref one render after mount, so a single check
// at mount time is not enough. Returns a function that cancels the watch.
// If the instance never appears it gives up quietly: play() still looks for it at
// click time and reports a clear message if it is missing.
export function watchAvatarReady({ getAvatar, onReady, onFailed, intervalMs = 100, timeoutMs = 20000 }) {
  let stopped = false;
  let timer = null;
  const startedAt = Date.now();

  const check = () => {
    if (stopped) return;
    const avatar = getAvatar();
    if (avatar) {
      Promise.resolve(avatar.ready).then(
        () => {
          if (!stopped) onReady();
        },
        (error) => {
          if (!stopped) onFailed(error);
        },
      );
      return;
    }
    if (Date.now() - startedAt >= timeoutMs) return;
    timer = setTimeout(check, intervalMs);
  };

  check();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

export function createIntroPlayback({
  url,
  getAvatar,
  isAvatarActive,
  onChange,
  createAudio = (src) => new Audio(src),
}) {
  let state = { status: 'idle', message: '' };
  let runId = 0;
  let plainAudio = null;
  let plainFinish = null;

  const set = (status, message = '') => {
    if (state.status === status && state.message === message) return;
    state = { status, message };
    if (onChange) onChange(state);
  };

  const stopPlainAudio = () => {
    if (plainAudio) {
      try {
        plainAudio.pause();
        plainAudio.currentTime = 0;
      } catch {
        // Already torn down: nothing to stop.
      }
      plainAudio = null;
    }
    if (plainFinish) {
      plainFinish();
      plainFinish = null;
    }
  };

  const playPlainAudio = (run) =>
    new Promise((resolve, reject) => {
      const audio = createAudio(url);
      plainAudio = audio;
      plainFinish = resolve;
      audio.addEventListener('ended', () => resolve(), { once: true });
      audio.addEventListener('error', () => reject(new Error('Audio element error')), { once: true });
      audio
        .play()
        .then(() => {
          if (run === runId) set('playing');
        })
        .catch(reject);
    });

  async function play() {
    if (state.status === 'starting' || state.status === 'playing') return;
    runId += 1;
    const run = runId;
    set('starting');

    try {
      if (isAvatarActive()) {
        const avatar = getAvatar();
        if (!avatar) {
          const error = new Error('Avatar not mounted yet');
          error.code = 'loading';
          throw error;
        }
        // Wait for the first avatar frame. `ready` rejects if loading fails.
        await avatar.ready;
        if (run !== runId) return; // Stop was pressed while waiting.
        set('playing');
        // Resolves when the clip ends or is stopped; rejects on load/decode errors.
        await avatar.speak(url);
      } else {
        await playPlainAudio(run);
      }
      if (run === runId) set('idle');
    } catch (error) {
      if (run !== runId) return; // Superseded by Stop: ignore late errors.
      // eslint-disable-next-line no-console
      console.error('[introduction] playback failed:', error);
      set('error', error && error.code === 'loading' ? MESSAGES.loading : MESSAGES.failed);
    } finally {
      if (run === runId) {
        plainAudio = null;
        plainFinish = null;
      }
    }
  }

  function stop() {
    runId += 1; // Invalidates any pending play().
    try {
      const avatar = getAvatar();
      if (avatar && typeof avatar.stopSpeaking === 'function') avatar.stopSpeaking();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[introduction] stopSpeaking failed:', error);
    }
    stopPlainAudio();
    set('idle');
  }

  return { play, stop, dispose: stop, getState: () => state };
}
