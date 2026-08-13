const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    youtubeUrl: {
      type: String,
      required: true,
    },

    videoId: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    summary: {
      type: String,
      required: true,
    },

    mainTopics: {
      type: [String],
      default: [],
    },

    importantPoints: {
      type: [String],
      default: [],
    },

    keyTakeaways: {
      type: [String],
      default: [],
    },

    conclusion: {
      type: String,
      default: "",
    },

    transcript: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Analysis", analysisSchema);