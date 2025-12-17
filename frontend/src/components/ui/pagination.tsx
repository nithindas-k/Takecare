import * as React from "react";

import { cn } from "../../lib/utils";

export function Pagination({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export const PaginationContent = React.forwardRef<
  HTMLOListElement,
  React.ComponentProps<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

export const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

export type PaginationLinkProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
};

export const PaginationLink = React.forwardRef<
  HTMLButtonElement,
  PaginationLinkProps
>(({ className, isActive, disabled, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-current={isActive ? "page" : undefined}
    disabled={disabled}
    className={cn(
      "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-bold transition-all",
      "border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A1B0]/30 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      isActive &&
        "bg-[#00A1B0] text-white hover:bg-[#008f9c] border-transparent shadow-md",
      className
    )}
    {...props}
  />
));
PaginationLink.displayName = "PaginationLink";

export const PaginationPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <PaginationLink
    ref={ref}
    aria-label="Go to previous page"
    className={cn("px-5", className)}
    {...props}
  >
    Prev
  </PaginationLink>
));
PaginationPrevious.displayName = "PaginationPrevious";

export const PaginationNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <PaginationLink
    ref={ref}
    aria-label="Go to next page"
    className={cn("px-5", className)}
    {...props}
  >
    Next
  </PaginationLink>
));
PaginationNext.displayName = "PaginationNext";

export function PaginationEllipsis({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-11 w-11 items-center justify-center text-gray-400",
        className
      )}
      {...props}
    >
      ...
    </span>
  );
}
