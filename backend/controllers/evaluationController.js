import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Evaluate a single response
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