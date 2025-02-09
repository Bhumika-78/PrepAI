const express = require("express");
const http = require("http");
const cors = require("cors");
const questionsRoute = require("./routes/questions.route.js");
const authRoute = require("./routes/auth.route.js");
const quizRoute = require("./routes/quiz.route.js");
const connectToMongo = require("./connectDb");
const { initializeSocket } = require("./socket/socket.js");
const { ENV_VARS } = require("./config/envVar.js");
const feedbackRoutes = require("./controllers/feedbackController");
const PORT = ENV_VARS.PORT || 3000; // Default port to 3000 if ENV_VAR is not set

import evaluationRoutes from "./routes/evaluationRoutes.js";


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/analyze-sentiment", async (req, res) => {
  try {
    const { text } = req.body;

    const prompt = `Analyze this interview response: "${text}". Provide feedback on confidence, clarity, and professionalism.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
    });

    res.json({ feedback: response.choices[0].message.content });
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    res.status(500).json({ error: "Error analyzing sentiment." });
  }
});


// Use feedback routes
app.use("/api", feedbackRoutes);

app.use("/api/evaluation", evaluationRoutes);

app.post("/api/evaluation", (req, res) => {
  res.json({ feedback: "Your answer evaluation goes here!" });
});

const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

const transcribeAudio = async (audioBuffer) => {
  const request = {
    config: { encoding: "LINEAR16", languageCode: "en-US" },
    audio: { content: audioBuffer.toString("base64") },
  };
  const [response] = await client.recognize(request);
  return response.results.map(res => res.alternatives[0].transcript).join(" ");
};




const app = express();
const server = http.createServer(app); // Create HTTP server
const socketIO = require("socket.io"); // Import socket.io

// Initialize socket.io on the same server
const io = socketIO(server, {
  cors: {

    credentials: true,
  },
  transports: ["websocket"], // Only use WebSockets
});

connectToMongo();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({

    credentials: true,
  })
);

app.use("/api/v1/questions", questionsRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/quiz", quizRoute);
app.use("/uploads", express.static("uploads"));

initializeSocket(io);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("hello from simple server :)");
});
