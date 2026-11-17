import { useEffect, useMemo, useRef, useState } from 'react';
import { createIntroPlayback, resolveAvatar } from './introPlayback';

/**
 * React wrapper around the playback state machine.
 *
 *   avatarRef    ref attached to <TalkingAvatarView> (through TalkingAvatarStage)
 *   url          the audio file, e.g. /audio/intro.mp3
 *   avatarActive false when the avatar is not shown (no WebGL, reduced motion,
 *                data saver, or it failed to load): playback then falls back to
 *                plain audio so the introduction still works.
 */
export function useIntroPlayback({ avatarRef, url, avatarActive }) {
  const [state, setState] = useState({ status: 'idle', message: '' });
  const activeRef = useRef(avatarActive);
  activeRef.current = avatarActive;

  const controller = useMemo(
    () =>
      createIntroPlayback({
        url,
        getAvatar: () => resolveAvatar(avatarRef.current),
        isAvatarActive: () => activeRef.current,
        onChange: setState,
      }),
    [url, avatarRef],
  );

  // Stop any audio when the hero unmounts.
  useEffect(() => () => controller.dispose(), [controller]);

  return { ...state, play: controller.play, stop: controller.stop };
}
