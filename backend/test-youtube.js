const { Innertube } = require("youtubei.js");

async function test() {
  try {
    console.log("Connecting to YouTube...");

    const youtube = await Innertube.create();

    const videoId = "YXuXrx0yWKw";

    console.log("Getting streaming data...");

    const format = await youtube.getStreamingData(videoId, {
      type: "audio",
      quality: "best",
      format: "mp4",
    });

    console.log("\nSUCCESS!");
    console.log("itag:", format.itag);
    console.log("mime:", format.mime_type);
    console.log("bitrate:", format.bitrate);

    if (format.url) {
      console.log("Audio stream URL successfully deciphered!");
      console.log("URL available:", true);
    } else {
      console.log("URL available:", false);
    }
  } catch (error) {
    console.error("\nFAILED!");
    console.error(error);
  }
}

test();