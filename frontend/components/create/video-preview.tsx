"use client";

import { useVideo } from "@/components/video-context";
import { DrawingCanvas, Point, Zone } from "./drawing-canvas";
import { useEffect, useRef, useState } from "react";

interface VideoPreviewProps {
    zones: Zone[];
    selectedZoneId: string | null;
    drawingMode: 'polygon' | 'line';
    onZoneCreated: (points: Point[]) => void;
    onZoneSelected: (id: string | null) => void;
    onZoneUpdated: (id: string, newPoints: Point[]) => void;
}

export function VideoPreview({
    zones,
    selectedZoneId,
    drawingMode,
    onZoneCreated,
    onZoneSelected,
    onZoneUpdated
}: VideoPreviewProps) {
    const { videoUrl, videoType, videoStream, videoConfig } = useVideo();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [videoDims, setVideoDims] = useState<{ width: number; height: number; naturalWidth: number; naturalHeight: number } | null>(null);

    useEffect(() => {
        if (videoRef.current) {
            if (videoType === 'file' && videoUrl) {
                videoRef.current.srcObject = null;
                videoRef.current.src = videoUrl;
                videoRef.current.load();
            } else if (videoType === 'stream' && videoStream) {
                videoRef.current.src = "";
                videoRef.current.srcObject = videoStream;
                try {
                    videoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
                } catch (e) {
                    console.error("Error playing stream", e);
                }
            }
        }
    }, [videoUrl, videoType, videoStream]);


    useEffect(() => {
        const updateDims = () => {
            const video = videoRef.current;
            if (!video) return;

            // Get the bounding rect of the VIDEO ELEMENT
            const { width: dw, height: dh } = video.getBoundingClientRect();

            // Get natural dimensions
            const nw = video.videoWidth;
            const nh = video.videoHeight;

            if (nw === 0 || nh === 0) return;

            // Calculate the actual displayed dimensions of the video content within the element
            // 'object-contain' logic:
            const elementRatio = dw / dh;
            const videoRatio = nw / nh;

            let actualW = dw;
            let actualH = dh;

            if (elementRatio > videoRatio) {
                // Pillarbox: constrained by height
                actualW = dh * videoRatio;
            } else {
                // Letterbox: constrained by width
                actualH = dw / videoRatio;
            }

            setVideoDims({
                width: actualW,
                height: actualH,
                naturalWidth: nw,
                naturalHeight: nh,
            });
        };

        const video = videoRef.current;
        if (video) {
            video.addEventListener('loadedmetadata', updateDims);
            video.addEventListener('resize', updateDims); // Not standard on generic elements but works on window usually.
        }

        // Use ResizeObserver for robust tracking
        const observer = new ResizeObserver(updateDims);
        if (video) observer.observe(video);

        // Also observe container just in case
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            video?.removeEventListener('loadedmetadata', updateDims);
            video?.removeEventListener('resize', updateDims);
            observer.disconnect();
        };
    }, [videoUrl, videoStream, videoType]);

    if (videoType === 'rtsp') {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-black text-muted-foreground p-4 text-center">
                <p className="font-semibold mb-2">RTSP Stream Placeholder</p>
                <div className="text-xs font-mono bg-zinc-900 p-2 rounded max-w-full break-all">
                    {videoConfig?.url || "No URL provided"}
                </div>
                <p className="text-xs mt-4 opacity-50 max-w-[300px]">
                    Note: Real RTSP streaming requires a backend transcoder (e.g. go2rtc/ffmpeg).
                    This is just a UI demonstration of the data flow.
                </p>
            </div>
        );
    }

    if (!videoUrl && !videoStream) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-black text-muted-foreground">
                <p>No video selected</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center rounded-lg overflow-hidden">
            <video
                ref={videoRef}
                className="max-w-full max-h-full object-contain pointer-events-none" // Disable pointer events on video so it doesn't steal from canvas if stacked wrong? No, canvas is on top.
                autoPlay
                loop
                muted
                playsInline
                crossOrigin="anonymous"
            >
                {/* Only render source if it's a file, otherwise we use srcObject above */}
                {videoType === 'file' && <source src={videoUrl || ""} type="video/mp4" />}
                Your browser does not support the video tag.
            </video>

            {/* Drawing Canvas Overlay */}
            {videoDims && (
                <div
                    className="absolute z-10 flex items-center justify-center"
                    style={{ width: videoDims.width, height: videoDims.height }}
                >
                    <DrawingCanvas
                        width={videoDims.width}
                        height={videoDims.height}
                        videoWidth={videoDims.naturalWidth}
                        videoHeight={videoDims.naturalHeight}
                        zones={zones}
                        selectedZoneId={selectedZoneId}
                        drawingMode={drawingMode}
                        onZoneCreated={onZoneCreated}
                        onZoneSelected={onZoneSelected}
                        onZoneUpdated={onZoneUpdated}
                    />
                </div>
            )}
        </div>
    );
}
