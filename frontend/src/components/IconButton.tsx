import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "ghost" | "outline" | "accent" | "danger";
type Size = "sm" | "md";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function IconButton({
  variant = "ghost",
  size = "md",
  children,
  className,
  type,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-[var(--dur-fast)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
        variant === "ghost" && "text-text-2 hover:bg-surface-3 hover:text-text",
        variant === "outline" &&
          "border border-hair text-text-2 hover:bg-surface-3 hover:text-text",
        variant === "accent" && "bg-accent text-on-accent hover:bg-accent-hover",
        variant === "danger" && "text-text-2 hover:bg-danger-soft hover:text-danger",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  active?: boolean;
  children?: ReactNode;
}

export function PillButton({ icon, children, className, ...rest }: PillButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors duration-[var(--dur-fast)]",
        "text-text-2 hover:bg-surface-3 hover:text-text",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
