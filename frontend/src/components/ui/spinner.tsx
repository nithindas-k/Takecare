import * as React from "react";
import { Loader } from "lucide-react";
import { cn } from "../../lib/utils";

interface SpinnerProps extends React.ComponentProps<"svg"> {
    size?: "sm" | "md" | "lg" | "xl";
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
    ({ className, size = "md", ...props }, ref) => {
        const sizeClasses = {
            sm: "size-4",
            md: "size-6",
            lg: "size-8",
            xl: "size-12",
        };

        return (
            <Loader
                ref={ref}
                role="status"
                aria-label="Loading"
                className={cn(
                    "animate-spin text-[#00A1B0]",
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
            <div className="flex items-center gap-4">
                <Spinner size="lg" className="text-[#00A1B0]" />
            </div>
            {text && <p className="text-sm font-medium text-gray-500 animate-pulse">{text}</p>}
        </div>
    );
}

export { Spinner };
