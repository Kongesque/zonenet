"use client";

import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from "recharts";
import { DetectionEvent, DwellEvent, Zone } from "@/utils/types";

interface ZoneComparisonChartProps {
    detectionData: DetectionEvent[];
    dwellData: DwellEvent[];
    zones: Zone[];
}

export default function ZoneComparisonChart({ detectionData, dwellData, zones }: ZoneComparisonChartProps) {
    const chartData = useMemo(() => {
        if (!zones || zones.length === 0) return [];

        return zones.map(zone => {
            // Calculate peak from detection data
            let peak = 0;
            detectionData?.forEach(event => {
                if (event.zone_id === zone.id && event.count > peak) {
                    peak = event.count;
                }
            });

            // Get last count as total visitors
            const zoneEvents = detectionData?.filter(e => e.zone_id === zone.id) || [];
            const lastEvent = zoneEvents[zoneEvents.length - 1];
            const totalVisitors = lastEvent?.count || 0;

            // Calculate avg dwell from dwell data
            const zoneDwellEvents = dwellData?.filter(d => d.zone_id === zone.id) || [];
            const totalDwell = zoneDwellEvents.reduce((acc, curr) => acc + curr.duration, 0);
            const avgDwell = zoneDwellEvents.length > 0 ? Number((totalDwell / zoneDwellEvents.length).toFixed(1)) : 0;

            return {
                name: zone.label.length > 12 ? zone.label.substring(0, 12) + '...' : zone.label,
                fullName: zone.label,
                id: zone.id,
                visitors: totalVisitors,
                peak: peak,
                avgDwell: avgDwell,
                color: zone.color
            };
        });
    }, [detectionData, dwellData, zones]);

    if (!zones || zones.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-secondary-text text-sm">
                No zones defined
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 20,
                        right: 10,
                        left: -10,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#666"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tick={{ dy: 5 }}
                    />
                    <YAxis
                        stroke="#666"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#999', marginBottom: '4px' }}
                        formatter={((value: number | undefined, name: string | undefined) => {
                            if (name === 'Dwell (s)') return [`${value ?? 0}s`, 'Avg Dwell'];
                            if (name === 'Visitors') return [`${value ?? 0}`, 'Total Visitors'];
                            if (name === 'Peak') return [`${value ?? 0}`, 'Peak Count'];
                            return [value, name];
                        }) as never}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    />
                    <Legend
                        iconType="circle"
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ fontSize: '10px', paddingBottom: '8px', top: 0, right: 0 }}
                    />
                    <Bar dataKey="visitors" name="Visitors" fill="#2dd4bf" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="peak" name="Peak" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="avgDwell" name="Dwell (s)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
