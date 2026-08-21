# Agent guide — HeadKit starter storefront

Instructions for AI agents customising a customer storefront derived from this template.

## Customisation priority (follow in order)

1. **Dashboard branding** — colours, fonts, corner radius, icons. No code changes.
2. **`overrides/styles.css`** — cosmetic UI (layout, spacing, visibility, typography tweaks).
3. **`overrides/header-actions.tsx`** — extra header icons (phone, etc.) that CSS cannot inject.
4. **New routes / local components** — one-off pages or behaviour that cannot be expressed in CSS.
5. **Edit core components** — last resort; creates merge pain on starter upgrades.

## Do not edit for cosmetic work

Avoid changing these files when the goal is visual styling only:

- `components/headkit-ui/*` (except when adding a missing platform hook — prefer a monorepo PR)
- `app/globals.css` (platform defaults)
- `app/layout.tsx` (unless wiring new override assets)

Use **CSS hook classes** documented in [`overrides/README.md`](./overrides/README.md) instead. All hooks use the `headkit-*` prefix — e.g. `.headkit-nav`, `.headkit-home`, `.headkit-callout`, `.headkit-brand-carousel`, `.headkit-footer-payment-methods`.

## Typical tasks

| Task                          | Where                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| Change nav link style         | `overrides/styles.css` → `.headkit-nav`                      |
| Homepage section backgrounds  | `overrides/styles.css` → `.headkit-home .headkit-*-carousel` |
| Hide prices                   | `overrides/styles.css` → `.price`, `[data-price]`            |
| Hide footer payment icons     | `overrides/styles.css` → `.headkit-footer-payment-methods`   |
| Restyle callout / promo       | `overrides/styles.css` → `.headkit-callout`                  |
| Add header phone / extra icon | `overrides/header-actions.tsx` → `HeaderActionExtras`        |
| Size a primary CTA            | `overrides/cta-size.ts` → `PEBBLR_CTA` (see below)           |
| New landing page              | `app/<route>/page.tsx` + optional local components           |
| Change checkout logic         | `lib/` + `app/checkout/` (behaviour, not cosmetics)          |

## Primary CTA sizing lives in one constant

Every Pebblr primary CTA — the header nav pill, the hero, the steps section, both arms of
the closing CTA banner — is sized from `overrides/cta-size.ts` (`PEBBLR_CTA`, plus
`PEBBLR_CTA_WIDE` for the roomier mobile banner button), applied as `className` at the call
site. Do NOT retune `components/ui/button.tsx`'s `default`/`lg` size variants to move these:
that primitive is shared across the whole storefront, checkout included.

One deliberate divergence from V1: V1 renders the closing CTA banner button 44px tall while
its nav pill is 50px. Here both are 50px, per the captain's nav-size instruction.

## Missing hook?

If you need a stable selector that does not exist, add a `headkit-*` class to the **platform starter** (`apps/starter` in the monorepo), not only the customer repo. Customer repos should consume hooks from upstream starter merges.

## Overrides must survive template pulls

This repo is a clone that re-pulls the platform starter. An override keyed to markup the
platform happens to emit today silently stops matching when that markup changes — no build
error, no test failure, just the style quietly gone. Write selectors that cover the current
shape AND any announced upcoming one, and add a guard that disables the override if the
platform later ships the thing itself.

The nav chevron rule in `overrides/styles.css` is the worked example, and it has now paid
off: it was written to match both the `<a>` that `asChild` produced and the native
`<button>` that platform PR #295 was going to switch to, so when #295 was ported the
chevrons never dropped. Both arms are live at once — a nav parent takes the `<button>` arm
only when its WordPress URL is non-navigable (`#`, `tel:`, `mailto:`), so editing a menu URL
in WordPress moves that one parent between arms. The rule also excludes the nav's icon
buttons via `:not([aria-label])` and stands down via `:not(:has(svg))` if the platform ever
ships its own chevron. Read that comment block before touching any override that depends on
platform element types.

## Tax: Store API totals are tax-EXCLUSIVE

Pblr is a 10%-GST store, so this is live here, not theoretical.

