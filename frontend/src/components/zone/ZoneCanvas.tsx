"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Zone, Point } from "@/utils/types";

interface ZoneCanvasProps {
    frameUrl: string;
    zones: Zone[];
    activeZoneId: string | null;
    maxPoints: number;
    onZonesChange: (zones: Zone[]) => void;
    onPointAdded: (zoneId: string, point: Point) => void;
    onFrameLoaded: (width: number, height: number) => void;
    onZoneSelect: (zoneId: string) => void;
    onAutoCreateZone: (firstPoint: Point) => void;
}

function getColorFromClassId(classId: number): string {
    const hue = ((classId * 137.508) % 360);
    return `hsl(${hue}, 85%, 55%)`;
}

export function ZoneCanvas({
    frameUrl,
    zones,
    activeZoneId,
    maxPoints,
    onZonesChange,
    onPointAdded,
    onFrameLoaded,
    onZoneSelect,
    onAutoCreateZone,
}: ZoneCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [scale, setScale] = useState(1);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    // Dragging state
    const [draggedPoint, setDraggedPoint] = useState<{ zoneId: string; index: number } | null>(null);
    const [draggedZone, setDraggedZone] = useState<{ zoneId: string; offset: Point } | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<{ zoneId: string; index: number } | null>(null);
    const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

    // Load the frame image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imageRef.current = img;
            setImageLoaded(true);
            onFrameLoaded(img.width, img.height);
        };
        img.src = frameUrl;
    }, [frameUrl, onFrameLoaded]);

    // Calculate scale and offset to fit canvas in container
    const updateCanvasSize = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const img = imageRef.current;

        if (!canvas || !container || !img) return;

        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width - 32;
        const containerHeight = containerRect.height - 32;

        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const newScale = Math.min(scaleX, scaleY, 1);

        canvas.width = img.width * newScale;
        canvas.height = img.height * newScale;

        setScale(newScale);
    }, []);

    useEffect(() => {
        if (imageLoaded) {
            updateCanvasSize();
            window.addEventListener("resize", updateCanvasSize);
            return () => window.removeEventListener("resize", updateCanvasSize);
        }
    }, [imageLoaded, updateCanvasSize]);

    // Helpers for hit detection
    const getPointAt = useCallback((x: number, y: number): { zoneId: string; index: number } | null => {
        const threshold = 10 / scale; // 10 pixels hit area
        for (const zone of zones) {
            for (let i = 0; i < zone.points.length; i++) {
                const p = zone.points[i];
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist <= threshold) return { zoneId: zone.id, index: i };
            }
        }
        return null;
    }, [zones, scale]);

    const isPointInPolygon = (p: Point, points: Point[]): boolean => {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            const intersect = ((yi > p.y) !== (yj > p.y))
                && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const getZoneAt = useCallback((x: number, y: number): string | null => {
        // Search in reverse to hit the topmost zone first
        for (let i = zones.length - 1; i >= 0; i--) {
            const zone = zones[i];
            if (zone.points.length >= 3 && isPointInPolygon({ x, y }, zone.points)) {
                return zone.id;
            }
        }
        return null;
    }, [zones]);

    // Draw canvas content with preview line
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const img = imageRef.current;

        if (!canvas || !ctx || !img || !imageLoaded) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw all zones
        zones.forEach((zone) => {
            if (zone.points.length === 0) return;

            const isActive = zone.id === activeZoneId;
            const isHovered = zone.id === hoveredZoneId;
            const color = getColorFromClassId(zone.classId);

            // Scale points
            const scaledPoints = zone.points.map((p) => ({
                x: p.x * scale,
                y: p.y * scale,
            }));

            // Quality settings
            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            // Draw lines between points
            ctx.strokeStyle = color;
            ctx.lineWidth = isActive ? 5 : 3;
            ctx.setLineDash([]);

            // Glow/Shadow effect for active or hovered
            if (isActive || isHovered) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);

            for (let i = 1; i < scaledPoints.length; i++) {
                ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
            }

            // Close polygon if it has 3+ points and is not actively being drawn
            // (active zone stays open so user can add more points)
            if (zone.points.length >= 3 && !isActive) {
                ctx.closePath();
            }
            ctx.stroke();

            // Fill with semi-transparent color
            if (zone.points.length >= 3) {
                const alpha = (isActive || isHovered) ? 0.25 : 0.1;
                ctx.fillStyle = color.replace(")", `, ${alpha})`).replace("hsl", "hsla");
                ctx.fill();
            }

            // Reset shadow for points
            ctx.shadowBlur = 0;

            // Draw points
            scaledPoints.forEach((point, idx) => {
                const isPointHovered = hoveredPoint?.zoneId === zone.id && hoveredPoint?.index === idx;
                const isPointDragged = draggedPoint?.zoneId === zone.id && draggedPoint?.index === idx;

                ctx.beginPath();
                const radius = (isActive || isPointHovered || isPointDragged) ? 8 : 6;
                ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);

                // Point fill
                ctx.fillStyle = color;
                ctx.fill();

                // Point border
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = (isPointHovered || isPointDragged) ? 3 : 2;
                ctx.stroke();

                // Hover halo
                if (isPointHovered || isPointDragged) {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, radius + 4, 0, Math.PI * 2);
                    ctx.strokeStyle = color.replace(")", ", 0.4)").replace("hsl", "hsla");
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Draw point number
                ctx.fillStyle = "#fff";
                ctx.font = `bold ${radius > 6 ? 11 : 9}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(idx + 1), point.x, point.y);
            });

            // Draw zone label
            if (scaledPoints.length > 0) {
                const labelPoint = scaledPoints[0];
                ctx.fillStyle = color;
                ctx.font = "bold 13px sans-serif";
                ctx.textAlign = "left";

                // Label background
                const labelText = zone.label;
                const metrics = ctx.measureText(labelText);
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                ctx.fillRect(labelPoint.x + 12, labelPoint.y - 22, metrics.width + 8, 20);

                ctx.fillStyle = color;
                ctx.fillText(labelText, labelPoint.x + 16, labelPoint.y - 8);
            }
        });

        // Draw preview line following mouse for active zone
        const activeZone = zones.find((z) => z.id === activeZoneId);
        if (activeZone && activeZone.points.length > 0 && activeZone.points.length < maxPoints && mousePos && !draggedPoint && !draggedZone) {
            const color = getColorFromClassId(activeZone.classId);
            const scaledPoints = activeZone.points.map((p) => ({
                x: p.x * scale,
                y: p.y * scale,
            }));

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            ctx.beginPath();
            ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
            for (let i = 1; i < scaledPoints.length; i++) {
                ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
            }
            ctx.lineTo(mousePos.x * scale, mousePos.y * scale);
            // Don't close for preview unless it's the last point
            if (activeZone.points.length === maxPoints - 1) {
                ctx.closePath();
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }, [zones, activeZoneId, scale, imageLoaded, mousePos, maxPoints, hoveredPoint, draggedPoint, hoveredZoneId, draggedZone]);

    // Redraw on changes
    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // Handle canvas mouse down
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        // 1. Check if clicking on a point (drag point)
        const pointHit = getPointAt(x, y);
        if (pointHit) {
            // Check if clicking on first point of active zone with 3+ points (close polygon)
            if (activeZoneId && pointHit.zoneId === activeZoneId && pointHit.index === 0) {
                const activeZone = zones.find(z => z.id === activeZoneId);
                if (activeZone && activeZone.points.length >= 3) {
                    // Close the polygon by moving to a new zone (deselect current)
                    onAutoCreateZone({ x: -1, y: -1 }); // Signal to create empty new zone
                    return;
                }
            }
            setDraggedPoint(pointHit);
            return;
        }

        // 2. Check if clicking inside a zone
        const zoneId = getZoneAt(x, y);
        if (zoneId) {
            // If clicking on a different zone, SELECT it (new behavior)
            if (activeZoneId !== zoneId) {
                onZoneSelect(zoneId);
                return;
            }
            // If clicking on the already active zone, allow dragging
            const zone = zones.find(z => z.id === zoneId);
            if (zone) {
                setDraggedZone({
                    zoneId,
                    offset: { x, y }
                });
            }
            return;
        }

        // 3. Clicking on empty area
        const newPoint = { x: Math.round(x), y: Math.round(y) };

        if (activeZoneId) {
            const activeZone = zones.find((z) => z.id === activeZoneId);
            if (activeZone && activeZone.points.length < maxPoints) {
                // Add point to active zone
                onPointAdded(activeZoneId, newPoint);
            } else {
                // Active zone is complete, auto-create new zone
                onAutoCreateZone(newPoint);
            }
        } else {
            // No active zone, auto-create new zone with first point
            onAutoCreateZone(newPoint);
        }
    };

    // Handle double-click to close polygon (deselect current zone)
    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!activeZoneId) return;

        const activeZone = zones.find(z => z.id === activeZoneId);
        if (activeZone && activeZone.points.length >= 2) {
            // Zone has enough points, close it by auto-creating a new zone
            onAutoCreateZone({ x: -1, y: -1 }); // Signal to create empty new zone
        }
    };

    // Handle mouse move
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setMousePos({ x, y });

        if (draggedPoint) {
            const updatedZones = zones.map(z => {
                if (z.id === draggedPoint.zoneId) {
                    const newPoints = [...z.points];
                    newPoints[draggedPoint.index] = { x: Math.round(x), y: Math.round(y) };
                    return { ...z, points: newPoints };
                }
                return z;
            });
            onZonesChange(updatedZones);
        } else if (draggedZone) {
            const dx = x - draggedZone.offset.x;
            const dy = y - draggedZone.offset.y;

            const updatedZones = zones.map(z => {
                if (z.id === draggedZone.zoneId) {
                    const newPoints = z.points.map(p => ({
                        x: Math.round(p.x + dx),
                        y: Math.round(p.y + dy)
                    }));
                    return { ...z, points: newPoints };
                }
                return z;
            });
            setDraggedZone({ ...draggedZone, offset: { x, y } });
            onZonesChange(updatedZones);
        } else {
            // Hover detection
            setHoveredPoint(getPointAt(x, y));
            setHoveredZoneId(getZoneAt(x, y));
        }
    };

    // Handle mouse up
    const handleMouseUp = () => {
        setDraggedPoint(null);
        setDraggedZone(null);
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
        setMousePos(null);
        setDraggedPoint(null);
        setDraggedZone(null);
        setHoveredPoint(null);
        setHoveredZoneId(null);
    };

    // Handle right-click to remove last point
    const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!activeZoneId) return;

        const updatedZones = zones.map((zone) => {
            if (zone.id === activeZoneId && zone.points.length > 0) {
                return {
                    ...zone,
                    points: zone.points.slice(0, -1),
                };
            }
            return zone;
        });

        onZonesChange(updatedZones);
    };

    if (!imageLoaded) {
        return (
            <div className="flex-1 flex items-center justify-center bg-primary-color border border-primary-border rounded-xl">
                <div className="text-secondary-text">Loading frame...</div>
            </div>
        );
    }

    // Dynamic cursor
    const getCursor = () => {
        if (draggedPoint) return "grabbing";
        if (draggedZone) return "move";
        if (hoveredPoint) return "grab";
        if (hoveredZoneId) return "move";
        if (activeZoneId) return "crosshair";
        return "default";
    };

    return (
        <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center p-4 bg-primary-color border border-primary-border rounded-xl overflow-hidden"
        >
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                className="rounded-lg shadow-2xl transition-shadow duration-300"
                style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    cursor: getCursor()
                }}
            />
        </div>
    );
}
