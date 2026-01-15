"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    ChevronRight,
    Search,
    Filter,
    MoreHorizontal,
    Download,
    Share2,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AspectRatio } from "@/components/ui/aspect-ratio"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VideoEvent {
    id: string;
    label: string;
    confidence: number;
    start_time: string;
    end_time?: string;
}

interface VideoTask {
    id: string;
    name: string;
    status: string;
    format: string;
    duration: string;
    duration_seconds?: number;
    created_at: string;
    result_url?: string;
    input_path?: string;
    events?: VideoEvent[];
}

export default function VideoAnalyticsDetailPage() {
    const params = useParams();
    const taskId = params.taskId as string;

    const [task, setTask] = useState<VideoTask | null>(null);
    const [events, setEvents] = useState<VideoEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Removed custom player state (isPlaying, currentTime, volume, etc.)

    useEffect(() => {
        if (!taskId) return;

        fetch(`${API_URL}/api/video/${taskId}`)
            .then(res => {
                if (!res.ok) throw new Error("Task not found");
                return res.json();
            })
            .then((data: VideoTask) => {
                setTask(data);
                setEvents(data.events || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load video data", err);
                setLoading(false);
                setTask(null);
            });
    }, [taskId]);

    if (loading) {
        return <div className="flex flex-1 items-center justify-center">Loading video data...</div>;
    }

    if (!task) {
        return <div className="flex flex-1 items-center justify-center">Video task not found.</div>;
    }

    // Stats calculations
    const stats = [
        {
            label: "Total Events",
            value: events.length,
            subtext: "Detected objects",
            badge: null
        },
        {
            label: "Avg Confidence",
            value: `${(events.reduce((acc, e) => acc + e.confidence, 0) / (events.length || 1) * 100).toFixed(1)}%`,
            subtext: "Detection accuracy",
            badge: null
        },
        {
            label: "Duration",
            value: task.duration,
            subtext: "Video length",
            badge: null
        },
        {
            label: "Status",
            value: task.status,
            subtext: task.format,
            badge: <Badge variant="secondary" className="capitalize">{task.status}</Badge>
        }
    ];

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex flex-1 flex-row gap-4">
                {/* Left Column: Video & Actions */}
                <div className="w-full max-w-4xl flex flex-col gap-4">
                    {/* Video Player - Simplified to standard browser controls */}
                    <div className="relative overflow-hidden rounded-lg border bg-black shadow-sm">
                        <AspectRatio ratio={16 / 9} className="max-h-[70vh]">
                            <video
                                src={task?.result_url ? `${API_URL}${task.result_url}` : task?.input_path ? `${API_URL}/api/video/${taskId}/stream` : ""}
                                className="h-full w-full object-contain"
                                controls
                                loop
                            />
                        </AspectRatio>
                    </div>

                    {/* Metadata & Actions Card */}
                    <div className="bg-card rounded-lg border p-4 flex flex-col gap-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">{task.name}</h1>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Unknown Date'}
                                    </span>
                                    <span>•</span>
                                    <span>{task.duration}</span>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs uppercase">
                                        {task.format}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">More options</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Events */}
                <div className="grid gap-4 flex-1 grid-rows-[auto_1fr]">
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-card text-card-foreground rounded-lg border flex flex-col justify-between p-4 h-32">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <span className="text-sm font-medium">{stat.label}</span>
                                    {stat.badge}
                                </div>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.subtext}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Events List */}
                    <div className="bg-card rounded-lg border flex flex-col shadow-sm h-full">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Events</h3>
                                <Badge variant="secondary">{events.length}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search..."
                                        className="pl-9 h-9"
                                    />
                                </div>
                                <Button variant="outline" size="icon" className="h-9 w-9">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="space-y-2">
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                            {event.start_time.split(':')[1]}:{event.start_time.split(':')[2]}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium capitalize text-sm">{event.label}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {(event.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {event.start_time}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                ))}
                                {events.length === 0 && (
                                    <div className="text-center text-sm text-muted-foreground py-8">
                                        No events detected.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