The WooCommerce Store API reports **every total** (`line_subtotal`, `line_total`,
`total_items`, `total_discount`, …) tax-exclusive, with the tax in a sibling `*_tax` field,
and the totals ignore the store's "display prices including tax" setting. (The per-item
`prices` object is different — the Store API computes that one _according_ to that setting.)
Any shopper-facing figure derived from a total must add the sibling back. Never render a
Store API total on its own — that is what made every cart, checkout and order line quote
~9.1% under the PDP price until PR #299 was ported here.

Use `lib/cart-prices.ts`; do not re-derive the addition inline. Cart surfaces:
`lineDisplayTotal` (its third `source` argument is REQUIRED — pass the cart, or `null` when
there is genuinely none in scope), `cartItemsDisplayTotal`, `cartDiscountDisplayTotal`,
`couponDiscountDisplayTotal`. Order surfaces: `orderItemsDisplayTotal`,
`orderDiscountDisplayTotal`. Both: `shippingDisplayTotal` — the one helper that serves a cart
AND an order, because `totalShippingTax` is the only cart-level sibling the order path really
populates. The addition is gated on `hasHostedCheckout` (`lib/hosted-checkout.ts`): a Shopify
cart already reports tax-inclusive totals, so adding the sibling there would double-count.

**An ORDER must never use the cart-level ITEMS or DISCOUNT helpers.** wc/v3 orders carry no
`total_items_tax`, so commerce hard-codes `totalItemsTax` and `totalDiscountTax` to `"0"` —
adding a zero sibling to an ex-tax total just yields an ex-tax total. The per-LINE sibling
taxes ARE populated on the order path, so an order's subtotal and discount must be summed
from the line items, which is what the two `order*` helpers do.

**Known limitations, all upstream** (see the two blocks at the top of `lib/cart-prices.ts`):
the addition is unconditional and assumes `woocommerce_prices_include_tax = yes` (true for
Pblr); the sale strikethrough reads the per-item `prices` object, which follows a different
setting; and the order shipping-METHOD line in `app/checkout/success/[orderId]/page.tsx`
still prints the ex-tax figure beside an inclusive Shipping row. Closing any of them needs a
commerce change — do not patch around them locally.

**Separate, still-open: order pages render order money 100x small.** Order #4281 on
2026-08-20 checked out at A$1,359.00 and its confirmation page printed A$13.59 for the line,
the Subtotal, the Total and the Payment row, with "Includes tax A$1.24". The `Total` and
`Payment` rows read `order.totals.totalPrice` and are untouched by the tax port, so the
scaling is in the ORDER data, not in this repo — the cart and checkout pages, fed by the cart
path, are correct. The per-add-on suffixes are also correct because they come from
`item.addons[].price`, not from a total. Do not "fix" this in the storefront; the tax-inclusive
arithmetic on top of it is already right (13.59 = 12.35 + 1.24).

This class of bug is invisible on a zero-tax store, which is why it survived months upstream.
Keep a taxed fixture in any test that asserts money.

## Footer: the brandmark asset, and content the footer cannot fetch

Two traps live in the footer brand column, both recorded because neither is
visible in the code.

**The Dashboard branding PNG carries its own whitespace.** It is 180x180 and
*fully opaque white* — not transparent — with the monogram inked from (37,27)
to (142,152), i.e. 58.9% of the width and 70% of the height. Sizing its box to
V1's mark therefore shows a mark ~40% too small, so `overrides/styles.css`
scales the IMAGE past the box and offsets it so the ink lands on the box's
top-left. The box **must** keep `overflow: hidden`: the leftover margin is
opaque and paints over the description beside it (it shaved the first letter off
every line before it was clipped). Re-derive the numbers from the asset rather
than trusting these — see the comment block at the end of that file.

**The footer takes store content through props, never hardcoded.** `contact`
and `brandSlot` on `components/headkit-ui/footer.tsx` are deliberately generic
capabilities; Pebblr's real values live at the `<Footer>` call in
`app/layout.tsx`. Keep new footer content on that pattern, and prefer
upstreaming the slot to the platform starter over growing store strings inside
the component.

`components/pebblr/google-rating.tsx` reads its rating **live** from the Google
Places API via `lib/google-places.ts` (`GOOGLE_API_KEY` + `GOOGLE_MAP_PLACE_ID`,
set on this store's Vercel project only — absent locally, which is the fallback
path). The old hand-copied number survives solely as `FALLBACK_RATING`.

Two things about it are non-obvious:

