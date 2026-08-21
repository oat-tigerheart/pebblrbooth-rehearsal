import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guard for the soft-404 regression (issue #2).
 *
 * Every dynamic segment used to answer HTTP 200 for a missing page. The cause
 * was never a missing `notFound()` — every route called it. It was WHERE:
 * `notFound()` signals by throwing, and a throw can only set the status while
 * the status line is unsent. Under Cache Components the response commits as 200
 * the moment a `<Suspense>` fallback renders, so a `notFound()` raised inside
 * the boundary arrived too late and Next injected `<meta robots="noindex">`
 * into the already-streaming body instead of sending a 404 header.
 *
 * That makes this a STRUCTURAL property, which is why it is asserted
 * structurally: the presence of `notFound()` proves nothing, so this reads each
 * route and checks the two things that actually decide the status code —
 *
 *   1. `export const instant = false` (a blocking route; `true` forbids reading
 *      `params` outside `<Suspense>`, which the gate requires), and
 *   2. an `async` default export that reaches `notFound()` BEFORE it returns
 *      any `<Suspense>` boundary.
 *
 * A live status-code assertion over real HTTP lives in
 * `e2e/not-found-status.spec.ts`; it needs the Docker stack, so this runs in
 * unit CI and that one gates a deploy. Keep both.
 */

/** Routes whose 404 must be decided before the response commits. */
const GATED_ROUTES = [
  "app/[...slug]/page.tsx",
  "app/products/[...slug]/page.tsx",
  "app/collections/[...slug]/page.tsx",
  "app/news/[...slug]/page.tsx",
  "app/shop/[...slug]/page.tsx",
  "app/brand/[...slug]/page.tsx",
  "app/projects/[...slug]/page.tsx",
  "app/client/[...slug]/page.tsx",
  // Static route, no params — but it resolves a WordPress page that may be
  // absent, and it is the case issue #2 was filed on.
  "app/wholesale/page.tsx",
] as const;

/**
 * Routes that recover from a thrown read. A bare `catch` swallows the
 * NEXT_HTTP_ERROR_FALLBACK / NEXT_REDIRECT that `notFound()` and `redirect()`
 * throw, so each must rethrow Next's control flow before treating the failure
 * as a miss.
 */
const ROUTES_WITH_RECOVERING_CATCH = [
  "app/news/[...slug]/page.tsx",
  "app/projects/[...slug]/page.tsx",
  "app/client/[...slug]/page.tsx",
] as const;

const read = (rel: string): string =>
  readFileSync(resolve(__dirname, "..", rel), "utf8");

describe("missing pages answer a real 404, not a 200 shell", () => {
  it.each(GATED_ROUTES)("%s is a blocking route", (rel) => {
    const src = read(rel);

    expect(
      src,
      `${rel} must declare \`export const instant = false\`. An instant route ` +
        `commits a 200 App Shell before the page body resolves, so its ` +
        `notFound() can only add a noindex meta tag — never a 404 status.`,
    ).toMatch(/^export const instant = false;$/m);

    expect(
      src,
      `${rel} must not re-enable \`instant\` — that reintroduces the soft 404.`,
      // Anchored to a statement, not prose: the comment blocks explaining
      // this fix necessarily quote `export const instant = true`.
    ).not.toMatch(/^export const instant = true/m);
  });

  it.each(GATED_ROUTES)("%s decides 404 before any Suspense", (rel) => {
    const src = read(rel);

    const defaultExport = src.indexOf("export default async function");
    expect(
      defaultExport,
      `${rel} must have an \`async\` default export: the existence check has ` +
        `to be awaited in the route segment itself, above the boundary.`,
    ).toBeGreaterThan(-1);

    const body = src.slice(defaultExport);
    const gate = body.indexOf("notFound()");
    const boundary = body.indexOf("<Suspense");

    expect(
      gate,
      `${rel}'s default export must call notFound() itself, not delegate the ` +
        `decision to a component inside <Suspense>.`,
    ).toBeGreaterThan(-1);

    // A route with no boundary at all (wholesale) is fine — nothing can commit
    // the response early. When there IS one, the gate must come first.
    if (boundary > -1) {
      expect(
        gate,
        `${rel} calls notFound() only after rendering <Suspense>. Once that ` +
          `fallback renders the status line is already sent as 200.`,
      ).toBeLessThan(boundary);
    }
  });

  it.each(ROUTES_WITH_RECOVERING_CATCH)(
    "%s rethrows Next control flow out of its catch",
    (rel) => {
      const src = read(rel);
      expect(
        src,
        `${rel} recovers from a thrown read. notFound() and redirect() signal ` +
          `by throwing, so the catch must call unstable_rethrow(err) before ` +
          `deciding the failure was a miss — otherwise it swallows them.`,
      ).toMatch(/unstable_rethrow\(/);
    },
  );
});
