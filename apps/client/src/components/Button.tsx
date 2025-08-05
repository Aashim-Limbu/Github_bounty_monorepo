import React, {ButtonHTMLAttributes} from "react";
type ButtonProps = {
    className?: string;
    children: React.ReactNode;
    variant?: "primary" | "secondary";
} & ButtonHTMLAttributes<HTMLButtonElement>;
export default function Button({className, children, variant = "primary", ...props}: ButtonProps) {
    const base =
        "rounded-md px-2.5 py-2 text-sm font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2";
    const variants: Record<string, string> = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600",
        secondary:
            "bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50 focus-visible:outline-indigo-400",
    };
    return (
        <button {...props} className={`${base} ${variants[variant] || variants.primary} ${className || ""}`}>
            {children}
        </button>
    );
}
