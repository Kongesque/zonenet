"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Trash2 } from "lucide-react";
import { api } from "@/utils/api";

interface HeaderProps {
    children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [gpuInfo, setGpuInfo] = useState<{
        available: boolean;
        name: string;
    } | null>(null);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);

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
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    const handleClearCache = async () => {
        if (!confirm("Are you sure you want to clear all cached data? This will delete all jobs, videos, and results.")) {
            return;
        }

        setIsClearing(true);
        try {
            const result = await api.clearAllJobs();
            if (result.success) {
                alert(`Successfully cleared ${result.deleted_count} job(s)`);
                // Refresh the page to update any job lists
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to clear cache:", error);
            alert("Failed to clear cache. Please try again.");
        } finally {
            setIsClearing(false);
        }
    };

    // Avoid hydration mismatch - don't render theme button until mounted
    const renderThemeButton = () => {
        if (!mounted) {
            return (
                <div className="w-8 h-8 flex items-center justify-center rounded-md">
                    <div className="w-5 h-5" />
                </div>
            );
        }

        return (
            <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-btn-hover transition-colors text-text-color cursor-pointer"
                title="Toggle Theme"
            >
                {resolvedTheme === "dark" ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )}
            </button>
        );
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

                {/* Clear Cache Button */}
                {mounted && (
                    <button
                        onClick={handleClearCache}
                        disabled={isClearing}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-btn-hover transition-colors text-text-color cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Clear Cache"
                    >
                        <Trash2 className={`w-5 h-5 ${isClearing ? "animate-pulse" : ""}`} />
                    </button>
                )}

                {/* Theme Toggle */}
                {renderThemeButton()}

                {/* Additional header actions */}
                {children}
            </div>
        </header>
    );
}
