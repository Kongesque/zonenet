export const CLASS_COLORS: Record<number, string> = {
    0: "#3b82f6",  // person - blue
    1: "#22c55e",  // bicycle - green
    2: "#f97316",  // car - orange
    3: "#ef4444",  // motorcycle - red
    5: "#a855f7",  // bus - purple
    7: "#eab308",  // truck - yellow
    16: "#ec4899", // dog - pink
    17: "#14b8a6", // horse - teal
};

export const DEFAULT_COLOR = "#6b7280";

export const getZoneColor = (classId: number, index: number = 0): string => {
    // Get base class color
    const baseColor = CLASS_COLORS[classId] || DEFAULT_COLOR;
    return baseColor;
};
