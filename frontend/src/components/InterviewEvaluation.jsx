import React, { useState } from "react";
import axios from "axios";

const InterviewEvaluation = () => {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleEvaluate = async () => {
    const response = await axios.post("http://localhost:5000/api/evaluation", { userAnswer: answer });
    setFeedback(response.data.feedback);
  };

  return (
    <div>
      <h3>AI Interview Evaluator</h3>
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer..."></textarea>
      <button onClick={handleEvaluate}>Evaluate</button>
      <p>Feedback: {feedback}</p>
    </div>
  );
};

export default InterviewEvaluation;
