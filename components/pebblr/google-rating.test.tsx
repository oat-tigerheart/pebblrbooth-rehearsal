import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { GoogleRating } from "./google-rating";
import {
  fetchGooglePlacesRating,
  getGooglePlacesRating,
} from "@/lib/google-places";

/**
 * `GoogleRating` — V1's footer badge, now fed by the Google Places API through
 * `lib/google-places.ts`.
 *
 * Rendered through `react-dom/server`: the starter's vitest environment is
 * `node` and there is no DOM testing library in the dependency set —
 * `components/checkout/addon-details.test.tsx` is the in-repo precedent. The
 * component is an async server component, so it is INVOKED (`await
 * GoogleRating()`) and its returned tree handed to `renderToStaticMarkup`;
 * the tree itself is synchronous.
 *
 * `getGooglePlacesRating` is mocked rather than called: its `"use cache:
 * remote"` directive needs a live Cache Components runtime and `cacheLife()`
 * throws outside one. The un-cached `fetchGooglePlacesRating` IS called for
 * real, against a mocked `global.fetch` — never the live API.
 *
 * What is load-bearing here, and therefore asserted:
 *
 *   1. THE FALLBACK, in every branch. The badge is social proof; a Google
 *      outage, an unset key, or a malformed body must cost the footer nothing.
 *      "Rated undefined on Google" and a vanished badge are both worse than a
 *      stale number, so each failure mode is exercised end to end;
 *   2. the LINK survives the fallback too — the exact V1 href, `target="_blank"`
 *      and `rel="noopener noreferrer"` (a `_blank` without `noopener` hands the
 *      opened tab a live handle on this one);
 *   3. the RATING TEXT reads with one decimal place. "Rated 5 on Google" is
 *      what a missing `toFixed` produces and it is wrong copy;
 *   4. the STARS follow the fetched number rather than always drawing five
 *      solid ones — the whole point of reading a live value is that it can move;
 *   5. `data-rating-source` distinguishes a live read from the fallback. It is
 *      the only observable difference while both are 5.0, and it is what the
 *      deployed site is verified against.
 */

vi.mock("@/lib/google-places", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/google-places")>();
  return { ...actual, getGooglePlacesRating: vi.fn() };
});

const mockedGet = vi.mocked(getGooglePlacesRating);

/** Each react-icons glyph renders as its own <svg>, tagged by its path data. */
function countStars(markup: string) {
  return (markup.match(/<svg[\s\S]*?<\/svg>/g) ?? []).length;
}

async function render() {
  return renderToStaticMarkup(await GoogleRating());
}

/** The shape `fetchGooglePlacesRating` resolves to on the happy path. */
const LIVE = {
  rating: 5,
  userRatingCount: 4,
  placeId: "test-place-id",
  name: "Pebblr Booth",
};

describe("GoogleRating", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the live rating when Places answers", async () => {
    mockedGet.mockResolvedValue(LIVE);
    const markup = await render();

    expect(markup).toContain("Rated 5.0 on Google");
    expect(markup).toContain('data-rating-source="google-places"');
    // The count is the discriminator the fallback cannot fake — it is what
    // proves on a deployed page that the fetch really ran.
    expect(markup).toContain('data-rating-count="4"');
  });

  it("prints a non-integer live rating with one decimal place", async () => {
    mockedGet.mockResolvedValue({ ...LIVE, rating: 4.8 });
    const markup = await render();

    expect(markup).toContain("Rated 4.8 on Google");
    expect(markup).not.toContain("Rated 5.0 on Google");
  });

  it("draws the live rating in stars instead of five solid ones", async () => {
    mockedGet.mockResolvedValue({ ...LIVE, rating: 4.5 });
    const markup = await render();

    // Still the full five-star scale...
    expect(countStars(markup)).toBe(5);
    // ...but not five identical glyphs: a 4.5 must render a half star, which is
    // the regression this whole change exists to make possible.
    const glyphs = markup.match(/<svg[\s\S]*?<\/svg>/g) ?? [];
    expect(new Set(glyphs).size).toBeGreaterThan(1);
  });

  it("falls back to 5.0 when the Places read returns null", async () => {
    mockedGet.mockResolvedValue(null);
    const markup = await render();

    expect(markup).toContain("Rated 5.0 on Google");
    expect(markup).toContain('data-rating-source="fallback"');
    expect(markup).not.toContain("data-rating-count");
    expect(countStars(markup)).toBe(5);
  });

  it("relies on the read being total rather than catching around it", async () => {
    // `getGooglePlacesRating` never throws — every failure mode inside it,
    // including a thrown fetch, resolves to `null` (see lib/google-places.ts
    // and the second describe block below). The component therefore has no
    // try/catch: the fallback is driven by that one `null`.
    //
    // This test pins that contract from the outside. If a future edit makes the
    // read throwing possible, this stops being a documented no-op and starts
    // failing — at which point the component needs a catch, because an
    // exception in a root-layout slot takes the whole page down.
    mockedGet.mockRejectedValue(new Error("places exploded"));
    await expect(render()).rejects.toThrow("places exploded");
  });

  it("keeps V1's listing link in a new, disowned tab in both branches", async () => {
    for (const value of [LIVE, null]) {
      mockedGet.mockResolvedValue(value);
      const markup = await render();
      expect(markup).toContain(
        'href="https://maps.app.goo.gl/wSUeKNVJdoe2pBhB8"',
      );
      expect(markup).toContain('target="_blank"');
      expect(markup).toContain('rel="noopener noreferrer"');
    }
  });

  it("hides the stars from assistive tech and names the link instead", async () => {
    mockedGet.mockResolvedValue(LIVE);
    const markup = await render();
    // The stars repeat what the sentence already says; a screen reader should
    // hear the rating once, from the link's own accessible name.
    expect(markup).toMatch(/aria-hidden="true"/);
    expect(markup).toContain("Rated 5.0 on Google");
  });

  it("never prints undefined", async () => {
    mockedGet.mockResolvedValue(null);
    expect(await render()).not.toContain("undefined");
  });
});

