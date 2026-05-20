import { memo } from "react";
import intel from "@/assets/logos/intel.svg";
import apple from "@/assets/logos/apple.svg";
import amazon from "@/assets/logos/amazon.png";
import tesla from "@/assets/logos/tesla.png";
import bancolombia from "@/assets/logos/bancolombia.png";
import microsoft from "@/assets/logos/microsoft.png";
import { cn } from "@/lib/utils";

const logos = [
  { src: apple, alt: "Apple", h: "h-9 md:h-14" },
  { src: microsoft, alt: "Microsoft", h: "h-8 md:h-12" },
  { src: intel, alt: "Intel", h: "h-8 md:h-12" },
  { src: amazon, alt: "Amazon", h: "h-9 md:h-14" },
  { src: tesla, alt: "Tesla", h: "h-10 md:h-16" },
  { src: bancolombia, alt: "Bancolombia", h: "h-8 md:h-12" },
];

interface LogoMarqueeProps {
  variant?: "light" | "dark";
  className?: string;
}

/**
 * Infinite logo marquee — seamless loop.
 * Two identical groups inside an outer flex with the same gap,
 * animated by -50% so the second group lands exactly where the first started.
 */
export const LogoMarquee = memo(({ variant = "light", className }: LogoMarqueeProps) => {
  const isDark = variant === "dark";

  const Group = ({ ariaHidden = false }: { ariaHidden?: boolean }) => (
    <ul
      className="flex shrink-0 items-center gap-10 md:gap-20 py-2 pr-10 md:pr-20"
      {...(ariaHidden ? { "aria-hidden": true as const } : {})}
    >
      {logos.map((logo, i) => (
        <li
          key={`${logo.alt}-${i}`}
          className="group/logo-item flex items-center justify-center shrink-0 transition-transform duration-300 ease-out hover:scale-[1.04]"
        >
          <img
            src={logo.src}
            alt={ariaHidden ? "" : logo.alt}
            className={cn(
              logo.h,
              "w-auto object-contain select-none transition-all duration-300 ease-out group-hover/logo-item:opacity-100",
              isDark
                ? "opacity-70 [filter:brightness(0)_invert(1)] group-hover/logo-item:[filter:brightness(0)_invert(1)_drop-shadow(0_0_10px_rgba(255,204,0,0.28))]"
                : "opacity-80 [filter:grayscale(1)_brightness(0.4)_contrast(1.1)] group-hover/logo-item:[filter:grayscale(0)_brightness(0.25)_contrast(1.12)]"
            )}
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        "[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]",
        className
      )}
      role="region"
      aria-label="Empresas que confían en Joblify"
    >
      <div className="flex w-max animate-logo-marquee will-change-transform [transform:translateZ(0)] [backface-visibility:hidden] [contain:layout_paint]">
        <Group />
        <Group ariaHidden />
      </div>
    </div>
  );
});

LogoMarquee.displayName = "LogoMarquee";
