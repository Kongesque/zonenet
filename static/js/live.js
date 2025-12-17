/**
 * Live Stream Analytics Controller
 * Handles real-time monitoring UI for ZoneNet live streams
 */

// Global state
let streamActive = false;
let analyticsInterval = null;
let liveChart = null;
let audioContext = null;
const alertState = {};
const zoneColors = {};

// Get task ID from data attribute on main element
const taskID = document.getElementById('content')?.dataset.taskId || '';

// Initialize zone colors from DOM
function initZoneColors() {
    document.querySelectorAll('.zone-color-indicator').forEach(el => {
        const color = el.dataset.color;
        const zoneId = el.dataset.zoneId;
        if (color && zoneId) {
            zoneColors[zoneId] = `rgb(${color})`;
            el.style.backgroundColor = `rgb(${color})`;
        }
    });
}

// Play alert beep sound
function playAlertBeep() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Check if count exceeds threshold
function checkThreshold(zoneId, count) {
    const thresholdInput = document.getElementById(`threshold-${zoneId}`);
    const alertIcon = document.getElementById(`alert-icon-${zoneId}`);
    const zoneCard = document.getElementById(`zone-card-${zoneId}`);

    if (!thresholdInput || !alertIcon || !zoneCard) return;

    const threshold = parseInt(thresholdInput.value);
    if (isNaN(threshold) || threshold <= 0) {
        alertIcon.classList.add('hidden');
        zoneCard.classList.remove('border-red-500', 'shadow-red-500/30', 'shadow-lg');
        alertState[zoneId] = false;
        return;
    }

    if (count >= threshold) {
        alertIcon.classList.remove('hidden');
        zoneCard.classList.add('border-red-500', 'shadow-red-500/30', 'shadow-lg');

        if (!alertState[zoneId]) {
            alertState[zoneId] = true;
            playAlertBeep();
        }
    } else {
        alertIcon.classList.add('hidden');
        zoneCard.classList.remove('border-red-500', 'shadow-red-500/30', 'shadow-lg');
        alertState[zoneId] = false;
    }
}

// Initialize Chart.js rolling chart
function initChart() {
    const ctx = document.getElementById('liveChart')?.getContext('2d');
    if (!ctx) return;

    liveChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: {
                        color: '#9ca3af',
                        maxTicksLimit: 5,
                        callback: function (value) {
                            return this.getLabelForValue(value) + 's';
                        }
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grid: { color: 'rgba(55, 65, 81, 0.3)' },
                    ticks: { color: '#9ca3af', precision: 0 }
                }
            }
        }
    });
}

// Format elapsed time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update chart with new data
function updateChart(history) {
    if (!liveChart || !history || history.length === 0) return;

    const labels = history.map(h => Math.round(h.time));
    const zoneIds = new Set();
    history.forEach(h => {
        Object.keys(h.counts).forEach(id => zoneIds.add(id));
    });

    const datasets = [];
    zoneIds.forEach(zoneId => {
        const data = history.map(h => h.counts[zoneId] || 0);
        const color = zoneColors[zoneId] || '#1F6F65';
        datasets.push({
            label: zoneId,
            data: data,
            borderColor: color,
            backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.3
        });
    });

    liveChart.data.labels = labels;
    liveChart.data.datasets = datasets;
    liveChart.update('none');
}

// Poll for analytics updates
function startAnalyticsUpdates() {
    if (analyticsInterval) clearInterval(analyticsInterval);

    analyticsInterval = setInterval(function () {
        if (!streamActive) return;

        fetch(`/api/live/${taskID}/analytics`)
            .then(response => response.json())
            .then(data => {
                if (data.error) return;

                // Update elapsed time
                if (data.elapsed !== undefined) {
                    document.getElementById('elapsedTime').textContent = formatTime(data.elapsed);
                }

                // Update counts and check thresholds
                if (data.counts) {
                    for (const [zoneId, count] of Object.entries(data.counts)) {
                        const el = document.getElementById(`count-${zoneId}`);
                        if (el) el.textContent = count;
                        checkThreshold(zoneId, count);
                    }
                }

                // Update rates
                if (data.rates) {
                    for (const [zoneId, rate] of Object.entries(data.rates)) {
                        const el = document.getElementById(`rate-${zoneId}`);
                        if (el) {
                            const arrow = rate > 0 ? '↑' : rate < 0 ? '↓' : '';
                            el.textContent = `${arrow}${Math.abs(rate)}/min`;
                        }
                    }
                }

                // Update peaks
                if (data.peaks) {
                    for (const [zoneId, peak] of Object.entries(data.peaks)) {
                        const el = document.getElementById(`peak-${zoneId}`);
                        if (el) el.textContent = peak.count || 0;
                    }
                }

                // Update chart
                if (data.history) {
                    updateChart(data.history);
                }
            })
            .catch(err => console.log('Analytics update error:', err));
    }, 1000);
}

// Handle stream error
function handleStreamError() {
    streamActive = false;
    document.getElementById('statusIndicator').className = 'status-indicator status-stopped';
    document.getElementById('statusText').textContent = 'Disconnected';
    document.getElementById('connectingOverlay').classList.add('hidden');
    document.getElementById('stoppedOverlay').classList.remove('hidden');
}

// Stop the stream
function stopStream() {
    fetch(`/api/live/${taskID}/stop`, { method: 'POST' })
        .then(() => {
            streamActive = false;
            if (analyticsInterval) clearInterval(analyticsInterval);
            document.getElementById('live-video').src = '';
            document.getElementById('statusIndicator').className = 'status-indicator status-stopped';
            document.getElementById('statusText').textContent = 'Stopped';
            document.getElementById('stoppedOverlay').classList.remove('hidden');
        });
}

// Restart the stream
function restartStream() {
    document.getElementById('stoppedOverlay').classList.add('hidden');
    document.getElementById('connectingOverlay').classList.remove('hidden');
    document.getElementById('statusIndicator').className = 'status-indicator status-connecting';
    document.getElementById('statusText').textContent = 'Connecting...';
    document.getElementById('elapsedTime').textContent = '00:00';

    const video = document.getElementById('live-video');
    video.src = `/api/live/${taskID}/stream?t=${Date.now()}`;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function () {
    initZoneColors();

    const video = document.getElementById('live-video');
    if (video) {
        video.onload = function () {
            streamActive = true;
            document.getElementById('connectingOverlay').classList.add('hidden');
            document.getElementById('statusIndicator').className = 'status-indicator status-live';
            document.getElementById('statusText').textContent = 'Live';
            initChart();
            startAnalyticsUpdates();
        };
    }
});

// Cleanup on page unload
window.onbeforeunload = function () {
    if (analyticsInterval) clearInterval(analyticsInterval);
    navigator.sendBeacon(`/api/live/${taskID}/stop`);
};
