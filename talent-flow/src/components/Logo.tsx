import logoDark from "@/assets/joblify-logo-dark.png";
import logoLight from "@/assets/joblify-logo-light.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light";
}

export const Logo = ({ className, size = "md", variant = "dark" }: LogoProps) => {
  const sizes = {
    sm: "h-12",
    md: "h-14",
    lg: "h-20",
    xl: "h-24",
  };
  return (
    <img
      src={variant === "light" ? logoLight : logoDark}
      alt="Joblify"
      className={cn(sizes[size], "w-auto object-contain select-none")}
      draggable={false}
    />
  );
};
