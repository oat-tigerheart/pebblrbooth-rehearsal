import { cacheLife, cacheTag } from "next/cache";

/**
 * Google Places rating for the store's own Google Maps listing, ported from
 * V1's `src/lib/google-places.ts`.
 *
 * Feeds `components/pebblr/google-rating.tsx` — the footer "Rated X on Google"
 * badge — which until now carried the number as a hand-copied constant because
 * this repo had no Places integration. This module is that integration.
 *
 * Store-local by design: the place id and the listing are Pebblr's, so nothing
 * here belongs in `components/headkit-ui/` or in the shared platform starter.
 *
 * ## Credentials
 *
 * Read straight off `process.env`, NOT through `lib/env.ts`. That module is the
 * platform starter's env contract and re-merges from upstream; a store-specific
 * key added to its zod schema is a merge conflict waiting to happen, and it
 * would also make every other store's build parse a variable it never sets.
 *
 *  - `GOOGLE_API_KEY`      — Places API (New) key
 *  - `GOOGLE_MAP_PLACE_ID` — the business's place id
 *
 * Both are set on this store's Vercel project for production, preview and
 * development. Neither is present in local dev, which is fine: every path
 * without them falls back (see below), so `next dev` renders the badge exactly
 * as it did before this module existed.
 *
 * ## Caching — Cache Components, not fetch-level `next.revalidate`
 *
 * V1 caches with `next: { revalidate: 86400, tags: ['google-places-rating'] }`.
 * This app runs `cacheComponents: true` (see `next.config.ts`), where the
 * fetch-level options are superseded by the `"use cache"` family — the same
 * reason `lib/branding.ts` notes it carries "no fetch-level `next.revalidate`
 * here". The Cache Components equivalents are used instead and mean the same
 * thing:
 *
 *  - `cacheLife("days")`  ≡ `revalidate: 86400` (24h). The rating moves slowly
 *                           and the Places API bills per call, so this is a
 *                           cost control as much as a latency one.
 *  - `cacheTag(...)`      ≡ V1's `tags: ['google-places-rating']`, kept as the
 *                           same literal string.
 *
 * That tag is deliberately NOT one of `lib/cache-tags.ts`'s `headkit:*`
 * contract tags, and therefore cannot be purged through `/api/revalidate` —
 * `isKnownTag` rejects anything outside the contract vocabulary. Nothing fires
 * it today (WordPress knows nothing about Google reviews), so the 24h expiry is
 * the refresh mechanism. Keeping V1's literal preserves the option of a manual
 * `revalidateTag("google-places-rating")` without inventing a contract entry
 * for an event that has no publisher.
 *
 * `"use cache: remote"` rather than plain `"use cache"` for the same reason
 * `lib/stripe-config.ts` uses it: the read is then durable across Fluid Compute
 * invocations instead of re-earning a billed API call per cold instance.
 */

/** V1's `GooglePlacesRating`, renamed to this repo's camelCase convention. */
export interface GooglePlacesRating {
  rating: number;
  userRatingCount: number;
  placeId: string;
  name: string;
}

/** The subset of the Places API (New) place resource the field mask asks for. */
interface GooglePlacesResponse {
  rating?: number;
  userRatingCount?: number;
  displayName?: { text?: string };
}

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places";

/** V1's tag literal, kept verbatim. See the caching note above. */
export const GOOGLE_PLACES_RATING_TAG = "google-places-rating";

/**
 * Un-cached fetch. Exported separately from {@link getGooglePlacesRating} so
 * the fallback wiring — the only part of this module a shopper can be hurt by —
 * is testable: the cached wrapper's `"use cache: remote"` directive needs a live
 * Cache Components runtime and `cacheLife()` throws outside one, so the wrapper
 * itself cannot run under Vitest. `lib/stripe-config.ts` splits for the same
 * reason.
 *
 * Returns `null` — never throws, never a partial object — for every failure
 * mode: no key, no place id, non-OK response, unparseable body, a body missing
 * `rating`, or a thrown/aborted fetch. The caller renders the fallback badge
 * from that single `null`, so a Google outage costs the footer nothing.
 */
export async function fetchGooglePlacesRating(): Promise<GooglePlacesRating | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const placeId = process.env.GOOGLE_MAP_PLACE_ID;

  if (!apiKey || !placeId) return null;

  try {
    const response = await fetch(
      `${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Places API (New) REQUIRES a field mask; omitting it is a 400, and
          // asking for more than is rendered is billed at a higher SKU tier.
          "X-Goog-FieldMask": "rating,userRatingCount,displayName",
        },
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as GooglePlacesResponse;

    // A place with no reviews has no `rating` at all. Treat that as "nothing to
    // show" rather than rendering zero stars over a five-star sentence.
    if (typeof data?.rating !== "number" || !Number.isFinite(data.rating)) {
      return null;
    }

    return {
      rating: data.rating,
      userRatingCount:
        typeof data.userRatingCount === "number" ? data.userRatingCount : 0,
      placeId,
      name: data.displayName?.text ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Cached rating for the footer badge. Thin wrapper by design — see
 * {@link fetchGooglePlacesRating} for why the logic lives there.
 *
 * Cached (not just for speed) so the root layout's read does not make every
 * route dynamic: an un-cached fetch in a component mounted from `app/layout.tsx`
 * would poison static prerender for the whole site under Cache Components.
 */
export async function getGooglePlacesRating(): Promise<GooglePlacesRating | null> {
  "use cache: remote";
  cacheLife("days");
  cacheTag(GOOGLE_PLACES_RATING_TAG);

  return fetchGooglePlacesRating();
}
