/**
 * The starfield's response to the pointer: the one piece of motion on the page.
 *
 * The cursor brushes past a star, the star gives a little in the direction the
 * cursor was travelling, and then over the next several seconds it drifts back
 * to exactly where it was. Specified under _Pointer response_ in
 * `docs/design/starfield.md`.
 *
 * Three things it is deliberately not, each of which it has been at some point
 * in its history: stars orbiting the cursor, stars shoved out of its way like a
 * repulsion field, and stars trailing smears behind them. The effect is small,
 * local, and sharp — a point of light nudged, not a region of sky disturbed.
 *
 * This module contains no React and touches no DOM beyond the canvas it is
 * handed, the pointer, and two media queries. It owns the animation frame loop
 * and nothing else owns one on this layer.
 *
 * **The loop is cancelled, not idled.** A page nobody is touching runs nothing:
 * no frame is requested until the pointer moves, and once the pointer has been
 * still for a moment and every star is home again the loop is cancelled and the
 * field repainted at rest. A running-but-doing-nothing loop is the most likely
 * way this layer ends up costing someone battery, and it would not show up in
 * review because the page looks identical either way.
 */

import { drawStars } from "@/lib/starfield/draw";
import type { Star } from "@/lib/starfield/starfield-points";

/**
 * Every number the response is tuned by.
 *
 * The first group is the model itself; the rest decide when the loop may stop.
 * Tuned by eye on screen, so `docs/design/starfield.md` and these values must
 * be changed together.
 */
export const POINTER = {
  /**
   * How far from the pointer a star is affected at all, in CSS pixels.
   *
   * Small enough that the response reads as the cursor brushing past the few
   * stars it actually passes. A wide reach makes a whole region of the sky
   * heave when the cursor crosses it, which looks like a field effect rather
   * than like a cursor.
   */
  influenceRadius: 175,

  /** The share of the pointer's velocity a star at the very centre takes on. */
  dragStrength: 0.21,

  /**
   * Per-frame decay of the shove the pointer gave a star.
   *
   * This is what ends the swipe: within a few frames of the cursor passing, the
   * star has stopped travelling and is left where it was pushed to.
   */
  damping: 0.88,

  /**
   * The share of the remaining distance home a star closes each frame.
   *
   * **A rate, not a spring, and that is the whole character of the effect.** A
   * spring pulls on velocity, so a star overshoots home, comes back, overshoots
   * again — the field wobbles like jelly after every sweep. This moves the
   * position itself a fraction of the way home, which cannot overshoot at any
   * strength: a star eases back and stops. Small, because the return should be
   * a slow drift long after the cursor has gone, not a snap back.
   *
   * At 60fps this closes half the distance in about a second, and a fully
   * displaced star is home in roughly eight.
   */
  returnRate: 0.012,

  /**
   * Ceiling on how far a star may be thrown from home, in CSS pixels.
   *
   * Not optional, and small. Without any ceiling a fast diagonal flick throws
   * stars hundreds of pixels and the field tears apart; with a generous one the
   * cursor reads as shoving stars out of its way, which is a different effect
   * and not this one. A star gives a little where the cursor passes and stays
   * recognisably where it belongs.
   */
  maxDisplacement: 18,

  /**
   * How much of each frame's raw pointer delta is taken into the smoothed
   * velocity, as an exponential average over roughly the last three frames.
   *
   * Raw frame-to-frame deltas are noisy — a real hand and a real mouse produce
   * a jittery, twitchy drag rather than a fluid one. This is what makes the
   * motion read as stirring rather than as flicking.
   */
  velocitySmoothing: 0.35,

  /** How long the pointer must hold still before the loop may stop, in ms. */
  stillnessMs: 140,

  /** A star is home when it is within this many pixels of it... */
  restDistance: 0.1,

  /** ...and slower than this, in pixels per frame. */
  restVelocity: 0.01,
} as const;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The input this response is written for.
 *
 * A touch screen reports pointer events too, so left unguarded the field would
 * lurch on every tap and drag — an effect designed around a cursor that passes
 * over the stage without touching it, driven by an input that cannot hover.
 * There is no cursor to follow, so there is nothing to draw.
 */
const HOVER_POINTER = "(hover: hover)";

export interface PointerResponseHandle {
  /**
   * Hands over the field that is now on the canvas, at rest.
   *
   * Called after every generation — mount and each resize. The positions the
   * stars arrive with are taken as their homes, so this must be called with a
   * field that has just been generated, never with one mid-drag.
   */
  setField(stars: readonly Star[], width: number, height: number): void;
  /** Cancel the loop and release everything. Safe to call more than once. */
  destroy(): void;
}

const NO_STARS: readonly Star[] = [];
const NO_VALUES = new Float64Array(0);

