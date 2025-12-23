"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { api } from "@/utils/api";

interface HeaderProps {
    children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [gpuInfo, setGpuInfo] = useState<{
        available: boolean;
        name: string;
    } | null>(null);

    useEffect(() => {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem("theme");
        if (
            savedTheme === "light" ||
            (!savedTheme && window.matchMedia("(prefers-color-scheme: light)").matches)
        ) {
            setTheme("light");
            document.documentElement.classList.add("light");
        }

        // Fetch GPU status
        api
            .getSystemInfo()
            .then((data) => {
                setGpuInfo(data.gpu);
            })
            .catch(() => {
                // Silently fail - badge stays hidden
            });
    }, []);

    const toggleTheme = () => {
        if (theme === "dark") {
            setTheme("light");
            document.documentElement.classList.add("light");
            localStorage.setItem("theme", "light");
        } else {
            setTheme("dark");
            document.documentElement.classList.remove("light");
            localStorage.setItem("theme", "dark");
        }
    };

    return (
        <header className="flex justify-between items-center py-2.5 px-3 bg-transparent">
            <Link href="/" className="no-underline">
                <div className="text-lg font-semibold text-text-color tracking-tight font-mono">
                    ZoneNet
                </div>
            </Link>
            <div className="flex items-center gap-2">
                {/* GPU/CPU Status Badge */}
                {gpuInfo && (
                    <div
                        className={`px-2 py-0.5 text-xs font-medium rounded-full cursor-default ${gpuInfo.available
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                        title={gpuInfo.name || "Compute Device"}
                    >
                        {gpuInfo.available ? "GPU" : "CPU"}
                    </div>
                )}

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-btn-hover transition-colors text-text-color cursor-pointer"
                    title="Toggle Theme"
                >
                    {theme === "dark" ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </button>

                {/* Additional header actions */}
                {children}
            </div>
        </header>
    );
}
