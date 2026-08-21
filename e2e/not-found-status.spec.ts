import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { BASE_URL } from "./helpers";

/**
 * HTTP status contract for missing pages (issue #2 — soft 404).
 *
 * Every dynamic segment used to answer 200 for a missing URL while rendering
 * the not-found UI, because `notFound()` was raised inside a `<Suspense>`
 * boundary — after Cache Components had already committed the 200 status line.
 * Link checkers and uptime monitoring read the status, not the pixels, so a
 * broken internal link was invisible.
 *
 * This spec asserts the STATUS, which is the whole point: a test that only
 * checked for "Page not found" in the body passed throughout the entire bug.
 *
 * The second half matters just as much. Gating a route on an existence check is
 * the kind of fix that can over-trigger, and a route family that 404s its REAL
 * pages takes the site down — a far worse outcome than the bug. So each family
 * is proven in both directions, and the real URLs come from the store's own
 * sitemap rather than hardcoded slugs, which would rot per store.
 *
 * LOCAL-ONLY (HARD RULE): `BASE_URL` is the localhost Docker starter.
 */

/** Slugs no store will ever serve. */
const MISSING = [
  { family: "wordpress page", path: "/this-page-does-not-exist-xyz" },
  { family: "product", path: "/products/this-product-does-not-exist-xyz" },
  {
    family: "collection",
    path: "/collections/this-collection-does-not-exist-xyz",
  },
  { family: "news post", path: "/news/this-post-does-not-exist-xyz" },
  { family: "shop", path: "/shop/this-shop-entry-does-not-exist-xyz" },
  { family: "brand", path: "/brand/this-brand-does-not-exist-xyz" },
  { family: "project", path: "/projects/this-project-does-not-exist-xyz" },
  { family: "client", path: "/client/this-client-does-not-exist-xyz" },
] as const;

/** Route prefixes to sample a REAL, live URL for from the sitemap. */
const LIVE_PREFIXES = [
  "/products/",
  "/collections/",
  "/news/",
  "/shop/",
] as const;

/** Every `<loc>` in the sitemap, as site-relative paths. */
async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const res = await request.get(`${BASE_URL}/sitemap.xml`);
  expect(res.status(), "sitemap.xml must be served").toBe(200);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1]!.trim())
    .map((u) => {
      try {
        return new URL(u).pathname;
      } catch {
        return u;
      }
    });
}

test.describe("missing pages return 404", () => {
  for (const { family, path } of MISSING) {
    test(`${family}: ${path} is 404`, async ({ request }) => {
      const res = await request.get(`${BASE_URL}${path}`);

      expect(
        res.status(),
        `${path} must answer 404. A 200 here is the soft-404 regression: the ` +
          `not-found UI renders, but every link checker and uptime monitor ` +
          `reads this status and sees a healthy page.`,
      ).toBe(404);

      // The fix is about the status line only — the body must be unchanged.
      expect(
        await res.text(),
        `${path} answered 404 but stopped rendering the not-found UI.`,
      ).toContain("Page not found");
    });
  }
});

test.describe("real pages still return 200", () => {
  test("the homepage is 200", async ({ request }) => {
    expect((await request.get(BASE_URL)).status()).toBe(200);
  });

  for (const prefix of LIVE_PREFIXES) {
    test(`a real ${prefix} url is 200`, async ({ request }) => {
      const paths = await sitemapPaths(request);
      const live = paths.find((p) => p.startsWith(prefix) && p !== prefix);

      // A store with no posts (or no nested shop urls) is a valid store, and a
      // fixture gap must not read as a pass. Skip loudly instead.
      test.skip(
        !live,
        `sitemap.xml lists no ${prefix} url — cannot prove this family still ` +
          `serves 200. Seed one before trusting this run.`,
      );

      const res = await request.get(`${BASE_URL}${live}`);
      expect(
        res.status(),
        `${live} is in the store's own sitemap, so it must answer 200. A 404 ` +
          `here means the not-found gate over-triggered and this route family ` +
          `is down.`,
      ).toBe(200);
    });
  }
});
