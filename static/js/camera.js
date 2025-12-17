/**
 * Camera Page Controller
 * Handles RTSP stream connection and webcam selection
 */

// Use webcam as source
function useWebcam() {
    document.getElementById('streamUrl').value = '0';
    document.getElementById('sourceType').value = 'webcam';
    document.getElementById('cameraForm').submit();
}

// Test RTSP connection
function testConnection() {
    const url = document.getElementById('streamUrl').value.trim();
    const testResult = document.getElementById('testResult');
    const testBtn = document.getElementById('testBtn');

    if (!url) {
        testResult.textContent = 'Please enter an RTSP URL first';
        testResult.className = 'mt-2 text-sm text-delete-text';
        testResult.classList.remove('hidden');
        return;
    }

    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    testResult.textContent = 'Connecting to stream...';
    testResult.className = 'mt-2 text-sm text-muted-foreground';
    testResult.classList.remove('hidden');

    fetch('/api/camera/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_url: url })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                testResult.textContent = `✓ Connected! Resolution: ${data.width}x${data.height}`;
                testResult.className = 'mt-2 text-sm text-green-500';
            } else {
                testResult.textContent = `✗ Failed: ${data.error}`;
                testResult.className = 'mt-2 text-sm text-delete-text';
            }
        })
        .catch(err => {
            testResult.textContent = `✗ Error: ${err.message}`;
            testResult.className = 'mt-2 text-sm text-delete-text';
        })
        .finally(() => {
            testBtn.disabled = false;
            testBtn.textContent = 'Test Connection';
        });
}

// Form validation
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('cameraForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            const url = document.getElementById('streamUrl').value.trim();
            const sourceType = document.getElementById('sourceType').value;

            if (!url && sourceType !== 'webcam') {
                e.preventDefault();
                const testResult = document.getElementById('testResult');
                testResult.textContent = 'Please enter an RTSP URL';
                testResult.className = 'mt-2 text-sm text-delete-text';
                testResult.classList.remove('hidden');
            }
        });
    }
});
