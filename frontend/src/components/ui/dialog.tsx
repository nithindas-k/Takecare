import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils";

type DialogContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export type DialogContentProps = React.HTMLAttributes<HTMLDivElement>;

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("DialogContent must be used within Dialog");

  const { open, onOpenChange } = ctx;
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl",
          className
        )}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        <div className="max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-5", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export type DialogDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps) {
  return <p className={cn("text-sm text-gray-500", className)} {...props} />;
}

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 p-4",
        className
      )}
      {...props}
    />
  );
}

export type DialogCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function DialogClose({ className, ...props }: DialogCloseProps) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("DialogClose must be used within Dialog");

  const { onOpenChange } = ctx;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}
