import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { GoogleRating } from "./google-rating";

/**
 * `GoogleRating` — V1's footer badge, ported here as a store-local component
 * because this repo has no Google Places integration to fetch the number from.
 *
 * Rendered through `react-dom/server`: the starter's vitest environment is
 * `node` and there is no DOM testing library in the dependency set —
 * `components/checkout/addon-details.test.tsx` is the in-repo precedent.
 *
 * What is actually load-bearing here, and therefore asserted:
 *
 *   1. the LINK. The badge is social proof only if it reaches the listing, and
 *      only if it opens away from a store the shopper may be mid-checkout in —
 *      so the exact V1 href, `target="_blank"`, and `rel="noopener noreferrer"`
 *      (a `_blank` without `noopener` hands the opened tab a live handle on
 *      this one) are all checked, not just the presence of an anchor;
 *   2. the RATING TEXT reads exactly as V1's, one decimal place. "Rated 5 on
 *      Google" is what a missing `toFixed` produces and it is wrong copy;
 *   3. FIVE stars are drawn — V1 shows the full scale, not one star per point;
 *   4. the number in the copy and the number the stars draw come from the SAME
 *      constant. They are rendered from one source today; a future hand-edit
 *      that updated only the sentence would leave five solid stars over "Rated
 *      4.2 on Google", so the test pins the interpolation rather than the text;
 *   5. the provenance comment survives. The constant is only defensible while
 *      it says where it was copied from and what would replace it.
 */

const SOURCE = readFileSync(resolve(__dirname, "google-rating.tsx"), "utf8");

/** Each react-icons glyph renders as its own <svg>. */
function countStars(markup: string) {
  const svgs = markup.match(/<svg[\s\S]*?<\/svg>/g) ?? [];
  return svgs.length;
}

describe("GoogleRating", () => {
  const markup = renderToStaticMarkup(<GoogleRating />);

  it("links out to V1's Google Maps listing in a new, disowned tab", () => {
    expect(markup).toContain('href="https://maps.app.goo.gl/wSUeKNVJdoe2pBhB8"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });

  it("prints V1's sentence with one decimal place", () => {
    expect(markup).toContain("Rated 5.0 on Google");
    expect(markup).not.toContain("Rated 5 on Google");
  });

  it("draws five stars", () => {
    expect(countStars(markup)).toBe(5);
  });

  it("hides the stars from assistive tech and names the link instead", () => {
    // The stars repeat what the sentence already says; a screen reader should
    // hear the rating once, from the link's own accessible name.
    expect(markup).toMatch(/aria-hidden="true"/);
    expect(markup).toContain("Rated 5.0 on Google");
  });

  it("keeps the sentence and the stars on one constant", () => {
    // Exactly one literal rating in the file: the documented constant.
    const literals = SOURCE.match(/^const GOOGLE_RATING = [\d.]+;$/gm) ?? [];
    expect(literals).toHaveLength(1);
    // ...and the rendered sentence interpolates rather than restating it.
    expect(SOURCE).toContain("<span>Rated {rating} on Google</span>");
  });

  it("records where the hardcoded rating came from", () => {
    // The number is a hand-copy of V1's live output, not a fetch. If that
    // provenance comment is ever dropped, the constant becomes indistinguishable
    // from an invented figure.
    expect(SOURCE).toContain("2026-08-21");
    expect(SOURCE).toContain("google-places");
  });
});
