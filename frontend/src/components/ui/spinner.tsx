import * as React from "react";
import { cn } from "../../lib/utils";

interface SpinnerProps extends React.ComponentProps<"div"> {
    size?: "sm" | "md" | "lg" | "xl";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
    ({ className, size = "md", ...props }, ref) => {
        const sizeClasses = {
            sm: "size-4",
            md: "size-6",
            lg: "size-8",
            xl: "size-12",
        };

        return (
            <div
                ref={ref as any}
                role="status"
                aria-label="Loading"
                className={cn(
                    "animate-spin rounded-full border-2 border-[#00A1B0] border-t-transparent",
                    sizeClasses[size],
                    className
                )}
                {...props}
            />
        );
    }
);

Spinner.displayName = "Spinner";

export function SpinnerCustom({ className, text }: { className?: string; text?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <Spinner size="lg" className="drop-shadow-[0_0_8px_rgba(0,161,176,0.2)]" />
            {text && <p className="text-sm font-medium text-gray-500 animate-pulse">{text}</p>}
        </div>
    );
}

export { Spinner };
