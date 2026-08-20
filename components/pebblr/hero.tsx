import { Button } from "@/components/ui/button";
import { InstantLink } from "@/components/headkit-ui/instant-link";
import { Star1, Star2 } from "@/components/pebblr/star-icons";
import { PEBBLR_CTA } from "@/overrides/cta-size";

interface HeroProps {
  title: string;
  button: { text: string; url: string };
  video: { webm: string; alt: string };
}

/**
 * Homepage hero — a silent looping background video under a purple->blue wash,
 * with the headline and primary CTA anchored bottom-left on mobile and
 * centre-left on desktop. Ported from V1 `src/components/hero/hero.tsx`.
 *
 * webm is the only source. V1 ships an mp4 beside it but keeps that `<source>`
 * commented out, so the file is never requested on the live site either, and
 * carrying a second 32 MB blob buys nothing — every engine this storefront
 * targets decodes VP9.
 *
 * The video was briefly replaced by a still: the platform's repo mirror
 * enforced a 10 MiB per-blob cap and silently stopped advancing when the
 * 10.23 MiB webm entered the tree. That cap is now 15 MiB, so the motion is
 * back.
 *
 * `poster` is the mobile CTA still. Without it the hero is a black rectangle
 * until the first frame decodes, which on a cold 4G load is the whole LCP
 * window.
 */
export function Hero({ title, button, video }: HeroProps) {
  return (
    <section className="headkit-hero-carousel mx-5">
      <div className="relative aspect-[2/3] max-h-[700px] w-full overflow-hidden rounded-[20px]">
        <video
          autoPlay
          muted
          playsInline
          loop
          poster="/cta-mobile.png"
          className="h-full w-full object-cover"
          aria-label={video.alt}
        >
          <source src={video.webm} type="video/webm" />
        </video>

        {/* Brand wash. V1 uses `from-pb-blue/50 to-pb-purple/50` on a `to-bl`
            axis — blue top-right, purple bottom-left. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom left, color-mix(in srgb, var(--pb-blue) 50%, transparent), color-mix(in srgb, var(--pb-purple) 50%, transparent))",
          }}
        />

        {/* Sparkles, at V1's exact percentage offsets. */}
        <div className="absolute right-[15%] top-[10%] h-6 w-6 text-white md:h-8 md:w-8">
          <Star1 />
        </div>
        <div className="absolute right-[10%] top-[25%] h-5 w-5 text-white md:h-7 md:w-7">
          <Star2 />
        </div>
        <div className="absolute left-[7%] top-[27%] h-6 w-6 text-white md:h-8 md:w-8">
          <Star1 />
        </div>
        <div className="absolute left-[5%] top-[45%] h-5 w-5 text-white md:h-7 md:w-7">
          <Star2 />
        </div>

        <div className="absolute inset-0 flex items-end justify-center md:items-center">
          <div className="grid h-full w-full grid-cols-4 gap-5 md:grid-cols-12">
            <div className="col-span-4 mb-10 flex flex-col justify-end px-[30px] md:col-span-5 md:col-start-2 md:mb-0 md:justify-center">
              <h1 className="pb-hero-title mb-5 text-[40px] font-semibold text-white md:mb-8 md:text-[60px]">
                {title}
              </h1>
              <div>
                <InstantLink href={button.url} pendingVariant="text">
                  <Button className={PEBBLR_CTA}>{button.text}</Button>
                </InstantLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
