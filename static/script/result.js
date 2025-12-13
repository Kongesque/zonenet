const uploadForm = document.getElementById('uploadForm'),
uploadFile = document.getElementById('fileInput'),
dummyBtn = document.getElementById('dummy'),
uploadBtn = document.querySelector(".upload");

uploadBtn.addEventListener('click', function() { uploadFile.click(); });
uploadFile.addEventListener('change', function() { 
    dummyBtn.click(); 
    uploadForm.submit(); 
});
