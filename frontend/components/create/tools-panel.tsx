"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Trash2, Slash, Square, X, InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Zone } from "./drawing-canvas";
import { Item, ItemContent, ItemDescription, ItemTitle } from "../ui/item";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Combobox,
    ComboboxChips,
    ComboboxChip,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from "../ui/combobox";
import { COCO_CLASSES } from "@/lib/coco-classes";
import { Kbd } from "../ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const YOLO_MODELS = [
    { value: "yolo11n", label: "YOLO11 Nano", description: "Fastest" },
    { value: "yolo11s", label: "YOLO11 Small", description: "Fast" },
    { value: "yolo11m", label: "YOLO11 Medium", description: "Balanced" },
    { value: "yolo11l", label: "YOLO11 Large", description: "Accurate" },
    { value: "yolo11x", label: "YOLO11 XLarge", description: "Most accurate" },
] as const;

export type YoloModel = typeof YOLO_MODELS[number]["value"];

interface ToolsPanelProps {
    zones: Zone[];
    selectedZoneId: string | null;
    drawingMode: 'polygon' | 'line';
    fullFrameClasses: string[];
    selectedModel: YoloModel;
    onDrawingModeChange: (mode: 'polygon' | 'line') => void;
    onZoneSelected: (id: string | null) => void;
    onDeleteZone: (id: string, e: React.MouseEvent) => void;
    onProcess: () => void;
    onZoneRenamed: (id: string, name: string) => void;
    onZoneClassesChanged: (id: string, classes: string[]) => void;
    onFullFrameClassesChanged: (classes: string[]) => void;
    onModelChange: (model: YoloModel) => void;
}

interface ZoneItemProps {
    zone: Zone;
    index: number;
    isSelected: boolean;
    isEditing: boolean;
    tempName: string;
    onSelect: () => void;
    onStartEditing: () => void;
    onTempNameChange: (name: string) => void;
    onFinishEditing: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onClassesChange: (classes: string[]) => void;
}

const ZoneItem = React.memo(function ZoneItem({
    zone,
    index,
    isSelected,
    isEditing,
    tempName,
    onSelect,
    onStartEditing,
    onTempNameChange,
    onFinishEditing,
    onKeyDown,
    onDelete,
    onClassesChange,
}: ZoneItemProps) {
    const anchor = useComboboxAnchor();

    return (
        <div
            className={cn(
                "group flex flex-col rounded-lg border transition-all duration-150",
                isSelected
                    ? "border-yellow-500/50 bg-muted"
                    : "border-border bg-muted hover:border-yellow-500/50"
            )}
        >
            {/* Compact Header Row */}
            <div
                className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer"
                onClick={onSelect}
            >
                {/* Color Indicator Dot */}
                <div
                    className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0 transition-colors",
                        isSelected ? "bg-yellow-500" : "bg-muted-foreground/40"
                    )}
                />

                {/* Zone Name */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <Input
                            className="h-6 text-sm"
                            value={tempName}
                            onChange={(e) => onTempNameChange(e.target.value)}
                            onBlur={onFinishEditing}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={onKeyDown}
                        />
                    ) : (
                        <span
                            className="text-sm font-medium truncate block"
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                onStartEditing();
                            }}
                        >
                            {zone.name || `Zone ${index + 1}`}
                        </span>
                    )}
                </div>

                {/* Class Count Badge */}
                <span
                    className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0",
                        zone.classes.length === 0
                            ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                            : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                    )}
                >
                    {zone.classes.length === 0 ? "ALL" : zone.classes.length}
                </span>

                {/* Delete Button - Hover Only */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-destructive cursor-pointer"
                    onClick={onDelete}
                >
                    <X />
                </Button>
            </div>

            {/* Expanded Content - Only when selected */}
            {isSelected && (
                <div
                    className="px-2.5 pb-2.5 pt-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Combobox
                        multiple
                        autoHighlight
                        items={[...COCO_CLASSES]}
                        value={zone.classes}
                        onValueChange={onClassesChange}
                    >
                        <ComboboxChips ref={anchor} className="min-h-[32px] text-xs">
                            <ComboboxValue>
                                {(values: string[]) => (
                                    <React.Fragment>
                                        {values.map((value: string) => (
                                            <ComboboxChip key={value} className="font-mono text-xs">
                                                {value}
                                            </ComboboxChip>
                                        ))}
                                        <ComboboxChipsInput
                                            placeholder={values.length === 0 ? "Filter classes..." : ""}
                                            className="text-xs font-mono"
                                        />
                                    </React.Fragment>
                                )}
                            </ComboboxValue>
                        </ComboboxChips>
                        <ComboboxContent anchor={anchor}>
                            <ComboboxEmpty className="text-xs font-mono">No classes found.</ComboboxEmpty>
                            <ComboboxList className="text-xs font-mono">
                                {(item: string) => (
                                    <ComboboxItem key={item} value={item}>
                                        {item}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>
            )}
        </div>
    );
});

