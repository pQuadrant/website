"use client";

import { memo, useEffect, useState } from "react";

/**
 * Cairo local time, 24-hour and zero-padded to two digits.
 *
 * Resolved through the `Africa/Cairo` zone rather than a fixed offset: Egypt
 * observes daylight saving time, so its offset from UTC changes twice a year
 * and a hardcoded one is wrong for roughly half of it. Built once at module
 * scope, because constructing a formatter is not cheap and this one runs every
 * second.
 */
const cairoTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/**
 * The only live value in the chrome, and the only element on the page that
 * changes every second.
 *
 * It holds its own state and is memoised, so a tick re-renders this component
 * and nothing else, and a state change anywhere else on the page does not
 * disturb it. Specified in `docs/design/chrome.md`.
 */
export const Clock = memo(function Clock() {
  // Empty until the first client tick. There is no correct value at build
  // time, and rendering one on the server would either jump when the page
  // becomes interactive or mismatch during hydration.
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    // Read the current time on every update rather than advancing a stored
    // value: a counted tick drifts, and a browser throttles timers in a
    // background tab, so a counter comes back stale.
    const show = () => setTime(cairoTime.format(new Date()));

    show();
    const tick = setInterval(show, 1000);

    // A throttled tab can be a while from its next tick when it is brought
    // back, so correct the display the moment it becomes visible.
    document.addEventListener("visibilitychange", show);

    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", show);
    };
  }, []);

  return (
    // The slot holds the width of the eight characters it will contain,
    // tracking included, so the right-anchored cluster does not shift when the
    // first value appears or as the digits change.
    <span className="inline-block w-[calc(8ch_+_8*var(--text-meta--letter-spacing))] whitespace-nowrap">
      {time}
    </span>
  );
});
