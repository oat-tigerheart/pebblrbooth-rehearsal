/**
 * Pebblr CTA sizing — single source of the numbers.
 *
 * V1 renders every primary CTA at the size of the header nav pill: 50px tall,
 * 20px/700 type. The shared `Button` primitive's `default`/`lg` size variants
 * are 40/44px with 16px type, and that primitive is platform-shipped and used
 * across the whole storefront (checkout included), so it must not be retuned
 * for this store. Apply these classes at the call site instead.
 *
 * `PEBBLR_CTA` is the nav pill exactly (`h-[50px] px-4 text-[20px] font-bold`).
 * `PEBBLR_CTA_WIDE` keeps the same height and type but the roomier horizontal
 * padding that reads right on a near-full-width mobile button.
 */
const PEBBLR_CTA_METRICS = "h-[50px] text-[20px] font-bold";

export const PEBBLR_CTA = `${PEBBLR_CTA_METRICS} px-4`;

export const PEBBLR_CTA_WIDE = `${PEBBLR_CTA_METRICS} px-8`;
