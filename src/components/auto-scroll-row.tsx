"use client";

import { type ReactNode, useEffect, useRef } from "react";

const SPEED = 24; // px per second — slow enough to read the chips as they pass
const EDGE_HOLD = 1400; // ms held at either end before turning around
const RESUME_DELAY = 3000; // ms of quiet after the visitor scrolls, before the drift picks up again
const SLACK = 8; // px of overflow below which there is nothing worth scrolling

/**
 * Horizontal strip that drifts sideways on its own and turns around at each end, while staying an ordinary scroll
 * container: swipe, trackpad, wheel and scrollbar all still work, and any of them parks the drift for a few seconds.
 * Hover, keyboard focus, a background tab, a layout with no overflow (the wrapped desktop row) and a reduced-motion
 * preference each stop it outright.
 */
export function AutoScrollRow({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let pos = el.scrollLeft;
    let direction = 1;
    let holdUntil = 0; // paused at an end
    let idleUntil = 0; // paused because the visitor just scrolled
    let last = 0;
    let held = false; // pointer over the row, or focus inside it

    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      // Clamped so returning to a background tab does not jump the row forward by the whole time away.
      const elapsed = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      const max = el.scrollWidth - el.clientWidth;
      if (max < SLACK || held || document.hidden || now < holdUntil || now < idleUntil) {
        pos = el.scrollLeft; // stay where the visitor left it
        return;
      }

      pos += direction * SPEED * elapsed;
      if (pos >= max) {
        pos = max;
        direction = -1;
        holdUntil = now + EDGE_HOLD;
      } else if (pos <= 0) {
        pos = 0;
        direction = 1;
        holdUntil = now + EDGE_HOLD;
      }
      el.scrollLeft = pos;
    };

    const park = () => {
      idleUntil = performance.now() + RESUME_DELAY;
      pos = el.scrollLeft;
    };
    /** A jump we did not make means the visitor moved the row (scrollbar drag, momentum, shift-wheel). */
    const onScroll = () => {
      if (Math.abs(el.scrollLeft - pos) > 2) park();
    };
    const hold = () => {
      held = true;
    };
    const release = () => {
      held = false;
      pos = el.scrollLeft;
    };

    const start = () => {
      if (motion.matches || frame) return;
      last = 0;
      pos = el.scrollLeft;
      frame = requestAnimationFrame(step);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const onMotionChange = () => (motion.matches ? stop() : start());

    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", release);
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", release);
    el.addEventListener("pointerdown", park);
    el.addEventListener("wheel", park, { passive: true });
    el.addEventListener("touchstart", park, { passive: true });
    el.addEventListener("keydown", park);
    el.addEventListener("scroll", onScroll, { passive: true });
    motion.addEventListener("change", onMotionChange);
    start();

    return () => {
      stop();
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", release);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", release);
      el.removeEventListener("pointerdown", park);
      el.removeEventListener("wheel", park);
      el.removeEventListener("touchstart", park);
      el.removeEventListener("keydown", park);
      el.removeEventListener("scroll", onScroll);
      motion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <nav ref={ref} aria-label={label} className={className}>
      {children}
    </nav>
  );
}
