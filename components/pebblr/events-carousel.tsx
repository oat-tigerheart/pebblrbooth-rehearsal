"use client";

import Image from "next/image";
import { Carousel } from "@/components/headkit-ui/carousel";
import { InstantLink } from "@/components/headkit-ui/instant-link";
import { decodeHtmlEntities } from "@/lib/utils";

export interface EventPage {
  title: string;
  slug: string;
  uri: string;
  image: string;
}

/**
 * "Booths and video for all events" — the four event-type landing pages.
 * Ported from V1's `PageCarousel` + `PageCard`.
 *
 * The tile art carries the same 40% purple->blue wash V1 applies through
 * `FeaturedImage withOverlay`. It is not decoration: the source photos are
 * unrelated event shots with wildly different white balance, and the wash is
 * what makes the four read as one row.
 */
export function EventsCarousel({ pages }: { pages: EventPage[] }) {
  return (
    <Carousel
      items={pages}
      id="event-pages"
      itemKey={(page) => page.slug}
      className="w-full pb-8"
      showPagination={false}
      renderItem={(page) => {
        const title = decodeHtmlEntities(page.title);
        return (
          <InstantLink href={page.uri} pendingVariant="card" className="block">
            <div className="relative aspect-square w-full overflow-hidden rounded-brand bg-white">
              {page.image ? (
                <Image
                  src={page.image}
                  alt={title}
                  fill
                  quality={65}
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : null}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom left, color-mix(in srgb, var(--pb-blue) 40%, transparent), color-mix(in srgb, var(--pb-purple) 40%, transparent))",
                }}
              />
            </div>
            <div className="flex justify-between pt-2">
              <h3 className="text-[24px] font-semibold text-primary">{title}</h3>
            </div>
          </InstantLink>
        );
      }}
    />
  );
}
