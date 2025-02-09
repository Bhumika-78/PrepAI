import OpenAI from "openai";

// Use import.meta.env for environment variables in Vite
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Allow usage in the browser
});

export const evaluateResponse = async (userAnswer) => {
  try {
    const prompt = `Evaluate the following interview answer:
    "${userAnswer}"
    Rate it out of 100 based on clarity, accuracy, and confidence.
    Provide improvement tips.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error evaluating response:", error);
    return "Error evaluating response.";
  }
};