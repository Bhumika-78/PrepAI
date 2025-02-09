import OpenAI from "openai";

// Use import.meta.env for environment variables in Vite
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Allow usage in the browser
});

// Analyze sentiment and tone of a response
export const analyzeSentiment = async (text) => {
  try {
    const prompt = `Analyze this interview response: "${text}". Provide feedback on confidence, clarity, and professionalism.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return "Error analyzing sentiment.";
  }
};