**The live value and the fallback are both 5.0**, so a dead key renders exactly
like a healthy fetch. The badge therefore emits `data-rating-source` and
`data-rating-count` — invisible, and the only way to tell the two apart on a
deployed page. Check the attribute before believing the number is live.

**Caching is Cache Components, not V1's fetch-level `next.revalidate`.** V1
passes `next: { revalidate: 86400, tags: [...] }`; this app runs
`cacheComponents: true`, so the module uses `"use cache: remote"` +
`cacheLife("days")` + `cacheTag("google-places-rating")` instead — same 24h,
same tag string. It must stay cached for a second reason: the badge is mounted
from the root layout, and an un-cached read there poisons static prerender
site-wide. The tag is intentionally outside the `headkit:*` contract in
`lib/cache-tags.ts`, so `/api/revalidate` cannot purge it — nothing publishes
that event; the 24h expiry is the refresh.

The fetch is split into an un-cached, testable `fetchGooglePlacesRating()` plus
a thin cached wrapper, because `cacheLife()` throws outside a Next runtime and
so the wrapper cannot run under Vitest. `lib/stripe-config.ts` does the same and
explains why.

## WP pages: a PAGE has no `featuredImage`, and the body measure is capped

Both halves of issue #3 were invisible in the code, so they are recorded here.

**`content(type: PAGE)` never returns a featured image.** The SDK query DOES
select `featuredImage`; commerce only populates it for POSTs ("Featured image;
null for pages" in its own schema), so a page that WordPress reports a
`featured_media` for still answers `featuredImage: null`. Fixing that is a
platform change. The banner therefore reads `seo.opengraphImageUrl` — Yoast
defaults the OG image to the featured image, and that field IS resolved — via
`lib/wp-page-feature-image.ts`. Read the comment block there before trusting
the value: it is a PROXY, and the two ways it can drift are both authored in
WordPress and invisible from here.

**The 720px column came from `--hk-content-size: 45rem`** in
`app/_editorial/wp-block-library.css` — WordPress's centred blog-column model,
right for `/news` and wrong for these pages. `overrides/styles.css` releases it
(and `--hk-wide-size`) to `none` under `.headkit-cms-page` only. Do not raise
the cap to a bigger number; `none` is what keeps the copy aligned with the
title at every width.

Two smaller things worth knowing:

- **6 of the 14 WP pages have no featured image** (`fundraisers`,
  `brand-activation-2`, `booths`, `packages`, `extra-add-on-services`,
  `venue-checklist`). They render no banner and keep `CmsPageBody`'s in-flow
  H1. This is a deliberate divergence from V1, which renders the banner
  regardless and puts white text on a bare pale gradient.
- **V1 does not overlay the title on mobile** — image on top, dark title
  below, overlaying only from `md` up. Check a real 390 viewport
  (`chrome-devtools-axi emulate --viewport "390x844x3,mobile,touch"`); a window
  resize clamps at 500px and will mislead you.

## Monorepo context

This app lives at `apps/starter/` in the HeadKit platform monorepo. Customer repos are typically a flattened copy of this tree (no `apps/starter/` prefix).

## Route scoping: `/book-now` has no route directory

`components/pebblr/cta-banner-scope.ts` is the single named list of routes that
mount the closing CTA banner, and `cta-banner-scope.test.ts` fails if the list
and the actual mounts drift apart. Read that file before changing where the
banner appears; the reasoning is all in its comments.

The trap worth knowing outside that file: **`/book-now` returns 200 but has no
`app/book-now/` directory** — it is a WordPress page served by the `app/[...slug]`
catch-all. Any "mount it on the WP catch-all" change silently covers it. Confirm
the route that actually serves a path (`find app -name page.tsx`, or check the
live URL) before assuming a directory exists. `/events` is the same shape.

Also non-obvious: `app/shop/[...slug]/page.tsx` delegates its PRODUCT urls to
`ProductPageContent`, exported from `app/products/[...slug]/page.tsx`, so
anything added to the flat PDP also appears on the nested `/shop/…` PDP. Its
CATEGORY urls render `CollectionRoute` instead and are unaffected.

**Do not scope routes with `usePathname` in a root-layout component.** V1 does
(`projects/pebblr-v1-reference/src/components/cta/cta-section-wrapper.tsx`), but
this app runs Cache Components, where a dynamic read at root altitude poisons
static prerendering site-wide. Compose from the route segments instead.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
