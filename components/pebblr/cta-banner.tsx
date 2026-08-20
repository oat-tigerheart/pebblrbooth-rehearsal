import Image from "next/image";
import { Button } from "@/components/ui/button";
import { InstantLink } from "@/components/headkit-ui/instant-link";
import { Star1, Star2 } from "@/components/pebblr/star-icons";
import { PEBBLR_CTA, PEBBLR_CTA_WIDE } from "@/overrides/cta-size";

/**
 * Closing "Book Pebblr Booth today" banner. Ported from V1
 * `src/components/cta/cta-section.tsx`.
 *
 * V1 mounts this in the root layout behind a `usePathname()` guard that
 * excludes /shop, /collections, /checkout and /contact. Here it is rendered by
 * the homepage instead. Same result for every page in scope — home shows it,
 * PDP (/shop/...) and checkout do not — without a client-side pathname read in
 * the layout, and without changing any route outside this pass.
 *
 * Two artwork files rather than one responsive image: the desktop crop is a
 * wide 300px band and the mobile crop is square, so they are different
 * compositions, not different sizes of the same one.
 */
export function CtaBanner() {
  return (
    <section className="headkit-callout-section bg-white">
      <div className="mx-5">
        <div className="relative aspect-square h-auto w-full overflow-hidden rounded-[20px] md:aspect-auto md:h-[300px]">
          <Image
            src="/cta.png"
            alt=""
            fill
            className="hidden object-cover object-center md:block"
            sizes="100vw"
            quality={75}
          />
          <Image
            src="/cta-mobile.png"
            alt=""
            fill
            className="object-cover object-center md:hidden"
            sizes="100vw"
            quality={75}
          />

          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to bottom left, color-mix(in srgb, var(--pb-blue) 50%, transparent), color-mix(in srgb, var(--pb-purple) 50%, transparent))",
            }}
          />

          <div className="absolute left-[9%] top-[10%] h-6 w-6 text-white md:left-auto md:right-[35%] md:h-8 md:w-8">
            <Star1 />
          </div>
          <div className="absolute left-[3%] top-[35%] h-5 w-5 text-white md:left-auto md:right-[40%] md:top-[50%] md:h-7 md:w-7">
            <Star2 />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid h-full w-full grid-cols-4 gap-5 px-[30px] py-[20px] md:grid-cols-12">
              {/* Mobile: stacked copy + CTA anchored to the bottom. */}
              <div className="col-span-4 flex flex-col justify-end md:hidden">
                <h2 className="pb-cta-title mb-4 text-[32px] font-semibold text-white">
                  Book Pebblr Booth today to make your event unforgettable
                </h2>
                <div>
                  <InstantLink href="/book-now" pendingVariant="text">
                    <Button className={PEBBLR_CTA_WIDE}>Book Now</Button>
                  </InstantLink>
                </div>
              </div>

              {/* Desktop: copy left, CTA right. */}
              <div className="hidden items-center md:col-span-5 md:col-start-3 md:flex">
                <h2 className="pb-cta-title text-[40px] font-semibold text-white">
                  Book Pebblr Booth today to make your event unforgettable
                </h2>
              </div>
              <div className="hidden items-center justify-end md:col-span-3 md:col-start-8 md:flex">
                <InstantLink href="/book-now" pendingVariant="text">
                  <Button className={PEBBLR_CTA}>Book Now</Button>
                </InstantLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
