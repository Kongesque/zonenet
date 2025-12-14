const dropArea = document.getElementById("drop-area");
const uploadForm = document.getElementById('uploadForm'); // flask
const uploadFile = document.getElementById('fileInput'); // flask
const dummyBtn = document.getElementById('dummy'); // flask

// Prevent default drag behaviors on the whole document
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

let dragCounter = 0;

// Highlight drop area when item is dragged over it
['dragenter'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
        dragCounter++;
        dropArea.classList.add('drag-active');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
        if (eventName === 'drop') {
            dragCounter = 0;
            dropArea.classList.remove('drag-active');
            return;
        }
        dragCounter--;
        if (dragCounter === 0) {
            dropArea.classList.remove('drag-active');
        }
    }, false);
});

['dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;

    uploadFile.files = files;
    uploadForm.submit();
    // Trigger loading state from base.html if it exists or ensure it shows
    if (typeof loading === 'function') {
        loading();
    }
}

dropArea.addEventListener("click", function () { uploadFile.click(); });

uploadFile.addEventListener('change', function () {
    if (typeof loading === 'function') {
        loading();
    }
    uploadForm.submit();
});

