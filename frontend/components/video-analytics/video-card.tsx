"use client";

import Link from "next/link";
import EchoLoader from "@/components/echo-loader"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoCardProps {
    taskId: string
    name: string
    thumbnail?: string
    duration: string
    createdAt: string
    format: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress?: number
    onDownload?: () => void
    onDelete?: () => void
}

export function VideoCard({
    taskId,
    name,
    thumbnail = "/zonenet.png",
    duration,
    createdAt,
    format,
    status = 'completed',
    progress,
    onDownload,
    onDelete,
}: VideoCardProps) {
    return (
        <Card size="default" className="group gap-0 w-full border-0 bg-transparent shadow-none ring-0 py-2">
            {/* Thumbnail container with timestamp */}
            <Link href={`/video-analytics/${taskId}`}>
                <div className="relative overflow-hidden rounded-xl transition-all duration-300 group-hover:rounded-none cursor-pointer">
                    <img
                        src={thumbnail}
                        alt={name}
                        className="aspect-video w-full object-cover transition-opacity duration-300 group-hover:opacity-50"
                    />
                    {/* Timestamp badge */}
                    {status === 'completed' && (
                        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
                            {duration}
                        </div>
                    )}

                    {/* Processing Overlay */}
                    {(status === 'processing' || status === 'pending') && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 z-10">
                            <EchoLoader size={48} className="text-white/80" />
                            <span className="text-white/80 font-medium text-sm">
                                {progress !== undefined ? `${progress}%` : 'Starting...'}
                            </span>
                        </div>
                    )}
                </div>
            </Link>

            {/* Video info */}
            <CardHeader className="px-0 pt-3 pb-0">
                <CardTitle className="text-sm">
                    {name}
                </CardTitle>
                <CardDescription className="text-xs">
                    {createdAt} • {format}
                </CardDescription>
                <CardAction>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-transparent">
                                <MoreVertical className="h-10 w-10" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={onDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardAction>
            </CardHeader>
        </Card>
    )
}
