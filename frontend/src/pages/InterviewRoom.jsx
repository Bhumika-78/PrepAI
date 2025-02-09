import React, { useState } from "react";
import axios from "axios";

const InterviewRoom = () => {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [videoData, setVideoData] = useState(null);

  // Handle Text Analysis
  const analyzeText = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/evaluation/analyzeText", { text: answer });
      setFeedback(response.data.textFeedback);
    } catch (error) {
      console.error("Text Analysis Error:", error);
    }
  };

  // Handle Video Analysis (Facial Expressions, Emotions)
  const analyzeFace = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/evaluation/analyzeFace", { videoData });
      console.log("Facial Feedback:", response.data.facialFeedback);
    } catch (error) {
      console.error("Face Analysis Error:", error);
    }
  };

  return (
    <div>
      <h3>AI Interview Evaluator</h3>
      
      {/* Text Input for Answer Analysis */}
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer..."></textarea>
      <button onClick={analyzeText}>Evaluate Text</button>
      
      {/* Video Recording (Placeholder for Now) */}
      <button onClick={analyzeFace}>Analyze Face</button>
      
      <p>Feedback: {feedback}</p>
    </div>
  );
};

export default InterviewRoom;