export function ToolsPanel({
    zones,
    selectedZoneId,
    drawingMode,
    fullFrameClasses,
    selectedModel,
    onDrawingModeChange,
    onZoneSelected,
    onDeleteZone,
    onProcess,
    onZoneRenamed,
    onZoneClassesChanged,
    onFullFrameClassesChanged,
    onModelChange,
}: ToolsPanelProps) {
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [tempName, setTempName] = React.useState("");
    const fullFrameAnchor = useComboboxAnchor();

    const handleStartEditing = (id: string, currentName: string) => {
        setEditingId(id);
        setTempName(currentName);
    };

    const handleFinishEditing = () => {
        if (editingId && tempName.trim()) {
            onZoneRenamed(editingId, tempName.trim());
        }
        setEditingId(null);
        setTempName("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleFinishEditing();
        } else if (e.key === "Escape") {
            setEditingId(null);
            setTempName("");
        }
    };

    return (
        <Card className="flex-1 flex flex-col p-4 gap-4">
            <h3 className="font-semibold">Create</h3>
            <Separator />

            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="text-foreground font-semibold">Model</div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <InfoIcon />
                                <span className="sr-only">Info</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>Smaller = faster</p>
                            <p>larger = more accurate</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Select value={selectedModel} onValueChange={(value) => onModelChange(value as YoloModel)}>
                    <SelectTrigger className="h-auto! w-full">
                        <SelectValue>
                            {YOLO_MODELS.find((m) => m.value === selectedModel) && (
                                <SelectModelItem model={YOLO_MODELS.find((m) => m.value === selectedModel)!} />
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {YOLO_MODELS.map((model) => (
                                <SelectItem key={model.value} value={model.value}>
                                    <SelectModelItem model={model} />
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="text-foreground font-semibold">Tools</div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <InfoIcon />
                                <span className="sr-only">Info</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>Zone = detect in specific areas.</p>
                            <p>Full frame = detect everywhere.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Tabs defaultValue="zone-based" className="w-full">
                    <TabsList className="w-full">
                        <TabsTrigger value="zone-based">Zone based</TabsTrigger>
                        <TabsTrigger value="full-frame">Full frame</TabsTrigger>
                    </TabsList>
                    <div className="p-1.5 border border-border rounded-xl">
                        <TabsContent value="zone-based">
                            <div className="flex flex-col gap-2 flex-1 min-h-0">
                                <ToggleGroup
                                    className="w-full"
                                    type="single"
                                    value={drawingMode}
                                    onValueChange={(value) => {
                                        if (value) onDrawingModeChange(value as 'polygon' | 'line');
                                    }}
                                    variant="outline"
                                    size="sm"
                                    spacing={2}
                                >
                                    <ToggleGroupItem value="polygon" aria-label="Zone" className="gap-2 flex-1 cursor-pointer">
                                        <Square className="w-2 h-2" />
                                        Zone
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="line" aria-label="Line" className="gap-2 flex-1 cursor-pointer">
                                        <Slash className="w-2 h-2" />
                                        Line
                                    </ToggleGroupItem>
                                </ToggleGroup >

                                <div className="flex flex-col flex-1 min-h-0">

                                    <div className="flex-1 -mx-2 px-2 overflow-y-auto">
                                        <div className="flex flex-col gap-2">
                                            {zones.length === 0 && (
                                                <Item variant="outline" className="border-dashed">
                                                    <ItemContent className="flex items-center">
                                                        <ItemDescription>Click on the video to create a zone</ItemDescription>
                                                    </ItemContent>
                                                </Item>
                                            )}

                                            {zones.map((zone, index) => (
                                                <ZoneItem
                                                    key={zone.id}
                                                    zone={zone}
                                                    index={index}
                                                    isSelected={selectedZoneId === zone.id}
                                                    isEditing={editingId === zone.id}
                                                    tempName={tempName}
                                                    onSelect={() => onZoneSelected(zone.id)}
                                                    onStartEditing={() => handleStartEditing(zone.id, zone.name || `Zone ${index + 1}`)}
                                                    onTempNameChange={setTempName}
                                                    onFinishEditing={handleFinishEditing}
                                                    onKeyDown={handleKeyDown}
                                                    onDelete={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteZone(zone.id, e);
                                                    }}
                                                    onClassesChange={(classes) => onZoneClassesChanged(zone.id, classes)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="full-frame">
                            <div className="group flex flex-col rounded-lg border border-border bg-muted">
                                <div className="">
                                    <div className="flex items-center justify-between gap-2.5 px-2.5 py-2">
                                        <span className="text-sm font-medium text-muted-foreground">Detect classes</span>
                                        <span
                                            className={cn(
                                                "text-[10px] font-mono px-1.5 py-0.5 rounded",
                                                "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                                            )}
                                        >
                                            {fullFrameClasses.length === 0 ? "ALL" : fullFrameClasses.length}
                                        </span>
                                    </div>
                                    <div className="px-2.5 pb-2.5 pt-0">
                                        <Combobox
                                            multiple
                                            autoHighlight
                                            items={[...COCO_CLASSES]}
                                            value={fullFrameClasses}
                                            onValueChange={onFullFrameClassesChanged}
                                        >
                                            <ComboboxChips ref={fullFrameAnchor} className="min-h-[32px] text-xs">
                                                <ComboboxValue>
                                                    {(values: string[]) => (
                                                        <React.Fragment>
                                                            {values.map((value: string) => (
                                                                <ComboboxChip key={value} className="font-mono text-xs">
                                                                    {value}
                                                                </ComboboxChip>
                                                            ))}
                                                            <ComboboxChipsInput
                                                                placeholder={values.length === 0 ? "Filter classes..." : ""}
                                                                className="text-xs font-mono"
                                                            />
                                                        </React.Fragment>
                                                    )}
                                                </ComboboxValue>
                                            </ComboboxChips>
                                            <ComboboxContent anchor={fullFrameAnchor}>
                                                <ComboboxEmpty className="text-xs font-mono">No classes found.</ComboboxEmpty>
                                                <ComboboxList className="text-xs font-mono">
                                                    {(item: string) => (
                                                        <ComboboxItem key={item} value={item}>
                                                            {item}
                                                        </ComboboxItem>
                                                    )}
                                                </ComboboxList>
                                            </ComboboxContent>
                                        </Combobox>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <div className="mt-auto pt-4">
                <Separator className="my-4" />
                <Button className="w-full h-12" disabled={zones.length === 0} onClick={onProcess}>
                    Process
                </Button>
            </div>
        </Card>
    );
}

function SelectModelItem({ model }: { model: (typeof YOLO_MODELS)[number] }) {
    return (
        <div className="flex items-center gap-2">
            <span className="font-medium">{model.label}</span>
            <Kbd>{model.description}</Kbd>
        </div>
    )
}