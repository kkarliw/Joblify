import { cn } from "@/lib/utils";

export const CompanyLogo = ({
  initial,
  imageUrl,
  size = "md",
  className,
}: {
  initial: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizes = {
    sm: "h-9 w-9 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-xl",
  };
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card flex items-center justify-center font-display font-bold text-foreground overflow-hidden",
        sizes[size],
        className
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={initial} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
};

export const Avatar = ({
  initials,
  size = "md",
  className,
}: {
  initials: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) => {
  const sizes = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-sm",
    xl: "h-24 w-24 text-xl",
  };
  return (
    <div
      className={cn(
        "rounded-full bg-foreground text-background flex items-center justify-center font-semibold shrink-0",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
};
