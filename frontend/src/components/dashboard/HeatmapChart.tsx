"use client";

import { useEffect, useRef } from "react";
import type { Zone } from "@/utils/types";

interface HeatmapChartProps {
    data: number[][] | null;
    zones?: Zone[];
    overlay?: boolean;
}

// Color gradient for heatmap: blue (cold) -> cyan -> green -> yellow -> red (hot)
function getHeatmapColor(value: number, maxValue: number): [number, number, number, number] {
    if (maxValue === 0) return [0, 0, 0, 0];

    const normalized = Math.min(value / maxValue, 1);

    // Multi-stop gradient
    let r = 0, g = 0, b = 0;

    if (normalized < 0.25) {
        // Blue to Cyan
        const t = normalized / 0.25;
        r = 0;
        g = Math.floor(255 * t);
        b = 255;
    } else if (normalized < 0.5) {
        // Cyan to Green
        const t = (normalized - 0.25) / 0.25;
        r = 0;
        g = 255;
        b = Math.floor(255 * (1 - t));
    } else if (normalized < 0.75) {
        // Green to Yellow
        const t = (normalized - 0.5) / 0.25;
        r = Math.floor(255 * t);
        g = 255;
        b = 0;
    } else {
        // Yellow to Red
        const t = (normalized - 0.75) / 0.25;
        r = 255;
        g = Math.floor(255 * (1 - t));
        b = 0;
    }

    // Alpha based on value (more opaque for higher values)
    const alpha = Math.floor(50 + normalized * 180);

    return [r, g, b, alpha];
}

export default function HeatmapChart({ data, zones, overlay = false }: HeatmapChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !data) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Get container dimensions
        const rect = container.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        if (!overlay) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.clearRect(0, 0, width, height);
        }

        const gridHeight = data.length;
        const gridWidth = data[0]?.length || 0;
        if (gridWidth === 0 || gridHeight === 0) return;

        // Find max value for normalization
        let maxValue = 0;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                if (data[y][x] > maxValue) maxValue = data[y][x];
            }
        }

        // Calculate cell size
        const cellWidth = width / gridWidth;
        const cellHeight = height / gridHeight;

        // Create temporary canvas for smoothing
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = gridWidth;
        tempCanvas.height = gridHeight;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        // Draw raw heatmap to temp canvas
        const imageData = tempCtx.createImageData(gridWidth, gridHeight);

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const value = data[y][x];
                const [r, g, b, a] = getHeatmapColor(value, maxValue);
                const idx = (y * gridWidth + x) * 4;
                imageData.data[idx] = r;
                imageData.data[idx + 1] = g;
                imageData.data[idx + 2] = b;
                imageData.data[idx + 3] = a;
            }
        }
        tempCtx.putImageData(imageData, 0, 0);

        // Draw scaled and smoothed heatmap
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(tempCanvas, 0, 0, width, height);

        // Apply Gaussian-like blur effect by drawing multiple times with offset
        ctx.globalAlpha = 0.3;
        for (let i = 1; i <= 3; i++) {
            ctx.drawImage(tempCanvas, -i, 0, width + i * 2, height);
            ctx.drawImage(tempCanvas, 0, -i, width, height + i * 2);
        }
        ctx.globalAlpha = 1;

        // Draw zones overlay if provided
        if (zones && zones.length > 0) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            zones.forEach((zone) => {
                if (!zone.points || zone.points.length < 2) return;

                ctx.beginPath();

                // Normalize zone points to canvas dimensions
                // Assuming zone points are in original video coordinates (0-1 normalized or absolute)
                // If the zone point is > 1 it is likely absolute pixel coordinates.
                // We need to know the video source dimensions to normalize correctly if they are absolute.
                // For now, using simplistic heuristic if values > 1.
                const scaledPoints = zone.points.map((p) => ({
                    x: (p.x / (zones[0]?.points?.[0]?.x > 1 ? 1920 : 1)) * width,
                    y: (p.y / (zones[0]?.points?.[0]?.y > 1 ? 1080 : 1)) * height,
                }));

                if (zone.points.length === 2) {
                    // Line zone
                    ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
                    ctx.lineTo(scaledPoints[1].x, scaledPoints[1].y);
                } else {
                    // Polygon zone
                    ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
                    for (let i = 1; i < scaledPoints.length; i++) {
                        ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
                    }
                    ctx.closePath();
                }
                ctx.stroke();
            });
            ctx.setLineDash([]);
        }

        // Draw legend (only if not overlay to avoid clutter, or maybe smaller?)
        // For overlay, we skip the legend to keep the video clear.
        if (!overlay) {
            const legendWidth = 20;
            const legendHeight = height * 0.6;
            const legendX = width - legendWidth - 20;
            const legendY = (height - legendHeight) / 2;

            // Legend gradient
            const gradient = ctx.createLinearGradient(legendX, legendY + legendHeight, legendX, legendY);
            gradient.addColorStop(0, "rgba(0, 0, 255, 0.8)");
            gradient.addColorStop(0.25, "rgba(0, 255, 255, 0.8)");
            gradient.addColorStop(0.5, "rgba(0, 255, 0, 0.8)");
            gradient.addColorStop(0.75, "rgba(255, 255, 0, 0.8)");
            gradient.addColorStop(1, "rgba(255, 0, 0, 0.8)");

            ctx.fillStyle = gradient;
            ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

            // Legend border
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

            // Legend labels
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.font = "10px system-ui";
            ctx.textAlign = "right";
            ctx.fillText("High", legendX - 5, legendY + 10);
            ctx.fillText("Low", legendX - 5, legendY + legendHeight - 2);
        }

    }, [data, zones]);

    if (!data && !overlay) {
        return (
            <div className="w-full h-full flex items-center justify-center text-secondary-text">
                <p>No heatmap data available. Process a video to generate activity heatmap.</p>
            </div>
        );
    } else if (!data) {
        return null;
    }

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <canvas
                ref={canvasRef}
                className="w-full h-full rounded-lg"
            />
            <div className={`absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white/80 ${overlay ? 'hidden' : ''}`}>
                Activity Heatmap
            </div>
        </div>
    );
}
