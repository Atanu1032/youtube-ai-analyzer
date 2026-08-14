async function getTranscript(videoUrl) {
  try {
    console.log("Attempting to fetch YouTube transcript...");

    const videoId = getYouTubeVideoId(videoUrl);

    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    const response = await fetch(
      `https://youtube-transcript.ai/transcript/${videoId}.txt`
    );

    if (!response.ok) {
      throw new Error(
        `Transcript API returned ${response.status}`
      );
    }

    const transcript = await response.text();

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Empty transcript received");
    }

    console.log("Transcript fetched successfully!");

    return transcript;
  } catch (error) {
    console.error("Transcript error:", error.message);
    throw new Error("Could not fetch YouTube transcript");
  }
}

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

module.exports = getTranscript;