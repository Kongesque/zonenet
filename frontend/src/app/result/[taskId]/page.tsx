"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { LoadingOverlay } from "@/components/layout";
import { Download, FileJson, Table, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BentoGrid, BentoCard } from "@/components/dashboard/BentoGrid";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";

export default function ResultPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.taskId as string;

    const { data: job, isLoading } = useQuery({
        queryKey: ["job", taskId],
        queryFn: () => api.getJob(taskId),
        enabled: !!taskId,
        refetchInterval: (query) => {
            // Poll while processing
            if (query.state.data?.status === "processing") {
                return 1000;
            }
            return false;
        },
    });

    if (isLoading) {
        return <LoadingOverlay message="Loading results..." />;
    }

    if (!job) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-secondary-text">Job not found</p>
            </div>
        );
    }

    if (job.status === "processing") {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                                className="stroke-gray-400/20"
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                strokeWidth="6"
                            />
                            <circle
                                className="stroke-text-color transition-all duration-300"
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray="264"
                                strokeDashoffset={264 - (job.progress / 100) * 264}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-medium text-text-color tabular-nums">
                                {job.progress}
                            </span>
                        </div>
                    </div>
                    <p className="text-lg font-medium text-text-color">
                        Processing<span className="animate-pulse">...</span>
                    </p>
                </div>
            </div>
        );
    }

    const videoUrl = api.getOutputVideoUrl(taskId);

    // Calculate zone statistics
    const zoneStats: Record<string, { total: number; peak: number }> = {};
    job.detectionData?.forEach((event) => {
        const zoneId = event.zone_id;
        if (!zoneStats[zoneId]) {
            zoneStats[zoneId] = { total: 0, peak: 0 };
        }
        zoneStats[zoneId].total = event.count;
        if (event.count > zoneStats[zoneId].peak) {
            zoneStats[zoneId].peak = event.count;
        }
    });

    return (
        <main className="h-full w-full overflow-hidden bg-black text-white p-4">
            <BentoGrid className="grid-cols-12 grid-rows-12">
                {/* Main Video Tile - Spans 8 cols, 8 rows (Matches screen aspect ratio 16:9) */}
                <BentoCard
                    className="col-span-8 row-span-8 p-0"
                    title={job.name || "Video Feed"}
                    icon={<div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    noScroll
                    noSpacer
                >
                    <div className="relative w-full h-full bg-black flex items-center justify-center group">
                        <video
                            src={videoUrl}
                            controls
                            className="w-full h-full object-contain"
                            autoPlay
                            loop
                            muted
                        />
                        {/* Floating Overlay for FPS/Res */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-white/80">
                                {job.frameWidth}x{job.frameHeight}
                            </div>
                            <div className="px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-white/80">
                                {job.processTime?.toFixed(1)}s
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* Zone Statistics - Spans 4 cols, 8 rows (Right Sidebar) */}
                <BentoCard className="col-span-4 row-span-8" title="Zone Analysis">
                    <div className="space-y-3 p-4">
                        {job.zones?.map((zone) => {
                            const stats = zoneStats[zone.id] || { total: 0, peak: 0 };
                            const isLine = zone.points?.length === 2;
                            const lineCrossing = job.lineCrossingData?.[zone.id];

                            return (
                                <div
                                    key={zone.id}
                                    className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-2 h-2 rounded-full shadow-[0_0_8px]"
                                            style={{
                                                backgroundColor: `rgb(${zone.color?.join(",")})`,
                                                boxShadow: `0 0 10px rgb(${zone.color?.join(",")})`
                                            }}
                                        />
                                        <span className="text-sm font-medium text-white/90 truncate">
                                            {zone.label}
                                        </span>
                                    </div>

                                    {isLine && lineCrossing ? (
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-black/20 rounded p-1">
                                                <p className="text-lg font-bold text-green-400 leading-none">
                                                    {lineCrossing.in}
                                                </p>
                                                <p className="text-[10px] text-white/50 uppercase tracking-widest">IN</p>
                                            </div>
                                            <div className="bg-black/20 rounded p-1">
                                                <p className="text-lg font-bold text-red-400 leading-none">
                                                    {lineCrossing.out}
                                                </p>
                                                <p className="text-[10px] text-white/50 uppercase tracking-widest">OUT</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-black/20 rounded p-1">
                                                <p className="text-lg font-bold text-white leading-none">
                                                    {stats.total}
                                                </p>
                                                <p className="text-[10px] text-white/50 uppercase tracking-widest">Total</p>
                                            </div>
                                            <div className="bg-black/20 rounded p-1">
                                                <p className="text-lg font-bold text-white leading-none">
                                                    {stats.peak}
                                                </p>
                                                <p className="text-[10px] text-white/50 uppercase tracking-widest">Peak</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </BentoCard>

                {/* Activity Timeline - Spans 8 cols, 4 rows (Bottom Left) */}
                <BentoCard className="col-span-8 row-span-4" title="Activity Timeline">
                    <div className="h-full w-full p-4">
                        <ActivityTimeline
                            data={job.detectionData}
                            zones={job.zones}
                            duration={job.processTime} // Approx total duration
                        />
                    </div>
                </BentoCard>

                {/* Control Panel / Actions - Spans 4 cols, 4 rows (Bottom Right) */}
                <BentoCard className="col-span-4 row-span-4" title="Actions">
                    <div className="flex flex-col gap-3 h-full justify-center p-4">
                        <div className="grid grid-cols-2 gap-2 text-center mb-2">
                            <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-[10px] text-white/50 uppercase tracking-widest">Model</p>
                                <p className="text-sm font-semibold">{job.model?.replace(".pt", "")}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-[10px] text-white/50 uppercase tracking-widest">Confidence</p>
                                <p className="text-sm font-semibold">{job.confidence}%</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <a
                                href={api.getExportCsvUrl(taskId)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-all"
                                download
                            >
                                <Table className="w-3 h-3" /> CSV
                            </a>
                            <a
                                href={api.getExportJsonUrl(taskId)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-all"
                                download
                            >
                                <FileJson className="w-3 h-3" /> JSON
                            </a>
                        </div>

                        <div className="h-px bg-white/10 my-1" />

                        <button
                            onClick={() => router.push(`/zone/${taskId}`)}
                            className="w-full py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-sm font-medium transition-all"
                        >
                            Edit Zones
                        </button>
                        <a
                            href={videoUrl}
                            download={`zonenet_output_${taskId}.mp4`}
                            className="w-full py-2 flex items-center justify-center gap-2 rounded-lg bg-white text-black hover:bg-gray-200 text-sm font-bold transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </a>

                        <Link
                            href="/"
                            className="text-xs text-center text-white/30 hover:text-white/60 mt-auto"
                        >
                            Back to Home
                        </Link>
                    </div>
                </BentoCard>
            </BentoGrid>
        </main>
    );
}
