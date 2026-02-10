import * as React from "react"
import { cn } from "../../lib/utils"

const Field = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col gap-2", className)}
        {...props}
    />
))
Field.displayName = "Field"

const FieldLabel = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            "text-xs font-black uppercase tracking-widest text-[#00A1B0] flex items-center justify-between px-1",
            className
        )}
        {...props}
    />
))
FieldLabel.displayName = "FieldLabel"

export { Field, FieldLabel }
