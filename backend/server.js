const express = require("express");
console.log("This is my current server.js");
const cors = require("cors");
const mongoose = require("mongoose");
const Analysis = require("./models/Analysis");
const getTranscript = require("./transcript");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

function getYouTubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.slice(1);
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      return parsedUrl.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "YouTube AI Analyzer Backend is running!",
  });
});

app.get("/hello", (req, res) => {
  res.send("HELLO ROUTE WORKS");
});

// Gemini test route
app.get("/api/test-gemini", async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Say hello and tell me you are working.",
    });

    res.json({
      response: response.text,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// Analyze route
app.post("/api/analyze", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      message: "YouTube URL is required",
    });
  }

  try {
    console.log("Fetching transcript for:", url);

    const transcript = await getTranscript(url);

console.log("Transcript fetched successfully!");

console.log("Romanizing transcript...");

const romanizationResponse = await ai.models.generateContent({
  model: "gemini-flash-latest",
  contents: `
Convert the following Hindi transcript from Devanagari script into Romanized Hindi using English/Latin letters.

IMPORTANT RULES:
- Do NOT translate the Hindi into English.
- Keep the original Hindi language and meaning.
- Only change the writing system from Devanagari to Roman/Latin script.
- Do not summarize.
- Do not add explanations.
- Preserve the original order and meaning.
- Keep English words that already appear in the transcript as English words.
- Return ONLY the Romanized transcript.

Example:

Hindi:
मैं आज आपको इस वीडियो के बारे में बताऊंगा।

Romanized:
Main aaj aapko is video ke baare mein bataunga.

Transcript:
${transcript}
`,
});

const englishTranscript = romanizationResponse.text;

console.log("Romanized transcript generated successfully!");

const prompt = `
You are an expert YouTube video analyzer.

Analyze the following YouTube video transcript.

Return ONLY valid JSON.
Do not use markdown.
Do not add any text before or after the JSON.

Use exactly this structure:

{
  "title": "A short descriptive title for the video",
  "summary": "A concise summary of the video",
  "mainTopics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "importantPoints": [
    "Important point 1",
    "Important point 2",
    "Important point 3"
  ],
  "keyTakeaways": [
    "Key takeaway 1",
    "Key takeaway 2",
    "Key takeaway 3"
  ],
  "conclusion": "A short conclusion about the video"
}

Keep the information accurate to the transcript.

Transcript:
${englishTranscript}
`;

console.log("Sending transcript to Gemini...");

const aiResponse = await ai.models.generateContent({
  model: "gemini-flash-latest",
  contents: prompt,
});

const analysis = JSON.parse(aiResponse.text);

console.log("Gemini analysis generated successfully!");

const videoId = getYouTubeVideoId(url);

const savedAnalysis = await Analysis.create({
  youtubeUrl: url,
  videoId: videoId,
  title: analysis.title,
  summary: analysis.summary,
  mainTopics: analysis.mainTopics,
  importantPoints: analysis.importantPoints,
  keyTakeaways: analysis.keyTakeaways,
  conclusion: analysis.conclusion,
  transcript: englishTranscript,
});

console.log("Analysis saved to MongoDB!");

res.json({
  message: "Video analyzed successfully!",
  transcript: englishTranscript,
  analysis: analysis,
  savedId: savedAnalysis._id,
});
  } catch (error) {
    console.error("ANALYZE ERROR:", error.message);

    res.status(500).json({
      message: error.message || "Something went wrong while analyzing the video.",
    });
  }
});

// Get analysis history
app.get("/api/analyses", async (req, res) => {
  try {
    const analyses = await Analysis.find()
      .sort({ createdAt: -1 });

    res.json(analyses);
  } catch (error) {
  console.error("ANALYZE ERROR:", error);

  let message = "Something went wrong while analyzing the video.";

  if (error.message?.includes("503") || error.message?.includes("high demand")) {
    message =
      "Gemini AI is temporarily unavailable because of high demand. Please try again in a few seconds.";
  } else if (
    error.message?.toLowerCase().includes("transcript")
  ) {
    message =
      "Could not fetch the YouTube transcript. Please check the video and try again.";
  } else if (
    error.message?.toLowerCase().includes("json")
  ) {
    message =
      "Gemini returned an invalid analysis. Please try the video again.";
  }

  res.status(500).json({
    message,
  });
}
});

// Delete an analysis
app.delete("/api/analyses/:id", async (req, res) => {
  try {
    const deletedAnalysis = await Analysis.findByIdAndDelete(req.params.id);

    if (!deletedAnalysis) {
      return res.status(404).json({
        message: "Analysis not found.",
      });
    }

    res.json({
      message: "Analysis deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting analysis:", error);

    res.status(500).json({
      message: "Could not delete analysis.",
    });
  }
});

const PORT = 5000;
app.get("/hello", (req, res) => {
  res.send("HELLO ROUTE WORKS");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});