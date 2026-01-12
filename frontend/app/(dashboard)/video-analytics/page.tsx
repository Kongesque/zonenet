"use client";

import { useState, useEffect } from "react";
import { PageTitle2 } from "@/components/page-title";
import { UploadArea, SearchInput, VideoCard } from "@/components/video-analytics";

interface VideoTask {
    id: string;
    name: string;
    duration: string;
    createdAt: string;
    format: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    thumbnail?: string;
    progress?: number;
}

export default function Page() {
    const [searchQuery, setSearchQuery] = useState("");
    const [tasks, setTasks] = useState<VideoTask[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/video/tasks');
            const data = await res.json();
            // Backend returns list directly, so set it.
            // Map backend fields to frontend interface if needed.
            // Backend keys: id, status, filename, created_at, name, format, thumbnail_url
            const mappedTasks = data.map((t: any) => ({
                id: t.id,
                name: t.name,
                duration: t.duration || "00:00",
                createdAt: new Date(t.created_at || Date.now()).toLocaleDateString(),
                format: t.format || "MP4",
                status: t.status,
                thumbnail: t.thumbnail_url ? `http://localhost:8000${t.thumbnail_url}` : undefined,
                progress: t.progress
            }));
            setTasks(mappedTasks); // Backend now sorts by default
            setLoading(false);
        } catch (err) {
            console.error("Failed to load video tasks", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 2000); // Poll every 2s for faster progress updates
        return () => clearInterval(interval);
    }, []);

    const filteredHistory = tasks.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-1 flex-col gap-8 p-4">
            <PageTitle2 />
            <UploadArea />
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
            />
            {loading ? (
                <div className="flex justify-center p-8 text-muted-foreground">Loading video tasks...</div>
            ) : filteredHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {filteredHistory.map((item) => (
                        <VideoCard
                            key={item.id}
                            taskId={item.id}
                            name={item.name}
                            duration={item.duration}
                            createdAt={item.createdAt}
                            format={item.format}
                            status={item.status}
                            thumbnail={item.thumbnail}
                            progress={item.progress}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex h-24 items-center justify-center">
                    <span className="text-muted-foreground">No results found.</span>
                </div>
            )}
        </div>
    );
}
