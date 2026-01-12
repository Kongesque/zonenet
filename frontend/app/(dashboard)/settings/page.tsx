"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PageTitle2 } from "@/components/page-title";

export default function Page() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <PageTitle2 />

            {/* Settings List */}
            <div className="flex flex-col">
                {/* Theme Setting */}
                <div className="flex items-center justify-between border-b border-border py-5">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">Theme</span>
                        <span className="text-muted-foreground text-xs">
                            How Locus looks on your device
                        </span>
                    </div>
                    <Select value={theme} onValueChange={setTheme} defaultValue="dark">
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dark">
                                <Moon className="size-4" />
                                Dark
                            </SelectItem>
                            <SelectItem value="light">
                                <Sun className="size-4" />
                                Light
                            </SelectItem>
                            <SelectItem value="system">
                                <Monitor className="size-4" />
                                System
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
