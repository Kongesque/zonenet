"use client";

import { ReactNode } from "react";

export function BentoGrid({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={`grid w-full h-full gap-4 ${className}`}
        >
            {children}
        </div>
    );
}

export function BentoCard({
    className,
    children,
    title,
    icon,
    noScroll,
    noSpacer,
}: {
    className?: string;
    children: ReactNode;
    title?: string;
    icon?: ReactNode;
    noScroll?: boolean;
    noSpacer?: boolean;
}) {
    return (
        <div
            className={`group relative flex flex-col overflow-hidden rounded-xl
      border border-white/5 bg-neutral-900/50 backdrop-blur-md shadow-2xl
      transition-all duration-300 hover:border-white/10
      ${className}`}
        >
            {/* Header - Absolute positioned, pointer-events-none to allow clicking through to spacer if needed, 
                but we usually want the header to be visual. z-30 to stay on top of scrollable content. */}
            {(title || icon) && (
                <div className="absolute top-0 left-0 w-full px-4 py-3 z-30 flex items-center gap-2 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
                    {icon && <span className="text-white/70">{icon}</span>}
                    {title && <h3 className="font-semibold text-white/90 text-xs tracking-wider uppercase">{title}</h3>}
                </div>
            )}

            {/* Content Container - z-20 to sit above hover/decor effects */}
            <div className="relative z-20 flex-1 w-full h-full overflow-hidden flex flex-col">
                <div className={`flex-1 w-full h-full ${noScroll ? 'overflow-hidden' : 'overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent'}`}>
                    {/* Spacer to prevent content from starting under the header (unless disabled) */}
                    {(!noSpacer && (title || icon)) && <div className="h-12 w-full shrink-0" />}
                    {children}
                </div>
            </div>

            {/* Subtle decorative gradient - z-10 (behind content) */}
            <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-white/[0.01] z-10" />
        </div>
    );
}
