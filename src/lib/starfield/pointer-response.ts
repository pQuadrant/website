/**
 * The starfield's response to the pointer: the one piece of motion on the page.
 *
 * The cursor sweeps through the field and the stars it passes are carried along
 * with it, then coast to a stop and drift back to where they were. Specified
 * under _Pointer response_ in `docs/design/starfield.md`.
 *
 * **A star is kicked by the line the cursor swept this frame, not by where the
 * cursor ended up.** That is the whole difference between a swipe and a
 * pointer-follower. Measuring from a point means a fast cursor only disturbs
 * the small disc it happened to stop in, so the field reacts in blobs wherever
 * the mouse slowed down; measuring from the segment it travelled disturbs
 * everything it actually crossed, evenly, at any speed.
 *
 * The model is taken from the reference the design is measured against — see
 * _Pointer response_ in the specification, which records where it came from and
 * the numbers it uses. Two earlier attempts at this file guessed instead: one
 * pulled stars home with a spring, which wobbles like jelly, and one pushed
 * them radially away from the cursor, which is a repulsion field and reads as a
 * force rather than as a hand. Neither is what the reference does.
 *
 * **The loop is cancelled, not idled.** A page nobody is touching runs nothing:
 * no frame is requested until the pointer moves, and once every star is home
 * again the loop is cancelled and the field drawn once at rest. A running-but-
 * doing-nothing loop is the most likely way this layer ends up costing someone
 * battery, and it would not show up in review because the page looks identical
 * either way.
 */

import { drawStars } from "@/lib/starfield/draw";
import type { Star } from "@/lib/starfield/starfield-points";

/**
 * Every number the response is tuned by.
 *
 * The rates are per second, applied as the closed-form solution over whatever
 * the frame's timestep actually was, so the motion is identical at 60Hz and
 * 120Hz and a dropped frame changes nothing.
 *
 * `impulseCeiling` and `speedCeiling` are in half-stage-heights rather than
 * pixels, because the reference expresses them in clip space, where 1 is half
 * the viewport. They scale with the window; everything else is in CSS pixels.
 */
