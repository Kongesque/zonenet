"use client";

import { PageTitle2 } from "@/components/page-title";
import { Card } from "@/components/ui/card";
import { VideoPreview } from "@/components/create/video-preview";
import { ToolsPanel, YoloModel } from "@/components/create/tools-panel";
import { Point, Zone } from "@/components/create/drawing-canvas";
import { useState } from "react";

export default function CreateZonePage({ params }: { params: { taskId: string } }) {
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [drawingMode, setDrawingMode] = useState<'polygon' | 'line'>('polygon');
    const [fullFrameClasses, setFullFrameClasses] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<YoloModel>("yolo11n");

    const handleZoneCreated = (points: Point[]) => {
        const newZone: Zone = {
            id: crypto.randomUUID(), // Use native crypto UUID
            points: points,
            type: drawingMode,
            name: `${drawingMode === 'line' ? 'Line' : 'Zone'} ${zones.length + 1}`,
            classes: [], // Empty means detect all classes
            color: "#fbbd05"
        };
        setZones([...zones, newZone]);
        setSelectedZoneId(newZone.id); // Auto-select new zone
    };

    const handleZoneRenamed = (id: string, name: string) => {
        setZones(zones.map(z => z.id === id ? { ...z, name: name } : z));
    };

    const handleZoneClassesChanged = (id: string, classes: string[]) => {
        setZones(zones.map(z => z.id === id ? { ...z, classes: classes } : z));
    };

    const handleZoneSelected = (id: string | null) => {
        setSelectedZoneId(id);
    };

    const handleZoneUpdated = (id: string, newPoints: Point[]) => {
        setZones(zones.map(z => z.id === id ? { ...z, points: newPoints } : z));
    };

    const handleDeleteZone = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setZones(zones.filter(z => z.id !== id));
        if (selectedZoneId === id) {
            setSelectedZoneId(null);
        }
    };

    const handleProcess = () => {
        console.log("Processing Zones:", zones);
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 h-[calc(100vh-4rem)]">

            {/* Main Content */}
            <div className="flex flex-1 gap-4 min-h-0">
                {/* Left: Video Canvas */}
                <Card className="flex-[3] flex flex-col p-0">
                    <VideoPreview
                        zones={zones}
                        selectedZoneId={selectedZoneId}
                        drawingMode={drawingMode}
                        onZoneCreated={handleZoneCreated}
                        onZoneSelected={handleZoneSelected}
                        onZoneUpdated={handleZoneUpdated}
                    />
                </Card>

                {/* Right: Tools */}
                <ToolsPanel
                    zones={zones}
                    selectedZoneId={selectedZoneId}
                    drawingMode={drawingMode}
                    fullFrameClasses={fullFrameClasses}
                    selectedModel={selectedModel}
                    onDrawingModeChange={setDrawingMode}
                    onZoneSelected={handleZoneSelected}
                    onDeleteZone={handleDeleteZone}
                    onProcess={handleProcess}
                    onZoneRenamed={handleZoneRenamed}
                    onZoneClassesChanged={handleZoneClassesChanged}
                    onFullFrameClassesChanged={setFullFrameClasses}
                    onModelChange={setSelectedModel}
                />
            </div>
        </div>
    )
}
