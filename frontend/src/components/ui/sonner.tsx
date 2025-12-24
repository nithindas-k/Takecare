import { Toaster as Sonner } from "sonner";
import React from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            position="top-center"
            richColors
            expand={false}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-xl rounded-xl border flex items-center p-4 gap-3",
                    description: "group-[.toast]:text-gray-500",
                    actionButton:
                        "group-[.toast]:bg-[#00A1B0] group-[.toast]:text-white",
                    cancelButton:
                        "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600",
                    success: "group-[.toaster]:border-teal-100 group-[.toaster]:bg-teal-50/50",
                    error: "group-[.toaster]:border-red-100 group-[.toaster]:bg-red-50/50",
                    info: "group-[.toaster]:border-blue-100 group-[.toaster]:bg-blue-50/50",
                    warning: "group-[.toaster]:border-yellow-100 group-[.toaster]:bg-yellow-50/50",
                },
                style: {
                    minWidth: '350px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                }
            }}
            {...props}
        />
    );
};

export { Toaster };
