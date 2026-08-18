import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Home cache-tag/life union guard (09.5-03, CACHE-04 / D7).
 *
 * D7: home is ONE monolithic cached entry backed by a single aggregate
 * `homepage.get()` bundle. The primary tag is `route:home`; branding + collections
 * are also tagged because HomeContent reads hide-empty branding and may filter
 * featured categories. Both cached home fns (`getHomepageData` + `HomeContent`)
 * MUST carry the SAME tag union. Both use the finite `days` backstop.
 *
 * `next/cache` is mocked to capture `cacheTag` / `cacheLife`; the SDK, UI
 * components and lib helpers are stubbed so the page module imports in node env.
 */

const cacheTag = vi.fn<(...tags: string[]) => void>();
const cacheLife = vi.fn<(profile: string) => void>();
const homepageGet = vi.fn<() => Promise<unknown>>();
const collectionsList = vi.fn<() => Promise<unknown>>();
const contentGet = vi.fn<() => Promise<unknown>>();

vi.mock("next/cache", () => ({
  cacheTag: (...tags: string[]): void => cacheTag(...tags),
  cacheLife: (profile: string): void => cacheLife(profile),
}));

vi.mock("@/lib/sdk", () => ({
  headkit: {
    homepage: { get: (): Promise<unknown> => homepageGet() },
    collections: { list: (): Promise<unknown> => collectionsList() },
    // `getEventPages` (the homepage event rail) reads four WP pages by slug.
    content: { get: (): Promise<unknown> => contentGet() },
  },
}));

vi.mock("@/lib/process-editor-blocks", () => ({
  processEditorBlocks: (): unknown[] => [],
  processHomepageContent: (): {
    blocks: unknown[];
    leftoverHtml: string;
    segments: unknown[];
  } => ({ blocks: [], leftoverHtml: "", segments: [] }),
  getBlockQueryType: (): null => null,
  hasEditorSectionClass: (): boolean => false,
}));
vi.mock("@/lib/make-metadata", () => ({
  makeRootMetadata: (): Record<string, unknown> => ({}),
  resolveHomeTitle: (): string => "",
  resolveHomeDescription: (): string => "",
  resolveStoreName: (): string => "Store",
}));
vi.mock("@/lib/branding", () => ({
  getBranding: (): Promise<{
    branding: { hideEmptyCollections: boolean };
    seoSettings: Record<string, unknown>;
    storeSettings: { name: string };
  }> =>
    Promise.resolve({
      branding: { hideEmptyCollections: false },
      seoSettings: {},
      storeSettings: { name: "Store" },
    }),
  getBrandingAssets: (): Promise<{ iconUrl: null }> =>
    Promise.resolve({ iconUrl: null }),
}));

vi.mock("@/lib/hide-empty-collections", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/hide-empty-collections")>();
  return {
    ...actual,
    getNonEmptyCollectionSlugs: (): Promise<ReadonlySet<string> | null> =>
      Promise.resolve(null),
  };
});

// NOTE: vi.mock factories are hoisted above module-scope consts, so the stub
// component must be inlined in each factory (cannot reference an outer const).
vi.mock("@/components/headkit-ui/main-carousel", () => ({
  MainCarousel: (): null => null,
}));
vi.mock("@/components/headkit-ui/block-editor", () => ({
  BlockEditor: (): null => null,
}));
vi.mock("@/components/headkit-ui/editorial-content", () => ({
  EditorialContent: (): null => null,
}));
vi.mock("@/components/seo/carousel-product-json-ld", () => ({
  CarouselProductJsonLD: (): null => null,
}));
vi.mock("@/components/headkit-ui/product-carousel", () => ({
  ProductCarousel: (): null => null,
}));
vi.mock("@/components/headkit-ui/category-carousel", () => ({
  CategoryCarousel: (): null => null,
}));
vi.mock("@/components/headkit-ui/section-header", () => ({
  SectionHeader: (): null => null,
}));
vi.mock("@/components/ui/skeleton", () => ({ Skeleton: (): null => null }));
vi.mock("@/components/pebblr/hero", () => ({ Hero: (): null => null }));
vi.mock("@/components/pebblr/steps-section", () => ({
  StepsSection: (): null => null,
}));
vi.mock("@/components/pebblr/events-carousel", () => ({
  EventsCarousel: (): null => null,
}));
vi.mock("@/components/pebblr/brand-wall", () => ({
  BrandWall: (): null => null,
}));
vi.mock("@/components/pebblr/cta-banner", () => ({
  CtaBanner: (): null => null,
}));

import { getHomepageData, HomeContent } from "./page";

/**
 * The home tag union. The four `headkit:page:*` entries and `headkit:pages`
 * are the event rail: it reads four WordPress PAGES that `homepage.get()` does
 * not carry, so without their entity tags a page edit would refresh that page's
 * own route and leave the homepage tile stale until the `days` life expired.
 */
const HOME_UNION = [
  "headkit:route:home",
  "headkit:branding",
  "headkit:collections",
  "headkit:page:wedding-photo-booth-adelaide",
  "headkit:page:corporate-events",
  "headkit:page:birthdays",
  "headkit:page:graduations",
  "headkit:pages",
];

beforeEach(() => {
  cacheTag.mockClear();
  cacheLife.mockClear();
  homepageGet.mockReset();
  collectionsList.mockReset();
  contentGet.mockReset();
  contentGet.mockResolvedValue(null);
  homepageGet.mockResolvedValue(null);
  collectionsList.mockResolvedValue({
    products: [],
    total: 0,
    page: 1,
    perPage: 8,
    totalPages: 0,
  });
});

describe("getHomepageData — union-tagged, days backstop", () => {
  it("carries the full home union at cacheLife('days')", async () => {
    await getHomepageData();
    expect(cacheTag).toHaveBeenCalledWith(...HOME_UNION);
    expect(cacheLife).toHaveBeenCalledWith("days");
  });
});

describe("HomeContent — union-tagged, days backstop", () => {
  it("carries the full home union at cacheLife('days')", async () => {
    await HomeContent();
    expect(cacheTag).toHaveBeenCalledWith(...HOME_UNION);
    expect(cacheLife).toHaveBeenCalledWith("days");
  });
});

describe("no legacy home tag / max life survives", () => {
  it("never uses headkit:homepage or cacheLife('max')", async () => {
    await getHomepageData();
    await HomeContent();
    expect(cacheTag.mock.calls.flat()).not.toContain("headkit:homepage");
    expect(cacheLife).not.toHaveBeenCalledWith("max");
  });
});

describe("getHomepageData — fetch resilience", () => {
  it("keeps on-sale collection results when homepage.get() rejects", async () => {
    homepageGet.mockRejectedValueOnce(new Error("homepage down"));
    collectionsList.mockResolvedValueOnce({
      products: [{ id: "s1" }],
      total: 1,
      page: 1,
      perPage: 8,
      totalPages: 1,
    });

    const data = await getHomepageData();
    expect(data.homepage).toBeNull();
    expect(data.onSaleProducts?.products).toEqual([{ id: "s1" }]);
    // New Arrivals fetch removed — only one collections.list call (on sale).
    expect(collectionsList).toHaveBeenCalledTimes(1);
  });
});