export const POINTER = {
  /** How far from the cursor's path a star is carried at all, in CSS pixels. */
  sweepRadius: 88,

  /**
   * Impulse per unit of cursor movement, per second.
   *
   * How hard the sweep hits. This and `speedCeiling` are the two knobs that
   * decide whether the field is brushed or thrown.
   */
  impulseGain: 5.4,

  /** Ceiling on one frame's cursor movement, in half stage heights. */
  impulseCeiling: 0.18,

  /** Ceiling on a star's speed, in half stage heights per second. */
  speedCeiling: 0.32,

  /**
   * Drag on a star of unit mass, per second. Divided by the square root of the
   * star's own mass, so a heavy star coasts further before it stops.
   */
  drag: 2.3,

  /**
   * Rate at which a star's displacement decays back to nothing, per second.
   *
   * A rate on the displacement itself, not a force on its velocity. That is
   * what makes the return a drift that slows as it arrives rather than a spring
   * that overshoots home and comes back — there is no spring anywhere in this
   * model, and the reference's own source says so in as many words.
   */
  returnRate: 1,

  /**
   * Mass runs from the first of these to the second, by magnitude.
   *
   * The faint majority is light and flicks easily; the few bright stars are
   * heavy, take less from the same sweep and carry it further. Without the
   * spread every star moves identically and the field reads as one sheet being
   * dragged rather than as many objects being disturbed.
   */
  massMin: 0.65,
  massMax: 2.4,

  /** How long the pointer must hold still before the loop may stop, in ms. */
  stillnessMs: 140,

  /** A star is home when it is within this many pixels of home... */
  restDistance: 0.05,

  /** ...and slower than this, in pixels per second. */
  restSpeed: 0.5,

  /** Ceiling on a frame's timestep, in seconds. */
  maxTimestep: 1 / 20,
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
   * field that has just been generated, never with one mid-response.
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
  // generator's business and the offset from it is this module's. Keeping them
  // apart is what makes "every star returns to exactly where it started" a snap
  // back to a number nothing has touched, rather than an accumulation of
  // floating-point drift that happens to look settled.
  let homeX = NO_VALUES;
  let homeY = NO_VALUES;
  let offsetX = NO_VALUES;
  let offsetY = NO_VALUES;
  let velocityX = NO_VALUES;
  let velocityY = NO_VALUES;
  /** Per-star mass. Heavier stars take less from a sweep and coast further. */
  let mass = NO_VALUES;

  let width = 0;
  let height = 0;
  // The canvas fills the window, but its origin is read rather than assumed.
  let originX = 0;
  let originY = 0;

  /** Where the pointer is now, and where it was when the last frame ran. */
  let pointerX = 0;
  let pointerY = 0;
  let previousX = 0;
  let previousY = 0;
  /** Whether a previous cursor position exists to sweep a segment from. */
  let tracking = false;
  let lastMoveTime = 0;
  let lastFrameTime = 0;

  let animationFrame = 0;
  let running = false;
  let attached = false;
  let destroyed = false;

  /**
   * Half the stage's height, in CSS pixels.
   *
   * The unit the two ceilings below are expressed in, so they scale with the
   * window rather than being pixel values tuned at one size.
   */
  let halfStageHeight = 1;

  /**
   * Carries every star the cursor's path crossed this frame.
   *
   * The cursor swept a line segment since the last frame. A star's share of
   * that sweep is set by how far it sits from the segment — not from either
   * end of it — so a fast movement disturbs everything along its length rather
   * than only the disc it stopped in.
   */
  function sweep(): void {
    const segmentX = pointerX - previousX;
    const segmentY = pointerY - previousY;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    if (lengthSquared === 0) return;

    // The impulse is the movement itself, capped: one enormous jump — a cursor
    // warping across the window, a frame lost to something else — must not hit
    // harder than a fast hand does.
    const ceiling = POINTER.impulseCeiling * halfStageHeight;
    const length = Math.sqrt(lengthSquared);
    const scale = length > ceiling ? ceiling / length : 1;
    const impulseX = segmentX * scale * POINTER.impulseGain;
    const impulseY = segmentY * scale * POINTER.impulseGain;

    const speedCeiling = POINTER.speedCeiling * halfStageHeight;

    for (let index = 0; index < stars.length; index += 1) {
      const star = stars[index];

      // Distance to the segment, by projecting the star onto it and clamping
      // to its ends, so the influence is a capsule around the cursor's path.
      const alongX = star.x - previousX;
      const alongY = star.y - previousY;
      const t = Math.min(
        Math.max((alongX * segmentX + alongY * segmentY) / lengthSquared, 0),
        1,
      );
      const offX = alongX - segmentX * t;
      const offY = alongY - segmentY * t;
      const distance = Math.hypot(offX, offY);
      if (distance >= POINTER.sweepRadius) continue;

      // Squared smoothstep: the falloff reaches zero at the radius with no
      // slope left in it, so there is no circular edge where the sweep stops.
      const near = 1 - distance / POINTER.sweepRadius;
      const eased = near * near * (3 - 2 * near);
      const weight = eased * eased;

      const share = weight / mass[index];
      let nextX = velocityX[index] + impulseX * share;
      let nextY = velocityY[index] + impulseY * share;

      const speed = Math.hypot(nextX, nextY);
      if (speed > speedCeiling) {
        const held = speedCeiling / speed;
        nextX *= held;
        nextY *= held;
      }

      velocityX[index] = nextX;
      velocityY[index] = nextY;
    }
  }

  /**
   * Lets every star coast and drift home, and reports whether all of them are.
   *
   * Two decays, solved rather than stepped. A star's velocity decays at its own
   * drag, and its displacement decays toward zero at `returnRate` while that
   * velocity drives it — which is a pair of linear equations with a closed
   * form, so this is exact at any timestep instead of an integration that
   * wanders if a frame runs long.
   */
  function coast(seconds: number): boolean {
    const restSquared = POINTER.restDistance * POINTER.restDistance;
    const restSpeedSquared = POINTER.restSpeed * POINTER.restSpeed;
    const returnDecay = Math.exp(-POINTER.returnRate * seconds);

    let home = true;

    for (let index = 0; index < stars.length; index += 1) {
      const drag = POINTER.drag / Math.sqrt(mass[index]);
      const velocityDecay = Math.exp(-drag * seconds);
      // The carried term, from integrating a decaying velocity against a
      // decaying displacement. The two rates cannot meet across the mass range,
      // so the denominator cannot vanish.
      const carried =
        (returnDecay - velocityDecay) / (drag - POINTER.returnRate);

      const nextX = offsetX[index] * returnDecay + velocityX[index] * carried;
      const nextY = offsetY[index] * returnDecay + velocityY[index] * carried;

      offsetX[index] = nextX;
      offsetY[index] = nextY;
      velocityX[index] *= velocityDecay;
      velocityY[index] *= velocityDecay;

      stars[index].x = homeX[index] + nextX;
      stars[index].y = homeY[index] + nextY;

      if (
        home &&
        (nextX * nextX + nextY * nextY > restSquared ||
          velocityX[index] * velocityX[index] +
            velocityY[index] * velocityY[index] >
            restSpeedSquared)
      ) {
        home = false;
      }
    }

    return home;
  }

  function loop(time: number): void {
    animationFrame = requestAnimationFrame(loop);

    // Clamped, so a backgrounded tab returning after a second does not apply
    // that second in one step.
    const seconds =
      lastFrameTime === 0
        ? 1 / 60
        : Math.min((time - lastFrameTime) / 1000, POINTER.maxTimestep);
    lastFrameTime = time;

    if (tracking) sweep();
    // The segment this frame swept is consumed; the next one starts here.
    previousX = pointerX;
    previousY = pointerY;

    const home = coast(seconds);
    drawStars(context, stars, width, height);

    // Both halves are required. Stars still moving under a still cursor have
    // not finished, and a cursor still moving will disturb them again.
    if (home && time - lastMoveTime >= POINTER.stillnessMs) {
      settle();
    }
  }

  function startLoop(): void {
    if (running || destroyed || stars.length === 0) return;
    running = true;
    lastFrameTime = 0;
    animationFrame = requestAnimationFrame(loop);
  }

  function stopLoop(): void {
    if (!running) return;
    running = false;
    cancelAnimationFrame(animationFrame);
  }

  /**
   * Puts every star back exactly where it started, and stops.
   *
   * Snapped to the generator's own numbers rather than left on the float that
   * arrived within a twentieth of a pixel of them: that much offset is
   * invisible as a position, and is not invisible on the anti-aliased edge of a
   * one-pixel core.
   */
  function settle(): void {
    stopLoop();
    tracking = false;

    for (let index = 0; index < stars.length; index += 1) {
      offsetX[index] = 0;
      offsetY[index] = 0;
      velocityX[index] = 0;
      velocityY[index] = 0;
      stars[index].x = homeX[index];
      stars[index].y = homeY[index];
    }

    if (stars.length > 0) {
      drawStars(context, stars, width, height);
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (stars.length === 0) return;

    pointerX = event.clientX - originX;
    pointerY = event.clientY - originY;

    // The first sample after arriving sweeps nothing: it starts a segment
    // rather than closing one, so re-entering the window on the far side does
    // not drag a line across everything in between.
    if (!tracking) {
      tracking = true;
      previousX = pointerX;
      previousY = pointerY;
    }

    lastMoveTime = performance.now();

    startLoop();
  }

  /**
   * The pointer has left the window.
   *
   * Only the segment is dropped. Stars already moving carry on coasting and
   * drifting home rather than freezing where the cursor abandoned them, and the
   * next arrival starts a fresh sweep from wherever it comes in.
   */
  function onPointerOut(event: PointerEvent): void {
    if (event.relatedTarget !== null) return;
    tracking = false;
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
    settle();
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
        offsetX = new Float64Array(stars.length);
        offsetY = new Float64Array(stars.length);
        velocityX = new Float64Array(stars.length);
        velocityY = new Float64Array(stars.length);
        mass = new Float64Array(stars.length);
      }

      for (let index = 0; index < stars.length; index += 1) {
        const star = stars[index];
        homeX[index] = star.x;
        homeY[index] = star.y;
        offsetX[index] = 0;
        offsetY[index] = 0;
        velocityX[index] = 0;
        velocityY[index] = 0;
        // By magnitude, smoothstepped: the faint majority is light and the few
        // bright ones are heavy, the same way the reference takes its mass from
        // particle size.
        const eased =
          star.magnitude * star.magnitude * (3 - 2 * star.magnitude);
        mass[index] =
          POINTER.massMin + (POINTER.massMax - POINTER.massMin) * eased;
      }

      width = nextWidth;
      height = nextHeight;
      halfStageHeight = nextHeight / 2;

      // Read once here rather than on every pointer event, which would be a
      // layout read per mouse move.
      const bounds = canvas.getBoundingClientRect();
      originX = bounds.left;
      originY = bounds.top;

      // A resize invalidates where the cursor was as well as the field: the
      // next move starts a fresh segment on a stage that now exists.
      tracking = false;
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
