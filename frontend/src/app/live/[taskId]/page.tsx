"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { LoadingOverlay } from "@/components/layout";
import { Square } from "lucide-react";

export default function LivePage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.taskId as string;

    const [isRunning, setIsRunning] = useState(true);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [connectionStatus, setConnectionStatus] = useState<
        "connecting" | "live" | "stopped"
    >("connecting");
    const wsRef = useRef<WebSocket | null>(null);
    const [frame, setFrame] = useState<string | null>(null);

    const { data: job, isLoading } = useQuery({
        queryKey: ["job", taskId],
        queryFn: () => api.getJob(taskId),
        enabled: !!taskId,
    });

    // WebSocket connection for live stream
    useEffect(() => {
        if (!taskId || !isRunning) return;

        const ws = new WebSocket(api.getWebSocketUrl(taskId));
        wsRef.current = ws;

        ws.onopen = () => {
            setConnectionStatus("live");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "frame") {
                    setFrame(`data:image/jpeg;base64,${data.frame}`);
                }
                if (data.counts) {
                    setCounts(data.counts);
                }
            } catch {
                // Handle raw frame data
                if (event.data instanceof Blob) {
                    const url = URL.createObjectURL(event.data);
                    setFrame(url);
                }
            }
        };

        ws.onerror = () => {
            setConnectionStatus("stopped");
        };

        ws.onclose = () => {
            setConnectionStatus("stopped");
            setIsRunning(false);
        };

        return () => {
            ws.close();
        };
    }, [taskId, isRunning]);

    // Poll for counts as fallback
    useEffect(() => {
        if (!taskId || !isRunning) return;

        const pollCounts = async () => {
            try {
                const data = await api.getLiveCounts(taskId);
                setCounts(data.counts);
                if (!data.running) {
                    setIsRunning(false);
                    setConnectionStatus("stopped");
                }
            } catch {
                // Ignore errors
            }
        };

        const interval = setInterval(pollCounts, 1000);
        return () => clearInterval(interval);
    }, [taskId, isRunning]);

    const handleStop = async () => {
        try {
            await api.stopLiveStream(taskId);
            setIsRunning(false);
            setConnectionStatus("stopped");
        } catch (error) {
            console.error("Failed to stop stream:", error);
        }
    };

    if (isLoading) {
        return <LoadingOverlay message="Loading stream..." />;
    }

    if (!job) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-secondary-text">Stream not found</p>
            </div>
        );
    }

    return (
        <main className="flex-1 flex flex-col p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Status Indicator */}
                    <div
                        className={`w-3 h-3 rounded-full ${connectionStatus === "live"
                            ? "bg-green-500 animate-pulse"
                            : connectionStatus === "connecting"
                                ? "bg-yellow-500 animate-pulse"
                                : "bg-gray-500"
                            }`}
                    />
                    <h1 className="text-xl font-semibold text-text-color">
                        {connectionStatus === "live"
                            ? "Live"
                            : connectionStatus === "connecting"
                                ? "Connecting..."
                                : "Stopped"}
                    </h1>
                    <span className="text-sm text-secondary-text">
                        {job.sourceType === "webcam" ? "Webcam" : "RTSP Stream"}
                    </span>
                </div>

                <button
                    onClick={handleStop}
                    disabled={!isRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isRunning
                        ? "bg-delete-text text-white hover:bg-delete-text/80"
                        : "bg-gray-500 text-gray-300 cursor-not-allowed"
                        }`}
                >
                    <Square className="w-4 h-4" />
                    Stop Stream
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                {/* Video Feed */}
                <div className="flex-1 bg-primary-color border border-primary-border rounded-xl overflow-hidden flex items-center justify-center">
                    {frame ? (
                        <img
                            src={frame}
                            alt="Live stream"
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="text-secondary-text">
                            {connectionStatus === "connecting"
                                ? "Connecting to stream..."
                                : "Stream stopped"}
                        </div>
                    )}
                </div>

                {/* Stats Sidebar */}
                <div className="w-full lg:w-72 bg-primary-color border border-primary-border rounded-xl p-4 overflow-y-auto">
                    <h2 className="text-sm font-semibold text-text-color mb-4">
                        Live Counts
                    </h2>

                    {/* Zone Counts */}
                    <div className="space-y-3">
                        {job.zones?.map((zone) => {
                            const count = counts[zone.id] || 0;
                            const isLine = zone.points?.length === 2;

                            return (
                                <div
                                    key={zone.id}
                                    className="bg-btn-bg border border-btn-border rounded-lg p-3"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor: `rgb(${zone.color?.join(",")})`,
                                            }}
                                        />
                                        <span className="text-sm font-medium text-text-color">
                                            {zone.label}
                                        </span>
                                    </div>

                                    <p className="text-3xl font-bold text-text-color text-center">
                                        {count}
                                    </p>
                                    <p className="text-xs text-secondary-text text-center">
                                        {isLine ? "Crossings" : "In Zone"}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    {!isRunning && (
                        <div className="mt-4 space-y-2">
                            <button
                                onClick={() => router.push(`/zone/${taskId}`)}
                                className="w-full btn-secondary"
                            >
                                Edit Zones
                            </button>
                            <button
                                onClick={() => router.push("/")}
                                className="w-full btn-primary"
                            >
                                New Session
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Info */}
            <footer className="mt-4 flex justify-between text-sm text-secondary-text">
                <span>
                    Resolution: {job.frameWidth}×{job.frameHeight}
                </span>
                <span>Model: {job.model?.replace(".pt", "")}</span>
                <span>Confidence: {job.confidence}%</span>
            </footer>
        </main>
    );
}
