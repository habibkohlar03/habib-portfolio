import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { AVATARS } from '@interviewflowai/talking-avatar';
import { TalkingAvatarView } from '@interviewflowai/talking-avatar/react';
import { resolveAvatar, watchAvatarReady } from './introPlayback';

/**
 * The official Talking Avatar SDK (free, open source) with its built-in male avatar.
 * Loaded lazily from Hero.jsx so three.js and the SDK stay out of the first paint.
 *
 * The parent element must have an explicit size: the avatar fills it.
 *
 *   modelUrl  self-hosted lip-sync model, /sdk/viseme-model.bin (copied from the
 *             package by scripts/copy-viseme-model.mjs). Leave undefined to let
 *             the SDK load it from jsDelivr instead.
 *   onReady   first avatar frame is up
 *   onFailed  the avatar (or its lip-sync model) could not be loaded
 *
 * The forwarded ref is passed straight to TalkingAvatarView, which exposes the
 * SDK instance methods (speak, stopSpeaking, ...).
 */
const TalkingAvatarStage = forwardRef(function TalkingAvatarStage({ modelUrl, onReady, onFailed }, forwardedRef) {
  const inner = useRef(null);
  const readySeen = useRef(false);

  const setRef = useCallback(
    (node) => {
      inner.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useEffect(() => {
    readySeen.current = false;
    return watchAvatarReady({
      getAvatar: () => resolveAvatar(inner.current),
      onReady: () => {
        readySeen.current = true;
        if (onReady) onReady();
      },
      onFailed: (error) => {
        // eslint-disable-next-line no-console
        console.error('[talking-avatar] failed to load:', error);
        if (onFailed) onFailed(error);
      },
    });
  }, [onReady, onFailed]);

  // Background errors. Before the first frame they mean the avatar cannot be used;
  // afterwards (e.g. one clip failed to analyse) the avatar stays on screen.
  const handleError = useCallback(
    (error) => {
      // eslint-disable-next-line no-console
      console.error('[talking-avatar]', error);
      if (!readySeen.current && onFailed) onFailed(error);
    },
    [onFailed],
  );

  return (
    <TalkingAvatarView
      ref={setRef}
      avatarUrl={AVATARS.male}
      modelUrl={modelUrl || undefined}
      onError={handleError}
      className="absolute inset-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
});

export default TalkingAvatarStage;
