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

`components/pebblr/google-rating.tsx` holds a **hand-copied** rating. V1 reads
it live from Google Places; this repo has no Places integration and no key, so
the number must be updated by hand — the constant's comment carries the date
and provenance. Do not add an env var for a fetch that does not exist.

## Monorepo context

This app lives at `apps/starter/` in the HeadKit platform monorepo. Customer repos are typically a flattened copy of this tree (no `apps/starter/` prefix).

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
