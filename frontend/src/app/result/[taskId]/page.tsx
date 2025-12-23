"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { LoadingOverlay } from "@/components/layout";
import { Download, FileJson, Table, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    const totalCount = job.detectionData?.length
        ? job.detectionData[job.detectionData.length - 1]?.count || 0
        : 0;

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
        <main className="flex-1 flex flex-col p-4 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 hover:bg-btn-hover rounded-md transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-text-color" />
                    </Link>
                    <h1 className="text-xl font-semibold text-text-color">
                        {job.name || job.filename || "Results"}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <a
                        href={api.getExportCsvUrl(taskId)}
                        className="btn-secondary flex items-center gap-2"
                        download
                    >
                        <Table className="w-4 h-4" />
                        CSV
                    </a>
                    <a
                        href={api.getExportJsonUrl(taskId)}
                        className="btn-secondary flex items-center gap-2"
                        download
                    >
                        <FileJson className="w-4 h-4" />
                        JSON
                    </a>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Video Player */}
                <div className="flex-1">
                    <div className="bg-primary-color border border-primary-border rounded-xl overflow-hidden">
                        <video
                            src={videoUrl}
                            controls
                            className="w-full max-h-[60vh] object-contain"
                            autoPlay
                            loop
                        />
                    </div>

                    {/* Processing Info */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-btn-bg border border-btn-border rounded-lg p-3">
                            <p className="text-xs text-secondary-text">Processing Time</p>
                            <p className="text-lg font-semibold text-text-color">
                                {job.processTime?.toFixed(1)}s
                            </p>
                        </div>
                        <div className="bg-btn-bg border border-btn-border rounded-lg p-3">
                            <p className="text-xs text-secondary-text">Resolution</p>
                            <p className="text-lg font-semibold text-text-color">
                                {job.frameWidth}×{job.frameHeight}
                            </p>
                        </div>
                        <div className="bg-btn-bg border border-btn-border rounded-lg p-3">
                            <p className="text-xs text-secondary-text">Model</p>
                            <p className="text-lg font-semibold text-text-color">
                                {job.model?.replace(".pt", "")}
                            </p>
                        </div>
                        <div className="bg-btn-bg border border-btn-border rounded-lg p-3">
                            <p className="text-xs text-secondary-text">Confidence</p>
                            <p className="text-lg font-semibold text-text-color">
                                {job.confidence}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Sidebar */}
                <div className="w-full lg:w-80">
                    <div className="bg-primary-color border border-primary-border rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-text-color mb-4">
                            Detection Summary
                        </h2>

                        {/* Zone Stats */}
                        <div className="space-y-3">
                            {job.zones?.map((zone) => {
                                const stats = zoneStats[zone.id] || { total: 0, peak: 0 };
                                const isLine = zone.points?.length === 2;
                                const lineCrossing = job.lineCrossingData?.[zone.id];

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
                                            <span className="text-xs text-secondary-text ml-auto">
                                                {isLine ? "Line" : "Polygon"}
                                            </span>
                                        </div>

                                        {isLine && lineCrossing ? (
                                            <div className="grid grid-cols-2 gap-2 text-center">
                                                <div>
                                                    <p className="text-2xl font-bold text-green-400">
                                                        {lineCrossing.in}
                                                    </p>
                                                    <p className="text-xs text-secondary-text">IN</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-red-400">
                                                        {lineCrossing.out}
                                                    </p>
                                                    <p className="text-xs text-secondary-text">OUT</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 text-center">
                                                <div>
                                                    <p className="text-2xl font-bold text-text-color">
                                                        {stats.total}
                                                    </p>
                                                    <p className="text-xs text-secondary-text">Total</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-text-color">
                                                        {stats.peak}
                                                    </p>
                                                    <p className="text-xs text-secondary-text">Peak</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Dwell Time Summary */}
                        {job.dwellData && job.dwellData.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-semibold text-text-color mb-2">
                                    Dwell Time Analysis
                                </h3>
                                <div className="bg-btn-bg border border-btn-border rounded-lg p-3">
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-text-color">
                                                {(
                                                    job.dwellData.reduce((sum, d) => sum + d.duration, 0) /
                                                    job.dwellData.length
                                                ).toFixed(1)}
                                                s
                                            </p>
                                            <p className="text-xs text-secondary-text">Avg Dwell</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-text-color">
                                                {Math.max(...job.dwellData.map((d) => d.duration)).toFixed(
                                                    1
                                                )}
                                                s
                                            </p>
                                            <p className="text-xs text-secondary-text">Max Dwell</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 space-y-2">
                            <button
                                onClick={() => router.push(`/zone/${taskId}`)}
                                className="w-full btn-secondary"
                            >
                                Edit Zones
                            </button>
                            <a
                                href={videoUrl}
                                download={`zonenet_output_${taskId}.mp4`}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download Video
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
