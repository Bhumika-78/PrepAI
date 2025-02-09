export const analyzeSentiment = async (text) => {
  try {
    const response = await fetch("http://localhost:5000/analyze-sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();
    return data.feedback;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return "Error analyzing sentiment.";
  }
};