import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { WpPageHeader } from "./wp-page-header";

/**
 * V1's feature-image banner for WordPress content pages (issue #3).
 *
 * Rendered through `react-dom/server` — the starter's vitest environment is
 * `node` and there is no DOM testing library in the dependency set;
 * `components/pebblr/google-rating.test.tsx` is the in-repo precedent.
 *
 * What is load-bearing, and therefore asserted:
 *
 *   1. the IMAGE actually reaches the DOM. The whole bug was a banner that did
 *      not render, so "the component was mounted" is not the claim worth
 *      pinning — "an <img> pointing at the WordPress asset came out" is;
 *   2. the TITLE is the page H1 and is HTML-decoded. WordPress titles arrive
 *      entity-encoded ("Kids&#8217; Parties"); printing the entity verbatim is
 *      the visible failure;
 *   3. the mobile/desktop SPLIT survives. V1 does not overlay on mobile — the
 *      title reads below the image in dark ink and only lifts onto the photo
 *      from `md` up. Those responsive classes are the entire mobile treatment,
 *      so a refactor that flattens them to a permanent white overlay would
 *      leave white-on-photo-less text at 390px;
 *   4. the TINT layer ships and is decorative. It is the brand wash over the
 *      photo, and it must never be announced to a screen reader;
 *   5. the media box CLIPS. `overflow-hidden` is what makes the rounded corners
 *      real against a `fill` image that is deliberately larger than its box.
 *
 * The no-image case is NOT tested here because it cannot exist: `image` is a
 * required string and the route mounts this component only when
 * `wpPageBannerImage()` returned one. That decision is covered in
 * `lib/wp-page-feature-image.test.ts`.
 */

const IMAGE =
  "https://pebblrboothrehearsal.headkit.cloud/wp-content/uploads/2025/10/Pebblr-Booth_Birthdays.jpg";

function render(title: string, image = IMAGE): string {
  return renderToStaticMarkup(<WpPageHeader title={title} image={image} />);
}

describe("WpPageHeader", () => {
  it("renders the featured image", () => {
    const html = render("Birthdays");
    const src = html.match(/<img[^>]*\ssrc="([^"]+)"/)?.[1];
    expect(src).toBeDefined();
    // next/image routes the file through the optimizer, so the WordPress URL
    // survives percent-encoded in the `url` param rather than as a bare src.
    // (Only that param is decoded — decoding the whole document throws on the
    // literal `%` in the inline `height:100%` style next/image emits.)
    const url = new URLSearchParams(
      src!.replace(/&amp;/g, "&").split("?")[1],
    ).get("url");
    expect(url).toBe(IMAGE);
  });

  it("marks the banner as high priority — it is the page's LCP element", () => {
    // A lazily-loaded 450px hero is a measurable LCP regression, and the
    // default for next/image is lazy.
    expect(render("Birthdays")).toContain('fetchPriority="high"');
  });

  it("renders the page title as the H1", () => {
    expect(render("Birthdays")).toContain("<h1");
    expect(render("Birthdays")).toContain("Birthdays");
  });

  it("decodes HTML entities in the WordPress title", () => {
    const html = render("Kids&#8217; Parties");
    expect(html).toContain("Kids’ Parties");
    expect(html).not.toContain("&#8217;");
  });

  it("keeps the title dark below the image on mobile and white over it from md up", () => {
    const html = render("Birthdays");
    expect(html).toContain("flex-col-reverse");
    expect(html).toContain("md:flex-col");
    expect(html).toContain("md:absolute");
    expect(html).toContain("md:text-white");
    // The desktop title is pinned bottom-left, not centred — V1's placement.
    expect(html).toContain("md:items-end");
  });

  it("ships the brand tint as a decorative layer", () => {
    const html = render("Birthdays");
    expect(html).toContain("headkit-wp-page-banner__tint");
    expect(html).toContain('aria-hidden="true"');
  });

  it("clips the media box so the rounded corners are real", () => {
    const html = render("Birthdays");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("rounded-brand");
  });

  it("gives the image the page title as alt text rather than leaving it empty", () => {
    expect(render("Corporate Events")).toContain('alt="Corporate Events"');
  });
});