export function createPointerResponse(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
): PointerResponseHandle {
  const reducedMotion = window.matchMedia(REDUCED_MOTION);
  const hoverPointer = window.matchMedia(HOVER_POINTER);

  let stars: readonly Star[] = NO_STARS;

  // Parallel arrays rather than fields on the stars themselves: home is the
  // generator's business and current position is this module's, and keeping
  // them apart is what makes "every star returns to exactly where it started"
  // a snap back to a number nothing has touched rather than an accumulation of
  // floating-point drift that happens to look settled.
  let homeX = NO_VALUES;
  let homeY = NO_VALUES;
  let velocityX = NO_VALUES;
  let velocityY = NO_VALUES;

  let width = 0;
  let height = 0;
  // The canvas fills the window, but its origin is read rather than assumed.
  let originX = 0;
  let originY = 0;

  let pointerX = 0;
  let pointerY = 0;
  let pointerInside = false;
  /** Whether there is a previous sample to measure this move against. */
  let sampled = false;
  let sampleX = 0;
  let sampleY = 0;
  /** Raw movement banked since the last frame read it. */
  let pendingX = 0;
  let pendingY = 0;
  /** The smoothed pointer velocity the drag is actually driven by. */
  let velocitySampleX = 0;
  let velocitySampleY = 0;
  let lastMoveTime = 0;

  let animationFrame = 0;
  let running = false;
  let attached = false;
  let destroyed = false;

  /**
   * Advances every star one frame, and reports whether the field is at rest.
   *
   * Two movements, and they are deliberately different in kind. The swipe is a
   * velocity: the cursor shoves a star, the shove decays, the star coasts to a
   * stop. The return is a rate: whatever distance is left between the star and
   * its home, a small fraction of it closes each frame, which is a drift that
   * slows as it arrives and can never overshoot.
   *
   * Keeping them separate is what stops the field behaving like jelly. Pull a
   * star home with a spring instead — a force on its velocity — and it arrives
   * carrying speed, sails past, and comes back; the whole field wobbles after
   * every sweep of the cursor.
   */
  function advance(): boolean {
    const radiusSquared = POINTER.influenceRadius * POINTER.influenceRadius;
    const maxSquared = POINTER.maxDisplacement * POINTER.maxDisplacement;
    const restSquared = POINTER.restDistance * POINTER.restDistance;
    const restVelocitySquared = POINTER.restVelocity * POINTER.restVelocity;

    // A pointer resting on the stage drags nothing: it is movement that stirs
    // the field, not presence.
    const dragging =
      pointerInside && (velocitySampleX !== 0 || velocitySampleY !== 0);

    let settled = true;

    for (let index = 0; index < stars.length; index += 1) {
      const star = stars[index];
      let velocityOfX = velocityX[index];
      let velocityOfY = velocityY[index];

      if (dragging) {
        const towardX = pointerX - star.x;
        const towardY = pointerY - star.y;
        const distanceSquared = towardX * towardX + towardY * towardY;

        if (distanceSquared < radiusSquared) {
          // Squared falloff, so the effect concentrates near the pointer and
          // arrives at zero — not at a small value — on the influence radius.
          // A linear one leaves a visible circular edge where it stops.
          const nearness =
            1 - Math.sqrt(distanceSquared) / POINTER.influenceRadius;
          const share = nearness * nearness * POINTER.dragStrength;
          velocityOfX += velocitySampleX * share;
          velocityOfY += velocitySampleY * share;
        }
      }

      velocityOfX *= POINTER.damping;
      velocityOfY *= POINTER.damping;

      // The swipe, then the drift back. The drift acts on the position rather
      // than on the velocity, so it has no momentum to overshoot with.
      let x = star.x + velocityOfX;
      let y = star.y + velocityOfY;
      x += (homeX[index] - x) * POINTER.returnRate;
      y += (homeY[index] - y) * POINTER.returnRate;

      const displacedX = x - homeX[index];
      const displacedY = y - homeY[index];
      const displacedSquared =
        displacedX * displacedX + displacedY * displacedY;

      if (displacedSquared > maxSquared) {
        const pullBack = POINTER.maxDisplacement / Math.sqrt(displacedSquared);
        x = homeX[index] + displacedX * pullBack;
        y = homeY[index] + displacedY * pullBack;
      }

      star.x = x;
      star.y = y;
      velocityX[index] = velocityOfX;
      velocityY[index] = velocityOfY;

      if (
        settled &&
        (displacedSquared > restSquared ||
          velocityOfX * velocityOfX + velocityOfY * velocityOfY >
            restVelocitySquared)
      ) {
        settled = false;
      }
    }

    return settled;
  }

  function loop(time: number): void {
    animationFrame = requestAnimationFrame(loop);

    // An exponential average over the last few frames, refilled by whatever the
    // pointer banked since the previous one. With the pointer still it decays
    // toward zero on its own, so the drag eases off rather than cutting out.
    velocitySampleX += (pendingX - velocitySampleX) * POINTER.velocitySmoothing;
    velocitySampleY += (pendingY - velocitySampleY) * POINTER.velocitySmoothing;
    pendingX = 0;
    pendingY = 0;

    const settled = advance();
    drawStars(context, stars, width, height);

    // Both halves are required. Stars still moving under a still pointer have
    // not finished, and a pointer still moving will disturb them again.
    if (settled && time - lastMoveTime >= POINTER.stillnessMs) {
      rest();
    }
  }

  function startLoop(): void {
    if (running || destroyed || stars.length === 0) return;
    running = true;
    animationFrame = requestAnimationFrame(loop);
  }

  function stopLoop(): void {
    if (!running) return;
    running = false;
    cancelAnimationFrame(animationFrame);
  }

  /**
   * Puts the field back exactly where it started and stops.
   *
   * The stars are snapped to their homes rather than left where the drift got
   * them: within 0.1px is close enough to stop animating, and not close enough
   * to leave on screen. Every frame already clears its canvas, so this last
   * draw has nothing to clean up — it exists to make the final positions the
   * generator's own numbers rather than a float that arrived near them.
   */
  function rest(): void {
    stopLoop();

    for (let index = 0; index < stars.length; index += 1) {
      stars[index].x = homeX[index];
      stars[index].y = homeY[index];
      velocityX[index] = 0;
      velocityY[index] = 0;
    }

    velocitySampleX = 0;
    velocitySampleY = 0;
    pendingX = 0;
    pendingY = 0;

    if (stars.length > 0) {
      drawStars(context, stars, width, height);
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (stars.length === 0) return;

    const x = event.clientX - originX;
    const y = event.clientY - originY;

    if (sampled) {
      pendingX += x - sampleX;
      pendingY += y - sampleY;
    }

    sampled = true;
    sampleX = x;
    sampleY = y;
    pointerX = x;
    pointerY = y;
    pointerInside = true;
    lastMoveTime = performance.now();

    startLoop();
  }

  /**
   * The pointer has left the window.
   *
   * The drag stops and the loop does not: stars in mid-air settle the way they
   * would have anyway, rather than freezing where the cursor abandoned them.
   * The next move starts a fresh sample, so re-entering the window on the far
   * side does not read as one enormous sweep across it.
   */
  function onPointerOut(event: PointerEvent): void {
    if (event.relatedTarget !== null) return;
    pointerInside = false;
    sampled = false;
    pendingX = 0;
    pendingY = 0;
  }

  function attach(): void {
    if (attached || destroyed) return;
    attached = true;
    // On the window rather than on the canvas: the canvas takes no pointer
    // events, and the field goes on responding while the pointer is over the
    // sign-in panel or the chrome above it.
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
  }

  function detach(): void {
    if (!attached) return;
    attached = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerout", onPointerOut);
    pointerInside = false;
    sampled = false;
    rest();
  }

  /**
   * Attaches the listener only when both conditions for the response hold.
   *
   * Reduced motion and an input that cannot hover. Either is enough on its own
   * to make this a static field, so they are decided in one place — and there
   * is no listener at all rather than a listener feeding a loop that must not
   * run. Re-read on change, so switching either one takes effect without a
   * reload.
   */
  function applyPreference(): void {
    if (hoverPointer.matches && !reducedMotion.matches) {
      attach();
    } else {
      detach();
    }
  }

  reducedMotion.addEventListener("change", applyPreference);
  // A hybrid machine can change input without reloading: a tablet gains a
  // trackpad, a laptop screen is touched.
  hoverPointer.addEventListener("change", applyPreference);

  applyPreference();

  return {
    setField(nextStars, nextWidth, nextHeight) {
      if (destroyed) return;

      stopLoop();
      stars = nextStars;

      if (homeX.length !== stars.length) {
        homeX = new Float64Array(stars.length);
        homeY = new Float64Array(stars.length);
        velocityX = new Float64Array(stars.length);
        velocityY = new Float64Array(stars.length);
      }

      for (let index = 0; index < stars.length; index += 1) {
        homeX[index] = stars[index].x;
        homeY[index] = stars[index].y;
        velocityX[index] = 0;
        velocityY[index] = 0;
      }

      width = nextWidth;
      height = nextHeight;

      // Read once here rather than on every pointer event, which would be a
      // layout read per mouse move.
      const bounds = canvas.getBoundingClientRect();
      originX = bounds.left;
      originY = bounds.top;

      // A resize invalidates the pointer's trail along with the field: the next
      // move measures from where the pointer is, not from where it was on a
      // stage that no longer exists.
      sampled = false;
      pendingX = 0;
      pendingY = 0;
      velocitySampleX = 0;
      velocitySampleY = 0;
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopLoop();
      detach();
      reducedMotion.removeEventListener("change", applyPreference);
      hoverPointer.removeEventListener("change", applyPreference);
    },
  };
}
