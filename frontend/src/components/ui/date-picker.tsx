"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date?: Date
    setDate: (date: Date | undefined) => void
    disabled?: boolean
    className?: string
    placeholder?: string
}

export function DatePicker({
    date,
    setDate,
    disabled,
    className,
    placeholder = "Pick a date",
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    disabled={disabled}
                    className={cn(
                        "w-[180px] justify-start text-left font-medium transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 shadow-sm border-slate-200 text-slate-700",
                        !date && "text-slate-400",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    <span className="truncate">{date ? format(date, "PPP") : placeholder}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl bg-white overflow-hidden ring-1 ring-black/5" align="start">
                <div className="bg-primary/5 px-4 py-3 border-b border-primary/10">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                        <CalendarIcon className="w-3 h-3" />
                        {placeholder}
                    </h4>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                />
                {date && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span>Selected: {format(date, "MMM dd, yyyy")}</span>
                        <button
                            onClick={() => setDate(undefined)}
                            className="text-primary hover:underline"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
