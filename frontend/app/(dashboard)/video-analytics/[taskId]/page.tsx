"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
    ChevronRight,
    Search,
    Filter,
    MoreHorizontal,
    Download,
    Share2,
    Trash2,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Volume2,
    Settings,
    Maximize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AspectRatio } from "@/components/ui/aspect-ratio"

export default function VideoAnalyticsDetailPage() {
    const params = useParams();
    const taskId = params.taskId as string;

    const [task, setTask] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(100); // Placeholder until video loads
    const [volume, setVolume] = useState(80);
    const [playbackSpeed, setPlaybackSpeed] = useState("1x");

    useEffect(() => {
        if (!taskId) return;

        fetch('/data/video_tasks.json')
            .then(res => res.json())
            .then(data => {
                const foundTask = data.tasks.find((t: any) => t.id === taskId);
                const foundEvents = data.events.filter((e: any) => e.video_task_id === taskId);

                setTask(foundTask || null);
                setEvents(foundEvents || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load video data", err);
                setLoading(false);
            });
    }, [taskId]);

    // Handle play/pause toggle
    const togglePlay = () => setIsPlaying(!isPlaying);

    // Format time helper (seconds -> MM:SS)
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

    if (loading) {
        return <div className="flex flex-1 items-center justify-center">Loading video data...</div>;
    }

    if (!task) {
        return <div className="flex flex-1 items-center justify-center">Video task not found.</div>;
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{task.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{task.duration}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs uppercase">
                            {task.format}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                            {task.status}
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

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content - Video Player */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative overflow-hidden rounded-xl border bg-black shadow-sm">
                        <AspectRatio ratio={16 / 9}>
                            <video
                                src="/preview.mp4"
                                className="h-full w-full object-cover"
                                loop
                                muted
                                autoPlay
                            />
                        </AspectRatio>

                        {/* Video Controls Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                            {/* Progress Bar */}
                            <div className="mb-4">
                                <Slider
                                    defaultValue={[currentTime]}
                                    max={duration}
                                    step={1}
                                    onValueChange={(vals) => setCurrentTime(vals[0])}
                                    className="cursor-pointer"
                                />
                                <div className="mt-1 flex justify-between text-xs text-white/70">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                                        onClick={togglePlay}
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-5 w-5" />
                                        ) : (
                                            <Play className="h-5 w-5" />
                                        )}
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        <Volume2 className="h-4 w-4 text-white/70" />
                                        <Slider
                                            defaultValue={[volume]}
                                            max={100}
                                            step={1}
                                            onValueChange={(vals) => setVolume(vals[0])}
                                            className="w-24"
                                        />
                                    </div>
                                    <span className="text-xs text-white/70 px-2 border border-white/20 rounded">
                                        LIVE
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Select
                                        value={playbackSpeed}
                                        onValueChange={setPlaybackSpeed}
                                    >
                                        <SelectTrigger className="h-8 w-[70px] border-none bg-transparent text-white focus:ring-0 focus:ring-offset-0">
                                            <SelectValue placeholder="Speed" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0.5x">0.5x</SelectItem>
                                            <SelectItem value="1x">1x</SelectItem>
                                            <SelectItem value="1.5x">1.5x</SelectItem>
                                            <SelectItem value="2x">2x</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                                    >
                                        <Maximize className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border bg-card p-4 shadow-sm">
                            <div className="text-xs font-medium text-muted-foreground uppercase">
                                Total Events
                            </div>
                            <div className="mt-2 text-2xl font-bold">{events.length}</div>
                        </div>
                        <div className="rounded-lg border bg-card p-4 shadow-sm">
                            <div className="text-xs font-medium text-muted-foreground uppercase">
                                Avg Confidence
                            </div>
                            <div className="mt-2 text-2xl font-bold">
                                {(events.reduce((acc, e) => acc + e.confidence, 0) / (events.length || 1) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="rounded-lg border bg-card p-4 shadow-sm">
                            <div className="text-xs font-medium text-muted-foreground uppercase">
                                Duration
                            </div>
                            <div className="mt-2 text-2xl font-bold">{task.duration}</div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Object Filters & Timeline */}
                <div className="space-y-6">
                    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Events</h3>
                            <Badge variant="secondary">{events.length}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search objects..."
                                    className="pl-9 h-9"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/50 cursor-pointer transition-colors"

                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                                        {event.start_time.split(':')[1]}:{event.start_time.split(':')[2]}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium capitalize">{event.label}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {(event.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Timestamp: {event.start_time}
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
    );
}
