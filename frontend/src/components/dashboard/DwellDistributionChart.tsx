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
    Cell
} from "recharts";
import { DwellEvent } from "@/utils/types";

interface DwellDistributionChartProps {
    data: DwellEvent[];
}

// Define dwell time buckets
const DWELL_BUCKETS = [
    { label: "0-5s", min: 0, max: 5, color: "#22c55e" },      // Quick pass
    { label: "5-15s", min: 5, max: 15, color: "#84cc16" },    // Brief stop
    { label: "15-30s", min: 15, max: 30, color: "#eab308" },  // Moderate interest
    { label: "30-60s", min: 30, max: 60, color: "#f97316" },  // High interest
    { label: "60s+", min: 60, max: Infinity, color: "#ef4444" }, // Extended stay
];

export default function DwellDistributionChart({ data }: DwellDistributionChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Count events in each bucket
        const bucketCounts = DWELL_BUCKETS.map(bucket => ({
            ...bucket,
            count: 0,
            percentage: 0
        }));

        data.forEach(event => {
            const duration = event.duration;
            for (let i = 0; i < bucketCounts.length; i++) {
                if (duration >= bucketCounts[i].min && duration < bucketCounts[i].max) {
                    bucketCounts[i].count++;
                    break;
                }
            }
        });

        // Calculate percentages
        const total = data.length;
        bucketCounts.forEach(bucket => {
            bucket.percentage = total > 0 ? Math.round((bucket.count / total) * 100) : 0;
        });

        return bucketCounts;
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-secondary-text text-sm">
                No dwell data available
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
                        dataKey="label"
                        stroke="#666"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ dy: 5 }}
                    />
                    <YAxis
                        stroke="#666"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#666' }}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#999', marginBottom: '4px' }}
                        formatter={((value: number | undefined, _name: string | undefined, props: { payload: { percentage: number; label: string } }) => {
                            return [`${value ?? 0} visitors (${props.payload.percentage}%)`, props.payload.label];
                        }) as never}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
