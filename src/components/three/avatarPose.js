import * as THREE from 'three';

// Finds a bone by name. Exact match first, then a suffix match so rigs with a
// prefix (e.g. "mixamorigLeftArm") still work.
export function findBone(root, name) {
  const exact = root.getObjectByName(name);
  if (exact) return exact;
  let found = null;
  root.traverse((obj) => {
    if (!found && obj.isBone && obj.name.endsWith(name)) found = obj;
  });
  return found;
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _target = new THREE.Vector3();
const _dq = new THREE.Quaternion();
const _pw = new THREE.Quaternion();

/**
 * Lowers T-pose / raised arms so they hang at `spreadDeg` from vertical.
 *
 * Works from the real bone positions, so it adapts to whatever the model
 * exports. Arms that already hang close enough to straight down are left
 * alone. The rotation is applied in world space and converted to the bone's
 * local space: local' = parentWorld^-1 * delta * parentWorld * local.
 *
 * Returns the number of arms that were changed (0 to 2).
 */
export function lowerArms(root, spreadDeg) {
  root.updateMatrixWorld(true);
  const spread = THREE.MathUtils.degToRad(spreadDeg);
  const tolerance = THREE.MathUtils.degToRad(6);
  let changed = 0;

  for (const side of ['Left', 'Right']) {
    const arm = findBone(root, `${side}Arm`);
    const fore = findBone(root, `${side}ForeArm`);
    if (!arm || !fore || !arm.parent) continue;

    arm.getWorldPosition(_a);
    fore.getWorldPosition(_b);
    _dir.subVectors(_b, _a);
    if (_dir.lengthSq() < 1e-8) continue;
    _dir.normalize();

    const angleFromDown = Math.acos(THREE.MathUtils.clamp(-_dir.y, -1, 1));
    if (angleFromDown <= spread + tolerance) continue;

    const outward = Math.sign(_dir.x) || (side === 'Left' ? 1 : -1);
    _target.set(outward * Math.sin(spread), -Math.cos(spread), 0);
    _dq.setFromUnitVectors(_dir, _target);

    arm.parent.getWorldQuaternion(_pw);
    arm.quaternion.premultiply(_pw).premultiply(_dq).premultiply(_pw.invert());
    changed += 1;
  }

  root.updateMatrixWorld(true);
  return changed;
}
