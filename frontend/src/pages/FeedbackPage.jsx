import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const FeedbackPage = () => {
  const location = useLocation();
  const { faceEngagement, responses, feedback, error } = location.state || {};
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (faceEngagement && feedback) {
      setLoading(false);
    } else if (error) {
      setLoading(false);
    }
  }, [faceEngagement, feedback, error]);

  if (loading) {
    return <div>Loading feedback...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="feedback-container">
      <h1>Interview Feedback</h1>

      <section>
        <h2>Engagement Analysis</h2>
        <p>{faceEngagement}</p>
      </section>

      <section>
        <h2>Response Analysis</h2>
        {responses.map((response, index) => (
          <div key={index} className="response-item">
            <h3>Response {index + 1}</h3>
            <p>{response}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Overall Feedback</h2>
        <p>{feedback}</p>
      </section>
    </div>
  );
};

export default FeedbackPage;