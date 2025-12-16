const previewFrame = document.getElementById('image'),
    pointSlider = document.querySelector(".slider input"),
    pointValue = document.querySelector(".point-info .value"),
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    clearCanvas = document.querySelector(".draw"),
    processBtn = document.querySelector(".run .process");

const board = document.querySelector(".board");

let prevMouseX, prevMouseY, snapshot,
    isDrawing = false,
    drawn = false,
    selectedColor = "#fbbd05",
    points = [],
    brushWidth = 5,
    selectedPoint = 4;

let width = previewFrame.naturalWidth, height = previewFrame.naturalHeight;

const initializeCanvas = () => {
    width = previewFrame.naturalWidth;
    height = previewFrame.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(previewFrame, 0, 0);
    document.querySelector(".size-width .value").textContent = width + " px";
    document.querySelector(".size-height .value").textContent = height + " px";
}

if (previewFrame.complete) {
    initializeCanvas();
} else {
    previewFrame.addEventListener('load', initializeCanvas);
}


const updatePoint = () => {
    pointValue.innerText = `${pointSlider.value}`;
    selectedPoint = pointSlider.value;
}

const zoneClassSelector = document.getElementById('classSelector');

// HSL to RGB helper
function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

const updateColorFromClass = () => {
    const classId = parseInt(zoneClassSelector.value);
    // Generate distinct color based on class ID using golden angle approximation
    const hue = (classId * 137.508) % 360;
    const [r, g, b] = hslToRgb(hue, 85, 55); // High saturation and medium lightness for visibility

    selectedColor = `rgb(${r}, ${g}, ${b})`;

    let colorData = {
        "b": b,
        "g": g,
        "r": r
    };

    $.ajax({
        type: "POST",
        url: "/color_setting",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(colorData),
        success: function (data) { },
        dataType: "json"
    });
};

if (zoneClassSelector) {
    zoneClassSelector.addEventListener('change', (e) => {
        // Update hidden input if it exists (it's handled in HTML inline script but good to be safe/consistent if we move logic here)
        // usage in zone.html handles input value update. We handle color here.
        updateColorFromClass();
    });

    // Initialize color on load
    updateColorFromClass();
}


const startDraw = (e) => {
    if (drawn) return;
    isDrawing = true;
    const Ratio = previewFrame.naturalWidth / document.getElementById("canvas").getBoundingClientRect().width;
    prevMouseX = e.offsetX * Ratio;
    prevMouseY = e.offsetY * Ratio;
    $.ajax({
        type: "POST",
        url: "/get_coordinates",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ x: prevMouseX, y: prevMouseY }),
        success: function (data) { },
        dataType: "json"
    });
    points.push({ x: prevMouseX, y: prevMouseY });
    if (points.length == selectedPoint) {
        points = [];
        isDrawing = false;
        drawn = true;
        document.querySelector(".run").classList.remove("disable");
    }
    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedColor;
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

const drawing = (e) => {
    if (!isDrawing) return;
    ctx.putImageData(snapshot, 0, 0);
    drawPolygon(e);
}

const drawPolygon = (e) => {
    const Ratio = previewFrame.naturalWidth / document.getElementById("canvas").getBoundingClientRect().width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(previewFrame, 0, 0);
    if (points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
    } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
    }
    ctx.lineTo(e.offsetX * Ratio, e.offsetY * Ratio);
    ctx.closePath();
    ctx.stroke();
}

clearCanvas.addEventListener("click", () => {
    points = [];
    drawn = false;
    document.querySelector(".run").classList.add("disable");
    $.ajax({
        type: "POST",
        url: "/clear",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({}),
        success: function (data) { },
        dataType: "json"
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clearing whole canvas
    ctx.drawImage(previewFrame, 0, 0);
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
pointSlider.addEventListener("input", updatePoint);
