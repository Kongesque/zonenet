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
    const [isStreamReady, setIsStreamReady] = useState(false);
    const retryCountRef = useRef(0);
    const maxRetries = 3;

    const { data: job, isLoading } = useQuery({
        queryKey: ["job", taskId],
        queryFn: () => api.getJob(taskId),
        enabled: !!taskId,
    });

    // WebSocket connection for live stream with retry logic
    useEffect(() => {
        if (!taskId || !isRunning) return;

        const connectWebSocket = () => {
            const ws = new WebSocket(api.getWebSocketUrl(taskId));
            wsRef.current = ws;

            ws.onopen = () => {
                setConnectionStatus("live");
                retryCountRef.current = 0; // Reset retry count on successful connection
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "frame") {
                        setFrame(`data:image/jpeg;base64,${data.frame}`);
                        setIsStreamReady(true);
                    }
                    if (data.counts) {
                        setCounts(data.counts);
                    }
                    // Handle error messages from backend
                    if (data.error) {
                        console.error("Stream error:", data.error);
                    }
                } catch {
                    // Handle raw frame data
                    if (event.data instanceof Blob) {
                        const url = URL.createObjectURL(event.data);
                        setFrame(url);
                        setIsStreamReady(true);
                    }
                }
            };

            ws.onerror = () => {
                // Don't immediately mark as stopped, try to reconnect
                if (retryCountRef.current < maxRetries) {
                    retryCountRef.current++;
                    setTimeout(connectWebSocket, 1000); // Retry after 1 second
                } else {
                    setConnectionStatus("stopped");
                }
            };

            ws.onclose = () => {
                // Only mark as stopped if we've exhausted retries or user stopped it
                if (retryCountRef.current >= maxRetries || !isRunning) {
                    setConnectionStatus("stopped");
                    setIsRunning(false);
                } else if (isRunning) {
                    // Try to reconnect
                    retryCountRef.current++;
                    setTimeout(connectWebSocket, 1000);
                }
            };
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [taskId, isRunning]);

    // Poll for counts as fallback (don't immediately stop on first poll)
    useEffect(() => {
        if (!taskId || !isRunning) return;

        let pollCount = 0;
        const pollCounts = async () => {
            try {
                const data = await api.getLiveCounts(taskId);
                setCounts(data.counts);
                // Only stop if stream reports not running AND we've polled a few times
                // This gives time for the backend to start
                if (!data.running && pollCount > 5) {
                    setIsRunning(false);
                    setConnectionStatus("stopped");
                }
                pollCount++;
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

    // Show loader until stream is ready (first frame received)
    if (!isStreamReady && isRunning) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <p className="text-lg font-medium text-text-color">
                        Connecting to stream<span className="animate-pulse">...</span>
                    </p>
                    <span className="text-base text-secondary-text mt-1">
                        {job.sourceType === "webcam" ? "Opening webcam" : "Connecting to RTSP stream"}
                    </span>
                </div>
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
