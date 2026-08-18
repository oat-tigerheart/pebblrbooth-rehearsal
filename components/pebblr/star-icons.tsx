import type { SVGProps } from "react";

/**
 * The two four/eight-point sparkles scattered over the hero and CTA artwork.
 * Ported verbatim from V1 (`src/components/icon/svg/star-{1,2}.tsx`) so the
 * silhouettes match the live site exactly.
 *
 * `fill="currentColor"` replaces V1's hardcoded `fill="white"`: both call sites
 * paint them white today, but tying the fill to `color` means a future dark
 * band can recolour them with a text utility instead of a second SVG.
 */
export function Star1(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 38 38"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0.269562 37.3796C-0.200438 38.0496 -0.040438 38.2096 0.629562 37.7396L7.48956 32.9196C14.3996 28.0696 23.6096 28.0696 30.5196 32.9196L37.3796 37.7396C38.0496 38.2096 38.2096 38.0496 37.7396 37.3796L32.9196 30.5196C28.0696 23.6096 28.0696 14.3996 32.9196 7.48956L37.7396 0.629562C38.2096 -0.040438 38.0496 -0.200438 37.3796 0.269562L30.5196 5.08956C23.6096 9.93956 14.3996 9.93956 7.48956 5.08956L0.629562 0.269562C-0.040438 -0.200438 -0.200438 -0.040438 0.269562 0.629562L5.08956 7.48956C9.93956 14.3996 9.93956 23.6096 5.08956 30.5196L0.269562 37.3796Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Star2(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.6825 28.4325L17.8825 33.5325C18.0025 34.0325 18.1425 34.0325 18.1925 33.5125L18.7125 28.2925C19.2525 22.9025 23.1525 18.4525 28.4225 17.2125L33.5225 16.0125C34.0225 15.8925 34.0225 15.7525 33.5025 15.7025L28.2925 15.1825C22.9025 14.6425 18.4525 10.7425 17.2125 5.47253L16.0125 0.372535C15.8925 -0.127465 15.7525 -0.127461 15.7025 0.392539L15.1825 5.60254C14.6425 10.9925 10.7425 15.4425 5.47254 16.6825L0.372537 17.8825C-0.127463 18.0025 -0.127463 18.1425 0.392537 18.1925L5.61254 18.7125C11.0025 19.2525 15.4525 23.1525 16.6925 28.4225L16.6825 28.4325Z"
        fill="currentColor"
      />
    </svg>
  );
}
