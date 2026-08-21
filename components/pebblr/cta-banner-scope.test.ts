import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CTA_BANNER_ROUTES,
  CTA_BANNER_WP_SLUG_DENYLIST,
  wpPageShowsCtaBanner,
} from "./cta-banner-scope";

/**
 * The closing CTA banner is scoped by route-level composition (issue #1), so
 * the risk is not the banner — it is the LIST drifting away from the mounts.
 * These tests pin both halves: the per-slug gate on the WP catch-all, and the
 * agreement between `CTA_BANNER_ROUTES` and the routes that actually mount it.
 */

const APP_DIR = join(__dirname, "..", "..", "app");

/** Every `page.tsx` under `app/`, as repo-relative POSIX paths. */
function routeFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) routeFiles(full, out);
    else if (entry.name === "page.tsx") {
      out.push(relative(join(APP_DIR, ".."), full).split("\\").join("/"));
    }
  }
  return out;
}

const ALL_ROUTES = routeFiles(APP_DIR).sort();
const MOUNTING_ROUTES = ALL_ROUTES.filter((f) =>
  /<CtaBanner\s*\/>/.test(readFileSync(join(APP_DIR, "..", f), "utf8")),
).sort();

describe("CTA banner scope — WP catch-all slug gate", () => {
  it("shows on a WordPress content page", () => {
    expect(wpPageShowsCtaBanner(["birthdays"])).toBe(true);
    expect(wpPageShowsCtaBanner(["wedding-photo-booth-adelaide"])).toBe(true);
    expect(wpPageShowsCtaBanner(["corporate-events"])).toBe(true);
  });

  it("hides on /book-now, which the catch-all serves with no route directory", () => {
    expect(wpPageShowsCtaBanner(["book-now"])).toBe(false);
  });

  it("hides on a child of a denied slug", () => {
    expect(wpPageShowsCtaBanner(["book-now", "deposit"])).toBe(false);
  });

  it("matches the denylist case-insensitively and ignores stray whitespace", () => {
    expect(wpPageShowsCtaBanner(["Book-Now"])).toBe(false);
    expect(wpPageShowsCtaBanner([" book-now "])).toBe(false);
  });

  it("hides when there is no slug at all", () => {
    expect(wpPageShowsCtaBanner([])).toBe(false);
    expect(wpPageShowsCtaBanner([""])).toBe(false);
  });

  it("keeps the denylist small — it is the one non-allowlist in the scope", () => {
    expect(CTA_BANNER_WP_SLUG_DENYLIST).toEqual(["book-now"]);
  });
});

describe("CTA banner scope — mounts match the list", () => {
  it("finds the app router tree", () => {
    expect(ALL_ROUTES.length).toBeGreaterThan(10);
  });

  it("mounts the banner on exactly the listed routes", () => {
    expect(MOUNTING_ROUTES).toEqual([...CTA_BANNER_ROUTES].sort());
  });

  it.each([
    "app/faq/page.tsx",
    "app/checkout/page.tsx",
    "app/account/page.tsx",
    "app/contact/page.tsx",
    "app/quote/page.tsx",
    "app/search/page.tsx",
    "app/shop/page.tsx",
    "app/shop/[...slug]/page.tsx",
    "app/collections/[...slug]/page.tsx",
    "app/projects/page.tsx",
    "app/brand/page.tsx",
    "app/client/[...slug]/page.tsx",
    "app/featured/page.tsx",
    "app/new/page.tsx",
    "app/sale/page.tsx",
  ])("keeps the banner off %s", (route) => {
    // The route must still exist — a renamed route would otherwise pass
    // vacuously and quietly lose its exclusion.
    expect(ALL_ROUTES).toContain(route);
    expect(MOUNTING_ROUTES).not.toContain(route);
  });
});
