const { YoutubeTranscript } = require("youtube-transcript");

async function getTranscript(videoUrl) {
  try {
    console.log("Attempting to fetch YouTube transcript...");

    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);

    const text = transcript
      .map((item) => item.text)
      .join(" ");

    return text;
  } catch (error) {
    console.error("Transcript error:", error.message);
    throw new Error("Could not fetch YouTube transcript");
  }
}

module.exports = getTranscript;