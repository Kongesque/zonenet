const dropArea = document.getElementById("drop-area");
const uploadForm = document.getElementById('uploadForm'); // flask
const uploadFile = document.getElementById('fileInput'); // flask
const dummyBtn = document.getElementById('dummy'); // flask

dropArea.addEventListener("click", function () { uploadFile.click(); });
uploadFile.addEventListener('change', function () {
    dummyBtn.click();
    uploadForm.submit();
});


dropArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    console.log('Drag over event triggered');
});

dropArea.addEventListener("drop", function (e) {
    e.preventDefault();
    console.log('Drop event triggered');
    uploadFile.files = e.dataTransfer.files;
    uploadForm.submit();
});

