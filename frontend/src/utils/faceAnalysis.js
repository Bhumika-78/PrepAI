import * as faceapi from "face-api.js";

// Load face detection models
export const loadFaceModels = async () => {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    console.log("Face models loaded successfully.");
  } catch (error) {
    console.error("Error loading face models:", error);
  }
};

// Analyze face engagement
export const analyzeFace = async (videoElement) => {
  try {
    const detections = await faceapi.detectAllFaces(
      videoElement,
      new faceapi.TinyFaceDetectorOptions()
    );
    return detections.length > 0 ? "Engaged" : "Not Paying Attention";
  } catch (error) {
    console.error("Error analyzing face:", error);
    return "Error analyzing face.";
  }
};