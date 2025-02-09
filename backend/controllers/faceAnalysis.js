import * as faceapi from "face-api.js";

// Load face detection models
export const loadFaceModels = async () => {
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  await faceapi.nets.faceExpressionNet.loadFromUri("/models");
};

// Analyze face engagement
export const analyzeFace = async (videoElement) => {
  const detections = await faceapi.detectAllFaces(
    videoElement,
    new faceapi.TinyFaceDetectorOptions()
  );
  return detections.length > 0 ? "Engaged" : "Not Paying Attention";
};