import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "link";
type Size = "sm" | "md" | "icon" | "link";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent/90 disabled:opacity-40",
  ghost: "hover:bg-accent-soft",
  outline: "border border-line bg-bg shadow-sm hover:bg-accent-soft",
  link: "underline-offset-4 hover:underline",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  icon: "h-8 w-8",
  link: "h-auto p-0 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
