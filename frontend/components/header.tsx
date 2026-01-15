"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { Bell, User, LogOut, Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/components/auth-context"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
export function Header() {
    const { setTheme } = useTheme()
    const { state } = useSidebar()
    const { logout } = useAuth()
    const pathname = usePathname()
    const [pageLabel, setPageLabel] = useState<string | null>(null)

    const cursorClass = state === "collapsed" ? "cursor-e-resize" : "cursor-w-resize"

    useEffect(() => {
        // Handle Livestream Route
        const livestreamMatch = pathname.match(/^\/livestream\/([^/]+)$/)
        if (livestreamMatch) {
            setPageLabel("Loading...")
            const cameraId = livestreamMatch[1]
            fetch('/data/events.json')
                .then(res => res.json())
                .then(data => {
                    const camera = data.cameras?.find((c: any) => c.id === cameraId)
                    setPageLabel(camera ? camera.name : "Unknown Camera")
                })
                .catch(() => setPageLabel("Camera View"))
            return
        }

        // Handle Video Analytics Route
        const videoMatch = pathname.match(/^\/video-analytics\/([^/]+)$/)
        if (videoMatch) {
            setPageLabel("Loading...")
            const taskId = videoMatch[1]
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            fetch(`${API_URL}/api/video/${taskId}`)
                .then(res => {
                    if (!res.ok) throw new Error("Task not found");
                    return res.json();
                })
                .then(task => {
                    setPageLabel(task.name || taskId)
                })
                .catch(() => setPageLabel(taskId)) // Fallback to ID if fetch fails 
            return
        }

        setPageLabel(null)
    }, [pathname])

    // Memoize breadcrumb info to avoid recalculating on every render
    const breadcrumbInfo = useMemo(() => {
        // Match /video-analytics/[taskId]
        const videoMatch = pathname.match(/^\/video-analytics\/([^/]+)$/)
        if (videoMatch) {
            return {
                parent: { label: "Video Analytics", href: "/video-analytics" },
                current: pageLabel ?? "Loading..."
            }
        }

        // Match /livestream/[cameraId]
        const livestreamMatch = pathname.match(/^\/livestream\/([^/]+)$/)
        if (livestreamMatch) {
            return {
                parent: { label: "Live Stream", href: "/livestream" },
                current: pageLabel ?? "Loading..."
            }
        }

        return null
    }, [pathname, pageLabel])

    return (
        <header className="sticky top-0 z-20 bg-background flex h-12 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center gap-4">
                <SidebarTrigger
                    className={cn("-ml-2.5", cursorClass)}
                />
                {breadcrumbInfo ? (
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild className="text-sm font-medium">
                                    <Link href={breadcrumbInfo.parent.href}>
                                        {breadcrumbInfo.parent.label}
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem >
                                <BreadcrumbPage className="text-sm font-medium">{breadcrumbInfo.current}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                ) : (
                    <PageTitle />
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                    <a href="https://www.kongesque.com" target="_blank" rel="noopener noreferrer">
                        Docs
                    </a>
                </Button>
                <Button variant="outline" size="icon" className="size-8">
                    <Bell className="size-4" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src="/kongesque.png" alt="@kongesque" />
                            <AvatarFallback>KO</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel className="font-normal">
                            <p className="text-xs py-2 leading-none text-muted-foreground">
                                kongesque@gmail.com
                            </p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span>Theme</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => setTheme("light")}>
                                        <Sun className="mr-2 h-4 w-4" />
                                        <span>Light</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                                        <Moon className="mr-2 h-4 w-4" />
                                        <span>Dark</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("system")}>
                                        <Monitor className="mr-2 h-4 w-4" />
                                        <span>System</span>
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
