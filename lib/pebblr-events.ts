import { cacheLife, cacheTag } from "next/cache";
import { headkit } from "@/lib/sdk";
import { TAG } from "@/lib/cache-tags";
import type { EventPage } from "@/components/pebblr/events-carousel";

/**
 * The four event-type landing pages behind the homepage "Booths and video for
 * all events" rail, in the order V1 pins them. V1 queries `pages(nameIn: [...])`
 * and re-sorts client-side because WordPress returns them in post order; here
 * the array IS the order, so nothing needs re-sorting.
 */
export const EVENT_PAGE_SLUGS = [
  "wedding-photo-booth-adelaide",
  "corporate-events",
  "birthdays",
  "graduations",
] as const;

/**
 * Cache tags for the event rail. Page-entity tags (not a route tag) so a
 * WordPress edit to any one of these pages purges the rail — and ONLY the rail
 * plus the pages that embed it. `headkit:pages` covers create/delete of the
 * page type itself.
 */
export const EVENT_PAGE_TAGS: readonly string[] = [
  ...EVENT_PAGE_SLUGS.map((slug) => TAG.page(slug)),
  TAG.pages,
];

/**
 * Resolve the four event pages to carousel tiles.
 *
 * The tile image comes from `seo.opengraphImageUrl`, NOT `featuredImage`. That
 * is not a workaround for missing data — the gateway schema documents
 * `ContentNode.featuredImage` as "null for pages", and it is null for all four
 * here. Yoast defaults a page's OG image to its featured image, so the URL this
 * returns is byte-for-byte the one V1 renders (verified against live V1's
 * markup: Pebblr-Booth_{Weddings,Corporate-Events,Birthdays,Graduations}.jpg).
 * If the field is ever blank the tile still renders — the brand wash covers the
 * empty frame rather than leaving a broken image.
 *
 * Fetched with `allSettled` so one unreachable page drops a single tile instead
 * of collapsing the whole section.
 */
export async function getEventPages(): Promise<EventPage[]> {
  "use cache";
  cacheLife("days");
  cacheTag(...EVENT_PAGE_TAGS);

  const results = await Promise.allSettled(
    EVENT_PAGE_SLUGS.map((slug) => headkit.content.get(slug, "PAGE")),
  );

  return results.flatMap((result, index): EventPage[] => {
    if (result.status !== "fulfilled" || result.value === null) return [];
    const node = result.value;
    const slug = EVENT_PAGE_SLUGS[index] as string;
    return [
      {
        title: node.title,
        slug: node.slug || slug,
        uri: node.uri || `/${slug}`,
        image: node.seo?.opengraphImageUrl?.trim() ?? "",
      },
    ];
  });
}
