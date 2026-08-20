import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";

import { cn } from "@/lib/utils";

/**
 * V1's footer "Rated 5.0 on Google" badge, ported from
 * `src/components/ui/{google-rating,star-rating}.tsx` in the V1 reference
 * clone: five stars over the sentence, the whole lockup one link out to the
 * store's Google Maps listing.
 *
 * Mounted through the footer's generic `brandSlot` prop from `app/layout.tsx`,
 * not from inside `components/headkit-ui/footer.tsx` — the platform footer
 * stays free of Pebblr strings.
 */

/**
 * The rating number.
 *
 * V1 does NOT hardcode this: it reads the live figure from the Google Places
 * API (`src/lib/google-places.ts`, keyed by `GOOGLE_API_KEY` +
 * `GOOGLE_MAP_PLACE_ID`, cached 24h) and falls back to 4.8 when that call
 * fails. This repo has neither key and no Places integration of any kind, so
 * this is a hand-copy of what V1 served on 2026-08-21.
 *
 * It must be updated by hand until the same integration — or a platform
 * equivalent — exists here. Do not invent an env var for it: a key that is not
 * actually wired to a fetch is worse than an honest constant.
 */
const GOOGLE_RATING = 5.0;

/** The listing V1's badge links to, copied from V1's live footer markup. */
const GOOGLE_LISTING_URL = "https://maps.app.goo.gl/wSUeKNVJdoe2pBhB8";

const MAX_STARS = 5;

/**
 * Full / half / empty exactly as V1's `StarRating` splits them, so that a later
 * hand-edit of `GOOGLE_RATING` to a non-integer still renders the way V1 would
 * rather than silently rounding.
 */
function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(MAX_STARS, rating));
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: MAX_STARS }, (_, index) => {
        const difference = clamped - (index + 1);
        const className = cn("h-5 w-5 text-black");
        if (difference >= 0) return <FaStar key={index} className={className} />;
        if (difference > -1)
          return <FaStarHalfAlt key={index} className={className} />;
        return <FaRegStar key={index} className={className} />;
      })}
    </div>
  );
}

export function GoogleRating() {
  const rating = GOOGLE_RATING.toFixed(1);
  return (
    <a
      href={GOOGLE_LISTING_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Rated ${rating} on Google — read our reviews on Google Maps`}
      className="headkit-footer-google-rating w-fit text-primary"
    >
      <Stars rating={GOOGLE_RATING} />
      <div className="mt-2">
        <span>Rated {rating} on Google</span>
      </div>
    </a>
  );
}
