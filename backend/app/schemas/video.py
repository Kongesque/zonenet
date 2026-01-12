from typing import Literal
from pydantic import BaseModel

class Point(BaseModel):
    x: float
    y: float

class Zone(BaseModel):
    id: str
    points: list[Point]
    type: Literal["polygon", "line"]
    name: str
    classes: list[str] = []

class ProcessRequest(BaseModel):
    zones: list[Zone]
    model: str = "yolo11n"

class TaskResponse(BaseModel):
    id: str
    status: Literal["pending", "processing", "completed", "failed"]
    filename: str | None
    created_at: str
    duration: str | None = None
    format: str | None = None
