import { useMemo } from 'react';
import { useMediaQuery } from './useMediaQuery';
import { useReducedMotion } from './useReducedMotion';

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Decides how much 3D to render:
 *  - 'static': no WebGL scene at all (reduced motion, data-saver, no WebGL)
 *  - 'low'   : lightweight scene (phones, tablets, low-memory / few-core devices)
 *  - 'high'  : full scene (capable desktops)
 */
export function useQualityTier() {
  const reduced = useReducedMotion();
  const coarsePointer = useMediaQuery('(pointer: coarse)');
  const narrow = useMediaQuery('(max-width: 767px)');

  return useMemo(() => {
    if (typeof navigator === 'undefined') return 'static';
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    if (reduced || saveData || !hasWebGL()) return 'static';

    const memory = navigator.deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency ?? 8;
    if (coarsePointer || narrow || memory <= 4 || cores <= 4) return 'low';
    return 'high';
  }, [reduced, coarsePointer, narrow]);
}
