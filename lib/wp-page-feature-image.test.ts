import { describe, expect, it } from "vitest";

import {
  wpPageBannerImage,
  wpPageFeatureImage,
} from "./wp-page-feature-image";

/**
 * The banner render decision for WordPress content pages (issue #3).
 *
 * This is the whole reason the decision lives in a pure function: the
 * page-has-an-image case and the page-has-no-image case are BOTH shipping
 * states here — 8 of the 14 in-scope pages have a featured image and 6 do
 * not — and getting the second one wrong renders an empty tinted box.
 *
 * Fixtures are the real values the live gateway returned on 2026-08-21, not
 * invented ones, so a change in the field's shape shows up as a failure here
 * rather than as a missing banner on the deployed site.
 */

const BIRTHDAYS_IMAGE =
  "https://pebblrboothrehearsal.headkit.cloud/wp-content/uploads/2025/10/Pebblr-Booth_Birthdays.jpg";

describe("wpPageFeatureImage", () => {
  it("reads the featured image off the page's Open Graph image", () => {
    expect(
      wpPageFeatureImage({ opengraphImageUrl: BIRTHDAYS_IMAGE }),
    ).toBe(BIRTHDAYS_IMAGE);
  });

  it("treats the empty string as no image — what WP returns for a page with none", () => {
    // `/packages`, `/booths`, `/fundraisers`, … all answer with "" rather
    // than null, so an `?? null` guard alone would let "" through and mount
    // an <Image src="">.
    expect(wpPageFeatureImage({ opengraphImageUrl: "" })).toBeNull();
  });

  it("treats a whitespace-only URL as no image", () => {
    expect(wpPageFeatureImage({ opengraphImageUrl: "   " })).toBeNull();
  });

  it("survives a page with no SEO data at all", () => {
    expect(wpPageFeatureImage(null)).toBeNull();
    expect(wpPageFeatureImage(undefined)).toBeNull();
    expect(wpPageFeatureImage({})).toBeNull();
  });
});

describe("wpPageBannerImage", () => {
  it("returns the image for a page that has one, so the banner renders", () => {
    expect(
      wpPageBannerImage({
        seo: { opengraphImageUrl: BIRTHDAYS_IMAGE },
        editorBlocks: [{ cssClasses: ["headkit-product-carousel"] }],
      }),
    ).toBe(BIRTHDAYS_IMAGE);
  });

  it("returns null for a page with no featured image, so NO empty banner box renders", () => {
    expect(
      wpPageBannerImage({ seo: { opengraphImageUrl: "" }, editorBlocks: [] }),
    ).toBeNull();
  });

  it("returns null when the page opens with a HeadKit hero carousel", () => {
    // That block is a full-bleed hero carrying its own H1 — the same condition
    // CmsPageBody uses to drop its title. A banner above it would stack two
    // heroes and two H1s.
    expect(
      wpPageBannerImage({
        seo: { opengraphImageUrl: BIRTHDAYS_IMAGE },
        editorBlocks: [
          { cssClasses: ["headkit-hero-carousel", "headkit-block-section"] },
        ],
      }),
    ).toBeNull();
  });

  it("finds a hero carousel that is not the first block", () => {
    expect(
      wpPageBannerImage({
        seo: { opengraphImageUrl: BIRTHDAYS_IMAGE },
        editorBlocks: [
          { cssClasses: ["headkit-block-section"] },
          { cssClasses: ["headkit-hero-carousel"] },
        ],
      }),
    ).toBeNull();
  });

  it("tolerates blocks with missing or null cssClasses", () => {
    expect(
      wpPageBannerImage({
        seo: { opengraphImageUrl: BIRTHDAYS_IMAGE },
        editorBlocks: [{}, { cssClasses: null }],
      }),
    ).toBe(BIRTHDAYS_IMAGE);
  });

  it("survives a page with neither SEO data nor blocks", () => {
    expect(wpPageBannerImage({})).toBeNull();
  });
});
