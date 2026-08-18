import Image from "next/image";
import { Button } from "@/components/ui/button";
import { InstantLink } from "@/components/headkit-ui/instant-link";
import { Star1, Star2 } from "@/components/pebblr/star-icons";

interface HeroProps {
  title: string;
  button: { text: string; url: string };
  image: { src: string; alt: string };
}

/**
 * Homepage hero — brand photography under a purple->blue wash,
 * with the headline and primary CTA anchored bottom-left on mobile and
 * centre-left on desktop. Ported from V1 `src/components/hero/hero.tsx`.
 *
 * V1 backs this with a looping 33 MB webm (plus an unused 32 MB mp4). Neither
 * ships here: the platform's repo mirror stopped advancing the moment those
 * blobs entered the tree — it had mirrored the 4 KB commit before them in about
 * five seconds and never picked up the 45 MB one, or a 12 MB retry, across an
 * hour. The still below is the video's own opening frame, so the hero reads the
 * same on load; what is lost is the motion after it.
 *
 * Restoring the video means hosting it off-repo — the WordPress media library
 * is the obvious candidate — rather than re-adding the blob.
 *
 * `priority` is deliberate: this is the LCP element on the homepage.
 */
export function Hero({ title, button, image }: HeroProps) {
  return (
    <section className="headkit-hero-carousel mx-5">
      <div className="relative aspect-[2/3] max-h-[700px] w-full overflow-hidden rounded-[20px]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          fetchPriority="high"
          quality={75}
          sizes="100vw"
          className="object-cover object-center"
        />

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
                  <Button>{button.text}</Button>
                </InstantLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
