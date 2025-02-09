const express = require("express");
const { analyzeFace } = require("../controllers/faceAnalysis");
const { analyzeText } = require("../controllers/sentimentAnalysis");

const router = express.Router();

router.post("/analyzeFace", async (req, res) => {
  try {
    const result = await analyzeFace(req.body.videoData);
    res.json({ facialFeedback: result });
  } catch (error) {
    res.status(500).json({ error: "Face analysis failed" });
  }
});

router.post("/analyzeText", async (req, res) => {
  try {
    const result = await analyzeText(req.body.text);
    res.json({ textFeedback: result });
  } catch (error) {
    res.status(500).json({ error: "Text analysis failed" });
  }
});

module.exports = router;
