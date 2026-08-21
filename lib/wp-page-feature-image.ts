/**
 * The WordPress FEATURED IMAGE for a CMS page, read off the page's SEO data.
 *
 * Why not `page.featuredImage`? The SDK's `content()` query DOES select
 * `featuredImage { src alt width height }` — the gap is server-side. The
 * commerce resolver only populates it for POSTs; its own schema doc says so
 * ("Featured image; null for pages") and the live gateway agrees:
 *
 *   query { commerce { content(slug:"birthdays", type:PAGE)
 *           { featuredImage { src } } } }
 *   → { "featuredImage": null }
 *
 * while WordPress happily reports `featured_media: 3706` for the same page.
 * Populating it is a platform (commerce/gateway) change, not a storefront one.
 *
 * Yoast's Open Graph image, however, DEFAULTS to the featured image, and that
 * field IS already resolved and already in the query. Verified against
 * WordPress on 2026-08-21 for all 14 in-scope pages: `seo.opengraphImageUrl`
 * equalled `wp/v2/media/{featured_media}.source_url` byte-for-byte on the 8
 * pages that have a featured image, and was `""` on the 6 that do not
 * (fundraisers, brand-activation-2, booths, packages, extra-add-on-services,
 * venue-checklist).
 *
 * THE TRAP: this is a PROXY for the featured image, not the featured image.
 * Two ways it can drift, both authored in WordPress and both invisible here:
 *
 *   1. an editor sets a per-page "Social image" in Yoast that differs from the
 *      featured image — the banner then shows the social image;
 *   2. someone sets a site-wide Yoast fallback OG image — every page without a
 *      featured image would start returning that URL, and the six pages that
 *      currently degrade to a plain title would grow a banner of it.
 *
 * Neither is detectable from the storefront. If either happens, the fix is to
 * populate `featuredImage` on PAGE in commerce and switch this helper over —
 * the call site takes a plain `string | null`, so that is a one-line swap.
 */
export function wpPageFeatureImage(
  seo: { opengraphImageUrl?: string | null } | null | undefined,
): string | null {
  const url = seo?.opengraphImageUrl?.trim();
  return url ? url : null;
}

/** Shape of the bits of a CMS page the banner decision reads. */
interface BannerPage {
  seo?: { opengraphImageUrl?: string | null } | null;
  editorBlocks?: ReadonlyArray<{
    cssClasses?: readonly string[] | null;
  }> | null;
}

/**
 * The banner image for a WP content page, or `null` to render no banner.
 *
 * The whole render decision, in one pure place, because both of its answers
 * are load-bearing: 6 of the 14 in-scope pages have no featured image, and an
 * empty tinted box where a photo should be is worse than no banner at all.
 * `null` means the route mounts nothing and `CmsPageBody` keeps its ordinary
 * in-flow H1 — the title stays legible and nothing shifts.
 *
 * (V1 does the opposite: it renders the banner regardless, so
 * `pebblrbooth.com.au/packages` shows a bare purple-to-blue panel with white
 * text on a pale wash — barely readable. Issue #3 asks for a sensible
 * degradation rather than that, so this is a deliberate divergence from V1.)
 *
 * The second `null` case is a page whose blocks already open with a HeadKit
 * hero carousel. That carousel is a full-bleed hero with its own H1 — the same
 * condition `CmsPageBody` uses to suppress its title — so a banner above it
 * would stack two heroes. None of the 14 pages does this today; the guard is
 * here because adding a hero block is an ordinary editor action and the
 * failure would be silent.
 */
export function wpPageBannerImage(page: BannerPage): string | null {
  const hasHeroCarousel = (page.editorBlocks ?? []).some((block) =>
    (block?.cssClasses ?? []).includes("headkit-hero-carousel"),
  );
  if (hasHeroCarousel) return null;
  return wpPageFeatureImage(page.seo);
}
