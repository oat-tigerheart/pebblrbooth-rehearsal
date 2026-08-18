import Image from "next/image";
import { decodeHtmlEntities } from "@/lib/utils";
import type { FeaturedBrand } from "@headkit/sdk";

interface Props {
  brands: Pick<FeaturedBrand, "name" | "slug" | "thumbnail">[];
}

/**
 * "Australia's best parties" client logo wall.
 *
 * Deliberately NOT `components/headkit-ui/brand-carousel.tsx`, which was the
 * first thing checked: that one is an autoplaying carousel whose logos link to
 * `/brand/<slug>`. V1's wall is a static centred flex-wrap with no links at
 * all, so reusing the carousel would have changed both the layout and the
 * interaction model.
 *
 * Logos are constrained to V1's 120x100 box with `object-contain` and
 * `width/height: auto`, which is what keeps a mixed bag of wide wordmarks and
 * square badges optically even.
 */
export function BrandWall({ brands }: Props) {
  const logos = brands.filter(
    (b) => typeof b?.thumbnail === "string" && b.thumbnail.trim() !== "",
  );
  if (logos.length === 0) return null;

  return (
    <section className="headkit-brand-carousel overflow-hidden rounded-lg py-10">
      <div className="headkit-section-header flex w-full flex-col gap-4 px-5 md:px-10">
        <h2 className="text-[30px] font-semibold">Australia&apos;s best parties</h2>
        <p className="text-lg font-medium">
          We&apos;ve worked with some of the top companies in Adelaide, South
          Australia and around Australia with amazing repeat clients. We love
          what we do and will jump on the opportunity to make your event, the
          best ever!
        </p>
      </div>

      <div className="mt-5 px-5 md:px-10">
        <div className="flex flex-wrap items-center justify-center gap-12">
          {logos.map((brand) => (
            <div key={brand.slug} className="flex items-center justify-center">
              <Image
                alt={decodeHtmlEntities(brand.name ?? "")}
                src={brand.thumbnail.trim()}
                width={120}
                height={100}
                quality={65}
                className="relative object-contain object-center"
                style={{
                  maxWidth: "120px",
                  maxHeight: "100px",
                  width: "auto",
                  height: "auto",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
