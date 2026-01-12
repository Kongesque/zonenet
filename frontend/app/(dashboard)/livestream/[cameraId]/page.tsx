"use client";

import { useRef } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";

export default function LivestreamDetailPage() {
    const videoRef = useRef<HTMLVideoElement>(null);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex flex-1 flex-row gap-4">
                <div className="w-full max-w-4xl flex flex-col gap-4">
                    <AspectRatio ratio={16 / 9} className="rounded-lg overflow-hidden bg-black max-h-[70vh]">
                        <video
                            ref={videoRef}
                            src="/preview.mp4"
                            className="w-full h-full object-contain"
                            controls
                            loop
                        />
                    </AspectRatio>
                    <div className="flex flex-1 flex-row gap-4">
                        <div className="bg-muted rounded-lg flex items-center justify-center w-full"> Card 1</div>
                    </div>
                </div>
                <div className="grid gap-4 flex-1 grid-rows-[auto_1fr]">
                    <div className="grid grid-cols-2 grid-rows-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-card text-card-foreground rounded-lg border flex flex-col justify-between p-4 h-32">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <span className="text-sm font-medium">Total Event</span>
                                    <Badge variant="default" className="text-[10px] bg-green-100 text-green-500">
                                        +12.5%
                                    </Badge>
                                </div>
                                <div className="text-2xl font-bold">2,000</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Dragging up this month
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-muted rounded-lg flex items-center justify-center h-full">
                        Card 4
                    </div>
                </div>
            </div>
        </div>
    );
}
