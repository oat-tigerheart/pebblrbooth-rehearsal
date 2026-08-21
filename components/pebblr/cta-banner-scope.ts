/**
 * Where the closing CTA banner mounts — the single source of truth (issue #1).
 *
 * The banner is scoped by ROUTE-LEVEL COMPOSITION: each route that should show
 * it renders `<CtaBanner />` itself. There is deliberately no root-layout
 * mount. V1 does that (`src/components/cta/cta-section-wrapper.tsx`: a
 * `"use client"` component reading `usePathname` against a denylist), but this
 * app runs Next 16 with Cache Components enabled, and a dynamic read at root
 * altitude poisons static prerendering site-wide — see the Suspense-altitude
 * notes in AGENTS.md and the `"use cache"` discipline in `lib/branding.ts`.
 *
 * Composition means the mount is spread over a handful of files, so this list
 * is what keeps them from drifting: `cta-banner-scope.test.ts` scans `app/`
 * and fails if any route mounts the banner without being listed here, or is
 * listed here without mounting it. Adding a route = add the mount AND the
 * entry; the test tells you if you did only one.
 *
 * ALLOWLIST, not a denylist: a transactional route added next year must not
 * inherit a marketing CTA by default. Every route not listed here is hidden,
 * including `/faq`, `/checkout`, `/account`, `/contact`, `/quote`, `/search`,
 * `/shop`, `/collections/*`, `/projects`, `/brand`, `/client`, `/featured`,
 * `/new` and `/sale`.
 */
export const CTA_BANNER_ROUTES = [
  /** Home. */
  "app/page.tsx",
  /**
   * Product Detail Page. `app/shop/[...slug]/page.tsx` delegates its product
   * URLs to this file's exported `ProductPageContent`, so a PDP reached at
   * `/shop/…` shows the banner too — same composition, and it is still a PDP.
   * The `/shop` index and its CATEGORY URLs render `CollectionRoute` instead
   * and stay banner-free, which is the listing behaviour the scope asks for.
   */
  "app/products/[...slug]/page.tsx",
  /** News index. */
  "app/news/page.tsx",
  /** Individual news post. */
  "app/news/[...slug]/page.tsx",
  /**
   * WordPress content pages (`/birthdays`, `/wedding-photo-booth-adelaide`,
   * `/corporate-events`, …). Gated per slug — see `wpPageShowsCtaBanner`.
   */
  "app/[...slug]/page.tsx",
] as const;

/**
 * The one unavoidable denylist. WP page slugs are open-ended, so the catch-all
 * cannot be allowlisted the way the fixed routes above are — a new WP page
 * should get the banner by default, which is why the catch-all is in scope at
 * all. These slugs opt out. Keep the list short; add a slug with a reason.
 *
 * - `book-now` — the banner's own destination. It returns 200 but has NO route
 *   directory: it is served by the WP catch-all, so without this entry a
 *   "Book Now" CTA lands on the booking page, a dead end.
 *
 * Matched on the FIRST path segment, so a child page (`/book-now/deposit`)
 * opts out with its parent.
 */
export const CTA_BANNER_WP_SLUG_DENYLIST: readonly string[] = ["book-now"];

/** Whether the WP catch-all should render the banner for this page slug. */
export function wpPageShowsCtaBanner(slug: readonly string[]): boolean {
  const first = slug[0]?.trim().toLowerCase();
  if (!first) return false;
  return !CTA_BANNER_WP_SLUG_DENYLIST.includes(first);
}
