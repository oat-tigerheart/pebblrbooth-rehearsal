"use client";

import { Button } from "@/components/ui/button";
import { InstantLink } from "@/components/headkit-ui/instant-link";
import { PEBBLR_CTA } from "@/overrides/cta-size";

/**
 * Extra desktop header actions (rendered between Account and Cart).
 * Customer-owned — edit this file instead of core `header-actions.tsx`.
 *
 * Pebblr's header CTA. V1 carries a gradient "Book now" pill in the header at
 * both viewports — measured on the live site as 144x50, 20px/700, 6px radius,
 * purple->blue — and the storefront had no equivalent.
 *
 * Placement note: this slot sits BETWEEN Account and Cart, where V1's button
 * sits to the LEFT of the whole icon row. `order: -1` in overrides/styles.css
 * moves it back to the front of the flex row rather than forking the platform
 * header to add a slot in the right place.
 *
 * The gradient itself is not repeated here — `.bg-primary` combined with the
 * button radius class already carries it (see overrides/styles.css), so the
 * default Button variant picks it up.
 */
export function HeaderActionExtras() {
  return (
    <Button
      asChild
      className={`headkit-book-now ml-5 ${PEBBLR_CTA}`}
    >
      <InstantLink href="/book-now" pendingVariant="text">
        Book now
      </InstantLink>
    </Button>
  );
}

/**
 * Extra mobile SHEET actions (rendered after Account inside the menu).
 *
 * Deliberately empty: V1 puts its booking CTA in the phone header bar itself,
 * not behind the hamburger, so duplicating it inside the sheet would show the
 * same CTA twice. The bar version is `MobileBarActionExtras` below.
 */
export function MobileHeaderActionExtras(): null {
  return null;
}

/**
 * Extra mobile HEADER BAR actions (rendered beside the cart, outside the sheet).
 *
 * V1 keeps a booking CTA visible in the phone header at all times and shortens
 * the label to "Book", where the full pill would crowd the logo out of the bar.
 * A CTA that only exists behind a hamburger is a different product decision
 * from the one the live site made, which is why this slot exists at all.
 */
export function MobileBarActionExtras() {
  return (
    <Button asChild className="headkit-book-now h-9 px-3 text-base font-bold">
      <InstantLink href="/book-now" pendingVariant="text">
        Book
      </InstantLink>
    </Button>
  );
}
