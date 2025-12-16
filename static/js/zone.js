const previewFrame = document.getElementById('image'),
    pointSlider = document.querySelector(".slider input"),
    pointValue = document.querySelector(".point-info .value"),
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    processBtn = document.querySelector(".run .process"),
    addZoneBtn = document.getElementById('addZoneBtn'),
    zoneListContainer = document.getElementById('zoneList'),
    zonesInput = document.getElementById('zonesInput');

// Load COCO classes from embedded JSON
const cocoClasses = JSON.parse(document.getElementById('coco-classes-data').textContent);

// Maximum zones allowed
const MAX_ZONES = 5;

// Zones array: [{ id, points, classId, color }]
let zones = [];
let activeZoneIndex = -1;
let isDrawing = false;
let selectedPoint = 4;

let width = previewFrame.naturalWidth, height = previewFrame.naturalHeight;

// HSL to RGB helper
function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

// Generate color from class ID (matches backend)
function getColorFromClassId(classId) {
    const hue = (classId * 137.508) % 360;
    return hslToRgb(hue, 85, 55);
}

// Generate a unique zone ID
function generateZoneId() {
    return 'zone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Create zone item HTML
function createZoneItemHTML(zone, index) {
    const [r, g, b] = zone.color;
    const colorHex = `rgb(${r}, ${g}, ${b})`;
    const isActive = index === activeZoneIndex;
    const isComplete = zone.points.length >= selectedPoint;

    // Build class options
    let classOptions = '';
    const sortedClasses = Object.entries(cocoClasses).sort((a, b) => a[1].localeCompare(b[1]));
    for (const [id, name] of sortedClasses) {
        const selected = parseInt(id) === zone.classId ? 'selected' : '';
        classOptions += `<option value="${id}" ${selected}>${name.charAt(0).toUpperCase() + name.slice(1)}</option>`;
    }

    return `
        <div class="zone-item p-3 rounded-lg border ${isActive ? 'border-text-color bg-btn-hover' : 'border-btn-border bg-btn-bg'} transition-all cursor-pointer" data-zone-index="${index}">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${colorHex}"></div>
                    <div class="flex items-center gap-1">
                        <input type="text" class="zone-label-input bg-transparent text-sm font-medium text-text-color w-12 focus:outline-none focus:border-b focus:border-text-color" value="${zone.label}" data-zone-index="${index}" placeholder="Zone ${index + 1}">
                        <svg class="w-3 h-3 text-secondary-text" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                    </div>
                    ${isComplete ? '<span class="text-xs text-green-500">✓</span>' : '<span class="text-xs text-secondary-text">' + zone.points.length + '/' + selectedPoint + '</span>'}
                </div>
                <button class="delete-zone-btn text-secondary-text hover:text-red-500 transition-colors p-1" data-zone-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <select class="zone-class-selector w-full bg-secondary-bg text-text-color border border-btn-border rounded-lg p-1.5 text-xs focus:outline-none focus:border-blue-500 appearance-none cursor-pointer" data-zone-index="${index}">
                ${classOptions}
            </select>
        </div>
    `;
}

// Render all zone items in the sidebar
function renderZoneList() {
    let html = '';
    zones.forEach((zone, index) => {
        html += createZoneItemHTML(zone, index);
    });
    zoneListContainer.innerHTML = html;

    // Update add button state
    if (zones.length >= MAX_ZONES) {
        addZoneBtn.disabled = true;
        addZoneBtn.classList.add('opacity-50', 'cursor-not-allowed');
        addZoneBtn.classList.remove('hover:border-text-color', 'hover:text-text-color');
    } else {
        addZoneBtn.disabled = false;
        addZoneBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        addZoneBtn.classList.add('hover:border-text-color', 'hover:text-text-color');
    }

    // Update process button state
    const hasCompleteZone = zones.some(z => z.points.length >= selectedPoint);
    if (hasCompleteZone) {
        document.querySelector(".run").classList.remove("disable");
    } else {
        document.querySelector(".run").classList.add("disable");
    }

    // Update hidden form input
    updateZonesInput();

    // Attach event listeners
    attachZoneListeners();
}

// Attach event listeners to zone items
function attachZoneListeners() {
    // Zone item click (select zone)
    document.querySelectorAll('.zone-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking delete or select
            if (e.target.closest('.delete-zone-btn') || e.target.closest('.zone-class-selector')) return;

            const index = parseInt(item.dataset.zoneIndex);
            selectZone(index);
        });
    });

    // Delete zone button
    document.querySelectorAll('.delete-zone-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.zoneIndex);
            deleteZone(index);
        });
    });

    // Class selector change
    document.querySelectorAll('.zone-class-selector').forEach(select => {
        select.addEventListener('change', (e) => {
            const index = parseInt(select.dataset.zoneIndex);
            const classId = parseInt(e.target.value);
            updateZoneClass(index, classId);
        });
    });

    // Label input change
    document.querySelectorAll('.zone-label-input').forEach(input => {
        input.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent zone selection when clicking input
        });
        input.addEventListener('input', (e) => {
            const index = parseInt(input.dataset.zoneIndex);
            updateZoneLabel(index, e.target.value);
        });
    });
}

// Select a zone for editing
function selectZone(index) {
    activeZoneIndex = index;
    renderZoneList();
    redrawCanvas();
}

// Get count of zones with a specific class ID
function getClassCount(classId) {
    return zones.filter(z => z.classId === classId).length;
}

