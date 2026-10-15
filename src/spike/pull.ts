/**
 * SPIKE. Tuning for the route gestures: the pull down that closes the
 * marketplace, and the swipe up on home that opens it. The swipe moves
 * nothing, so it shares only the dead zone.
 */

/** How far the content moves per unit of finger or wheel travel. */
export const RESISTANCE = 0.55;
/** Content travel, in pixels, past which releasing navigates. */
export const COMMIT_AT = 70;
/** Movement below this, in pixels, decides nothing yet. */
export const DEAD_ZONE = 6;
