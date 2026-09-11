import type { ReactNode } from "react";

/*
 * The strip's layout and animation ship inside the page's HTML rather than globals.css, so it still scrolls when a
 * browser (seen with Safari during development) keeps an older copy of the main stylesheet.
 */
const MARQUEE_CSS = `
@keyframes hn-marquee { to { transform: translateX(-50%); } }
.hn-marquee {
  max-width: 72rem;
  margin-inline: auto;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}
.hn-marquee-track { display: flex; width: max-content; animation: hn-marquee 40s linear infinite; }
.hn-marquee:hover .hn-marquee-track, .hn-marquee:focus-within .hn-marquee-track { animation-play-state: paused; }
.hn-marquee-copy { display: flex; flex-shrink: 0; gap: 1rem; padding-right: 1rem; margin: 0; list-style: none; }
@media (min-width: 40rem) { .hn-marquee-copy { gap: 1.25rem; padding-right: 1.25rem; } }
@media (prefers-reduced-motion: reduce) {
  .hn-marquee { -webkit-mask-image: none; mask-image: none; }
  .hn-marquee-track { width: auto; animation: none; }
  .hn-marquee-copy { width: 100%; flex-shrink: 1; flex-wrap: wrap; justify-content: center; padding-inline: 1rem; }
  .hn-marquee-copy[aria-hidden="true"] { display: none; }
}
`;

/** Four copies, so half the track is always wider than the strip and sliding by half loops without a gap. */
const COPIES = [0, 1, 2, 3];

/**
 * Endless sideways strip that pauses on hover or keyboard focus, and stands still (one centred, wrapped copy) when the
 * visitor prefers reduced motion. `children` renders the `<li>` items for one copy; only the first copy is real, the
 * rest are hidden from screen readers, and `hidden` tells the caller to take their links out of the tab order.
 */
export function Marquee({ children }: { children: (hidden: boolean) => ReactNode }) {
  return (
    <>
      <style href="hn-marquee" precedence="default">
        {MARQUEE_CSS}
      </style>
      <div className="hn-marquee">
        <div className="hn-marquee-track">
          {COPIES.map((copy) => (
            <ul key={copy} aria-hidden={copy > 0 || undefined} className="hn-marquee-copy">
              {children(copy > 0)}
            </ul>
          ))}
        </div>
      </div>
    </>
  );
}
