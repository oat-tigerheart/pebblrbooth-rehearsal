import { Fragment } from "react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { TAG } from "@/lib/cache-tags";
import { headkit } from "@/lib/sdk";
import type { Product, FeaturedBrand } from "@headkit/sdk";
import { processHomepageContent } from "@/lib/process-editor-blocks";
import {
  makeRootMetadata,
  resolveHomeTitle,
  resolveHomeDescription,
  resolveStoreName,
} from "@/lib/make-metadata";
import { getBranding, getBrandingAssets } from "@/lib/branding";
import { Hero } from "@/components/pebblr/hero";
import { StepsSection } from "@/components/pebblr/steps-section";
import { EventsCarousel } from "@/components/pebblr/events-carousel";
import { BrandWall } from "@/components/pebblr/brand-wall";
import { CtaBanner } from "@/components/pebblr/cta-banner";
import { getEventPages, EVENT_PAGE_TAGS } from "@/lib/pebblr-events";
import { BlockEditor } from "@/components/headkit-ui/block-editor";
import { EditorialContent } from "@/components/headkit-ui/editorial-content";
import { SectionHeader } from "@/components/headkit-ui/section-header";
import { CarouselProductJsonLD } from "@/components/seo/carousel-product-json-ld";

const EMPTY_COLLECTION = {
  products: [] as Product[],
  total: 0,
  page: 1,
  perPage: 8,
  totalPages: 0,
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [{ homepage }, { seoSettings, storeSettings }, { iconUrl }] =
      await Promise.all([
        getHomepageData(),
        getBranding(),
        getBrandingAssets(),
      ]);
    const siteName = resolveStoreName(storeSettings.name);
    const yoastSeo = homepage?.page?.seo;
    const entityOg =
      (yoastSeo as { opengraphImageUrl?: string | null } | null | undefined)
        ?.opengraphImageUrl ?? null;

    return makeRootMetadata({
      title: resolveHomeTitle({
        yoastTitle: yoastSeo?.title,
        dashboardTitle: seoSettings.title,
        storeName: storeSettings.name,
      }),
      description: resolveHomeDescription({
        yoastDescription: yoastSeo?.metaDesc,
        dashboardDescription: seoSettings.description,
      }),
      siteName,
      iconUrl,
      ogImageUrl: entityOg || seoSettings.ogImageUrl,
      allowIndexing: seoSettings.allowIndexing,
    });
  } catch {
    return makeRootMetadata({ siteName: "Store" });
  }
}

/**
 * Home cache-tag(s) (D7 / CACHE-04). Home is ONE monolithic cached entry backed
 * by a single aggregate `homepage.get()`. Primary tag: `route:home` (carousel,
 * news, featured/new/sale product, page-on-front). Also tags branding +
 * collections because HomeContent reads hide-empty branding and may filter
 * featured categories from the catalog.
 *
 * The former per-module `module:{carousel,news,brand,featured}` tags were
 * removed: with an indivisible `homepage.get()` bundle they could never
 * invalidate a section independently (they only ever purged the whole entry via
 * this union), so they were pure noise. True per-section revalidation needs the
 * data split first (per-module SDK methods + subgraph resolvers + WP endpoints).
 */
const HOME_TAGS: readonly string[] = [
  TAG.route("home"),
  TAG.branding,
  TAG.collections,
  // The event rail reads four WordPress PAGES that are not part of
  // `homepage.get()`. Without their entity tags here, editing the Weddings
  // page would refresh /wedding-photo-booth-adelaide and leave the homepage
  // tile showing the old title and artwork until the `days` life expired.
  ...EVENT_PAGE_TAGS,
];

export async function getHomepageData() {
  "use cache";
  cacheLife("days");
  cacheTag(...HOME_TAGS);

  // Split fetches so a homepage.get() failure does not null On Sale
  // collections (P2 resilience).
  const [homepageResult, onSaleResult] = await Promise.allSettled([
    headkit.homepage.get(),
    headkit.collections.list({ onSale: true }, 1, 8),
  ]);

  return {
    homepage:
      homepageResult.status === "fulfilled" ? homepageResult.value : null,
    onSaleProducts:
      onSaleResult.status === "fulfilled"
        ? onSaleResult.value
        : EMPTY_COLLECTION,
  };
}

export async function HomeContent() {
  "use cache";
  cacheLife("days");
  cacheTag(...HOME_TAGS);

  const [{ homepage }, eventPages] = await Promise.all([
    getHomepageData(),
    getEventPages(),
  ]);

  const featuredBrands = (homepage?.featuredBrands ??
    []) as unknown as FeaturedBrand[];
  const featuredProducts = (homepage?.featuredProducts ??
    []) as unknown as Product[];
  const { segments } = processHomepageContent(
    homepage?.page?.content ?? "",
    (homepage?.page?.editorBlocks ?? []) as Array<{
      products?: unknown[];
      attrs?: Record<string, unknown> | null;
      queryType?: string | null;
    }>,
  );

  return (
    <>
      {featuredProducts.length > 0 && (
        <CarouselProductJsonLD products={featuredProducts} />
      )}

      <Hero
        title="Adelaide's best Photobooth hire"
        button={{ text: "Choose a Package", url: "/book-now" }}
        video={{
          webm: "/pebblr-hero.webm",
          alt: "Guests posing together in a Pebblr Booth at an Adelaide event",
        }}
      />

      {/*
        WP front-page content in editor document order, with StepsSection
        slotted in after the first HeadKit section.

        V1 renders `<BlockEditor section="section-1" />`, then StepsSection,
        then `<BlockEditor section="section-2" />`. The equivalent here is to
        walk the ordered segments and emit StepsSection immediately after the
        `section-1` block, rather than appending the hardcoded sections after
        all WP content. Today that is the "HeadKit Hilight" group (which
        carries no explicit `section-*` class, so the parser defaults it to
        `section-1`) followed by "HeadKit Product Carousel" (`section-2`).
        A third WP section would land after Steps, which is where the editor
        put it.
      */}
      {segments.map((seg, index) => {
        const body =
          seg.kind === "html" ? (
            <section className="headkit-cms-html hk-section-content px-5 md:px-10 py-10">
              <EditorialContent html={seg.html} />
            </section>
          ) : (
            <BlockEditor blocks={[seg.block]} />
          );

        return (
          <Fragment key={`wp-seg-${index}`}>
            {body}
            {seg.kind === "block" && seg.block.section === "section-1" ? (
              <StepsSection />
            ) : null}
          </Fragment>
        );
      })}

      {eventPages.length > 0 && (
        <section className="headkit-category-carousel overflow-hidden py-[30px]">
          <SectionHeader
            title="Booths and video for all events"
            description="We make the best time for Weddings, Corporate and Birthdays."
            allButton="All events"
            allButtonPath="/events"
            className="px-5 md:px-10"
          />
          <div className="mt-5">
            <EventsCarousel pages={eventPages} />
          </div>
        </section>
      )}

      <BrandWall brands={featuredBrands} />

      <CtaBanner />
    </>
  );
}

/**
 * Instant Navigation (Next.js 16.3) — sync App Shell + Suspense streaming.
 * @see https://nextjs.org/docs/app/guides/instant-navigation
 */
export const instant = true;

export default function Home() {
  // HomeContent is fully cached ('use cache') — rendering it without a
  // Suspense boundary bakes it into the prerendered shell in document order,
  // so the homepage is visible without JavaScript.
  return (
    <div className="headkit-home overflow-hidden">
      <HomeContent />
    </div>
  );
}
