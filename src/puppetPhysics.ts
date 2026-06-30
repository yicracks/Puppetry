/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Puppet, Vec2 } from "./types";

export interface PartWorldState {
  x: number;      // Absolute world X of the part's pivot
  y: number;      // Absolute world Y of the part's pivot
  angle: number;  // Absolute world angle in degrees
}

/**
 * Computes the absolute world coordinate states of all parts in a hierarchical puppet.
 */
export function computeWorldStates(puppet: Puppet): { [partId: string]: PartWorldState } {
  const states: { [partId: string]: PartWorldState } = {};
  const partIds = Object.keys(puppet.parts);
  
  // Find torso/root (no parent)
  const rootId = partIds.find(id => puppet.parts[id].parentId === null);
  if (!rootId) return states;

  const rootPart = puppet.parts[rootId];
  states[rootId] = {
    x: puppet.x,
    y: puppet.y,
    angle: rootPart.angle
  };

  const resolved = new Set<string>([rootId]);
  let attempts = 0;
  
  while (resolved.size < partIds.length && attempts < 100) {
    attempts++;
    let madeProgress = false;
    
    for (const id of partIds) {
      if (resolved.has(id)) continue;
      const part = puppet.parts[id];
      
      if (part.parentId && resolved.has(part.parentId)) {
        const parentState = states[part.parentId];
        const parentRad = (parentState.angle * Math.PI) / 180;
        const flipFactor = puppet.flipX ? -1 : 1;

        // Parent attachment offset rotated into world space
        const cosP = Math.cos(parentRad);
        const sinP = Math.sin(parentRad);
        
        // Offset of child attachment relative to parent origin
        const dx = part.parentAttachX * flipFactor * puppet.scale;
        const dy = part.parentAttachY * puppet.scale;
        
        const attachXWorld = parentState.x + (dx * cosP - dy * sinP);
        const attachYWorld = parentState.y + (dx * sinP + dy * cosP);

        // The absolute angle is parent's absolute angle + child's relative angle (adjusted for flipping)
        const absoluteAngle = parentState.angle + part.angle * flipFactor;

        states[id] = {
          x: attachXWorld,
          y: attachYWorld,
          angle: absoluteAngle
        };
        
        resolved.add(id);
        madeProgress = true;
      }
    }
    
    if (!madeProgress) break; // Break cycles
  }

  return states;
}

/**
 * Performs a highly optimized shallow/structural clone of the Puppet object.
 * Avoids slow deep-copy of massive SVG path arrays while cleanly isolating mutable parts and rods.
 */
export function clonePuppet(puppet: Puppet): Puppet {
  const clonedParts: { [id: string]: any } = {};
  for (const id of Object.keys(puppet.parts)) {
    clonedParts[id] = { ...puppet.parts[id] };
  }
  return {
    ...puppet,
    parts: clonedParts,
    rods: puppet.rods.map(r => ({ ...r }))
  };
}

/**
 * Updates the rod position and optionally adjusts limb angles based on handle drags.
 */
