import { analyzeFace } from "./faceAnalysis";
import { evaluateResponse } from "./evaluationController";
import { analyzeSentiment } from "./sentimentAnalysis";

// Generate final feedback after the interview
export const generateFeedback = async (videoElement, responses) => {
  try {
    // Step 1: Analyze face engagement
    const faceEngagement = await analyzeFace(videoElement);

    // Step 2: Evaluate each response
    const responseFeedbacks = await Promise.all(
      responses.map(async (response) => {
        const evaluation = await evaluateResponse(response);
        const sentiment = await analyzeSentiment(response);
        return { response, evaluation, sentiment };
      })
    );

    // Step 3: Summarize feedback
    const summaryPrompt = `Summarize the following interview performance:
    - Face Engagement: ${faceEngagement}
    - Response Evaluations: ${responseFeedbacks
      .map((fb) => fb.evaluation)
      .join("\n")}
    - Sentiment Analysis: ${responseFeedbacks
      .map((fb) => fb.sentiment)
      .join("\n")}
    Provide overall feedback and areas for improvement.`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: summaryPrompt }],
    });

    return summaryResponse.choices[0].message.content;
  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Error generating feedback.";
  }
};