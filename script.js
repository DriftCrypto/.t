const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");
const startButton = document.getElementById("startVerification");

let referenceDescriptor = null; // Stores reference face
let faceDetected = false; // Tracks if a face is detected
let verificationInProgress = false; // Prevents multiple verification attempts

// Start the camera
async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.play();
        console.log("✅ Камера разрешена!");
    } catch (err) {
        console.error("❌ Ошибка доступа к камере:", err);
        alert("Ошибка: Доступ к камере запрещён!");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    startVideo(); 
});

// Load Face-api.js models
async function loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/");
    await faceapi.nets.faceRecognitionNet.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/");
    await faceapi.nets.faceLandmark68Net.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/");
}

// Capture reference face (simulating account registration)
async function captureReferenceFace() {
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (!detections) {
        statusText.innerText = "No face detected. Try again.";
        return;
    }
    referenceDescriptor = detections.descriptor;
    statusText.innerText = "Face captured. Click 'Start Verification'.";
}

// Verify user identity
async function verifyFace() {
    if (!referenceDescriptor) {
        statusText.innerText = "Please save a reference face first!";
        return;
    }

    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (!detections) {
        statusText.innerText = "Face not detected!";
        return;
    }

    // Compare with reference face
    const faceMatcher = new faceapi.FaceMatcher(referenceDescriptor);
    const match = faceMatcher.findBestMatch(detections.descriptor);

    if (match.distance < 0.5) { // Lower = better match
        statusText.innerText = "✅ Verification successful!";
        setTimeout(() => window.close(), 2000); // Close after 2 sec
    } else {
        statusText.innerText = "❌ Verification failed!";
    }
}

// Detect face and update UI (detect every 100ms)
video.addEventListener('play', () => {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (detections.length > 0) {
            faceDetected = true;
            startButton.classList.remove('inactive');
            startButton.classList.add('active');
        } else {
            faceDetected = false;
            startButton.classList.remove('active');
            startButton.classList.add('inactive');
        }

        // Drawing the face box
        canvas.width = video.width;
        canvas.height = video.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        detections.forEach(detection => {
            const { x, y, width, height } = detection.detection.box;
            ctx.beginPath();
            ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 1.6, 0, 0, 2 * Math.PI); // Vertical OVAL BOX
            ctx.lineWidth = 4;
            ctx.strokeStyle = "rgb(0, 255, 204)";
            ctx.stroke();
        });
    }, 100);
});

// Button logic
startButton.addEventListener("click", () => {
    if (faceDetected && !verificationInProgress) {
        verificationInProgress = true;
        statusText.innerText = "Verifying... Please wait 5 seconds.";
        setTimeout(verifyFace, 5000); // Simulating a 5-second verification process
    }
});

// Initialize
(async function init() {
    await loadModels();
    startVideo();
})();
