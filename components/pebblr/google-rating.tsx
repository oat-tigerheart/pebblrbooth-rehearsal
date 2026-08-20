import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";

import { cn } from "@/lib/utils";
import { getGooglePlacesRating } from "@/lib/google-places";

/**
 * V1's footer "Rated 5.0 on Google" badge, ported from
 * `src/components/ui/{google-rating,star-rating}.tsx` in the V1 reference
 * clone: five stars over the sentence, the whole lockup one link out to the
 * store's Google Maps listing.
 *
 * Mounted through the footer's generic `brandSlot` prop from `app/layout.tsx`,
 * not from inside `components/headkit-ui/footer.tsx` — the platform footer
 * stays free of Pebblr strings.
 *
 * The number is now LIVE, read from the Google Places API via
 * `lib/google-places.ts` (24h cache, `GOOGLE_API_KEY` + `GOOGLE_MAP_PLACE_ID`
 * on this store's Vercel project). It used to be a hand-copied constant; that
 * constant survives only as the fallback below.
 */

/**
 * Shown when the Places read returns `null` — no key (every local dev run), no
 * place id, a Google outage, a rate limit, a malformed body.
 *
 * The badge must render in all of those cases: it is social proof in the
 * footer, so disappearing is worse than being slightly stale, and "Rated
 * undefined on Google" is worse than either. This is the figure V1 served on
 * 2026-08-21, and the live value is the same 5.0 today — so the fallback is
 * currently indistinguishable from a successful fetch on screen. That is why
 * `data-rating-source` exists (see below).
 */
const FALLBACK_RATING = 5.0;

/** The listing V1's badge links to, copied from V1's live footer markup. */
const GOOGLE_LISTING_URL = "https://maps.app.goo.gl/wSUeKNVJdoe2pBhB8";

const MAX_STARS = 5;

/**
 * Full / half / empty exactly as V1's `StarRating` splits them, so a rating
 * that drifts off 5.0 renders honestly rather than silently rounding up to five
 * solid stars.
 */
function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(MAX_STARS, rating));
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: MAX_STARS }, (_, index) => {
        const difference = clamped - (index + 1);
        const className = cn("h-5 w-5 text-black");
        if (difference >= 0)
          return <FaStar key={index} className={className} />;
        if (difference > -1)
          return <FaStarHalfAlt key={index} className={className} />;
        return <FaRegStar key={index} className={className} />;
      })}
    </div>
  );
}

export async function GoogleRating() {
  const live = await getGooglePlacesRating();
  const value = live?.rating ?? FALLBACK_RATING;
  const rating = value.toFixed(1);
  return (
    <a
      href={GOOGLE_LISTING_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Rated ${rating} on Google — read our reviews on Google Maps`}
      className="headkit-footer-google-rating w-fit text-primary"
      /*
       * Invisible diagnostic, and the only way to tell a live read from the
       * fallback on a deployed page.
       *
       * The live rating and the fallback are BOTH 5.0 right now, so identical
       * markup is produced whether the Places call succeeded or silently
       * returned null — which means a broken key, a revoked key, or a missing
       * env var on a future deploy would look exactly like success. The count
       * is the discriminator: the fallback has no way to know it.
       *
       * Deliberately a data attribute, not visible copy — the badge's rendered
       * text, link and layout are unchanged from the hardcoded version.
       */
      data-rating-source={live ? "google-places" : "fallback"}
      data-rating-count={live?.userRatingCount ?? undefined}
    >
      <Stars rating={value} />
      <div className="mt-2">
        <span>Rated {rating} on Google</span>
      </div>
    </a>
  );
}
