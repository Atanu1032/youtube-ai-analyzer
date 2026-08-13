const { YoutubeTranscript } = require("youtube-transcript");

async function test() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  try {
    console.log("Testing transcript...");
    
    const transcript = await YoutubeTranscript.fetchTranscript(url);

    console.log("SUCCESS!");
    console.log("Transcript items:", transcript.length);
    console.log(transcript.slice(0, 3));
  } catch (error) {
    console.error("FAILED!");
    console.error(error);
  }
}

test();