// Generate label for a zone based on class
function generateZoneLabel(classId) {
    const className = cocoClasses[classId] || 'Object';
    const capitalizedName = className.charAt(0).toUpperCase() + className.slice(1);
    const count = getClassCount(classId) + 1;
    return `${capitalizedName} ${count}`;
}

// Add a new zone
function addZone() {
    if (zones.length >= MAX_ZONES) return;

    const defaultClassId = 19; // Cow
    const color = getColorFromClassId(defaultClassId);

    const newZone = {
        id: generateZoneId(),
        points: [],
        classId: defaultClassId,
        color: color,
        label: generateZoneLabel(defaultClassId)
    };

    zones.push(newZone);
    activeZoneIndex = zones.length - 1;

    renderZoneList();
    redrawCanvas();
    syncZonesToBackend();
}

// Update zone label
function updateZoneLabel(index, label) {
    if (index < 0 || index >= zones.length) return;

    zones[index].label = label;
    updateZonesInput();
    syncZonesToBackend();
}

// Delete a zone
function deleteZone(index) {
    zones.splice(index, 1);

    // Adjust active index
    if (activeZoneIndex >= zones.length) {
        activeZoneIndex = zones.length - 1;
    }

    renderZoneList();
    redrawCanvas();
    syncZonesToBackend();
}

// Update zone class
function updateZoneClass(index, classId) {
    if (index < 0 || index >= zones.length) return;

    zones[index].classId = classId;
    zones[index].color = getColorFromClassId(classId);
    zones[index].label = generateZoneLabel(classId);

    renderZoneList();
    redrawCanvas();
    syncZonesToBackend();
}

// Update hidden form input with zones data
function updateZonesInput() {
    const zonesData = zones.map(z => ({
        id: z.id,
        points: z.points,
        classId: z.classId,
        color: z.color,
        label: z.label
    }));
    zonesInput.value = JSON.stringify(zonesData);
}

// Sync zones to backend
function syncZonesToBackend() {
    const zonesData = zones.map(z => ({
        id: z.id,
        points: z.points,
        classId: z.classId,
        color: z.color,
        label: z.label
    }));

    $.ajax({
        type: "POST",
        url: "/update_zones",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ zones: zonesData }),
        success: function (data) { },
        dataType: "json"
    });
}

// Initialize canvas
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

// Update point count
const updatePoint = () => {
    pointValue.innerText = `${pointSlider.value}`;
    selectedPoint = parseInt(pointSlider.value);
    renderZoneList(); // Re-render to update point counts
}

// Redraw canvas with all zones
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(previewFrame, 0, 0);

    // Draw all complete/in-progress zones
    zones.forEach((zone, index) => {
        if (zone.points.length === 0) return;

        const [r, g, b] = zone.color;
        const colorStr = `rgb(${r}, ${g}, ${b})`;
        const isActive = index === activeZoneIndex;

        ctx.beginPath();
        ctx.moveTo(zone.points[0].x, zone.points[0].y);

        for (let i = 1; i < zone.points.length; i++) {
            ctx.lineTo(zone.points[i].x, zone.points[i].y);
        }

        if (zone.points.length >= selectedPoint) {
            ctx.closePath();
        }

        ctx.lineWidth = isActive ? 4 : 3;
        ctx.strokeStyle = colorStr;
        ctx.stroke();

        // Draw points
        zone.points.forEach((pt, ptIndex) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, isActive ? 6 : 4, 0, 2 * Math.PI);
            ctx.fillStyle = colorStr;
            ctx.fill();
        });
    });
}

// Handle canvas click - add point to active zone
const handleCanvasClick = (e) => {
    if (activeZoneIndex < 0 || activeZoneIndex >= zones.length) return;

    const zone = zones[activeZoneIndex];

    // If zone is already complete, don't add more points
    if (zone.points.length >= selectedPoint) return;

    const ratio = previewFrame.naturalWidth / canvas.getBoundingClientRect().width;
    const x = e.offsetX * ratio;
    const y = e.offsetY * ratio;

    zone.points.push({ x, y });

    renderZoneList();
    redrawCanvas();
    syncZonesToBackend();
}

// Handle mouse move for preview line
let lastMousePos = null;

const handleCanvasMouseMove = (e) => {
    if (activeZoneIndex < 0 || activeZoneIndex >= zones.length) return;

    const zone = zones[activeZoneIndex];

    // Only show preview line if zone has points but isn't complete
    if (zone.points.length === 0 || zone.points.length >= selectedPoint) {
        redrawCanvas();
        return;
    }

    const ratio = previewFrame.naturalWidth / canvas.getBoundingClientRect().width;
    const mouseX = e.offsetX * ratio;
    const mouseY = e.offsetY * ratio;

    // Redraw and add preview line
    redrawCanvas();

    const [r, g, b] = zone.color;
    const colorStr = `rgb(${r}, ${g}, ${b})`;

    ctx.beginPath();
    ctx.moveTo(zone.points[0].x, zone.points[0].y);

    for (let i = 1; i < zone.points.length; i++) {
        ctx.lineTo(zone.points[i].x, zone.points[i].y);
    }

    ctx.lineTo(mouseX, mouseY);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = colorStr;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Add zone button
addZoneBtn.addEventListener("click", addZone);

// Canvas events
canvas.addEventListener("click", handleCanvasClick);
canvas.addEventListener("mousemove", handleCanvasMouseMove);
pointSlider.addEventListener("input", updatePoint);

// Initialize: Add first zone automatically
addZone();
