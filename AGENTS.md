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
| New landing page              | `app/<route>/page.tsx` + optional local components           |
| Change checkout logic         | `lib/` + `app/checkout/` (behaviour, not cosmetics)          |

## Missing hook?

If you need a stable selector that does not exist, add a `headkit-*` class to the **platform starter** (`apps/starter` in the monorepo), not only the customer repo. Customer repos should consume hooks from upstream starter merges.

## Overrides must survive template pulls

This repo is a clone that re-pulls the platform starter. An override keyed to markup the
platform happens to emit today silently stops matching when that markup changes — no build
error, no test failure, just the style quietly gone. Write selectors that cover the current
shape AND any announced upcoming one, and add a guard that disables the override if the
platform later ships the thing itself.

The nav chevron rule in `overrides/styles.css` is the worked example: it matches the `<a>`
that `asChild` produces today and the native `<button>` that platform PR #295 switches to,
excludes the nav's icon buttons via `:not([aria-label])`, and stands down via
`:not(:has(svg))` if the platform starts rendering its own chevron. Read that comment block
before touching any override that depends on platform element types.

## Monorepo context

This app lives at `apps/starter/` in the HeadKit platform monorepo. Customer repos are typically a flattened copy of this tree (no `apps/starter/` prefix).

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
