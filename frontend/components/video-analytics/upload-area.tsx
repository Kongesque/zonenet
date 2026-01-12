"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useVideo } from "@/components/video-context";

export function UploadArea() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // TODO: Add upload progress state
    // const [uploadProgress, setUploadProgress] = useState(0);
    // const [isUploading, setIsUploading] = useState(false);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            // TODO: Add file validation (type, size limit)
            setFile(droppedFile);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // TODO: Add file validation (type, size limit)
            setFile(selectedFile);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const router = useRouter();
    const { setVideoUrl, setVideoType } = useVideo();

    // Implement submit handler
    const handleSubmit = async () => {
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("http://localhost:8000/api/video/upload", {
                method: "POST",
                body: formData,
                // credentials: "include", // Enable if using cookies
            });

            if (!response.ok) {
                console.error("Upload failed");
                return;
            }

            const data = await response.json();
            const { task_id } = data;

            // Use backend stream URL
            setVideoUrl(`http://localhost:8000/api/video/${task_id}/stream`);
            setVideoType('file');

            router.push(`/create/${task_id}`);

        } catch (error) {
            console.error("Error uploading video:", error);
        }
    };

    return (
        <Card className="w-full p-0 gap-0">
            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Drop Zone */}
            <CardContent className="p-2">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleUploadClick}
                    className={`flex min-h-[90px] items-center justify-center rounded-lg cursor-pointer transition-colors ${isDragging
                        ? "bg-muted"
                        : file
                            ? "bg-muted"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                >
                    {file ? (
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-sm text-foreground truncate max-w-[200px]">
                                {file.name}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile();
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            Drop files here
                        </span>
                    )}
                </div>
            </CardContent>

            {/* Footer Bar */}
            <CardFooter className="flex items-center justify-between px-3 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={handleUploadClick}
                >
                    <Upload className="h-5 w-5" />
                </Button>
                <Button
                    size="icon"
                    className={`h-10 w-10 rounded-full transition-colors ${file
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                    disabled={!file}
                    onClick={handleSubmit}
                >
                    <ArrowUp className="h-5 w-5" />
                </Button>
            </CardFooter>
        </Card>
    );
}
