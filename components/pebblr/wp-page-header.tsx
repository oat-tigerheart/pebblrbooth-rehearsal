import Image from "next/image";

import { decodeHtmlEntities } from "@/lib/utils";

interface Props {
  /** Page title, rendered as the page H1 (raw WordPress title, entities and all). */
  title: string;
  /**
   * Featured-image URL. REQUIRED and non-empty by construction — the route
   * mounts this component only when it resolved one, so there is no "empty
   * banner" branch to get wrong. Pages without an image fall through to
   * `CmsPageBody`'s plain in-flow title instead (see `app/[...slug]/page.tsx`).
   */
  image: string;
}

/**
 * V1's feature-image banner for WordPress content pages (issue #3).
 *
 * Ported from V1 `src/components/post/featured-image-header.tsx`, which is
 * what `pebblrbooth.com.au/birthdays` renders. Deliberately NOT the platform's
 * `components/headkit-ui/post/featured-image-header.tsx`: that one is the
 * news/project hero (16:9 capped at 70svh, black left-to-right scrim,
 * vertically centred title, and a stand-in asset when `image` is missing).
 * V1's page banner is a different object — 3:2 capped at 450px, the brand
 * purple/blue tint, and the title pinned bottom-left.
 *
 * Two structural details carried over from V1 on purpose:
 *
 *   - `flex-col-reverse md:flex-col` + `md:absolute`. On mobile V1 does NOT
 *     overlay: the image sits on top and the title reads below it in dark ink.
 *     Verified on the live V1 site at a real 390x844 viewport, not a resized
 *     window. Only from `md` up does the title lift onto the image in white.
 *   - the banner is inset 20px while the body below it is inset 40px
 *     (`px-5 md:px-10` on `CmsPageBody`), so the image is deliberately WIDER
 *     than the copy. That is V1's proportion, measured 1400px vs 1360px at
 *     1440px wide.
 *
 * Corner radius uses `rounded-brand` (Dashboard branding, currently 0.5rem)
 * rather than V1's hard-coded 12px, so a branding change moves it with
 * everything else. Pixel parity is explicitly not the goal here.
 */
export function WpPageHeader({ title, image }: Props): React.JSX.Element {
  const decodedTitle = decodeHtmlEntities(title);

  return (
    <div className="headkit-wp-page-banner px-2.5 sm:px-5">
      <div className="relative flex flex-col-reverse md:flex-col">
        <div className="z-10 h-full w-full md:absolute">
          <div className="flex h-full items-center md:items-end">
            <div className="px-2.5 py-5 md:w-[400px] md:px-0 md:pb-[100px] md:pl-5 lg:w-[600px] lg:pl-[100px]">
              {/*
                Colour flips at `md` with the layout: dark editorial ink while
                the title sits below the image, white once it sits on top of
                it. `drop-shadow` keeps it legible over a light photo — the
                tint alone is not enough on a blown-out sky.
              */}
              <h1 className="text-3xl tracking-[-0.5px] md:text-5xl md:text-white md:drop-shadow-lg">
                {decodedTitle}
              </h1>
            </div>
          </div>
        </div>

        <div className="relative aspect-[3/2] max-h-[370px] w-full overflow-hidden rounded-brand md:max-h-[450px]">
          <Image
            src={image}
            alt={decodedTitle}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover object-center"
          />
          {/*
            V1's tint: `bg-gradient-to-bl from-pb-blue/50 to-pb-purple/50`.
            Painted from `overrides/styles.css` rather than inline Tailwind so
            it reads the SAME `--pb-blue` / `--pb-purple` tokens as the CTA
            gradient and cannot drift from them. Keep the class and that rule
            in sync — an unstyled tint layer is transparent, so a rename fails
            silently as "the photo lost its brand wash".
          */}
          <div
            aria-hidden
            className="headkit-wp-page-banner__tint absolute inset-0"
          />
        </div>
      </div>
    </div>
  );
}