/**
 * `fetchGooglePlacesRating` — the un-cached fetch, run for real against a
 * mocked `global.fetch`. Every branch here resolves to `null`, which is the
 * single value the badge turns into its fallback.
 */
describe("fetchGooglePlacesRating", () => {
  const ORIGINAL_ENV = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    process.env.GOOGLE_API_KEY = "test-key";
    process.env.GOOGLE_MAP_PLACE_ID = "test-place-id";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  function jsonResponse(body: unknown, ok = true, status = 200) {
    return { ok, status, json: async () => body };
  }

  it("returns the rating, count and name on the happy path", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        rating: 5,
        userRatingCount: 4,
        displayName: { text: "Pebblr Booth" },
      }),
    );

    await expect(fetchGooglePlacesRating()).resolves.toEqual({
      rating: 5,
      userRatingCount: 4,
      placeId: "test-place-id",
      name: "Pebblr Booth",
    });
  });

  it("sends the field mask and the key, and nothing more", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ rating: 5 }));
    await fetchGooglePlacesRating();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://places.googleapis.com/v1/places/test-place-id?key=test-key",
    );
    // Places API (New) 400s without a field mask, and bills a higher SKU for
    // fields the badge never renders.
    expect((init.headers as Record<string, string>)["X-Goog-FieldMask"]).toBe(
      "rating,userRatingCount,displayName",
    );
  });

  it("returns null with no API key — the local-dev path", async () => {
    delete process.env.GOOGLE_API_KEY;
    await expect(fetchGooglePlacesRating()).resolves.toBeNull();
    // And never reaches out, so a keyless build makes no billed call.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null with no place id", async () => {
    delete process.env.GOOGLE_MAP_PLACE_ID;
    await expect(fetchGooglePlacesRating()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null on a non-OK response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: {} }, false, 403));
    await expect(fetchGooglePlacesRating()).resolves.toBeNull();
  });

  it("returns null on a body with no rating", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ displayName: { text: "Pebblr Booth" } }),
    );
    await expect(fetchGooglePlacesRating()).resolves.toBeNull();
  });

  it("returns null on a non-numeric or non-finite rating", async () => {
    for (const rating of ["5", null, Number.NaN, Number.POSITIVE_INFINITY]) {
      fetchMock.mockResolvedValue(jsonResponse({ rating }));
      await expect(fetchGooglePlacesRating()).resolves.toBeNull();
    }
  });

  it("returns null when the body is not JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON");
      },
    });
    await expect(fetchGooglePlacesRating()).resolves.toBeNull();
  });

  it("returns null when the fetch itself throws", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));
    await expect(fetchGooglePlacesRating()).resolves.toBeNull();
  });

  it("defaults a missing review count to 0 and a missing name to empty", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ rating: 4.2 }));
    await expect(fetchGooglePlacesRating()).resolves.toEqual({
      rating: 4.2,
      userRatingCount: 0,
      placeId: "test-place-id",
      name: "",
    });
  });
});
