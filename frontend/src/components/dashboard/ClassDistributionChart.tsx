"use client";

import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { DetectionEvent, Zone, COCO_CLASSES } from "@/utils/types";

interface ClassDistributionChartProps {
    data: DetectionEvent[];
    zones: Zone[];
}

export default function ClassDistributionChart({ data, zones }: ClassDistributionChartProps) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const classCounts: Record<string, number> = {};

        data.forEach(event => {
            const className = COCO_CLASSES[event.class_id] || `Class ${event.class_id}`;
            // Use title case for display
            const displayName = className.charAt(0).toUpperCase() + className.slice(1);
            classCounts[displayName] = (classCounts[displayName] || 0) + event.count;
        });

        // Convert to array and sort by count descending
        return Object.entries(classCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 classes only to avoid clutter

    }, [data]);

    // Generate colors for classes (using a different palette than zones to differentiate)
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (!data || data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-secondary-text text-sm">
                No class data available
            </div>
        );
    }

    return (
        <div className="h-full w-full min-h-[150px] overflow-hidden flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: '11px', right: 0 }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
