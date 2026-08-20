import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { InstantLink } from "@/components/headkit-ui/instant-link";
import { PEBBLR_CTA } from "@/overrides/cta-size";

interface StepProps {
  number: number;
  imageSrc: string;
  title: string;
  description: ReactNode;
}

function Step({ number, imageSrc, title, description }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-4">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-[60px] font-semibold text-white md:h-25 md:w-25 md:text-[80px]"
          style={{ backgroundImage: "var(--pb-gradient)" }}
        >
          <span>{number}</span>
        </div>
        <div className="absolute -right-20 -top-5 h-25 w-25 md:h-30 md:w-30">
          <Image
            src={imageSrc}
            alt=""
            width={120}
            height={120}
            className="h-full w-full object-contain"
            quality={100}
          />
        </div>
      </div>
      <h3 className="mb-2 text-xl font-semibold text-black md:text-2xl">
        {title}
      </h3>
      <p className="text-lg">{description}</p>
    </div>
  );
}

const STEPS: ReadonlyArray<Omit<StepProps, "description"> & { description: ReactNode }> = [
  {
    number: 1,
    imageSrc: "/steps/1.png",
    title: "Pick your package",
    description:
      "Find a package that best suits your event, customise it with add-ons and complete the checkout.",
  },
  {
    number: 2,
    imageSrc: "/steps/2.png",
    title: "Lock it in",
    description:
      "We'll give you a call for a chat to finalise all the details and organise your deposit to confirm your event booking.",
  },
  {
    number: 3,
    imageSrc: "/steps/3.png",
    title: "Style it",
    description: (
      <>
        Customise your booth with{" "}
        <InstantLink href="/backdrop-designs" className="underline">
          backdrops
        </InstantLink>
        , props, and{" "}
        <InstantLink href="/photo-booth-print-template" className="underline">
          photo template
        </InstantLink>{" "}
        to match your event theme.
      </>
    ),
  },
  {
    number: 4,
    imageSrc: "/steps/4.png",
    title: "Let's party",
    description:
      "We bring the booth, you bring the party! Pebblr Booth will be at your event to make it one to remember.",
  },
];

/**
 * "Steps to capture your moment" — the four-step booking explainer.
 * Ported from V1 `src/components/steps/steps-section.tsx`.
 *
 * The heading is gradient-filled text (`background-clip: text` over a
 * transparent foreground). That relies on `text-transparent` beating
 * globals.css's `h1, h2 { color: var(--color-editorial-ink) }` — it does,
 * because both are normal declarations and `@layer utilities` is declared
 * after `@layer base`.
 *
 * V1 exposes `stepsToShow` / `showCTA` props for its other pages. Both are
 * dropped here: the homepage is the only in-scope caller and it always renders
 * all four steps with the CTA.
 */
export function StepsSection() {
  return (
    <section className="px-5 py-16 md:px-10">
      <div className="mb-12 text-left">
        <h2
          className="mb-5 bg-clip-text text-[30px] font-bold text-transparent md:text-[40px]"
          style={{ backgroundImage: "var(--pb-gradient)" }}
        >
          Steps to capture your moment
        </h2>
        <p className="text-lg">
          We make it easy to book and customise so you can enjoy the party.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <Step key={step.number} {...step} />
        ))}
      </div>

      <div className="text-center">
        <InstantLink href="/book-now" pendingVariant="text">
          <Button className={PEBBLR_CTA}>Book now</Button>
        </InstantLink>
      </div>
    </section>
  );
}
