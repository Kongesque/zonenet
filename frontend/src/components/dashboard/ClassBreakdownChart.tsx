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
import { Zone } from "@/utils/types";
import { COCO_CLASSES } from "@/utils/types";

interface ClassBreakdownChartProps {
    zones: Zone[];
}

// Color palette for different classes
const CLASS_COLORS: Record<number, string> = {
    0: "#60a5fa",  // person - blue
    1: "#22c55e",  // bicycle - green
    2: "#f97316",  // car - orange
    3: "#ef4444",  // motorcycle - red
    5: "#a855f7",  // bus - purple
    7: "#eab308",  // truck - yellow
    16: "#ec4899", // dog - pink
    17: "#14b8a6", // horse - teal
};

const DEFAULT_COLOR = "#6b7280";

export default function ClassBreakdownChart({ zones }: ClassBreakdownChartProps) {
    const chartData = useMemo(() => {
        if (!zones || zones.length === 0) return [];

        // Count zones by class ID
        const classCounts: Record<number, number> = {};

        zones.forEach(zone => {
            const classId = zone.classId;
            if (!classCounts[classId]) {
                classCounts[classId] = 0;
            }
            classCounts[classId]++;
        });

        // Convert to chart data
        return Object.entries(classCounts).map(([classId, count]) => {
            const id = parseInt(classId);
            return {
                name: COCO_CLASSES[id] || `Class ${id}`,
                value: count,
                classId: id,
                color: CLASS_COLORS[id] || DEFAULT_COLOR
            };
        }).sort((a, b) => b.value - a.value);
    }, [zones]);

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
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={((value: number | undefined) => [`${value ?? 0} zone${(value ?? 0) !== 1 ? 's' : ''}`, 'Count']) as never}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Legend below */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 text-[10px]">
                {chartData.map(item => (
                    <div key={item.classId} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-secondary-text">{item.name}: {item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