export function updatePuppetStateOnDrag(
  puppet: Puppet,
  rodId: string,
  targetHandle: Vec2
): Puppet {
  const updated = clonePuppet(puppet);
  const targetRodIndex = updated.rods.findIndex(r => r.id === rodId);
  if (targetRodIndex === -1) return puppet;

  const targetRod = updated.rods[targetRodIndex];
  const flipFactor = updated.flipX ? -1 : 1;
  
  if (targetRod.isPrimary) {
    // Primary rod translates the entire puppet.
    // Desired attachment world coordinates:
    const desiredWorldX = targetHandle.x;
    const desiredWorldY = targetHandle.y - targetRod.length;

    // Calculate local offset of primary attachment relative to root torso origin
    const rootId = Object.keys(updated.parts).find(id => updated.parts[id].parentId === null);
    if (rootId) {
      const rootPart = updated.parts[rootId];
      const rad = (rootPart.angle * Math.PI) / 180;
      const cosP = Math.cos(rad);
      const sinP = Math.sin(rad);

      const rx = targetRod.attachX * flipFactor * updated.scale;
      const ry = targetRod.attachY * updated.scale;

      // puppet.x + (rx * cosP - ry * sinP) = desiredWorldX
      updated.x = desiredWorldX - (rx * cosP - ry * sinP);
      updated.y = desiredWorldY - (rx * sinP + ry * cosP);
    }
  } else {
    // Secondary rod: Rotate the attached part so the attachment point reaches desiredWorld position
    const desiredWorldX = targetHandle.x;
    const desiredWorldY = targetHandle.y - targetRod.length;

    const initialWorldStates = computeWorldStates(updated);
    const attachedPart = updated.parts[targetRod.partId];
    if (attachedPart && initialWorldStates[targetRod.partId]) {
      const partState = initialWorldStates[targetRod.partId];
      
      // Pivot of the attached part in world coordinates
      const pivotWorldX = partState.x;
      const pivotWorldY = partState.y;

      // Vector from pivot to desired target coordinate
      const dx = desiredWorldX - pivotWorldX;
      const dy = desiredWorldY - pivotWorldY;
      const targetAngleRad = Math.atan2(dy, dx);

      // Local angle of the attachment offset relative to part's pivot
      const rx = targetRod.attachX * flipFactor * updated.scale;
      const ry = targetRod.attachY * updated.scale;
      const localAngleRad = Math.atan2(ry, rx);

      // Ideal absolute world angle of the part
      const desiredWorldAngleDeg = ((targetAngleRad - localAngleRad) * 180) / Math.PI;

      // Parent absolute world angle
      let parentWorldAngle = 0;
      if (attachedPart.parentId && initialWorldStates[attachedPart.parentId]) {
        parentWorldAngle = initialWorldStates[attachedPart.parentId].angle;
      }

      // Desired relative angle
      let relativeAngle = (desiredWorldAngleDeg - parentWorldAngle) * flipFactor;

      // Normalize angle to [-180, 180]
      relativeAngle = ((relativeAngle + 180) % 360) - 180;
      if (relativeAngle < -180) relativeAngle += 360;

      // Limit angle rotation to prevent unnatural dislocated joints
      const maxLimit = 120;
      const minLimit = -120;
      attachedPart.angle = Math.max(minLimit, Math.min(maxLimit, relativeAngle));
    }
  }

  // Recalculate and synchronize exact world attachment coordinates and lock vertical handles
  const worldStates = computeWorldStates(updated);
  for (const r of updated.rods) {
    const partState = worldStates[r.partId];
    if (partState) {
      const rad = (partState.angle * Math.PI) / 180;
      const cosP = Math.cos(rad);
      const sinP = Math.sin(rad);

      const rx = r.attachX * flipFactor * updated.scale;
      const ry = r.attachY * updated.scale;

      r.worldX = partState.x + (rx * cosP - ry * sinP);
      r.worldY = partState.y + (rx * sinP + ry * cosP);

      // Force strictly vertical rods and preserve length
      r.handleX = r.worldX;
      r.handleY = r.worldY + r.length;
    }
  }

  return updated;
}

/**
 * Refreshes all rods to align perfectly with the current puppet posture.
 * Call this after manual angle adjustments or scale changes.
 */
export function alignRodsToPostures(puppet: Puppet): Puppet {
  const updated = clonePuppet(puppet);
  const worldStates = computeWorldStates(updated);
  
  for (const r of updated.rods) {
    const partState = worldStates[r.partId];
    if (partState) {
      const rad = (partState.angle * Math.PI) / 180;
      const flipFactor = updated.flipX ? -1 : 1;

      const cosP = Math.cos(rad);
      const sinP = Math.sin(rad);

      const rx = r.attachX * flipFactor * updated.scale;
      const ry = r.attachY * updated.scale;

      r.worldX = partState.x + (rx * cosP - ry * sinP);
      r.worldY = partState.y + (rx * sinP + ry * cosP);

      r.handleX = r.worldX;
      r.handleY = r.worldY + r.length;
    }
  }

  return updated;
}

/**
 * Post-processes a newly created puppet to ensure all rods are vertical and 
 * their handle/click points sit exactly on the same initial horizontal baseline.
 */
export function initializePuppetRods(puppet: Puppet): Puppet {
  const updated = clonePuppet(puppet);
  const worldStates = computeWorldStates(updated);
  
  // Baseline is placed exactly 200px below the puppet's torso origin
  const baselineY = updated.y + 200;

  for (const r of updated.rods) {
    const partState = worldStates[r.partId];
    if (partState) {
      const rad = (partState.angle * Math.PI) / 180;
      const flipFactor = updated.flipX ? -1 : 1;

      const cosP = Math.cos(rad);
      const sinP = Math.sin(rad);

      const rx = r.attachX * flipFactor * updated.scale;
      const ry = r.attachY * updated.scale;

      r.worldX = partState.x + (rx * cosP - ry * sinP);
      r.worldY = partState.y + (rx * sinP + ry * cosP);

      // Force strictly vertical rod
      r.handleX = r.worldX;
      r.handleY = baselineY;
      
      // Calculate and save the fixed rigid length
      r.length = baselineY - r.worldY;
    }
  }

  return updated;
}
